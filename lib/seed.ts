import {DB,Expense,Material,Move,Product,Production,Recipe,RExtra,Sale,Unit} from './types'
import {calcRecipe,daysAgo,padId,uid} from './utils'
import {buildProduction} from './actions'

const M=(id:string,nama:string,kategori:string,satuan:Unit,stok:number,harga:number,min:number):Material=>({id,nama,kategori,satuan,stok,harga,min,catatan:'',moves:[],beli:[]})
const E=(nama:string,tipe:RExtra['tipe'],mode:RExtra['mode'],jumlah:number):RExtra=>({id:uid('e'),nama,tipe,mode,jumlah})
const R=(id:string,nama:string,productId:string,batch:number,unit:string,items:[string,number,Unit][],extras:RExtra[],harga:number):Recipe=>({id,nama,productId,batch,unit,items:items.map(([materialId,qty,u])=>({materialId,qty,unit:u})),extras,harga,hist:[]})
const timeline=(rows:{d:number;x:number;a:string}[],now:number,awal='Stok awal'):Move[]=>{
  const ev=[...rows].sort((a,b)=>b.d-a.d);const start=now-ev.reduce((t,e)=>t+e.x,0);let s=Math.max(0,start)
  const out:Move[]=start>0.0001?[{tgl:daysAgo(45),aktivitas:awal,masuk:+start.toFixed(3),keluar:0,sisa:+start.toFixed(3)}]:[]
  for(const e of ev){s+=e.x;out.push({tgl:daysAgo(e.d),aktivitas:e.a,masuk:e.x>0?+e.x.toFixed(3):0,keluar:e.x<0?+(-e.x).toFixed(3):0,sisa:+s.toFixed(3)})}
  return out}

