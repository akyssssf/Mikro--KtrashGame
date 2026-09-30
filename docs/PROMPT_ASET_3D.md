# Prompt aset 3D — "Penjaga Tanah" (untuk Claude Design)

Salin blok di bawah ke Claude Design. Kerjakan per batch (mulai dari Batch 0 = lembar gaya), jangan semua sekaligus.

---

## PROMPT UTAMA (salin mulai dari sini)

Kamu adalah 3D artist untuk game edukasi web berjudul **"Penjaga Tanah"** (anak SD–SMA, Indonesia). Pemain adalah anak penjaga desa yang memungut sampah plastik bersama **Cing**, cacing tanah kartun. Game dibuat dengan **Three.js** dan dilihat dari kamera RPG orang ketiga (agak rendah di belakang pemain, horizon laut terlihat).

### Gaya visual (wajib konsisten di semua aset)
- **Cerah, hangat, stylized**, seperti game petualangan pulau tropis: laut cyan jernih, rumput kuning-hijau, tebing batu abu-kebiruan, kayu krem-cokelat muda.
- **Low-poly chunky** dengan bentuk membulat dan proporsi lucu (kepala besar, tangan/kaki pendek). Tepi agak di-bevel, tidak tajam seperti CAD.
- **Cel/toon shading**: 2–3 tingkat terang, bayangan berwarna (biru-lavender pada batu, hijau tua pada rumput), bukan hitam.
- Tekstur bergaya **lukisan tangan** sederhana: sapuan kuas lebar, garis serat kayu melengkung, bercak terang di permukaan batu. Boleh juga hanya warna datar (vertex color) + sedikit aksen.
- Warna jenuh tapi lembut. **Hindari**: realisme/PBR metalik, gradien ungu, efek kaca blur, glow berlebihan, garis outline tebal, kotor/gelap/seram.
- Nada ramah anak. Sampah plastik tetap dikenali jelas bentuknya, tidak menjijikkan.

### Palet utama (hex)
| Peran | Warna |
|---|---|
| Laut dalam / dangkal | `#27BDE6` / `#7FE6F5` |
| Rumput sehat / rumput kusam | `#9FD653` / `#B3AB7C` |
| Tanah (atas → bawah) | `#7B5536` `#654329` `#4E331F` |
| Batu (terang / bayangan) | `#8A9CC0` / `#5E6E93` |
| Kayu (terang / gelap) | `#E4C9A3` / `#A86D36` |
| Aksen oranye (topi, penanda) | `#F08A2C` |
| Tinta UI / pupil mata | `#17324D` |
| Krem kartu | `#FFF8E7` |

Warna kode plastik (dipakai di label/tutup): PET `#2563EB`, HDPE `#B45309`, PVC `#15803D`, LDPE `#0F766E`, PP `#DC2626`, PS `#7E22CE`, Other `#475569`.

### Spesifikasi teknis
- Format utama: **GLB (glTF 2.0)**, Y ke atas, **1 unit = 1 meter**, depan menghadap **+Z**.
- **Pivot/origin di tengah bawah** (titik yang menyentuh tanah) kecuali disebut lain.
- Batas segitiga: karakter ≤ 3.000, NPC ≤ 2.000, properti besar (rumah, lapak) ≤ 2.500, properti kecil ≤ 600, sampah ≤ 400.
- Maksimal **1 material per aset** (atlas tekstur 512×512 px, PNG) atau vertex color saja. Tanpa lampu/kamera di dalam file.
- Bagian yang bergerak dipisah jadi node bernama (mis. `leg_L`, `leg_R`, `arm_L`, `arm_R`, `head`) dengan pivot di sendi.
- Nama file = kunci di bawah (mis. `bottleWater.glb`).
- **Kalau tidak bisa mengekspor GLB**, buat sebagai modul JavaScript Three.js: `export function build<Nama>() { … return group; }` yang hanya memakai primitif Three.js (`BoxGeometry`, `CylinderGeometry`, `IcosahedronGeometry`, dll.) dan `MeshToonMaterial`, mengikuti aturan ukuran/pivot di atas. Sertakan halaman HTML pratinjau yang memutar asetnya (turntable) di atas latar laut cyan.

### Setiap batch, serahkan
1. Lembar pratinjau (depan, samping, 3/4) dengan latar polos cerah.
2. File GLB (atau modul JS) per aset.
3. Tabel singkat: nama, ukuran (m), jumlah segitiga, catatan animasi.

---

### Batch 0 — Lembar gaya (kerjakan dulu, tunggu persetujuan)
Satu adegan kecil: pulau berumput di laut cyan dengan tebing batu, satu pohon, satu rumah desa, Cing, dan si penjaga. Ini patokan gaya untuk semua batch berikutnya.

