import {DB,Material,Move,Product,Production,Recipe,Sale,Usage} from './types'
import {calcRecipe,iso,sum} from './utils'

const mv=(aktivitas:string,masuk:number,keluar:number,sisa:number):Move=>({tgl:iso(),aktivitas,masuk,keluar,sisa:+sisa.toFixed(4)})

export function adjustMaterial(d:DB,id:string,jenis:'beli'|'tambah'|'kurang',qty:number,harga=0,cat=''):DB{
  return {...d,materials:d.materials.map(m=>{
    if(m.id!==id)return m
    const masuk=jenis==='kurang'?0:qty,keluar=jenis==='kurang'?qty:0,stok=Math.max(0,m.stok+masuk-keluar)
    let h=m.harga;const beli=[...m.beli]
    if(jenis==='beli'){h=Math.round((m.stok*m.harga+qty*harga)/((m.stok+qty)||1));beli.unshift({tgl:iso(),qty,harga})}
    const label=jenis==='beli'?'Pembelian bahan':jenis==='tambah'?'Penyesuaian stok (+)':'Penyesuaian stok (−)'
    return {...m,stok,harga:h,beli,moves:[...m.moves,mv(cat?`${label} — ${cat}`:label,masuk,keluar,stok)]}
  })}
}
export function adjustProduct(d:DB,id:string,delta:number,alasan:string):DB{
  return {...d,products:d.products.map(p=>{
    if(p.id!==id)return p
    const stok=Math.max(0,p.stok+delta)
    return {...p,stok,moves:[...p.moves,mv(alasan,delta>0?delta:0,delta<0?-delta:0,stok)]}
  })}
}

export function buildProduction(r:Recipe,mats:Material[],rencana:number,tgl:string,id:string):Production{
  const c=calcRecipe(r,mats),f=r.batch?rencana/r.batch:0
  const usage:Usage[]=c.lines.map(l=>({materialId:l.materialId,nama:l.nama,unit:l.satuan,rencana:+(l.base*f).toFixed(4),aktual:+(l.base*f).toFixed(4),harga:l.harga}))
  const biayaBahan=sum(usage.map(u=>u.rencana*u.harga)),biayaLain=(c.tenaga+c.overhead)*f
  return {id,recipeId:r.id,productId:r.productId,nama:r.nama,rencana,hasil:0,rusak:0,tgl,status:'Draft',usage,biayaBahan,biayaLain,biayaTambahan:0,biayaWaste:0,estBiaya:biayaBahan+biayaLain,totalBiaya:0,hppAktual:0,catatan:'',
    snapshot:{batch:r.batch,unit:r.unit,items:c.lines.map(l=>({nama:l.nama,qty:l.qty,unit:l.unit})),extras:r.extras},timeline:[{tgl,teks:'Produksi dibuat (Draft)'}]}
}

export function completeProduction(d:DB,p:Production,o:{hasil:number;rusak:number;waste:Record<string,number>;tambahan:number;catatan:string}):{db:DB;error?:string}{
  const usage=p.usage.map(u=>({...u,aktual:+(u.rencana+(o.waste[u.materialId]||0)).toFixed(4)}))
  for(const u of usage){const m=d.materials.find(x=>x.id===u.materialId);if(!m||m.stok+1e-9<u.aktual)return {db:d,error:`Stok ${u.nama} tidak cukup untuk menyelesaikan produksi ini.`}}
  const biayaWaste=sum(usage.map(u=>(u.aktual-u.rencana)*u.harga)),good=Math.max(0,o.hasil-o.rusak)
  const total=p.biayaBahan+biayaWaste+p.biayaLain+o.tambahan,hppAktual=good?total/good:0
  const done:Production={...p,usage,hasil:o.hasil,rusak:o.rusak,biayaWaste,biayaTambahan:o.tambahan,totalBiaya:total,hppAktual,catatan:o.catatan,status:'Selesai',
    timeline:[...p.timeline,{tgl:iso(),teks:`Produksi selesai: ${good} unit siap jual, ${o.rusak} rusak`}]}
  const materials=d.materials.map(m=>{const u=usage.find(x=>x.materialId===m.id);if(!u)return m;const stok=Math.max(0,m.stok-u.aktual);return {...m,stok,moves:[...m.moves,mv(`Dipakai produksi ${p.id}`,0,u.aktual,stok)]}})
  const products=d.products.map(x=>{if(x.id!==p.productId)return x;const stok=x.stok+good;const hpp=stok?Math.round((x.stok*x.hpp+good*hppAktual)/stok):x.hpp
    return {...x,stok,hpp,moves:[...x.moves,mv(`Hasil produksi ${p.id}`,good,0,stok)]}})
  const exists=d.productions.some(x=>x.id===p.id)
  return {db:{...d,materials,products,productions:exists?d.productions.map(x=>x.id===p.id?done:x):[done,...d.productions]}}
}

export function addSale(d:DB,s:Sale):{db:DB;error?:string}{
  for(const it of s.items){const need=sum(s.items.filter(x=>x.productId===it.productId).map(x=>x.qty));const p=d.products.find(x=>x.id===it.productId)
    if(!p||p.stok<need)return {db:d,error:`Stok ${it.nama} tidak cukup (tersedia ${p?.stok??0}).`}}
  const products=d.products.map(p=>{const q=sum(s.items.filter(i=>i.productId===p.id).map(i=>i.qty));if(!q)return p;const stok=p.stok-q;return {...p,stok,moves:[...p.moves,mv(`Penjualan ${s.id}`,0,q,stok)]}})
  return {db:{...d,products,sales:[s,...d.sales]}}
}
export function removeSale(d:DB,id:string):DB{
  const s=d.sales.find(x=>x.id===id);if(!s)return d
  const products=d.products.map(p=>{const q=sum(s.items.filter(i=>i.productId===p.id).map(i=>i.qty));if(!q)return p;const stok=p.stok+q;return {...p,stok,moves:[...p.moves,mv(`Pembatalan ${s.id}`,q,0,stok)]}})
  return {...d,products,sales:d.sales.filter(x=>x.id!==id)}
}
