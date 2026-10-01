# Prompt lanjutan Claude Design: desain semua map "Mikro!" (Batch 6+)

Lanjutan dari proyek aset 3D yang sudah selesai sampai **Batch 5** (lihat `PROMPT_ASET_3D.md`).
Salin blok **PROMPT** di bawah ke proyek Claude Design yang sama, supaya gaya Batch 0–5 tetap jadi patokan.
Kerjakan **satu tahap per pesan** (Tahap A dulu, tunggu persetujuan, baru Tahap B, dst.).

---

## PROMPT (salin mulai dari sini)

Kita lanjutkan proyek ini. Batch 0–5 (lembar gaya, karakter, sampah, desa, sungai & pasar, lingkungan jauh) sudah selesai dan **sudah dipakai di game**. Gaya, palet, dan spesifikasi teknisnya tetap sama persis. Jangan mengubah aset yang sudah ada kecuali diminta.

### Konteks baru
- Nama game sekarang **"Mikro!"** (tokoh utama tetap Cing, cacing tanah bertopi daun).
- Game ini bagian dari **paket edukasi wisata tentang sampah**. Pemainnya **pelajar SD sampai SMA** yang berkunjung, sering bermain berkelompok bersama pemandu wisata, di HP (mendatar) atau laptop. Satu sesi wisata ±20–40 menit, jadi **tiap map harus bisa selesai dalam 6–10 menit**.
- Pesan inti: ada 7 jenis plastik (kode 1–7 di kemasan), tiap jenis perlakuannya beda, plastik sangat lama terurai lalu jadi **mikroplastik** yang merusak tanah, dan urutan terbaik adalah **kurangi → pakai ulang → daur ulang → buang**.
- Kedalaman dua lapis: **SD** cukup paham lewat ikon, warna, dan aksi. **SMA** bisa membuka "Fakta Lanjut" (bahan kimia, dampak kesehatan, ekonomi sirkular).
- **Tidak ada game over.** Kesalahan memberi konsekuensi yang terlihat (tanah makin kusam, Cing sedih), bukan hukuman.

### Yang sudah ada di game (jangan didesain ulang dari nol)
- **Desa Lestari (hub)**: pulau ±48 × 40 m, sumur, Tempat Daur Ulang, **Gerbang Waktu** (lengkung batu), papan petunjuk ke area lain.
- **Sungai (kode 1 PET)**: ambil jaring di pondok Pak Udin, pungut 6 botol PET (sebagian di air), pasang Lensa Waktu untuk membuka jalan yang tertutup daun.
- **Pasar (kode 4 LDPE)**: kumpulkan 5 kresek, tukar dengan tas kain di lapak Bu Sari, bersihkan saluran yang tersumbat.
- Sistem yang sudah jalan dan bisa dipakai di semua map:
  - keranjang (maks. 10 barang) dan Kartu Plastik (codex 7 kartu);
  - minigame pilah di Tempat Daur Ulang;
  - **Lensa Waktu** (memajukan waktu di satu titik, maks. 50 tahun) dan **Gerbang Waktu** (ramalan desa sampai 1000 tahun);
  - kesehatan tanah per area (0–100%), alat (jaring, lensa, tas kain, pencapit);
  - dialog dengan potret, kontrol sentuh (joystick + tombol Aksi).
- Angka lama terurai yang dipakai game (jangan diganti): PET 450 th, HDPE 100 th, PVC 400 th, LDPE 200 th, PP 50 th, PS 500 th, Other 1000 th, daun ±5 bulan, kulit pisang ±1 tahun.

### Tugasmu
Desain **semua map** (konten + gameplay), lalu buat aset 3D-nya per batch dengan spesifikasi yang sama seperti Batch 1–5.

---

### TAHAP A — Peta besar & alur (kerjakan dulu, tunggu persetujuan)
1. **Peta dunia**: hub di tengah, 7 area mengelilinginya (1 area per kode plastik), dan urutan buka yang disarankan. Gambar sebagai ilustrasi peta pulau-pulau gaya buku cerita (dilihat dari atas, gaya sama dengan lembar gaya).
2. **Kurva belajar**: urutan area dari yang paling mudah dipahami (botol, kresek) ke yang paling sulit (PVC beracun saat dibakar, plastik "Other" multilapis), dan alat yang didapat di tiap area yang membuka area berikutnya.
3. **"Paspor Penjaga Tanah"**: tiap area yang selesai memberi **cap/stempel** di paspor (desain 7 cap + sampul). Ini juga jembatan ke wisata nyata: pemandu bisa memberi **kode pos wisata** (4 huruf) yang membuka "fakta bonus" area itu. Desain tampilannya.

