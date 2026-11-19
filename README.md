# SIMADU API

REST API **Sistem Layanan Informasi dan Pengaduan Mahasiswa** — proyek UTS Web Service Engineering (Node.js, Express 5, JSON).

Mahasiswa mengelola pengaduannya sendiri; administrator melihat seluruh pengaduan dan memperbarui status penanganannya. Akses dilindungi autentikasi Bearer token (JWT) dan otorisasi berbasis role + kepemilikan data.

## Prasyarat

- Node.js 18 atau lebih baru (`node --version`)
- npm (ikut terpasang bersama Node.js)
- Postman atau HTTP client lain (opsional, Swagger UI sudah tersedia)

## Instalasi

```bash
npm install
```

## Konfigurasi

Salin `.env.example` menjadi `.env`, lalu ubah nilainya.

Windows (PowerShell / CMD):

```bash
copy .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

| Variabel         | Keterangan                                                    | Contoh                         |
| ---------------- | ------------------------------------------------------------- | ------------------------------ |
| `PORT`           | Port server                                                   | `3000`                         |
| `JWT_SECRET`     | Kunci penanda token. **Wajib**, minimal 16 karakter (disarankan 32+) | string acak panjang            |
| `JWT_EXPIRES_IN` | Masa berlaku token                                            | `15m`, `1h`                    |

Server menolak start bila `JWT_SECRET` kosong. File `.env` sudah masuk `.gitignore` dan tidak boleh di-commit.

## Menjalankan server

```bash
npm start
```

Mode pengembangan (restart otomatis saat file berubah):

```bash
npm run dev
```

Setelah berjalan:

- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`
- Berkas OpenAPI: `http://localhost:3000/docs/openapi.json` (juga di `docs/openapi.json`)
- Cek hidup: `GET http://localhost:3000/health`

## Menjalankan pengujian otomatis

```bash
npm test
```

Pengujian memakai `node:test` bawaan Node.js (tanpa library tambahan), menjalankan server di port acak, dan mencakup 12 skenario wajib UTS beserta skenario tambahan (kepemilikan data, kebijakan status, validasi, token kedaluwarsa).

Koleksi Postman siap pakai: `tests/simadu.postman_collection.json` (Import di Postman, lalu klik **Run collection**; token dan ID tersimpan otomatis).

## Akun uji

| Role      | Username | Password        | ID pengguna    |
| --------- | -------- | --------------- | -------------- |
| mahasiswa | `mhs1`   | `Mhs1Pass#2026` | `240104040001` |
| mahasiswa | `mhs2`   | `Mhs2Pass#2026` | `240104040002` |
| admin     | `admin`  | `Admin#2026`    | `ADM-001`      |

Password disimpan sebagai hash bcrypt. Akun dan password ini hanya data latihan.

Data pengaduan awal: #1 (mhs1, `diajukan`), #2 (mhs2, `diproses`), #3 (mhs1, `selesai`). Data disimpan di memori, sehingga kembali ke kondisi awal setiap server di-restart.

## Autentikasi

1. `POST /api/auth/login` dengan `username` dan `password`.
2. Ambil `data.token` dari respons.
3. Kirim di setiap permintaan ke endpoint terlindungi:

```
Authorization: Bearer <token>
```

Token berlaku sesuai `JWT_EXPIRES_IN`. Token palsu, rusak, atau kedaluwarsa ditolak dengan **401**.

Contoh login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mhs1","password":"Mhs1Pass#2026"}'
```

Respons **200**:

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOi...",
    "tokenType": "Bearer",
    "expiresAt": "2026-11-19T08:15:00.000Z",
    "user": { "id": "240104040001", "username": "mhs1", "nama": "Mahasiswa Satu", "role": "mahasiswa" }
  }
}
```

## Kontrak endpoint

