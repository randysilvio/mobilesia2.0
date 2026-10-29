import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { permintaan } from '../api/client';
import { versiAplikasi } from '../api/config';

/**
 * Push notifikasi (Firebase Cloud Messaging).
 * Server SIAKAD mengirim push untuk setiap notifikasi baru (validasi KRS, tugas Verum, agenda, dst.).
 * Bila APK dibangun tanpa google-services.json, fungsi di sini diam saja (aplikasi tetap jalan normal).
 */

const KUNCI_TOKEN_PUSH = 'siakad_push_token';
export const KANAL = 'siakad';

export type StatusPush = 'aktif' | 'ditolak' | 'tidak_tersedia' | 'belum';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

async function siapkanKanal() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(KANAL, {
    name: 'Notifikasi SIAKAD',
    description: 'KRS, tugas & presensi Verum, agenda akademik, pengumuman',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: '#1e293b',
  });
}

async function kirimKeServer(token: string) {
  await permintaan('/push/token', { body: { token, platform: Platform.OS === 'ios' ? 'ios' : 'android', versi: versiAplikasi().nama }, timeout: 15000 });
  await SecureStore.setItemAsync(KUNCI_TOKEN_PUSH, token).catch(() => {});
}

/** Minta izin & daftarkan HP ini ke akun yang sedang masuk. Aman dipanggil berkali-kali. */
export async function daftarkanPush(mintaIzin = true): Promise<StatusPush> {
  if (Platform.OS !== 'android') return 'tidak_tersedia';
  try {
    await siapkanKanal();
    let izin = await Notifications.getPermissionsAsync();
    if (!izin.granted && izin.canAskAgain && mintaIzin) izin = await Notifications.requestPermissionsAsync();
    if (!izin.granted) return 'ditolak';

    let token: string;
    try {
      token = String((await Notifications.getDevicePushTokenAsync()).data || '');
    } catch {
      return 'tidak_tersedia'; // APK tanpa google-services.json
    }
    if (!token) return 'tidak_tersedia';
    await kirimKeServer(token);
    return 'aktif';
  } catch {
    return 'belum'; // server/jaringan bermasalah: dicoba lagi saat aplikasi dibuka berikutnya
  }
}

/** Status untuk ditampilkan di menu (tanpa memunculkan dialog izin). */
export async function statusPush(): Promise<StatusPush> {
  if (Platform.OS !== 'android') return 'tidak_tersedia';
  try {
    const izin = await Notifications.getPermissionsAsync();
    if (!izin.granted) return izin.canAskAgain ? 'belum' : 'ditolak';
    const t = await SecureStore.getItemAsync(KUNCI_TOKEN_PUSH);
    return t ? 'aktif' : 'belum';
  } catch {
    return 'tidak_tersedia';
  }
}

/** Token yang harus dilepas saat keluar (dikirim bersama /logout). */
export async function lepasTokenPush(): Promise<string | null> {
  const t = await SecureStore.getItemAsync(KUNCI_TOKEN_PUSH).catch(() => null);
  await SecureStore.deleteItemAsync(KUNCI_TOKEN_PUSH).catch(() => {});
  return t;
}

/** Token FCM bisa diperbarui sistem; kirim ulang ke server. */
export function pantauTokenBaru(): () => void {
  const sub = Notifications.addPushTokenListener((t) => {
    if (t?.data) kirimKeServer(String(t.data)).catch(() => {});
  });
  return () => sub.remove();
}

export function bukaPengaturanNotifikasi() {
  Linking.openSettings().catch(() => {});
}
