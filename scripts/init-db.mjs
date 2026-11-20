// Menjalankan schema.sql ke server MySQL/MariaDB sesuai konfigurasi .env
import fs from 'node:fs'
import mysql from 'mysql2/promise'
const cfg={host:process.env.DB_HOST||'localhost',port:+(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD??'',multipleStatements:true}
try{
  const conn=await mysql.createConnection(cfg)
  await conn.query(fs.readFileSync(new URL('../schema.sql',import.meta.url),'utf8'))
  await conn.end()
  console.log(`✔ Database "manajemen_umkm" siap di ${cfg.host}:${cfg.port}`)
}catch(e){
  console.error('✘ Gagal menyiapkan database:',e.code||'',e.message)
  console.error('  Pastikan MySQL/MariaDB menyala, lalu cek DB_HOST, DB_USER, DB_PASSWORD di file .env')
  process.exit(1)
}
