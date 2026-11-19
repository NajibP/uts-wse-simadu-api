'use strict';

const express = require('express');
const controller = require('../controllers/pengaduanController.cjs');
const { authenticate, authorize } = require('../middleware/auth.cjs');
const {
  validateIdParam,
  validatePengaduanBody,
  validateStatusBody,
} = require('../middleware/validate.cjs');

const router = express.Router();

// Semua endpoint pengaduan wajib login (Bearer token sah).
router.use(authenticate);

// Matriks hak akses:
// - lihat daftar / detail : mahasiswa (milik sendiri) & admin (semua) -> dicek di service
// - buat/ubah/hapus       : hanya mahasiswa (dan hanya milik sendiri, status diajukan)
// - ubah status           : hanya admin
router.get('/', controller.list);
router.get('/:id', validateIdParam, controller.getById);
router.post('/', authorize('mahasiswa'), validatePengaduanBody, controller.create);
router.put('/:id', authorize('mahasiswa'), validateIdParam, validatePengaduanBody, controller.update);
router.patch('/:id/status', authorize('admin'), validateIdParam, validateStatusBody, controller.updateStatus);
router.delete('/:id', authorize('mahasiswa'), validateIdParam, controller.remove);

module.exports = router;
