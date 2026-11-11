import * as XLSX from 'xlsx';

/**
 * Normalisasi format tanggal ke format ISO YYYY-MM-DD
 * @param {any} rawDate
 * @returns {string|null}
 */
export const normalizeDate = (rawDate) => {
  if (!rawDate || rawDate === '-') return null;

  // Jika berupa Excel Serial Number (misal: 45473)
  if (typeof rawDate === 'number') {
    const parsedDate = XLSX.SSF.parse_date_code(rawDate);
    if (parsedDate) {
      const year = parsedDate.y;
      const month = String(parsedDate.m).padStart(2, '0');
      const day = String(parsedDate.d).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  const str = String(rawDate).trim();

  // Format DD-MM-YYYY atau DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Format YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return null;
};

/**
 * Normalisasi nilai numerik dari teks Excel (membersihkan tanda strip '-', Rp, pemisah ribuan)
 * @param {any} val
 * @returns {number|null}
 */
export const normalizeNumeric = (val) => {
  if (val === undefined || val === null || val === '' || val === '-' || val === ' - ') {
    return null;
  }
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  const cleanStr = String(val)
    .replace(/[^\d.,-]/g, '') // Hapus Rp dan teks lainnya
    .replace(/\./g, '')       // Hapus titik pemisah ribuan
    .replace(',', '.');       // Ubah koma desimal ke titik

  const num = parseFloat(cleanStr);
  return isNaN(num) ? null : num;
};

/**
 * Mencocokkan nama OPD dari Excel dengan Master OPD database
 * @param {string} opdName
 * @param {Array} masterOpdList
 * @returns {object|null}
 */
export const findMatchingOpd = (opdName, masterOpdList = []) => {
  if (!opdName || opdName === '-' || masterOpdList.length === 0) return null;

  const cleanTarget = opdName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Pencocokan tepat (Exact match case-insensitive)
  const exact = masterOpdList.find(o => 
    o.nama_opd.toLowerCase().trim() === opdName.toLowerCase().trim() ||
    (o.kode_opd && o.kode_opd.toLowerCase() === opdName.toLowerCase().trim())
  );
  if (exact) return exact;

  // 2. Pencocokan kemiripan teks (Contains)
  const partial = masterOpdList.find(o => {
    const cleanDbName = o.nama_opd.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanTarget.includes(cleanDbName) || cleanDbName.includes(cleanTarget);
  });

  return partial || null;
};

/**
 * Parser file Excel SIPD utama
 * @param {Buffer} buffer - Buffer file Excel
 * @param {Array} masterOpdList - Daftar Master OPD aktif dari database
 * @returns {object} { summary, proposalsToImport, ignoredRows }
 */
export const parseSipdExcel = (buffer, masterOpdList = []) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Konversi sheet ke array of objects dengan raw: false untuk mendapatkan teks terformat
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '-' });

  const statusCount = {};
  const proposalsToImport = [];
  const ignoredRows = [];
  let fallbackOpdCount = 0;
  let emptyBudgetCount = 0;

  rawRows.forEach((row, index) => {
    // Normalisasi kunci objek (uppercase & trim)
    const normalizedRow = {};
    for (const key of Object.keys(row)) {
      normalizedRow[key.trim().toUpperCase()] = row[key];
    }

    const rawStatus = String(normalizedRow['STATUS'] || '').trim();
    statusCount[rawStatus] = (statusCount[rawStatus] || 0) + 1;

    // PRD Aturan Bisnis 2.1: Hanya baris berstatus "Ditolak" yang diambil
    if (rawStatus.toLowerCase() !== 'ditolak') {
      ignoredRows.push({
        no: normalizedRow['NO'] || index + 1,
        id_usulan: normalizedRow['ID USULAN'],
        status: rawStatus,
        pengusul: normalizedRow['PENGUSUL']
      });
      return;
    }

    // Validasi ID Usulan
    const rawIdUsulan = normalizedRow['ID USULAN'];
    const idUsulanSipd = parseInt(String(rawIdUsulan).replace(/\D/g, ''), 10);
    if (!idUsulanSipd) {
      console.warn(`[Excel Parser] Baris ${index + 1} diabaikan karena ID USULAN tidak valid:`, rawIdUsulan);
      return;
    }

    // PRD Aturan Bisnis 2.2: Penanganan Nilai Kosong ("-") pada OPD TUJUAN AKHIR
    const opdTujuanAwal = String(normalizedRow['OPD TUJUAN AWAL'] || '-').trim();
    let opdTujuanAkhir = String(normalizedRow['OPD TUJUAN AKHIR'] || '-').trim();
    let isOpdFallback = false;

    if (opdTujuanAkhir === '-' || opdTujuanAkhir === '') {
      opdTujuanAkhir = opdTujuanAwal;
      isOpdFallback = true;
      fallbackOpdCount++;
    }

    // Pencocokan ke Master OPD
    const matchedOpd = findMatchingOpd(opdTujuanAkhir, masterOpdList);

    // PRD Aturan Bisnis 2.2: Penanganan Anggaran Kosong ("-")
    const rawAnggaran = normalizedRow['ANGGARAN'];
    const anggaranAwal = normalizeNumeric(rawAnggaran);
    if (anggaranAwal === null) {
      emptyBudgetCount++;
    }

    const proposalObj = {
      no_urut_excel: normalizeNumeric(normalizedRow['NO']) || index + 1,
      id_usulan_sipd: idUsulanSipd,
      tanggal_usul: normalizeDate(normalizedRow['TANGGAL USUL']),
      pengusul: String(normalizedRow['PENGUSUL'] || '-').trim(),
      usulan: String(normalizedRow['USULAN'] || '-').trim(),
      masalah: String(normalizedRow['MASALAH'] || '').trim() || null,
      alamat_lokasi: String(normalizedRow['ALAMAT LOKASI'] || '').trim() || null,
      usulan_ke: String(normalizedRow['USULAN KE'] || '').trim() || null,
      opd_tujuan_awal_sipd: opdTujuanAwal !== '-' ? opdTujuanAwal : null,
      opd_tujuan_akhir_sipd: opdTujuanAkhir !== '-' ? opdTujuanAkhir : null,
      status_sipd: 'Ditolak',
      catatan_sipd: String(normalizedRow['CATATAN'] || '').trim() || null,
      rekomendasi_sekwan_sipd: String(normalizedRow['REKOMENDASI SEKWAN'] || '').trim() || null,
      rekomendasi_mitra_sipd: String(normalizedRow['REKOMENDASI MITRA'] || '').trim() || null,
      rekomendasi_skpd_sipd: String(normalizedRow['REKOMENDASI SKPD'] || '').trim() || null,
      rekomendasi_tapd_sipd: String(normalizedRow['REKOMENDASI TAPD'] || '').trim() || null,
      volume: normalizeNumeric(normalizedRow['VOLUME']),
      satuan: String(normalizedRow['SATUAN'] || '').trim() || null,
      anggaran_awal_sipd: anggaranAwal,
      jenis_belanja: String(normalizedRow['JENIS BELANJA'] || '').trim() || null,
      sub_kegiatan: String(normalizedRow['SUB KEGIATAN'] || '').trim() || null,

      // Atribut Sistem SIMPRO RENJA
      opd_id: matchedOpd ? matchedOpd.id : null,
      status_tahapan: 'MASUK_SISTEM',

      // Metadata pembantu untuk preview
      _meta: {
        isOpdFallback,
        matchedOpdName: matchedOpd ? matchedOpd.nama_opd : null
      }
    };

    proposalsToImport.push(proposalObj);
  });

  return {
    summary: {
      totalRowsExcel: rawRows.length,
      totalDitolak: proposalsToImport.length,
      totalIgnored: ignoredRows.length,
      statusDistribution: statusCount,
      fallbackOpdCount,
      emptyBudgetCount,
      matchedOpdCount: proposalsToImport.filter(p => p.opd_id !== null).length
    },
    proposalsToImport,
    ignoredRows: ignoredRows.slice(0, 50) // Batasi sampel baris yang diabaikan untuk efisiensi respons
  };
};