### Batch 1 — Karakter
- `player` — anak penjaga desa, tinggi 1,8 m (proporsi chibi: kepala besar). Kaus hijau `#2FB35A`, celana biru tua, **caping kecil oranye**, **keranjang anyaman di punggung**. Node terpisah: kaki, lengan, kepala. Varian aksesori terpisah: `net` (jaring bergagang 1,5 m).
- `cing` — cacing tanah pink `#F28BA8` sepanjang ±1,8 m (6 ruas, satu ruas berpita pink tua), kepala bulat besar dengan mata putih besar dan **topi daun kecil**. Tiga ekspresi sebagai node kepala terpisah atau blend shape: `ceria` (senyum), `biasa` (mulut datar), `lesu` (cemberut, alis turun, warna agak pudar).
- `npc_busari` (penjual tas kain, baju hijau), `npc_darto` (penjual sayur, baju biru), `npc_udin` (nelayan, baju cokelat, topi), `npc_merchant` (umum, bisa diganti warna). Tinggi ±1,7 m, gaya sama dengan player.

### Batch 2 — Sampah (dipungut pemain; harus jelas jenisnya)
Ukuran nyata (sedikit dibesarkan agar terlihat). Tiap item punya **segitiga kode daur ulang kecil** di label (angka + warna kode di atas).
| Kunci | Benda | Kode |
|---|---|---|
| `bottleWater` | Botol air mineral bening, tutup biru, label putih | 1 PET |
| `bottleSoda` | Botol soda hijau, tutup merah | 1 PET |
| `bottleShampoo` | Botol sampo pink buram | 2 HDPE |
| `jerrycan` | Jeriken deterjen biru muda bergagang | 2 HDPE |
| `pipe` | Potongan pipa paralon abu | 3 PVC |
| `kresek` / `kresekBlack` | Kantong kresek merah / hitam, agak kusut | 4 LDPE |
| `breadBag` | Bungkus roti kuning tembus pandang | 4 LDPE |
| `cupStraw` | Gelas plastik bening + sedotan merah | 5 PP |
| `foodBox` | Wadah makanan tutup hijau | 5 PP |
| `foamBox` | Kotak styrofoam putih | 6 PS |
| `gallon` | Galon biru | 7 Other |
| `leaf` / `banana` | Daun kering / kulit pisang (organik) | — |

### Batch 3 — Desa Lestari (hub)
`house` (rumah desa, dinding krem, atap genteng oranye/biru/hijau — 3 varian warna), `well` (sumur batu beratap), `recyclingCenter` (bangunan hijau "Daur Ulang" + mesin), `stoneArch` (**Gerbang Waktu**: lengkung batu dengan bagian tengah kosong untuk efek portal biru), `tree_round`, `tree_pine`, `palm`, `bush`, `rock` (3 varian), `fence` (segmen 1,2 m), `lamp`, `bench`, `signpost` (papan kosong untuk teks), `flowerPot`.

### Batch 4 — Sungai & Pasar
`bridge` (jembatan papan kayu 9 m, pagar), `fishingHut` (pondok nelayan), `netRack`, `reeds` (alang-alang), `rockWall` (dinding batu rendah, bisa disusun), `leafPile` (tumpukan daun + kulit pisang 2,5 m yang menutup jalan), `stall` (lapak pasar dengan atap kain belang — biarkan warna atap bisa diganti), `crate`, `produceBasket`, `drainGrate` (saluran + jeruji), `bunting` (tali bendera segitiga), `lensPedestal` (batu soket bercincin cyan) dan `timeLens` (kaca pembesar emas besar yang melayang).

### Batch 5 — Lingkungan jauh
`islandCliff` (tepi pulau bertebing batu abu-kebiruan dengan rumput kuning-hijau di atas, modul lurus + sudut), `seaStack` (pilar batu runcing di laut, 3 varian, tinggi 15–30 m, puncak berumput), `cloud` (awan gembung sederhana).

---

## Catatan untuk pemakaian di game
- Aset akan dimuat dengan `GLTFLoader` lalu mengganti model prosedural yang sekarang (kunci nama sama dengan di `src/world/items3d.js` dan `src/world/props.js`).
- Warna rumput/tanah/pohon diwarnai ulang oleh game sesuai kesehatan tanah, jadi **buat warna dasarnya terang** (game yang mengusamkannya).
- Sampah dikusamkan & dipudarkan oleh game saat waktu dimajukan, jadi tidak perlu varian "rusak".
