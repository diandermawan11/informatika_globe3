
const SHEETS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbx2VxELFjar4QfRbbM0nGT7tI5DjjFHkacnp19cyzyqvGYZL6lueSYBb8GrCBfAdEGo/exec';

const ANSWER_KEY = [
  'B','C','C','B','C','D','B','C','B','B',
  'C','B','B','C','C','B','B','B','C','B'
];

const LETTERS = ['A', 'B', 'C', 'D'];

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return reply(405, {
      ok: false,
      message: 'Metode tidak diizinkan.'
    });
  }

  let payload;

  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return reply(400, {
      ok: false,
      message: 'Data jawaban tidak valid.'
    });
  }

  const name = clean(payload.name, 100);
  const kelas = clean(payload.kelas, 30);

  if (!name || !kelas) {
    return reply(400, {
      ok: false,
      message: 'Nama lengkap dan kelas wajib diisi.'
    });
  }

  if (
    !payload.answers ||
    typeof payload.answers !== 'object' ||
    Array.isArray(payload.answers)
  ) {
    return reply(400, {
      ok: false,
      message: 'Jawaban tidak ditemukan.'
    });
  }

  const answers = ANSWER_KEY.map((_, i) => {
    const value = payload.answers[i];

    return Number.isInteger(value) && value >= 0 && value <= 3
      ? LETTERS[value]
      : '';
  });

  let correct = 0;
  let wrong = 0;
  let empty = 0;

  ANSWER_KEY.forEach((key, i) => {
    const user = answers[i];

    if (!user) {
      empty++;
    } else if (user === key) {
      correct++;
    } else {
      wrong++;
    }
  });

  const score = correct * 5;
  const submittedAt = new Date().toISOString();

  // Simpan hasil ke Google Sheets. Tidak mengirim email.
  try {
    const sheetResponse = await fetch(SHEETS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nama: name,
        kelas: kelas,
        nilai: score,
        benar: correct,
        salah: wrong,
        kosong: empty,
        totalSoal: ANSWER_KEY.length,
        waktuSubmit: submittedAt
      })
    });

    if (!sheetResponse.ok) {
      throw new Error(`Google Sheets HTTP ${sheetResponse.status}`);
    }

    const sheetResult = await sheetResponse.json();

    if (!sheetResult.ok) {
      throw new Error(
        sheetResult.message || 'Google Sheets menolak data.'
      );
    }
  } catch (error) {
    console.error('Google Sheets error:', error);

    return reply(502, {
      ok: false,
      message:
        'Hasil belum berhasil disimpan. Periksa koneksi penyimpanan sebelum mencoba kembali.'
    });
  }

  return reply(200, {
    ok: true,
    score,
    correct,
    wrong,
    empty,
    correctAnswers: ANSWER_KEY.map(
      letter => LETTERS.indexOf(letter)
    ),
    submittedAt,
    sheetSaved: true,
    emailSent: false
  });
};

function clean(value, max) {
  return typeof value === 'string'
    ? value.trim()
        .replace(/[<>\u0000-\u001f]/g, '')
        .slice(0, max)
    : '';
}

function reply(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = handler;
