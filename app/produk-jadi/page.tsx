'use client'
import {useEffect,useMemo,useState} from 'react'
import {AlertTriangle,Eye,PackageCheck,Pencil,Search,SlidersHorizontal,Wallet,Boxes} from 'lucide-react'
import {useDB} from '@/lib/store'
import {Button,Card,Empty,Field,Input,Modal,Notice,Num,PageHeader,ProductTile,Row,Select,StatCard,Table,Td,THead,Toolbar,stockBadge,useSort,useToast} from '@/components/ui'
import {emoji,fmtDate,num,rp,stockStatus,sum} from '@/lib/utils'
import {adjustProduct} from '@/lib/actions'

export default function ProdukJadi(){
  const {db,set}=useDB();const toast=useToast()
  const [q,setQ]=useState(''),[cat,setCat]=useState(''),[st,setSt]=useState(''),[detail,setDetail]=useState<string|null>(null),[adj,setAdj]=useState<string|null>(null),[edit,setEdit]=useState<string|null>(null)
  const rows=useMemo(()=>db.products.map(p=>({...p,status:stockStatus(p.stok,p.min)})).filter(p=>(p.nama+p.sku).toLowerCase().includes(q.toLowerCase())&&(!cat||p.kategori===cat)&&(!st||p.status===st)),[db.products,q,cat,st])
  const {sorted,th}=useSort(rows,'nama')
  const low=db.products.filter(p=>stockStatus(p.stok,p.min)!=='aman').length
  return <div>
    <PageHeader title="Produk Jadi" desc="Stok produk yang siap dijual. Bertambah saat produksi selesai, berkurang saat ada penjualan."/>
    <div className="mb-4"><Notice tone="blue">Halaman ini untuk <b>produk jadi</b>. Stok bahan mentah ada di menu Bahan Baku. Produk baru dibuat lewat menu Resep & HPP.</Notice></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={PackageCheck} label="Total produk jadi" value={db.products.length} sub="jenis produk"/><StatCard icon={Boxes} label="Total unit tersedia" value={num(sum(db.products.map(p=>p.stok)),0)} sub="siap dijual"/><StatCard icon={AlertTriangle} tone={low?'amber':'green'} label="Produk hampir habis" value={low} sub={low?'perlu diproduksi':'stok aman'}/><StatCard icon={Wallet} label="Nilai persediaan" value={rp(sum(db.products.map(p=>p.stok*p.hpp)))} sub="stok × HPP"/></div>
    <Card className="mt-4"><Toolbar><div className="relative min-w-[200px] flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><Input className="pl-9" placeholder="Cari produk atau SKU…" value={q} onChange={(e:any)=>setQ(e.target.value)}/></div>
      <Select className="w-full sm:w-40" value={cat} onChange={(e:any)=>setCat(e.target.value)}><option value="">Semua kategori</option>{Array.from(new Set(db.products.map(p=>p.kategori))).map(c=><option key={c}>{c}</option>)}</Select>
      <Select className="w-full sm:w-40" value={st} onChange={(e:any)=>setSt(e.target.value)}><option value="">Semua status</option><option value="aman">Aman</option><option value="menipis">Menipis</option><option value="habis">Habis</option></Select></Toolbar>
      {sorted.length?<Table><THead>{th('nama','Produk')}<th className="px-4 py-2.5">SKU</th>{th('stok','Stok',true)}<th className="px-4 py-2.5">Satuan</th>{th('hpp','HPP',true)}{th('harga','Harga Jual',true)}{th('status','Status')}<th className="px-4 py-2.5 text-right">Aksi</th></THead>
        <tbody>{sorted.map(p=><tr key={p.id}><Td><div className="flex items-center gap-3"><ProductTile emo={emoji(p.nama)} size={36}/><button className="font-medium hover:text-emerald-700 hover:underline" onClick={()=>setDetail(p.id)}>{p.nama}</button></div></Td><Td className="text-slate-500">{p.sku}</Td><Td right>{num(p.stok,0)}</Td><Td>{p.unit}</Td><Td right>{rp(p.hpp)}</Td><Td right>{rp(p.harga)}</Td><Td>{stockBadge(p.status)}</Td>
          <Td right><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Detail" onClick={()=>setDetail(p.id)}><Eye size={15}/></Button><Button variant="ghost" size="icon" title="Sesuaikan stok" onClick={()=>setAdj(p.id)}><SlidersHorizontal size={15}/></Button><Button variant="ghost" size="icon" title="Edit" onClick={()=>setEdit(p.id)}><Pencil size={15}/></Button></div></Td></tr>)}</tbody></Table>
        :<Empty title="Produk tidak ditemukan" desc="Ubah pencarian atau filter."/>}</Card>
    <Detail id={detail} onClose={()=>setDetail(null)}/>
    <Adjust id={adj} onClose={()=>setAdj(null)}/><EditP id={edit} onClose={()=>setEdit(null)}/>
  </div>
}
function Detail({id,onClose}:{id:string|null;onClose:()=>void}){
  const {db}=useDB();const p=db.products.find(x=>x.id===id)
  if(!p)return null
  return <Modal drawer open onClose={onClose} title={p.nama} desc={`${p.sku} · ${p.kategori}`}>
    <div className="mb-4 flex justify-center"><ProductTile emo={emoji(p.nama)} size={88}/></div>
    <div className="rounded-xl border border-slate-200 px-4 py-2"><Row k="Stok saat ini" v={<b>{num(p.stok,0)} {p.unit}</b>}/><Row k="Status" v={stockBadge(stockStatus(p.stok,p.min))}/><Row k="Stok minimum" v={`${num(p.min,0)} ${p.unit}`}/><Row k="HPP rata-rata" v={rp(p.hpp)}/><Row k="Harga jual" v={rp(p.harga)}/><Row k="Laba per unit" v={<span className="text-emerald-700">{rp(p.harga-p.hpp)}</span>}/><Row k="Nilai persediaan" v={rp(p.stok*p.hpp)}/></div>
    <h3 className="mb-2 mt-5 text-sm font-semibold">Riwayat perubahan stok</h3>
    <div className="rounded-xl border border-slate-200"><Table><THead><th className="px-3 py-2">Tanggal</th><th className="px-3 py-2">Aktivitas</th><th className="px-3 py-2 text-right">Masuk</th><th className="px-3 py-2 text-right">Keluar</th><th className="px-3 py-2 text-right">Sisa</th></THead><tbody>{[...p.moves].reverse().map((x,i)=><tr key={i}><Td className="whitespace-nowrap text-slate-500">{fmtDate(x.tgl)}</Td><Td>{x.aktivitas}</Td><Td right className="text-emerald-600">{x.masuk?'+'+num(x.masuk,0):'–'}</Td><Td right className="text-red-500">{x.keluar?'−'+num(x.keluar,0):'–'}</Td><Td right>{num(x.sisa,0)}</Td></tr>)}</tbody></Table></div>
  </Modal>
}
function Adjust({id,onClose}:{id:string|null;onClose:()=>void}){
  const {db,set}=useDB();const toast=useToast();const p=db.products.find(x=>x.id===id)
  const [dir,setDir]=useState('-'),[qty,setQty]=useState(0),[why,setWhy]=useState('Rusak / kedaluwarsa'),[err,setErr]=useState('')
  useEffect(()=>{setDir('-');setQty(0);setErr('');setWhy('Rusak / kedaluwarsa')},[id])
  if(!p)return null
  const save=()=>{if(qty<=0)return setErr('Jumlah harus lebih dari 0');if(dir==='-'&&qty>p.stok)return setErr(`Stok hanya ${num(p.stok,0)}`);set(d=>adjustProduct(d,p.id,dir==='-'?-qty:qty,`Penyesuaian — ${why}`));toast('Stok diperbarui');onClose()}
  return <Modal open onClose={onClose} size="sm" title="Sesuaikan Stok" desc={`${p.nama} — stok ${num(p.stok,0)} ${p.unit}`} footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={save}>Simpan</Button></>}>
    <div className="space-y-4"><Field label="Jenis"><Select value={dir} onChange={(e:any)=>setDir(e.target.value)}><option value="-">Kurangi stok</option><option value="+">Tambah stok</option></Select></Field><Field label={`Jumlah (${p.unit})`} error={err}><Num value={qty} onChange={setQty}/></Field>
      <Field label="Alasan"><Select value={why} onChange={(e:any)=>setWhy(e.target.value)}>{['Rusak / kedaluwarsa','Sampel / hadiah','Hasil stok opname','Koreksi pencatatan'].map(x=><option key={x}>{x}</option>)}</Select></Field></div></Modal>
}
function EditP({id,onClose}:{id:string|null;onClose:()=>void}){
  const {db,set}=useDB();const toast=useToast();const p=db.products.find(x=>x.id===id)
  const [harga,setHarga]=useState(0),[min,setMin]=useState(0),[sku,setSku]=useState('')
  useEffect(()=>{if(p){setHarga(p.harga);setMin(p.min);setSku(p.sku)}},[id])
  if(!p)return null
  return <Modal open onClose={onClose} size="sm" title="Edit Produk" desc={p.nama} footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={()=>{if(harga<=0||!sku.trim()){toast('Harga dan SKU wajib diisi','err');return}set(d=>({...d,products:d.products.map(x=>x.id===p.id?{...x,harga,min,sku}:x)}));toast('Produk diperbarui');onClose()}}>Simpan</Button></>}>
    <div className="space-y-4"><Field label="SKU"><Input value={sku} onChange={(e:any)=>setSku(e.target.value)}/></Field><Field label="Harga jual (Rp)" hint="Hanya berlaku untuk penjualan berikutnya."><Num value={harga} onChange={setHarga}/></Field><Field label={`Stok minimum (${p.unit})`}><Num value={min} onChange={setMin}/></Field></div></Modal>
}
