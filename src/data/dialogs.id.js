// SEMUA teks game (Bahasa Indonesia) ada di file ini, siap untuk i18n.
// Angka lama terurai TIDAK ditulis di sini; ambil dari plastics.js.

export const TEXT = {
  game: {
    titleA: 'Penjaga',
    titleB: 'Tanah',
    tagline: 'Jelajahi Desa Lestari, kenali 7 jenis plastik, dan lihat nasib tanah di masa depan.',
    loading: 'Menyiapkan Desa Lestari…',
  },

  menu: {
    continue: 'Lanjutkan',
    newGame: 'Main baru',
    newGameConfirm: 'Mulai dari awal? Kemajuanmu akan dihapus.',
    yes: 'Ya, mulai baru',
    no: 'Batal',
    codex: 'Kartu Plastik',
    controlsTitle: 'Cara main',
    controls: [
      ['W A S D / panah', 'Berjalan (atau klik tanah)'],
      ['Shift', 'Lari'],
      ['E / Spasi', 'Pungut, bicara, pakai'],
      ['Q / R', 'Putar kamera 90°'],
      ['I', 'Buka keranjang'],
      ['K', 'Kartu Plastik'],
      ['M', 'Suara nyala/mati'],
      ['Esc', 'Jeda'],
    ],
  },

  pause: {
    title: 'Jeda',
    resume: 'Lanjut main',
    codex: 'Kartu Plastik',
    toMenu: 'Ke menu judul',
    sound: 'Suara',
    on: 'nyala',
    off: 'mati',
    saved: 'Kemajuan tersimpan otomatis di browser ini.',
  },

  hud: {
    quest: 'Misi',
    soil: 'Tanah {area}',
    village: 'Rata-rata desa',
    basket: 'Keranjang',
    tools: 'Alat',
    codexBtn: 'Kartu',
    basketBtn: 'Keranjang',
    pauseBtn: 'Jeda',
    soundOn: 'Suara nyala',
    soundOff: 'Suara mati',
    moods: { ceria: 'Cing ceria', biasa: 'Cing biasa saja', lesu: 'Cing lesu' },
    fps: '{fps} fps · {calls} draw call',
  },

  tools: {
    jaring: 'Jaring',
    lensa: 'Lensa Waktu',
    tasKain: 'Tas kain',
    pencapit: 'Pencapit',
  },

  prompts: {
    pick: 'Pungut',
    net: 'Tangkap (jaring)',
    netNeed: 'Butuh jaring',
    talk: 'Bicara',
    take: 'Ambil',
    lens: 'Pasang Lensa Waktu',
    lensNeed: 'Butuh Lensa Waktu',
    recycle: 'Tempat Daur Ulang',
    gate: 'Gerbang Waktu',
    gateFinal: 'Lihat 100 tahun lagi',
    go: 'Pergi ke {area}',
    locked: 'Terkunci',
    swap: 'Tukar kresek',
    pull: 'Tarik kresek',
    full: 'Keranjang penuh',
    blocked: 'Tumpukan daun',
    read: 'Baca',
  },

  toast: {
    lensIntro: 'Geser waktunya ke depan, lalu perhatikan apa yang berubah.',
    findCing: 'Cing menunggumu di dekat sumur. Dekati dan tekan E!',
    basketFull: 'Keranjang penuh! Bawa ke Tempat Daur Ulang di desa.',
    newCard: 'Kartu Plastik baru: {abbr} (kode {code})! Tekan K untuk melihat.',
    newTool: 'Alat baru: {tool}!',
    netGot: 'Jaring didapat! Berdiri di tepi sungai, lalu tekan E saat botol hanyut dekat.',
    lensGot: 'Lensa Waktu didapat! Pasang di batu bercahaya.',
    bagGot: 'Tas kain didapat! Keranjangmu kini muat {max}.',
    grabberGot: 'Pencapit didapat! Kamu bisa memungut dari jarak lebih jauh.',
    picked: '{item} masuk keranjang.',
    pickedOrganic: '{item} (organik) masuk keranjang. Nanti jadi kompos!',
    buried: '{item} terkubur. Plastik ini bisa bertahan ratusan tahun di tanah.',
    reused: '{item} dipakai ulang: {result}!',
    areaLocked: 'Belum bisa ke sana. Selesaikan misi Cing dulu.',
    comingSoon: 'Area ini segera hadir!',
    saveFail: 'Kemajuan tidak bisa disimpan di browser ini, tapi game tetap bisa dimainkan.',
    tooFar: 'Terlalu jauh. Dekati tepi sungai.',
    wedged: 'Kresek tersangkut di bawah jeruji. Bicara dulu dengan Pak Darto.',
    notEnoughKresek: 'Butuh {need} kresek di keranjang. Kamu baru punya {have}.',
    nothingToSort: 'Keranjangmu kosong. Pungut sampah dulu, ya!',
    muted: 'Suara mati',
    unmuted: 'Suara nyala',
    drainClear: 'Saluran lancar lagi!',
    pathOpen: 'Jalan terbuka!',
  },

  areas: {
    hub: { name: 'Desa Lestari', sub: 'Tanah desa perlu bantuanmu' },
    sungai: { name: 'Sungai', sub: 'Plastik kode 1: PET' },
    pasar: { name: 'Pasar', sub: 'Plastik kode 4: LDPE' },
    comingSoon: 'Segera hadir',
    future: { 2: 'Kebun (HDPE)', 3: 'Bengkel (PVC)', 5: 'Sekolah (PP)', 6: 'Warung (PS)', 7: 'Gudang (Other)' },
  },

  places: {
    recycle: 'Daur Ulang',
    gate: 'Gerbang Waktu',
    busari: 'Tas Kain Bu Sari',
    darto: 'Sayur Pak Darto',
  },

  dialogUi: { next: 'Lanjut', last: 'Oke', skip: 'Lewati', label: 'Percakapan' },

  a11y: { done: ' (selesai)', locked: ' (terkunci)' },

  speakers: {
    cing: 'Cing',
    busari: 'Bu Sari',
    darto: 'Pak Darto',
    nelayan: 'Pak Udin',
  },

  items: {
    botolAir: 'Botol air mineral',
    botolSoda: 'Botol soda',
    botolSampo: 'Botol sampo',
    jeriken: 'Jeriken deterjen',
    pipa: 'Potongan pipa',
    kresek: 'Kantong kresek',
    kresekHitam: 'Kresek hitam',
    bungkusRoti: 'Bungkus roti',
    gelasPlastik: 'Gelas plastik',
    wadahMakanan: 'Wadah makanan',
    kotakStyrofoam: 'Kotak styrofoam',
    galon: 'Galon',
    daun: 'Daun kering',
    kulitPisang: 'Kulit pisang',
    organik: 'Organik',
    tumpukanDaun: 'Tumpukan daun dan kulit pisang',
  },

  reuse: {
    pot: 'jadi pot tanaman',
    penyiram: 'jadi penyiram tanaman',
    potBibit: 'jadi pot bibit',
    wadah: 'jadi wadah alat tulis',
  },

  plastics: {
    note: 'Angka ini perkiraan kasar; waktu nyata bergantung kondisi tanah, cahaya, dan suhu.',
    decay: '± {D} tahun (perkiraan)',
    labels: { examples: 'Contoh', food: 'Untuk makanan', reuse: 'Pakai ulang', recycle: 'Daur ulang', decay: 'Lama terurai' },
    advanced: 'Fakta Lanjut',
    locked: 'Belum ditemukan',
    lockedHint: 'Pungut sampah jenis ini untuk membuka kartunya.',
    source: 'Acuan: gramedia.com/literasi/jenis-jenis-plastik',
    title: 'Kartu Plastik',
    subtitle: 'Lihat kode segitiga di bawah kemasan. Angkanya menunjukkan jenis plastik.',
    close: 'Tutup',
    1: {
      full: 'Polyethylene Terephthalate (PET/PETE)',
      examples: 'Botol air mineral, botol soda, botol jus',
      food: 'Untuk sekali pakai',
      reuse: 'Sebaiknya tidak dipakai berulang.',
      recycle: 'Bisa didaur ulang. Kosongkan, remukkan, setor ke bank sampah.',
      advanced: [
        'Botol PET dibuat untuk sekali pakai. Makin sering diisi ulang, makin sulit menjaga kebersihannya dari kuman.',
        'PET hasil daur ulang bisa dijadikan serat kain atau wadah baru.',
      ],
    },
    2: {
      full: 'High-Density Polyethylene (HDPE)',
      examples: 'Botol sampo, botol deterjen, botol susu',
      food: 'Relatif aman',
      reuse: 'Termasuk paling aman dipakai ulang, misalnya jadi pot.',
      recycle: 'Mudah dan murah didaur ulang.',
      advanced: [
        'HDPE kuat dan biasanya tidak tembus pandang. Hasil daur ulangnya bisa jadi ember atau pot.',
        'Tetap cek kodenya: tidak semua botol buram adalah HDPE.',
      ],
    },
    3: {
      full: 'Polyvinyl Chloride (PVC)',
      examples: 'Pipa paralon, plastik pembungkus (wrap), kabel, beberapa mainan',
      food: 'Tidak dianjurkan',
      reuse: 'Jangan dipakai untuk wadah makanan.',
      recycle: 'Bisa didaur ulang, tetapi jarang ada tempatnya.',
      advanced: [
        'PVC mengandung klorin. Asap dari PVC yang dibakar berbahaya, jadi jangan pernah membakar sampah plastik.',
        'PVC paling cocok untuk barang tahan lama seperti pipa, bukan kemasan sekali pakai.',
      ],
    },
    4: {
      full: 'Low-Density Polyethylene (LDPE)',
      examples: 'Kantong kresek, bungkus roti, plastik pembungkus buah',
      food: 'Relatif aman',
      reuse: 'Lebih baik dihindari. Ganti dengan tas kain.',
      recycle: 'Sulit didaur ulang (bisa diolah jadi ubin atau papan plastik).',
      advanced: [
        'LDPE lunak dan tipis, jadi mudah terbang lalu tersangkut di pohon, pagar, dan saluran air.',
        'Sebagian kresek dibuat dari HDPE. Selalu cek kode segitiga di kantongnya.',
      ],
    },
    5: {
      full: 'Polypropylene (PP)',
      examples: 'Gelas plastik, wadah makanan, sedotan, tutup botol, ember',
      food: 'Aman untuk makanan dan minuman',
      reuse: 'Aman dipakai ulang, misalnya jadi pot bibit.',
      recycle: 'Bisa didaur ulang.',
      advanced: [
        'PP kuat, ringan, dan tahan panas, jadi sering dipakai untuk wadah makanan.',
        'Walau aman, gelas dan sedotan sekali pakai tetap lebih baik dikurangi.',
      ],
    },
    6: {
      full: 'Polystyrene (PS) / Styrofoam',
      examples: 'Kotak styrofoam, gelas styrofoam, karton telur',
      food: 'Tidak dianjurkan, terutama untuk makanan panas',
      reuse: 'Sebaiknya dihindari.',
      recycle: 'Sulit didaur ulang.',
      advanced: [
        'Styrofoam bisa melepas zat stirena saat terkena makanan atau minuman panas.',
        'Styrofoam mudah pecah jadi butiran kecil yang terbawa angin dan air.',
      ],
    },
    7: {
      full: 'Other: plastik lain (misalnya polikarbonat)',
      examples: 'Galon isi ulang, botol bayi lama, beberapa botol minum',
      food: 'Hati-hati, tidak dianjurkan untuk bayi',
      reuse: 'Jangan untuk wadah makanan bayi.',
      recycle: 'Sulit didaur ulang.',
      advanced: [
        'Kode 7 berarti "lain-lain": campuran berbagai plastik, jadi sulit dipilah.',
        'Sebagian plastik kode 7 mengandung BPA, zat yang bisa mengganggu hormon tubuh.',
      ],
    },
  },

  foodSafe: { ya: 'yes', sekali: 'mid', tidak: 'no' },

  stages: {
    utuh: 'masih utuh',
    kusam: 'kusam, rapuh',
    hampirHancur: 'hampir hancur',
    mikroplastik: 'jadi mikroplastik',
    membusuk: 'membusuk',
    jadiTanah: 'jadi tanah',
  },

  time: {
    now: 'Sekarang',
    months: '{n} bulan',
    years: 'Tahun ke-{n}',
    fromNow: 'dari sekarang',
    play: 'Putar',
    pause: 'Jeda',
    back: 'Kembali ke masa kini',
    done: 'Selesai',
    jump: '{n} th',
    jumpMonth: '{n} bln',
    slider: 'Geser waktu',
    gateTitle: 'Gerbang Waktu',
    lensTitle: 'Lensa Waktu',
    gateNote: 'Ini ramalan (disederhanakan untuk game). Dunia aslinya tidak berubah.',
    lensNote: 'Lensa kecil ini hanya kuat sampai 50 tahun.',
    soilHealth: 'Kesehatan tanah',
    micro: 'Mikroplastik',
    microNone: 'tidak ada',
    microSome: 'sedikit',
    microLots: 'banyak',
    whatsInSoil: 'Isi tanah',
    decay: '± {D} (perkiraan)',
    decayMonths: '{n} bulan',
    decayYears: '{n} th',
    inset: 'Penampang tanah',
    captionStart: 'Hari ini. Geser waktu ke depan atau tekan Putar.',
    captionClean: 'Tidak ada plastik di tanah desa. Tanahnya tetap sehat, cacing senang!',
    captionOrganic: '{when}: {name} sudah jadi tanah. Plastiknya masih utuh.',
    captionPlastic: '{when}: plastik {abbr} (kode {code}) akhirnya hancur, tapi menjadi mikroplastik yang tetap tinggal di tanah.',
    captionWaiting: 'Plastik belum berubah banyak. Tanah di sekitarnya mulai sulit menyerap air.',
    microExplain: 'Mikroplastik = serpihan plastik super kecil, lebih kecil dari butir pasir. Tidak kelihatan, tapi tetap ada.',
    lensCaptionStart: 'Geser waktu ke depan. Apa yang hilang, apa yang tetap ada?',
  },

  quests: {
    kenalan: { title: 'Kenalan dengan Cing', objectives: { bicara: 'Bicara dengan Cing di dekat sumur' } },
    pungutDesa: { title: 'Bersihkan lapangan', objectives: { pungut: 'Pungut sampah di desa' } },
    sungai: {
      title: 'Selamatkan sungai',
      objectives: { jaring: 'Ambil jaring di pondok', botol: 'Kumpulkan botol PET', jalan: 'Buka jalan yang tertutup daun' },
    },
    pilah: { title: 'Pilah di Tempat Daur Ulang', objectives: { pilah: 'Main pilah sampah di desa' } },
    pasar: {
      title: 'Pasar tanpa kresek',
      objectives: { kresek: 'Kumpulkan kresek', tas: 'Tukar kresek dengan tas kain', saluran: 'Bersihkan saluran Pak Darto' },
    },
    pulang: { title: 'Lihat masa depan', objectives: { gerbang: 'Masuk ke Gerbang Waktu di desa' } },
    bebas: { title: 'Jelajah bebas', objectives: {} },
  },

  dialogs: {
    cingWaiting: [
      { who: 'cing', text: 'Halo! Aku <b>Cing</b>, cacing tanah penjaga Desa Lestari.' },
      { who: 'cing', text: 'Tanah desa kita sedang sakit karena sampah plastik. Lihat, rumputnya kusam.' },
      { who: 'cing', text: 'Jalan pakai <b>WASD</b> atau klik tanah. Dekati sampah, lalu tekan <b>E</b>.' },
      { who: 'cing', text: 'Coba pungut 3 sampah di sekitar lapangan, ya!' },
    ],
    cingIdle: {
      kenalan: [{ who: 'cing', text: 'Senang bertemu kamu!' }],
      pungutDesa: [{ who: 'cing', text: 'Ada gelas plastik dan sampah lain di sekitar lapangan. Pungut 3, ya!' }],
      sungai: [{ who: 'cing', text: 'Sungai ada di barat desa. Ikuti papan petunjuk!' }],
      pilah: [{ who: 'cing', text: 'Bawa keranjangmu ke <b>Tempat Daur Ulang</b>, bangunan hijau di timur lapangan.' }],
      pasar: [{ who: 'cing', text: 'Pasar ada di timur desa. Cari kresek yang tersangkut!' }],
      pulang: [{ who: 'cing', text: 'Ayo ke <b>Gerbang Waktu</b> di tengah desa!' }],
      bebas: [{ who: 'cing', text: 'Tanah yang sehat butuh kita semua. Terima kasih, Penjaga Tanah!' }],
    },
    done_pungutDesa: [
      { who: 'cing', text: 'Hebat! Tiap sampah yang dipungut membuat tanah bisa bernapas lagi.' },
      { who: 'cing', text: 'Bawa <b>Lensa Waktu</b> ini. Lensa ini memajukan waktu di satu titik kecil.' },
      { who: 'cing', text: 'Sungai di barat penuh botol plastik. Ayo ke sana lewat papan petunjuk!' },
    ],
    enter_sungai: [
      { who: 'cing', text: 'Dulu sungai ini jernih. Sekarang banyak botol PET hanyut.' },
      { who: 'cing', text: 'Ambil <b>jaring</b> di pondok Pak Udin untuk menangkap botol di air.' },
    ],
    nelayan: [
      { who: 'nelayan', text: 'Jaringku dulu untuk ikan. Sekarang yang tertangkap malah botol.' },
      { who: 'nelayan', text: 'Pakailah! Berdiri di tepi, lalu tangkap botol yang hanyut.' },
    ],
    pileInfo: [
      { who: 'cing', text: 'Tumpukan daun dan kulit pisang ini menutup jalan. Terlalu banyak untuk dipungut.' },
      { who: 'cing', text: 'Pasang <b>Lensa Waktu</b> di batu bercahaya itu. Kita lihat apa yang terjadi!' },
    ],
    lensSungaiDone: [
      { who: 'cing', text: 'Lihat! Daun dan kulit pisang sudah jadi tanah. Jalannya terbuka!' },
      { who: 'cing', text: 'Tapi botol PET di sebelahnya masih utuh walau 50 tahun berlalu. Kita harus memungutnya sendiri.' },
    ],
    lensSungaiNotYet: [
      { who: 'cing', text: 'Daunnya belum habis. Coba majukan waktu lebih jauh, sampai setahun.' },
    ],
    done_sungai: [
      { who: 'cing', text: 'Sungainya mulai jernih lagi! Kamu keren.' },
      { who: 'cing', text: 'Bawa botol-botol itu ke <b>Tempat Daur Ulang</b> di desa untuk dipilah.' },
    ],
    done_pilah: [
      { who: 'cing', text: 'Sampah yang dipilah benar bisa diolah lagi, jadi tidak berakhir di tanah.' },
      { who: 'cing', text: 'Sekarang ke <b>Pasar</b> di timur. Di sana banyak kantong kresek beterbangan.' },
    ],
    enter_pasar: [
      { who: 'cing', text: 'Pasar ramai, tapi kresek tersangkut di pagar dan pohon.' },
      { who: 'cing', text: 'Kumpulkan kresek, lalu tukar dengan <b>tas kain</b> di lapak Bu Sari.' },
    ],
    busariNeed: [
      { who: 'busari', text: 'Bawa {need} kresek ke sini, nanti kutukar dengan tas kain yang kuat!' },
    ],
    busariSwap: [
      { who: 'busari', text: 'Terima kasih! Kresek ini kukirim ke bank sampah.' },
      { who: 'busari', text: 'Tas kain bisa dipakai bertahun-tahun. Jadi kita tidak perlu kresek baru tiap belanja.' },
    ],
    busariAfter: [
      { who: 'busari', text: 'Lebih baik tidak memakai kresek sama sekali daripada harus mendaur ulangnya.' },
    ],
    dartoBefore: [
      { who: 'darto', text: 'Saluran di depan lapakku mampet kresek. Biarkan saja, nanti juga hancur sendiri.' },
      { who: 'cing', text: 'Hmm, benarkah? Ayo buktikan pakai <b>Lensa Waktu</b> di batu bercahaya!' },
    ],
    dartoAfterLens: [
      { who: 'darto', text: 'Wah, puluhan tahun pun kresek itu masih ada! Kubuka jerujinya, tolong angkat, ya.' },
    ],
    dartoLensShort: [
      { who: 'cing', text: 'Majukan waktunya lebih jauh, sampai puluhan tahun. Apa kresek itu hilang?' },
    ],
    dartoDone: [
      { who: 'darto', text: 'Airnya mengalir lagi! Terima kasih, Penjaga Tanah.' },
    ],
    done_pasar: [
      { who: 'cing', text: 'Pasar bersih dan salurannya lancar!' },
      { who: 'cing', text: 'Ayo pulang ke desa dan lihat masa depan lewat <b>Gerbang Waktu</b>.' },
    ],
    gateIntro: [
      { who: 'cing', text: 'Ini Gerbang Waktu. Kita bisa melihat ramalan desa di masa depan.' },
      { who: 'cing', text: 'Dunia aslinya tidak berubah. Pilihan kitalah yang menentukan.' },
    ],
    gateFinal: [
      { who: 'cing', text: 'Siap? Kita lihat Desa Lestari 100 tahun lagi, berdasarkan pilihanmu.' },
    ],
    buriedReact: [
      { who: 'cing', text: 'Aduh… plastik itu akan tinggal di tanah sangat lama. Ayo lain kali kita pungut bersama.' },
    ],
    recycleIntro: [
      { who: 'cing', text: 'Urutan terbaik: <b>kurangi</b>, <b>pakai ulang</b>, <b>daur ulang</b>, baru <b>buang</b>.' },
    ],
  },

  recycle: {
    title: 'Tempat Daur Ulang',
    intro: 'Pilih nasib sampah di keranjangmu.',
    order: 'Kurangi → Pakai ulang → Daur ulang → Buang',
    startSort: 'Pilah & daur ulang ({n})',
    reuseBtn: 'Pakai ulang',
    empty: 'Keranjang kosong.',
    close: 'Tutup',
  },

  basket: {
    title: 'Keranjang',
    empty: 'Keranjangmu masih kosong. Pungut sampah di sekitarmu!',
    capacity: '{n} dari {max} tempat terisi',
    dump: 'Buang di sini',
    dumpHint: 'Membuang sembarangan membuat sampah terkubur dan merusak tanah.',
    reuseHere: 'Pakai ulang bisa dilakukan di Tempat Daur Ulang.',
    close: 'Tutup',
    organic: 'organik',
    codeLabel: 'kode {code} · {abbr}',
  },

  sort: {
    title: 'Pilah Sampah',
    help: 'Seret sampah ke tempat yang kodenya cocok, atau tekan angka 1–8.',
    hintAlways: 'Petunjuk: kode selalu tampil.',
    hintHover: 'Petunjuk: arahkan kursor untuk melihat kode.',
    hintNone: 'Tanpa petunjuk. Kamu pasti bisa!',
    correct: 'Benar',
    wrong: 'Nyasar',
    left: 'Sisa',
    combo: 'Combo {n}! Terus begitu.',
    wrongToast: 'Ups! {item} itu {kind}, bukan {bin}. Sampah yang salah pilah ikut tertimbun.',
    missToast: 'Terlewat! {item} jatuh dan ikut tertimbun.',
    kindPlastic: 'kode {code} ({abbr})',
    kindOrganic: 'organik',
    binOrganic: 'Organik',
    resultGreat: 'Hebat sekali!',
    resultGood: 'Bagus!',
    resultTry: 'Ayo lebih teliti!',
    resultBody: '{ok} benar, {bad} nyasar.',
    reward: 'Hadiah: Pencapit! Kamu bisa memungut dari jarak lebih jauh.',
    back: 'Kembali ke desa',
    quit: 'Berhenti',
    healthUp: 'Tanah desa membaik!',
  },

  ending: {
    kicker: 'Desa Lestari, 100 tahun lagi',
    subur: { title: 'Desa Lestari Subur!', text: 'Tanahnya gembur, cacing sibuk bekerja, dan sungainya jernih. Terima kasih sudah memilih dengan bijak!' },
    pulih: { title: 'Desa Mulai Pulih', text: 'Sebagian tanah sehat, tapi plastik yang tertimbun pecah jadi mikroplastik. Setiap sampah yang dipungut tetap berarti!' },
    kusam: { title: 'Desa Masih Kusam', text: 'Plastik yang terkubur belum hilang dan terus pecah jadi mikroplastik. Ayo coba lagi: kurangi, pakai ulang, daur ulang!' },
    stats: { picked: 'dipungut', recycled: 'didaur ulang', reused: 'dipakai ulang', bags: 'tas kain', buried: 'terkubur', health: 'tanah 100 th lagi' },
    cards: 'Kartu Plastik terbuka',
    lesson: 'Ingat: plastik tidak benar-benar hilang. Ia pecah jadi mikroplastik.',
    keepPlaying: 'Lanjut jelajah',
    replay: 'Main dari awal',
    teaser: 'Area lain (HDPE, PVC, PP, PS, Other) segera hadir!',
  },
};

// Ambil teks lewat path "a.b.c" dan isi {var}. Kunci hilang ditampilkan apa adanya.
export function t(path, vars = {}) {
  const v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), TEXT);
  if (typeof v !== 'string') return v ?? path;
  return v.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}
