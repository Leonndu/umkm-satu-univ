import mysql from 'mysql2/promise'

export const COLS=['materials','products','recipes','productions','sales','expenses'] as const
const g=globalThis as any

export function pool():mysql.Pool{
  return g.__pool||(g.__pool=mysql.createPool({
    host:process.env.DB_HOST||'localhost',port:+(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD??'',
    database:process.env.DB_NAME||'manajemen_umkm',
    ssl:{minVersion:'TLSv1.2'},
    waitForConnections:true,connectionLimit:5,charset:'utf8mb4'}))
}
export async function q<T=any>(sql:string,params:any[]=[]):Promise<T[]>{const [rows]=await pool().query(sql,params);return rows as T[]}
export async function tx<T>(fn:(c:mysql.PoolConnection)=>Promise<T>):Promise<T>{
  const c=await pool().getConnection()
  try{await c.beginTransaction();const r=await fn(c);await c.commit();return r}
  catch(e){await c.rollback();throw e}
  finally{c.release()}
}
