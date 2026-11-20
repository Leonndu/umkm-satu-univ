import {NextResponse} from 'next/server'
import {currentUser} from '@/lib/server/auth'
import {freshData,loadAll,saveAll} from '@/lib/server/data'
import {fail} from '@/lib/server/api'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(){
  try{
    const u=await currentUser();if(!u)return NextResponse.json({error:'Belum masuk'},{status:401})
    const cur=await loadAll(u.id)
    await saveAll(u.id,freshData({demo:true,usaha:cur.settings.nama,owner:cur.settings.owner,email:cur.settings.email}))
    return NextResponse.json(await loadAll(u.id))
  }catch(e){return fail(e)}
}
