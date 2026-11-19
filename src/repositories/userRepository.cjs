'use strict';

const bcrypt = require('bcryptjs');

// Akun uji (data awal): 2 mahasiswa + 1 administrator.
// Password disimpan sebagai hash bcrypt, bukan plaintext.
// Password asli hanya muncul di sini sebagai bahan seed dan didokumentasikan di README.
const SALT_ROUNDS = 10;

const users = [
  {
    id: '240104040001',
    username: 'mhs1',
    nama: 'Mahasiswa Satu',
    role: 'mahasiswa',
    passwordHash: bcrypt.hashSync('Mhs1Pass#2026', SALT_ROUNDS),
  },
  {
    id: '240104040002',
    username: 'mhs2',
    nama: 'Mahasiswa Dua',
    role: 'mahasiswa',
    passwordHash: bcrypt.hashSync('Mhs2Pass#2026', SALT_ROUNDS),
  },
  {
    id: 'ADM-001',
    username: 'admin',
    nama: 'Administrator',
    role: 'admin',
    passwordHash: bcrypt.hashSync('Admin#2026', SALT_ROUNDS),
  },
];

// Hash pembanding agar waktu respons login tetap mirip meski username tidak ada.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-tidak-dipakai', SALT_ROUNDS);

function findByUsername(username) {
  return users.find((u) => u.username === username) || null;
}

function findById(id) {
  return users.find((u) => u.id === id) || null;
}

module.exports = { findByUsername, findById, DUMMY_HASH };
