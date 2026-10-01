# Daftar audio — "Penjaga Tanah"

Dua bagian: **musik** (dibuat di Suno) dan **efek suara** (dibuat di ElevenLabs Sound Effects).
Nama file di kolom pertama dipakai kode nanti; simpan hasilnya di `penjaga-tanah/public/audio/music/` dan `penjaga-tanah/public/audio/sfx/`.

Prompt ditulis dalam bahasa Inggris karena kedua alat paling akurat dengan bahasa Inggris. Jangan menyebut nama artis/lagu tertentu.

---

## A. Musik (Suno)

### Pengaturan umum
- Aktifkan **Instrumental** (tanpa vokal) untuk semua lagu.
- Isi prompt di kolom **Style of Music**. Kolom lirik dikosongkan.
- Buat 2–4 versi per lagu, pilih yang paling enak diputar berulang.
- Setelah jadi, potong di Suno (Edit/Crop) atau Audacity (gratis) supaya **awal dan akhir menyambung** (loop). Target 60–120 detik.
- Ekspor MP3, lalu konversi ke `.ogg` (lebih kecil). Volume akan diatur di game, jadi tidak perlu dikeraskan.
- Ciri khas game: **cerah, ramah anak, sentuhan Indonesia** (angklung, suling bambu, kendang ringan, gamelan lembut, marimba).

| File | Dipakai di | Prompt Style of Music |
|---|---|---|
| `title.ogg` | Menu judul | `Cheerful tropical island adventure theme, instrumental, angklung and bamboo flute melody, light kendang percussion, ukulele strums, warm and hopeful, children's video game, 100 BPM, major key, seamless loop` |
| `desa_ceria.ogg` | Desa Lestari saat tanah sehat (≥ 60%) | `Cozy village exploration music for a kids video game, instrumental, marimba and angklung, soft bamboo flute, gentle shakers, sunny and playful, 95 BPM, C major, light and uncluttered, seamless loop` |
| `desa_lesu.ogg` | Desa Lestari saat tanah kusam (< 60%) — melodi sama, suasana lebih sepi | `Same cozy village theme but sparse and slightly wistful, instrumental, solo marimba with soft bamboo flute, slower 80 BPM, gentle and calm, hopeful not sad, kids video game, seamless loop` |
| `sungai.ogg` | Area Sungai | `Flowing riverside exploration music, instrumental, kecapi plucks and marimba arpeggios, soft water-like chimes, light hand percussion, calm and curious, 90 BPM, kids adventure game, seamless loop` |
| `pasar.ogg` | Area Pasar | `Lively traditional market music for a kids video game, instrumental, light gamelan bells, kendang groove, angklung, playful and bustling but not loud, 110 BPM, major key, seamless loop` |
| `gerbang_waktu.ogg` | Gerbang Waktu & Lensa Waktu | `Mysterious magical time-travel ambience, instrumental, shimmering gamelan bells, soft ticking clock rhythm, airy synth pads, wonder and curiosity, slow 70 BPM, gentle, kids game, seamless loop` |
| `pilah.ogg` | Mini-game memilah sampah | `Upbeat puzzle sorting game music, instrumental, bouncy marimba, plucky bass, claps and woodblock, energetic and fun, 125 BPM, major key, kids arcade game, seamless loop` |
| `akhir_subur.ogg` | Layar akhir — hasil baik | `Triumphant warm celebration finale, instrumental, angklung ensemble, bamboo flute melody, rising strings, joyful and proud, 100 BPM, major key, kids game ending, 60 seconds` |
| `akhir_pulih.ogg` | Layar akhir — hasil sedang/kurang | `Gentle hopeful reflective ending, instrumental, soft piano and bamboo flute, light marimba, encouraging and warm, not sad, 80 BPM, kids game ending, 60 seconds` |

> Musik desa dua versi (`desa_ceria` dan `desa_lesu`) supaya musik bisa **berpindah halus mengikuti kesehatan tanah**. Kalau Suno memberi melodi berbeda, tidak apa-apa. Pilih dua yang nadanya serasi.

---

