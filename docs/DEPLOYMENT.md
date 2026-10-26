# Status hosting dan cloud

26 Oktober 2026.

- Repository GitHub dibuat: https://github.com/tukangolahraga/cricket-performance-lab
- Proyek Apps Script baru: Cricket Performance Lab — V6.4 Private. Proyek Cricket Jakarta lama tidak diubah.
- Backend diatur untuk Gmail pribadi, hanya pemilik (PERSONAL_OWNER).
- 22 test lokal lulus; ini belum membuktikan penyimpanan Google sungguhan.
- Situs Pages aktif dan dibuka melalui browser: https://tukangolahraga.github.io/cricket-performance-lab/
- Apps Script versi 3 terbit dengan Only myself / User accessing the web app. URL ada di config.js.
- Ping live mengenali akun pemilik. Spreadsheet dan folder backup dibuat oleh setup.
- Save match live berhasil: ID 1793005853424, revision 1, tiga delivery (4 normal, wide minimum 1, no-ball + 2 bat runs), skor 8/0 pada 0.1 over. Semua nama adalah data sintetis TEST KONEKSI.
- Daftar match dan histori lawan berhasil membaca satu match dari backend/backup.
- Save snapshot live berhasil pada revision 1; file snapshot_r1_5d5c7f96-2444-4e56-ae4e-78fb06bdd8c5.json terlihat di Drive bersama backup match.
- Baris Matches terlihat di Sheets. UI Sheets menyatakan Private only to me; sharing folder Drive menyatakan Restricted dengan satu pemilik.
- Reload iframe diperbaiki: snapshot menawarkan Muat ulang aplikasi, match memperbarui state langsung. Source perbaikan terkonfirmasi pada deployment versi 3; 22 test lokal lulus.
- Uji tombol load melalui konfirmasi, lintas browser/perangkat, akun lain, restore penuh, semua modul video, dan quota belum selesai diverifikasi. Smoke test ini bukan seluruh checklist lulus.

Email pemilik, Script Properties, credential, dan data atlet tidak dimasukkan dalam repository publik.
