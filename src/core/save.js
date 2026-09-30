// localStorage bisa tidak tersedia (mode privat, diblokir). Semua akses dibungkus try/catch.
const KEY = 'penjaga-tanah:v1';
const PREFS = 'penjaga-tanah:prefs';

function read(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const loadGame = () => read(KEY);
export const saveGame = (data) => write(KEY, data);
export const clearGame = () => {
  try { window.localStorage.removeItem(KEY); } catch { /* abaikan */ }
};
export const loadPrefs = () => read(PREFS) ?? {};
export const savePrefs = (prefs) => write(PREFS, prefs);
