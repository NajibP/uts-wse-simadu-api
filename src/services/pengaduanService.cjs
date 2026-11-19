'use strict';

const pengaduanRepository = require('../repositories/pengaduanRepository.cjs');
const { AppError } = require('../errors.cjs');

function getOrThrow(id) {
  const item = pengaduanRepository.findById(id);
  if (!item) throw new AppError(404, 'Pengaduan tidak ditemukan');
  return item;
}

// Kepemilikan: admin boleh melihat semua, mahasiswa hanya miliknya sendiri.
function assertCanView(user, item) {
  if (user.role === 'admin') return;
  if (item.mahasiswaId !== user.id) {
    throw new AppError(403, 'Anda tidak berhak mengakses pengaduan ini');
  }
}

// Mengubah/menghapus: hanya pemilik, dan hanya selama status masih "diajukan".
function assertCanModify(user, item) {
  if (item.mahasiswaId !== user.id) {
    throw new AppError(403, 'Anda tidak berhak mengakses pengaduan ini');
  }
  if (item.status !== 'diajukan') {
    throw new AppError(403, 'Pengaduan yang sudah diproses atau selesai tidak dapat diubah atau dihapus');
  }
}

function list(user) {
  return user.role === 'admin'
    ? pengaduanRepository.findAll()
    : pengaduanRepository.findByOwner(user.id);
}

function getById(user, id) {
  const item = getOrThrow(id);
  assertCanView(user, item);
  return item;
}

function create(user, data) {
  // Pemilik selalu diambil dari hasil autentikasi, bukan dari body request.
  return pengaduanRepository.create({
    mahasiswaId: user.id,
    judul: data.judul,
    kategori: data.kategori,
    deskripsi: data.deskripsi,
  });
}

function update(user, id, data) {
  const item = getOrThrow(id);
  assertCanModify(user, item);
  return pengaduanRepository.update(id, data);
}

function updateStatus(id, status) {
  getOrThrow(id);
  return pengaduanRepository.updateStatus(id, status);
}

function remove(user, id) {
  const item = getOrThrow(id);
  assertCanModify(user, item);
  pengaduanRepository.remove(id);
}

module.exports = { list, getById, create, update, updateStatus, remove };
