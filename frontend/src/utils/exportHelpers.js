import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatRupiah = (val) => {
  if (!val || isNaN(val)) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

/**
 * 1. EKSPOR LAPORAN KE EXCEL (.xlsx)
 */
export const exportProposalsToExcel = (data = [], filterInfo = {}) => {
  if (data.length === 0) {
    alert('Tidak ada data usulan untuk diekspor');
    return;
  }

  // Siapkan baris header dinas
  const exportRows = [
    ['PEMERINTAH KABUPATEN BANYUMAS'],
    ['BADAN PERENCANAAN PEMBANGUNAN, RISET DAN INOVASI DAERAH (BAPPERIDA)'],
    ['LAPORAN REKAPITULASI PROPOSAL PERENCANAAN PEMBANGUNAN (SIMPRO RENJA)'],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
    [] // Baris kosong
  ];

  // Header Kolom Tabel
  const headers = [
    'No',
    'ID Usulan SIPD',
    'Tanggal Usul',
    'Pengusul',
    'Judul Usulan',
    'Alamat Lokasi',
    'Volume & Satuan',
    'OPD Penanggung Jawab',
    'Sub Kegiatan',
    'Jenis Belanja',
    'Anggaran Awal SIPD (Rp)',
    'Anggaran Proposal Tier 1 (Rp)',
    'Anggaran Analisis OPD Tier 2 (Rp)',
    'Anggaran Persetujuan RENJA Tier 3 (Rp)',
    'Status Tahapan',
    'Catatan Pertimbangan'
  ];
  exportRows.push(headers);

  // Isi Data
  data.forEach((item, idx) => {
    exportRows.push([
      idx + 1,
      item.id_usulan_sipd,
      item.tanggal_usul,
      item.pengusul,
      item.usulan,
      item.alamat_lokasi,
      item.volume_satuan,
      item.nama_opd,
      item.sub_kegiatan,
      item.jenis_belanja,
      item.anggaran_awal_sipd || 0,
      item.anggaran_proposal || 0,
      item.anggaran_analisis_opd || 0,
      item.anggaran_persetujuan || 0,
      item.status_tahapan,
      item.catatan_terakhir
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(exportRows);

  // Atur lebar kolom agar rapi
  ws['!cols'] = [
    { wch: 5 },   // No
    { wch: 15 },  // ID
    { wch: 13 },  // Tanggal
    { wch: 25 },  // Pengusul
    { wch: 40 },  // Usulan
    { wch: 25 },  // Alamat
    { wch: 15 },  // Volume
    { wch: 35 },  // OPD
    { wch: 35 },  // Sub Kegiatan
    { wch: 25 },  // Jenis Belanja
    { wch: 18 },  // Anggaran Awal
    { wch: 20 },  // Tier 1
    { wch: 20 },  // Tier 2
    { wch: 22 },  // Tier 3
    { wch: 24 },  // Status
    { wch: 40 }   // Catatan
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi SIMPRO RENJA');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Laporan_SIMPRO_RENJA_Banyumas_${dateStr}.xlsx`);
};

/**
 * 2. EKSPOR LAPORAN KE DOKUMEN PDF DINAS RESMI (Format Landscape Standar Pemerintah)
 */
export const exportProposalsToPdf = (data = [], filterInfo = {}) => {
  if (data.length === 0) {
    alert('Tidak ada data usulan untuk diekspor');
    return;
  }

  // Buat dokumen PDF Landscape A4
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // KOP SURAT DINAS PEMKAB BANYUMAS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PEMERINTAH KABUPATEN BANYUMAS', pageWidth / 2, 14, { align: 'center' });
  doc.setFontSize(14);
  doc.text('BADAN PERENCANAAN PEMBANGUNAN, RISET DAN INOVASI DAERAH (BAPPERIDA)', pageWidth / 2, 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Jl. Prof. Dr. Suharso No. 45, Purwokerto, Jawa Tengah 53114 | Telp: (0281) 632540', pageWidth / 2, 25, { align: 'center' });

  // Garis Pembatas Kop Surat
  doc.setLineWidth(0.8);
  doc.line(14, 28, pageWidth - 14, 28);
  doc.setLineWidth(0.2);
  doc.line(14, 29, pageWidth - 14, 29);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('REKAPITULASI USULAN PROPOSAL PERENCANAAN PEMBANGUNAN (SIMPRO RENJA)', pageWidth / 2, 36, { align: 'center' });

  // Metadata Tanggal Cetak
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')} | Total Usulan Terlampir: ${data.length}`, 14, 43);

  // Siapkan Data Tabel AutoTable
  const tableHeaders = [
    ['No', 'ID SIPD', 'Pengusul', 'Rincian Usulan', 'OPD Tujuan', 'Angg. Proposal (T1)', 'Angg. Analisis (T2)', 'Angg. RENJA (T3)', 'Status']
  ];

  const tableBody = data.map((item, idx) => [
    idx + 1,
    `#${item.id_usulan_sipd}`,
    item.pengusul,
    item.usulan,
    item.nama_opd,
    formatRupiah(item.anggaran_proposal),
    formatRupiah(item.anggaran_analisis_opd),
    formatRupiah(item.anggaran_persetujuan),
    item.status_tahapan.replace(/_/g, ' ')
  ]);

  autoTable(doc, {
    head: tableHeaders,
    body: tableBody,
    startY: 46,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175], // Deep Blue BAPPERIDA
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 18 },
      2: { cellWidth: 35 },
      3: { cellWidth: 65 },
      4: { cellWidth: 42 },
      5: { halign: 'right', cellWidth: 26 },
      6: { halign: 'right', cellWidth: 26 },
      7: { halign: 'right', cellWidth: 26 },
      8: { halign: 'center', cellWidth: 23 }
    },
    didDrawPage: (data) => {
      // Footer Nomor Halaman
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount}`,
        pageWidth - 25,
        doc.internal.pageSize.getHeight() - 8
      );
    }
  });

  // Bagian Tanda Tangan Pengesahan (Halaman Terakhir)
  const finalY = doc.lastAutoTable.finalY + 10;
  if (finalY < doc.internal.pageSize.getHeight() - 40) {
    const signX = pageWidth - 70;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Purwokerto, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, signX, finalY);
    doc.text('Kepala BAPPERIDA', signX, finalY + 5);
    doc.text('Kabupaten Banyumas', signX, finalY + 9);
    doc.text('( .................................................... )', signX, finalY + 28);
    doc.text('NIP. ...............................................', signX, finalY + 33);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Laporan_Resmi_SIMPRO_RENJA_${dateStr}.pdf`);
};

