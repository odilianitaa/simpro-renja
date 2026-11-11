/**
 * Standarisasi Respons Sukses API
 * @param {import('express').Response} res
 * @param {any} data
 * @param {string} message
 * @param {number} statusCode
 */
export const successResponse = (res, data = null, message = 'Berhasil memproses permintaan', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standarisasi Respons Error API
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 * @param {any} errors
 */
export const errorResponse = (res, message = 'Terjadi kesalahan pada server', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

/**
 * Standarisasi Respons Pagination API
 * @param {import('express').Response} res
 * @param {Array} data
 * @param {object} pagination { page, limit, totalRows, totalPages }
 * @param {string} message
 */
export const paginationResponse = (res, data, pagination, message = 'Data berhasil dimuat') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: Number(pagination.page) || 1,
      limit: Number(pagination.limit) || 10,
      totalRows: Number(pagination.totalRows) || 0,
      totalPages: Math.ceil((pagination.totalRows || 0) / (pagination.limit || 10))
    }
  });
};

