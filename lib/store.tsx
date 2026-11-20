'use client'
import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react'
import {DB} from './types'

const COLS=['materials','products','recipes','productions','sales','expenses'] as const
type Status='loading'|'ready'|'anon'|'error'
type User={id:number;email:string;nama:string}
type Ctx={db:DB|null;status:Status;user:User|null;saving:boolean;error:string;set:(fn:(d:DB)=>DB)=>void;reset:()=>Promise<void>;logout:()=>Promise<void>}
const C=createContext<Ctx>({db:null,status:'loading',user:null,saving:false,error:'',set:()=>{},reset:async()=>{},logout:async()=>{}})

// Bandingkan dua snapshot, kirim hanya baris yang berubah
function diff(a:DB,b:DB){
  const ops:any[]=[]
  for(const c of COLS){
    const pa=new Map((a as any)[c].map((x:any)=>[x.id,x])),up:any[]=[],del:string[]=[]
    const seen=new Set<string>()
    for(const x of (b as any)[c]){seen.add(x.id);if(pa.get(x.id)!==x)up.push(x)}
    pa.forEach((_,id:any)=>{if(!seen.has(id))del.push(id)})
    if(up.length||del.length)ops.push({c,up,del})
  }
  if(a.settings!==b.settings)ops.push({c:'settings',up:[b.settings]})
  return ops
}

export function StoreProvider({children}:{children:React.ReactNode}){
  const [db,setDb]=useState<DB|null>(null),[status,setStatus]=useState<Status>('loading'),[user,setUser]=useState<User|null>(null),[pending,setPending]=useState(0),[error,setError]=useState('')
  const ref=useRef<DB|null>(null),chain=useRef<Promise<void>>(Promise.resolve())
  useEffect(()=>{(async()=>{
    try{
      const me=await fetch('/api/auth/me');if(me.status===401){setStatus('anon');return};if(!me.ok)throw new Error()
      setUser((await me.json()).user)
      const r=await fetch('/api/data');if(r.status===401){setStatus('anon');return};if(!r.ok)throw new Error()
      ref.current=await r.json();setDb(ref.current);setStatus('ready')
    }catch{setStatus('error')}})()},[])
  const push=useCallback((ops:any[])=>{
    setPending(n=>n+1)
    chain.current=chain.current.then(async()=>{
      try{const r=await fetch('/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ops})})
        if(r.status===401){window.location.assign('/login');return};if(!r.ok)throw new Error();setError('')}
      catch{setError('Perubahan terakhir belum tersimpan di server. Periksa koneksi, lalu muat ulang halaman.')}
      finally{setPending(n=>n-1)}})},[])
  const set=useCallback((fn:(d:DB)=>DB)=>{
    const prev=ref.current;if(!prev)return
    const next=fn(prev);if(next===prev)return
    ref.current=next;setDb(next)
    const ops=diff(prev,next);if(ops.length)push(ops)},[push])
  const reset=useCallback(async()=>{
    const r=await fetch('/api/reset',{method:'POST'});if(!r.ok){setError('Gagal mereset data');return}
    ref.current=await r.json();setDb(ref.current)},[])
  const logout=useCallback(async()=>{await chain.current;await fetch('/api/auth/logout',{method:'POST'});window.location.assign('/login')},[])
  return <C.Provider value={{db,status,user,saving:pending>0,error,set,reset,logout}}>{children}</C.Provider>
}
export const useStore=()=>useContext(C)
export const useDB=()=>useContext(C) as unknown as {db:DB;set:(fn:(d:DB)=>DB)=>void;reset:()=>Promise<void>}