Rancangan awalku (boleh kamu perbaiki dan beri alasan):

| # | Area | Kode | Tema | Mekanik utama | Alat yang didapat |
|---|---|---|---|---|---|
| 1 | Sungai *(sudah ada)* | 1 PET | Botol hanyut | Menjaring botol di air | Jaring |
| 2 | Pasar *(sudah ada)* | 4 LDPE | Kresek beterbangan | Tukar kresek → tas kain, buka saluran | Tas kain |
| 3 | Kebun | 2 HDPE | Botol sampo & jeriken jadi pot | **Pakai ulang/kerajinan**: ubah sampah HDPE jadi pot & penyiram, lalu tanam bibit | Penyiram |
| 4 | Sekolah (kantin) | 5 PP | Gelas & wadah makan sekali pakai | **Isi ulang**: pasang stasiun air minum, ajak siswa NPC bawa tumbler & kotak bekal | Tumbler |
| 5 | Warung | 6 PS | Styrofoam bungkus makanan | **Ganti kemasan**: layani pembeli dengan daun pisang/besek, bukan styrofoam | Besek |
| 6 | Bengkel | 3 PVC | Pipa & kabel bekas, asap pembakaran | **Hentikan pembakaran sampah** (asap beracun), kumpulkan PVC ke penampung khusus | Sarung tangan |
| 7 | Gudang/Bank Sampah | 7 Other | Galon, sachet, kemasan multilapis | **Bank sampah**: timbang & tabung sampah, buat ecobrick dari sachet | Buku tabungan |
| ★ | Festival Desa | semua | Final | Gerbang Waktu final + desa 100 tahun lagi + pesta | — |

---

### TAHAP B — Lembar desain per map (satu map per pesan)
Untuk **setiap** area (termasuk perbaikan hub, Sungai, dan Pasar), serahkan satu lembar desain berisi:

1. **Denah atas** pulau ±48 × 40 m (koordinat meter, titik 0,0 di tengah, utara = −Z):
   - titik masuk/keluar (dermaga atau jembatan dari hub);
   - jalur utama;
   - landmark yang terlihat dari jauh;
   - lokasi NPC;
   - posisi sampah (8–12 buah, beri jenis & kode);
   - lokasi **batu soket Lensa Waktu**;
   - titik puzzle.
2. **Suasana**: 3 kata kunci + 1 ilustrasi sudut kamera pemain (kamera RPG rendah di belakang pemain).
3. **Alur misi** 3–4 langkah dengan objektif yang jelas, contohnya: "Ambil sekop di gudang kebun → kumpulkan 4 botol HDPE → ubah jadi pot di meja kerja → tanam 4 bibit".
4. **Mekanik khas area** dijelaskan seperti untuk programmer: input pemain, umpan balik visual, kondisi berhasil, apa yang terjadi kalau salah.
5. **Momen Lensa Waktu**: satu puzzle yang membuktikan bahwa organik cepat hilang tapi plastik bertahan. Contoh di Warung: bungkus daun pisang hancur dalam beberapa bulan, sedangkan styrofoam masih utuh setelah 50 tahun.
6. **NPC**: nama Indonesia, peran, kepribadian satu kalimat, warna baju, dan 3 contoh kalimat dialog pendek (maks. 2 baris, ramah anak).
7. **Fakta**: 1 fakta SD (satu kalimat) dan 2 "Fakta Lanjut" SMA, dengan sumber yang bisa dicek.
8. **Konsekuensi**: apa yang berubah di dunia saat area bersih (warna kembali, hewan muncul, NPC berterima kasih) dan saat sampah dibuang sembarangan.
9. **Hadiah & cap paspor** area itu.
10. **Daftar aset baru** yang dibutuhkan (kunci file, ukuran meter, catatan animasi). Pakai ulang aset Batch 1–5 sebanyak mungkin.

---

### TAHAP C — Aset 3D per batch (spesifikasi sama dengan Batch 1–5)
Setelah lembar desain disetujui, buat asetnya dengan urutan ini. Setiap batch serahkan: lembar pratinjau (depan, samping, 3/4), GLB per aset, dan tabel (nama, ukuran, jumlah segitiga, catatan animasi).

