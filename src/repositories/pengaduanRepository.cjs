'use strict';

// Repository = satu-satunya lapisan yang tahu cara menyimpan data.
// Di sini penyimpanan berupa array dalam memori; bisa diganti database tanpa mengubah service.

function seedData() {
  return [
    {
      id: 1,
      mahasiswaId: '240104040001',
      judul: 'AC ruang kelas B2 tidak dingin',
      kategori: 'Fasilitas',
      deskripsi: 'AC di ruang B2 mati sejak minggu lalu sehingga ruangan sangat panas saat kuliah.',
      status: 'diajukan',
      createdAt: '2026-11-02T08:15:00.000Z',
    },
    {
      id: 2,
      mahasiswaId: '240104040002',
      judul: 'Nilai UTS belum muncul di portal',
      kategori: 'Akademik',
      deskripsi: 'Nilai UTS mata kuliah Basis Data belum tampil di portal akademik.',
      status: 'diproses',
      createdAt: '2026-11-03T02:30:00.000Z',
    },
    {
      id: 3,
      mahasiswaId: '240104040001',
      judul: 'Wi-Fi perpustakaan sering terputus',
      kategori: 'TI',
      deskripsi: 'Koneksi Wi-Fi di lantai 2 perpustakaan terputus setiap beberapa menit.',
      status: 'selesai',
      createdAt: '2026-11-04T05:45:00.000Z',
    },
  ];
}

let items = seedData();
let nextId = items.length + 1;

function findAll() {
  return items.map((i) => ({ ...i }));
}

function findByOwner(mahasiswaId) {
  return items.filter((i) => i.mahasiswaId === mahasiswaId).map((i) => ({ ...i }));
}

function findById(id) {
  const found = items.find((i) => i.id === id);
  return found ? { ...found } : null;
}

function create({ mahasiswaId, judul, kategori, deskripsi }) {
  const item = {
    id: nextId++, // ID dibuat server, bukan client
    mahasiswaId,
    judul,
    kategori,
    deskripsi,
    status: 'diajukan',
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  return { ...item };
}

function update(id, { judul, kategori, deskripsi }) {
  const item = items.find((i) => i.id === id);
  if (!item) return null;
  item.judul = judul;
  item.kategori = kategori;
  item.deskripsi = deskripsi;
  return { ...item };
}

function updateStatus(id, status) {
  const item = items.find((i) => i.id === id);
  if (!item) return null;
  item.status = status;
  return { ...item };
}

function remove(id) {
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  return true;
}

// Dipakai pengujian otomatis agar tiap tes mulai dari data awal yang sama.
function reset() {
  items = seedData();
  nextId = items.length + 1;
}

module.exports = { findAll, findByOwner, findById, create, update, updateStatus, remove, reset };
