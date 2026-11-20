'use client'
import Link from 'next/link'
import {useEffect,useState} from 'react'
import {ChefHat,Factory,Pencil,Plus,Trash2} from 'lucide-react'
import {useDB} from '@/lib/store'
import {Badge,Button,Card,Confirm,Empty,Field,Input,Modal,Notice,Num,PageHeader,ProductTile,Row,Select,Stepper,Table,Td,THead,useToast} from '@/components/ui'
import {calcRecipe,compatible,convert,emoji,fmtDate,iso,num,padId,rp,suggestPrice,uid} from '@/lib/utils'
import {Recipe,RExtra} from '@/lib/types'

const TIPE:RExtra['tipe'][]=['Tenaga Kerja','Gas & Listrik','Kemasan','Overhead Lain']
const HPP_INFO='HPP adalah total biaya yang dibutuhkan untuk menghasilkan satu produk.'

export default function ResepPage(){
  const {db,set}=useDB();const toast=useToast()
  const [wiz,setWiz]=useState<{edit?:Recipe}|null>(null),[detail,setDetail]=useState<string|null>(null),[del,setDel]=useState<string|null>(null)
  useEffect(()=>{if(new URLSearchParams(location.search).get('baru'))setWiz({})},[])
  const remove=()=>{const r=db.recipes.find(x=>x.id===del)!;set(d=>({...d,recipes:d.recipes.filter(x=>x.id!==r.id)}));setDetail(null);toast('Resep dihapus. Riwayat produksi tetap tersimpan.')}
  return <div>
    <PageHeader title="Resep & HPP" desc="Hitung modal produk berdasarkan bahan dan biaya produksi." actions={<Button onClick={()=>setWiz({})}><Plus size={16}/>Buat Resep</Button>}/>
    <Notice tone="blue">{HPP_INFO} Angka di halaman ini adalah <b>estimasi</b> berdasarkan harga bahan saat ini. Biaya sebenarnya dicatat saat produksi selesai.</Notice>
    {db.recipes.length?<div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{db.recipes.map(r=>{const c=calcRecipe(r,db.materials);return <Card key={r.id} className="cursor-pointer p-5 transition hover:border-emerald-300" onClick={()=>setDetail(r.id)}>
      <div className="flex items-start gap-3"><ProductTile emo={emoji(r.nama)} size={48}/><div className="min-w-0"><h3 className="truncate font-semibold text-slate-900">{r.nama}</h3><p className="text-xs text-slate-500">Batch {num(r.batch,0)} {r.unit} · {r.items.length} bahan</p></div></div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-500">Total biaya batch</p><p className="font-medium">{rp(c.total)}</p></div><div><p className="text-xs text-slate-500" title={HPP_INFO}>HPP per {r.unit}</p><p className="font-semibold text-slate-900">{rp(c.hpp)}</p></div>
        <div><p className="text-xs text-slate-500">Harga jual</p><p className="font-medium">{rp(r.harga)}</p></div><div><p className="text-xs text-slate-500">Estimasi margin</p><Badge tone={c.margin>=30?'green':c.margin>=15?'amber':'red'}>{num(c.margin,1)}%</Badge></div></div></Card>})}</div>
    :<Card className="mt-4"><Empty title="Belum ada resep" desc="Buat resep pertama untuk mengetahui modal tiap produk." action={<Button onClick={()=>setWiz({})}>Buat Resep</Button>}/></Card>}
    <RecipeWizard state={wiz} onClose={()=>setWiz(null)}/>
    <RecipeDetail id={detail} onClose={()=>setDetail(null)} onEdit={(r:Recipe)=>{setDetail(null);setWiz({edit:r})}} onDelete={(id:string)=>setDel(id)}/>
    <Confirm open={!!del} onClose={()=>setDel(null)} onOk={remove} title="Hapus resep?" desc="Resep akan dihapus. Produk dan catatan produksi lama tidak ikut terhapus."/>
  </div>
}

