# SNAPRINT DIGITAL PRINTING
## Sistem Terintegrasi Rencana Anggaran Biaya (RAB) & Perkiraan Modal Awal Outlet Baru

Aplikasi manajemen finansial dan anggaran berbasis web yang dinamis, modern, dan terintegrasi untuk perencanaan pembukaan cabang baru **Snaprint Digital Printing**. 

Sistem ini mentransformasikan dokumen perencanaan statis (RAB PDF No. Dokumen: `RAB-SNP/2026/04-01`) menjadi sistem aplikasi interaktif yang dapat diedit, disimulasikan secara real-time, dan dicetak kembali menjadi dokumen resmi.

---

### 📊 Ringkasan Finansial Utama

| Komponen Anggaran | Porsi | Nilai Anggaran | Keterangan |
| :--- | :---: | :---: | :--- |
| **01. Interior dan Furniture (Fit-Out)** | 19,79 % | Rp 37.000.000 | Meja Front CS, Meja Produksi, Partisi Ruang Mesin, Pengecatan, AC Split |
| **02. Equipment & Inventori (Mesin)** | 58,56 % | Rp 109.500.000 | DP Mesin Laser A3+, Mesin Potong Elektrik, Roll Laminating, Jilid, PC RIP, POS Kasir, CCTV |
| **03. Marketing Tools & Stok Bahan** | 13,37 % | Rp 25.000.000 | Fascia Neon Box LED, Media Grand Opening, Seragam, Stok Kertas A3+, Consumables |
| **04. Biaya Perizinan & Legalitas** | 2,67 % | Rp 5.000.000 | NIB KBLI Percetakan OSS, Pajak Reklame Daerah, Retribusi Lingkungan |
| **05. Pekerjaan Tambahan & Cadangan** | 5,61 % | Rp 10.500.000 | Tambah Daya Listrik 7.700 VA, Grounding Tembaga (<2Ω), Kontingensi Renovasi |
| **TOTAL ESTIMASI CAPEX (ASET FISIK)** | **100,00 %** | **Rp 187.000.000** | **Total Biaya Pengadaan & Fit-Out Sesuai Dokumen RAB** |
| **Modal Kerja Cadangan (Runway 3 Bulan)** | - | **Rp 107.400.000** | Sewa Ruko (1 thn), Cadangan Gaji 4 Kru (3 bln), Utilitas (3 bln), Petty Cash Buffer |
| **TOTAL PERKIRAAN MODAL AWAL** | - | **Rp 294.400.000** | **Modal Awal Lengkap (CAPEX + Working Capital Aman)** |

---

### 🚀 Cara Menjalankan Aplikasi

Aplikasi dirancang **Zero-Dependency** dan sangat fleksibel:

#### Opsi 1: Menjalankan Live Database Server (Sangat Direkomendasikan)
1. Cukup klik ganda (double-click) file **`start.bat`** pada Windows.
2. Server Node.js akan aktif dan browser otomatis membuka **`http://localhost:3000`**.
3. Seluruh perubahan anggaran, item, dan parameter langsung tersimpan live di file **`data/database.json`** di komputer Anda, serta tersinkronisasi otomatis (*real-time SSE streaming*) ke seluruh tab browser yang sedang terbuka.

#### Opsi 2: Buka File HTML Langsung (Mode Offline)
- Klik kanan file **`index.html`** > pilih **Open with Google Chrome / Microsoft Edge / Firefox**.
- Database tetap terbaca secara live melalui file tersemat **`data/database.js`** dan cache lokal browser.

#### Opsi 3: Terminal / Command Prompt
```bash
node server.js
# Atau menggunakan npm:
npm start
```
Buka browser di: **`http://localhost:3000`**

---

### 💾 Arsitektur Database

Sistem kini dilengkapi basis data multi-format:
1. **`database.sql` / `data/database.sql`**: Skrip skema database relasional lengkap (DDL) + data awal proyek (DML) yang siap diimpor ke MySQL, MariaDB, phpMyAdmin, DBeaver, atau PostgreSQL. Dilengkapi tabel relasi berindeks, foreign keys, serta *helper views* untuk kalkulasi otomatis grand total CAPEX dan burn rate bulanan.
2. **`data/database.json`**: File fisik basis data JSON di disk. Setiap perubahan di aplikasi langsung ditulis ke file ini. Jika Anda mengedit file ini langsung lewat VS Code atau Notepad, server secara otomatis mendeteksi perubahan (*file watcher*) dan memperbarui tampilan web secara live tanpa perlu me-refresh halaman!
3. **`data/database.js`**: Pembungkus JavaScript (`window.LIVE_DATABASE = {...}`) agar database dapat dibaca langsung tanpa terhalang kebijakan keamanan CORS browser ketika dibuka via protokol `file:///`.
4. **Inspektur Database Live**: Terdapat tombol **"Database Live"** di navbar atas untuk melihat, menyunting format JSON, menyalin, atau mengunduh basis data secara transparan.

