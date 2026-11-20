import crypto from 'crypto'
import {cookies} from 'next/headers'
import {pool,q} from './db'
import {freshData,saveAll} from './data'

export const COOKIE='dm_session'
const DAY=86400
export const hashPw=(pw:string)=>{const salt=crypto.randomBytes(16);return salt.toString('hex')+':'+crypto.scryptSync(pw,salt,64).toString('hex')}
export const checkPw=(pw:string,stored:string)=>{const [s,h]=stored.split(':');const x=crypto.scryptSync(pw,Buffer.from(s,'hex'),64);const y=Buffer.from(h,'hex');return x.length===y.length&&crypto.timingSafeEqual(x,y)}
const sha=(t:string)=>crypto.createHash('sha256').update(t).digest('hex')
const DUMMY=hashPw('dummy-password')

export async function createSession(uid:number){
  const token=crypto.randomBytes(32).toString('hex')
  await q('DELETE FROM sessions WHERE expires_at<?',[Date.now()])
  await q('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)',[sha(token),uid,Date.now()+30*DAY*1000])
  cookies().set(COOKIE,token,{httpOnly:true,sameSite:'lax',secure:process.env.COOKIE_SECURE==='true',path:'/',maxAge:30*DAY})
}
export async function currentUser():Promise<{id:number;email:string;nama:string}|null>{
  const t=cookies().get(COOKIE)?.value;if(!t)return null
  const r=await q<any>('SELECT u.id,u.email,u.nama,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?',[sha(t)])
  if(!r[0]||Number(r[0].expires_at)<Date.now())return null
  return {id:r[0].id,email:r[0].email,nama:r[0].nama}
}
export async function destroySession(){
  const t=cookies().get(COOKIE)?.value
  if(t)await q('DELETE FROM sessions WHERE token_hash=?',[sha(t)])
  cookies().set(COOKIE,'',{path:'/',maxAge:0})
}
export async function verifyLogin(email:string,pw:string){
  const u=(await q<any>('SELECT * FROM users WHERE email=?',[email]))[0]
  const ok=checkPw(pw,u?u.password_hash:DUMMY)
  return u&&ok?u:null
}
export async function createUser(o:{email:string;nama:string;password:string;usaha:string;demo:boolean}){
  const [res]:any=await pool().query('INSERT INTO users(email,nama,password_hash) VALUES(?,?,?)',[o.email,o.nama,hashPw(o.password)])
  const id=Number(res.insertId)
  await saveAll(id,freshData({demo:o.demo,usaha:o.usaha,owner:o.nama,email:o.email}))
  return id
}
// Akun demo hanya dibuat otomatis saat pengembangan (bukan production)
export async function ensureDemo(){
  if(process.env.NODE_ENV==='production')return
  const n=await q<any>('SELECT COUNT(*) n FROM users')
  if(Number(n[0].n)===0)await createUser({email:'demo@dapurmakmur.id',nama:'Budi Santoso',password:'demo12345',usaha:'Dapur Makmur',demo:true})
}
// Pembatas percobaan login (in-memory): 5 gagal / 15 menit per email
const g=globalThis as any
const fails:Map<string,{n:number;t:number}>=g.__fails||(g.__fails=new Map())
export const tooMany=(k:string)=>{const f=fails.get(k);return !!f&&Date.now()-f.t<900000&&f.n>=5}
export const markFail=(k:string)=>{const f=fails.get(k);fails.set(k,f&&Date.now()-f.t<900000?{n:f.n+1,t:f.t}:{n:1,t:Date.now()})}
export const clearFail=(k:string)=>fails.delete(k)
