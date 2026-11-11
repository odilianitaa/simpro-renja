# Product Requirements Document (PRD)
# SIMPRO RENJA (Sistem Informasi Manajemen Proposal RENJA)

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Nama Sistem** | SIMPRO RENJA (Sistem Informasi Manajemen Proposal RENJA) |
| **Platform** | Sistem Informasi Berbasis Web |
| **Instansi Pengguna** | BAPPERIDA Kabupaten Banyumas |
| **Tech Stack Utama** | Vite + React (Frontend), Node.js + Express (Backend API), Supabase Cloud (PostgreSQL, Auth, RLS, Storage) |
| **Status Dokumen** | Final Draft v1.0 |

---

## 1. Gambaran Umum & Tujuan Sistem

### 1.1 Latar Belakang & Tujuan Sistem
SIMPRO RENJA dibangun untuk mendukung BAPPERIDA Kabupaten Banyumas dalam mengelola usulan/proposal perencanaan pembangunan daerah yang berasal dari hasil verifikasi SIPD (khususnya usulan berstatus **Ditolak** pada verifikasi awal SIPD untuk diproses lebih lanjut). Tujuan utama sistem meliputi:
1. Membantu pengelolaan proposal perencanaan pembangunan daerah.
2. Mengintegrasikan proses pengelolaan proposal dalam satu sistem.
3. Mempermudah pemantauan perkembangan proposal pada setiap tahapan.
4. Membantu penyimpanan dan pengelolaan data proposal secara lebih terstruktur.

### 1.2 Hasil yang Diharapkan (Indikator Keberhasilan)
* Proses pengelolaan proposal menjadi lebih terstruktur.
* Informasi proposal lebih mudah dicari dan dipantau.
* Setiap pengguna dapat melakukan proses sesuai dengan hak aksesnya.
* Data proposal dan perkembangannya dapat terdokumentasi dalam satu sistem.
* Proses pengelolaan proposal dari verifikasi hingga RENJA menjadi lebih terintegrasi.

---

## 2. Analisis Sumber Data Awal (Import File Excel SIPD)

Berdasarkan struktur data sumber (`Data Verifikasi Pokir SIPD 30062026.xlsx`) yang memiliki **2.996 baris** dan **21 kolom**, sistem menerapkan aturan bisnis khusus pada saat proses *import*:

### 2.1 Distribusi Status Usulan pada File Excel
* **Verifikasi TAPD**: 1.072 usulan (35,78%) — *Diabaikan saat import*
* **Ditolak**: **1.050 usulan (35,05%)** — **Diambil dan dimasukkan otomatis ke dalam SIMPRO RENJA**
* **Verifikasi Perangkat Daerah**: 706 usulan (23,56%) — *Diabaikan saat import*
* **Dibatalkan**: 135 usulan (4,51%) — *Diabaikan saat import*
* **Dikembalikan**: 31 usulan (1,03%) — *Diabaikan saat import*
* **Pengajuan Usulan**: 2 usulan (0,07%) — *Diabaikan saat import*

### 2.2 Penanganan Karakteristik Data `"Ditolak"` (1.050 Baris)
1. **Keunikan ID Usulan**: Kolom `ID USULAN` bersifat 100% unik dan digunakan sebagai *Unique Key* (`id_usulan_sipd`) untuk fitur *Upsert* (mencegah duplikasi data apabila file diimpor ulang).
2. **Penanganan Nilai Kosong (`"-"`) pada `OPD TUJUAN AKHIR`**:
   * Terdapat **80 baris** data berstatus `"Ditolak"` yang memiliki nilai `OPD TUJUAN AKHIR = "-"`.
   * **Aturan Sistem**: Jika `OPD TUJUAN AKHIR` bernilai `"-"`, sistem menggunakan `OPD TUJUAN AWAL` sebagai *fallback* sementara, dan Staff BAPPERIDA dapat menetapkan/mengubah OPD tujuan pada tahap verifikasi.
