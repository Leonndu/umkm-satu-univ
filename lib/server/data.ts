import type {PoolConnection} from 'mysql2/promise'
import {COLS,q,tx} from './db'
import {DB} from '../types'
import {seed} from '../seed'

const s=(v:any,n=150)=>String(v??'').slice(0,n)
// Kolom tambahan (selain `data` JSON) agar tabel bisa dicari/diurutkan langsung lewat SQL
const EXTRA:Record<string,[string,(x:any)=>any][]>={
  materials:[['nama',x=>s(x.nama)],['kategori',x=>s(x.kategori,100)],['stok',x=>+x.stok||0],['min_stok',x=>+x.min||0]],
  products:[['nama',x=>s(x.nama)],['sku',x=>s(x.sku,60)],['stok',x=>+x.stok||0]],
  recipes:[['nama',x=>s(x.nama)],['product_id',x=>s(x.productId,40)]],
  productions:[['tgl',x=>s(x.tgl,10)],['status',x=>s(x.status,20)],['recipe_id',x=>s(x.recipeId,40)]],
  sales:[['tgl',x=>s(x.tgl,10)],['customer',x=>s(x.customer)],['status',x=>s(x.status,20)]],
  expenses:[['nama',x=>s(x.nama)],['tgl',x=>s(x.tgl,10)],['kategori',x=>s(x.kategori,100)],['jumlah',x=>+x.jumlah||0]]}
const parse=(d:any)=>typeof d==='string'?JSON.parse(d):d

async function upsert(c:PoolConnection,col:string,uid:number,item:any){
  if(!item||typeof item.id!=='string'||item.id.length>40)throw new Error('Data tidak valid')
  const ex=EXTRA[col],names=[...ex.map(e=>e[0]),'data']
  await c.query(`INSERT INTO ${col}(user_id,id,${names.join(',')}) VALUES(?,?,${names.map(()=>'?').join(',')}) ON DUPLICATE KEY UPDATE ${names.map(k=>`${k}=VALUES(${k})`).join(',')}`,
    [uid,item.id,...ex.map(e=>e[1](item)),JSON.stringify(item)])
}
async function putSettings(c:PoolConnection,uid:number,st:any){
  await c.query('INSERT INTO settings(user_id,data) VALUES(?,?) ON DUPLICATE KEY UPDATE data=VALUES(data)',[uid,JSON.stringify(st)])
}

export async function loadAll(uid:number):Promise<DB>{
  const out:any={}
  for(const c of COLS)out[c]=(await q<any>(`SELECT data FROM ${c} WHERE user_id=? ORDER BY seq`,[uid])).map(r=>parse(r.data))
  const st=await q<any>('SELECT data FROM settings WHERE user_id=?',[uid])
  out.settings=st[0]?parse(st[0].data):seed().settings
  return out
}
export async function saveAll(uid:number,data:DB){
  await tx(async c=>{
    for(const col of COLS){
      await c.query(`DELETE FROM ${col} WHERE user_id=?`,[uid])
      for(const it of (data as any)[col])await upsert(c,col,uid,it)
    }
    await putSettings(c,uid,data.settings)
  })
}
export type Op={c:string;up?:any[];del?:string[]}
export async function applyOps(uid:number,ops:Op[]){
  await tx(async c=>{
    for(const op of ops){
      if(op.c==='settings'){const st=op.up?.[0];if(st&&typeof st==='object')await putSettings(c,uid,st);continue}
      if(!(COLS as readonly string[]).includes(op.c))throw new Error('Koleksi tidak valid')
      for(const it of op.up||[])await upsert(c,op.c,uid,it)
      for(const id of op.del||[])if(typeof id==='string')await c.query(`DELETE FROM ${op.c} WHERE user_id=? AND id=?`,[uid,id])
    }
  })
}
export function freshData(opts:{demo:boolean;usaha:string;owner:string;email:string}):DB{
  const d=seed()
  const settings={...d.settings,nama:opts.usaha,owner:opts.owner,email:opts.email,alamat:opts.demo?d.settings.alamat:'',telp:opts.demo?d.settings.telp:''}
  return opts.demo?{...d,settings}:{materials:[],products:[],recipes:[],productions:[],sales:[],expenses:[],settings}
}
