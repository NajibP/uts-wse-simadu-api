# Jawaban 10 Pertanyaan Demonstrasi UTS

Draf jawaban ini mengacu ke kode proyek. Sebelum dikumpulkan, baca dan pahami tiap jawaban, lalu ubah dengan kata-katamu sendiri agar kamu bisa menjelaskannya saat demonstrasi.

## 1. Apa perbedaan autentikasi dan otorisasi? Tunjukkan implementasinya di dalam kode.

**Autentikasi** menjawab "siapa kamu?": membuktikan identitas pengguna. **Otorisasi** menjawab "boleh melakukan apa?": menentukan hak akses setelah identitas diketahui.

Implementasi:

- Autentikasi: `authService.login` (`src/services/authService.cjs`) membandingkan password dengan hash bcrypt lalu menerbitkan JWT. Middleware `authenticate` (`src/middleware/auth.cjs`) memverifikasi token di setiap permintaan dan mengisi `req.user`. Gagal -> 401.
- Otorisasi: middleware `authorize('admin')` / `authorize('mahasiswa')` membatasi operasi berdasarkan role (`src/routes/pengaduanRoutes.cjs`). Pengecekan kepemilikan dan status ada di `assertCanView` dan `assertCanModify` (`src/services/pengaduanService.cjs`). Gagal -> 403.

## 2. Mengapa mahasiswa yang berhasil login belum tentu boleh mengakses semua endpoint?

Login hanya membuktikan identitas. Hak akses ditentukan oleh role dan kepemilikan data. Mahasiswa yang sudah login tetap tidak boleh mengubah status pengaduan (hanya admin) dan tidak boleh melihat, mengubah, atau menghapus pengaduan milik mahasiswa lain. Tanpa otorisasi, siapa pun yang punya akun bisa mengakses atau merusak data orang lain.

## 3. Apa perbedaan respons HTTP 401 dan 403?

- **401 Unauthorized**: server tidak tahu atau tidak percaya siapa pemanggil: token tidak ada, rusak, kedaluwarsa, atau kredensial login salah. Solusinya login ulang.
- **403 Forbidden**: server tahu siapa pemanggil, tetapi pemanggil tidak berhak melakukan operasi itu. Login ulang tidak akan membantu.

Contoh di proyek ini: `GET /api/pengaduan` tanpa token -> 401; mahasiswa memanggil `PATCH /api/pengaduan/1/status` -> 403.

## 4. Bagaimana API memastikan seorang mahasiswa hanya dapat mengubah pengaduannya sendiri?

1. Identitas pemilik berasal dari token yang diverifikasi server (`req.user.id`), bukan dari body request. Client juga tidak boleh mengirim `mahasiswaId` (ditolak validasi dengan 400).
2. Saat `PUT`/`DELETE`, `pengaduanService` mengambil data pengaduan dari repository lalu `assertCanModify` membandingkan `item.mahasiswaId` dengan `user.id`. Jika berbeda -> 403.
3. Pengaduan hanya boleh diubah/dihapus selama statusnya `diajukan`; selain itu -> 403.
4. Repository `update` hanya menerima `judul`, `kategori`, `deskripsi`, sehingga `mahasiswaId` tidak mungkin berubah.

Dibuktikan oleh tes "Mahasiswa mengubah pengaduan orang lain -> 403 dan data tidak berubah".

## 5. Mengapa password harus di-hash dan mengapa token tidak boleh dicatat ke log?

**Hash password**: jika database atau kode bocor, penyerang tidak langsung mendapat password asli. Hash bcrypt bersifat satu arah, memakai salt, dan sengaja lambat sehingga menyulitkan tebak-menebak massal. Password plaintext akan membahayakan pengguna, termasuk di layanan lain bila password dipakai ulang.

**Token tidak dicatat ke log**: Bearer token berfungsi seperti kunci. Siapa pun yang memegang token sah dapat bertindak sebagai pemiliknya sampai token kedaluwarsa. Log sering dibaca banyak orang, disalin, atau dikirim ke layanan pihak ketiga, sehingga token di log menjadi celah pembajakan sesi. `requestLogger` hanya mencatat method, path, status, dan durasi.

