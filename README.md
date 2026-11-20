# manajemen_umkm — Manajemen Produksi UMKM

Aplikasi web untuk usaha produksi kecil: bahan baku, resep & HPP, produksi, produk jadi, penjualan, pengeluaran, dan laporan.
Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts, dengan login dan database **MySQL / MariaDB**.

## Menjalankan
Butuh: Node.js 20.6+ dan MySQL/MariaDB yang sedang menyala (XAMPP, Laragon, atau MySQL biasa).

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env  → isi DB_PASSWORD jika root Anda berpassword
npm run db:init           # membuat database manajemen_umkm + semua tabel dari schema.sql
npm run dev               # http://localhost:3000
```
Alternatif tanpa `db:init`: buka `schema.sql` di phpMyAdmin / HeidiSQL / DBeaver lalu jalankan (import).

Saat `npm run dev`, akun demo dibuat otomatis: **demo@dapurmakmur.id / demo12345**. Atau daftar di `/register`.
Reset data demo: menu Pengaturan Usaha → "Reset Data Demo".

## Database
- Kode SQL ada di **`schema.sql`** (folder root): tabel `users`, `sessions`, `settings`, `materials`, `products`, `recipes`, `productions`, `sales`, `expenses`.
- Tiap tabel modul punya kolom untuk pencarian (nama, tgl, status, dll.) + kolom `data` (JSON) berisi rincian lengkap. Semua tabel memakai `user_id` sehingga data tiap akun terpisah.
- Konfigurasi koneksi lewat `.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). Jika `DB_NAME` diganti, ubah juga nama database di `schema.sql`.
- Frontend bekerja pada satu state; setiap perubahan dibandingkan dengan state sebelumnya, lalu hanya baris yang berubah dikirim ke `POST /api/sync` (satu transaksi).

## Keamanan
Kata sandi di-hash scrypt; sesi = token acak di cookie httpOnly (30 hari, hanya hash token disimpan); 5 login gagal / 15 menit per email dikunci sementara. Set `COOKIE_SECURE=true` bila memakai HTTPS. Akun demo otomatis tidak dibuat di production.

## Struktur
- `schema.sql` skema database · `scripts/init-db.mjs` penyiap database
- `lib/server/*` koneksi MySQL, auth, sinkronisasi · `app/api/*` endpoint · `middleware.ts` pengalihan ke /login
- `lib/seed.ts` data demo · `lib/actions.ts` logika stok/produksi/penjualan · `lib/utils.ts` format & kalkulasi HPP
- `components/ui.tsx` design system · `components/shell.tsx` sidebar & layout · `app/*/page.tsx` halaman
