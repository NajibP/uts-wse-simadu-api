'use strict';

// Pengujian otomatis SIMADU API (node:test bawaan Node.js, tanpa library tambahan).
// Jalankan: npm test
// Nomor [1]..[12] sesuai tabel skenario wajib pada soal UTS (Soal 4).

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'rahasia-khusus-pengujian-minimal-32-karakter';
process.env.JWT_EXPIRES_IN = '15m';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const app = require('../app.cjs');
const pengaduanRepository = require('../src/repositories/pengaduanRepository.cjs');

let server;
let baseUrl;
const tokens = {};

async function request(method, path, { token, body, rawBody, headers } = {}) {
  const h = { ...(headers || {}) };
  if (token) h.Authorization = `Bearer ${token}`;
  let payload;
  if (rawBody !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = rawBody;
  } else if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(baseUrl + path, { method, headers: h, body: payload });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* bukan JSON */
  }
  return { status: res.status, body: json, text };
}

async function login(username, password) {
  return request('POST', '/api/auth/login', { body: { username, password } });
}

const pengaduanValid = {
  judul: 'Proyektor ruang C1 rusak',
  kategori: 'Fasilitas',
  deskripsi: 'Proyektor di ruang C1 tidak menyala sehingga perkuliahan terganggu.',
};

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  tokens.mhs1 = (await login('mhs1', 'Mhs1Pass#2026')).body.data.token;
  tokens.mhs2 = (await login('mhs2', 'Mhs2Pass#2026')).body.data.token;
  tokens.admin = (await login('admin', 'Admin#2026')).body.data.token;
});

after(() => {
  server.close();
});

beforeEach(() => {
  pengaduanRepository.reset();
});

describe('Skenario wajib UTS (12 skenario)', () => {
  it('[1] Login dengan kredensial benar -> 200, token diterima', async () => {
    const res = await login('mhs1', 'Mhs1Pass#2026');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(typeof res.body.data.token, 'string');
    assert.equal(res.body.data.tokenType, 'Bearer');
    assert.ok(res.body.data.expiresAt);
    assert.equal(res.body.data.user.role, 'mahasiswa');
    // password/hash tidak boleh ikut dikirim
    assert.ok(!res.text.includes('passwordHash'));
    assert.ok(!res.text.includes('Mhs1Pass#2026'));
  });

  it('[2] Login dengan password salah -> 401', async () => {
    const res = await login('mhs1', 'password-salah');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('[3] Akses endpoint terlindungi tanpa token -> 401', async () => {
    const res = await request('GET', '/api/pengaduan');
    assert.equal(res.status, 401);
  });

  it('[4] Akses menggunakan token tidak valid -> 401', async () => {
    const res = await request('GET', '/api/pengaduan', { token: 'token.palsu.sekali' });
    assert.equal(res.status, 401);
  });

  it('[5] Mahasiswa membuat pengaduan valid -> 201', async () => {
    const res = await request('POST', '/api/pengaduan', { token: tokens.mhs1, body: pengaduanValid });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.id, 4);
    assert.equal(res.body.data.mahasiswaId, '240104040001'); // dari token, bukan dari client
    assert.equal(res.body.data.status, 'diajukan');
    assert.ok(!Number.isNaN(Date.parse(res.body.data.createdAt)));
  });

  it('[6] Mahasiswa membaca pengaduan sendiri -> 200', async () => {
    const res = await request('GET', '/api/pengaduan/1', { token: tokens.mhs1 });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, 1);
  });

  it('[7] Mahasiswa mencoba membaca pengaduan orang lain -> 403', async () => {
    const res = await request('GET', '/api/pengaduan/2', { token: tokens.mhs1 });
    assert.equal(res.status, 403);
  });

  it('[8] Mahasiswa mengubah status pengaduan -> 403', async () => {
    const res = await request('PATCH', '/api/pengaduan/1/status', {
      token: tokens.mhs1,
      body: { status: 'selesai' },
    });
    assert.equal(res.status, 403);
    assert.equal(pengaduanRepository.findById(1).status, 'diajukan');
  });

  it('[9] Admin melihat seluruh pengaduan -> 200', async () => {
    const res = await request('GET', '/api/pengaduan', { token: tokens.admin });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 3);
  });

  it('[10] Admin memperbarui status pengaduan -> 200', async () => {
    const res = await request('PATCH', '/api/pengaduan/1/status', {
      token: tokens.admin,
      body: { status: 'diproses' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'diproses');
  });

  it('[11] Membuat pengaduan dengan field wajib kosong -> 400', async () => {
    const res = await request('POST', '/api/pengaduan', {
      token: tokens.mhs1,
      body: { judul: '', kategori: 'Fasilitas', deskripsi: '' },
    });
    assert.equal(res.status, 400);
    assert.ok(Array.isArray(res.body.errors) && res.body.errors.length >= 2);
  });

  it('[12] Mengakses ID pengaduan yang tidak ditemukan -> 404', async () => {
    const res = await request('GET', '/api/pengaduan/99999', { token: tokens.mhs1 });
    assert.equal(res.status, 404);
  });
});

describe('Pengujian tambahan: daftar sesuai hak akses', () => {
  it('Mahasiswa hanya melihat pengaduan miliknya', async () => {
    const res = await request('GET', '/api/pengaduan', { token: tokens.mhs1 });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 2);
    assert.ok(res.body.data.every((p) => p.mahasiswaId === '240104040001'));
  });

  it('Admin boleh melihat detail pengaduan milik mahasiswa', async () => {
    const res = await request('GET', '/api/pengaduan/2', { token: tokens.admin });
    assert.equal(res.status, 200);
  });
});

