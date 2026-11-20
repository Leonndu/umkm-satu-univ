'use client'
import {useEffect,useMemo,useState} from 'react'
import {Eye,Plus,Printer,Receipt,Search,ShoppingCart,Trash2,TrendingUp,Package} from 'lucide-react'
import {useDB} from '@/lib/store'
import {Badge,Button,Card,Confirm,Empty,Field,Input,Modal,Notice,Num,PageHeader,Row,Select,StatCard,Table,Td,Textarea,THead,Toolbar,useToast} from '@/components/ui'
import {fmtDate,iso,num,padId,rp,saleCalc,sum,uid} from '@/lib/utils'
import {addSale,removeSale} from '@/lib/actions'
import {Sale} from '@/lib/types'

export default function Penjualan(){
  const {db,set}=useDB();const toast=useToast()
  const [q,setQ]=useState(''),[st,setSt]=useState(''),[form,setForm]=useState(false),[detail,setDetail]=useState<string|null>(null),[del,setDel]=useState<string|null>(null)
  useEffect(()=>{if(new URLSearchParams(location.search).get('baru'))setForm(true)},[])
  const rows=useMemo(()=>[...db.sales].sort((a,b)=>b.tgl.localeCompare(a.tgl)||b.id.localeCompare(a.id)).filter(s=>(s.id+s.customer+s.items.map(i=>i.nama).join(' ')).toLowerCase().includes(q.toLowerCase())&&(!st||s.status===st)),[db.sales,q,st])
  const all=db.sales.map(saleCalc)
  return <div>
    <PageHeader title="Penjualan" desc="Catat penjualan produk dan pantau pendapatan usaha." actions={<Button onClick={()=>setForm(true)}><Plus size={16}/>Catat Penjualan</Button>}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={ShoppingCart} label="Total penjualan" value={rp(sum(all.map(a=>a.rev)))} sub="semua transaksi"/><StatCard icon={Package} label="Produk terjual" value={`${num(sum(all.map(a=>a.qty)),0)} unit`}/><StatCard icon={TrendingUp} label="Laba kotor" value={rp(sum(all.map(a=>a.profit)))} sub="penjualan − HPP" hint="Laba kotor = penjualan dikurangi HPP produk yang terjual."/><StatCard icon={Receipt} label="Jumlah transaksi" value={db.sales.length}/></div>
    <Card className="mt-4"><Toolbar><div className="relative min-w-[200px] flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><Input className="pl-9" placeholder="Cari transaksi, pelanggan, produk…" value={q} onChange={(e:any)=>setQ(e.target.value)}/></div>
      <Select className="w-full sm:w-44" value={st} onChange={(e:any)=>setSt(e.target.value)}><option value="">Semua pembayaran</option><option>Lunas</option><option>Belum Lunas</option></Select></Toolbar>
      {rows.length?<Table><THead><th className="px-4 py-2.5">ID</th><th className="px-4 py-2.5">Tanggal</th><th className="px-4 py-2.5">Pelanggan</th><th className="px-4 py-2.5">Produk</th><th className="px-4 py-2.5 text-right">Total</th><th className="px-4 py-2.5 text-right" title="Harga pokok penjualan = HPP produk yang terjual">HPP</th><th className="px-4 py-2.5 text-right">Laba Kotor</th><th className="px-4 py-2.5">Pembayaran</th><th className="px-4 py-2.5 text-right">Aksi</th></THead>
        <tbody>{rows.map(s=>{const c=saleCalc(s);return <tr key={s.id}><Td className="font-medium">{s.id}</Td><Td className="whitespace-nowrap text-slate-500">{fmtDate(s.tgl)}</Td><Td>{s.customer||<span className="text-slate-400">Umum</span>}</Td><Td className="max-w-[220px] truncate text-slate-500">{s.items.map(i=>`${i.nama.replace('Keripik Singkong ','')} ×${i.qty}`).join(', ')}</Td><Td right>{rp(c.rev)}</Td><Td right className="text-slate-500">{rp(c.hpp)}</Td><Td right className="font-medium text-emerald-700">{rp(c.profit)}</Td><Td><Badge tone={s.status==='Lunas'?'green':'amber'}>{s.status}</Badge></Td>
          <Td right><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Detail & invoice" onClick={()=>setDetail(s.id)}><Eye size={15}/></Button><Button variant="ghost" size="icon" title="Hapus" onClick={()=>setDel(s.id)}><Trash2 size={15} className="text-red-500"/></Button></div></Td></tr>})}</tbody></Table>
        :<Empty title="Belum ada transaksi" desc="Catat penjualan pertama Anda." action={<Button onClick={()=>setForm(true)}>Catat Penjualan</Button>}/>}</Card>
    <SaleForm open={form} onClose={()=>setForm(false)} onDone={(id:string)=>setDetail(id)}/>
    <Invoice id={detail} onClose={()=>setDetail(null)}/>
    <Confirm open={!!del} onClose={()=>setDel(null)} onOk={()=>{set(d=>removeSale(d,del!));toast('Transaksi dihapus, stok dikembalikan')}} title="Hapus transaksi?" desc="Stok produk jadi akan dikembalikan dan transaksi hilang dari laporan."/>
  </div>
}

function SaleForm({open,onClose,onDone}:{open:boolean;onClose:()=>void;onDone:(id:string)=>void}){
  const {db,set}=useDB();const toast=useToast()
  const blank=()=>({tgl:iso(),customer:'',items:[{k:uid(),productId:'',qty:1,harga:0}],diskon:0,metode:'Tunai',status:'Lunas',catatan:''})
  const [f,setF]=useState<any>(blank()),[err,setErr]=useState('')
  useEffect(()=>{if(open){setF(blank());setErr('')}},[open])
  if(!open)return null
  const upI=(k:string,p:any)=>setF({...f,items:f.items.map((i:any)=>i.k===k?{...i,...p}:i)})
  const lines=f.items.filter((i:any)=>i.productId).map((i:any)=>{const p=db.products.find(x=>x.id===i.productId)!;return {...i,nama:p.nama,hpp:p.hpp,stok:p.stok}})
  const sub=sum(lines.map((l:any)=>l.qty*l.harga)),rev=Math.max(0,sub-f.diskon),hpp=sum(lines.map((l:any)=>l.qty*l.hpp))
  const save=()=>{if(!lines.length)return setErr('Pilih minimal satu produk');if(lines.some((l:any)=>l.qty<=0||l.harga<=0))return setErr('Jumlah dan harga harus lebih dari 0');if(f.diskon>sub)return setErr('Diskon melebihi total')
    const id=padId('TRX',Math.max(0,...db.sales.map(s=>+s.id.slice(4)))+1)
    const s:Sale={id,tgl:f.tgl,customer:f.customer.trim(),items:lines.map((l:any)=>({productId:l.productId,nama:l.nama,qty:l.qty,harga:l.harga,hpp:l.hpp})),diskon:f.diskon,metode:f.metode,status:f.status,catatan:f.catatan}
    const r=addSale(db,s);if(r.error){setErr(r.error);toast(r.error,'err');return}set(()=>r.db);toast(`${id} tersimpan`);onClose();onDone(id)}
  return <Modal open onClose={onClose} size="lg" title="Catat Penjualan" desc="HPP dan laba kotor dihitung otomatis dari HPP produk." footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={save}>Simpan Penjualan</Button></>}>
    {err&&<div className="mb-3"><Notice tone="red">{err}</Notice></div>}
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Tanggal transaksi"><Input type="date" value={f.tgl} onChange={(e:any)=>setF({...f,tgl:e.target.value})}/></Field><Field label="Nama pelanggan (opsional)"><Input value={f.customer} onChange={(e:any)=>setF({...f,customer:e.target.value})} placeholder="mis. Warung Bu Siti"/></Field></div>
    <p className="mb-2 mt-5 text-sm font-medium">Produk</p>
    <div className="space-y-2">{f.items.map((i:any)=>{const p=db.products.find(x=>x.id===i.productId);return <div key={i.k} className="grid grid-cols-12 items-end gap-2 rounded-xl border border-slate-200 p-3">
      <Field label="Produk" className="col-span-12 sm:col-span-5" hint={p?`Stok tersedia: ${num(p.stok,0)} ${p.unit}`:undefined}><Select value={i.productId} onChange={(e:any)=>{const pp=db.products.find(x=>x.id===e.target.value);upI(i.k,{productId:e.target.value,harga:pp?.harga||0})}}><option value="">— pilih produk —</option>{db.products.map(x=><option key={x.id} value={x.id} disabled={x.stok<=0}>{x.nama}{x.stok<=0?' (habis)':''}</option>)}</Select></Field>
      <Field label="Jumlah" className="col-span-4 sm:col-span-2"><Num value={i.qty} onChange={(v:number)=>upI(i.k,{qty:v})}/></Field><Field label="Harga satuan" className="col-span-8 sm:col-span-3"><Num value={i.harga} onChange={(v:number)=>upI(i.k,{harga:v})}/></Field>
      <div className="col-span-9 text-sm sm:col-span-1"><p className="text-xs text-slate-500">Subtotal</p><p className="h-10 font-medium leading-10">{rp(i.qty*i.harga)}</p></div>
      <Button variant="ghost" size="icon" className="col-span-3 mb-1 sm:col-span-1" aria-label="Hapus baris" onClick={()=>f.items.length>1&&setF({...f,items:f.items.filter((x:any)=>x.k!==i.k)})}><Trash2 size={15} className="text-red-500"/></Button></div>})}</div>
    <Button variant="soft" className="mt-2" onClick={()=>setF({...f,items:[...f.items,{k:uid(),productId:'',qty:1,harga:0}]})}><Plus size={15}/>Tambah Produk</Button>
    <div className="mt-5 grid gap-4 sm:grid-cols-3"><Field label="Diskon (Rp, opsional)"><Num value={f.diskon} onChange={(v:number)=>setF({...f,diskon:v})}/></Field><Field label="Metode pembayaran"><Select value={f.metode} onChange={(e:any)=>setF({...f,metode:e.target.value})}>{['Tunai','Transfer','QRIS','E-Wallet'].map(m=><option key={m}>{m}</option>)}</Select></Field><Field label="Status pembayaran"><Select value={f.status} onChange={(e:any)=>setF({...f,status:e.target.value})}><option>Lunas</option><option>Belum Lunas</option></Select></Field></div>
    <Field label="Catatan" className="mt-4"><Textarea value={f.catatan} onChange={(e:any)=>setF({...f,catatan:e.target.value})}/></Field>
    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-2"><Row k="Total pendapatan" v={<b>{rp(rev)}</b>}/><Row k="HPP produk terjual" v={rp(hpp)}/><Row bold k="Laba kotor" v={<span className="text-emerald-700">{rp(rev-hpp)}</span>}/></div>
  </Modal>
}

function Invoice({id,onClose}:{id:string|null;onClose:()=>void}){
  const {db}=useDB();const s=db.sales.find(x=>x.id===id)
  if(!s)return null
  const c=saleCalc(s),b=db.settings
  return <Modal open onClose={onClose} size="md" title={`Invoice ${s.id}`} footer={<><Button variant="outline" onClick={onClose}>Tutup</Button><Button onClick={()=>window.print()}><Printer size={15}/>Cetak</Button></>}>
    <div className="flex items-start justify-between"><div><p className="text-lg font-semibold">{b.nama}</p><p className="text-xs text-slate-500">{b.alamat}<br/>{b.telp}</p></div><div className="text-right text-sm"><p className="font-medium">{s.id}</p><p className="text-slate-500">{fmtDate(s.tgl)}</p><Badge tone={s.status==='Lunas'?'green':'amber'}>{s.status}</Badge></div></div>
    <p className="mt-4 text-sm"><span className="text-slate-500">Kepada: </span>{s.customer||'Pelanggan umum'}</p>
    <div className="mt-3 rounded-xl border border-slate-200"><Table><THead><th className="px-3 py-2">Produk</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Harga</th><th className="px-3 py-2 text-right">Jumlah</th></THead><tbody>{s.items.map((i,k)=><tr key={k}><Td>{i.nama}</Td><Td right>{i.qty}</Td><Td right>{rp(i.harga)}</Td><Td right>{rp(i.qty*i.harga)}</Td></tr>)}</tbody></Table></div>
    <div className="mt-3 px-1"><Row k="Subtotal" v={rp(c.sub)}/>{s.diskon>0&&<Row k="Diskon" v={`−${rp(s.diskon)}`}/>}<Row bold k="Total" v={rp(c.rev)}/><Row k="Pembayaran" v={s.metode}/></div>
    {s.catatan&&<p className="mt-2 text-xs text-slate-500">Catatan: {s.catatan}</p>}
    <div className="no-print mt-4 rounded-lg bg-slate-50 px-4 py-2"><p className="py-1 text-xs font-medium text-slate-500">Hanya untuk Anda (tidak tercetak)</p><Row k="HPP produk terjual (saat transaksi)" v={rp(c.hpp)}/><Row k="Laba kotor" v={<span className="text-emerald-700">{rp(c.profit)}</span>}/></div>
    <p className="mt-4 text-center text-xs text-slate-400">Terima kasih telah berbelanja di {b.nama}</p>
  </Modal>
}
