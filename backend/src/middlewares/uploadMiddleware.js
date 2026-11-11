import multer from 'multer';

// Konfigurasi penyimpanan memori (RAM) untuk pemrosesan file cepat
const storage = multer.memoryStorage();

// Filter berkas Excel untuk modul import SIPD
const excelFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel',                                         // .xls
    'application/octet-stream'
  ];

  if (
    allowedMimes.includes(file.mimetype) ||
    file.originalname.endsWith('.xlsx') ||
    file.originalname.endsWith('.xls')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Hanya berkas Excel (.xlsx / .xls) yang diperbolehkan!'), false);
  }
};

export const uploadExcel = multer({
  storage,
  fileFilter: excelFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // Maksimum 25 MB (cukup untuk ribuan baris Excel)
  }
});

export const uploadAttachment = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Maksimum 10 MB untuk PDF pendukung
  }
});