## B. Efek suara (ElevenLabs Sound Effects)

### Pengaturan umum
- Atur **Duration** sesuai kolom "Durasi" (jangan "auto" untuk suara UI yang harus pendek).
- **Prompt influence** sekitar 0,5–0,7.
- Untuk suara loop (langkah, ambience, ban berjalan), tambahkan kata `seamless loop` dan potong rapi di Audacity.
- Hapus jeda hening di awal file, supaya suara terasa langsung saat tombol ditekan.
- Simpan `.ogg` atau `.mp3`, mono untuk efek pendek. Usahakan < 50 KB per efek.

### 1. Antarmuka (UI)
| File | Kapan | Durasi | Prompt |
|---|---|---|---|
| `ui_hover.ogg` | Kursor di atas tombol | 0,5 s | `very soft short wooden tick, gentle UI hover sound, cute, clean, no reverb` |
| `ui_click.ogg` | Klik tombol | 0,5 s | `soft bubbly pop click, friendly mobile game button press, clean, short` |
| `ui_open.ogg` | Buka panel/kartu | 0,8 s | `light paper card swish open, playful whoosh, kids game menu` |
| `ui_close.ogg` | Tutup panel | 0,6 s | `soft paper swish close, short gentle whoosh` |
| `ui_toast.ogg` | Notifikasi muncul | 0,7 s | `gentle two-note wooden marimba notification ping, friendly` |
| `dialog_blip.ogg` | Huruf dialog muncul | 0,3 s | `tiny soft high-pitched blip, cute character speech tick, very short` |
| `cing_happy.ogg` | Cing senang | 1 s | `cute tiny cartoon worm happy squeak giggle, adorable, no words` |
| `cing_sad.ogg` | Cing sedih | 1 s | `cute tiny cartoon creature soft sad sigh, gentle, no words` |

### 2. Memungut & keranjang
| File | Kapan | Durasi | Prompt |
|---|---|---|---|
| `pick_bottle.ogg` | Pungut botol plastik | 0,8 s | `plastic bottle picked up with a light crinkle then soft pop into a woven basket, cartoony, satisfying` |
| `pick_bag.ogg` | Pungut kresek | 0,8 s | `plastic shopping bag rustle and quick grab, light and cartoony` |
| `pick_organic.ogg` | Pungut daun / kulit pisang | 0,7 s | `dry leaf rustle and soft squishy grab, natural, light` |
| `pick_foam.ogg` | Pungut styrofoam | 0,7 s | `styrofoam box squeak and light tap, short` |
| `basket_full.ogg` | Keranjang penuh | 0,8 s | `soft dull wooden thunk with gentle denied boop, not harsh, kids game` |
| `net_swing.ogg` | Ayun jaring | 0,6 s | `quick light whoosh of a fishing net swing` |
| `net_splash.ogg` | Tangkap botol di air | 1 s | `small water splash and net scoop, playful cartoon` |
| `bury.ogg` | Buang sembarangan (terkubur) | 1,2 s | `soft dirt shovel scoop and muffled thud, slightly gloomy but gentle` |

### 3. Hadiah & kemajuan
| File | Kapan | Durasi | Prompt |
|---|---|---|---|
| `card_unlock.ogg` | Kartu Plastik baru | 1,5 s | `magical sparkle chime with rising bell arpeggio, discovery, bright and cute` |
| `tool_get.ogg` | Dapat alat baru | 2 s | `short cheerful fanfare on bamboo flute and marimba, item get, kids adventure game` |
| `quest_done.ogg` | Misi selesai | 2,5 s | `happy success jingle, angklung and bells, short celebration, kids game` |
| `health_up.ogg` | Tanah membaik | 1,2 s | `gentle growing plant sparkle, soft rising chime with leaf rustle` |