3. **Penanganan Nilai Kosong (`"-"`) pada `ANGGARAN`**:
   * Sebanyak **1.041 dari 1.050 baris (99,14%)** memiliki nilai `ANGGARAN = "-"`, sedangkan 9 baris memiliki nilai numerik.
   * **Aturan Sistem**: Jika ada angka anggaran dari Excel, angka tersebut dijadikan nilai awal. Selanjutnya, **Anggaran Proposal** diinput/diverifikasi secara resmi oleh Staff BAPPERIDA pada tahap verifikasi.

---

## 3. Hak Akses Pengguna (Role-Based Access Control)

Sistem membagi pengguna ke dalam 4 peran (*role*) dengan kewenangan spesifik:

| Peran Pengguna | Hak Akses & Kewenangan Utama | Kewenangan Input Anggaran |
| :--- | :--- | :--- |
| **Admin** | Mengelola pengguna, mengelola data pendukung sistem (Master OPD), serta melakukan *import* file Excel data verifikasi SIPD ke dalam sistem. | Melihat seluruh data anggaran dan riwayat *import*. |
| **Staff BAPPERIDA** | Mengelola, memverifikasi, memproses (melalui RDP hingga TPAD/RENJA), dan memantau seluruh proposal serta mencetak laporan. | Menginput **Anggaran Proposal** (tahap verifikasi) dan **Anggaran Persetujuan** (tahap proses selanjutnya / TPAD-RENJA). |
| **OPD** | Melihat proposal yang ditujukan kepada OPD terkait serta melakukan input informasi analisis teknis (Sub Kegiatan, Jenis Belanja, Catatan) sesuai kewenangannya. | Menginput **Anggaran Analisis OPD** pada tahap analisis OPD. |
| **Setwan** | Memantau daftar dan detail proposal yang berkaitan dengan proses RDP. | Hanya melihat data terkait proses RDP (*Read-Only*). |

---

## 4. Alur Utama Sistem (End-to-End Workflow)

```text
[Import Excel oleh Admin] 
   │ (Filter Otomatis STATUS == "Ditolak")
   ▼
1. MASUK_SISTEM
   │ (Staff BAPPERIDA memverifikasi data, menetapkan OPD, & menginput Anggaran Proposal)
   ▼
2. TERVERIFIKASI_BAPPERIDA
   │ (Staff BAPPERIDA memproses melalui RDP; Setwan memantau proposal terkait RDP)
   ▼
3. PROSES_RDP  ──►  4. DITERUSKAN_KE_OPD
                       │ (OPD menginput kajian teknis, Sub Kegiatan, & Anggaran Analisis OPD)
                       ▼
                    5. SELESAI_ANALISIS_OPD
                       │ (Staff BAPPERIDA memproses ke TPAD/RENJA & menginput Anggaran Persetujuan)
                       ▼
                    6. MASUK_RENJA / TIDAK_MASUK_RENJA
                       │
                       ▼
              [Pemantauan & Laporan Proposal]
```

### Detail Tahapan Alur Sistem:
1. **Proposal Masuk ke Sistem**: Admin mengunggah file Excel SIPD. Sistem menyaring otomatis proposal berstatus `"Ditolak"` dan menyimpannya dengan status tahapan `MASUK_SISTEM`.
2. **Verifikasi oleh BAPPERIDA**: Staff BAPPERIDA memeriksa detail usulan, memvalidasi OPD tujuan, menambahkan catatan verifikasi, dan menginput **Anggaran Proposal**. Status berubah menjadi `TERVERIFIKASI_BAPPERIDA`.
3. **Proses RDP**: Proposal diproses melalui RDP oleh Staff BAPPERIDA (`PROSES_RDP`). Pihak **Setwan** dapat memantau seluruh proposal yang berada pada proses RDP. Proposal yang telah diproses diteruskan kepada OPD tujuan (`DITERUSKAN_KE_OPD`).
4. **Analisis oleh OPD**: Akun OPD melihat proposal yang ditujukan kepadanya, menginput informasi teknis (Sub Kegiatan, Jenis Belanja, Volume/Satuan hasil kajian, Catatan Analisis), serta menginput **Anggaran Analisis OPD**. Status berubah menjadi `SELESAI_ANALISIS_OPD`.
5. **Proses Menuju TPAD/RENJA**: Staff BAPPERIDA meninjau hasil analisis OPD, menginput **Anggaran Persetujuan**, serta menetapkan status keputusan akhir (`MASUK_RENJA` atau `TIDAK_MASUK_RENJA`).
6. **Pemantauan & Laporan**: Seluruh perkembangan proposal dan perbandingan 3 tahapan anggaran ditampilkan pada dashboard pemantauan dan modul laporan yang dapat diekspor ke Excel (`.xlsx`) dan PDF.

