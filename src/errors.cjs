'use strict';

/**
 * Error yang sengaja dilempar aplikasi (pesan aman ditampilkan ke client).
 * Error lain (bug, kegagalan tak terduga) dianggap 500 dan pesannya disembunyikan.
 */
class AppError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

module.exports = { AppError };
