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

// Kanvas 1712 x 1080 (85,6 x 54 mm). Koordinat sama dengan resources/views/components/ktm.blade.php.
export const KANVAS = { w: 1712, h: 1080 };
export const POSISI = {
  foto: { x: 205, y: 259, w: 437, h: 561 },
  nilaiX: 944,
  nilaiLebar: 460,
  nilaiBaris: [552, 640, 728, 816], // garis dasar teks: Nama, NIM, Prodi, Angkatan
  qr: { x: 1472, y: 660, s: 174 },
  token: { x: 716, y: 878 },
};

/** Ukuran huruf nilai (px kanvas) — sama dengan App\Support\Ktm::ukuranTeks. */
export function ukuranTeks(teks: string): number {
  const n = (teks || '').length;
  if (n <= 16) return 36;
  if (n <= 21) return 33;
  if (n <= 25) return 30;
  if (n <= 30) return 26;
  return 23;
}