---

## 5. Spesifikasi Kebutuhan Fungsional (Functional Requirements)

| Kode | Fitur Utama | Deskripsi Kebutuhan Fungsional | Aktor |
| :--- | :--- | :--- | :--- |
| **FR-01** | **Pengelolaan Data Proposal & Import Excel** | Mendukung unggah file `.xlsx`, *preview* hasil filter otomatis `STATUS == "Ditolak"`, eksekusi *bulk upsert* berdasarkan `ID USULAN`, serta CRUD data proposal. | Admin, Staff BAPPERIDA |
| **FR-02** | **Detail Informasi Proposal** | Menampilkan seluruh atribut asli SIPD (21 kolom), dokumen lampiran pendukung, status tahapan saat ini, log riwayat perubahan, dan perbandingan 3 nilai anggaran. | Seluruh Peran (sesuai cakupan akses) |
| **FR-03** | **Verifikasi Proposal** | Menyediakan form verifikasi bagi Staff BAPPERIDA untuk memvalidasi OPD tujuan, mengisi catatan verifikasi, dan menginput **Anggaran Proposal**. | Staff BAPPERIDA |
| **FR-04** | **Proses RDP** | Menyediakan form pencatatan hasil RDP dan tombol disposisi/penerusan ke OPD bagi Staff BAPPERIDA, serta tampilan pemantauan khusus bagi Setwan. | Staff BAPPERIDA, Setwan |
| **FR-05** | **Analisis Proposal oleh OPD** | Menyediakan halaman kerja khusus OPD untuk menginput hasil analisis teknis, Sub Kegiatan, Jenis Belanja, dan **Anggaran Analisis OPD** pada proposal yang ditujukan ke OPD-nya. | OPD |
| **FR-06** | **Pengelolaan TPAD/RENJA** | Menyediakan form penetapan akhir TPAD/RENJA bagi Staff BAPPERIDA untuk menginput **Anggaran Persetujuan** dan keputusan akhir RENJA. | Staff BAPPERIDA |
| **FR-07** | **Pengelolaan Anggaran (3-Tier Budgeting)** | Menyimpan secara terpisah 3 tahap anggaran: (1) **Anggaran Proposal** (tahap verifikasi BAPPERIDA), (2) **Anggaran Analisis OPD** (tahap analisis OPD), dan (3) **Anggaran Persetujuan** (tahap proses lanjutan oleh Staff BAPPERIDA). | Staff BAPPERIDA, OPD |
| **FR-08** | **Pencarian dan Filter Proposal** | Menyediakan pencarian kata kunci (*full-text search* pada ID Usulan, Pengusul, Usulan, Lokasi) serta filter berdasarkan Status Tahapan, OPD Tujuan, dan Tahun/Tanggal Usul. | Seluruh Peran |
| **FR-09** | **Pemantauan Status Proposal** | Menampilkan indikator tahapan visual (*stepper/timeline*) pada setiap proposal dan statistik jumlah proposal per tahapan di halaman Dashboard. | Seluruh Peran |
| **FR-10** | **Laporan Proposal** | Menampilkan rekapitulasi proposal lengkap dengan 3 tahapan anggaran serta menyediakan fitur *Export* ke Excel (`.xlsx`) dan PDF. | Staff BAPPERIDA, Admin, OPD, Setwan |