| Metode | Endpoint                         | Fungsi                                   | Role                                   | Sukses | Gagal               |
| ------ | -------------------------------- | ---------------------------------------- | -------------------------------------- | ------ | ------------------- |
| POST   | `/api/auth/login`                | Login, dapatkan token                    | publik                                 | 200    | 400, 401            |
| GET    | `/api/pengaduan`                 | Daftar pengaduan sesuai hak akses        | mahasiswa (milik sendiri), admin (semua) | 200    | 401                 |
| GET    | `/api/pengaduan/:id`             | Detail pengaduan                         | mahasiswa (milik sendiri), admin       | 200    | 400, 401, 403, 404  |
| POST   | `/api/pengaduan`                 | Tambah pengaduan                         | mahasiswa                              | 201    | 400, 401, 403       |
| PUT    | `/api/pengaduan/:id`             | Ubah judul, kategori, deskripsi          | mahasiswa pemilik, status `diajukan`   | 200    | 400, 401, 403, 404  |
| PATCH  | `/api/pengaduan/:id/status`      | Perbarui status penanganan               | admin                                  | 200    | 400, 401, 403, 404  |
| DELETE | `/api/pengaduan/:id`             | Hapus pengaduan                          | mahasiswa pemilik, status `diajukan`   | 200    | 400, 401, 403, 404  |

Kesalahan tak terduga di server menghasilkan **500** dengan pesan generik (tanpa detail internal).

### Struktur data pengaduan

| Field         | Tipe    | Keterangan                                   |
| ------------- | ------- | -------------------------------------------- |
| `id`          | integer | Dibuat server                                |
| `mahasiswaId` | string  | Dari hasil autentikasi, bukan dari client    |
| `judul`       | string  | 3–120 karakter                               |
| `kategori`    | string  | `Fasilitas`, `Akademik`, atau `TI`           |
| `deskripsi`   | string  | 5–2000 karakter                              |
| `status`      | string  | `diajukan` (awal), `diproses`, `selesai`     |
| `createdAt`   | string  | ISO 8601, dibuat server                      |

### Contoh request dan respons

`POST /api/pengaduan` (token mahasiswa):

```json
{
  "judul": "Proyektor ruang C1 rusak",
  "kategori": "Fasilitas",
  "deskripsi": "Proyektor di ruang C1 tidak menyala sehingga perkuliahan terganggu."
}
```

Respons **201**:

```json
{
  "success": true,
  "message": "Pengaduan berhasil dibuat",
  "data": {
    "id": 4,
    "mahasiswaId": "240104040001",
    "judul": "Proyektor ruang C1 rusak",
    "kategori": "Fasilitas",
    "deskripsi": "Proyektor di ruang C1 tidak menyala sehingga perkuliahan terganggu.",
    "status": "diajukan",
    "createdAt": "2026-11-19T01:20:00.000Z"
  }
}
```

`PATCH /api/pengaduan/4/status` (token admin):

```json
{ "status": "diproses" }
```

## Hak akses

| Operasi                    | Mahasiswa                               | Admin |
| -------------------------- | --------------------------------------- | ----- |
| Melihat pengaduan sendiri  | ✓                                       | ✓     |
| Melihat semua pengaduan    | ×                                       | ✓     |
| Membuat pengaduan          | ✓                                       | ×     |
| Mengubah pengaduan sendiri | ✓ (hanya saat status `diajukan`)        | ×     |
| Menghapus pengaduan sendiri| ✓ (hanya saat status `diajukan`)        | ×     |
| Mengubah status pengaduan  | ×                                       | ✓     |

Admin tidak dapat mengubah identitas pemilik pengaduan: `mahasiswaId` tidak pernah bisa diubah lewat API.

## Format respons

Berhasil:

```json
{ "success": true, "message": "...", "data": { } }
```

Gagal:

```json
{ "success": false, "message": "...", "errors": [ { "field": "judul", "message": "Field tidak boleh kosong" } ] }
```

