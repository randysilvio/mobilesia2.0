// Palet & tata letak E-KTM — SAMA dengan App\Support\Ktm di SIAKAD web.
// Sengaja tetap (tidak mengikuti tema sentral SIAKAD maupun tema aplikasi).
export const WARNA_KTM = {
  latar: '#FDDFC1',
  oranye: '#F9A21B',
  oranyeTua: '#F47B16',
  ungu: '#3D2350',
  unguMuda: '#5E3F82',
  aktif: '#1F9D55',
  nonaktif: '#B3402A',
} as const;

// Kanvas 1712 x 1080 (85,6 x 54 mm). SAMA dengan App\Support\Ktm::TATA_LETAK di SIAKAD web.
// x = tepi kiri, b = garis dasar teks, w = lebar maksimal, ukuran huruf mengecil dalam [min, maks].
export const KANVAS = { w: 1712, h: 1080 };
export const TATA_LETAK = {
  foto: { x: 120, y: 250, w: 420, h: 540 },
  nama: { x: 600, b: 472, w: 820, maks: 52, min: 28 },
  nim: { x: 600, b: 600, w: 820, maks: 42, min: 42 },
  prodi: { x: 600, b: 730, w: 500, maks: 34, min: 22 },
  angkatan: { x: 1130, b: 730, w: 290, maks: 34, min: 26 },
  token: { x: 600, b: 808, w: 820, maks: 22, min: 22 },
  qr: { x: 1472, y: 660, s: 174 },
};

/** Ukuran huruf (px kanvas) agar teks muat satu baris — sama dengan App\Support\Ktm::ukuranTeks. */
export function ukuranTeks(teks: string, lebar: number, maks: number, min: number): number {
  const n = Math.max(1, (teks || '').length);
  return Math.max(min, Math.min(maks, Math.floor(lebar / (0.62 * n))));
}
