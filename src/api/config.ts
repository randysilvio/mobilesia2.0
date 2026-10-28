import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const KUNCI_SERVER = 'siakad.server_url';
let serverCache: string | null = null;

export function serverBawaan(): string {
  const extra: any = Constants.expoConfig?.extra || {};
  return normalisasi(extra.apiUrl || 'https://sttgpi.ac.id');
}

export function normalisasi(url: string): string {
  let u = (url || '').trim();
  if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u.replace(/\/+$/, '');
}

export async function ambilServer(): Promise<string> {
  if (serverCache) return serverCache;
  try {
    const tersimpan = await AsyncStorage.getItem(KUNCI_SERVER);
    serverCache = tersimpan ? normalisasi(tersimpan) : serverBawaan();
  } catch {
    serverCache = serverBawaan();
  }
  return serverCache;
}

export async function simpanServer(url: string): Promise<void> {
  serverCache = normalisasi(url);
  try {
    await AsyncStorage.setItem(KUNCI_SERVER, serverCache);
  } catch {}
}

export function versiAplikasi(): { nama: string; kode: number } {
  const cfg: any = Constants.expoConfig || {};
  return { nama: cfg.version || '1.0.0', kode: Number(cfg.android?.versionCode || 1) };
}
