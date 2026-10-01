# Video Pembuka "Mikro!" — Storyboard & Prompt Nano Banana

Video ±28 detik, diputar sekali saat **Main baru** (bisa dilewati). Gambar dibuat di Nano Banana
(Gemini), lalu dianimasikan di Remotion (`logo-motion/`, komposisi `Opening`).

## Cara kerja

1. Buka Gemini / Google AI Studio (model **Nano Banana**).
2. **Lampirkan logo** `penjaga-tanah/public/logo.png` di SETIAP prompt sebagai referensi gaya
   (dan gambar Cing yang sudah jadi untuk prompt Cing berikutnya, supaya karakternya konsisten).
3. Tempel **Blok Gaya** di bawah + prompt aset.
4. Simpan hasil dengan **nama file persis** seperti tabel ke `logo-motion/public/opening/`.
5. Aset berlatar **magenta polos** akan dihapus latarnya otomatis:
   `python3 tools/keying.py` (dari folder `logo-motion`).
6. Jalankan `npm run studio` → komposisi **Opening**. Placeholder kotak abu-abu otomatis
   diganti gambar yang sudah ada.

## Blok Gaya (tempel di awal setiap prompt)

```
Art style: match the attached "Mikro!" logo exactly — cute chunky sticker / children's-book
cartoon, thick rounded dark-green outlines (#1f4d2b), soft cel shading with 2–3 tones, glossy
highlights, bright cheerful pastel palette (fresh greens, warm yellows, soft pink, sky blue),
simple rounded shapes, no realistic textures, no text, no watermark, no letters.
```

## Storyboard

| # | Waktu | Gambar | Narasi / teks layar | Gerak |
|---|-------|--------|---------------------|-------|
| 1 | 0–5 dtk | `bg_desa` + `fg_rumput` | "Dulu, Desa Lestari hijau dan subur." | Kamera geser pelan ke kanan (parallax), Cing mengintip dari tanah lalu melompat senang |
| 2 | 5–10 dtk | `bg_desa_kotor` muncul pelan, sampah jatuh | "Lalu sampah plastik mulai berdatangan…" | Botol, kresek, styrofoam jatuh memantul; langit meredup |
| 3 | 10–16 dtk | close-up `botol` → `botol_retak` → `serpihan` | "Panas dan hujan memecahnya jadi serpihan kecil: **mikroplastik**." | Zoom ke botol, retak, pecah, serpihan mengecil jadi butiran dan meresap ke tanah |
| 4 | 16–22 dtk | `bg_tanah_tercemar` | "Di dalam tanah, Cing dan teman-temannya kesulitan." | Kamera turun ke penampang tanah, Cing sedih, butiran berkilau di sekitarnya |
| 5 | 22–28 dtk | `bg_desa` cerah + `cing_semangat` | "Belum terlambat! Ayo bantu Cing menjaga tanah!" | Warna kembali cerah, Cing melompat, logo Mikro! muncul |

## Daftar aset & prompt

### Latar (rasio 21:9 untuk latar desa, 16:9 untuk tanah)

**`bg_desa.png`** — rasio 21:9
```
[Blok Gaya] A wide panoramic view of a small cozy Indonesian village "Desa Lestari" on a
grassy island: a few small houses with orange tiled roofs, a wooden well, a little river with
a wooden bridge, a market stall with striped awning, round fluffy trees, flowers, bright blue
sky with chunky round clouds. Lush, healthy, very green. Camera at child's eye level, wide
shot. Leave the lower 25% as an open green meadow (empty, no objects). No characters.
```

**`bg_desa_kotor.png`** — EDIT dari `bg_desa` (lampirkan `bg_desa`, minta Nano Banana mengedit)
```
Edit this image: keep the exact same composition, houses and trees. Scatter plastic trash
everywhere (bottles, plastic bags, styrofoam boxes, cups), make the grass duller yellow-green,
the river murky grey-green, the sky hazy and greyish, trees slightly drooping. Same cartoon style.
```

