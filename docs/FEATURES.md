# Retensi fitur dan asal sumber

Permintaan chat adalah mempertahankan V6.4 Popup Edition. API `read_thread` mengembalikan pesan terkait tetapi `attachments: []`; isi jawaban lama hanya content-reference. Pencarian file lokal menemukan `cricket_performance_lab_v6_4_popup.html` di Downloads, juga ZIP opponent_database/backend_fixed dan `Code_FIXED_V6_4.gs`. File Popup tersebut dipilih karena nama, isi, controller popup, dan adapter cloud cocok dengan percakapan. Hubungan byte-identik dengan lampiran chat tidak dapat diverifikasi lewat API.

Source HTML serta backend lama dibaca sebelum perubahan. Salinan HTML asli dipertahankan tanpa edit di `reference/`; SHA-256 tersedia di `source-manifest.json`. Backend lama tidak dipasang karena memiliki skema berbeda, pembatasan satu sel snapshot, dan aturan allowlist/domain yang perlu diperketat.

Build mempertahankan **enam blok script non-adapter asli** sebagai teks identik, seluruh ID fitur dan tombol popup. Dua blok yang diganti: `cpl-cloud-bridge` dan `cpl-opponent-db-v64`. Styling, markup fitur, perhitungan scoring, dan menu tetap bersumber dari HTML asli. Satu teks penjelasan batas snapshot diperbarui; config dan adapter repository ditambahkan. Klaim ini berdasarkan pengujian source, bukan bukti seluruh interaksi browser sudah lulus.

| Fitur yang ditemukan pada source | Perlakuan |
|---|---|
| Dashboard/sidebar, Coach Command Center | Dipertahankan |
| T20, SIXES, SUPER8; setup roster | Dipertahankan |
| Live scoring, extras, free-hit, wicket, innings/chase, papan skor | Mesin asli dipertahankan |
| Undo/redo, ringkasan, scorecard, grafik runs/over | Dipertahankan |
| Wagon Wheel, Pitch Map, tagging delivery | Dipertahankan |
| Video Studio/refinement, marker, clip playlist, dua video | Dipertahankan; video harus dipilih lokal |
| Coaching annotation V3.2 dan coaching intelligence V4 | Dipertahankan |
| Athlete Development V4.1, archive, Database Atlet V4.2 | Dipertahankan |
| Evidence Studio V5; motion/pose/technique V5.1–5.7 | Dipertahankan; CDN pose dan browser perlu pengujian |
| Integrated Report V5.8, scouting V5.9, asesmen V6.0 | Dipertahankan |
| Ekspor/impor/print laporan asli | Dipertahankan |
| Opponent Intelligence, Player Intelligence live/history/combined | Dipertahankan |
| Popup tiga panel, toggle/close, Escape, backdrop, fokus/Tab | Controller asli dipertahankan |
| Cloud Sync snapshot dan match/history adapter | Diganti, tetap memakai tombol lama |
| Daftar/muat match cloud; transfer bundle lengkap | Ditambahkan |

Opponent Intelligence awal tetap berfokus pada match aktif. Player Intelligence menerima histori cloud setelah fetch dan event `cpl-opponent-db-loaded`; ini perilaku sumber asli, bukan perubahan seluruh modul menjadi query Sheets langsung.

Semua 13 kunci localStorage yang dibaca bridge lama juga dipakai bridge baru. File video/Blob, model MediaPipe, dan preferensi yang tidak termasuk 13 kunci tersebut tidak ikut bundle. Mode pose/asesmen tetap membawa batas interpretasi dari source; tidak ada model AI baru atau perhitungan olahraga baru.
