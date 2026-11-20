import {NextResponse} from 'next/server'
import {createSession,createUser} from '@/lib/server/auth'
import {fail} from '@/lib/server/api'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(req:Request){
  const b=await req.json().catch(()=>null)
  const nama=String(b?.nama||'').trim(),usaha=String(b?.usaha||'').trim(),email=String(b?.email||'').trim().toLowerCase(),password=String(b?.password||'')
  const err:any={}
  if(nama.length<2)err.nama='Nama minimal 2 karakter'
  if(usaha.length<2)err.usaha='Nama usaha minimal 2 karakter'
  if(!/^\S+@\S+\.\S+$/.test(email))err.email='Format email tidak valid'
  if(password.length<8)err.password='Kata sandi minimal 8 karakter'
  if(Object.keys(err).length)return NextResponse.json({error:'Periksa isian Anda',fields:err},{status:400})
  try{const id=await createUser({email,nama,password,usaha,demo:!!b?.demo});await createSession(id);return NextResponse.json({ok:true})}
  catch(e){return fail(e)}
}
