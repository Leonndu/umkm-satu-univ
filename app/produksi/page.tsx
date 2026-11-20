'use client'
import {useEffect,useMemo,useState} from 'react'
import {AlertTriangle,CheckCircle2,Eye,Factory,Play,Plus,Search,Trash2,XCircle} from 'lucide-react'
import {useDB} from '@/lib/store'
import {Badge,Button,Card,Confirm,Empty,Field,Input,Modal,Notice,Num,PageHeader,Row,Select,StatCard,Stepper,Table,Td,Textarea,THead,Toolbar,prodBadge,useToast} from '@/components/ui'
import {fmtDate,iso,num,padId,rp,sum} from '@/lib/utils'
import {buildProduction,completeProduction} from '@/lib/actions'
import {Production} from '@/lib/types'

export default function ProduksiPage(){
  const {db,set}=useDB();const toast=useToast()
  const [q,setQ]=useState(''),[st,setSt]=useState('')
  const [wiz,setWiz]=useState<{existing?:Production}|null>(null),[detail,setDetail]=useState<string|null>(null),[cancel,setCancel]=useState<string|null>(null)
  useEffect(()=>{if(new URLSearchParams(location.search).get('baru'))setWiz({})},[])
  const ym=iso().slice(0,7),done=db.productions.filter(p=>p.status==='Selesai')
  const month=done.filter(p=>p.tgl.startsWith(ym))
  const rows=useMemo(()=>[...db.productions].sort((a,b)=>b.tgl.localeCompare(a.tgl)||b.id.localeCompare(a.id)).filter(p=>(p.nama+p.id).toLowerCase().includes(q.toLowerCase())&&(!st||p.status===st)),[db.productions,q,st])
  const unit=(id:string)=>db.products.find(p=>p.id===id)?.unit||''
  const start=(p:Production)=>{set(d=>({...d,productions:d.productions.map(x=>x.id===p.id?{...x,status:'Dalam Proses',timeline:[...x.timeline,{tgl:iso(),teks:'Produksi dimulai'}]}:x)}));toast(`${p.id} dimulai`)}
  const doCancel=()=>{set(d=>({...d,productions:d.productions.map(x=>x.id===cancel?{...x,status:'Dibatalkan',timeline:[...x.timeline,{tgl:iso(),teks:'Produksi dibatalkan'}]}:x)}));toast('Produksi dibatalkan')}
  return <div>
    <PageHeader title="Produksi" desc="Catat dan pantau aktivitas produksi usaha." actions={<Button onClick={()=>setWiz({})}><Plus size={16}/>Buat Produksi</Button>}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={Factory} label="Produksi bulan ini" value={`${num(sum(month.map(p=>p.hasil-p.rusak)),0)} unit`} sub="siap jual"/><StatCard icon={CheckCircle2} label="Produk diproduksi" value={new Set(month.map(p=>p.productId)).size} sub="jenis produk bulan ini"/>
      <StatCard icon={Play} tone="slate" label="Sedang berjalan" value={db.productions.filter(p=>p.status==='Dalam Proses').length} sub="produksi dalam proses"/><StatCard icon={AlertTriangle} tone="amber" label="Rusak / terbuang" value={`${num(sum(done.map(p=>p.rusak)),0)} unit`} sub={`${db.productions.filter(p=>p.status==='Dibatalkan').length} produksi dibatalkan`}/></div>
    <Card className="mt-4"><Toolbar><div className="relative min-w-[200px] flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><Input className="pl-9" placeholder="Cari ID atau produk…" value={q} onChange={(e:any)=>setQ(e.target.value)}/></div>
      <Select className="w-full sm:w-44" value={st} onChange={(e:any)=>setSt(e.target.value)}><option value="">Semua status</option>{['Draft','Dalam Proses','Selesai','Dibatalkan'].map(s=><option key={s}>{s}</option>)}</Select></Toolbar>
      {rows.length?<Table><THead><th className="px-4 py-2.5">ID</th><th className="px-4 py-2.5">Produk / Resep</th><th className="px-4 py-2.5 text-right">Rencana</th><th className="px-4 py-2.5 text-right">Hasil aktual</th><th className="px-4 py-2.5">Tanggal</th><th className="px-4 py-2.5 text-right">Biaya</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Aksi</th></THead>
        <tbody>{rows.map(p=><tr key={p.id}><Td className="font-medium">{p.id}</Td><Td>{p.nama}</Td><Td right>{num(p.rencana,0)} {unit(p.productId)}</Td><Td right>{p.status==='Selesai'?`${num(p.hasil,0)} ${unit(p.productId)}`:'–'}</Td><Td className="whitespace-nowrap text-slate-500">{fmtDate(p.tgl)}</Td>
          <Td right title={p.status==='Selesai'?'Biaya aktual':'Estimasi biaya'}>{rp(p.status==='Selesai'?p.totalBiaya:p.estBiaya)}{p.status!=='Selesai'&&<span className="block text-[11px] text-slate-400">estimasi</span>}</Td><Td>{prodBadge(p.status)}</Td>
          <Td right><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Detail" onClick={()=>setDetail(p.id)}><Eye size={15}/></Button>
            {p.status==='Draft'&&<Button variant="soft" size="sm" onClick={()=>start(p)}>Mulai</Button>}{(p.status==='Draft'||p.status==='Dalam Proses')&&<><Button variant="soft" size="sm" onClick={()=>setWiz({existing:p})}>Selesaikan</Button><Button variant="ghost" size="icon" title="Batalkan" onClick={()=>setCancel(p.id)}><XCircle size={15} className="text-red-500"/></Button></>}</div></Td></tr>)}</tbody></Table>
        :<Empty title="Belum ada produksi" desc="Buat produksi untuk menambah stok produk jadi." action={<Button onClick={()=>setWiz({})}>Buat Produksi</Button>}/>}</Card>
    <Wizard state={wiz} onClose={()=>setWiz(null)}/>
    <Detail id={detail} onClose={()=>setDetail(null)}/>
    <Confirm open={!!cancel} onClose={()=>setCancel(null)} onOk={doCancel} okLabel="Batalkan produksi" title="Batalkan produksi?" desc="Bahan baku belum dipotong, jadi stok tidak berubah. Produksi akan ditandai Dibatalkan."/>
  </div>
}

