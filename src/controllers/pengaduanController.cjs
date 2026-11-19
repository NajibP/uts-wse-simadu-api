'use strict';

const pengaduanService = require('../services/pengaduanService.cjs');

function list(req, res) {
  const data = pengaduanService.list(req.user);
  res.status(200).json({ success: true, message: 'Daftar pengaduan berhasil diambil', data });
}

function getById(req, res) {
  const data = pengaduanService.getById(req.user, req.params.id);
  res.status(200).json({ success: true, message: 'Detail pengaduan berhasil diambil', data });
}

function create(req, res) {
  const data = pengaduanService.create(req.user, req.body);
  res.status(201).json({ success: true, message: 'Pengaduan berhasil dibuat', data });
}

function update(req, res) {
  const data = pengaduanService.update(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Pengaduan berhasil diubah', data });
}

function updateStatus(req, res) {
  const data = pengaduanService.updateStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, message: 'Status pengaduan berhasil diperbarui', data });
}

function remove(req, res) {
  pengaduanService.remove(req.user, req.params.id);
  res.status(200).json({ success: true, message: 'Pengaduan berhasil dihapus', data: null });
}

module.exports = { list, getById, create, update, updateStatus, remove };
