'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config.cjs');
const { AppError } = require('../errors.cjs');

/**
 * AUTENTIKASI: memastikan pemanggil membawa Bearer token yang sah dan belum kedaluwarsa.
 * Gagal -> 401. Token tidak pernah ditulis ke log.
 */
function authenticate(req, res, next) {
  const header = req.get('authorization') || '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);

  if (!match) {
    throw new AppError(401, 'Autentikasi diperlukan. Sertakan header Authorization: Bearer <token>');
  }

  try {
    const payload = jwt.verify(match[1], config.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    // Pesan sama untuk token rusak maupun kedaluwarsa.
    throw new AppError(401, 'Token tidak valid atau sudah kedaluwarsa');
  }
}

/**
 * OTORISASI berbasis role: pengguna sudah login tetapi rolenya belum tentu diizinkan.
 * Gagal -> 403.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'Anda tidak memiliki hak akses untuk operasi ini');
    }
    next();
  };
}

module.exports = { authenticate, authorize };
