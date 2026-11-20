'use client'
import {useEffect,useState} from 'react'
import {RotateCcw,Upload} from 'lucide-react'
import {useDB} from '@/lib/store'
import {Button,Card,Confirm,Field,Input,Notice,Num,PageHeader,Select,Textarea,useToast} from '@/components/ui'
import {UNITS} from '@/lib/utils'

export default function Pengaturan(){
  const {db,set,reset}=useDB();const toast=useToast()
  const [f,setF]=useState(db.settings),[err,setErr]=useState<any>({}),[rst,setRst]=useState(false)
  useEffect(()=>setF(db.settings),[db.settings])
  const save=()=>{const e:any={};if(!f.nama.trim())e.nama='Nama usaha wajib diisi';if(!f.owner.trim())e.owner='Nama pemilik wajib diisi';if(f.email&&!/^\S+@\S+\.\S+$/.test(f.email))e.email='Format email tidak valid';setErr(e);if(Object.keys(e).length)return;set(d=>({...d,settings:f}));toast('Pengaturan disimpan')}
  const logo=(file?:File)=>{if(!file)return;if(file.size>300_000){toast('Ukuran logo maksimal 300 KB','err');return}const r=new FileReader();r.onload=()=>setF({...f,logo:String(r.result)});r.readAsDataURL(file)}
  const u=(k:string)=>(e:any)=>setF({...f,[k]:e.target.value})
  return <div className="max-w-3xl">
    <PageHeader title="Pengaturan Usaha" desc="Identitas usaha dan pengaturan dasar aplikasi." actions={<Button onClick={save}>Simpan Perubahan</Button>}/>
    <div className="space-y-4">
      <Card className="p-5"><h2 className="mb-4 font-semibold">Profil usaha</h2><div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 sm:col-span-2">{f.logo?<img src={f.logo} alt="Logo" className="h-16 w-16 rounded-xl object-cover"/>:<span className="grid h-16 w-16 place-items-center rounded-xl bg-emerald-600 text-2xl font-bold text-white">{f.nama.slice(0,1)}</span>}
          <div><label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm hover:bg-slate-50"><Upload size={15}/>Unggah logo<input type="file" accept="image/*" hidden onChange={e=>logo(e.target.files?.[0])}/></label>{f.logo&&<button className="ml-2 text-sm text-slate-500 hover:underline" onClick={()=>setF({...f,logo:''})}>Hapus</button>}<p className="mt-1 text-xs text-slate-500">PNG/JPG, maks. 300 KB. Disimpan di browser ini.</p></div></div>
        <Field label="Nama usaha" error={err.nama}><Input value={f.nama} onChange={u('nama')}/></Field>
        <Field label="Jenis usaha"><Select value={f.tipe} onChange={u('tipe')}>{['Produksi Makanan & Camilan','Bakery & Kue','Makanan Beku','Minuman Botolan','Katering','Kerajinan Tangan'].map(t=><option key={t}>{t}</option>)}{!['Produksi Makanan & Camilan','Bakery & Kue','Makanan Beku','Minuman Botolan','Katering','Kerajinan Tangan'].includes(f.tipe)&&<option>{f.tipe}</option>}</Select></Field>
        <Field label="Alamat usaha" className="sm:col-span-2"><Textarea value={f.alamat} onChange={u('alamat')}/></Field><Field label="Nomor telepon"><Input value={f.telp} onChange={u('telp')}/></Field><Field label="Mata uang"><Select value={f.mata} onChange={u('mata')}><option>IDR (Rp)</option></Select></Field></div></Card>
      <Card className="p-5"><h2 className="mb-4 font-semibold">Profil pemilik</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Nama pemilik" error={err.owner}><Input value={f.owner} onChange={u('owner')}/></Field><Field label="Email" error={err.email}><Input value={f.email} onChange={u('email')}/></Field></div></Card>
      <Card className="p-5"><h2 className="mb-4 font-semibold">Preferensi</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Satuan bahan baku bawaan" hint="Dipakai sebagai pilihan awal saat menambah bahan."><Select value={f.unitDefault} onChange={u('unitDefault')}>{UNITS.map(x=><option key={x}>{x}</option>)}</Select></Field><Field label="Batas minimum stok bawaan" hint="Dipakai sebagai isian awal bahan baru."><Num value={f.minDefault} onChange={(v:number)=>setF({...f,minDefault:v})}/></Field></div></Card>
      <Card className="border-red-200 p-5"><h2 className="font-semibold">Data demo</h2><p className="mb-3 mt-1 text-sm text-slate-500">Semua data disimpan di browser ini (localStorage). Reset akan menghapus perubahan Anda dan mengembalikan data demo Dapur Makmur.</p><Button variant="outline" onClick={()=>setRst(true)}><RotateCcw size={15}/>Reset Data Demo</Button></Card></div>
    <Confirm open={rst} onClose={()=>setRst(false)} okLabel="Reset data" onOk={()=>{reset();toast('Data demo dikembalikan')}} title="Reset data demo?" desc="Semua bahan, resep, produksi, penjualan, dan pengeluaran yang Anda ubah akan diganti dengan data demo awal."/>
  </div>
}
