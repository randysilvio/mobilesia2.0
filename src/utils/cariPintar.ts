/**
 * Pencarian pintar (tanpa server): toleran huruf besar/kecil, tanda baca, salah ketik ringan,
 * singkatan dari huruf depan (mis. "ppl" → Pengantar Perjanjian Lama), dan perintah singkat
 * seperti "smt 3", "semester 5", "2 sks", atau nama hari.
 */

export const normal = (t: any) => String(t ?? '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const KATA_SAMBUNG = new Set(['dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'dalam', 'the', 'of', 'and']);

export function singkatan(t: string): string {
  return normal(t).split(' ').filter((k) => k && !KATA_SAMBUNG.has(k)).map((k) => (/^\d+$/.test(k) ? k : k[0])).join('');
}

/** Jarak Levenshtein dengan batas (berhenti lebih awal bila sudah melewati batas). */
export function jarakEdit(a: string, b: string, batas = 2): number {
  if (Math.abs(a.length - b.length) > batas) return batas + 1;
  let sebelum = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const kini = [i];
    let minBaris = i;
    for (let j = 1; j <= b.length; j++) {
      kini[j] = Math.min(sebelum[j] + 1, kini[j - 1] + 1, sebelum[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (kini[j] < minBaris) minBaris = kini[j];
    }
    if (minBaris > batas) return batas + 1;
    sebelum = kini;
  }
  return sebelum[b.length];
}

function mirip(token: string, kata: string): boolean {
  if (token.length < 4) return false;
  const batas = token.length >= 7 ? 2 : 1;
  // bandingkan dengan kata utuh dan dengan awalan kata sepanjang token (untuk ketikan yang belum selesai)
  return jarakEdit(token, kata, batas) <= batas || (kata.length > token.length && jarakEdit(token, kata.slice(0, token.length), batas) <= batas);
}

export type Kueri = { token: string[]; semester?: number; sks?: number; kosong: boolean };

export function uraiKueri(teks: string): Kueri {
  let q = normal(teks);
  let semester: number | undefined;
  let sks: number | undefined;
  q = q.replace(/\b(?:smt|sem|semester|s)\s*(\d{1,2})\b/, (_, n) => { semester = Number(n); return ' '; });
  q = q.replace(/\b(\d)\s*sks\b/, (_, n) => { sks = Number(n); return ' '; });
  const token = q.split(' ').filter(Boolean);
  return { token, semester, sks, kosong: !token.length && semester === undefined && sks === undefined };
}

export type Medan = { kode?: string; nama: string; tambahan?: string[]; angka?: number[] };

/** Skor kecocokan (0 = tidak cocok). Semua kata kunci harus cocok di salah satu medan. */
export function skor(k: Kueri, m: Medan): number {
  const kode = normal(m.kode).replace(/ /g, '');
  const nama = normal(m.nama);
  const kataNama = nama.split(' ');
  const akronim = singkatan(m.nama);
  const lain = (m.tambahan || []).map(normal).filter(Boolean);
  const kataLain = lain.join(' ').split(' ').filter(Boolean);
  let total = 0;

  for (const t of k.token) {
    let s = 0;
    if (kode && kode === t) s = 120;
    else if (kode && kode.startsWith(t)) s = 100;
    else if (kode && t.length >= 2 && kode.includes(t)) s = 70;
    else if (nama.startsWith(t)) s = 80;
    else if (kataNama.some((w) => w.startsWith(t))) s = 60;
    else if (t.length >= 3 && nama.includes(t)) s = 40;
    else if (t.length >= 2 && akronim.includes(t)) s = 35;
    else if (kataLain.some((w) => w.startsWith(t))) s = 30;
    else if (t.length >= 3 && lain.some((x) => x.includes(t))) s = 20;
    else if (/^\d+$/.test(t) && (m.angka || []).includes(Number(t))) s = 15;
    else if (kataNama.some((w) => mirip(t, w))) s = 18;
    else if (kataLain.some((w) => mirip(t, w))) s = 10;
    if (!s) return 0;
    total += s;
  }
  return total || 1;
}
