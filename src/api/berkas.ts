import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { ApiError, tokenAktif } from './client';
import { ambilServer } from './config';

const MIME: Record<string, string> = {
  pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
};

export function mimeDari(nama: string): string {
  const ext = (nama.split('.').pop() || '').toLowerCase();
  return MIME[ext] || 'application/octet-stream';
}

function namaAman(nama: string): string {
  return nama.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80) || 'berkas';
}

/** Buka berkas lokal dengan aplikasi yang sesuai (PDF viewer, Word, dst.); bila tidak ada, tampilkan lembar bagikan. */
export async function bukaBerkasLokal(uri: string, mime: string) {
  if (Platform.OS === 'android') {
    try {
      const contentUri = await FileSystem.getContentUriAsync(uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: contentUri, flags: 1, type: mime });
      return;
    } catch {
      // tidak ada aplikasi pembuka → bagikan
    }
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: 'Buka dengan' });
  } else {
    throw new ApiError(0, 'Tidak ada aplikasi untuk membuka berkas ini.');
  }
}

/**
 * Unduh berkas lalu langsung membukanya.
 * `sumber` diawali "/" = endpoint API SIAKAD (memakai token login); selain itu URL lengkap (mis. materi publik).
 */
export async function unduhDanBuka(sumber: string, namaFile: string) {
  const server = await ambilServer();
  const url = sumber.startsWith('/') ? server + '/api' + sumber : sumber;
  const headers: Record<string, string> = { Accept: 'application/pdf, application/octet-stream, */*' };
  const token = tokenAktif();
  if (token && (sumber.startsWith('/') || url.startsWith(server))) headers.Authorization = 'Bearer ' + token;

  const tujuan = (FileSystem.cacheDirectory || '') + Date.now() + '-' + namaAman(namaFile);
  let hasil: FileSystem.FileSystemDownloadResult;
  try {
    hasil = await FileSystem.downloadAsync(url, tujuan, { headers });
  } catch {
    throw new ApiError(0, 'Tidak dapat mengunduh berkas. Periksa koneksi internet Anda.');
  }

  if (hasil.status < 200 || hasil.status >= 300) {
    let pesan = `Berkas tidak dapat diunduh (kode ${hasil.status}).`;
    try {
      const teks = await FileSystem.readAsStringAsync(hasil.uri);
      const json = JSON.parse(teks);
      if (json?.message) pesan = json.message;
    } catch {}
    FileSystem.deleteAsync(hasil.uri, { idempotent: true }).catch(() => {});
    throw new ApiError(hasil.status, hasil.status === 401 ? 'Sesi Anda telah berakhir. Silakan masuk kembali.' : pesan);
  }

  const tipe = (hasil.headers?.['Content-Type'] || hasil.headers?.['content-type'] || '').split(';')[0] || mimeDari(namaFile);
  await bukaBerkasLokal(hasil.uri, tipe === 'application/octet-stream' ? mimeDari(namaFile) : tipe);
}

export type BerkasDipilih = { uri: string; name: string; mimeType: string; size?: number };

/** Pilih dokumen dari HP (PDF/Office/ZIP) dengan batas ukuran (MB). */
export async function pilihDokumen(jenis: string[], maksMb: number): Promise<BerkasDipilih | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: jenis, copyToCacheDirectory: true, multiple: false });
  if (r.canceled || !r.assets?.length) return null;
  const a = r.assets[0];
  if (a.size && a.size > maksMb * 1024 * 1024) {
    throw new ApiError(422, `Ukuran berkas ${(a.size / 1024 / 1024).toFixed(1)} MB melebihi batas ${maksMb} MB.`);
  }
  return { uri: a.uri, name: a.name || 'berkas', mimeType: a.mimeType || mimeDari(a.name || ''), size: a.size };
}

export const JENIS_DOKUMEN = {
  jawaban: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed'],
  materi: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip', 'application/x-zip-compressed'],
};