---

## 6. Pemetaan Kolom Excel ke Skema Database (`proposals`)

| No | Kolom pada File Excel | Nama Kolom Database (`proposals`) | Tipe Data PostgreSQL | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `NO` | `no_urut_excel` | `INTEGER` | Nomor urut baris pada file Excel |
| 2 | `ID USULAN` | `id_usulan_sipd` | `BIGINT UNIQUE` | Kunci unik untuk pencegahan duplikasi (*upsert*) |
| 3 | `TANGGAL USUL` | `tanggal_usul` | `DATE` | Dikonversi dari format `DD-MM-YYYY` ke `YYYY-MM-DD` |
| 4 | `PENGUSUL` | `pengusul` | `TEXT` | Nama pengusul pokir/proposal |
| 5 | `USULAN` | `usulan` | `TEXT` | Judul/kamus usulan kegiatan |
| 6 | `MASALAH` | `masalah` | `TEXT` | Uraian permasalahan di lapangan |
| 7 | `ALAMAT LOKASI` | `alamat_lokasi` | `TEXT` | Detail alamat lokasi kegiatan |
| 8 | `USULAN KE` | `usulan_ke` | `VARCHAR(100)` | Instansi tujuan (`Kabupaten / Kota`) |
| 9 | `OPD TUJUAN AWAL` | `opd_tujuan_awal_sipd` | `TEXT` | Nama OPD tujuan awal dari SIPD |
| 10 | `OPD TUJUAN AKHIR` | `opd_tujuan_akhir_sipd` | `TEXT` | Nama OPD tujuan akhir dari SIPD |
| 11 | `STATUS` | `status_sipd` | `VARCHAR(50)` | Bernilai `'Ditolak'` (hasil filter import) |
| 12 | `CATATAN` | `catatan_sipd` | `TEXT` | Catatan verifikasi awal dari SIPD |
| 13 | `REKOMENDASI SEKWAN` | `rekomendasi_sekwan_sipd` | `TEXT` | Rekomendasi Sekwan dari SIPD |
| 14 | `REKOMENDASI MITRA` | `rekomendasi_mitra_sipd` | `TEXT` | Rekomendasi Mitra Bappeda dari SIPD |
| 15 | `REKOMENDASI SKPD` | `rekomendasi_skpd_sipd` | `TEXT` | Rekomendasi SKPD awal dari SIPD |
| 16 | `REKOMENDASI TAPD` | `rekomendasi_tapd_sipd` | `TEXT` | Rekomendasi TAPD awal dari SIPD |
| 17 | `VOLUME` | `volume` | `NUMERIC(15,2)` | Volume usulan awal |
| 18 | `SATUAN` | `satuan` | `VARCHAR(100)` | Satuan volume usulan |
| 19 | `ANGGARAN` | `anggaran_awal_sipd` | `NUMERIC(18,2)` | Nilai anggaran dari Excel (jika tidak `'-'`) |
| 20 | `JENIS BELANJA` | `jenis_belanja` | `VARCHAR(150)` | Jenis belanja (dapat diperbarui oleh OPD) |
| 21 | `SUB KEGIATAN` | `sub_kegiatan` | `TEXT` | Sub kegiatan (dapat diperbarui oleh OPD) |
| 22 | *(Relasi Sistem)* | `opd_id` | `UUID (FK)` | Relasi ke tabel `master_opd` |
| 23 | *(Input BAPPERIDA)* | `anggaran_proposal` | `NUMERIC(18,2)` | Diinput pada tahap Verifikasi BAPPERIDA |
| 24 | *(Input OPD)* | `anggaran_analisis_opd` | `NUMERIC(18,2)` | Diinput oleh OPD pada tahap Analisis OPD |
| 25 | *(Input BAPPERIDA)* | `anggaran_persetujuan` | `NUMERIC(18,2)` | Diinput oleh BAPPERIDA pada tahap TPAD/RENJA |
| 26 | *(Sistem)* | `status_tahapan` | `ENUM` | Status tahapan proposal di dalam SIMPRO RENJA |

