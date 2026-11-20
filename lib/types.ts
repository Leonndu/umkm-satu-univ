export type Unit='g'|'kg'|'ml'|'L'|'pcs'|'pack'|'botol'
export interface Move{tgl:string;aktivitas:string;masuk:number;keluar:number;sisa:number}
export interface Material{id:string;nama:string;kategori:string;satuan:Unit;stok:number;harga:number;min:number;catatan?:string;moves:Move[];beli:{tgl:string;qty:number;harga:number}[]}
export interface RItem{materialId:string;qty:number;unit:Unit}
export interface RExtra{id:string;nama:string;tipe:'Tenaga Kerja'|'Gas & Listrik'|'Kemasan'|'Overhead Lain';mode:'tetap'|'per unit';jumlah:number}
export interface Recipe{id:string;nama:string;productId:string;batch:number;unit:string;items:RItem[];extras:RExtra[];harga:number;hist:{tgl:string;hpp:number;harga:number;catatan:string}[]}
export interface Product{id:string;nama:string;sku:string;kategori:string;stok:number;unit:string;hpp:number;harga:number;min:number;moves:Move[]}
export interface Usage{materialId:string;nama:string;unit:Unit;rencana:number;aktual:number;harga:number}
export type PStatus='Draft'|'Dalam Proses'|'Selesai'|'Dibatalkan'
export interface Production{id:string;recipeId:string;productId:string;nama:string;rencana:number;hasil:number;rusak:number;tgl:string;status:PStatus;usage:Usage[];biayaBahan:number;biayaLain:number;biayaTambahan:number;biayaWaste:number;estBiaya:number;totalBiaya:number;hppAktual:number;catatan:string;snapshot:{batch:number;unit:string;items:{nama:string;qty:number;unit:string}[];extras:RExtra[]};timeline:{tgl:string;teks:string}[]}
export interface SaleItem{productId:string;nama:string;qty:number;harga:number;hpp:number}
export interface Sale{id:string;tgl:string;customer:string;items:SaleItem[];diskon:number;metode:string;status:'Lunas'|'Belum Lunas';catatan:string}
export interface Expense{id:string;tgl:string;nama:string;kategori:string;jumlah:number;metode:string;catatan:string}
export interface Settings{nama:string;tipe:string;owner:string;email:string;alamat:string;telp:string;mata:string;unitDefault:Unit;minDefault:number;logo:string}
export interface DB{materials:Material[];products:Product[];recipes:Recipe[];productions:Production[];sales:Sale[];expenses:Expense[];settings:Settings}
