'use client'
import Link from 'next/link'
import {usePathname,useRouter} from 'next/navigation'
import {useEffect,useState} from 'react'
import {BarChart3,Boxes,ChefHat,Factory,LayoutDashboard,Loader2,LogOut,Menu,PackageCheck,PanelLeftClose,PanelLeftOpen,Receipt,Settings,ShoppingCart,X,Wallet} from 'lucide-react'
import {useStore} from '@/lib/store'
import {Notice,cn} from './ui'

const NAV=[{g:'UTAMA',i:[['/dashboard','Dashboard',LayoutDashboard]]},
  {g:'OPERASIONAL',i:[['/bahan-baku','Bahan Baku',Boxes],['/resep','Resep & HPP',ChefHat],['/produksi','Produksi',Factory],['/produk-jadi','Produk Jadi',PackageCheck],['/penjualan','Penjualan',ShoppingCart]]},
  {g:'KEUANGAN',i:[['/pengeluaran','Pengeluaran',Wallet],['/laporan','Laporan Keuangan',BarChart3]]},
  {g:'PENGATURAN',i:[['/pengaturan','Pengaturan Usaha',Settings]]}] as any[]

export function Shell({children}:{children:React.ReactNode}){
  const {db,status,logout,error,saving}=useStore();const path=usePathname();const router=useRouter();const pub=path==='/login'||path==='/register';const [col,setCol]=useState(false);const [open,setOpen]=useState(false)
  useEffect(()=>setOpen(false),[path])
  useEffect(()=>{if(status==='anon'&&!pub)router.replace('/login');if(status==='ready'&&pub)router.replace('/dashboard')},[status,pub])
  if(pub)return <>{children}</>
  if(status==='error')return <div className="grid min-h-screen place-items-center p-6 text-center"><div><p className="font-medium">Tidak bisa memuat data usaha</p><p className="mt-1 text-sm text-slate-500">Periksa koneksi atau server, lalu coba lagi.</p><button onClick={()=>location.reload()} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">Muat ulang</button></div></div>
  if(!db)return <div className="grid min-h-screen place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16}/>Memuat data usaha…</span></div>
  const s=db.settings
  const Logo=()=><div className="flex items-center gap-2.5 overflow-hidden">{s.logo?<img src={s.logo} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover"/>:<span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-sm font-bold text-white">{s.nama.slice(0,1)}</span>}</div>
  const Nav=({c}:{c:boolean})=><nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">{NAV.map(g=><div key={g.g}>{!c&&<p className="mb-1.5 px-3 text-[11px] font-medium tracking-wide text-slate-400">{g.g}</p>}
    <ul className="space-y-0.5">{g.i.map(([href,label,Icon]:any)=>{const on=path===href||path.startsWith(href+'/');return <li key={href}><Link href={href} title={label} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',on?'bg-emerald-50 font-medium text-emerald-700':'text-slate-600 hover:bg-slate-100',c&&'justify-center px-0')}><Icon size={18} className={on?'text-emerald-600':'text-slate-400'}/>{!c&&label}</Link></li>})}</ul></div>)}</nav>
  const User=({c}:{c:boolean})=><div className={cn('flex items-center gap-2.5 border-t border-slate-100 p-3',c&&'flex-col')}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-800 text-xs font-semibold text-white">{s.owner.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>{!c&&<div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{s.owner}</p><p className="truncate text-xs text-slate-500">Pemilik usaha</p></div>}<button onClick={logout} title="Keluar" aria-label="Keluar" className={cn('rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700',!c&&'ml-auto')}><LogOut size={16}/></button></div>
  const Head=({c}:{c:boolean})=><div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-4"><Logo/>{!c&&<div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{s.nama}</p><p className="truncate text-xs text-slate-500">{s.tipe}</p></div>}</div>
  return <div className="flex min-h-screen">
    <aside className={cn('no-print sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-all lg:flex',col?'w-[72px]':'w-64')}>
      <Head c={col}/><Nav c={col}/>
      <button onClick={()=>setCol(!col)} className="mx-3 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-100">{col?<PanelLeftOpen size={16}/>:<><PanelLeftClose size={16}/>Ciutkan menu</>}</button>
      <User c={col}/></aside>
    {open&&<div className="no-print fixed inset-0 z-40 lg:hidden"><div className="absolute inset-0 bg-slate-900/40" onClick={()=>setOpen(false)}/><aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl"><div className="flex items-center justify-between pr-3"><Head c={false}/><button aria-label="Tutup menu" onClick={()=>setOpen(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={18}/></button></div><Nav c={false}/><User c={false}/></aside></div>}
    <div className="min-w-0 flex-1">
      <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden"><button aria-label="Buka menu" onClick={()=>setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100"><Menu size={20}/></button><Logo/><span className="text-sm font-semibold">{s.nama}</span></header>
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{error&&<div className="no-print mb-4"><Notice tone="red">{error}</Notice></div>}{saving&&<p className="no-print fixed bottom-4 left-4 z-40 rounded-full bg-slate-900 px-3 py-1 text-xs text-white lg:left-[17rem]">Menyimpan…</p>}{children}</main></div></div>
}
