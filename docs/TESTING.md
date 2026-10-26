# Pengujian dan checklist

Smoke test nyata dijalankan pada 26 Oktober 2026 untuk hosting, ping pemilik, save match/snapshot, daftar/histori match, serta pemeriksaan Sheets/Drive dan privasi. Lihat DEPLOYMENT.md. Checklist berikut adalah prosedur penerimaan lengkap dan belum semuanya dijalankan.

## Pengujian otomatis lokal

Jalankan `npm run check`. Backend dijalankan dalam Node VM dengan mock Google Session/Properties/Lock/Sheets/Drive/HTML Service. Ini tidak menghubungi Google. CI memakai suite sama. Lihat `VALIDATION.md` untuk hasil yang benar-benar dijalankan.

Suite memeriksa penolakan identitas, admin setup idempoten, tiga format match, foreign keys, round-trip metadata, konflik revisi, kegagalan Drive/index/pointer, file hilang/rusak, snapshot di atas ukuran sel, batas payload, validasi, formula escaping, UID, retensi source dan parsing script. Mock adapter klien memeriksa mode lokal, ping, baseline load/save, dan kegagalan match. Tool restore diuji untuk format impor dan penolakan overwrite.

Mock tidak memodelkan seluruh perilaku Sheets (mis. formula/format sel), jaringan, cookie, sandbox HTML Google, quota, izin, dan kontensi request sungguhan.

## Regresi browser V6.4 — BELUM DIJALANKAN

- [ ] Klik save menampilkan status memproses; klik ketika sibuk memberi penjelasan; balasan yang terlambat tidak dianggap sukses setelah timeout 60 detik. Periksa cloud dahulu sebelum retry karena write mungkin sudah committed.

- [ ] Buka `index.html` dari file dan dari Pages; tidak ada error startup di console.
- [ ] Buat T20 (11), SIXES (6), SUPER8 (8); jumlah pemain salah ditolak.
- [ ] Catat 0/1/4/6 run, wide, no-ball, bye, leg-bye, wicket; periksa balls faced, over sah, free-hit, strike dan economy sesuai perilaku V6.4.
- [ ] Undo/redo, ganti bowler saat over, akhir innings, chase/tie/all-out; scoreboard dan tabel sesuai.
- [ ] Buka popup lawan, pelatih, database saat scoring; tutup lewat tombol, Escape, backdrop; fokus kembali dan Tab tetap dalam popup.
- [ ] Navigasi semua menu: coaching/evidence, athlete database/development, motion batting/bowling, scouting dan asesmen.
- [ ] Tambah shot/pitch map, marker video, anotasi, playlist, perbandingan dua video; ekspor/impor/print laporan.
- [ ] Jalankan pose dengan video sintetis/test non-sensitif; uji kegagalan CDN/offline juga. Jangan klaim video dicadangkan.
- [ ] Reload mengembalikan data lokal; browser penuh/penyimpanan diblokir menampilkan kegagalan, bukan sukses cloud.
- [ ] Ekspor bundle 13 dataset dan impor pada alamat browser lain. Periksa setiap modul setelah reload.

## Auth live pribadi — BELUM DIJALANKAN

- [ ] CPL_AUTH_MODE=PERSONAL_OWNER dan CPL_ADMIN_EMAIL sesuai pemilik.
- [ ] Deployment Only myself, execute as user accessing; file/folder Restricted.
- [ ] Ping menunjukkan email pemilik; akun lain/tanpa login ditolak.
- [ ] Semua endpoint menolak email kosong atau berbeda dari pemilik.

## Auth live Workspace alternatif — BELUM DIJALANKAN

- [ ] Deployment execute-as-owner, akses domain saja, Sheets/folder Restricted.
- [ ] Akun allowlist domain membuka `/exec`; ping mengembalikan email pengguna tersebut.
- [ ] Akun domain tanpa allowlist ditolak pada halaman dan fungsi server.
- [ ] Akun luar domain dan browser tanpa login ditolak; jangan melonggarkan ACL untuk meluluskan uji.
- [ ] Email aktif kosong gagal tertutup.
- [ ] Hapus satu email allowlist; panggilan berikutnya dari akun itu harus gagal.
- [ ] Editor script hanya admin; pelatih tidak memiliki izin langsung ke spreadsheet/folder.

## Uji penyimpanan end-to-end live — BELUM DIJALANKAN

Gunakan tim/pemain sintetis. Simpan bukti: waktu, akun uji, match ID, revision, jumlah delivery, file backup. Hindari log berisi identitas atlet nyata.

1. [ ] Pada backend baru, buat match SIXES. Catat 4 normal, 1 wide tambahan 0, no-ball dengan 2 run bat. Expected: skor 8, satu bola sah; tiga delivery. Simpan pertandingan.
2. [ ] Tunggu respons sukses berisi match ID/revision/delivery/savedAt. `Periksa Koneksi` atau badge lokal bukan bukti save.
3. [ ] Di Sheets, Matches memiliki revision 1, batchId dan fileId; Rosters berisi 12 baris untuk batch aktif; Deliveries berisi 3. Periksa foreign keys.
4. [ ] Di folder Drive terdapat file match dengan schema CPL_MATCH_1. Unduh dan cocokkan run/extras/koordinat/catatan. Jangan ubah backup aktif untuk eksperimen selain di proyek uji terpisah.
5. [ ] Browser/profil kedua: daftar match → muat ID yang sama. Nilai scorecard harus sama, lalu reload dan pastikan state masih ada.
6. [ ] Tambahkan delivery di perangkat A dan save revision 2. Perangkat B yang masih revision 1 harus mendapat CONFLICT; tidak ada sukses palsu. Ekspor versi B, muat terbaru lalu ulang perubahan dengan sadar.
7. [ ] Ambil history nama tim dalam variasi huruf/whitespace; Player Intelligence Historical/Combined memuat bukti tanpa double count match aktif. Uji nama tidak ada.
8. [ ] Simpan seluruh snapshot dengan catatan/asesmen di beberapa modul. Periksa Snapshots pointer dan backup Drive, lalu load di browser kedua. Hilangkan satu dataset dan pastikan save berikutnya menghapusnya dari snapshot aktif.
9. [ ] Uji snapshot JSON lebih dari 49.000 karakter tetapi di bawah batas 8 MB. Load harus mengembalikan data utuh tanpa potongan sel.
10. [ ] Matikan jaringan saat save di proyek uji; UI harus melaporkan kegagalan. Setelah jaringan pulih, baca server dahulu karena save mungkin telah committed sebelum koneksi putus.
11. [ ] Uji formula-leading nama sintetis pada proyek uji: sel tidak menjalankan formula, backup tetap menyimpan nama asli.
12. [ ] Download backup lama, konversi dengan tool restore, impor setelah memuat revisi terbaru dan save sebagai revisi baru. Verifikasi di browser kedua.

## Catatan penerimaan

Isi sendiri setelah uji: tanggal ___; tester ___; deployment version ___; browser ___; akun/domain uji ___; match ID ___; revisi ___; backup ___; hasil ___; kendala ___. Jangan menandai checklist sebagai lulus hanya karena unit test lokal lulus.