`errors` hanya muncul pada kesalahan validasi (400).

| Status | Arti dalam API ini                                                                                         |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| 400    | Input tidak valid: field wajib kosong, tipe salah, field tidak dikenal, JSON rusak, ID bukan bilangan bulat |
| 401    | Belum login: token tidak ada, tidak valid, kedaluwarsa, atau login salah                                   |
| 403    | Sudah login tetapi tidak berhak: role salah, bukan pemilik, atau status bukan `diajukan` untuk ubah/hapus  |
| 404    | Pengaduan atau endpoint tidak ditemukan                                                                    |
| 500    | Kesalahan server, pesan generik                                                                            |

Catatan desain: ubah/hapus pada pengaduan yang statusnya bukan `diajukan` dijawab **403** (dilarang oleh kebijakan akses), agar kode status tetap dalam set yang ditetapkan soal.

## Struktur proyek dan tanggung jawab tiap lapisan

```
simadu-api/
├── src/
│   ├── controllers/    # adaptor HTTP: ambil data request, panggil service, bentuk respons
│   ├── services/       # aturan bisnis: kepemilikan, kebijakan status, login, penerbitan token
│   ├── repositories/   # akses data (array dalam memori); satu-satunya yang menyentuh penyimpanan
│   ├── routes/         # peta URL -> middleware -> controller
│   ├── middleware/     # autentikasi, otorisasi role, validasi, logger, error handler
│   ├── config.cjs      # membaca .env
│   └── errors.cjs      # kelas AppError
├── docs/
│   ├── openapi.json    # kontrak OpenAPI (ditampilkan di Swagger UI)
│   ├── rancangan.md    # analisis kebutuhan dan rancangan (Soal 1)
│   └── jawaban-pertanyaan-demonstrasi.md
├── tests/
│   ├── simadu.test.cjs                    # pengujian otomatis
│   └── simadu.postman_collection.json     # koleksi Postman
├── app.cjs             # merakit aplikasi Express (tanpa listen, agar mudah diuji)
├── server.cjs          # menjalankan server
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

| Lapisan      | Tanggung jawab                                                                  | Tidak boleh                          |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------ |
| Router       | Menentukan endpoint, urutan middleware, dan controller tujuan                   | Berisi logika bisnis                 |
| Middleware   | Hal lintas-endpoint: cek token (401), cek role (403), validasi input (400), error handler | Mengakses data langsung              |
| Controller   | Membaca `req`, memanggil service, menulis status dan JSON respons               | Menentukan aturan bisnis             |
| Service      | Aturan bisnis: pemilik, status `diajukan`, hash password, penerbitan token      | Mengetahui detail HTTP (`req`/`res`) |
| Repository   | Menyimpan dan membaca data                                                      | Memutuskan hak akses                 |

## Keamanan yang diterapkan

- Password di-hash dengan bcrypt; hash tidak pernah dikirim ke client.
- JWT HS256 dengan masa berlaku; verifikasi tanda tangan dan `exp` di server pada setiap permintaan, hanya algoritma HS256 yang diterima.
- Login memberi pesan yang sama untuk username salah dan password salah, serta tetap menjalankan perbandingan hash (mengurangi enumerasi akun lewat selisih waktu).
- Otorisasi berlapis: role di middleware, kepemilikan dan status di service.
- Validasi ketat: tipe, panjang, enum, dan penolakan field tak dikenal (client tidak bisa menyuntik `id`, `mahasiswaId`, `status`, `createdAt`).
- Error handler terpusat: tanpa stack trace atau pesan sistem ke client; log server tidak mencatat header `Authorization` maupun token.
- Batas ukuran body 10 KB, header `X-Powered-By` dimatikan.

## Pengembangan lanjutan (di luar cakupan UTS)

HTTPS/TLS, rate limiting pada login, database sungguhan, refresh token dan pencabutan token, audit log, serta header keamanan (mis. `helmet`).