---

## 7. Struktur Direktori Sistem

```text
simpro-renja/
├── README.md
├── package.json                        # Konfigurasi workspace monorepo
│
├── supabase/                           # Konfigurasi & Migrasi Database Supabase Cloud
│   ├── config.toml
│   ├── migrations/
│   │   └── 20261105000001_init_simpro_renja.sql  # Skema tabel, ENUM, Trigger, & RLS Policy
│   └── seed.sql                        # Data awal 20 Master OPD Kab. Banyumas
│
├── backend/                            # REST API Server (Node.js + Express)
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js                    # Entry point server Express
│       ├── config/
│       │   └── supabaseClient.js       # Inisialisasi Supabase Service Role Client
│       ├── middlewares/
│       │   ├── authMiddleware.js       # Validasi token JWT Supabase Auth
│       │   ├── roleMiddleware.js       # Guard otorisasi (admin, staff_bapperida, opd, setwan)
│       │   └── uploadMiddleware.js     # Multer memoryStorage untuk unggah file Excel/PDF
│       ├── controllers/
│       │   ├── authController.js       # Profil pengguna & pengecekan sesi aktif
│       │   ├── userController.js       # CRUD pengguna & Master OPD (khusus Admin)
│       │   ├── importController.js     # Parsing Excel SIPD & filter STATUS === 'Ditolak'
│       │   ├── proposalController.js   # Daftar proposal, pencarian, filter, & detail
│       │   ├── workflowController.js   # Transisi Verifikasi, RDP, Analisis OPD, & TPAD/RENJA
│       │   └── reportController.js     # Rekapitulasi laporan & data export
│       ├── routes/
│       │   ├── apiRoutes.js
│       │   ├── userRoutes.js
│       │   ├── proposalRoutes.js
│       │   └── reportRoutes.js
│       └── utils/
│           ├── excelParser.js          # Helper SheetJS untuk pembersihan nilai '-' & mapping OPD
│           └── responseFormatter.js    # Standarisasi format respons JSON
│
└── frontend/                           # Web Client (Vite + React + Tailwind CSS)
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.jsx                    # Entry point React
        ├── App.jsx                     # Konfigurasi React Router & Role-Based Routing
        ├── index.css                   # Konfigurasi Tailwind CSS
        ├── lib/
        │   ├── supabase.js             # Inisialisasi Supabase Client (Frontend)
        │   └── api.js                  # Instance Axios dengan interceptor JWT
        ├── context/
        │   └── AuthContext.jsx         # State manajemen autentikasi & role pengguna
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.jsx         # Menu navigasi dinamis berdasarkan Role
        │   │   ├── Navbar.jsx
        │   │   └── ProtectedRoute.jsx  # Pembatas halaman sesuai hak akses
        │   ├── proposals/
        │   │   ├── ProposalTable.jsx   # Tabel interaktif dengan pencarian & filter
        │   │   ├── StatusTimeline.jsx  # Visualisasi tahapan proposal
        │   │   └── BudgetComparisonCard.jsx # Kartu perbandingan 3 tahap anggaran
        │   └── modals/
        │       ├── ImportExcelModal.jsx     # Preview & eksekusi import data 'Ditolak' (Admin)
        │       ├── VerifyModal.jsx          # Form Verifikasi & Anggaran Proposal (BAPPERIDA)
        │       ├── RdpProcessModal.jsx      # Form Proses RDP & Disposisi OPD (BAPPERIDA)
        │       ├── OpdAnalysisModal.jsx     # Form Analisis & Anggaran OPD (OPD)
        │       └── TpadApprovalModal.jsx    # Form Keputusan TPAD/RENJA & Anggaran Persetujuan
        └── pages/
            ├── auth/
            │   └── LoginPage.jsx
            ├── dashboard/
            │   └── DashboardPage.jsx
            ├── admin/
            │   ├── UserManagementPage.jsx
            │   ├── OpdMasterPage.jsx
            │   └── ImportSipdPage.jsx
            ├── proposals/
            │   ├── ProposalListPage.jsx
            │   └── ProposalDetailPage.jsx
            ├── workflow/
            │   ├── VerificationPage.jsx
            │   ├── RdpMonitoringPage.jsx
            │   ├── OpdWorkspacePage.jsx
            │   └── TpadRenjaPage.jsx
            └── reports/
                └── ReportPage.jsx
```