function Wizard({state,onClose}:{state:{existing?:Production}|null;onClose:()=>void}){
  const {db,set}=useDB();const toast=useToast();const ex=state?.existing
  const [step,setStep]=useState(1),[rid,setRid]=useState(''),[rencana,setRencana]=useState(50),[tgl,setTgl]=useState(iso()),[hasil,setHasil]=useState(0),[rusak,setRusak]=useState(0),[waste,setWaste]=useState<Record<string,number>>({}),[tambahan,setTambahan]=useState(0),[cat,setCat]=useState(''),[err,setErr]=useState('')
  useEffect(()=>{if(!state)return;setErr('');setWaste({});setTambahan(0);setCat('');setRusak(0)
    if(ex){setStep(5);setRid(ex.recipeId);setRencana(ex.rencana);setTgl(ex.tgl);setHasil(ex.rencana)}else{setStep(1);setRid(db.recipes[0]?.id||'');setRencana(50);setTgl(iso());setHasil(0)}},[state])
  if(!state)return null
  const recipe=db.recipes.find(r=>r.id===rid)
  const id=ex?.id||padId('PRD',Math.max(0,...db.productions.map(p=>+p.id.slice(4)))+1)
  const p:Production|null=ex?ex:recipe&&rencana>0?buildProduction(recipe,db.materials,rencana,tgl,id):null
  const unit=(recipe?.unit)||db.products.find(x=>x.id===p?.productId)?.unit||''
  const rows=(p?.usage||[]).map(u=>{const m=db.materials.find(x=>x.id===u.materialId);const tot=u.rencana+(waste[u.materialId]||0);return {...u,stok:m?.stok||0,tot,short:Math.max(0,u.rencana-(m?.stok||0)),shortAll:Math.max(0,tot-(m?.stok||0))}})
  const anyShort=rows.some(r=>r.short>0)
  const biayaWaste=sum(rows.map(r=>(r.tot-r.rencana)*r.harga)),good=Math.max(0,hasil-rusak)
  const total=(p?.biayaBahan||0)+biayaWaste+(p?.biayaLain||0)+tambahan,hppAktual=good?total/good:0
  const next=()=>{setErr('')
    if(step===1&&!recipe)return setErr('Pilih produk yang sudah punya resep')
    if(step===2){if(rencana<=0)return setErr('Jumlah produksi harus lebih dari 0');if(!hasil)setHasil(rencana)}
    if(step===5){if(hasil<=0)return setErr('Isi hasil produksi aktual');if(rusak>hasil)return setErr('Produk rusak tidak boleh melebihi hasil')}
    setStep(step+1)}
  const saveDraft=(status:'Draft'|'Dalam Proses')=>{if(!p)return;set(d=>({...d,productions:[{...p,status,timeline:[...p.timeline,...(status==='Dalam Proses'?[{tgl:iso(),teks:'Produksi dimulai'}]:[])]},...d.productions]}));toast(status==='Draft'?'Disimpan sebagai draft':'Produksi dimulai');onClose()}
  const finish=()=>{if(!p)return;const r=completeProduction(db,p,{hasil,rusak,waste,tambahan,catatan:cat});if(r.error){toast(r.error,'err');setErr(r.error);return}set(()=>r.db);toast(`${p.id} selesai — ${good} unit masuk stok produk jadi`);onClose()}
  return <Modal open onClose={onClose} size="lg" title={ex?`Selesaikan ${ex.id}`:'Buat Produksi'} desc={p?.nama} footer={<>{step>(ex?5:1)&&<Button variant="outline" onClick={()=>setStep(step-1)}>Kembali</Button>}
    {step===4&&<><Button variant="outline" onClick={()=>saveDraft('Draft')}>Simpan Draft</Button><Button variant="soft" onClick={()=>saveDraft('Dalam Proses')}>Mulai Produksi</Button></>}
    {step<6?<Button onClick={next} disabled={step===4&&anyShort&&false}>{step===4?'Catat Hasil':'Lanjut'}</Button>:<Button onClick={finish}><CheckCircle2 size={16}/>Selesaikan Produksi</Button>}</>}>
    <Stepper current={step} steps={['Pilih Produk','Jumlah','Ketersediaan Bahan','Konfirmasi','Catat Hasil','Ringkasan']}/>
    {err&&<div className="mb-3"><Notice tone="red">{err}</Notice></div>}
    {step===1&&<div className="space-y-4">{db.recipes.length?<Field label="Produk (harus punya resep)"><Select value={rid} onChange={(e:any)=>setRid(e.target.value)}>{db.recipes.map(r=><option key={r.id} value={r.id}>{r.nama}</option>)}</Select></Field>:<Notice>Belum ada resep. Buat resep di menu Resep & HPP terlebih dulu.</Notice>}
      <Field label="Tanggal produksi"><Input type="date" value={tgl} onChange={(e:any)=>setTgl(e.target.value)}/></Field></div>}
    {step===2&&recipe&&<div className="space-y-4"><Field label={`Jumlah yang akan diproduksi (${unit})`} hint={`1 resep = ${num(recipe.batch,0)} ${recipe.unit}. Kebutuhan bahan dihitung otomatis.`} error={err}><Num value={rencana} onChange={setRencana}/></Field>
      <Notice tone="blue">Contoh: resep untuk {num(recipe.batch,0)} {recipe.unit}; produksi {num(rencana,0)} {unit} berarti bahan dikali {num(rencana/recipe.batch,2)}.</Notice></div>}
    {step===3&&<div><Table><THead><th className="px-3 py-2">Bahan</th><th className="px-3 py-2 text-right">Dibutuhkan</th><th className="px-3 py-2 text-right">Stok tersedia</th><th className="px-3 py-2">Status</th></THead><tbody>{rows.map(r=><tr key={r.materialId}><Td>{r.nama}</Td><Td right>{num(r.rencana)} {r.unit}</Td><Td right>{num(r.stok)} {r.unit}</Td><Td>{r.short>0?<Badge tone="red">Kurang {num(r.short)} {r.unit}</Badge>:<Badge tone="green">Cukup</Badge>}</Td></tr>)}</tbody></Table>
      <div className="mt-3">{anyShort?<Notice tone="red">Stok bahan belum cukup. Anda tetap bisa menyimpan draft, tapi produksi tidak bisa diselesaikan sebelum bahan ditambah di menu Bahan Baku.</Notice>:<Notice tone="green">Semua bahan tersedia. Produksi siap dilakukan.</Notice>}</div></div>}
    {step===4&&p&&<div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 px-4 py-2"><Row k="Produk" v={p.nama}/><Row k="Rencana produksi" v={`${num(rencana,0)} ${unit}`}/><Row k="Biaya bahan (estimasi)" v={rp(p.biayaBahan)}/><Row k="Tenaga & overhead (estimasi)" v={rp(p.biayaLain)}/><Row bold k="Total estimasi biaya" v={rp(p.estBiaya)}/><Row bold k={`Estimasi HPP / ${unit}`} v={rp(p.estBiaya/rencana)}/></div>
      <div><p className="mb-2 text-sm font-medium">Pemakaian bahan</p><ul className="space-y-1 text-sm text-slate-600">{rows.map(r=><li key={r.materialId} className="flex justify-between"><span>{r.nama}</span><span>{num(r.rencana)} {r.unit}</span></li>)}</ul>{anyShort&&<div className="mt-3"><Notice>Ada bahan yang kurang (lihat langkah 3).</Notice></div>}</div></div>}
    {step===5&&p&&<div className="space-y-4"><div className="grid gap-4 sm:grid-cols-3"><Field label={`Hasil aktual (${unit})`} hint="Total yang jadi, termasuk yang rusak."><Num value={hasil} onChange={setHasil}/></Field><Field label="Produk rusak"><Num value={rusak} onChange={setRusak}/></Field><Field label="Biaya tambahan (Rp)" hint="Biaya tak terduga produksi ini."><Num value={tambahan} onChange={setTambahan}/></Field></div>
      <div><p className="mb-1 text-sm font-medium">Bahan terbuang (di luar rencana)</p><p className="mb-2 text-xs text-slate-500">Isi jika ada bahan yang tumpah, gosong, atau terbuang. Jumlah ini ikut mengurangi stok dan menambah biaya.</p><div className="grid gap-2 sm:grid-cols-2">{rows.map(r=><div key={r.materialId} className="flex items-center gap-2"><span className="flex-1 truncate text-sm">{r.nama}</span><div className="w-24"><Num value={waste[r.materialId]||0} onChange={(v:number)=>setWaste({...waste,[r.materialId]:v})}/></div><span className="w-8 text-xs text-slate-500">{r.unit}</span></div>)}</div></div>
      <Field label="Catatan produksi"><Textarea value={cat} onChange={(e:any)=>setCat(e.target.value)} placeholder="mis. Minyak cepat gosong, ganti 1x"/></Field></div>}
    {step===6&&p&&<div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 px-4 py-2"><Row k="Biaya bahan" v={rp(p.biayaBahan)}/><Row k="Bahan terbuang" v={rp(biayaWaste)}/><Row k="Tenaga & overhead" v={rp(p.biayaLain)}/><Row k="Biaya tambahan" v={rp(tambahan)}/><Row bold k="Total biaya aktual" v={rp(total)}/></div>
      <div className="rounded-xl border border-slate-200 px-4 py-2"><Row k="Hasil aktual" v={`${num(hasil,0)} ${unit}`}/><Row k="Rusak" v={`${num(rusak,0)} ${unit}`}/><Row k="Masuk stok produk jadi" v={<b>{num(good,0)} {unit}</b>}/><Row bold k={`HPP aktual / ${unit}`} v={rp(hppAktual)}/><Row k="Estimasi HPP" v={rp(p.estBiaya/p.rencana)}/></div></div>
      {rows.some(r=>r.shortAll>0)&&<Notice tone="red">Stok bahan tidak cukup untuk pemakaian aktual. Tambah stok dulu di menu Bahan Baku.</Notice>}
      <Notice tone="blue">Saat diselesaikan, bahan baku dipotong dari stok dan {num(good,0)} {unit} ditambahkan ke Produk Jadi dengan HPP aktual di atas.</Notice></div>}
  </Modal>
}

