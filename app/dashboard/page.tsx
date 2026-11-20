'use client'
import Link from 'next/link'
import {useState} from 'react'
import {Area,AreaChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts'
import {AlertTriangle,Factory,Plus,TrendingUp,Wallet,ShoppingBag} from 'lucide-react'
import {useDB} from '@/lib/store'
import {Badge,Button,Card,Empty,prodBadge,ProductTile,StatCard,cn} from '@/components/ui'
import {daysAgo,emoji,fmtDate,greeting,longDate,num,pct,rp,saleCalc,short,shortDate,stockStatus,sum} from '@/lib/utils'

export default function Dashboard(){
  const {db}=useDB();const [range,setRange]=useState(7)
  const from=daysAgo(range-1),pFrom=daysAgo(2*range-1),pTo=daysAgo(range)
  const cur=db.sales.filter(s=>s.tgl>=from),prev=db.sales.filter(s=>s.tgl>=pFrom&&s.tgl<=pTo)
  const agg=(a:typeof cur)=>({rev:sum(a.map(s=>saleCalc(s).rev)),profit:sum(a.map(s=>saleCalc(s).profit))})
  const c=agg(cur),p=agg(prev)
  const produced=sum(db.productions.filter(x=>x.status==='Selesai'&&x.tgl>=from).map(x=>x.hasil-x.rusak))
  const low=db.materials.filter(m=>stockStatus(m.stok,m.min)!=='aman')
  const n=Math.max(range,7)
  const chart=Array.from({length:n},(_,i)=>{const d=daysAgo(n-1-i);const ss=db.sales.filter(s=>s.tgl===d);return {tgl:shortDate(d),Penjualan:sum(ss.map(s=>saleCalc(s).rev)),Laba:sum(ss.map(s=>saleCalc(s).profit))}})
  const top=Object.values(cur.flatMap(s=>s.items).reduce((a:any,i)=>{const x=a[i.productId]||(a[i.productId]={nama:i.nama,qty:0,rev:0,profit:0});x.qty+=i.qty;x.rev+=i.qty*i.harga;x.profit+=i.qty*(i.harga-i.hpp);return a},{})).sort((a:any,b:any)=>b.rev-a.rev).slice(0,4) as any[]
  const recent=[...db.productions].sort((a,b)=>b.tgl.localeCompare(a.tgl)||b.id.localeCompare(a.id)).slice(0,5)
  const ch=(v:number)=><span className={cn('font-medium',v>=0?'text-emerald-600':'text-red-600')}>{v>=0?'+':''}{num(v,1)}%</span>
  const label=range===1?'hari ini':`${range} hari terakhir`
  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-semibold tracking-tight text-slate-900">{greeting()}, {db.settings.owner.split(' ')[0]}!</h1><p className="mt-1 text-sm text-slate-500">{db.settings.nama} · {longDate()}</p></div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">{[[1,'Hari Ini'],[7,'7 Hari'],[30,'30 Hari']].map(([v,l]:any)=><button key={v} onClick={()=>setRange(v)} className={cn('rounded-md px-3 py-1.5 text-sm',range===v?'bg-emerald-600 text-white':'text-slate-600 hover:bg-slate-50')}>{l}</button>)}</div>
        <Link href="/produksi?baru=1" className="flex-1 sm:flex-none"><Button className="w-full"><Plus size={16}/>Catat Produksi</Button></Link></div></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={ShoppingBag} label="Total Penjualan" value={rp(c.rev)} sub={<>{ch(pct(c.rev,p.rev))} dibanding periode sebelumnya</>}/>
      <StatCard icon={TrendingUp} label="Estimasi Laba Kotor" value={rp(c.profit)} sub={<>{ch(pct(c.profit,p.profit))} · penjualan dikurangi HPP</>} hint="Laba kotor = penjualan − HPP (modal produk). Belum dikurangi biaya operasional."/>
      <StatCard icon={Factory} label="Total Produksi" value={`${num(produced,0)} unit`} sub={`Produksi selesai ${label}`}/>
      <StatCard icon={AlertTriangle} tone={low.length?'amber':'green'} label="Stok Bahan Menipis" value={low.length?`${low.length} bahan`:'Aman'} sub={low.length?'perlu dibeli segera':'semua bahan di atas batas minimum'}/></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Ringkasan Penjualan & Keuntungan</h2><p className="text-xs text-slate-500">{n} hari terakhir</p></div>
        <div className="flex gap-3 text-xs text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-600"/>Penjualan</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-500"/>Laba kotor</span></div></div>
        <div className="h-64"><ResponsiveContainer><AreaChart data={chart} margin={{left:-10,right:8,top:5}}><defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#059669" stopOpacity={0.18}/><stop offset="100%" stopColor="#059669" stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid stroke="#f1f5f9" vertical={false}/><XAxis dataKey="tgl" tick={{fontSize:11,fill:'#94a3b8'}} tickLine={false} axisLine={false}/><YAxis tick={{fontSize:11,fill:'#94a3b8'}} tickLine={false} axisLine={false} tickFormatter={short}/>
          <Tooltip formatter={(v:any)=>rp(v)} contentStyle={{borderRadius:10,border:'1px solid #e2e8f0',fontSize:12}}/><Area type="monotone" dataKey="Penjualan" stroke="#059669" strokeWidth={2} fill="url(#g1)"/><Area type="monotone" dataKey="Laba" name="Laba kotor" stroke="#f59e0b" strokeWidth={2} fill="none"/></AreaChart></ResponsiveContainer></div></Card>
      <Card className="p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-slate-900">Stok Bahan Menipis</h2>{low.length>0&&<Badge tone="amber">{low.length} bahan</Badge>}</div>
        {low.length?<ul className="space-y-3">{low.slice(0,4).map(m=>{const pr=Math.min(100,m.stok/m.min*100);return <li key={m.id}><div className="flex justify-between text-sm"><span className="font-medium text-slate-700">{m.nama}</span><span className="text-slate-500">{num(m.stok)} {m.satuan} tersisa</span></div>
          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100"><div className={cn('h-full rounded-full',stockStatus(m.stok,m.min)==='habis'?'bg-red-500':'bg-amber-500')} style={{width:pr+'%'}}/></div><p className="mt-1 text-xs text-slate-400">Minimum {num(m.min)} {m.satuan}</p></li>})}</ul>:<Empty title="Semua stok aman" desc="Tidak ada bahan di bawah batas minimum."/>}
        <Link href="/bahan-baku"><Button variant="outline" className="mt-4 w-full">Lihat Semua Bahan</Button></Link></Card></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card className="p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-slate-900">Produksi Terbaru</h2><Link href="/produksi" className="text-sm text-emerald-700 hover:underline">Lihat semua</Link></div>
        <ul className="divide-y divide-slate-100">{recent.map(x=><li key={x.id} className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{x.nama}</p><p className="text-xs text-slate-500">{x.id} · {fmtDate(x.tgl)} · {num(x.status==='Selesai'?x.hasil:x.rencana,0)} {db.products.find(p=>p.id===x.productId)?.unit}</p></div>{prodBadge(x.status)}</li>)}</ul></Card>
      <Card className="p-5"><div className="mb-3"><h2 className="font-semibold text-slate-900">Produk Terlaris</h2><p className="text-xs text-slate-500">{label}</p></div>
        {top.length?<ul className="divide-y divide-slate-100">{top.map((t:any)=><li key={t.nama} className="flex items-center gap-3 py-2.5"><ProductTile emo={emoji(t.nama)}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{t.nama}</p><p className="text-xs text-slate-500">{num(t.qty,0)} terjual · {rp(t.rev)}</p></div><div className="text-right"><p className="text-sm font-medium text-emerald-700">+{rp(t.profit)}</p><p className="text-xs text-slate-400">laba</p></div></li>)}</ul>:<Empty title="Belum ada penjualan" desc="Catat penjualan untuk melihat produk terlaris."/>}</Card></div>
  </div>
}
