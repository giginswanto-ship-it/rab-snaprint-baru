-- ==============================================================================
-- DATABASE SCHEMA & SEED DATA: RAB SNAPRINT DIGITAL PRINTING
-- Sistem Terintegrasi Rencana Anggaran Biaya & Perkiraan Modal Awal Outlet Baru
-- Dokumen No: RAB-SNP/2026/04-01
-- Digenerate otomatis oleh Sistem Live Database Snaprint
-- Waktu Ekspor: 2026-10-20T04:26:09.069Z
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

CREATE DATABASE IF NOT EXISTS `rab_snaprint` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `rab_snaprint`;

DROP VIEW IF EXISTS `v_monthly_burn_rate`;
DROP VIEW IF EXISTS `v_capex_summary`;
DROP VIEW IF EXISTS `v_capex_per_category`;

DROP TABLE IF EXISTS `discount_settings`;
DROP TABLE IF EXISTS `business_plan_propositions`;
DROP TABLE IF EXISTS `business_plan_segments`;
DROP TABLE IF EXISTS `simulation_scenarios`;
DROP TABLE IF EXISTS `financial_simulations`;
DROP TABLE IF EXISTS `utility_costs`;
DROP TABLE IF EXISTS `staff_salaries`;
DROP TABLE IF EXISTS `working_capital_settings`;
DROP TABLE IF EXISTS `cash_flow_schedules`;
DROP TABLE IF EXISTS `capex_items`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `project_meta`;

-- 1. Tabel project_meta
CREATE TABLE `project_meta` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_no` VARCHAR(100) NOT NULL,
  `outlet_location` VARCHAR(255) NOT NULL,
  `project_date` VARCHAR(100) NOT NULL,
  `project_status` VARCHAR(100) NOT NULL DEFAULT 'Persiapan Fisik',
  `target_duration` VARCHAR(100) NOT NULL DEFAULT '4 Minggu',
  `standard_area` VARCHAR(100) NOT NULL DEFAULT '45 – 60 m²',
  `machine_model` VARCHAR(255) NOT NULL,
  `prepared_by` VARCHAR(255) NOT NULL,
  `checked_by` VARCHAR(255) NOT NULL,
  `approved_by` VARCHAR(255) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel categories
CREATE TABLE `categories` (
  `id` VARCHAR(50) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `color` VARCHAR(50) NOT NULL DEFAULT 'blue',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel capex_items
CREATE TABLE `capex_items` (
  `id` VARCHAR(50) NOT NULL,
  `category_id` VARCHAR(50) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `spec` TEXT NOT NULL,
  `vol` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `sat` VARCHAR(50) NOT NULL DEFAULT 'Unit',
  `price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(15,2) GENERATED ALWAYS AS ((`vol` * `price`) - `discount`) STORED,
  `status` ENUM('pending', 'in_progress', 'done') NOT NULL DEFAULT 'pending',
  `notes` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_capex_items_category` (`category_id`),
  CONSTRAINT `fk_capex_items_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel cash_flow_schedules
CREATE TABLE `cash_flow_schedules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `termin` VARCHAR(50) NOT NULL,
  `week` VARCHAR(50) NOT NULL,
  `focus` TEXT NOT NULL,
  `share_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `nominal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending', 'in_progress', 'done') NOT NULL DEFAULT 'pending',
  `payment_date` DATE NULL,
  `ref_no` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel working_capital_settings
CREATE TABLE `working_capital_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `runway_months` INT NOT NULL DEFAULT 3,
  `rent_per_year` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `rent_payment_months` INT NOT NULL DEFAULT 12,
  `rent_deposit` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `petty_cash_buffer` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `marketing_monthly` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel staff_salaries
