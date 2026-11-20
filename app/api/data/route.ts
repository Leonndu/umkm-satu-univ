import {NextResponse} from 'next/server'
import {currentUser} from '@/lib/server/auth'
import {loadAll} from '@/lib/server/data'
import {fail} from '@/lib/server/api'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){try{const u=await currentUser();if(!u)return NextResponse.json({error:'Belum masuk'},{status:401});return NextResponse.json(await loadAll(u.id))}catch(e){return fail(e)}}
