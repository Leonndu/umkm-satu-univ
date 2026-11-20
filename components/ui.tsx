'use client'
import React,{createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react'
import {AlertTriangle,CheckCircle2,Inbox,Info,X} from 'lucide-react'

export const cn=(...a:any[])=>a.filter(Boolean).join(' ')
const base='inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40'
const variants:any={primary:'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',outline:'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',ghost:'text-slate-600 hover:bg-slate-100',danger:'bg-red-600 text-white hover:bg-red-700',soft:'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}
export function Button({variant='primary',size='md',className,...p}:any){
  return <button type="button" {...p} className={cn(base,variants[variant],size==='sm'?'h-8 px-3':size==='icon'?'h-8 w-8':'h-10 px-4',className)}/>
}
const field='w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50'
export const Input=React.forwardRef<HTMLInputElement,any>(({className,...p},r)=><input ref={r} {...p} className={cn(field,'h-10',className)}/>)
Input.displayName='Input'
export const Select=({className,children,...p}:any)=><select {...p} className={cn(field,'h-10 pr-8',className)}>{children}</select>
export const Textarea=({className,...p}:any)=><textarea rows={3} {...p} className={cn(field,'py-2',className)}/>
export function Num({value,onChange,className,...p}:any){
  const [s,setS]=useState(String(value??''))
  useEffect(()=>{if((parseFloat(s.replace(',','.'))||0)!==value)setS(value?String(value):'')},[value])
  return <Input inputMode="decimal" {...p} className={className} value={s} placeholder="0" onChange={(e:any)=>{const v=e.target.value.replace(/[^0-9.,]/g,'');setS(v);onChange(parseFloat(v.replace(',','.'))||0)}}/>
}
export function Field({label,hint,error,children,className}:{label?:string;hint?:string;error?:string;children:React.ReactNode;className?:string}){
  return <label className={cn('block',className)}>{label&&<span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}{children}
    {error?<span className="mt-1 block text-xs text-red-600">{error}</span>:hint&&<span className="mt-1 block text-xs text-slate-500">{hint}</span>}</label>
}
export const Card=({className,...p}:any)=><div {...p} className={cn('rounded-xl border border-slate-200 bg-white shadow-sm',className)}/>
const tones:any={green:'bg-emerald-50 text-emerald-700 ring-emerald-600/15',amber:'bg-amber-50 text-amber-700 ring-amber-600/20',red:'bg-red-50 text-red-700 ring-red-600/15',slate:'bg-slate-100 text-slate-600 ring-slate-500/10',blue:'bg-sky-50 text-sky-700 ring-sky-600/15'}
export const Badge=({tone='slate',children}:{tone?:string;children:React.ReactNode})=><span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',tones[tone])}>{children}</span>
export const stockBadge=(s:string)=>s==='habis'?<Badge tone="red">Habis</Badge>:s==='menipis'?<Badge tone="amber">Menipis</Badge>:<Badge tone="green">Aman</Badge>
export const prodBadge=(s:string)=><Badge tone={s==='Selesai'?'green':s==='Dalam Proses'?'blue':s==='Dibatalkan'?'red':'slate'}>{s}</Badge>

export function PageHeader({title,desc,crumb,actions}:{title:string;desc?:string;crumb?:string[];actions?:React.ReactNode}){
  return <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0">{crumb&&<p className="mb-1 text-xs text-slate-500">{crumb.join(' / ')}</p>}<h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>{desc&&<p className="mt-1 text-sm text-slate-500">{desc}</p>}</div>
    {actions&&<div className="flex w-full flex-wrap gap-2 sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">{actions}</div>}</div>
}
export function StatCard({icon:Icon,label,value,sub,tone='green',hint}:{icon:any;label:string;value:React.ReactNode;sub?:React.ReactNode;tone?:string;hint?:string}){
  const t:any={green:'bg-emerald-50 text-emerald-600',amber:'bg-amber-50 text-amber-600',red:'bg-red-50 text-red-600',slate:'bg-slate-100 text-slate-600'}
  return <Card className="p-4" title={hint}><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><span className={cn('grid h-8 w-8 place-items-center rounded-lg',t[tone])}><Icon size={16}/></span></div>
    <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>{sub&&<div className="mt-1 text-xs text-slate-500">{sub}</div>}</Card>
}
export function Empty({title,desc,action}:{title:string;desc?:string;action?:React.ReactNode}){
  return <div className="flex flex-col items-center px-4 py-12 text-center"><span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400"><Inbox size={18}/></span><p className="mt-3 text-sm font-medium text-slate-700">{title}</p>{desc&&<p className="mt-1 max-w-sm text-sm text-slate-500">{desc}</p>}{action&&<div className="mt-4">{action}</div>}</div>
}
export function Notice({tone='amber',children}:{tone?:'amber'|'green'|'blue'|'red';children:React.ReactNode}){
  const c:any={amber:'border-amber-200 bg-amber-50 text-amber-800',green:'border-emerald-200 bg-emerald-50 text-emerald-800',blue:'border-sky-200 bg-sky-50 text-sky-800',red:'border-red-200 bg-red-50 text-red-800'}
  const I=tone==='green'?CheckCircle2:tone==='blue'?Info:AlertTriangle
  return <div className={cn('flex gap-2 rounded-lg border p-3 text-sm',c[tone])}><I size={16} className="mt-0.5 shrink-0"/><div>{children}</div></div>
}
export function Toolbar({children}:{children:React.ReactNode}){return <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">{children}</div>}
export const THead=({children}:any)=><thead className="bg-slate-50/70 text-left text-xs font-medium text-slate-500"><tr>{children}</tr></thead>
export const Th=({children,right,className,...p}:any)=><th {...p} className={cn('px-4 py-2.5 font-medium',right&&'text-right',className)}>{children}</th>
export const Td=({children,right,className,...p}:any)=><td {...p} className={cn('px-4 py-3 align-middle',right&&'text-right tabular-nums',className)}>{children}</td>
export const Table=({children}:any)=><div className="overflow-x-auto"><table className="w-full text-sm [&_tbody_tr]:border-t [&_tbody_tr]:border-slate-100 [&_tbody_tr:hover]:bg-slate-50/50">{children}</table></div>

export function useSort<T>(rows:T[],init:string,dir:'asc'|'desc'='asc'){
  const [s,setS]=useState({k:init,d:dir})
  const sorted=useMemo(()=>[...rows].sort((a:any,b:any)=>{const x=a[s.k],y=b[s.k];const r=typeof x==='string'?x.localeCompare(y):(x-y);return s.d==='asc'?r:-r}),[rows,s])
  const th=(k:string,label:string,right?:boolean)=><Th key={k} right={right} onClick={()=>setS(p=>({k,d:p.k===k&&p.d==='asc'?'desc':'asc'}))} className="cursor-pointer select-none hover:text-slate-800">{label}{s.k===k?(s.d==='asc'?' ↑':' ↓'):''}</Th>
  return {sorted,th}
}

export function Modal({open,onClose,title,desc,children,footer,size='md',drawer}:{open:boolean;onClose:()=>void;title:string;desc?:string;children:React.ReactNode;footer?:React.ReactNode;size?:'sm'|'md'|'lg'|'xl';drawer?:boolean}){
  useEffect(()=>{if(!open)return;const h=(e:KeyboardEvent)=>e.key==='Escape'&&onClose();document.addEventListener('keydown',h);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',h);document.body.style.overflow=''}},[open,onClose])
  if(!open)return null
  const w={sm:'max-w-md',md:'max-w-xl',lg:'max-w-3xl',xl:'max-w-5xl'}[size]
  return <div className={cn('fixed inset-0 z-50 flex',drawer?'justify-end':'items-end justify-center sm:items-center sm:p-4')}>
    <div className="no-print absolute inset-0 bg-slate-900/40" onClick={onClose}/>
    <div role="dialog" aria-modal className={cn('print-area relative flex max-h-full w-full flex-col bg-white shadow-xl',drawer?'h-full max-w-xl':cn('max-h-[92vh] rounded-t-2xl sm:rounded-2xl',w))}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><h2 className="text-base font-semibold text-slate-900">{title}</h2>{desc&&<p className="mt-0.5 text-sm text-slate-500">{desc}</p>}</div>
        <button aria-label="Tutup" onClick={onClose} className="no-print rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div>
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer&&<div className="no-print flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
    </div></div>
}
export function Confirm({open,onClose,onOk,title,desc,okLabel='Hapus'}:{open:boolean;onClose:()=>void;onOk:()=>void;title:string;desc:string;okLabel?:string}){
  return <Modal open={open} onClose={onClose} title={title} size="sm" footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button variant="danger" onClick={()=>{onOk();onClose()}}>{okLabel}</Button></>}><p className="text-sm text-slate-600">{desc}</p></Modal>
}
export function Stepper({steps,current}:{steps:string[];current:number}){
  return <ol className="mb-5 flex items-center gap-1 overflow-x-auto text-xs">{steps.map((s,i)=><li key={s} className="flex shrink-0 items-center gap-1.5">
    <span className={cn('grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold',i+1<current?'bg-emerald-600 text-white':i+1===current?'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500':'bg-slate-100 text-slate-400')}>{i+1<current?'✓':i+1}</span>
    <span className={cn('hidden sm:inline',i+1===current?'font-medium text-slate-800':'text-slate-400')}>{s}</span>{i<steps.length-1&&<span className="mx-1 h-px w-4 bg-slate-200"/>}</li>)}</ol>
}
export function Row({k,v,bold}:{k:string;v:React.ReactNode;bold?:boolean}){return <div className={cn('flex items-center justify-between gap-4 py-1.5 text-sm',bold&&'font-semibold text-slate-900')}><span className={bold?'':'text-slate-500'}>{k}</span><span className="tabular-nums">{v}</span></div>}
export const ProductTile=({emo,size=40}:{emo:string;size?:number})=><span className="grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-50 to-emerald-50 ring-1 ring-slate-200" style={{width:size,height:size,fontSize:size*0.5}}>{emo}</span>

const T=createContext<(m:string,t?:'ok'|'err')=>void>(()=>{})
export const useToast=()=>useContext(T)
export function ToastProvider({children}:{children:React.ReactNode}){
  const [list,setList]=useState<{id:number;m:string;t:string}[]>([])
  const push=useCallback((m:string,t:'ok'|'err'='ok')=>{const id=Date.now()+Math.random();setList(l=>[...l,{id,m,t}]);setTimeout(()=>setList(l=>l.filter(x=>x.id!==id)),3200)},[])
  return <T.Provider value={push}>{children}<div className="no-print fixed bottom-4 right-4 z-[60] flex flex-col gap-2">{list.map(x=><div key={x.id} className={cn('flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg',x.t==='ok'?'bg-slate-900':'bg-red-600')}>{x.t==='ok'?<CheckCircle2 size={16} className="text-emerald-400"/>:<AlertTriangle size={16}/>}{x.m}</div>)}</div></T.Provider>
}
