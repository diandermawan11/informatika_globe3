# RuangUji - Ulangan Harian Informatika Kelas VIII

Website ulangan harian 20 soal. Setiap jawaban benar bernilai 5 poin, nilai maksimal 100. Kunci jawaban disimpan di Netlify Function, bukan di kode halaman siswa. Setelah submit, nilai tampil di browser dan file Excel (.xlsx) berisi ringkasan serta detail jawaban dikirim ke `diandermawan10@gmail.com`.

## Penting: gunakan deploy yang mendukung Netlify Functions

Jangan gunakan Netlify Drop untuk folder statis saja. Proyek ini memakai fungsi backend. Deploy melalui GitHub + Netlify atau Netlify CLI.

## Konfigurasi email dengan Resend

1. Buat akun di https://resend.com.
2. Verifikasi domain pengirim di Resend, lalu buat API key.
3. Unggah proyek ini ke repository GitHub, lalu hubungkan repository ke Netlify.
4. Di Netlify buka **Site configuration → Environment variables** dan tambahkan:
   - `RESEND_API_KEY` = API key Resend
   - `EMAIL_FROM` = alamat pengirim terverifikasi, misalnya `RuangUji <ujian@domain-anda.id>`
5. Deploy ulang situs.
6. Tes dengan mengirim satu hasil ulangan. Pastikan email masuk ke `diandermawan10@gmail.com` dan lampiran Excel dapat dibuka.

Resend memerlukan alamat/domain pengirim yang diverifikasi. Jangan menaruh API key di `index.html` atau membagikannya kepada siswa.

## Deploy via Netlify CLI

Pastikan Node.js terpasang, lalu jalankan dari folder proyek:

```bash
npm install
npx netlify login
npx netlify init
npx netlify deploy --build
npx netlify deploy --build --prod
```

Atur environment variables di dashboard Netlify sebelum deploy produksi.

## Fitur dan batasan

- Nama lengkap dan kelas wajib diisi.
- 20 soal pilihan ganda, 5 poin per jawaban benar, nilai maksimal 100.
- Nilai langsung ditampilkan setelah backend menerima submit dan email berhasil dikirim.
- Lampiran Excel berisi sheet Ringkasan dan Detail Jawaban.
- Kunci jawaban berada di fungsi server, sehingga tidak terlihat dengan melihat source halaman.
- Browser menyimpan tanda bahwa ujian sudah dikumpulkan untuk mencegah pengulangan biasa. Ini bukan sistem identitas/anti-kecurangan yang kuat; siswa yang menghapus data browser atau memakai perangkat lain dapat melewati pembatasan tersebut.
- Email akan dikirim setiap kali server menerima submit valid. Untuk penggunaan ujian resmi dengan pembatasan percobaan yang kuat, tambahkan autentikasi siswa dan database.
