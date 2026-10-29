import { Linking } from 'react-native';
import { ambilServer } from '../api/config';

/** Membuka halaman SIAKAD web di browser HP (fitur yang hanya tersedia di web, mis. EDOM, cetak BAP). */
export async function bukaDiBrowser(jalur = '/dashboard') {
  const server = await ambilServer();
  await Linking.openURL(server + (jalur.startsWith('/') ? jalur : '/' + jalur));
}