---

### 🛠️ Modul & Fitur Terintegrasi

1. **Dashboard Eksekutif (Executive Summary)**:
   - Kartu metrik KPI: Total Modal Awal, Total CAPEX, Working Capital, BEP Omset & Lembar Cetak, Estimasi Payback Period.
   - Progress bar realisasi belanja pengadaan (Menunggu vs DP vs Lunas).
   - Grafik interaktif Chart.js: Distribusi CAPEX Donut, Komposisi Modal Awal, dan Kurva Arus Kas Kumulatif 12 Bulan.

2. **RAB Investasi Fisik (CAPEX)**:
   - Seluruh 5 kategori dan 21 item terdata lengkap dari dokumen asli.
   - Tambah Item Baru, Edit Item, Hapus Item dengan kalkulasi subtotal dan grand total otomatis.
   - Filter per kategori, fitur live search pencarian item/spesifikasi.
   - Dropdown status pengadaan per item (`Menunggu`, `Proses DP 50%`, `Lunas/Terpasang`).

3. **Perkiraan Modal Awal (Working Capital & Runway)**:
   - Simulasi 3 Skenario:
     - **Skenario Lean (Minimal)**: Sewa 6 bulan + Runway 1 bulan (~ Rp 245 Jt)
     - **Skenario Moderat (Rekomendasi)**: Sewa 1 tahun + Runway 3 bulan + Buffer Rp 15 Jt (~ Rp 294 Jt)
     - **Skenario Konservatif (Aman Maksimal)**: Sewa 1 tahun + Runway 6 bulan + Buffer Rp 25 Jt (~ Rp 370 Jt)
   - Tabel dinamis roster gaji 4 kru staf (Kasir/CS, 2 Operator RIP, 1 Operator Finishing).
   - Tabel biaya utilitas bulanan (Listrik 7.700 VA, Internet dedicated, pemeliharaan).

4. **Cash Flow Termin Pembayaran (4 Minggu)**:
   - Termin I (Minggu 1 - 25%): DP Interior, Tambah Daya Listrik PLN, Biaya Izin Reklame & NIB
   - Termin II (Minggu 2 - 40%): Pelunasan Interior, DP Mesin Laser A3+, Mesin Potong Elektrik, PC Desain
   - Termin III (Minggu 3 - 25%): Neon Box, Mesin Finishing Pendukung (Laminasi, Jilid), Stok Kertas A3+
   - Termin IV (Minggu 4 - 10%): Trial Cetak, Promosi Grand Opening, Kas Awal (Petty Cash Outlet)
   - Otomatis menghitung ulang nominal rupiah jika total CAPEX berubah.

5. **Simulator Finansial & Analisis BEP**:
   - Slider interaktif volume cetak A3+ per hari (100 - 1.500 lembar).
   - Input harga jual per lembar dan HPP (kertas + toner + laminasi).
   - Perhitungan Titik Impas (Break-Even Point) dalam Rupiah/Bulan dan Lembar Cetak/Hari.
   - Payback Period (Waktu Balik Modal) dan Return on Investment (ROI %).
   - Tabel proyeksi pro-forma laba rugi 12 bulan pertama dengan ramp-up rate operasional.

6. **Cetak & Ekspor Dokumen Resmi**:
   - Preview dokumen format cetak A4.
   - **Halaman 1 & 2**: Sesuai format layout resmi Dokumen RAB PDF Snaprint (termasuk kolom tanda tangan Tim Proyek, Finance, dan Direksi).
   - **Halaman 3**: Dokumen Pelengkap Resmi "Perkiraan Modal Awal & Analisis Kelayakan Usaha".
   - Export ke format **Microsoft Excel (.CSV)**.
   - Fitur **Backup JSON** dan **Restore JSON** untuk mengamankan data anggaran Anda.
   - Tombol **Reset ke Default** jika ingin mengembalikan format ke versi dokumen asli.

---

### 📂 Struktur Direktori

```
RAB SNAPRINT BARU/
│
├── index.html            # Aplikasi web utama (Single Page Application)
├── server.js             # Node.js server lokal (zero external dependency)
├── start.bat             # Launcher satu-klik untuk Windows
├── package.json          # Konfigurasi package & scripts
├── README.md             # Petunjuk teknis dan dokumentasi sistem
│
├── css/
│   └── style.css         # Styling custom, responsive design & print layouts
│
├── js/
│   ├── data.js           # Blueprint data default resmi dari dokumen PDF RAB
│   ├── calculations.js   # Financial engine (CAPEX, OPEX runway, BEP, Payback, ROI)
│   └── app.js            # Controller UI, event handling, CRUD, Chart.js & export
│
└── data/                 # Folder penyimpanan state database lokal
```

---
*Snaprint Digital Printing — Dokumen & Sistem Pengadaan Outlet Baru © 2026*
