const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const URUTAN_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

/** "2026-10-28" / "2026-10-28 07:30:00" / ISO → Date (tanpa bergantung Intl). */
export function keTanggal(nilai?: string | null): Date | null {
  if (!nilai) return null;
  const s = String(nilai).replace(' ', 'T');
  const d = new Date(s.length === 10 ? s + 'T00:00:00' : s);
  return isNaN(d.getTime()) ? null : d;
}

export function tanggal(nilai?: string | null): string {
  const d = keTanggal(nilai);
  return d ? `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}` : '-';
}

export function jam(nilai?: string | null): string {
  if (!nilai) return '-';
  const m = String(nilai).match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '-';
}

export function tanggalJam(nilai?: string | null): string {
  const d = keTanggal(nilai);
  if (!d) return '-';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${tanggal(nilai)}, ${hh}:${mm}`;
}

export function hariIni(): string {
  return HARI[new Date().getDay()];
}

export function rupiah(n?: number | string | null): string {
  const v = Math.round(Number(n || 0));
  return 'Rp ' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function angka(n?: number | string | null, desimal = 2): string {
  const v = Number(n || 0);
  return v.toFixed(desimal).replace('.', ',');
}