**`fg_rumput.png`** — rasio 21:9, latar magenta
```
[Blok Gaya] A foreground strip of tall chunky stylized grass blades and a few small flowers
along the bottom 30% of the image, seen very close to the camera. Everything above it is a
flat solid pure magenta background (#FF00FF), no gradient, no shadow on the background.
```

**`bg_tanah.png`** — rasio 16:9
```
[Blok Gaya] A cute cross-section of healthy soil, like a children's science book: top 15% is
green grass surface with small plants, below it warm brown soil layers with round pebbles,
plant roots, tiny tunnels, seeds and a few cute small bugs. Rich, warm and alive. No characters,
leave the center area open for a character.
```

**`bg_tanah_tercemar.png`** — EDIT dari `bg_tanah`
```
Edit this image: same composition. Add many tiny colorful plastic fragments and glittering
specks (blue, red, white, yellow) mixed into the soil layers, roots look thin and dry, soil
slightly greyer. Same cartoon style.
```

### Karakter Cing (latar magenta, rasio 1:1)

Pertama buat `cing_senang`, lalu **lampirkan hasilnya** di prompt Cing lainnya supaya konsisten.

**`cing_senang.png`**
```
[Blok Gaya] Full body character "Cing", a cute pink earthworm with big shiny dark eyes,
rosy cheeks, a small green leaf on its head like a hat (exactly as in the attached logo),
standing upright in an S-curve, happy open-mouth smile, waving. Centered, full body visible,
flat solid pure magenta background (#FF00FF), no shadow on the background.
```

**`cing_sedih.png`**
```
[Blok Gaya] The same character Cing from the attached image, sad and tired: droopy body,
teary eyes, small frown, leaf hat wilted. Centered, full body, flat solid pure magenta
background (#FF00FF).
```

**`cing_semangat.png`**
```
[Blok Gaya] The same character Cing from the attached image, determined and excited: jumping
pose, one arm-like body curl raised like a fist pump, sparkling eyes, big grin. Centered,
full body, flat solid pure magenta background (#FF00FF).
```

**`cing_mengintip.png`**
```
[Blok Gaya] The same character Cing from the attached image, only the upper half of the body
peeking out of a small round dirt hole in the ground, curious happy face. The dirt mound is
included. Centered, flat solid pure magenta background (#FF00FF).
```

### Benda (latar magenta, rasio 1:1)

**`botol.png`**
```
[Blok Gaya] A single clear blue plastic water bottle (PET) with a blue cap and a simple label
with no text, lying slightly tilted. Centered, flat solid pure magenta background (#FF00FF).
```

**`botol_retak.png`** — EDIT dari `botol`
```
Edit this image: the same bottle, now faded, sun-bleached and covered in cracks, a few small
chips breaking off. Keep the magenta background.
```

**`serpihan.png`**
```
[Blok Gaya] A small scattered cluster of tiny broken plastic fragments and flakes in blue,
white, red and yellow, different sizes from small to very tiny dots. Centered, flat solid pure
magenta background (#FF00FF).
```

**`kresek.png`**
```
[Blok Gaya] A single crumpled white-and-red plastic shopping bag (kresek) floating slightly,
no text. Centered, flat solid pure magenta background (#FF00FF).
```

**`styrofoam.png`**
```
[Blok Gaya] A single white styrofoam food box, slightly open and dented. Centered, flat solid
pure magenta background (#FF00FF).
```

## Tips

- Kalau warna magenta "bocor" ke tepi karakter, minta ulang dengan: *"crisp clean edges, the
  character must not contain any pink-magenta color in its outline"* (Cing berwarna pink, jadi
  perhatikan hasil keying-nya).
- Resolusi minimal 1920 px sisi panjang. Kalau Nano Banana memberi lebih kecil, tetap pakai;
  Remotion akan menskalakan.
- Narasi suara bisa dibuat di ElevenLabs dari kolom "Narasi" (suara anak/kakak yang ceria).
