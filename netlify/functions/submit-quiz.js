const XLSX = require('xlsx');

const ANSWER_KEY = ['B','C','C','B','C','D','B','C','B','B','C','B','B','C','C','B','B','B','C','B'];
const LETTERS = ['A','B','C','D'];
const QUESTIONS = [
  'Definisi konten digital', 'Jenis konten kombinasi teks dan gambar', 'Tujuan membangun merek atau identitas',
  'Pengertian rule of thirds', 'Keuntungan rule of thirds', 'Warna untuk ketenangan dan profesionalisme',
  'Komponen palet warna harmonis', 'Penggunaan warna aksen', 'Dampak kontras warna rendah',
  'Pendekatan warna premium dan minimalis', 'Jenis font untuk layar digital', 'Ukuran teks yang mudah dibaca',
  'Penempatan judul konten digital', 'Dampak resolusi gambar tinggi', 'Platform dengan rasio 9:16',
  'Tujuan kompresi file visual', 'Konten tutorial langkah demi langkah', 'Fungsi storyboard',
  'Penggunaan karya orang lain secara sah', 'Dampak plagiarisme'
];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { ok: false, message: 'Metode tidak diizinkan.' });
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return reply(503, { ok: false, message: 'Pengiriman belum dikonfigurasi oleh guru. Silakan hubungi guru.' });
  }
  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch { return reply(400, { ok: false, message: 'Data jawaban tidak valid.' }); }
  const name = clean(payload.name, 100);
  const kelas = clean(payload.kelas, 30);
  if (!name || !kelas) return reply(400, { ok: false, message: 'Nama lengkap dan kelas wajib diisi.' });
  if (!payload.answers || typeof payload.answers !== 'object') return reply(400, { ok: false, message: 'Jawaban tidak ditemukan.' });

  const answers = ANSWER_KEY.map((_, i) => {
    const value = payload.answers[i];
    return Number.isInteger(value) && value >= 0 && value <= 3 ? LETTERS[value] : '';
  });
  const correctAnswers = ANSWER_KEY;
  let correct = 0, wrong = 0, empty = 0;
  const rows = [];
  ANSWER_KEY.forEach((key, i) => {
    const user = answers[i];
    const isCorrect = user === key;
    if (!user) empty++;
    else if (isCorrect) correct++;
    else wrong++;
    rows.push({
      'Nomor': i + 1,
      'Ringkasan soal': QUESTIONS[i],
      'Jawaban siswa': user || 'Kosong',
      'Kunci jawaban': key,
      'Hasil': !user ? 'Kosong' : isCorrect ? 'Benar' : 'Salah',
      'Poin': isCorrect ? 5 : 0
    });
  });
  const score = correct * 5;
  const submittedAt = new Date().toISOString();
  const summary = [
    { 'Informasi': 'Nama siswa', 'Nilai': name },
    { 'Informasi': 'Kelas', 'Nilai': kelas },
    { 'Informasi': 'Waktu submit (UTC)', 'Nilai': submittedAt },
    { 'Informasi': 'Nilai akhir', 'Nilai': score },
    { 'Informasi': 'Jawaban benar', 'Nilai': correct },
    { 'Informasi': 'Jawaban salah', 'Nilai': wrong },
    { 'Informasi': 'Tidak dijawab', 'Nilai': empty },
    { 'Informasi': 'Poin per soal', 'Nilai': 5 },
    { 'Informasi': 'Nilai maksimal', 'Nilai': 100 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), 'Ringkasan');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Detail Jawaban');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const safeName = name.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 50) || 'Siswa';
  const fileName = `Hasil_Ulangan_${safeName}_${new Date().toISOString().slice(0,10)}.xlsx`;

  const emailBody = {
    from: process.env.EMAIL_FROM,
    to: ['diandermawan10@gmail.com'],
    subject: `Hasil Ulangan Informatika: ${name} (${kelas}) - ${score}/100`,
    text: `Hasil ulangan harian Informatika telah diterima.\n\nNama: ${name}\nKelas: ${kelas}\nNilai: ${score}/100\nBenar: ${correct}\nSalah: ${wrong}\nKosong: ${empty}\n\nFile Excel berisi ringkasan dan detail jawaban terlampir.`,
    attachments: [{ filename: fileName, content: buffer.toString('base64') }]
  };
  try {
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailBody)
    });
    if (!sent.ok) {
      const detail = await sent.text();
      console.error('Resend error:', sent.status, detail);
      return reply(502, { ok: false, message: 'Email hasil belum berhasil dikirim. Coba lagi atau hubungi guru.' });
    }
  } catch (err) {
    console.error('Email send failed:', err);
    return reply(502, { ok: false, message: 'Terjadi gangguan saat mengirim email. Coba lagi.' });
  }
  return reply(200, { ok: true, score, correct, wrong, empty, correctAnswers: correctAnswers.map(letter => LETTERS.indexOf(letter)), submittedAt });
};

function clean(value, max) { return typeof value === 'string' ? value.trim().replace(/[<>\u0000-\u001f]/g, '').slice(0, max) : ''; }
function reply(statusCode, body) { return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) }; }