---

## 8. Rencana Migrasi SQL ke Supabase Cloud

### 8.1 Skrip Migrasi Utama (`supabase/migrations/20261105000001_init_simpro_renja.sql`)

```sql
-- ============================================================================
-- MIGRASI DATABASE SIMPRO RENJA - BAPPERIDA KABUPATEN BANYUMAS
-- Target: Supabase Cloud (PostgreSQL 15+)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Pembuatan ENUM untuk Hak Akses Pengguna & Tahapan Proposal
CREATE TYPE public.user_role AS ENUM (
  'admin',
  'staff_bapperida',
  'opd',
  'setwan'
);

CREATE TYPE public.proposal_stage AS ENUM (
  'MASUK_SISTEM',            -- Baru diimpor oleh Admin (Status Excel: Ditolak)
  'TERVERIFIKASI_BAPPERIDA', -- Telah diverifikasi & diinput Anggaran Proposal oleh BAPPERIDA
  'PROSES_RDP',              -- Sedang dalam pembahasan RDP (dapat dipantau Setwan)
  'DITERUSKAN_KE_OPD',       -- Diteruskan ke OPD tujuan untuk dianalisis
  'SELESAI_ANALISIS_OPD',    -- OPD telah menginput hasil analisis & Anggaran Analisis OPD
  'MASUK_RENJA',             -- Disetujui pada tahap TPAD/RENJA + Anggaran Persetujuan
  'TIDAK_MASUK_RENJA'        -- Tidak disetujui pada tahap akhir TPAD/RENJA
);

-- 2. Tabel Master OPD (Data Pendukung Sistem)
CREATE TABLE public.master_opd (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode_opd VARCHAR(50) UNIQUE,
  nama_opd TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Profiles (Terhubung dengan auth.users milik Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role public.user_role NOT NULL DEFAULT 'opd',
  opd_id UUID REFERENCES public.master_opd(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Riwayat Batch Import Excel SIPD (Oleh Admin)
CREATE TABLE public.import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  total_rows_excel INTEGER NOT NULL DEFAULT 0,
  total_ditolak_imported INTEGER NOT NULL DEFAULT 0,
  imported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Utama Proposals (21 Kolom Excel SIPD + Kolom Alur SIMPRO RENJA)
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,

  -- A. Atribut Asli dari Import File Excel Pokir SIPD
  no_urut_excel INTEGER,
  id_usulan_sipd BIGINT NOT NULL UNIQUE,
  tanggal_usul DATE,
  pengusul TEXT NOT NULL,
  usulan TEXT NOT NULL,
  masalah TEXT,
  alamat_lokasi TEXT,
  usulan_ke VARCHAR(100),
  opd_tujuan_awal_sipd TEXT,
  opd_tujuan_akhir_sipd TEXT,
  status_sipd VARCHAR(50) DEFAULT 'Ditolak',
  catatan_sipd TEXT,
  rekomendasi_sekwan_sipd TEXT,
  rekomendasi_mitra_sipd TEXT,
  rekomendasi_skpd_sipd TEXT,
  rekomendasi_tapd_sipd TEXT,
  volume NUMERIC(15,2),
  satuan VARCHAR(100),
  anggaran_awal_sipd NUMERIC(18,2),
  jenis_belanja VARCHAR(150),
  sub_kegiatan TEXT,

  -- B. Relasi OPD Tujuan Aktif di Sistem
  opd_id UUID REFERENCES public.master_opd(id) ON DELETE SET NULL,

  -- C. Pengelolaan Anggaran 3 Tahap
  anggaran_proposal NUMERIC(18,2),      -- Diinput pada tahap verifikasi BAPPERIDA
  anggaran_analisis_opd NUMERIC(18,2),  -- Diinput oleh OPD pada tahap analisis
  anggaran_persetujuan NUMERIC(18,2),   -- Diinput pada tahap selanjutnya oleh Staff BAPPERIDA

  -- D. Data Proses & Catatan per Tahapan
  status_tahapan public.proposal_stage NOT NULL DEFAULT 'MASUK_SISTEM',

  -- Tahap Verifikasi BAPPERIDA
  catatan_verifikasi_bapperida TEXT,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,

  -- Tahap Proses RDP
  catatan_proses_rdp TEXT,
  catatan_setwan_rdp TEXT,
  rdp_processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rdp_processed_at TIMESTAMPTZ,

  -- Tahap Analisis OPD
  catatan_analisis_opd TEXT,
  volume_analisis_opd NUMERIC(15,2),
  satuan_analisis_opd VARCHAR(100),
  analyzed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  analyzed_at TIMESTAMPTZ,

  -- Tahap Pengelolaan TPAD / RENJA
  catatan_tpad_renja TEXT,
  tpad_decided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tpad_decided_at TIMESTAMPTZ,

  -- Lampiran Dokumen Pendukung (Supabase Storage)
  file_lampiran_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Log Riwayat Status Proposal
CREATE TABLE public.proposal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  from_stage public.proposal_stage,
  to_stage public.proposal_stage NOT NULL,
  anggaran_recorded NUMERIC(18,2),
  catatan TEXT,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Indexing untuk Pencarian & Filter Cepat
CREATE INDEX idx_proposals_id_usulan ON public.proposals(id_usulan_sipd);
CREATE INDEX idx_proposals_status_tahapan ON public.proposals(status_tahapan);
CREATE INDEX idx_proposals_opd_id ON public.proposals(opd_id);
CREATE INDEX idx_proposals_search ON public.proposals USING gin (
  to_tsvector('indonesian', pengusul || ' ' || usulan || ' ' || coalesce(alamat_lokasi, ''))
);

-- 8. Trigger Otomatis Update Kolom updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 9. KEBIJAKAN ROW LEVEL SECURITY (RLS) SUPABASE
-- ============================================================================

ALTER TABLE public.master_opd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_opd_id()
RETURNS UUID AS $$
  SELECT opd_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Kebijakan Akses Baca (SELECT) Proposal Berdasarkan Role
CREATE POLICY "Admin dan Staff BAPPERIDA melihat semua proposal"
ON public.proposals FOR SELECT
USING (public.get_my_role() IN ('admin', 'staff_bapperida'));

CREATE POLICY "Setwan memantau proposal terkait RDP"
ON public.proposals FOR SELECT
USING (
  public.get_my_role() = 'setwan'
  AND status_tahapan IN ('PROSES_RDP', 'DITERUSKAN_KE_OPD', 'SELESAI_ANALISIS_OPD', 'MASUK_RENJA', 'TIDAK_MASUK_RENJA')
);

CREATE POLICY "OPD melihat proposal yang ditujukan ke OPD-nya"
ON public.proposals FOR SELECT
USING (
  public.get_my_role() = 'opd'
  AND opd_id = public.get_my_opd_id()
  AND status_tahapan IN ('DITERUSKAN_KE_OPD', 'SELESAI_ANALISIS_OPD', 'MASUK_RENJA', 'TIDAK_MASUK_RENJA')
);

-- Kebijakan Tambah & Ubah Proposal
CREATE POLICY "Admin dan Staff BAPPERIDA dapat menambah proposal"
ON public.proposals FOR INSERT
WITH CHECK (public.get_my_role() IN ('admin', 'staff_bapperida'));

CREATE POLICY "Staff BAPPERIDA dan OPD terkait dapat mengupdate proposal"
ON public.proposals FOR UPDATE
USING (
  public.get_my_role() IN ('admin', 'staff_bapperida')
  OR (public.get_my_role() = 'opd' AND opd_id = public.get_my_opd_id() AND status_tahapan = 'DITERUSKAN_KE_OPD')
);

-- Kebijakan Akses Tabel Pendukung
CREATE POLICY "Semua pengguna terautentikasi membaca Master OPD"
ON public.master_opd FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin mengelola Master OPD"
ON public.master_opd FOR ALL USING (public.get_my_role() = 'admin');

CREATE POLICY "Pengguna terautentikasi membaca log proposal"
ON public.proposal_logs FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Pengguna terautentikasi menambah log proposal"
ON public.proposal_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### 8.2 Skrip Data Awal Master OPD (`supabase/seed.sql`)

```sql
INSERT INTO public.master_opd (nama_opd) VALUES
  ('Dinas Pemuda, Olahraga, Kebudayaan dan Pariwisata'),
  ('Dinas Perumahan dan Kawasan Permukiman'),
  ('Dinas Pekerjaan Umum'),
  ('Dinas Pertanian'),
  ('Badan Keuangan dan Aset Daerah'),
  ('Dinas Koperasi, Usaha Kecil dan Menengah dan Perdagangan'),
  ('Dinas Pendidikan'),
  ('Badan Kesatuan Bangsa dan Politik'),
  ('Dinas Ketahanan Pangan dan Perikanan'),
  ('Dinas Tenaga Kerja dan Perindustrian'),
  ('Dinas Perhubungan'),
  ('Sekretariat Daerah'),
  ('Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak'),
  ('Dinas Kesehatan dan Keluarga Berencana'),
  ('Dinas Komunikasi dan Informatika'),
  ('Dinas Pemberdayaan Masyarakat dan Desa'),
  ('Dinas Kependudukan Dan Pencatatan Sipil'),
  ('Badan Penanggulangan Bencana Daerah'),
  ('Dinas Arsip dan Perpustakaan Daerah'),
  ('Dinas Lingkungan Hidup')
