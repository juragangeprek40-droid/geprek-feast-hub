-- =====================================================
-- E-Geprek Juragan Geprek - MySQL Schema + Seed Data
-- Untuk XAMPP / MySQL 5.7+ / MariaDB 10.3+
-- =====================================================
-- Cara pakai:
--   1. Buka phpMyAdmin (http://localhost/phpmyadmin)
--   2. Buat database baru -> pilih -> tab Import -> upload file ini
--   ATAU jalankan: mysql -u root -p < database-mysql.sql
-- =====================================================

DROP DATABASE IF EXISTS egeprek;
CREATE DATABASE egeprek CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE egeprek;

SET FOREIGN_KEY_CHECKS=0;

-- =====================================================
-- TABEL: profiles (data pengguna)
-- =====================================================
CREATE TABLE profiles (
  id            CHAR(36) NOT NULL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  full_name     VARCHAR(255),
  phone         VARCHAR(30),
  address       TEXT,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABEL: user_roles (pelanggan / kurir / admin)
-- =====================================================
CREATE TABLE user_roles (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  user_id    CHAR(36) NOT NULL,
  role       ENUM('pelanggan','kurir','admin') NOT NULL DEFAULT 'pelanggan',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_role (user_id, role),
  CONSTRAINT fk_userroles_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABEL: menus
-- =====================================================
CREATE TABLE menus (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  category       ENUM('paket','satuan','minuman') NOT NULL,
  price          DECIMAL(10,2) NOT NULL,
  promo_price    DECIMAL(10,2) DEFAULT NULL,
  promo_start_at DATETIME DEFAULT NULL,
  promo_end_at   DATETIME DEFAULT NULL,
  image_url      TEXT,
  is_available   TINYINT(1) NOT NULL DEFAULT 1,
  min_portion    INT NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABEL: orders
-- =====================================================
CREATE TABLE orders (
  id                 CHAR(36) NOT NULL PRIMARY KEY,
  order_number       VARCHAR(50) NOT NULL UNIQUE,
  user_id            CHAR(36) DEFAULT NULL,
  courier_id         CHAR(36) DEFAULT NULL,
  customer_name      VARCHAR(255) NOT NULL,
  customer_phone     VARCHAR(30) NOT NULL,
  customer_email     VARCHAR(255),
  delivery_address   TEXT NOT NULL,
  delivery_date      DATE NOT NULL,
  delivery_time      VARCHAR(20),
  notes              TEXT,
  subtotal           DECIMAL(12,2) NOT NULL DEFAULT 0,
  total              DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_proof_url  TEXT,
  status             ENUM('menunggu_pembayaran','pembayaran_diverifikasi','diproses','dalam_pengiriman','selesai','dibatalkan') NOT NULL DEFAULT 'menunggu_pembayaran',
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user    FOREIGN KEY (user_id)    REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_courier FOREIGN KEY (courier_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- TABEL: order_items
-- =====================================================
CREATE TABLE order_items (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  order_id     CHAR(36) NOT NULL,
  menu_id      CHAR(36) DEFAULT NULL,
  menu_name    VARCHAR(255) NOT NULL,
  quantity     INT NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL,
  subtotal     DECIMAL(12,2) NOT NULL,
  spicy_level  ENUM('tidak_pedas','sedang','pedas','sangat_pedas') NOT NULL DEFAULT 'sedang',
  extras       TEXT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_menu  FOREIGN KEY (menu_id)  REFERENCES menus(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- TABEL: feedback (kritik & saran)
-- =====================================================
CREATE TABLE feedback (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255),
  rating     TINYINT NOT NULL,
  message    TEXT NOT NULL,
  user_id    CHAR(36) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- =====================================================
-- TABEL: site_settings
-- =====================================================
CREATE TABLE site_settings (
  `key`      VARCHAR(50) NOT NULL PRIMARY KEY,
  value      JSON NOT NULL,
  updated_by CHAR(36) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABEL: activity_logs (audit trail)
-- =====================================================
CREATE TABLE activity_logs (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  actor_id     CHAR(36) DEFAULT NULL,
  actor_name   VARCHAR(255),
  action_type  VARCHAR(50) NOT NULL,
  entity_type  VARCHAR(50) NOT NULL,
  entity_id    CHAR(36) DEFAULT NULL,
  entity_name  VARCHAR(255),
  details      JSON,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action_type (action_type),
  INDEX idx_entity_type (entity_type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS=1;

-- =====================================================
-- SEED DATA: profiles (super admin + contoh user)
-- Password default: "password123" (bcrypt hash)
-- GANTI hash password sesuai kebutuhan Anda!
-- =====================================================
INSERT INTO profiles (id, email, full_name, phone, address, password_hash) VALUES
('11111111-1111-1111-1111-111111111111','superadmin@juragangeprek.com','Super Admin','085774824148','Jl. Raya Karang Pucung Cimanggu','$2y$10$abcdefghijklmnopqrstuvwx1234567890ABCDEFGHIJKLMNOPQRSTUV'),
('22222222-2222-2222-2222-222222222222','kurir@juragangeprek.com','Kurir Satu','085700000001','-','$2y$10$abcdefghijklmnopqrstuvwx1234567890ABCDEFGHIJKLMNOPQRSTUV'),
('33333333-3333-3333-3333-333333333333','pelanggan@example.com','Pelanggan Contoh','085700000002','-','$2y$10$abcdefghijklmnopqrstuvwx1234567890ABCDEFGHIJKLMNOPQRSTUV');

INSERT INTO user_roles (id, user_id, role) VALUES
(UUID(),'11111111-1111-1111-1111-111111111111','admin'),
(UUID(),'22222222-2222-2222-2222-222222222222','kurir'),
(UUID(),'33333333-3333-3333-3333-333333333333','pelanggan');

-- =====================================================
-- SEED DATA: menus
-- =====================================================
INSERT INTO menus (id, name, description, category, price, image_url, is_available, min_portion) VALUES
-- PAKET
('2fd3c852-acfb-4143-b160-3e2840710630','Paket Hemat','Paket hemat berisikan nasi, chicken dan saos','paket',9000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778136431631-xzlsw0.jfif',1,7),
('1a2e2ec4-ca8f-4e18-9376-918680f688e8','Paket Jumbo','Paket jumbo berisikan nasi, chicken jumbo, sambal dan lalapan','paket',15000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778127668163-jwvpb8.jfif',1,5),
('300d2689-e609-4425-8e1c-08f8035b5e11','Paket Lele Cryspy','Paket lele cryspy berisikan nasi, lele cryspy, sambal dan lalapan','paket',10000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778070508608-f3vsak.jfif',1,5),
('ed9969c3-ff37-4319-86bb-52536a001136','Paket Penyet','Paket penyet berisikan nasi, chicken, sambal dan lalapan','paket',11000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778136548555-1siy6e.jfif',1,7),
('cc13f8f7-4ebe-4192-9fb7-62e294725f56','Paket Reguler','Paket reguler berisikan nasi, chicken, sambal dan lalapan','paket',11000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778136365505-fj6lzp.jfif',1,7),
-- SATUAN
('7438b196-762c-4b89-9a2a-00c7578d15ca','Ayam Penyet','Ayam goreng + sambal + lalapan','satuan',8000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778128035902-5z9qfh.jfif',1,1),
('cd540887-d839-4b29-bbc5-43ecf7f22d4c','Chicken Jumbo Ori','Chicken jumbo + saos','satuan',10000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778128783633-1ppdj1.jfif',1,1),
('35b9e38d-431f-45a9-84a6-3f55bfc85a21','Chicken Ori','Chicken reguler + saos','satuan',7000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778128813377-7qiboh.jfif',1,1),
('7a804701-212b-4b81-aac0-bcc54412a382','Chicken Whole','Ayam goreng satu ekor utuh','satuan',55000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778070592103-kht2qf.jfif',1,1),
('d751bda5-1bb1-4ce0-961e-105e3be83234','Geprek Jumbo','Chicken jumbo + sambal + lalapan','satuan',12000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778129476992-6jcfvq.jfif',1,1),
('16078c76-5acf-45d1-aff7-03be8279e21b','Geprek Reguler','Chicken reguler + sambal + lalapan','satuan',8000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778129844811-9y0cq9.jfif',1,1),
-- MINUMAN
('71131a39-df53-4536-af7a-7e6d0f13d9b3','Es Jeruk',NULL,'minuman',6000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778130050250-dm9x0m.jfif',1,1),
('58fc5ab0-a713-4e3e-b3df-cfece9963630','Es Lemon Tea Jumbo',NULL,'minuman',10000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778062528613-9vk0nk.jfif',1,1),
('163fbf17-c414-4d95-8e77-784438718f4e','Es Lemon Tea Small',NULL,'minuman',5000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778062429184-g26uqu.jfif',1,2),
('62a65cc7-8d77-42b6-a52e-0a9e80c910ca','Es Milo Jumbo',NULL,'minuman',10000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778062731646-rh1rwc.jfif',1,1),
('ebde86ec-462e-4db2-8c8b-4fe910636eac','Es Milo Small',NULL,'minuman',5000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778062693364-m8sxbo.jfif',1,2),
('22aced9d-afc3-481a-b8eb-782dbc026cce','Es Teh',NULL,'minuman',3000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1777954406819-1i2547.jfif',1,5),
('ace0d2ed-d0e9-457e-9076-58b5e957ee1c','Lemon Es Jumbo',NULL,'minuman',10000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778062635916-qxxle1.jfif',1,1),
('2d6e2782-586f-4164-8400-a562eb53d490','Lemon Es Small',NULL,'minuman',5000,'https://mauxbhbnjhnyfakbgyqd.supabase.co/storage/v1/object/public/menu-images/1778062592817-yug3m3.jfif',1,2);

-- =====================================================
-- SEED DATA: site_settings
-- =====================================================
INSERT INTO site_settings (`key`, value) VALUES
('general', '{"site_name":"Juragan Geprek","tagline":"E-Catering Ayam Geprek Otentik","description":"Pesan catering ayam geprek untuk acara perayaan ulang tahun, kumpul keluarga, arisan dan acara-acara lainnya."}'),
('hero',    '{"headline":"Catering Ayam Geprek Otentik untuk Acaramu","subheadline":"Bumbu meresap, sambal nampar, porsi ngenyangin, harga ramah dikantong.","cta_text":"Pesan Sekarang","price_label":"Mulai dari","price_value":"Rp 9.000","price_unit":"/porsi","image_url":""}'),
('contact', '{"phone":"0857-7482-4148","whatsapp":"6285774824148","email":"halo@juragangeprek.com","instagram":"@juragangeprek","address":"Jl. Raya Karang Pucung Cimanggu"}'),
('payment', '{"bank_name":"Dana","account_number":"085774824148","account_holder":"Juragan Geprek","instructions":"Transfer ke rekening di atas, lalu unggah bukti transfer."}');

-- =====================================================
-- SEED DATA: contoh order
-- =====================================================
INSERT INTO orders (id, order_number, user_id, customer_name, customer_phone, customer_email, delivery_address, delivery_date, delivery_time, subtotal, total, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','JG-20260501-001','33333333-3333-3333-3333-333333333333','Pelanggan Contoh','085700000002','pelanggan@example.com','Jl. Contoh No. 1','2026-05-10','12:00',77000,77000,'pembayaran_diverifikasi');

INSERT INTO order_items (id, order_id, menu_id, menu_name, quantity, unit_price, subtotal, spicy_level) VALUES
(UUID(),'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cc13f8f7-4ebe-4192-9fb7-62e294725f56','Paket Reguler',7,11000,77000,'sedang');

-- =====================================================
-- SELESAI
-- Login default: superadmin@juragangeprek.com
-- Ingat: password_hash di atas hanya placeholder.
-- Hash ulang password dengan PHP: password_hash('passwordAnda', PASSWORD_BCRYPT)
-- =====================================================