### 4. Mini-game memilah
| File | Kapan | Durasi | Prompt |
|---|---|---|---|
| `sort_correct.ogg` | Pilah benar | 0,6 s | `bright cheerful ding with tiny sparkle, correct answer, kids game` |
| `sort_wrong.ogg` | Pilah salah | 0,7 s | `soft cartoon boing, gentle wrong answer, not scary, kids game` |
| `sort_drop.ogg` | Sampah masuk tempat sampah | 0,5 s | `plastic item dropping into a bin, hollow light thunk` |
| `conveyor_loop.ogg` | Ban berjalan | 4 s | `soft mechanical conveyor belt hum with gentle rhythmic clicks, seamless loop, quiet` |
| `combo.ogg` | Combo 5× | 1 s | `quick ascending three-note xylophone run, combo bonus` |

### 5. Waktu
| File | Kapan | Durasi | Prompt |
|---|---|---|---|
| `gate_open.ogg` | Masuk Gerbang Waktu | 2 s | `magical portal opening whoosh with shimmering chimes, wonder, not scary` |
| `lens_activate.ogg` | Pasang Lensa Waktu | 1,5 s | `magical glass lens hum and sparkle swirl, small time magic` |
| `time_tick_loop.ogg` | Waktu diputar maju | 3 s | `soft clock ticking blended with airy shimmer, seamless loop, gentle` |
| `time_jump.ogg` | Lompat ke tahun tertentu | 1 s | `fast airy rewind-forward whoosh, time skip, magical` |
| `organic_gone.ogg` | Daun/organik jadi tanah | 1,5 s | `leaves crumbling softly into earth with gentle magical sparkle` |
| `micro_sparkle.ogg` | Mikroplastik muncul | 1,2 s | `tiny scattered glittery crackle, small particles, slightly eerie but gentle` |

### 6. Dunia & puzzle
| File | Kapan | Durasi | Prompt |
|---|---|---|---|
| `step_grass.ogg` | Langkah di rumput | 2 s | `light footsteps on soft grass, child walking, seamless loop` |
| `step_dirt.ogg` | Langkah di jalan tanah | 2 s | `light footsteps on dry dirt path, child walking, seamless loop` |
| `step_wood.ogg` | Langkah di jembatan | 2 s | `light footsteps on wooden bridge planks, child walking, seamless loop` |
| `area_whoosh.ogg` | Pindah area | 1 s | `soft breezy transition whoosh with light wind chimes` |
| `path_open.ogg` | Jalan terbuka (tumpukan hilang) | 1,5 s | `leaves rustling away and earth settling with a soft magical chime, path cleared` |
| `grate_open.ogg` | Jeruji saluran dibuka | 1,2 s | `small metal drain grate lifted with a light creak and clank` |
| `drain_flow.ogg` | Saluran lancar lagi | 2 s | `water gurgling and draining freely down a small gutter` |
| `bag_swap.ogg` | Tukar kresek → tas kain | 1,5 s | `plastic bags handed over with rustle then soft cloth bag flap, friendly trade` |

### 7. Ambience (loop panjang, volume rendah)
| File | Area | Durasi | Prompt |
|---|---|---|---|
| `amb_desa.ogg` | Desa Lestari | 20 s | `peaceful tropical village ambience, gentle wind, distant birds chirping, faint chickens, leaves rustling, seamless loop` |
| `amb_sungai.ogg` | Sungai | 20 s | `calm flowing river stream, gentle water babbling, birds, light breeze, seamless loop` |
| `amb_pasar.ogg` | Pasar | 20 s | `cheerful outdoor traditional market ambience, distant crowd murmur with no clear words, light clinks, seamless loop` |
| `amb_laut.ogg` | Semua area (tipis) | 20 s | `gentle ocean waves lapping on a small island shore, calm, seamless loop` |
| `amb_kusam.ogg` | Lapisan saat tanah kusam | 20 s | `quiet dull wind with few birds, slightly empty atmosphere, gentle, seamless loop` |

---

## Prioritas kalau waktunya sedikit
1. `ui_click`, `ui_hover`, `pick_bottle`, `pick_bag`, `card_unlock`, `quest_done`, `sort_correct`, `sort_wrong`
2. `desa_ceria`, `sungai`, `pasar`, `gerbang_waktu`
3. Sisanya. Efek yang belum ada akan memakai suara sintetis bawaan game (yang sudah ada sekarang).