export function seed():DB{
  const materials:Material[]=[
    M('m-singkong','Singkong','Bahan Utama','kg',40,6000,25),M('m-tepung','Tepung Terigu','Bahan Utama','kg',25,12000,10),
    M('m-gula','Gula Pasir','Bahan Tambahan','kg',15,17000,5),M('m-minyak','Minyak Goreng','Bahan Tambahan','L',12,18000,15),
    M('m-balado','Bubuk Balado','Bumbu','kg',3,85000,5),M('m-cabai','Bubuk Cabai','Bumbu','kg',4,70000,2),
    M('m-garam','Garam','Bumbu','kg',6,9000,2),M('m-plastik','Plastik Kemasan','Kemasan','pcs',500,350,600),
    M('m-cokelat','Cokelat Batang','Bahan Utama','kg',8,95000,3),M('m-telur','Telur Ayam','Bahan Utama','kg',10,28000,4),
    M('m-mentega','Mentega','Bahan Tambahan','kg',5,70000,2)]
  const buys:[number,string,number,number][]=[[40,'m-singkong',100,5800],[10,'m-singkong',0,6000],[25,'m-tepung',10,11800],[20,'m-gula',5,16800],[30,'m-minyak',10,17500],[8,'m-minyak',10,18000],
    [18,'m-balado',2,84000],[15,'m-cabai',2,70000],[30,'m-garam',3,9000],[35,'m-plastik',500,340],[20,'m-cokelat',5,94000],[12,'m-telur',6,27500],[14,'m-mentega',3,69000]]
  const products:Product[]=[
    {id:'p-ori',nama:'Keripik Singkong Original',sku:'KS-ORI',kategori:'Keripik',stok:120,unit:'pack',hpp:0,harga:6000,min:30,moves:[]},
    {id:'p-pedas',nama:'Keripik Singkong Pedas',sku:'KS-PDS',kategori:'Keripik',stok:80,unit:'pack',hpp:0,harga:6000,min:30,moves:[]},
    {id:'p-balado',nama:'Keripik Singkong Balado',sku:'KS-BLD',kategori:'Keripik',stok:45,unit:'pack',hpp:0,harga:7000,min:30,moves:[]},
    {id:'p-brownies',nama:'Brownies Cokelat',sku:'BR-CKL',kategori:'Kue',stok:25,unit:'pcs',hpp:0,harga:18000,min:10,moves:[]}]
  const recipes:Recipe[]=[
    R('r-ori','Keripik Singkong Original','p-ori',100,'pack',[['m-singkong',25,'kg'],['m-minyak',4,'L'],['m-garam',300,'g'],['m-plastik',100,'pcs']],[E('Upah pengiris & penggoreng','Tenaga Kerja','tetap',60000),E('Gas LPG & listrik','Gas & Listrik','tetap',30000)],6000),
    R('r-pedas','Keripik Singkong Pedas','p-pedas',100,'pack',[['m-singkong',25,'kg'],['m-minyak',4,'L'],['m-garam',300,'g'],['m-cabai',500,'g'],['m-plastik',100,'pcs']],[E('Upah pengiris & penggoreng','Tenaga Kerja','tetap',60000),E('Gas LPG & listrik','Gas & Listrik','tetap',30000)],6000),
    R('r-balado','Keripik Singkong Balado','p-balado',100,'pack',[['m-singkong',25,'kg'],['m-minyak',4,'L'],['m-garam',300,'g'],['m-balado',1,'kg'],['m-plastik',100,'pcs']],[E('Upah pengiris & penggoreng','Tenaga Kerja','tetap',60000),E('Gas LPG & listrik','Gas & Listrik','tetap',30000)],7000),
    R('r-brownies','Brownies Cokelat','p-brownies',20,'pcs',[['m-cokelat',1,'kg'],['m-telur',1,'kg'],['m-gula',800,'g'],['m-tepung',600,'g'],['m-mentega',500,'g'],['m-plastik',20,'pcs']],[E('Upah pembuat kue','Tenaga Kerja','tetap',40000),E('Gas & listrik oven','Gas & Listrik','tetap',15000)],18000)]
  recipes.forEach(r=>{const h=calcRecipe(r,materials).hpp;r.hist=[{tgl:daysAgo(60),hpp:Math.round(h*0.96),harga:r.harga-500,catatan:'Resep dibuat'},{tgl:daysAgo(20),hpp:Math.round(h),harga:r.harga,catatan:'Harga bahan & harga jual diperbarui'}]
    const p=products.find(x=>x.id===r.productId)!;p.hpp=Math.round(h)})
  const specs:[string,string,number,number,number,number,Production['status']][]=[
    ['PRD-001','r-ori',100,98,2,38,'Selesai'],['PRD-002','r-pedas',60,58,2,27,'Selesai'],['PRD-003','r-brownies',20,20,0,16,'Selesai'],['PRD-004','r-balado',80,78,2,9,'Selesai'],
    ['PRD-005','r-ori',50,50,0,3,'Selesai'],['PRD-006','r-balado',40,0,0,0,'Dalam Proses'],['PRD-007','r-pedas',30,30,0,1,'Selesai'],['PRD-008','r-pedas',30,0,0,5,'Dibatalkan']]
  const productions:Production[]=specs.map(([id,rid,plan,hasil,rusak,d,status])=>{
    const p=buildProduction(recipes.find(r=>r.id===rid)!,materials,plan,daysAgo(d),id);p.status=status
    if(status==='Selesai'){const g=hasil-rusak;p.hasil=hasil;p.rusak=rusak;p.totalBiaya=p.estBiaya;p.hppAktual=p.estBiaya/g;p.timeline.push({tgl:p.tgl,teks:`Produksi selesai: ${g} unit siap jual, ${rusak} rusak`})}
    if(status==='Dalam Proses')p.timeline.push({tgl:p.tgl,teks:'Produksi dimulai'})
    if(status==='Dibatalkan'){p.catatan='Dibatalkan: pesanan ditunda';p.timeline.push({tgl:p.tgl,teks:'Produksi dibatalkan'})}
    return p})
  const dayOf=(id:string)=>specs.find(s=>s[0]===id)![5]
  materials.forEach(m=>{
    const ev=buys.filter(b=>b[1]===m.id&&b[2]>0).map(b=>({d:b[0],x:b[2],a:'Pembelian bahan'}))
    productions.filter(p=>p.status==='Selesai').forEach(p=>{const u=p.usage.find(x=>x.materialId===m.id);if(u)ev.push({d:dayOf(p.id),x:-u.aktual,a:`Dipakai produksi ${p.id}`})})
    m.moves=timeline(ev,m.stok);m.beli=buys.filter(b=>b[1]===m.id&&b[2]>0).map(b=>({tgl:daysAgo(b[0]),qty:b[2],harga:b[3]})).sort((a,b)=>b.tgl.localeCompare(a.tgl))})
  const S:[number,string,[string,number][],number,string,Sale['status']][]=[
    [0,'Warung Bu Siti',[['p-ori',20],['p-pedas',10]],0,'Tunai','Lunas'],[0,'Toko Berkah',[['p-balado',15],['p-ori',10]],0,'Transfer','Lunas'],
    [1,'Ibu Rina (online)',[['p-brownies',6],['p-balado',5]],0,'QRIS','Lunas'],[1,'Kantin SMA 1',[['p-ori',30],['p-pedas',15]],0,'Tunai','Lunas'],
    [2,'Minimarket Sejahtera',[['p-ori',40],['p-pedas',20],['p-balado',20]],0,'Transfer','Lunas'],[3,'Pak Hendra',[['p-brownies',8]],4000,'QRIS','Lunas'],
    [4,'Toko Oleh-oleh Sumsel',[['p-balado',30],['p-ori',20]],0,'Transfer','Lunas'],[5,'Warung Bu Siti',[['p-pedas',15],['p-ori',15]],0,'Tunai','Belum Lunas'],
    [6,'Catering Ibu Ani',[['p-brownies',10]],0,'Transfer','Lunas'],[8,'Toko Berkah',[['p-ori',25],['p-balado',15]],0,'Transfer','Lunas'],
    [12,'Kantin SMA 1',[['p-pedas',20],['p-ori',20]],0,'Tunai','Lunas'],[17,'Minimarket Sejahtera',[['p-ori',30],['p-balado',15]],0,'Transfer','Lunas'],
    [22,'Toko Oleh-oleh Sumsel',[['p-ori',25],['p-pedas',15]],0,'Transfer','Lunas'],[28,'Warung Bu Siti',[['p-ori',20],['p-pedas',10]],0,'Tunai','Lunas']]
  const sales:Sale[]=S.map(([d,customer,its,diskon,metode,status],i)=>({id:padId('TRX',S.length-i),tgl:daysAgo(d),customer,diskon,metode,status,catatan:'',
    items:its.map(([pid,qty])=>{const p=products.find(x=>x.id===pid)!;return {productId:pid,nama:p.nama,qty,harga:p.harga,hpp:p.hpp}})}))
  products.forEach(p=>{
    const ev:{d:number;x:number;a:string}[]=[]
    productions.filter(x=>x.status==='Selesai'&&x.productId===p.id).forEach(x=>ev.push({d:dayOf(x.id),x:x.hasil-x.rusak,a:`Hasil produksi ${x.id}`}))
    S.forEach(([d,,its],i)=>{const it=its.find(x=>x[0]===p.id);if(it)ev.push({d,x:-it[1],a:`Penjualan ${padId('TRX',S.length-i)}`})})
    p.moves=timeline(ev,p.stok)})
  const X=(d:number,nama:string,kategori:string,jumlah:number,metode:string,catatan=''):Expense=>({id:uid('x'),tgl:daysAgo(d),nama,kategori,jumlah,metode,catatan})
  const expenses:Expense[]=[X(2,'Ongkos kirim pesanan online','Transportasi',150000,'Tunai'),X(3,'Tagihan listrik bulanan','Listrik',650000,'Transfer','Listrik rumah produksi'),X(4,'Tagihan air PDAM','Air',120000,'Transfer'),
    X(5,'Gaji 2 karyawan','Gaji Karyawan',2400000,'Transfer','Upah tetap bulanan'),X(6,'Gas LPG 12 kg (2 tabung)','Gas',380000,'Tunai'),X(8,'Iklan Instagram','Pemasaran',250000,'QRIS'),
    X(9,'Alat kebersihan','Lainnya',75000,'Tunai'),X(14,'Wajan besar & spinner minyak','Peralatan',450000,'Transfer'),X(20,'Sewa tempat usaha','Sewa',1500000,'Transfer'),
    X(33,'Tagihan listrik bulan lalu','Listrik',620000,'Transfer'),X(35,'Gaji 2 karyawan','Gaji Karyawan',2400000,'Transfer')]
  return {materials,products,recipes,productions,sales,expenses,settings:{nama:'Dapur Makmur',tipe:'Produksi Makanan & Camilan',owner:'Budi Santoso',email:'budi@dapurmakmur.id',alamat:'Jl. Kenanga No. 12, Palembang, Sumatera Selatan',telp:'0812-3456-7890',mata:'IDR (Rp)',unitDefault:'kg',minDefault:10,logo:''}}
}