describe('Pengujian tambahan: ubah dan hapus', () => {
  it('Mahasiswa mengubah pengaduan sendiri (status diajukan) -> 200', async () => {
    const res = await request('PUT', '/api/pengaduan/1', {
      token: tokens.mhs1,
      body: pengaduanValid,
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.judul, pengaduanValid.judul);
    assert.equal(res.body.data.mahasiswaId, '240104040001');
    assert.equal(res.body.data.status, 'diajukan');
  });

  it('Mahasiswa mengubah pengaduan orang lain -> 403 dan data tidak berubah', async () => {
    const sebelum = pengaduanRepository.findById(2);
    const res = await request('PUT', '/api/pengaduan/2', { token: tokens.mhs1, body: pengaduanValid });
    assert.equal(res.status, 403);
    assert.deepEqual(pengaduanRepository.findById(2), sebelum);
  });

  it('Mahasiswa mengubah pengaduan yang sudah diproses -> 403', async () => {
    // ID 2 milik mhs2 dengan status "diproses"
    const res = await request('PUT', '/api/pengaduan/2', { token: tokens.mhs2, body: pengaduanValid });
    assert.equal(res.status, 403);
  });

  it('Admin tidak boleh membuat pengaduan -> 403', async () => {
    const res = await request('POST', '/api/pengaduan', { token: tokens.admin, body: pengaduanValid });
    assert.equal(res.status, 403);
  });

  it('Admin tidak boleh mengubah isi pengaduan -> 403', async () => {
    const res = await request('PUT', '/api/pengaduan/1', { token: tokens.admin, body: pengaduanValid });
    assert.equal(res.status, 403);
  });

  it('Admin tidak boleh menghapus pengaduan -> 403', async () => {
    const res = await request('DELETE', '/api/pengaduan/1', { token: tokens.admin });
    assert.equal(res.status, 403);
    assert.ok(pengaduanRepository.findById(1));
  });

  it('Mahasiswa menghapus pengaduan sendiri (status diajukan) -> 200', async () => {
    const res = await request('DELETE', '/api/pengaduan/1', { token: tokens.mhs1 });
    assert.equal(res.status, 200);
    assert.equal(pengaduanRepository.findById(1), null);
    const lagi = await request('GET', '/api/pengaduan/1', { token: tokens.mhs1 });
    assert.equal(lagi.status, 404);
  });

  it('Mahasiswa menghapus pengaduan orang lain -> 403 dan data tetap ada', async () => {
    const res = await request('DELETE', '/api/pengaduan/2', { token: tokens.mhs1 });
    assert.equal(res.status, 403);
    assert.ok(pengaduanRepository.findById(2));
  });

  it('Mahasiswa menghapus pengaduan yang sudah selesai -> 403', async () => {
    // ID 3 milik mhs1 dengan status "selesai"
    const res = await request('DELETE', '/api/pengaduan/3', { token: tokens.mhs1 });
    assert.equal(res.status, 403);
    assert.ok(pengaduanRepository.findById(3));
  });

  it('Mengubah/menghapus ID yang tidak ada -> 404', async () => {
    const put = await request('PUT', '/api/pengaduan/99999', { token: tokens.mhs1, body: pengaduanValid });
    const del = await request('DELETE', '/api/pengaduan/99999', { token: tokens.mhs1 });
    const patch = await request('PATCH', '/api/pengaduan/99999/status', {
      token: tokens.admin,
      body: { status: 'selesai' },
    });
    assert.equal(put.status, 404);
    assert.equal(del.status, 404);
    assert.equal(patch.status, 404);
  });
});

describe('Pengujian tambahan: validasi input (input ditolak tidak mengubah data)', () => {
  it('Client tidak boleh menentukan id/mahasiswaId/status/createdAt -> 400', async () => {
    const sebelum = pengaduanRepository.findAll();
    const res = await request('POST', '/api/pengaduan', {
      token: tokens.mhs1,
      body: { ...pengaduanValid, id: 999, mahasiswaId: '240104040002', status: 'selesai', createdAt: '2000-01-01' },
    });
    assert.equal(res.status, 400);
    const fields = res.body.errors.map((e) => e.field).sort();
    assert.deepEqual(fields, ['createdAt', 'id', 'mahasiswaId', 'status']);
    assert.deepEqual(pengaduanRepository.findAll(), sebelum);
  });

  it('Kategori di luar daftar -> 400', async () => {
    const res = await request('POST', '/api/pengaduan', {
      token: tokens.mhs1,
      body: { ...pengaduanValid, kategori: 'Kantin' },
    });
    assert.equal(res.status, 400);
  });

  it('Tipe data salah -> 400', async () => {
    const res = await request('POST', '/api/pengaduan', {
      token: tokens.mhs1,
      body: { judul: 123, kategori: 'TI', deskripsi: ['bukan string'] },
    });
    assert.equal(res.status, 400);
  });

  it('JSON rusak -> 400', async () => {
    const res = await request('POST', '/api/pengaduan', { token: tokens.mhs1, rawBody: '{"judul": ' });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'Format JSON tidak valid');
  });

  it('Tanpa body -> 400', async () => {
    const res = await request('POST', '/api/pengaduan', { token: tokens.mhs1 });
    assert.equal(res.status, 400);
  });

  it('Status baru tidak valid -> 400 dan status tidak berubah', async () => {
    const res = await request('PATCH', '/api/pengaduan/1/status', {
      token: tokens.admin,
      body: { status: 'dibatalkan' },
    });
    assert.equal(res.status, 400);
    assert.equal(pengaduanRepository.findById(1).status, 'diajukan');
  });

  it('PATCH status dengan field tambahan -> 400', async () => {
    const res = await request('PATCH', '/api/pengaduan/1/status', {
      token: tokens.admin,
      body: { status: 'diproses', mahasiswaId: 'ADM-001' },
    });
    assert.equal(res.status, 400);
    assert.equal(pengaduanRepository.findById(1).mahasiswaId, '240104040001');
  });

  it('ID bukan angka -> 400', async () => {
    const res = await request('GET', '/api/pengaduan/abc', { token: tokens.mhs1 });
    assert.equal(res.status, 400);
  });

  it('Login tanpa field wajib -> 400', async () => {
    const res = await request('POST', '/api/auth/login', { body: { username: 'mhs1' } });
    assert.equal(res.status, 400);
  });
});