CREATE TABLE `staff_salaries` (
  `id` VARCHAR(50) NOT NULL,
  `position` VARCHAR(255) NOT NULL,
  `count` INT NOT NULL DEFAULT 1,
  `salary_per_month` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_per_month` DECIMAL(15,2) GENERATED ALWAYS AS (`count` * `salary_per_month`) STORED,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel utility_costs
CREATE TABLE `utility_costs` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `cost_per_month` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabel financial_simulations
CREATE TABLE `financial_simulations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `work_days_per_month` INT NOT NULL DEFAULT 26,
  `daily_a3_prints` INT NOT NULL DEFAULT 450,
  `a3_sell_price` DECIMAL(15,2) NOT NULL DEFAULT 5000.00,
  `a3_hpp_cost` DECIMAL(15,2) NOT NULL DEFAULT 2150.00,
  `daily_outdoor_m2` DECIMAL(10,2) NOT NULL DEFAULT 35.00,
  `outdoor_sell_price` DECIMAL(15,2) NOT NULL DEFAULT 22000.00,
  `outdoor_hpp_cost` DECIMAL(15,2) NOT NULL DEFAULT 9500.00,
  `monthly_other_products_sales` DECIMAL(15,2) NOT NULL DEFAULT 12500000.00,
  `other_products_margin_percent` DECIMAL(5,2) NOT NULL DEFAULT 55.00,
  `target_payback_months` INT NOT NULL DEFAULT 18,
  `active_scenario` VARCHAR(50) NOT NULL DEFAULT 'moderat',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabel simulation_scenarios
CREATE TABLE `simulation_scenarios` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scenario_key` VARCHAR(50) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `daily_a3_prints` INT NOT NULL,
  `daily_outdoor_m2` DECIMAL(10,2) NOT NULL,
  `monthly_other_products_sales` DECIMAL(15,2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_scenarios_key` (`scenario_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabel business_plan_segments
CREATE TABLE `business_plan_segments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `share_percent` DECIMAL(5,2) NOT NULL,
  `description` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tabel business_plan_propositions
CREATE TABLE `business_plan_propositions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `proposition` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Tabel discount_settings
CREATE TABLE `discount_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `type` VARCHAR(50) NOT NULL DEFAULT 'nominal',
  `value` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `label` VARCHAR(255) NOT NULL DEFAULT 'Potongan Khusus Kemitraan / Negosiasi Vendor',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- DATA INSERTIONS
-- ==============================================================================

-- Metadata Dokumen
INSERT INTO `project_meta` (`id`, `document_no`, `outlet_location`, `project_date`, `project_status`, `target_duration`, `standard_area`, `machine_model`, `prepared_by`, `checked_by`, `approved_by`, `notes`) VALUES
(1, 'RAB-SNP/2026/04-01', 'Ruko Sentra Bisnis Utama (Target Outlet)', '16 Oktober 2026', 'Persiapan Fisik', '4 Minggu', '45 – 60 m²', 'Digital A3+ Color & Mesin Outdoor 3.2m', 'Tim Proyek & Pengadaan Snaprint', 'Finance & Operational Manager', 'Direksi / Owner Snaprint Digital Printing', 'Anggaran mencakup seluruh investasi aset awal (CAPEX), perizinan, dan termin pencairan dana pembukaan cabang baru.');

-- Kategori Belanja
INSERT INTO `categories` (`id`, `code`, `name`, `color`, `sort_order`) VALUES
('cat_1', '01', 'Interior dan Furniture (Fit-Out Outlet)', 'sky', 1),
('cat_2', '02', 'Equipment dan Inventori (Hardware & Mesin)', 'blue', 2),
('cat_3', '03', 'Marketing Tools dan Stok Bahan Awal', 'amber', 3),
('cat_4', '04', 'Biaya Lisensi Brand, Perizinan & Legalitas', 'emerald', 4),
('cat_5', '05', 'Pekerjaan Tambahan & Contingency', 'purple', 5);

-- Item Belanja CAPEX
INSERT INTO `capex_items` (`id`, `category_id`, `code`, `name`, `spec`, `vol`, `sat`, `price`, `discount`, `status`, `notes`, `sort_order`) VALUES
('item_1_1', 'cat_1', '1.1', 'Meja Front Counter Kasir & CS', 'Custom HPL finish, slot 2 PC, display glass kartu nama & brosur', 1, 'Unit', 7500000, 0, 'pending', 'Desain ergonomis dengan backdrop logo Snaprint', 1),
('item_1_2', 'cat_1', '1.2', 'Meja Kerja Produksi & Finishing', 'Rangka besi hollow tebal + multiplek 18mm lapis HPL tahan gores & cutter', 2, 'Unit', 2500000, 0, 'pending', 'Ukuran 240x120 cm per unit, dilengkapi cutting mat besar', 2),
('item_1_3', 'cat_1', '1.3', 'Partisi Ruang Mesin & Dinding', 'Gypsum board 9mm rangka hollow, kedap suara parsial + kaca viewing', 1, 'Paket', 6500000, 0, 'pending', 'Memisahkan area produksi bising dengan area customer front office', 3),
('item_1_4', 'cat_1', '1.4', 'Pengecatan Sesuai Brand Guide', 'Cat interior dinding kombinasi warna primer Snaprint (Cyan, Dark Slate, Pure White)', 1, 'Paket', 3200000, 0, 'pending', 'Termasuk plamir dan cat anti-jamur', 4),
('item_1_5', 'cat_1', '1.5', 'Rak Showcase & Display Sample', 'Ambalan rak kayu/besi untuk display kertas & merchandise sampel cetak', 1, 'Set', 3500000, 0, 'pending', 'Spotlight LED untuk katalog sampel kertas premium', 5),
('item_1_6', 'cat_1', '1.6', 'Kursi Kerja & Bangku Tunggu', '4 kursi hidrolik operator + 1 bangku tunggu 3 dudukan customer', 1, 'Paket', 2800000, 0, 'pending', 'Kursi ergonomis mesh jaring untuk kenyamanan kerja', 6),
('item_1_7', 'cat_1', '1.7', 'Tata Udara (Air Conditioner)', 'AC Split 1.5 PK (R. Mesin Suhu Stabil 20-22°C) + AC 1 PK (Front Office)', 2, 'Unit', 4250000, 0, 'pending', 'Penting untuk menjaga kelembaban kertas dan stabilitas laser drum', 7),
('item_2_1', 'cat_2', '2.1', 'Mesin Digital Printing Laser A3+', 'Alokasi DP/Commitment Fee Mesin Produksi Laser Warna (Fuji Xerox/Konica Minolta/Canon)', 1, 'Unit', 55000000, 0, 'pending', 'Skema KSO/Sewa Beli/DP Mesin dengan klik kontrak resmi', 8),
('item_2_2', 'cat_2', '2.2', 'Mesin Potong Kertas Elektrik', 'Digital Guillotine Paper Cutter 45–48 cm auto clamp & safety sensor infrared', 1, 'Unit', 18500000, 0, 'pending', 'Kapasitas potong hingga ketebalan 1 rim (500 lembar)', 9),
('item_2_3', 'cat_2', '2.3', 'Mesin Roll Laminating Panas/Dingin', 'Lebar 36–45 cm dual roller temperature control & anti-curl system', 1, 'Unit', 5500000, 0, 'pending', 'Mendukung roll BOPP Doff, Glossy, dan Hologram 30 micron', 10),
('item_2_4', 'cat_2', '2.4', 'Mesin Jilid Spiral Kawat & Plastik', 'Heavy duty dual pitch puncher & binding machine (Pitch 3:1 & 2:1)', 1, 'Unit', 3800000, 0, 'pending', 'Untuk pembuatan kalender, notebook, agenda, dan laporan tahunan', 11),
('item_2_5', 'cat_2', '2.5', 'Komputer Desain & RIP Operator', 'Core i5/Ryzen 5, RAM 16GB, SSD 512GB, Monitor IPS 24 inch 99% sRGB', 2, 'Set', 8500000, 0, 'pending', '1 unit untuk kasir/customer service + 1 unit dedicated RIP Print Server', 12),
('item_2_6', 'cat_2', '2.6', 'Sistem Kasir & POS Hardware', 'Mini PC Kasir, Printer Thermal 80mm Auto-Cutter, Cash Drawer RJ11, Barcode Scanner 2D', 1, 'Set', 5200000, 0, 'pending', 'Terintegrasi software kasir nota struk dan pencatatan kas harian', 13),
('item_2_7', 'cat_2', '2.7', 'Sistem Keamanan & Network', 'CCTV 4 Channel Full HD + Router Wi-Fi Mikrotik + Gigabit Switch 8 Port', 1, 'Paket', 4500000, 0, 'pending', 'Monitoring via HP 24 jam dan LAN gigabit stabil untuk transfer file besar', 14),
('item_2_8', 'cat_2', '2.8', 'Pembelian Mesin Outdoor 3,2 m', 'Mesin Digital Printing Outdoor Solvent Lebar 3.2 Meter (Printhead Industri Konica Minolta 512i / Starfire 1024), Heavy Duty Chassis, Speed 80–120 m²/jam, RIP Software PhotoPrint/MainTop, Triple Heating System (Front-Middle-Rear) & Automatic Take-Up Media Roller', 1, 'Unit', 125000000, 0, 'pending', 'Pengadaan mesin cetak outdoor format besar 3.2m untuk spanduk, banner flexi frontlite/backlite, baliho, dan sticker outdoor (termasuk instalasi, training teknisi/operator, dan garansi resmi 1 tahun)', 15),
('item_3_1', 'cat_3', '3.1', 'Fascia Signboard & Neon Box', 'Neon Box LED Akrilik Outdoor 300x90 cm + Frame Samping Plat Galvanis & Tiang', 1, 'Paket', 8500000, 0, 'pending', 'Visibilitas tinggi malam hari, hemat daya LED Samsung', 16),
('item_3_2', 'cat_3', '3.2', 'Paket Promosi Grand Opening', 'Spanduk rentang, Standing Banner Roll Up, 2.000 Brosur Promo, Voucher Diskon', 1, 'Paket', 2500000, 0, 'pending', 'Kampanye promosi pembukaan 2 minggu awal', 17),
('item_3_3', 'cat_3', '3.3', 'Seragam & ID Card Staff', 'Polo Shirt Bordir Snaprint (4 personil @ 2 pcs) + Lanyard ID Card Magnetik', 8, 'Stel', 150000, 0, 'pending', 'Standard operational penampilan staf profesional', 18),
('item_3_4', 'cat_3', '3.4', 'Stok Kertas & Media Cetak A3+', 'Art Paper 120/150g, Art Carton 210/260/310g, Sticker Cromo/Vinyl, HVS 80g, Fancy Textured', 1, 'Paket', 9000000, 0, 'pending', 'Buffer stok bahan baku kertas cetak untuk 3-4 minggu awal operasi', 19),
('item_3_5', 'cat_3', '3.5', 'Consumables & Packaging', 'Roll laminasi doff/glossy, spiral kawat no 3-8, paper bag Snaprint, lakban, plastik', 1, 'Paket', 3800000, 0, 'pending', 'Perlengkapan finishing dan kemasan hasil cetak customer', 20),
('item_4_1', 'cat_4', '4.1', 'NIB & KBLI Percetakan (OSS)', 'Nomor Induk Berusaha berbasis risiko via OSS RBA + sertifikat standar percetakan', 1, 'Paket', 1000000, 0, 'pending', 'Legalitas perizinan operasional resmi', 21),
('item_4_2', 'cat_4', '4.2', 'Pajak Reklame & Izin Banner', 'Retribusi pajak daerah papan nama billboard / neon box outdoor 1 tahun pertama', 1, 'Paket', 2500000, 0, 'pending', 'Izin dinas pendapatan daerah / BPBD setempat', 22),
('item_4_3', 'cat_4', '4.3', 'Retribusi & Izin Lingkungan', 'Koordinasi lingkungan sekitar, keamanan, persetujuan tetangga & iuran RT/RW', 1, 'Paket', 1500000, 0, 'pending', 'Kemitraan aman dan kondusif dengan lingkungan toko', 23),
('item_4_4', 'cat_4', '4.4', 'Lisensi Brand & Sistem Snaprint Digital Printing', 'Hak penggunaan merek Snaprint, Brand Guidelines, Standard Operating Procedure (SOP), Sistem POS Kasir Cloud, dan Pelatihan Operasional Staf', 1, 'Paket', 25000000, 5000000, 'pending', 'Paket lisensi kemitraan resmi Snaprint (potongan promo pembukaan cabang Rp 5.000.000)', 24),
('item_5_1', 'cat_5', '5.1', 'Tambah Daya Listrik PLN & Panel', 'Biaya pasang / tambah daya ke 7.700 VA / 11.000 VA + Box Panel MCB pembagi per mesin', 1, 'Paket', 4500000, 0, 'pending', 'Kebutuhan daya stabil mesin laser fuser heater & AC secara simultan', 25),
('item_5_2', 'cat_5', '5.2', 'Grounding Tembaga Mesin (< 2Ω)', 'Pemasangan rod tembaga murni 3-4 meter ke tanah, uji impedansi tanah < 2 Ohm', 1, 'Paket', 1800000, 0, 'pending', 'Syarat mutlak garansi mesin digital laser & proteksi papan sirkuit utama', 26),
('item_5_3', 'cat_5', '5.3', 'Dana Cadangan Renovasi (Contingency)', 'Dana proteksi biaya tak terduga (bocor atap ruko, fitting pipa AC, perbaikan sanitasi)', 1, 'Paket', 4200000, 0, 'pending', 'Alokasi kontingensi 2-3% dari total capex proyek', 27);

-- Jadwal Termin Pencairan Dana
INSERT INTO `cash_flow_schedules` (`id`, `termin`, `week`, `focus`, `share_percent`, `nominal`, `status`, `payment_date`, `ref_no`, `notes`, `sort_order`) VALUES
(1, 'Termin I', 'Minggu 1', 'DP Interior (50%), Tambah Daya PLN, Biaya Izin Reklame & NIB', 25, 46750000, 'done', '2026-10-18', 'TRX-SNP-T1-001', 'Pembayaran DP kontraktor interior & pendaftaran daya PLN', 1),
(2, 'Termin II', 'Minggu 2', 'Pelunasan Interior, DP Mesin Laser A3+, Beli Mesin Potong & PC Desain', 40, 74800000, 'in_progress', '2026-10-25', 'TRX-SNP-T2-002', 'Pencairan terbesar untuk unit mesin produksi utama dan finishing potong', 2),
(3, 'Termin III', 'Minggu 3', 'Pemasangan Neon Box, Mesin Finishing Pendukung, Pembelian Stok Bahan', 25, 46750000, 'pending', '2026-11-01', 'TRX-SNP-T3-003', 'Pemasangan signage luar ruko, mesin laminasi roll, jilid, stok kertas awal', 3),
(4, 'Termin IV', 'Minggu 4', 'Trial Cetak, Media Promosi Grand Opening, Kas Awal (Petty Cash Outlet)', 10, 18700000, 'pending', '2026-11-08', 'TRX-SNP-T4-004', 'Pengujian kalibrasi warna mesin, penyebaran flyer pembukaan dan kas laci kasir', 4);

-- Parameter Modal Kerja
INSERT INTO `working_capital_settings` (`id`, `runway_months`, `rent_per_year`, `rent_payment_months`, `rent_deposit`, `petty_cash_buffer`, `marketing_monthly`) VALUES
(1, 3, 42000000, 12, 5000000, 15000000, 1500000);

-- Roster Gaji Staf
INSERT INTO `staff_salaries` (`id`, `position`, `count`, `salary_per_month`, `sort_order`) VALUES
('sal_1', 'Front Officer / Kasir & CS', 1, 2800000, 1),
('sal_2', 'Operator Desain Grafis & RIP Cetak', 2, 3200000, 2),
('sal_3', 'Operator Finishing, Potong & Packaging', 1, 2700000, 3);

-- Biaya Utilitas Bulanan
INSERT INTO `utility_costs` (`id`, `name`, `cost_per_month`, `sort_order`) VALUES
('utl_1', 'Listrik Bisnis (PLN B2 7.700 VA)', 3200000, 1),
('utl_2', 'Internet Dedicated & Wi-Fi Customer', 550000, 2),
('utl_3', 'Air Bersih, Sampah & Keamanan Lingkungan', 450000, 3),
('utl_4', 'Pemeliharaan AC & Alat Operasional', 600000, 4);

-- Parameter Simulator Finansial
INSERT INTO `financial_simulations` (`id`, `work_days_per_month`, `daily_a3_prints`, `a3_sell_price`, `a3_hpp_cost`, `daily_outdoor_m2`, `outdoor_sell_price`, `outdoor_hpp_cost`, `monthly_other_products_sales`, `other_products_margin_percent`, `target_payback_months`, `active_scenario`) VALUES
(1, 26, 450, 5000, 2150, 35, 22000, 9500, 12500000, 55, 18, 'moderat');

-- Skenario Simulasi
INSERT INTO `simulation_scenarios` (`id`, `scenario_key`, `label`, `daily_a3_prints`, `daily_outdoor_m2`, `monthly_other_products_sales`) VALUES
(1, 'pesimis', 'Skenario Konservatif (Pesimis)', 250, 15, 7000000),
(2, 'moderat', 'Skenario Moderat (Target Normal)', 450, 35, 12500000),
(3, 'optimis', 'Skenario Optimis (High Demand / Peak)', 750, 70, 22000000);

-- Segmentasi Pasar
INSERT INTO `business_plan_segments` (`id`, `name`, `share_percent`, `description`, `sort_order`) VALUES
(1, 'B2B Korporasi & UMKM', 40, 'Brosur, kartu nama, kalender, company profile, sticker label kemasan produk.', 1),
(2, 'Event Organizer & Agensi', 30, 'Spanduk banner 3.2m, backdrop panggung, standing roll-up, merchandise promo.', 2),
(3, 'Institusi, Kampus & Sekolah', 15, 'Sertifikat, buku panduan, modul, laporan tahunan, ID card & lanyard panitia.', 3),
(4, 'Retail & Walk-In Customer', 15, 'Cetak foto, dokumen instan, stiker custom satuan, jilid skripsi & tugas kuliah.', 4);

-- Value Propositions
INSERT INTO `business_plan_propositions` (`id`, `proposition`, `sort_order`) VALUES
(1, 'Dual-Engine Superiority: Mesin Laser A3+ presisi & Mesin Outdoor 3.2m dalam satu atap.', 1),
(2, 'Same-Day Express Service tanpa ketergantungan sub-kontrak pihak ketiga.', 2),
(3, 'Standarisasi Profil Warna ICC untuk akurasi cetak konsisten di setiap media.', 3),
(4, 'Layanan finishing terpadu: laminasi roll panas/dingin, pemotong elektrik, & jilid spiral kawat.', 4);

-- Diskon Global
INSERT INTO `discount_settings` (`id`, `enabled`, `type`, `value`, `label`) VALUES
(1, 0, 'nominal', 0, 'Potongan Khusus Kemitraan / Negosiasi Vendor');

-- ==============================================================================
-- VIEW HELPER UNTUK LAPORAN & KALKULASI CEPAT
-- ==============================================================================

CREATE OR REPLACE VIEW `v_capex_per_category` AS
SELECT 
  c.id AS category_id,
  c.code AS category_code,
  c.name AS category_name,
  c.color,
  COUNT(i.id) AS total_items,
  COALESCE(SUM(i.subtotal), 0) AS total_amount
FROM `categories` c
LEFT JOIN `capex_items` i ON c.id = i.category_id
GROUP BY c.id, c.code, c.name, c.color, c.sort_order
ORDER BY c.sort_order ASC;

CREATE OR REPLACE VIEW `v_capex_summary` AS
SELECT 
  COUNT(id) AS total_all_items,
  SUM(subtotal) AS gross_capex_total,
  (SELECT COALESCE(value, 0) FROM `discount_settings` WHERE `enabled` = 1 LIMIT 1) AS global_discount,
  SUM(subtotal) - COALESCE((SELECT CASE WHEN `type` = 'percent' THEN (SUM(subtotal) * `value` / 100) ELSE `value` END FROM `discount_settings` WHERE `enabled` = 1 LIMIT 1), 0) AS net_capex_total
FROM `capex_items`;

CREATE OR REPLACE VIEW `v_monthly_burn_rate` AS
SELECT 
  (SELECT SUM(total_per_month) FROM `staff_salaries`) AS total_monthly_salaries,
  (SELECT SUM(cost_per_month) FROM `utility_costs`) AS total_monthly_utilities,
  (SELECT rent_per_year / 12 FROM `working_capital_settings` LIMIT 1) AS monthly_rent_equivalent,
  (SELECT marketing_monthly FROM `working_capital_settings` LIMIT 1) AS monthly_marketing,
  (
    COALESCE((SELECT SUM(total_per_month) FROM `staff_salaries`), 0) +
    COALESCE((SELECT SUM(cost_per_month) FROM `utility_costs`), 0) +
    COALESCE((SELECT rent_per_year / 12 FROM `working_capital_settings` LIMIT 1), 0) +
    COALESCE((SELECT marketing_monthly FROM `working_capital_settings` LIMIT 1), 0)
  ) AS total_monthly_opex;

SET FOREIGN_KEY_CHECKS = 1;
