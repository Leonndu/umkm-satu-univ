import './globals.css'
import type {Metadata} from 'next'
import {StoreProvider} from '@/lib/store'
import {ToastProvider} from '@/components/ui'
import {Shell} from '@/components/shell'
export const metadata:Metadata={title:'Manajemen UMKM — Produksi, HPP, dan Penjualan',description:'Kelola bahan baku, resep, HPP, produksi, penjualan, dan laba usaha.'}
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="id"><body><StoreProvider><ToastProvider><Shell>{children}</Shell></ToastProvider></StoreProvider></body></html>
}
