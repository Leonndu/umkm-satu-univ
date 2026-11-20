-- =====================================================================
--  manajemen_umkm — skema database MySQL / MariaDB
--  Cara pakai (pilih salah satu):
--    1) Terminal : npm run db:init
--    2) phpMyAdmin / HeidiSQL / DBeaver : import atau jalankan file ini
--    3) CLI      : mysql -u root -p < schema.sql
--  Aman dijalankan berulang (memakai IF NOT EXISTS).
--  Catatan: tiap tabel modul menyimpan kolom penting untuk pencarian
--  (nama, tgl, status, ...) + kolom `data` (JSON) berisi rincian lengkap.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS manajemen_umkm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE manajemen_umkm;

-- Akun pengguna (kata sandi disimpan sebagai hash scrypt, bukan teks asli)
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(190) NOT NULL,
  nama          VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sesi login (yang disimpan hanya hash token, bukan token aslinya)
CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  expires_at BIGINT NOT NULL,
  PRIMARY KEY (token_hash),
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_exp (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pengaturan usaha (1 baris per akun)
CREATE TABLE IF NOT EXISTS settings (
  user_id    INT UNSIGNED NOT NULL,
  data       JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel materials
CREATE TABLE IF NOT EXISTS materials (
  seq        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  id         VARCHAR(40) NOT NULL,
  nama VARCHAR(150) NOT NULL,
  kategori VARCHAR(100) NOT NULL DEFAULT '',
  stok DECIMAL(16,4) NOT NULL DEFAULT 0,
  min_stok DECIMAL(16,4) NOT NULL DEFAULT 0,
  data       JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, id),
  UNIQUE KEY uq_materials_seq (seq),
  INDEX idx_nama (user_id, nama),
  CONSTRAINT fk_materials_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel products
CREATE TABLE IF NOT EXISTS products (
  seq        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  id         VARCHAR(40) NOT NULL,
  nama VARCHAR(150) NOT NULL,
  sku VARCHAR(60) NOT NULL DEFAULT '',
  stok DECIMAL(16,4) NOT NULL DEFAULT 0,
  data       JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, id),
  UNIQUE KEY uq_products_seq (seq),
  INDEX idx_nama (user_id, nama),
  CONSTRAINT fk_products_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel recipes
CREATE TABLE IF NOT EXISTS recipes (
  seq        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  id         VARCHAR(40) NOT NULL,
  nama VARCHAR(150) NOT NULL,
  product_id VARCHAR(40) NOT NULL DEFAULT '',
  data       JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, id),
  UNIQUE KEY uq_recipes_seq (seq),
  INDEX idx_nama (user_id, nama),
  CONSTRAINT fk_recipes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel productions
CREATE TABLE IF NOT EXISTS productions (
  seq        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  id         VARCHAR(40) NOT NULL,
  tgl DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  recipe_id VARCHAR(40) NOT NULL DEFAULT '',
  data       JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, id),
  UNIQUE KEY uq_productions_seq (seq),
  INDEX idx_tgl (user_id, tgl),
  CONSTRAINT fk_productions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel sales
CREATE TABLE IF NOT EXISTS sales (
  seq        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  id         VARCHAR(40) NOT NULL,
  tgl DATE NOT NULL,
  customer VARCHAR(150) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL,
  data       JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, id),
  UNIQUE KEY uq_sales_seq (seq),
  INDEX idx_tgl (user_id, tgl),
  CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel expenses
CREATE TABLE IF NOT EXISTS expenses (
  seq        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  id         VARCHAR(40) NOT NULL,
  nama       VARCHAR(150) NOT NULL DEFAULT '',
  tgl DATE NOT NULL,
  kategori VARCHAR(100) NOT NULL DEFAULT '',
  jumlah DECIMAL(16,2) NOT NULL DEFAULT 0,
  data       JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, id),
  UNIQUE KEY uq_expenses_seq (seq),
  INDEX idx_tgl (user_id, tgl),
  CONSTRAINT fk_expenses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
