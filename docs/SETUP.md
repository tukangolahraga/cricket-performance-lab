# Setup Gmail pribadi dan GitHub Pages

Paket mendukung Gmail pribadi melalui mode PERSONAL_OWNER. Hanya pemilik boleh membuka cloud. Workspace bukan prasyarat mode pribadi.

## Apps Script

1. Buat proyek baru memakai akun Google pemilik database; jangan timpa aplikasi lain.
2. Isi Code.gs dengan backend/Code.gs; buat HTML bernama App berisi backend/App.html.
3. Aktifkan manifest di Project Settings; gunakan backend/appsscript.json (MYSELF / USER_ACCESSING).
4. Isi Script Properties: CPL_AUTH_MODE = PERSONAL_OWNER; CPL_ADMIN_EMAIL = email pemilik yang login. Email tidak perlu dimasukkan ke repository publik.
5. Jalankan setup sebagai pemilik. Tinjau izin email/Sheets/Drive Google. Setup membuat spreadsheet dan folder privat; ID disimpan ke CPL_SPREADSHEET_ID dan CPL_BACKUP_FOLDER_ID. Setup ulang memakai sumber daya yang sama.
6. Deploy → New deployment → Web app. Execute as User accessing the web app; Who has access Only myself. Jangan pilih Anyone/anonymous.
7. Buka URL /exec sebagai pemilik. Cloud Sync → Periksa Koneksi harus menunjukkan email Anda. Email kosong/berbeda ditolak; tidak ada fallback ke identitas klien.

Semua endpoint memverifikasi email aktif sama dengan CPL_ADMIN_EMAIL. Pelatih lain belum mendapat akses. [Dokumentasi izin Google](https://developers.google.com/apps-script/manifest/web-app-api-executable).

## GitHub Pages

1. Isi cloudAppUrl pada config.js dengan URL /exec.
2. Jalankan npm run check di folder repository (Node.js 20+, tanpa paket tambahan).
3. Upload backend/App.html terbaru ke Apps Script dan update versi deployment bila frontend berubah.
4. Buat repository cricket-performance-lab. Upload isi folder ke root, termasuk backend/docs/scripts/tests/reference dan .github. Jangan upload ekspor, backup, data atlet atau credential.
5. Settings → Pages → Deploy from a branch → main → / (root) → Save. Tunggu proses selesai.
6. Buka Pages → Cloud Sync → Buka workspace cloud. Data cloud tetap memerlukan login pemilik.

Pages menjalankan frontend lokal lengkap. google.script.run hanya tersedia di Apps Script. Tidak ada direct cross-origin API dari Pages. [Panduan resmi Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Data antaralamat

localStorage file lokal, Pages, dan Apps Script terpisah. Ekspor bundle lengkap dari alamat asal (13 dataset, tanpa video). Di cloud, ekspor lokal lama dahulu. Jika server sudah memiliki snapshot, Ambil data Cloud dan ekspor untuk perbandingan sebelum mengimpor bundle asal. Review lalu save: ini penggantian snapshot, bukan merge otomatis.

Untuk indeks lawan gunakan Simpan pertandingan di popup Database Pertandingan. Snapshot lengkap dan match database punya tombol/revisi terpisah. Untuk membawa cloud kembali ke Pages, ekspor bundle lalu impor pada Pages. Video dipilih ulang dari perangkat.

Jika CONFLICT: ekspor lokal, muat server terbaru, bandingkan lalu terapkan perubahan yang dibutuhkan. Ping tidak mengubah baseline. Baseline sessionStorage terpisah per tab; pada sesi tab baru muat snapshot/match cloud sebelum mengedit record yang sudah ada. Hindari editing paralel dalam satu profil browser.

## Operasi dan pemulihan

Spreadsheet/folder harus Restricted; tidak perlu sharing publik untuk Pages. Lihat DATABASE.md untuk skema/restore dan TESTING.md untuk uji live. Jangan memakai ID spreadsheet V6.4 lama karena skema berbeda. Muat arsip lama lewat frontend lalu simpan kembali setiap pertandingan.

Setelah load snapshot atau impor bundle pada cloud, klik **Muat ulang aplikasi** agar halaman utama Apps Script dibuka kembali. Reload iframe internal langsung dapat menghasilkan halaman kosong; adapter sudah memakai tautan reload tingkat atas. Muat satu pertandingan memperbarui state scoring tanpa reload iframe.

Update: edit source, build/tests, upload App/Code yang berubah, buat versi deployment baru yang sama. Jangan menumpuk backend lama dengan nama fungsi sama.

## Alternatif Workspace organisasi

Hapus CPL_AUTH_MODE atau set WORKSPACE; isi CPL_WORKSPACE_DOMAIN, CPL_ALLOWED_EMAILS, CPL_ADMIN_EMAIL. Ubah manifest/deployment menjadi DOMAIN / USER_DEPLOYING. Email harus cocok domain DAN allowlist; kosong ditolak. Setiap akun allowlist mendapat akses baca/tulis seluruh workspace. Ini alternatif organisasi, bukan mode Gmail lintas domain.
