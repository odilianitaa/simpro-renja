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

CREATE TRIGGER trg_master_opd_updated_at
BEFORE UPDATE ON public.master_opd
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

CREATE POLICY "Pengguna membaca profil sendiri atau Admin membaca semua profil"
ON public.profiles FOR SELECT USING (auth.uid() = id OR public.get_my_role() = 'admin');

CREATE POLICY "Pengguna mengupdate profil sendiri atau Admin mengupdate semua"
ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.get_my_role() = 'admin');

CREATE POLICY "Admin mengelola semua profiles"
ON public.profiles FOR ALL USING (public.get_my_role() = 'admin');

CREATE POLICY "Pengguna terautentikasi membaca log proposal"
ON public.proposal_logs FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Pengguna terautentikasi menambah log proposal"
ON public.proposal_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin dan Staff BAPPERIDA membaca batch import"
ON public.import_batches FOR SELECT USING (public.get_my_role() IN ('admin', 'staff_bapperida'));

CREATE POLICY "Admin menambah batch import"
ON public.import_batches FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

