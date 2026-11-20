import {Material,Recipe,Sale,Unit} from './types'
export const rp=(n:number)=>(n<0?'-':'')+'Rp'+Math.round(Math.abs(n||0)).toLocaleString('id-ID')
export const num=(n:number,d=2)=>(+n||0).toLocaleString('id-ID',{maximumFractionDigits:d})
export const uid=(p='x')=>p+Math.random().toString(36).slice(2,8)
const pad=(n:number,l=2)=>String(n).padStart(l,'0')
export const padId=(p:string,n:number)=>`${p}-${pad(n,3)}`
export const iso=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
export const daysAgo=(n:number)=>{const d=new Date();d.setDate(d.getDate()-n);return iso(d)}
export const fmtDate=(s:string)=>new Date(s+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})
export const shortDate=(s:string)=>new Date(s+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short'})
export const longDate=(d=new Date())=>d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
export const greeting=()=>{const h=new Date().getHours();return h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam'}
export const sum=(a:number[])=>a.reduce((x,y)=>x+y,0)
export const short=(n:number)=>n>=1e6?(n/1e6).toFixed(1).replace('.',',')+' jt':n>=1e3?Math.round(n/1e3)+' rb':String(Math.round(n))
export const pct=(c:number,p:number)=>p?((c-p)/p)*100:0
export const emoji=(n:string)=>/brownies|kue|cake/i.test(n)?'🍫':/keripik|chips/i.test(n)?'🥔':'📦'

export const UNITS:Unit[]=['g','kg','ml','L','pcs','pack','botol']
const F:Record<string,[string,number]>={g:['m',1],kg:['m',1000],ml:['v',1],L:['v',1000],pcs:['c',1],pack:['p',1],botol:['b',1]}
export const convert=(q:number,from:string,to:string)=>{if(from===to)return q;const a=F[from],b=F[to];return a&&b&&a[0]===b[0]?q*a[1]/b[1]:q}
export const compatible=(u:string)=>UNITS.filter(x=>F[x][0]===F[u][0])
export const unitHint=(u:string)=>u==='kg'?'1 kg = 1.000 g':u==='g'?'1.000 g = 1 kg':u==='L'?'1 L = 1.000 ml':u==='ml'?'1.000 ml = 1 L':'Satuan ini tidak dikonversi'

export const stockStatus=(s:number,min:number)=>s<=0?'habis':s<=min?'menipis':'aman'

export function calcRecipe(r:Recipe,mats:Material[]){
  const lines=r.items.map(it=>{const m=mats.find(x=>x.id===it.materialId);const base=m?convert(it.qty,it.unit,m.satuan):0;const harga=m?.harga||0
    return {...it,nama:m?.nama||'(bahan dihapus)',satuan:m?.satuan||it.unit,base,harga,unitCost:m?harga*convert(1,it.unit,m.satuan):0,sub:base*harga}})
  const ex=r.extras.map(e=>({...e,total:e.mode==='tetap'?e.jumlah:e.jumlah*r.batch}))
  const bahan=sum(lines.map(l=>l.sub)),tenaga=sum(ex.filter(e=>e.tipe==='Tenaga Kerja').map(e=>e.total)),overhead=sum(ex.filter(e=>e.tipe!=='Tenaga Kerja').map(e=>e.total))
  const total=bahan+tenaga+overhead,hpp=r.batch?total/r.batch:0
  return {lines,ex,bahan,tenaga,overhead,total,hpp,untung:r.harga-hpp,margin:r.harga?((r.harga-hpp)/r.harga)*100:0}
}
export const suggestPrice=(hpp:number,m:number)=>m>=100?0:Math.ceil(hpp/(1-m/100)/500)*500
export const saleCalc=(s:Sale)=>{const sub=sum(s.items.map(i=>i.qty*i.harga)),rev=Math.max(0,sub-s.diskon),hpp=sum(s.items.map(i=>i.qty*i.hpp));return{sub,rev,hpp,profit:rev-hpp,qty:sum(s.items.map(i=>i.qty))}}