function RecipeDetail({id,onClose,onEdit,onDelete}:{id:string|null;onClose:()=>void;onEdit:(r:Recipe)=>void;onDelete:(id:string)=>void}){
  const {db}=useDB();const r=db.recipes.find(x=>x.id===id)
  if(!r)return null
  const c=calcRecipe(r,db.materials)
  const last=db.productions.filter(p=>p.recipeId===r.id&&p.status==='Selesai').sort((a,b)=>b.tgl.localeCompare(a.tgl))[0]
  return <Modal open onClose={onClose} size="lg" title={r.nama} desc={`Resep untuk ${num(r.batch,0)} ${r.unit}`} footer={<><Button variant="outline" onClick={()=>onDelete(r.id)}><Trash2 size={15} className="text-red-500"/>Hapus</Button><Button variant="outline" onClick={()=>onEdit(r)}><Pencil size={15}/>Edit Resep</Button><Link href="/produksi?baru=1"><Button><Factory size={15}/>Produksi</Button></Link></>}>
    <div className="grid gap-3 sm:grid-cols-2"><Card className="p-4"><p className="text-xs text-slate-500">HPP estimasi per {r.unit}</p><p className="text-2xl font-semibold">{rp(c.hpp)}</p><p className="mt-1 text-xs text-slate-500">Dihitung dari harga bahan saat ini. Berubah jika harga bahan berubah.</p></Card>
      <Card className="p-4"><p className="text-xs text-slate-500">HPP aktual produksi terakhir</p>{last?<><p className="text-2xl font-semibold">{rp(last.hppAktual)}</p><p className="mt-1 text-xs text-slate-500">{last.id} · {fmtDate(last.tgl)} — biaya nyata, tidak berubah.</p></>:<p className="mt-1 text-sm text-slate-500">Belum ada produksi selesai.</p>}</Card></div>
    <h3 className="mb-2 mt-5 text-sm font-semibold">Komposisi bahan</h3>
    <div className="rounded-xl border border-slate-200"><Table><THead><th className="px-3 py-2">Bahan</th><th className="px-3 py-2 text-right">Jumlah</th><th className="px-3 py-2 text-right">Biaya satuan</th><th className="px-3 py-2 text-right">Subtotal</th></THead><tbody>{c.lines.map((l,i)=><tr key={i}><Td>{l.nama}</Td><Td right>{num(l.qty)} {l.unit}</Td><Td right>{rp(l.unitCost)}/{l.unit}</Td><Td right>{rp(l.sub)}</Td></tr>)}</tbody></Table></div>
    <div className="mt-4 rounded-xl border border-slate-200 px-4 py-2"><Row k="Biaya bahan" v={rp(c.bahan)}/><Row k="Tenaga kerja" v={rp(c.tenaga)}/><Row k="Overhead (gas, listrik, kemasan, lainnya)" v={rp(c.overhead)}/><Row bold k="Total biaya produksi" v={rp(c.total)}/><Row k={`Harga jual / ${r.unit}`} v={rp(r.harga)}/><Row k={`Laba per ${r.unit}`} v={<span className="text-emerald-700">{rp(c.untung)} ({num(c.margin,1)}%)</span>}/></div>
    <h3 className="mb-2 mt-5 text-sm font-semibold">Riwayat HPP, harga jual & pembaruan resep</h3>
    <div className="rounded-xl border border-slate-200"><Table><THead><th className="px-3 py-2">Tanggal</th><th className="px-3 py-2 text-right">HPP estimasi</th><th className="px-3 py-2 text-right">Harga jual</th><th className="px-3 py-2">Catatan</th></THead><tbody>{[...r.hist].reverse().map((h,i)=><tr key={i}><Td>{fmtDate(h.tgl)}</Td><Td right>{rp(h.hpp)}</Td><Td right>{rp(h.harga)}</Td><Td className="text-slate-500">{h.catatan}</Td></tr>)}</tbody></Table></div>
  </Modal>
}

