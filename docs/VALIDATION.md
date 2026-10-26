# Hasil verifikasi lokal

Tanggal: 26 Oktober 2026. Lingkungan: Windows, Node.js v24.22.0.

Perintah yang dijalankan: `npm run check` (build lalu Node test runner).

**Hasil terbaru: 23 test lulus, 0 gagal, 0 dilewati.** Termasuk mode Gmail pribadi serta status proses, klik saat sibuk, dan pemulihan tombol setelah request timeout.

| Kelompok | Bukti lokal |
|---|---|
| Backend — 12 test | Auth semua endpoint, Gmail hanya pemilik, admin, setup berulang, tiga format, normalisasi/round-trip, konflik, write gagal, integritas backup, snapshot besar/penggantian, payload, validasi/formula, UID |
| Adapter klien — 5 test | Mode Pages, baseline, load/save, kegagalan match, progress/busy/timeout tanpa sukses palsu |
| Retensi/build — 5 test | Enam script fitur asli tetap identik, ID fitur/popup tetap ada, kedua hasil HTML sama, semua inline script dapat diparse, checksum, tanpa cross-origin fetch/credential, baseline per tab |
| Restore — 1 test | Snapshot/match dikonversi ke format impor yang sesuai; output lama tidak ditimpa |

Source asli: `reference/v6.4-popup-original.html`.

SHA-256: `825812a9cba282be52738e4a2a55a59d7ab226c2aa26d4f2ca5af298da55b379`.

Delapan blok script ditemukan pada source. Dua adapter diganti dan enam lainnya dipertahankan sebagai teks identik. Pemeriksaan ini mendukung retensi implementasi fitur, bukan klaim bahwa semua interaksi visual atau browser telah diverifikasi.

Hasil 22 test di atas berasal dari mock Google serta mock DOM/runner. Setelah suite lokal, smoke test nyata dijalankan: Pages dibuka, Apps Script versi 3 terbit, ping pemilik sukses, save match/snapshot sukses, daftar/histori match terbaca, baris Matches dan dua backup Drive terlihat, serta privasi Sheets/folder diperiksa. Rincian dan batas pengujian ada di DEPLOYMENT.md. Ini belum merupakan seluruh regresi browser, uji akun lain, restore penuh, quota, atau MediaPipe CDN.

Perkembangan hosting/deployment setelah uji lokal dicatat terpisah di DEPLOYMENT.md. Tidak ada data atlet pengguna yang digunakan pada test lokal.
