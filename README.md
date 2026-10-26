# Cricket Performance Lab — V6.4 Popup Edition

Repository siap diunggah ke GitHub, dengan frontend V6.4 asli, backend Apps Script, indeks pertandingan ternormalisasi di Sheets, dan backup Drive.

**Status: dibuat dan diuji lokal dengan layanan Google tiruan. Belum diunggah, belum dideploy, belum login Google, dan belum diuji terhadap Sheets/Drive sungguhan.**

Mulai dari [panduan instalasi](docs/SETUP.md). Uji penyimpanan nyata menggunakan [checklist](docs/TESTING.md) setelah Anda menyiapkan deployment sendiri.

## Cara kerja

- `index.html`: frontend lengkap untuk GitHub Pages atau penggunaan lokal. Scoring dan fitur V6.4 tetap tersedia. Penyimpanan otomatis di browser bersifat lokal.
- `backend/App.html`: frontend yang sama, dilayani Apps Script agar `google.script.run` dapat mengakses backend setelah login.
- GitHub Pages menyediakan tombol menuju workspace Apps Script. **Tidak ada sinkronisasi cloud langsung dari origin GitHub Pages.** Pemindahan data antarkedua alamat memakai ekspor/impor bundle eksplisit.
- Mode cloud default adalah **pribadi, hanya pemilik akun Google**, sehingga Gmail pribadi didukung. Web app diatur Only myself dan backend memverifikasi identitas lagi.
- Dua penyimpanan cloud: snapshot lengkap 13 dataset untuk asesmen/arsip; penyimpanan pertandingan untuk database lawan. Keduanya memiliki tombol dan revisi tersendiri.

## Isi repository

```text
index.html                  frontend hasil build, langsung dapat dibuka
config.js                   URL publik workspace cloud, tanpa rahasia
backend/Code.gs             auth, validasi, Sheets, Drive, revisi
backend/App.html            frontend identik untuk Apps Script
backend/appsscript.json     scope dan konfigurasi Workspace
reference/v6.4-popup-original.html  salinan sumber asli, tidak diedit
scripts/build.mjs           build deterministik dari sumber asli
scripts/client-bridge.js    pengganti dua adapter cloud lama
scripts/restore-backup.mjs  konversi backup yang diunduh menjadi impor lokal
tests/                     pengujian lokal tanpa akun Google
docs/SETUP.md              langkah GitHub dan Apps Script
docs/SECURITY.md           batas keamanan dan cross-origin
docs/DATABASE.md           struktur tabel, relasi, revisi, pemulihan
docs/FEATURES.md           inventaris fitur dan perubahan
docs/TESTING.md            checklist lokal dan live (belum dijalankan)
docs/VALIDATION.md         hasil verifikasi lokal
docs/source-manifest.json  checksum sumber
.github/workflows/check.yml  pemeriksaan otomatis setelah push
```

## Build dan pengujian

Pasang Node.js versi 20 atau lebih baru. Tidak ada paket npm tambahan yang diperlukan.

```sh
npm run check
```

Setelah mengubah `config.js` atau `scripts/client-bridge.js`, jalankan `npm run build`. Upload ulang `backend/App.html` dan buat versi deployment Apps Script baru jika frontend cloud juga berubah. File HTML hasil build sudah disertakan, sehingga Node tidak diperlukan untuk sekadar membukanya.

Gunakan data sintetis saat mencoba. Jangan upload bundle ekspor, data atlet, backup Drive, credential, atau konfigurasi akun ke repository publik. Source lama disimpan sebagai referensi, bukan backend yang perlu dipasang.

Fitur pose otomatis tetap menggunakan MediaPipe CDN sesuai sumber asli. Video asli dan file model tidak dibundel atau dicadangkan. Fitur tersebut membutuhkan internet dan tetap perlu pengujian browser tersendiri.