## 6. Bagaimana sebuah input yang salah ditangani oleh middleware dan error handler?

1. Request masuk ke `express.json`. Bila JSON rusak, muncul error `entity.parse.failed`.
2. Untuk JSON valid, middleware `validate.cjs` memeriksa body: harus objek, tidak ada field tak dikenal, tipe dan panjang benar, `kategori`/`status` sesuai daftar, `:id` bilangan bulat positif. Pelanggaran dikumpulkan lalu `throw new AppError(400, 'Validasi gagal', errors)`.
3. Karena error dilempar sebelum controller dijalankan, service dan repository tidak pernah disentuh, jadi data tidak berubah.
4. `errorHandler` (`src/middleware/errorHandler.cjs`) menangkap semua error dan menyusun respons berformat konsisten `{success:false, message, errors}` dengan status yang sesuai. Error tak terduga menjadi 500 dengan pesan generik.

## 7. Apa perbedaan HTTPS dengan autentikasi Bearer Token?

**HTTPS (TLS)** melindungi saluran komunikasi: data terenkripsi dan terjaga dari penyadapan atau pengubahan di jaringan, serta membuktikan identitas server. **Bearer Token** adalah mekanisme autentikasi di level aplikasi: membuktikan siapa pengguna yang memanggil API. Keduanya saling melengkapi. Tanpa HTTPS, token bisa dicuri di jaringan; tanpa token, HTTPS saja tidak membatasi siapa yang boleh mengakses data. Pada UTS ini server berjalan dengan HTTP lokal; HTTPS adalah syarat produksi.

## 8. Bagaimana membuktikan bahwa input yang ditolak tidak mengubah data?

Ambil kondisi data sebelum permintaan (mis. `GET /api/pengaduan` sebagai admin), kirim permintaan yang melanggar aturan, pastikan respons 400/403/404, lalu ambil data lagi dan bandingkan: harus identik. Di pengujian otomatis ini dilakukan dengan menyimpan `pengaduanRepository.findAll()` sebelum request lalu `assert.deepEqual` sesudahnya (tes "Client tidak boleh menentukan id/mahasiswaId/status/createdAt -> 400" dan "Mahasiswa mengubah pengaduan orang lain -> 403 dan data tidak berubah"). Secara manual di Postman: GET sebelum dan sesudah, lalu tunjukkan isinya sama.

## 9. Mengapa dokumentasi Swagger yang tampil belum cukup membuktikan API berjalan dengan benar?

Swagger/OpenAPI hanyalah deskripsi kontrak yang ditulis manusia. Dokumen bisa tampil rapi walau kode berperilaku berbeda (endpoint belum diimplementasikan, status berbeda, aturan akses salah). Bukti bahwa API benar hanya datang dari pengujian: permintaan nyata ke server yang berjalan, respons aktual yang dibandingkan dengan harapan, termasuk skenario gagal (401, 403, 400, 404). Karena itu soal meminta bukti respons aktual dan penolakan terhadap permintaan yang melanggar aturan.

## 10. Apa yang harus diperbaiki agar layanan ini layak diterapkan pada lingkungan produksi?

- Gunakan HTTPS/TLS dan simpan `JWT_SECRET` di secret manager, bukan file di repo.
- Ganti array memori dengan database sungguhan (transaksi, backup, migrasi), dan simpan akun pengguna di tabel dengan manajemen pengguna.
- Tambahkan rate limiting dan penguncian sementara pada login untuk mencegah brute force.
- Gunakan access token berumur pendek ditambah refresh token, serta mekanisme pencabutan token (logout, daftar cabut).
- Tambahkan header keamanan (`helmet`), CORS yang dibatasi, dan batas ukuran/format permintaan yang lebih ketat.
- Tambahkan audit log (tanpa data sensitif), monitoring, dan penanganan error terstruktur.
- Perluas pengujian otomatis dan jalankan di CI; pindai kerentanan dependensi secara berkala.
- Pertimbangkan pagination, filter, dan pencarian pada daftar pengaduan.
