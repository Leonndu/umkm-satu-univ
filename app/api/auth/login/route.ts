import {NextResponse} from 'next/server'
import {clearFail,createSession,ensureDemo,markFail,tooMany,verifyLogin} from '@/lib/server/auth'
import {fail} from '@/lib/server/api'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(req:Request){
  const b=await req.json().catch(()=>null)
  const email=String(b?.email||'').trim().toLowerCase(),password=String(b?.password||'')
  if(!email||!password)return NextResponse.json({error:'Isi email dan kata sandi'},{status:400})
  if(tooMany(email))return NextResponse.json({error:'Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.'},{status:429})
  try{
    await ensureDemo()
    const u=await verifyLogin(email,password)
    if(!u){markFail(email);return NextResponse.json({error:'Email atau kata sandi salah'},{status:401})}
    clearFail(email);await createSession(u.id)
    return NextResponse.json({ok:true})
  }catch(e){return fail(e)}
}
