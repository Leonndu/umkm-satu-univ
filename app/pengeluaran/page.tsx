'use client'
import {useEffect,useMemo,useState} from 'react'
import {Pencil,Plus,Search,Trash2,Wallet} from 'lucide-react'
import {useDB} from '@/lib/store'
import {Badge,Button,Card,Confirm,Empty,Field,Input,Modal,Notice,Num,PageHeader,Select,StatCard,Table,Td,Textarea,THead,Toolbar,useSort,useToast} from '@/components/ui'
import {fmtDate,iso,num,rp,sum,uid} from '@/lib/utils'
import {Expense} from '@/lib/types'

const KATEGORI=['Listrik','Air','Gas','Transportasi','Sewa','Gaji Karyawan','Pemasaran','Peralatan','Lainnya']
export default function Pengeluaran(){
  const {db,set}=useDB();const toast=useToast()
  const [q,setQ]=useState(''),[cat,setCat]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState(''),[form,setForm]=useState<{e?:Expense}|null>(null),[del,setDel]=useState<string|null>(null)
  const rows=useMemo(()=>db.expenses.filter(e=>e.nama.toLowerCase().includes(q.toLowerCase())&&(!cat||e.kategori===cat)&&(!from||e.tgl>=from)&&(!to||e.tgl<=to)),[db.expenses,q,cat,from,to])
  const {sorted,th}=useSort(rows,'tgl','desc')
  const ym=iso().slice(0,7),month=db.expenses.filter(e=>e.tgl.startsWith(ym))
  const byCat=KATEGORI.map(k=>({k,v:sum(month.filter(e=>e.kategori===k).map(e=>e.jumlah))})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v)
  const total=sum(month.map(e=>e.jumlah))
  return <div>
    <PageHeader title="Pengeluaran" desc="Catat biaya operasional usaha di luar biaya produksi." actions={<Button onClick={()=>setForm({})}><Plus size={16}/>Tambah Pengeluaran</Button>}/>
    <div className="mb-4"><Notice tone="blue"><b>Hindari hitung ganda.</b> Biaya bahan, upah produksi, dan gas/listrik produksi sudah masuk HPP lewat Resep. Di sini catat biaya <b>operasional</b> saja: sewa, tagihan bulanan, gaji tetap, pemasaran, peralatan.</Notice></div>
    <div className="grid gap-4 lg:grid-cols-3"><StatCard icon={Wallet} label="Pengeluaran bulan ini" value={rp(total)} sub={`${month.length} catatan`}/>
      <Card className="p-4 lg:col-span-2"><p className="mb-3 text-sm text-slate-500">Ringkasan bulan ini per kategori</p>{byCat.length?<ul className="space-y-2">{byCat.slice(0,5).map(c=><li key={c.k} className="flex items-center gap-3 text-sm"><span className="w-28 shrink-0 text-slate-600">{c.k}</span><div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:c.v/total*100+'%'}}/></div><span className="w-24 text-right tabular-nums">{rp(c.v)}</span></li>)}</ul>:<p className="text-sm text-slate-400">Belum ada pengeluaran bulan ini.</p>}</Card></div>
    <Card className="mt-4"><Toolbar><div className="relative min-w-[180px] flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><Input className="pl-9" placeholder="Cari pengeluaran…" value={q} onChange={(e:any)=>setQ(e.target.value)}/></div>
      <Select className="w-full sm:w-44" value={cat} onChange={(e:any)=>setCat(e.target.value)}><option value="">Semua kategori</option>{KATEGORI.map(k=><option key={k}>{k}</option>)}</Select>
      <Input type="date" className="w-full sm:w-40" value={from} onChange={(e:any)=>setFrom(e.target.value)} aria-label="Dari tanggal"/><Input type="date" className="w-full sm:w-40" value={to} onChange={(e:any)=>setTo(e.target.value)} aria-label="Sampai tanggal"/>
      {(from||to||cat||q)&&<Button variant="ghost" size="sm" onClick={()=>{setQ('');setCat('');setFrom('');setTo('')}}>Reset</Button>}</Toolbar>
      {sorted.length?<Table><THead>{th('tgl','Tanggal')}{th('nama','Nama Pengeluaran')}{th('kategori','Kategori')}{th('jumlah','Jumlah',true)}<th className="px-4 py-2.5">Pembayaran</th><th className="px-4 py-2.5">Catatan</th><th className="px-4 py-2.5 text-right">Aksi</th></THead>
        <tbody>{sorted.map(e=><tr key={e.id}><Td className="whitespace-nowrap text-slate-500">{fmtDate(e.tgl)}</Td><Td className="font-medium">{e.nama}</Td><Td><Badge>{e.kategori}</Badge></Td><Td right>{rp(e.jumlah)}</Td><Td>{e.metode}</Td><Td className="max-w-[200px] truncate text-slate-500">{e.catatan||'–'}</Td>
          <Td right><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Edit" onClick={()=>setForm({e})}><Pencil size={15}/></Button><Button variant="ghost" size="icon" title="Hapus" onClick={()=>setDel(e.id)}><Trash2 size={15} className="text-red-500"/></Button></div></Td></tr>)}</tbody></Table>
        :<Empty title="Tidak ada pengeluaran" desc="Ubah filter atau catat pengeluaran baru." action={<Button onClick={()=>setForm({})}>Tambah Pengeluaran</Button>}/>}
      {sorted.length>0&&<div className="flex justify-between border-t border-slate-100 px-4 py-3 text-sm"><span className="text-slate-500">Total ditampilkan</span><b>{rp(sum(sorted.map(e=>e.jumlah)))}</b></div>}</Card>
    <ExpForm state={form} onClose={()=>setForm(null)}/>
    <Confirm open={!!del} onClose={()=>setDel(null)} onOk={()=>{set(d=>({...d,expenses:d.expenses.filter(e=>e.id!==del)}));toast('Pengeluaran dihapus')}} title="Hapus pengeluaran?" desc="Catatan ini akan hilang dari laporan keuangan."/>
  </div>
}
function ExpForm({state,onClose}:{state:{e?:Expense}|null;onClose:()=>void}){
  const {set}=useDB();const toast=useToast();const e0=state?.e
  const [f,setF]=useState<any>({}),[err,setErr]=useState<any>({})
  useEffect(()=>{if(state){setErr({});setF(e0?{...e0}:{tgl:iso(),nama:'',kategori:'Listrik',jumlah:0,metode:'Tunai',catatan:''})}},[state])
  if(!state)return null
  const save=()=>{const e:any={};if(!f.nama?.trim())e.nama='Nama pengeluaran wajib diisi';if(!(f.jumlah>0))e.jumlah='Jumlah harus lebih dari 0';if(!f.tgl)e.tgl='Pilih tanggal';setErr(e);if(Object.keys(e).length)return
    set(d=>({...d,expenses:e0?d.expenses.map(x=>x.id===e0.id?{...f,nama:f.nama.trim()}:x):[{...f,id:uid('x'),nama:f.nama.trim()},...d.expenses]}));toast(e0?'Pengeluaran diperbarui':'Pengeluaran dicatat');onClose()}
  return <Modal open onClose={onClose} title={e0?'Edit Pengeluaran':'Tambah Pengeluaran'} footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={save}>Simpan</Button></>}>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Tanggal" error={err.tgl}><Input type="date" value={f.tgl||''} onChange={(x:any)=>setF({...f,tgl:x.target.value})}/></Field><Field label="Kategori"><Select value={f.kategori} onChange={(x:any)=>setF({...f,kategori:x.target.value})}>{KATEGORI.map(k=><option key={k}>{k}</option>)}</Select></Field>
      <Field label="Nama pengeluaran" error={err.nama} className="sm:col-span-2"><Input value={f.nama||''} onChange={(x:any)=>setF({...f,nama:x.target.value})} placeholder="mis. Tagihan listrik November"/></Field>
      <Field label="Jumlah (Rp)" error={err.jumlah}><Num value={f.jumlah} onChange={(v:number)=>setF({...f,jumlah:v})}/></Field><Field label="Metode pembayaran"><Select value={f.metode} onChange={(x:any)=>setF({...f,metode:x.target.value})}>{['Tunai','Transfer','QRIS','E-Wallet'].map(m=><option key={m}>{m}</option>)}</Select></Field>
      <Field label="Catatan" className="sm:col-span-2"><Textarea value={f.catatan||''} onChange={(x:any)=>setF({...f,catatan:x.target.value})}/></Field></div></Modal>
}
