import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
// Pemeriksaan cepat: tanpa cookie sesi → ke /login. Validasi sesi sebenarnya dilakukan di API.
export function middleware(req:NextRequest){
  if(!req.cookies.get('dm_session'))return NextResponse.redirect(new URL('/login',req.url))
  return NextResponse.next()
}
export const config={matcher:['/((?!api|_next|login|register|favicon.ico).*)']}
