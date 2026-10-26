# Skema, revisi, dan backup

## Tabel ternormalisasi

Header persis tersedia pada `TABLES_` di `backend/Code.gs`; `setup` membuat tabel kosong secara idempoten. Tidak ada data atlet contoh di repository.

| Tabel | Kunci/relasi | Isi |
|---|---|---|
| Teams | `teamId` | ID hash nama tim yang sudah trim/NFKC/lowercase; nama tampilan |
| Players | `playerId` → Teams | Identitas pemain dan UID opsional |
| Matches | `matchId`, revision, batchId | Pointer versi aktif, format, teamA/B → Teams, fileId/hash backup |
| MatchTeams | matchId + batchId + slot | Slot 0/1 → Teams |
| Rosters | matchId + batchId + slot + localPlayerId | ID scorecard → Players |
| Innings | matchId + batchId + innings | Batting slot, selesai, alasan |
| Deliveries | matchId + batchId + innings + sequence | Striker/non-striker/bowler/dismissed → Players; runs/extras/wicket/koordinat |
| Snapshots | `workspace` | Pointer snapshot lengkap, revision, fileId/hash |
| Audit | append log | waktu, email, aksi, ID, revision |

Teams yang namanya sama sesudah normalisasi dianggap tim yang sama. Alias/ejaan berbeda tidak disatukan otomatis; rename menghasilkan teamId baru. Pastikan nama tim konsisten. Tidak ada fuzzy matching.

UID pemain yang disediakan oleh frontend menjadi identitas lintas pertandingan. Jika UID tidak ada, playerId di-scope berdasarkan matchId + slot + localPlayerId; `0-0` dari pertandingan berbeda tidak dianggap orang yang sama. Player Intelligence asli juga memakai registry lokal; audit source tidak menyatakan seluruh pemain otomatis mendapat UID. Tautkan identitas melalui Database Atlet dan tinjau hasilnya. Satu UID tidak boleh muncul dua kali dalam roster pertandingan. Nama/team pada Players merupakan nilai pertama yang terdaftar; roster/nama saat pertandingan tersimpan utuh di JSON backup. Untuk transfer tim, gunakan roster pertandingan saat membaca konteks historis, bukan atribut teamId pertama Players sebagai satu-satunya sumber.

Kolom normalized menyimpan nilai utama untuk query. Metadata lanjutan seperti catatan delivery, jenis pukulan/bola, timestamp, state scoring, asesmen, dan undo/redo tersimpan di JSON lengkap. Load match menggunakan backup JSON yang tervalidasi, bukan rekonstruksi lossy dari tabel.

## Aturan pembacaan versi aktif

Setiap save membuat batch UUID baru. Untuk tabel MatchTeams/Rosters/Innings/Deliveries, gunakan hanya baris dengan pasangan `(matchId,batchId)` yang cocok dengan baris Matches. **Jangan menjumlahkan seluruh Deliveries mentah**, karena batch lama tetap tersimpan. Sequence dan innings dimulai dari nol pada tabel.

Teams dan Players dideduplikasi berdasarkan ID. Entri baru yang tersisa dari write gagal tidak terlihat sebagai pertandingan aktif tetapi bisa ada pada tabel dimensi. Spreadsheet bukan SQL: kunci asing/unik ditegakkan kode aplikasi, bukan mesin Sheets. Edit manual tabel dapat melanggar invariant dan tidak didukung.

## Protokol save

1. Verifikasi identitas dan validasi request.
2. Ambil ScriptLock; bandingkan baseRevision dengan versi server (pertandingan masing-masing atau snapshot workspace).
3. Buat file backup JSON privat di Drive.
4. Untuk pertandingan, append dimensi dan batch rows, kemudian flush.
5. Terbitkan pointer Matches/Snapshots terakhir, flush, lalu coba catat audit.
6. Baru kembalikan hasil save kepada frontend. Halaman hanya menampilkan sukses setelah respons server diterima.

