# Hasil verifikasi lokal

Tanggal: 26 Oktober 2026. Lingkungan: Windows, Node.js v24.22.0.

Perintah yang dijalankan: `npm run check` (build lalu Node test runner).

**Hasil terbaru: 22 test lulus, 0 gagal, 0 dilewati.** Mode Gmail pribadi ditambahkan dan diuji setelah paket pertama disiapkan.

| Kelompok | Bukti lokal |
|---|---|
| Backend — 12 test | Auth semua endpoint, Gmail hanya pemilik, admin, setup berulang, tiga format, normalisasi/round-trip, konflik, write gagal, integritas backup, snapshot besar/penggantian, payload, validasi/formula, UID |
| Adapter klien — 4 test | Mode Pages menolak save cloud, ping tidak mengubah baseline, load/save revision, kegagalan match tidak mengonfirmasi sukses |
| Retensi/build — 5 test | Enam script fitur asli tetap identik, ID fitur/popup tetap ada, kedua hasil HTML sama, semua inline script dapat diparse, checksum, tanpa cross-origin fetch/credential, baseline per tab |
| Restore — 1 test | Snapshot/match dikonversi ke format impor yang sesuai; output lama tidak ditimpa |

Source asli: `reference/v6.4-popup-original.html`.

SHA-256: `825812a9cba282be52738e4a2a55a59d7ab226c2aa26d4f2ca5af298da55b379`.

Delapan blok script ditemukan pada source. Dua adapter diganti dan enam lainnya dipertahankan sebagai teks identik. Pemeriksaan ini mendukung retensi implementasi fitur, bukan klaim bahwa semua interaksi visual atau browser telah diverifikasi.

Backend dites dengan mock layanan Google; adapter klien memakai mock DOM dan runner. Tidak ada browser regression, OAuth/login, deployment, consent, ACL domain, Sheets/Drive nyata, quota, MediaPipe CDN, atau pengujian live yang dijalankan. Checklist seluruh pengujian tersebut tetap kosong di `TESTING.md`.

Perkembangan hosting/deployment setelah uji lokal dicatat terpisah di DEPLOYMENT.md. Tidak ada data atlet pengguna yang digunakan pada test lokal.
