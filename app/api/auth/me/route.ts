import {NextResponse} from 'next/server'
import {currentUser} from '@/lib/server/auth'
import {fail} from '@/lib/server/api'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){try{const u=await currentUser();return u?NextResponse.json({user:u}):NextResponse.json({error:'Belum masuk'},{status:401})}catch(e){return fail(e)}}