Revisi lama dan file backup tetap ada. Write gagal sebelum pointer mempertahankan versi aktif sebelumnya; batch/file yatim boleh tersisa. Jangan membuat proses pembersihan otomatis sebelum kebijakan retensi dan prosedur restore teruji. Tidak ada jaminan transaksi lintas layanan atau exactly-once ketika jaringan terputus setelah commit.

Baseline revisi disimpan pada sessionStorage per tab, terpisah dari 13 dataset localStorage. Save pada tab lain tidak boleh menaikkan baseline tab yang masih memegang data lama. Setelah menutup tab dan membuka sesi baru, muat snapshot/match cloud sebelum mengedit dan menyimpan record yang sudah ada. localStorage dataset tetap dibagi antartab pada origin yang sama; hindari editing paralel di satu profil browser.

## Snapshot vs database lawan

Snapshot menyimpan 13 dataset localStorage sebagai JSON di Drive dan pointer ringan di Sheets, sehingga data di atas 49.000 karakter tidak dipaksa masuk satu sel. Save snapshot mengganti seluruh snapshot workspace: kunci yang tidak dikirim menjadi tidak ada. Tidak ada merge, dan database pertandingan tidak diindeks otomatis dari arsip snapshot.

Save pertandingan menyimpan satu match tanpa asesmen di dataset lain. History lawan membaca maksimum 60 match terbaru yang cocok; respons mengungkap total dan truncation. Kegagalan satu backup membuat history gagal secara eksplisit, bukan diam-diam menyajikan hasil yang kurang lengkap. List match tidak dibatasi 60 tetapi tetap terkena quota/durasi Apps Script saat database membesar.

Ini rancangan tim kecil. Append revisi menambah konsumsi sel dan quota. Untuk volume besar, pindah ke database yang mendukung transaksi, pagination, kontrol akses per-record, dan proses retensi.

## Backup dan pemulihan

File `snapshot_r…json` berisi schema `CPL_SNAPSHOT_1`, revision, savedAt, datasets. File `match_…json` berisi `CPL_MATCH_1`, revision, batchId, savedAt, match. Backup lama immutable menurut perilaku aplikasi, tetapi pemilik Drive tetap bisa mengedit/menghapusnya.

Pemulihan dilakukan sebagai **save baru**, tanpa memundurkan pointer/revisi secara manual:

1. Admin membuka folder privat dari `CPL_BACKUP_FOLDER_ID`, mengunduh backup yang benar, lalu menyimpan salinan lokal sebelum perubahan.
2. Konversi offline (jangan simpan file data di repository):

```sh
node scripts/restore-backup.mjs /path/to/downloaded-backup.json /path/outside-repo/recovery.json
```

3. Untuk snapshot: di workspace cloud ekspor data lokal, Ambil data Cloud terbaru agar base revision benar, lalu Impor bundle lengkap hasil konversi. Review dan Simpan data lokal ke Cloud untuk membuat revisi baru.
4. Untuk match: Daftar pertandingan cloud → muat match ID yang sama untuk mendapatkan revisi terbarunya. Setelah ekspor lokal, gunakan fitur impor JSON pertandingan asli untuk membuka `recovery.json` (bukan tombol bundle). Kemudian Simpan pertandingan ke Cloud; ID harus tetap sama.
5. Jika match tersebut belum pernah ada pada backend baru, base revision 0 dipakai. Jika browser menyimpan baseline milik backend lain, gunakan browser/profil khusus setelah mengekspor semua data. Jangan menghapus data browser sebelum backup.
6. Verifikasi ulang dari browser kedua, periksa revisi baru, jumlah delivery dan file backup baru. Ulangi checklist sebelum memulihkan data penting.

Tool konversi memeriksa schema tetapi bukan bukti keaslian backup yang diunduh; admin harus memilih file dari folder terpercaya. Gunakan export sebelum setiap restore. Tidak ada tombol restore server otomatis dalam paket ini.