function RecipeWizard({state,onClose}:{state:{edit?:Recipe}|null;onClose:()=>void}){
  const {db,set}=useDB();const toast=useToast();const edit=state?.edit
  const [step,setStep]=useState(1),[f,setF]=useState<any>(null),[err,setErr]=useState<any>({})
  const free=db.products.filter(p=>!db.recipes.some(r=>r.productId===p.id&&r.id!==edit?.id))
  useEffect(()=>{if(!state)return;setStep(1);setErr({})
    setF(edit?{mode:'existing',productId:edit.productId,newName:'',nama:edit.nama,batch:edit.batch,unit:edit.unit,items:edit.items.map(i=>({...i,k:uid()})),extras:edit.extras.map(e=>({...e})),harga:edit.harga,margin:35}
      :{mode:free.length?'existing':'new',productId:free[0]?.id||'',newName:'',nama:'',batch:100,unit:'pack',items:[{k:uid(),materialId:'',qty:0,unit:db.settings.unitDefault}],extras:[{id:uid('e'),nama:'Upah pekerja',tipe:'Tenaga Kerja',mode:'tetap',jumlah:0},{id:uid('e'),nama:'Gas & listrik',tipe:'Gas & Listrik',mode:'tetap',jumlah:0}],harga:0,margin:35})},[state])
  if(!state||!f)return null
  const tmp:Recipe={id:'tmp',nama:f.nama,productId:f.productId,batch:f.batch||0,unit:f.unit,items:f.items.filter((i:any)=>i.materialId),extras:f.extras,harga:f.harga,hist:[]}
  const c=calcRecipe(tmp,db.materials)
  const up=(p:any)=>setF({...f,...p})
  const upItem=(k:string,p:any)=>up({items:f.items.map((i:any)=>i.k===k?{...i,...p}:i)})
  const upEx=(id:string,p:any)=>up({extras:f.extras.map((e:any)=>e.id===id?{...e,...p}:e)})
  const next=()=>{const e:any={}
    if(step===1){if(f.mode==='existing'&&!f.productId)e.produk='Pilih produk';if(f.mode==='new'&&!f.newName.trim())e.newName='Isi nama produk baru';if(!f.nama.trim())e.nama='Nama resep wajib diisi';if(f.batch<=0)e.batch='Jumlah harus lebih dari 0'}
    if(step===2){if(!tmp.items.length)e.items='Tambahkan minimal satu bahan';else if(tmp.items.some((i:any)=>i.qty<=0))e.items='Jumlah setiap bahan harus lebih dari 0'}
    setErr(e);if(Object.keys(e).length)return
    if(step===3&&!f.harga)up({harga:suggestPrice(c.hpp,f.margin)});setStep(step+1)}
  const save=()=>{if(f.harga<=0){setErr({harga:'Isi harga jual'});return}
    const id=edit?.id||uid('r-');let pid=f.productId
    set(d=>{let products=d.products
      if(f.mode==='new'){pid=uid('p-');products=[...products,{id:pid,nama:f.newName.trim(),sku:'SKU-'+String(products.length+1).padStart(3,'0'),kategori:'Lainnya',stok:0,unit:f.unit,hpp:Math.round(c.hpp),harga:f.harga,min:10,moves:[]}]}
      else products=products.map(p=>p.id===pid?{...p,harga:f.harga,hpp:p.stok===0?Math.round(c.hpp):p.hpp}:p)
      const rec:Recipe={id,nama:f.nama.trim(),productId:pid,batch:f.batch,unit:f.unit,items:tmp.items.map(({materialId,qty,unit}:any)=>({materialId,qty,unit})),extras:f.extras,harga:f.harga,hist:[...(edit?.hist||[]),{tgl:iso(),hpp:Math.round(c.hpp),harga:f.harga,catatan:edit?'Resep diperbarui':'Resep dibuat'}]}
      return {...d,products,recipes:edit?d.recipes.map(r=>r.id===id?rec:r):[...d.recipes,rec]}})
    toast(edit?'Resep diperbarui':'Resep dibuat');onClose()}
  const margin=f.harga?((f.harga-c.hpp)/f.harga)*100:0
  return <Modal open onClose={onClose} size="xl" title={edit?'Edit Resep':'Buat Resep'} desc="Hitung HPP dalam 4 langkah." footer={<>{step>1&&<Button variant="outline" onClick={()=>setStep(step-1)}>Kembali</Button>}{step<4?<Button onClick={next}>Lanjut</Button>:<Button onClick={save}>Simpan Resep</Button>}</>}>
    <Stepper current={step} steps={['Info Produk','Bahan','Biaya Tambahan','Ringkasan HPP']}/>
    {step===1&&<div className="grid gap-4 sm:grid-cols-2">
      <Field label="Produk" className="sm:col-span-2"><div className="mb-2 inline-flex rounded-lg border border-slate-200 p-0.5 text-sm">{[['existing','Pilih produk yang ada'],['new','Buat produk baru']].map(([v,l])=><button key={v} disabled={v==='existing'&&!free.length} onClick={()=>up({mode:v})} className={`rounded-md px-3 py-1.5 disabled:opacity-40 ${f.mode===v?'bg-emerald-600 text-white':'text-slate-600'}`}>{l}</button>)}</div>
        {f.mode==='existing'?<><Select value={f.productId} onChange={(e:any)=>{const p=db.products.find(x=>x.id===e.target.value);up({productId:e.target.value,nama:f.nama||p?.nama||'',unit:p?.unit||f.unit})}}><option value="">— pilih produk —</option>{free.map(p=>(<option key={p.id} value={p.id}>{p.nama}</option>))}</Select>{err.produk&&<span className="text-xs text-red-600">{err.produk}</span>}</>:<Input placeholder="Nama produk baru" value={f.newName} onChange={(e:any)=>up({newName:e.target.value,nama:f.nama||e.target.value})}/>}{err.newName&&<span className="text-xs text-red-600">{err.newName}</span>}</Field>
      <Field label="Nama resep" error={err.nama}><Input value={f.nama} onChange={(e:any)=>up({nama:e.target.value})}/></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Target produksi per batch" error={err.batch}><Num value={f.batch} onChange={(v:number)=>up({batch:v})}/></Field><Field label="Satuan hasil"><Select value={f.unit} onChange={(e:any)=>up({unit:e.target.value})}>{['pack','pcs','botol','porsi','kotak'].map(u=><option key={u}>{u}</option>)}</Select></Field></div>
      <div className="sm:col-span-2"><Notice tone="blue">Satu resep = satu kali produksi (batch). Contoh: 25 kg singkong menghasilkan 100 pack.</Notice></div></div>}
    {step===2&&<div><div className="space-y-3">{f.items.map((it:any)=>{const m=db.materials.find(x=>x.id===it.materialId);
      const unitCost=m?m.harga*convert(1,it.unit,m.satuan):0
      return <div key={it.k} className="grid grid-cols-12 items-end gap-2 rounded-xl border border-slate-200 p-3"><Field label="Bahan" className="col-span-12 sm:col-span-4"><Select value={it.materialId} onChange={(e:any)=>{const mm=db.materials.find(x=>x.id===e.target.value);upItem(it.k,{materialId:e.target.value,unit:mm?.satuan||it.unit})}}><option value="">— pilih bahan —</option>{db.materials.map(x=><option key={x.id} value={x.id}>{x.nama}</option>)}</Select></Field>
        <Field label="Jumlah" className="col-span-5 sm:col-span-2"><Num value={it.qty} onChange={(v:number)=>upItem(it.k,{qty:v})}/></Field>
        <Field label="Satuan" className="col-span-7 sm:col-span-2"><Select value={it.unit} onChange={(e:any)=>upItem(it.k,{unit:e.target.value})}>{(m?compatible(m.satuan):compatible('kg')).map(u=><option key={u}>{u}</option>)}</Select></Field>
        <div className="col-span-5 text-sm sm:col-span-2"><p className="text-xs text-slate-500">Biaya satuan</p><p className="h-10 leading-10">{m?rp(unitCost)+'/'+it.unit:'–'}</p></div>
        <div className="col-span-6 text-sm sm:col-span-1"><p className="text-xs text-slate-500">Subtotal</p><p className="h-10 font-medium leading-10">{m?rp(unitCost*it.qty):'–'}</p></div>
        <Button variant="ghost" size="icon" className="col-span-1 mb-1" aria-label="Hapus bahan" onClick={()=>up({items:f.items.filter((x:any)=>x.k!==it.k)})}><Trash2 size={15} className="text-red-500"/></Button></div>})}</div>
      {err.items&&<p className="mt-2 text-xs text-red-600">{err.items}</p>}
      <Button variant="soft" className="mt-3" onClick={()=>up({items:[...f.items,{k:uid(),materialId:'',qty:0,unit:db.settings.unitDefault}]})}><Plus size={15}/>Tambah Bahan</Button>
      <div className="mt-4 flex justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm"><span className="text-slate-500">Total biaya bahan (live)</span><b>{rp(c.bahan)}</b></div></div>}
    {step===3&&<div><p className="mb-3 text-sm text-slate-500">Tambahkan biaya selain bahan yang langsung terpakai saat memproduksi. Biaya tetap = per batch; biaya per unit dikali jumlah hasil.</p>
      <div className="space-y-3">{f.extras.map((e:any)=><div key={e.id} className="grid grid-cols-12 items-end gap-2 rounded-xl border border-slate-200 p-3"><Field label="Nama biaya" className="col-span-12 sm:col-span-3"><Input value={e.nama} onChange={(x:any)=>upEx(e.id,{nama:x.target.value})}/></Field>
        <Field label="Jenis" className="col-span-6 sm:col-span-3"><Select value={e.tipe} onChange={(x:any)=>upEx(e.id,{tipe:x.target.value})}>{TIPE.map(t=><option key={t}>{t}</option>)}</Select></Field>
        <Field label="Cara hitung" className="col-span-6 sm:col-span-2"><Select value={e.mode} onChange={(x:any)=>upEx(e.id,{mode:x.target.value})}><option value="tetap">Tetap / batch</option><option value="per unit">Per {f.unit}</option></Select></Field>
        <Field label="Jumlah (Rp)" className="col-span-9 sm:col-span-3"><Num value={e.jumlah} onChange={(v:number)=>upEx(e.id,{jumlah:v})}/></Field>
        <Button variant="ghost" size="icon" className="col-span-3 mb-1 sm:col-span-1" aria-label="Hapus biaya" onClick={()=>up({extras:f.extras.filter((x:any)=>x.id!==e.id)})}><Trash2 size={15} className="text-red-500"/></Button></div>)}</div>
      <Button variant="soft" className="mt-3" onClick={()=>up({extras:[...f.extras,{id:uid('e'),nama:'',tipe:'Overhead Lain',mode:'tetap',jumlah:0}]})}><Plus size={15}/>Tambah Biaya</Button></div>}
    {step===4&&<div className="grid gap-4 lg:grid-cols-2"><div className="rounded-xl border border-slate-200 px-4 py-2"><Row k="Total biaya bahan" v={rp(c.bahan)}/><Row k="Total biaya tenaga kerja" v={rp(c.tenaga)}/><Row k="Total overhead" v={rp(c.overhead)}/><Row bold k="Total biaya produksi" v={rp(c.total)}/><Row k="Estimasi hasil" v={`${num(f.batch,0)} ${f.unit}`}/><Row bold k={`HPP per ${f.unit}`} v={rp(c.hpp)}/><p className="pb-2 text-xs text-slate-500">{HPP_INFO} Ini estimasi dari harga bahan saat ini.</p></div>
      <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4"><h3 className="text-sm font-semibold">Kalkulator harga jual</h3>
        <Field label="Target margin (%)" hint="Margin = laba dibagi harga jual."><Num value={f.margin} onChange={(v:number)=>up({margin:v,harga:suggestPrice(c.hpp,v)})}/></Field>
        <Field label={`Harga jual per ${f.unit} (Rp)`} error={err.harga} hint="Disarankan dibulatkan ke Rp500. Anda bebas mengubahnya."><Num value={f.harga} onChange={(v:number)=>up({harga:v})}/></Field>
        <Row k="Estimasi laba per unit" v={<b className="text-emerald-700">{rp(f.harga-c.hpp)}</b>}/><Row k="Margin kotor" v={<Badge tone={margin>=30?'green':margin>=15?'amber':'red'}>{num(margin,1)}%</Badge>}/>
        {f.harga>0&&f.harga<c.hpp&&<Notice tone="red">Harga jual di bawah HPP — usaha rugi di setiap penjualan.</Notice>}</div></div>}
  </Modal>
}
