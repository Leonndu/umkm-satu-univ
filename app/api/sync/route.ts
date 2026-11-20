import {NextResponse} from 'next/server'
import {currentUser} from '@/lib/server/auth'
import {applyOps} from '@/lib/server/data'
import {fail} from '@/lib/server/api'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(req:Request){
  try{
    const u=await currentUser();if(!u)return NextResponse.json({error:'Belum masuk'},{status:401})
    const raw=await req.text();if(raw.length>5_000_000)return NextResponse.json({error:'Data terlalu besar'},{status:413})
    let b:any;try{b=JSON.parse(raw)}catch{return NextResponse.json({error:'Format salah'},{status:400})}
    if(!Array.isArray(b?.ops))return NextResponse.json({error:'Format salah'},{status:400})
    await applyOps(u.id,b.ops);return NextResponse.json({ok:true})
  }catch(e){return fail(e)}
}
