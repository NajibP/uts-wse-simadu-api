'use strict';

const { AppError } = require('../errors.cjs');

// Endpoint/route yang tidak ada -> 404 dengan format yang sama.
function notFound(req, res, next) {
  next(new AppError(404, 'Endpoint tidak ditemukan'));
}

// Penangan error terpusat. Semua error lewat sini agar format respons konsisten
// dan detail internal (stack trace, pesan sistem) tidak bocor ke client.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // JSON rusak / body terlalu besar dari express.json -> 400 / 413
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Format JSON tidak valid',
    });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(400).json({
      success: false,
      message: 'Body request terlalu besar',
    });
  }

  if (err instanceof AppError) {
    const body = { success: false, message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  // Error tak terduga: catat pesan singkat di server (tanpa header/token), balas generik.
  console.error(`[ERROR] ${req.method} ${req.path} -> ${err && err.message ? err.message : err}`);
  return res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
  });
}

module.exports = { notFound, errorHandler };