function Detail({id,onClose}:{id:string|null;onClose:()=>void}){
  const {db}=useDB();const p=db.productions.find(x=>x.id===id)
  if(!p)return null
  const unit=db.products.find(x=>x.id===p.productId)?.unit||''
  return <Modal open onClose={onClose} size="lg" title={`${p.id} — ${p.nama}`} desc={fmtDate(p.tgl)}>
    <div className="mb-4 flex flex-wrap gap-2">{prodBadge(p.status)}<Badge>Rencana {num(p.rencana,0)} {unit}</Badge>{p.status==='Selesai'&&<Badge tone="green">Hasil {num(p.hasil,0)} {unit}</Badge>}{p.rusak>0&&<Badge tone="red">Rusak {p.rusak}</Badge>}</div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 px-4 py-2"><p className="py-1.5 text-sm font-semibold">Rincian biaya</p><Row k="Bahan baku" v={rp(p.biayaBahan)}/><Row k="Bahan terbuang" v={rp(p.biayaWaste)}/><Row k="Tenaga & overhead" v={rp(p.biayaLain)}/><Row k="Biaya tambahan" v={rp(p.biayaTambahan)}/>{p.status==='Selesai'?<><Row bold k="Total biaya aktual" v={rp(p.totalBiaya)}/><Row bold k={`HPP aktual / ${unit}`} v={rp(p.hppAktual)}/></>:<Row bold k="Estimasi biaya" v={rp(p.estBiaya)}/>}</div>
      <div className="rounded-xl border border-slate-200 px-4 py-2"><p className="py-1.5 text-sm font-semibold">Snapshot resep</p><p className="pb-1 text-xs text-slate-500">Resep saat produksi dibuat — tidak berubah walau resep diedit.</p><Row k="Batch resep" v={`${num(p.snapshot.batch,0)} ${p.snapshot.unit}`}/>{p.snapshot.items.map((i,k)=><Row key={k} k={i.nama} v={`${num(i.qty)} ${i.unit}`}/>)}</div></div>
    <h3 className="mb-2 mt-5 text-sm font-semibold">Pemakaian bahan: rencana vs aktual</h3>
    <div className="rounded-xl border border-slate-200"><Table><THead><th className="px-3 py-2">Bahan</th><th className="px-3 py-2 text-right">Rencana</th><th className="px-3 py-2 text-right">Aktual</th><th className="px-3 py-2 text-right">Selisih</th></THead><tbody>{p.usage.map(u=><tr key={u.materialId}><Td>{u.nama}</Td><Td right>{num(u.rencana)} {u.unit}</Td><Td right>{p.status==='Selesai'?`${num(u.aktual)} ${u.unit}`:'–'}</Td><Td right className={u.aktual>u.rencana&&p.status==='Selesai'?'text-red-600':''}>{p.status==='Selesai'?num(u.aktual-u.rencana):'–'}</Td></tr>)}</tbody></Table></div>
    {p.catatan&&<p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Catatan: {p.catatan}</p>}
    <h3 className="mb-2 mt-5 text-sm font-semibold">Alur produksi</h3><ol className="space-y-2 border-l-2 border-emerald-100 pl-4">{p.timeline.map((t,i)=><li key={i} className="text-sm"><span className="text-xs text-slate-400">{fmtDate(t.tgl)}</span><br/>{t.teks}</li>)}</ol>
  </Modal>
}