describe('Pengujian tambahan: keamanan token dan error', () => {
  it('Token kedaluwarsa -> 401', async () => {
    const expired = jwt.sign(
      { sub: '240104040001', role: 'mahasiswa', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET
    );
    const res = await request('GET', '/api/pengaduan', { token: expired });
    assert.equal(res.status, 401);
  });

  it('Token dengan tanda tangan salah -> 401', async () => {
    const palsu = jwt.sign({ sub: 'ADM-001', role: 'admin' }, 'kunci-lain-yang-salah', { expiresIn: '15m' });
    const res = await request('GET', '/api/pengaduan', { token: palsu });
    assert.equal(res.status, 401);
  });

  it('Token tiap pengguna berbeda', () => {
    assert.notEqual(tokens.mhs1, tokens.mhs2);
    assert.notEqual(tokens.mhs1, tokens.admin);
  });

  it('Login username tidak ada dan password salah memberi pesan yang sama', async () => {
    const a = await login('tidak-ada', 'apa-saja');
    const b = await login('mhs1', 'salah');
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.body.message, b.body.message);
  });

  it('Endpoint tidak ada -> 404 berformat konsisten', async () => {
    const res = await request('GET', '/api/tidak-ada');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  it('Swagger UI dan openapi.json dapat diakses', async () => {
    const spec = await request('GET', '/docs/openapi.json');
    assert.equal(spec.status, 200);
    assert.equal(spec.body.openapi, '3.0.3');
    const ui = await fetch(`${baseUrl}/docs/`);
    assert.equal(ui.status, 200);
  });
});