ON CONFLICT (nama_opd) DO NOTHING;
```

---

## 9. Spesifikasi Versi & Panduan Instalasi Proyek

### 9.1 Spesifikasi Versi Perangkat Lunak Terbaru
* **Node.js**: `v22.14.0 LTS` (atau seri `v22.x LTS` / `v24.x`)
* **npm**: `v10.9.x` / `v11.x`
* **Vite**: `v6.2.x` (`vite@^6.0.0`)
* **React**: `v19.0.x` (`react@^19.0.0`)
* **Supabase JS SDK**: `v2.49.x` (`@supabase/supabase-js@^2.49.0`)

### 9.2 Perintah Instalasi Backend (Node.js + Express)
```bash
mkdir -p simpro-renja/backend
cd simpro-renja/backend
npm init -y
npm pkg set type="module"

# Instalasi paket utama Backend
npm install express cors dotenv @supabase/supabase-js multer xlsx zod
npm install -D nodemon
```

### 9.3 Perintah Instalasi Frontend (Vite + React + Tailwind CSS)
```bash
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install

# Instalasi paket pendukung UI, State, Excel/PDF, & Supabase
npm install @supabase/supabase-js axios @tanstack/react-query react-router-dom xlsx jspdf jspdf-autotable lucide-react tailwindcss @tailwindcss/vite
```

### 9.4 Konfigurasi Environment Variables (`.env`)

**File `backend/.env`:**
```env
PORT=5000
SUPABASE_URL=https://<project-ref-anda>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret-key-anda>
FRONTEND_URL=http://localhost:5173
```

**File `frontend/.env`:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://<project-ref-anda>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key-anda>
```