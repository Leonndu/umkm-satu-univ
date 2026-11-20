'use client'
import {useEffect,useMemo,useState} from 'react'
import {AlertTriangle,Boxes,Eye,Pencil,Plus,Search,SlidersHorizontal,Trash2,Wallet} from 'lucide-react'
import {useDB} from '@/lib/store'
import {Badge,Button,Card,Confirm,Empty,Field,Input,Modal,Notice,Num,PageHeader,Row,Select,StatCard,Table,Td,Textarea,THead,Toolbar,stockBadge,useSort,useToast} from '@/components/ui'
import {UNITS,compatible,fmtDate,iso,num,rp,stockStatus,sum,uid,unitHint} from '@/lib/utils'
import {adjustMaterial} from '@/lib/actions'
import {Material,Unit} from '@/lib/types'

const CATS=['Bahan Utama','Bahan Tambahan','Bumbu','Kemasan','Lainnya']
const UL:Record<string,string>={g:'gram (g)',kg:'kilogram (kg)',ml:'mililiter (ml)',L:'liter (L)',pcs:'pcs',pack:'pack',botol:'botol'}

export default function BahanBaku(){
  const {db,set}=useDB();const toast=useToast()
  const [q,setQ]=useState(''),[cat,setCat]=useState(''),[st,setSt]=useState('')
  const [form,setForm]=useState<{id?:string}|null>(null),[detail,setDetail]=useState<string|null>(null),[adj,setAdj]=useState<string|null>(null),[del,setDel]=useState<string|null>(null)
  const rows=useMemo(()=>db.materials.map(m=>({...m,nilai:m.stok*m.harga,status:stockStatus(m.stok,m.min)})).filter(m=>m.nama.toLowerCase().includes(q.toLowerCase())&&(!cat||m.kategori===cat)&&(!st||m.status===st)),[db.materials,q,cat,st])
  const {sorted,th}=useSort(rows,'nama')
  const low=db.materials.filter(m=>stockStatus(m.stok,m.min)!=='aman').length
  const cats=Array.from(new Set([...CATS,...db.materials.map(m=>m.kategori)]))
  const remove=()=>{const m=db.materials.find(x=>x.id===del)!;if(db.recipes.some(r=>r.items.some(i=>i.materialId===m.id))){toast(`${m.nama} dipakai di resep, hapus dari resep dulu.`,'err');return}set(d=>({...d,materials:d.materials.filter(x=>x.id!==m.id)}));toast(`${m.nama} dihapus`)}
  return <div>
    <PageHeader title="Bahan Baku" desc="Kelola bahan yang digunakan dalam proses produksi." actions={<Button onClick={()=>setForm({})}><Plus size={16}/>Tambah Bahan</Button>}/>
    <div className="grid gap-4 sm:grid-cols-3"><StatCard icon={Boxes} label="Total jenis bahan" value={db.materials.length} sub="jenis bahan terdaftar"/><StatCard icon={Wallet} label="Total nilai persediaan" value={rp(sum(db.materials.map(m=>m.stok*m.harga)))} sub="stok × harga rata-rata"/><StatCard icon={AlertTriangle} tone={low?'amber':'green'} label="Bahan stok menipis" value={low} sub={low?'perlu dibeli':'semua aman'}/></div>
    <Card className="mt-4"><Toolbar><div className="relative min-w-[200px] flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><Input className="pl-9" placeholder="Cari nama bahan…" value={q} onChange={(e:any)=>setQ(e.target.value)}/></div>
      <Select className="w-full sm:w-44" value={cat} onChange={(e:any)=>setCat(e.target.value)}><option value="">Semua kategori</option>{cats.map(c=><option key={c}>{c}</option>)}</Select>
      <Select className="w-full sm:w-40" value={st} onChange={(e:any)=>setSt(e.target.value)}><option value="">Semua status</option><option value="aman">Aman</option><option value="menipis">Menipis</option><option value="habis">Habis</option></Select></Toolbar>
      {sorted.length?<Table><THead>{th('nama','Nama Bahan')}{th('kategori','Kategori')}{th('stok','Stok Saat Ini',true)}<th className="px-4 py-2.5">Satuan</th>{th('harga','Harga Rata-rata',true)}{th('nilai','Nilai Persediaan',true)}{th('status','Status')}<th className="px-4 py-2.5 text-right">Aksi</th></THead>
        <tbody>{sorted.map(m=><tr key={m.id}><Td className="font-medium text-slate-800"><button className="hover:text-emerald-700 hover:underline" onClick={()=>setDetail(m.id)}>{m.nama}</button></Td><Td className="text-slate-500">{m.kategori}</Td><Td right>{num(m.stok)}</Td><Td>{m.satuan}</Td><Td right>{rp(m.harga)}<span className="text-xs text-slate-400">/{m.satuan}</span></Td><Td right>{rp(m.nilai)}</Td><Td>{stockBadge(m.status)}</Td>
          <Td right><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Detail" onClick={()=>setDetail(m.id)}><Eye size={15}/></Button><Button variant="ghost" size="icon" title="Sesuaikan stok" onClick={()=>setAdj(m.id)}><SlidersHorizontal size={15}/></Button><Button variant="ghost" size="icon" title="Edit" onClick={()=>setForm({id:m.id})}><Pencil size={15}/></Button><Button variant="ghost" size="icon" title="Hapus" onClick={()=>setDel(m.id)}><Trash2 size={15} className="text-red-500"/></Button></div></Td></tr>)}</tbody></Table>
        :<Empty title="Bahan tidak ditemukan" desc="Ubah kata kunci atau filter, atau tambahkan bahan baru." action={<Button onClick={()=>setForm({})}>Tambah Bahan</Button>}/>}</Card>
    <MaterialForm state={form} onClose={()=>setForm(null)}/>
    <Detail id={detail} onClose={()=>setDetail(null)} onAdjust={(id:string)=>{setDetail(null);setAdj(id)}}/>
    <Adjust id={adj} onClose={()=>setAdj(null)}/>
    <Confirm open={!!del} onClose={()=>setDel(null)} onOk={remove} title="Hapus bahan?" desc={`"${db.materials.find(m=>m.id===del)?.nama}" akan dihapus beserta riwayat stoknya. Tindakan ini tidak bisa dibatalkan.`}/>
  </div>
}

function MaterialForm({state,onClose}:{state:{id?:string}|null;onClose:()=>void}){
  const {db,set}=useDB();const toast=useToast()
  const blank={nama:'',kategori:'Bahan Utama',satuan:db.settings.unitDefault as Unit,stok:0,harga:0,min:db.settings.minDefault,catatan:''}
  const [f,setF]=useState<any>(blank),[err,setErr]=useState<any>({})
  const edit=state?.id?db.materials.find(m=>m.id===state.id):undefined
  useEffect(()=>{if(state){setErr({});setF(edit?{...edit}:blank)}},[state])
  const save=()=>{const e:any={};if(!f.nama.trim())e.nama='Nama bahan wajib diisi';if(db.materials.some(m=>m.id!==edit?.id&&m.nama.toLowerCase()===f.nama.trim().toLowerCase()))e.nama='Nama bahan sudah ada';if(f.harga<=0)e.harga='Harga harus lebih dari 0';setErr(e);if(Object.keys(e).length)return
    if(edit)set(d=>({...d,materials:d.materials.map(m=>m.id===edit.id?{...m,nama:f.nama.trim(),kategori:f.kategori,satuan:f.satuan,harga:f.harga,min:f.min,catatan:f.catatan}:m)}))
    else set(d=>({...d,materials:[...d.materials,{id:uid('m-'),nama:f.nama.trim(),kategori:f.kategori,satuan:f.satuan,stok:f.stok,harga:f.harga,min:f.min,catatan:f.catatan,moves:f.stok>0?[{tgl:iso(),aktivitas:'Stok awal',masuk:f.stok,keluar:0,sisa:f.stok}]:[],beli:f.stok>0?[{tgl:iso(),qty:f.stok,harga:f.harga}]:[]}]}))
    toast(edit?'Bahan diperbarui':'Bahan ditambahkan');onClose()}
  return <Modal open={!!state} onClose={onClose} title={edit?'Edit Bahan':'Tambah Bahan'} desc="Harga dan stok dicatat per satuan dasar." footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={save}>Simpan</Button></>}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nama bahan" error={err.nama} className="sm:col-span-2"><Input value={f.nama} onChange={(e:any)=>setF({...f,nama:e.target.value})} placeholder="mis. Tepung Terigu"/></Field>
      <Field label="Kategori"><Select value={f.kategori} onChange={(e:any)=>setF({...f,kategori:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</Select></Field>
      <Field label="Satuan dasar" hint={unitHint(f.satuan)}><Select value={f.satuan} onChange={(e:any)=>setF({...f,satuan:e.target.value})} disabled={!!edit&&edit.moves.length>1}>{UNITS.map(u=><option key={u} value={u}>{UL[u]}</option>)}</Select></Field>
      {!edit&&<Field label="Stok awal" hint={`Dalam ${f.satuan}`}><Num value={f.stok} onChange={(v:number)=>setF({...f,stok:v})}/></Field>}
      <Field label={`Harga pembelian per ${f.satuan}`} error={err.harga} hint="Contoh: beli tepung 25 kg Rp300.000 → isi Rp12.000 per kg."><Num value={f.harga} onChange={(v:number)=>setF({...f,harga:v})}/></Field>
      <Field label="Batas minimum stok" hint="Anda diberi peringatan saat stok di bawah angka ini."><Num value={f.min} onChange={(v:number)=>setF({...f,min:v})}/></Field>
      <Field label="Catatan" className="sm:col-span-2"><Textarea value={f.catatan||''} onChange={(e:any)=>setF({...f,catatan:e.target.value})}/></Field>
      <div className="sm:col-span-2"><Notice tone="blue">Satuan di resep boleh berbeda. Stok 25 kg tetap bisa dipakai 500 g di resep — sistem mengonversi otomatis.</Notice></div></div></Modal>
}

function Detail({id,onClose,onAdjust}:{id:string|null;onClose:()=>void;onAdjust:(id:string)=>void}){
  const {db}=useDB();const m=db.materials.find(x=>x.id===id)
  if(!m)return null
  const s=stockStatus(m.stok,m.min)
  return <Modal drawer open onClose={onClose} title={m.nama} desc={`${m.kategori} · satuan ${m.satuan}`} footer={<Button onClick={()=>onAdjust(m.id)}><SlidersHorizontal size={16}/>Sesuaikan Stok</Button>}>
    {s!=='aman'&&<div className="mb-4"><Notice tone={s==='habis'?'red':'amber'}>{s==='habis'?'Stok habis.':'Stok di bawah batas minimum.'} Segera beli bahan ini — minimum {num(m.min)} {m.satuan}.</Notice></div>}
    <div className="rounded-xl border border-slate-200 px-4 py-2"><Row k="Stok saat ini" v={<b>{num(m.stok)} {m.satuan}</b>}/><Row k="Harga rata-rata" v={`${rp(m.harga)} / ${m.satuan}`}/><Row k="Total nilai persediaan" v={rp(m.stok*m.harga)}/><Row k="Batas minimum" v={`${num(m.min)} ${m.satuan}`}/><Row k="Status" v={stockBadge(s)}/>{m.catatan&&<Row k="Catatan" v={m.catatan}/>}</div>
    <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-900">Riwayat perubahan stok</h3>
    <div className="rounded-xl border border-slate-200"><Table><THead><th className="px-3 py-2">Tanggal</th><th className="px-3 py-2">Aktivitas</th><th className="px-3 py-2 text-right">Masuk</th><th className="px-3 py-2 text-right">Keluar</th><th className="px-3 py-2 text-right">Sisa</th></THead>
      <tbody>{[...m.moves].reverse().map((x,i)=><tr key={i}><Td className="whitespace-nowrap text-slate-500">{fmtDate(x.tgl)}</Td><Td>{x.aktivitas}</Td><Td right className="text-emerald-600">{x.masuk?'+'+num(x.masuk):'–'}</Td><Td right className="text-red-500">{x.keluar?'−'+num(x.keluar):'–'}</Td><Td right>{num(x.sisa)}</Td></tr>)}</tbody></Table></div>
    <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-900">Riwayat pembelian</h3>
    {m.beli.length?<div className="rounded-xl border border-slate-200"><Table><THead><th className="px-3 py-2">Tanggal</th><th className="px-3 py-2 text-right">Jumlah</th><th className="px-3 py-2 text-right">Harga/{m.satuan}</th><th className="px-3 py-2 text-right">Total</th></THead><tbody>{m.beli.map((b,i)=><tr key={i}><Td>{fmtDate(b.tgl)}</Td><Td right>{num(b.qty)} {m.satuan}</Td><Td right>{rp(b.harga)}</Td><Td right>{rp(b.qty*b.harga)}</Td></tr>)}</tbody></Table></div>:<p className="text-sm text-slate-500">Belum ada pembelian tercatat.</p>}
  </Modal>
}

function Adjust({id,onClose}:{id:string|null;onClose:()=>void}){
  const {db,set}=useDB();const toast=useToast();const m=db.materials.find(x=>x.id===id)
  const [jenis,setJenis]=useState<'beli'|'tambah'|'kurang'>('beli'),[qty,setQty]=useState(0),[harga,setHarga]=useState(0),[cat,setCat]=useState(''),[err,setErr]=useState('')
  useEffect(()=>{if(m){setJenis('beli');setQty(0);setHarga(m.harga);setCat('');setErr('')}},[id])
  if(!m)return null
  const save=()=>{if(qty<=0)return setErr('Jumlah harus lebih dari 0');if(jenis==='kurang'&&qty>m.stok)return setErr(`Stok hanya ${num(m.stok)} ${m.satuan}`);if(jenis==='beli'&&harga<=0)return setErr('Isi harga beli');set(d=>adjustMaterial(d,m.id,jenis,qty,harga,cat));toast('Stok diperbarui');onClose()}
  return <Modal open onClose={onClose} size="sm" title="Sesuaikan Stok" desc={`${m.nama} — stok sekarang ${num(m.stok)} ${m.satuan}`} footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={save}>Simpan</Button></>}>
    <div className="space-y-4"><Field label="Jenis perubahan"><Select value={jenis} onChange={(e:any)=>setJenis(e.target.value)}><option value="beli">Pembelian bahan (stok masuk)</option><option value="tambah">Koreksi tambah stok</option><option value="kurang">Kurangi stok (rusak / terbuang / hilang)</option></Select></Field>
      <Field label={`Jumlah (${m.satuan})`} error={err}><Num value={qty} onChange={setQty}/></Field>
      {jenis==='beli'&&<Field label={`Harga beli per ${m.satuan}`} hint="Harga rata-rata bahan dihitung ulang otomatis. Ini hanya memengaruhi estimasi HPP berikutnya."><Num value={harga} onChange={setHarga}/></Field>}
      <Field label="Catatan"><Input value={cat} onChange={(e:any)=>setCat(e.target.value)} placeholder="mis. Beli di Pasar Induk"/></Field></div></Modal>
}
