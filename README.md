# SIMPRO RENJA (Sistem Informasi Manajemen Proposal RENJA)
### BAPPERIDA Kabupaten Banyumas

Sistem Informasi Manajemen Proposal Perencanaan Pembangunan Daerah berbasis web untuk BAPPERIDA Kabupaten Banyumas. Sistem dirancang khusus untuk mengelola usulan pokok pikiran (pokir) hasil verifikasi SIPD (khususnya usulan berstatus **"Ditolak"**) melalui mekanisme **3-Tier Budgeting** dan **6 Tahapan Alur Disposisi Multi-Role**.

---

## 🏛️ Instansi & Pengguna Sistem
* **Instansi**: BAPPERIDA (Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah) Kabupaten Banyumas
* **Peran Pengguna (RBAC)**:
  1. **Administrator**: Pengelolaan berkas impor SIPD, Master 20 OPD Banyumas, dan manajemen pengguna sistem.
  2. **Staff BAPPERIDA**: Verifikasi kelayakan usulan, input **Anggaran Proposal (Tier 1)**, pembahasan RDP, dan penetapan akhir **Anggaran Persetujuan RENJA (Tier 3)**.
  3. **Perangkat Daerah (OPD)**: Kajian teknis lapangan, penetapan Sub Kegiatan, Jenis Belanja, volume/satuan kajian, dan input **Anggaran Analisis OPD (Tier 2)**.
  4. **Sekretariat DPRD (Setwan)**: Pemantauan pembahasan usulan pokir pada Rapat Dengar Pendapat (RDP) Komisi DPRD secara *read-only*.

---

## 🛠️ Tech Stack Arsitektur

* **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Axios, TanStack Query, SheetJS (XLSX), jsPDF & AutoTable.
* **Backend**: Node.js v20+, Express (ES Modules), Multer, Zod Schema Validation, Supabase JS SDK.
* **Database & Cloud**: Supabase Cloud (PostgreSQL 15+, Supabase Auth, Row Level Security / RLS, Supabase Storage).

---

## 🚀 Panduan Menjalankan Sistem di Lingkungan Lokal

### 1. Cara Cepat (Windows Batch Script)
Cukup klik dua kali (*double click*) pada berkas:
```text
start-dev.bat
```
Script akan otomatis membuka terminal backend (port 5000) dan frontend (port 5173).

---

### 2. Cara Manual (Melalui Terminal)

#### A. Menjalankan Backend API:
```bash
cd backend
npm run dev
```
* Backend aktif di: `http://localhost:5000`
* Health Check: `http://localhost:5000/api/health`

#### B. Menjalankan Frontend Client:
```bash
cd frontend
npm run dev
```
* Frontend aktif di: `http://localhost:5173`

---

## 🔑 Kredensial Akun Bawaan (Default Demo Accounts)

Tersedia tombol **1-Klik Akun Demo** pada halaman login (`http://localhost:5173/login`) untuk memudahkan pengujian:

| Peran (*Role*) | Alamat Email | Kata Sandi | Deskripsi Wewenang |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@banyumaskab.go.id` | `AdminBapperida2026!` | Import SIPD, Master OPD, Kelola Akun |
| **Staff BAPPERIDA** | `staff_bapperida@banyumaskab.go.id` | `StaffBapperida2026!` | Verifikasi usulan, RDP, Penetapan RENJA |
| **Dinas Pertanian (OPD)** | `opd_pertanian@banyumaskab.go.id` | `OpdPertanian2026!` | Kajian teknis usulan Dinas Pertanian |
| **Sekretariat DPRD** | `setwan@banyumaskab.go.id` | `SetwanBanyumas2026!` | Pemantauan tahapan usulan RDP (*Read-Only*) |

---

## 🧪 Perintah Pengujian Otomatis (*Automated Testing Suite*)

Seluruh modul telah dilengkapi pengujian otomatis dari Fase 1 hingga Fase 6:

```bash
# Uji Backend Core, Autentikasi & RBAC (Fase 1)
npm run test:phase1

# Uji Import Excel SIPD & Filter 'Ditolak' (Fase 2)
npm run test:phase2

# Uji Workflow State Machine & 3-Tier Budgeting (Fase 3)
npm run test:phase3

# Uji Engine Rekapitulasi & Dataset Laporan (Fase 5)
npm run test:phase5

# Uji Keamanan Multi-Tenant RLS & Black-Box Testing (Fase 6)
npm run test:security

# Menjalankan Seluruh Uji Coba Sekaligus:
npm run test:all
```

---

## 🌐 Panduan Publikasi ke Cloud (*Production Deployment*)

### 1. Frontend Web Client (Vercel / Netlify)
1. Hubungkan repositori Git proyek ke Vercel atau Netlify.
2. Atur **Root Directory** ke: `frontend`.
3. Atur **Build Command**: `npm run build`
4. Atur **Output Directory**: `dist`
5. Masukkan **Environment Variables**:
   * `VITE_API_BASE_URL`: URL Backend Production Anda (contoh: `https://api-simpro.up.railway.app/api`)
   * `VITE_SUPABASE_URL`: `https://owjjdpxkvnmfalpklsxh.supabase.co`
   * `VITE_SUPABASE_ANON_KEY`: Kunci Anon Supabase Anda.
*(Konfigurasi SPA routing otomatis ditangani oleh `frontend/vercel.json` dan `frontend/public/_redirects`)*.

### 2. Backend REST API Server (Railway / Render / VPS)
1. Hubungkan repositori ke Railway atau Render.
2. Atur **Root Directory** ke: `backend`.
3. Server otomatis mendeteksi [`backend/Dockerfile`](file:///c:/KULIAH/SEMESTER%207/skripsiss/simpro-renja/backend/Dockerfile) atau Node.js buildpack.
4. Masukkan **Environment Variables**:
   * `PORT`: `5000` (atau sesuai penetapan cloud)
   * `NODE_ENV`: `production`
   * `FRONTEND_URL`: URL domain frontend production Anda
   * `SUPABASE_URL`: `https://owjjdpxkvnmfalpklsxh.supabase.co`
   * `SUPABASE_SERVICE_ROLE_KEY`: Kunci secret service role Supabase Anda.

---

## 📚 Dokumen Pendukung Skripsi
* [`prd_simpro_renja.md`](file:///c:/KULIAH/SEMESTER%207/skripsiss/simpro-renja/prd_simpro_renja.md): Dokumen Spesifikasi Kebutuhan Sistem (PRD v1.0).
* [`laporan_pengujian_skripsi_fase6.md`](file:///C:/Users/LENOVO/.gemini/antigravity/brain/aa38e561-0ed7-46e4-9de6-d5a38f73efa6/laporan_pengujian_skripsi_fase6.md): Tabel Matriks Black-Box Testing & UAT untuk Bab IV Skripsi.
