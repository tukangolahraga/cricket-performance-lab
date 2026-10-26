# Desain keamanan dan keterbatasan

## Batas origin GitHub Pages

GitHub Pages menyajikan file statis publik. Halaman itu tidak memiliki `google.script.run`; API tersebut disediakan oleh Apps Script HTML Service. Paket ini membuka URL workspace Google secara langsung di tab baru. Tidak ada relay postMessage, iframe dengan izin terbuka, REST write endpoint, JSONP, atau `fetch(..., {mode:'no-cors'})` yang hasilnya dianggap sukses.

`no-cors` menghasilkan respons opaque dan tidak membuktikan write berhasil. ContentService memiliki redirect serta pembatasan browser; paket tidak menggunakannya sebagai API lintas origin yang memerlukan autentikasi. Jika cloud harus tetap berada dalam UI Pages yang sama, diperlukan komponen server/proxy lain dengan CORS dan verifikasi identitas yang tepat. Komponen itu tidak termasuk paket empat layanan ini.

## Identitas dan akses

**Default saat ini: Gmail pribadi, hanya pemilik.** Set CPL_AUTH_MODE=PERSONAL_OWNER dan CPL_ADMIN_EMAIL pada Script Properties. Manifest MYSELF / USER_ACCESSING membatasi app ke pemilik deployment. Backend juga mewajibkan email aktif sama dengan admin; kosong ditolak. Izin email/Sheets/Drive perlu ditinjau pemilik. Frontend publik tidak memberi akses cloud kepada pengunjung.

Butir Workspace berikut adalah konfigurasi alternatif untuk organisasi, bukan persyaratan mode pribadi:

- Deployment wajib domain Workspace yang sama, execute-as-owner dan akses domain. Semua endpoint termasuk `doGet`, `ping`, load/save dan daftar pertandingan memanggil `who_`.
- Identitas berasal dari `Session.getActiveUser().getEmail()`; kosong berarti ditolak. Email harus cocok dengan **domain DAN allowlist**. Tidak ada fallback ke identitas pemilik atau email dari klien.
- Helper berakhiran `_` tidak dapat dipanggil melalui `google.script.run`. `setup` juga memerlukan admin. Tidak ada endpoint yang menerima alamat spreadsheet/folder dari klien.
- Setiap email allowlist adalah pelatih dengan akses baca/tulis ke seluruh workspace. Tidak ada pembagian tim, tenant, atau peran read-only. Hapus email dari Script Properties untuk mencabut akses panggilan berikutnya; data yang sudah diekspor atau tersimpan lokal tidak bisa ditarik kembali.
- Mode execute-as-owner menjaga sumber daya pribadi pemilik. Jangan membagikan Sheets, folder, atau proyek script kepada pelatih kecuali mereka memang perlu menjadi administrator. Editor proyek bisa mengubah kontrol akses.

Domain-only access tidak cukup tanpa allowlist. Pengecekan aplikasi tidak menggantikan pengaturan deployment dan ACL Drive.

## Data dan validasi

Input match dibatasi ukuran, format, roster, ID, referensi pemain, angka runs/extras, dismissal, koordinat, innings, dan jumlah delivery. Ini pemeriksaan integritas struktur, bukan pembuktian bahwa log adalah pertandingan sah atau penerapan lengkap semua Laws of Cricket. Mesin scoring asli tetap menjadi acuan perilaku V6.4.

String yang bisa menjadi formula di Sheets diberi awalan apostrof. JSON asli tetap disimpan utuh di Drive. Hash SHA-256 memeriksa kesesuaian file backup saat dibaca; hash bukan tanda tangan atau perlindungan terhadap administrator yang mengubah spreadsheet dan file sekaligus.

Snapshot menerima hanya 13 kunci dataset dengan nilai JSON string dan maksimum 8.000.000 byte untuk request. Snapshot tidak memvalidasi seluruh skema asesmen lama. File match dibatasi 1.200.000 byte. Batas ini membantu operasi, bukan jaminan terhindar dari quota Google. Tidak ada rate limiter khusus; akses dibatasi domain/allowlist, lock, dan quota Google.

## Hal yang tetap harus diperiksa

Source frontend lama dipertahankan; paket ini bukan audit keamanan menyeluruh untuk seluruh kode V6.4. Impor file hanya dari sumber tepercaya. CDN MediaPipe merupakan dependensi eksternal versi tetap dari frontend asli; script pihak ketiga berjalan di konteks frontend dan dapat melihat data yang tersedia di halaman. Organisasi dengan persyaratan ketat perlu meninjau atau meng-host sendiri dependensi tersebut sebelum penggunaan sensitif.

localStorage dan file ekspor tidak dienkripsi aplikasi. Jangan gunakan akun browser bersama untuk data atlet. Backup tidak otomatis dihapus; tetapkan retensi dan hapus salinan secara terkendali setelah kebutuhan pemulihan selesai. Audit adalah catatan operasional, bukan audit tahan manipulasi; kegagalan audit setelah commit tidak membatalkan save.

Apps Script/Sheets/Drive bukan database transaksional penuh. Penyimpanan append + pointer terakhir mengurangi keterbacaan batch parsial. Jika request time out setelah pointer tersimpan, hasil mungkin sudah committed meskipun browser melihat kegagalan. Ekspor data lokal dan muat ulang server sebelum retry; jangan menaikkan revisi secara manual. Raw table mencakup revisi lama dan batch gagal; analisis harus join ke pointer `Matches.batchId`.

## Referensi resmi yang diperiksa saat menyusun paket

- [Web Apps: execution identity dan deployment](https://developers.google.com/apps-script/guides/web)
- [HTML Service: server calls dan helper privat](https://developers.google.com/apps-script/guides/html/communication)
- [Session: keadaan email aktif tersedia atau kosong](https://developers.google.com/apps-script/reference/base/session)
- [ContentService: redirect dan JSONP](https://developers.google.com/apps-script/guides/content)

Verifikasi lokal tidak membuktikan identitas Workspace, consent, ACL, quota, atau perilaku browser Google. Uji manual pada deployment Anda wajib sebelum memakai data nyata.
