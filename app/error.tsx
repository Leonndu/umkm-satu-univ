'use client'
export default function Error({reset}:{error:Error;reset:()=>void}){
  return <div className="grid min-h-screen place-items-center p-6 text-center"><div><h1 className="text-lg font-semibold">Terjadi kesalahan</h1><p className="mt-1 text-sm text-slate-500">Data lokal mungkin rusak. Coba muat ulang, atau hapus data situs di browser untuk mengembalikan data demo.</p><button onClick={reset} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">Coba lagi</button></div></div>
}
