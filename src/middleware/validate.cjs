'use strict';

const { AppError } = require('../errors.cjs');

const KATEGORI = ['Fasilitas', 'Akademik', 'TI'];
const STATUS = ['diajukan', 'diproses', 'selesai'];

function bodyObject(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'Body request harus berupa objek JSON', [
      { field: 'body', message: 'Kirim JSON dengan header Content-Type: application/json' },
    ]);
  }
  return body;
}

// Tolak field di luar daftar (mis. id, mahasiswaId, status, createdAt dari client).
function checkUnknownFields(body, allowed, errors) {
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) {
      errors.push({ field: key, message: 'Field tidak diperbolehkan' });
    }
  }
}

function checkString(body, field, { min = 1, max, errors }) {
  const value = body[field];
  if (value === undefined || value === null) {
    errors.push({ field, message: 'Field wajib diisi' });
    return;
  }
  if (typeof value !== 'string') {
    errors.push({ field, message: 'Harus berupa string' });
    return;
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    errors.push({ field, message: trimmed.length === 0 ? 'Field tidak boleh kosong' : `Minimal ${min} karakter` });
    return;
  }
  if (trimmed.length > max) {
    errors.push({ field, message: `Maksimal ${max} karakter` });
    return;
  }
  body[field] = trimmed;
}

function checkEnum(body, field, allowed, errors) {
  const value = body[field];
  if (value === undefined || value === null || value === '') {
    errors.push({ field, message: 'Field wajib diisi' });
    return;
  }
  if (typeof value !== 'string' || !allowed.includes(value)) {
    errors.push({ field, message: `Nilai harus salah satu dari: ${allowed.join(', ')}` });
  }
}

function finish(errors, next) {
  if (errors.length > 0) {
    throw new AppError(400, 'Validasi gagal', errors);
  }
  next();
}

function validateLogin(req, res, next) {
  const body = bodyObject(req.body);
  const errors = [];
  checkUnknownFields(body, ['username', 'password'], errors);
  checkString(body, 'username', { max: 50, errors });
  checkString(body, 'password', { max: 100, errors });
  finish(errors, next);
}

function validatePengaduanBody(req, res, next) {
  const body = bodyObject(req.body);
  const errors = [];
  checkUnknownFields(body, ['judul', 'kategori', 'deskripsi'], errors);
  checkString(body, 'judul', { min: 3, max: 120, errors });
  checkEnum(body, 'kategori', KATEGORI, errors);
  checkString(body, 'deskripsi', { min: 5, max: 2000, errors });
  finish(errors, next);
}

function validateStatusBody(req, res, next) {
  const body = bodyObject(req.body);
  const errors = [];
  checkUnknownFields(body, ['status'], errors);
  checkEnum(body, 'status', STATUS, errors);
  finish(errors, next);
}

// Parameter :id harus bilangan bulat positif. Hasilnya diubah menjadi Number.
function validateIdParam(req, res, next) {
  const raw = req.params.id;
  if (!/^[1-9]\d{0,9}$/.test(raw)) {
    throw new AppError(400, 'Validasi gagal', [
      { field: 'id', message: 'ID harus berupa bilangan bulat positif' },
    ]);
  }
  req.params.id = Number(raw);
  next();
}

module.exports = {
  validateLogin,
  validatePengaduanBody,
  validateStatusBody,
  validateIdParam,
};