- **Batch 6 — Karakter v2 (untuk dialog hidup)**
  - `cing` diperbarui mengikuti ilustrasi Cing terbaru (lampiran `cing_sheet.png`): proporsi, warna, dan topi daun sama. Tambahkan node mulut `mouth_closed`, `mouth_open`, `mouth_smile`, dan `mouth_sad` (bisa dinyalakan/dimatikan), node `eyes_blink`, dan node `head` dengan pivot di leher supaya bisa mengangguk.
  - Semua NPC lama (`npc_busari`, `npc_darto`, `npc_udin`, `npc_merchant`) diberi node `mouth_open`/`mouth_closed` dan `head` terpisah.
- **Batch 7 — NPC baru** untuk semua area baru (lihat lembar desain), misalnya petani kebun, guru dan siswa, pemilik warung, montir, dan petugas bank sampah. Tiap NPC ≤ 2.000 segitiga, node sama dengan Batch 6.
- **Batch 8 — Kebun (HDPE)**: bedengan, bibit (3 tahap tumbuh: biji, tunas, berbunga), pot dari botol sampo, penyiram dari jeriken, meja kerja, orang-orangan sawah, gudang alat kecil.
- **Batch 9 — Sekolah (PP)**: gedung sekolah kecil + kantin, stasiun isi ulang air, tumbler (3 warna), kotak bekal, tempat sampah 3 warna (organik/anorganik/residu), bangku taman, tiang bendera.
- **Batch 10 — Warung (PS)**: warung kayu dengan etalase, gerobak makanan, daun pisang (lembar & bungkusan), besek bambu, meja dan kursi plastik, papan menu kosong.
- **Batch 11 — Bengkel (PVC)**: bengkel beratap seng, tumpukan pipa & kabel, tong pembakaran dengan asap (asap sebagai node terpisah untuk animasi), penampung limbah khusus berlabel, alat bengkel.
- **Batch 12 — Bank Sampah (Other)**: gudang bank sampah, timbangan besar, karung berlabel, rak ecobrick (botol berisi sachet), tumpukan sachet, mesin press.
- **Batch 13 — Festival & paspor**: panggung kecil, umbul-umbul, lampion, kembang api sederhana (node terpisah), papan "Desa Lestari" besar, serta 7 model cap paspor (ikon 3D sederhana per kode plastik).
- **Batch 14 — Sampah tambahan** (tiap item punya segitiga kode di label, seperti Batch 2): `cableBundle` (PVC), `pipeElbow` (PVC), `sachet` (7 Other, multilapis), `toothpasteTube` (7), `foamCup` (6), `foamTray` (6), `yogurtCup` (5 PP), `bottleCap` (5 PP), `detergentBottle` (2 HDPE), `milkJug` (2 HDPE), `snackWrap` (7), `straw` (5 PP).

### Aturan tambahan untuk map
- Tiap pulau area mengikuti bentuk pulau persegi membulat ±48 × 40 m seperti hub, dengan `islandCliff` di tepinya. Dermaga atau jembatan menuju hub selalu ada di sisi **selatan** (+Z).
- Jalur utama lebar ≥ 3 m (supaya joystick di HP nyaman). Benda yang bisa dipungut jangan diletakkan di balik objek tinggi.
- Satu landmark tinggi (≥ 6 m) per area supaya pemain tidak tersesat.
- Hindari teks yang tertanam di model (papan dibiarkan kosong). Teks ditulis oleh game supaya bisa diterjemahkan.
- Warna dasar rumput, tanah, dan pohon tetap terang, karena game yang mengusamkannya sesuai kesehatan tanah.

Mulai dari **TAHAP A**. Tunjukkan peta dunia, kurva belajar, dan desain Paspor Penjaga Tanah, lalu tunggu persetujuanku.

---

## Catatan untukku (tidak perlu disalin)
- Lampirkan `logo-motion/public/opening/cing_sheet.png` saat masuk **Batch 6**, dan lembar gaya Batch 0 kalau Claude Design mulai keluar dari gaya.
- Hasil Tahap B (lembar desain) kirim ke Claude Code. Dari situ dibuat file data area (`src/data/areas/<id>.js`), misi (`quests.js`), dan teks (`dialogs.id.js`).
- Pertanyaan yang perlu dijawab owner wisata (bisa memengaruhi desain):
  1. Lokasi wisata nyatanya apa saja (TPS3R, bank sampah, kebun, sungai)? Map bisa dibuat mirip tempat aslinya.
  2. Apakah ada maskot atau nama tempat yang wajib muncul?
  3. Apakah pemain bermain sendiri di HP masing-masing, atau satu layar untuk satu kelompok?
