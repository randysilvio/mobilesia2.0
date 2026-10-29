import AsyncStorage from '@react-native-async-storage/async-storage';
import { ambilServer } from './config';

/** Kesalahan dari server atau jaringan, dengan pesan yang siap ditampilkan ke pengguna. */
export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;
  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
  get jaringan() {
    return this.status === 0;
  }
}

let tokenSaatIni: string | null = null;
let saatTidakSah: (() => void) | null = null;

export function aturToken(token: string | null) {
  tokenSaatIni = token;
}

export function tokenAktif(): string | null {
  return tokenSaatIni;
}

/** Dipanggil saat server menjawab 401 (token kedaluwarsa / dicabut) → keluar otomatis. */
export function saatSesiBerakhir(fn: (() => void) | null) {
  saatTidakSah = fn;
}

type Opsi = { method?: string; body?: any; form?: FormData; timeout?: number; tanpaToken?: boolean };

export async function permintaan<T = any>(path: string, opsi: Opsi = {}): Promise<T> {
  const server = await ambilServer();
  const url = server + '/api' + (path.startsWith('/') ? path : '/' + path);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (tokenSaatIni && !opsi.tanpaToken) headers.Authorization = 'Bearer ' + tokenSaatIni;

  let body: any;
  if (opsi.form) {
    body = opsi.form; // Content-Type multipart diatur otomatis
  } else if (opsi.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opsi.body);
  }

  const pengendali = new AbortController();
  const batas = setTimeout(() => pengendali.abort(), opsi.timeout ?? 25000);

  let res: Response;
  try {
    res = await fetch(url, { method: opsi.method || (body ? 'POST' : 'GET'), headers, body, signal: pengendali.signal });
  } catch (e: any) {
    throw new ApiError(0, e?.name === 'AbortError'
      ? 'Server tidak merespons. Periksa sinyal internet Anda lalu coba lagi.'
      : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
  } finally {
    clearTimeout(batas);
  }

  let data: any = null;
  const teks = await res.text();
  try {
    data = teks ? JSON.parse(teks) : null;
  } catch {
    data = null;
  }

  if (res.status === 401 && !opsi.tanpaToken) {
    saatTidakSah && saatTidakSah();
    throw new ApiError(401, 'Sesi Anda telah berakhir. Silakan masuk kembali.');
  }

  if (!res.ok) {
    const errors = (data && data.errors) || {};
    const pertama = Object.values(errors)[0] as string[] | undefined;
    // Rute API belum ada di server = server SIAKAD belum diperbarui ke versi yang dibutuhkan aplikasi ini
    if (res.status === 404 && data && /route .* could not be found/i.test(String(data.message || ''))) {
      throw new ApiError(404, 'Fitur ini belum tersedia di server SIAKAD. Minta admin memperbarui server (git pull lalu php artisan optimize:clear).');
    }
    const pesan = (data && data.message && !/^(Server Error|The given data was invalid\.?)$/i.test(data.message) ? data.message : null)
      || (pertama && pertama[0])
      || (res.status >= 500 ? 'Terjadi gangguan di server SIAKAD. Coba beberapa saat lagi.' : `Permintaan gagal (kode ${res.status}).`);
    throw new ApiError(res.status, pesan, errors);
  }

  return data as T;
}

const AWALAN_CACHE = 'siakad.cache:';

/** GET dengan cadangan luring: bila jaringan gagal, data terakhir yang tersimpan dipakai. */
export async function ambil<T = any>(path: string): Promise<{ data: T; luring: boolean; waktu?: number }> {
  try {
    const data = await permintaan<T>(path);
    AsyncStorage.setItem(AWALAN_CACHE + path, JSON.stringify({ data, waktu: Date.now() })).catch(() => {});
    return { data, luring: false };
  } catch (e) {
    if (e instanceof ApiError && e.jaringan) {
      const simpan = await AsyncStorage.getItem(AWALAN_CACHE + path).catch(() => null);
      if (simpan) {
        const { data, waktu } = JSON.parse(simpan);
        return { data, luring: true, waktu };
      }
    }
    throw e;
  }
}

export async function hapusCache() {
  try {
    const kunci = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(kunci.filter((k) => k.startsWith(AWALAN_CACHE)));
  } catch {}
}
