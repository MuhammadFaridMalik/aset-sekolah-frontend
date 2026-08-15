# Sistem Manajemen Aset Sekolah — Frontend

Antarmuka web untuk aplikasi pengelolaan data aset/barang sekolah. Dibangun dengan HTML, CSS, dan JavaScript murni (tanpa framework), yang berkomunikasi dengan backend Laravel lewat REST API.

## Coba Demo

**Live demo:** https://manajemen-aset-sekolah.netlify.app

Akun demo (role staff — bisa melihat & menambah data, tidak bisa mengedit atau menghapus):
- Email: `demo@sekolah.test`
- Password: `demo12345`

## Kenapa tanpa framework

Frontend ini sengaja dibuat dengan JavaScript vanilla, bukan React/Vue, karena fokus utama project ini ada di sisi backend (API, database, autentikasi). Frontend cukup jadi antarmuka sederhana untuk mengonsumsi API tersebut — tanpa build step, tanpa dependency tambahan, tinggal buka lewat Live Server.

## Fitur

- Halaman login yang terhubung ke API autentikasi (token disimpan di `localStorage`)
- Dashboard dengan tabel data aset, dilengkapi pencarian dan filter berdasarkan kategori
- Form tambah/edit aset dalam bentuk modal
- Halaman "Kelola Data Master" untuk mengatur kategori dan lokasi (khusus admin)
- Tampilan menyesuaikan role: tombol edit/hapus hanya muncul untuk admin, staff hanya bisa melihat dan menambah data

## Struktur Folder

```
├── index.html          halaman login
├── dashboard.html       tabel & CRUD aset
├── master-data.html     kelola kategori & lokasi
├── css/
│   └── style.css
└── js/
    ├── config.js         alamat API backend
    ├── auth.js            logika login
    ├── dashboard.js       cek token & logout
    ├── assets.js           CRUD aset
    └── master-data.js     CRUD kategori & lokasi
```

## Cara Kerja Menghubungkan ke Backend

Semua request ke backend dikirim lewat `fetch()` biasa, dengan token dari `localStorage` disertakan di header:

```javascript
fetch(`${API_BASE_URL}/assets`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
    },
});
```

Kalau token tidak valid atau kedaluwarsa (respons `401`), pengguna otomatis diarahkan kembali ke halaman login.

## Menjalankan di Lokal

1. Clone repo ini.
2. Buka folder ini di VS Code, install ekstensi **Live Server** kalau belum ada.
3. Klik kanan `index.html` → **Open with Live Server**.
4. Pastikan `js/config.js` mengarah ke backend yang aktif:
   ```javascript
   const API_BASE_URL = 'http://127.0.0.1:8000/api'; // untuk backend lokal
   ```
5. Pastikan backend Laravel juga sedang berjalan (`php artisan serve`) dan origin Live Server sudah diizinkan di konfigurasi CORS backend.

## Deployment

Di-deploy sebagai static site ke **Netlify**, langsung dari repo GitHub (tanpa build command, publish directory `.`). Untuk mengarah ke backend production, `API_BASE_URL` di `js/config.js` diganti ke domain backend yang sudah live.

## Penggunaan AI dalam Pengerjaan Project

Saya menggunakan **Claude (Anthropic)** sebagai asisten selama membangun frontend ini. Cara pakainya:

- **Struktur halaman didiskusikan dulu** sebelum ditulis — misalnya kenapa satu form dipakai untuk tambah dan edit sekaligus (dibedakan lewat hidden input), bukan dua form terpisah.
- **Penjelasan tiap potongan kode**, bukan cuma kode jadi — misalnya kenapa cek `response.ok` diperlukan saat pakai `fetch()`, atau kenapa token disimpan di `localStorage` bukan cookie.
- **Bantuan debugging** untuk error yang belum saya pahami penyebabnya, seperti error CORS akibat origin `null` saat file dibuka langsung tanpa Live Server.
- **Saya sendiri yang menjalankan dan menguji setiap perubahan** di browser, membaca pesan error di DevTools, dan memutuskan langkah perbaikannya. AI berperan sebagai tempat berdiskusi dan bertanya, bukan yang mengerjakan project secara otomatis.

## Penulis

Muhammad Farid Malik