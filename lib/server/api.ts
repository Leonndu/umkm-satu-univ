import {NextResponse} from 'next/server'
// Ubah error database menjadi pesan yang jelas bagi pengguna
export function fail(e:any){
  const c=e?.code
  if(c==='ECONNREFUSED'||c==='ENOTFOUND'||c==='ETIMEDOUT')return NextResponse.json({error:'Server database tidak bisa dihubungi. Pastikan MySQL menyala dan isi .env benar.'},{status:503})
  if(c==='ER_ACCESS_DENIED_ERROR')return NextResponse.json({error:'Akses database ditolak. Cek DB_USER dan DB_PASSWORD di .env.'},{status:503})
  if(c==='ER_BAD_DB_ERROR'||c==='ER_NO_SUCH_TABLE')return NextResponse.json({error:'Database belum disiapkan. Jalankan "npm run db:init" atau import schema.sql.'},{status:503})
  if(c==='ER_DUP_ENTRY')return NextResponse.json({error:'Email sudah terdaftar',fields:{email:'Email sudah terdaftar'}},{status:409})
  console.error(e)
  return NextResponse.json({error:e?.message||'Terjadi kesalahan di server'},{status:500})
}
