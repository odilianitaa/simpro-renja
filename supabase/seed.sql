-- ============================================================================
-- SEED DATA MASTER OPD - BAPPERIDA KABUPATEN BANYUMAS
-- ============================================================================

INSERT INTO public.master_opd (kode_opd, nama_opd) VALUES
  ('DINPORABUDPAR', 'Dinas Pemuda, Olahraga, Kebudayaan dan Pariwisata'),
  ('DINPERKIM', 'Dinas Perumahan dan Kawasan Permukiman'),
  ('DPU', 'Dinas Pekerjaan Umum'),
  ('DINPERTAN', 'Dinas Pertanian'),
  ('BKAD', 'Badan Keuangan dan Aset Daerah'),
  ('DINKUKMP', 'Dinas Koperasi, Usaha Kecil dan Menengah dan Perdagangan'),
  ('DINDIK', 'Dinas Pendidikan'),
  ('BAKESBANGPOL', 'Badan Kesatuan Bangsa dan Politik'),
  ('DINPAPERA', 'Dinas Ketahanan Pangan dan Perikanan'),
  ('DINAKERIN', 'Dinas Tenaga Kerja dan Perindustrian'),
  ('DISHUB', 'Dinas Perhubungan'),
  ('SETDA', 'Sekretariat Daerah'),
  ('DINSOSPERMASDES', 'Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak'),
  ('DINKESKB', 'Dinas Kesehatan dan Keluarga Berencana'),
  ('DINKOMINFO', 'Dinas Komunikasi dan Informatika'),
  ('DINPERMASDES', 'Dinas Pemberdayaan Masyarakat dan Desa'),
  ('DUKCAPIL', 'Dinas Kependudukan Dan Pencatatan Sipil'),
  ('BPBD', 'Badan Penanggulangan Bencana Daerah'),
  ('DINARPOSDA', 'Dinas Arsip dan Perpustakaan Daerah'),
  ('DLH', 'Dinas Lingkungan Hidup')
ON CONFLICT (nama_opd) DO NOTHING;

