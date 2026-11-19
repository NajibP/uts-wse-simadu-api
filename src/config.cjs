'use strict';

require('dotenv').config({ quiet: true });

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 16) {
  // Berhenti lebih awal: server tidak boleh jalan tanpa kunci token yang layak.
  throw new Error(
    'JWT_SECRET belum diatur atau terlalu pendek. Salin .env.example menjadi .env lalu isi JWT_SECRET.'
  );
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
};
