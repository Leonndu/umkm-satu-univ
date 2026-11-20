'use client'
import Link from 'next/link'
import {useState} from 'react'
import {Button,Card,Field,Input,Notice} from './ui'

export function AuthForm({mode}:{mode:'login'|'register'}){
  const reg=mode==='register'
  const [f,setF]=useState({nama:'',usaha:'',email:'',password:'',demo:true}),[err,setErr]=useState<any>({}),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setErr({});setMsg('');setBusy(true)
    try{const r=await fetch(`/api/auth/${mode}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)});const j=await r.json().catch(()=>({}))
      if(!r.ok){setErr(j.fields||{});setMsg(j.error||'Terjadi kesalahan');setBusy(false);return}
      window.location.assign('/dashboard')}
    catch{setMsg('Tidak bisa terhubung ke server');setBusy(false)}}
  const u=(k:string)=>(e:any)=>setF({...f,[k]:e.target.value})
  return <div className="grid min-h-screen place-items-center bg-slate-50 p-4"><div className="w-full max-w-md">
    <div className="mb-6 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-xl font-bold text-white">M</span><h1 className="mt-4 text-2xl font-semibold tracking-tight">{reg?'Buat akun usaha':'Masuk ke Manajemen UMKM'}</h1><p className="mt-1 text-sm text-slate-500">{reg?'Mulai catat produksi, HPP, dan penjualan Anda.':'Kelola produksi dan keuangan usaha Anda.'}</p></div>
    <Card className="p-6"><form onSubmit={submit} className="space-y-4" noValidate>
      {msg&&<Notice tone="red">{msg}</Notice>}
      {reg&&<><Field label="Nama Anda" error={err.nama}><Input value={f.nama} onChange={u('nama')} autoComplete="name"/></Field><Field label="Nama usaha" error={err.usaha}><Input value={f.usaha} onChange={u('usaha')} placeholder="mis. Dapur Makmur"/></Field></>}
      <Field label="Email" error={err.email}><Input type="email" value={f.email} onChange={u('email')} autoComplete="email"/></Field>
      <Field label="Kata sandi" error={err.password} hint={reg?'Minimal 8 karakter.':undefined}><Input type="password" value={f.password} onChange={u('password')} autoComplete={reg?'new-password':'current-password'}/></Field>
      {reg&&<label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" className="mt-1 accent-emerald-600" checked={f.demo} onChange={e=>setF({...f,demo:e.target.checked})}/><span>Isi dengan data contoh (bahan, resep, penjualan) agar bisa langsung dicoba. Bisa direset kapan saja.</span></label>}
      <Button type="submit" className="w-full" disabled={busy}>{busy?'Memproses…':reg?'Daftar':'Masuk'}</Button></form></Card>
    <p className="mt-4 text-center text-sm text-slate-500">{reg?<>Sudah punya akun? <Link href="/login" className="font-medium text-emerald-700 hover:underline">Masuk</Link></>:<>Belum punya akun? <Link href="/register" className="font-medium text-emerald-700 hover:underline">Daftar</Link></>}</p>
    {!reg&&process.env.NODE_ENV!=='production'&&<p className="mt-3 text-center text-xs text-slate-400">Mode pengembangan — akun demo: demo@dapurmakmur.id / demo12345</p>}
  </div></div>
}
