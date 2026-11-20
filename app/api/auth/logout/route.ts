import {NextResponse} from 'next/server'
import {destroySession} from '@/lib/server/auth'
import {fail} from '@/lib/server/api'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(){try{await destroySession();return NextResponse.json({ok:true})}catch(e){return fail(e)}}
