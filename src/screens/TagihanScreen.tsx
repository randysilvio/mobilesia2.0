import React, { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useData } from '../api/useData';
import { ApiError, permintaan } from '../api/client';
import { Galat, Kartu, Kosong, Layar, Lencana, Muat, s, Tombol, jenisStatus } from '../components/ui';
import { rupiah, tanggal } from '../utils/format';
import { jarak, warna } from '../theme';

const LABEL_STATUS: Record<string, string> = {
  lunas: 'Lunas', belum_lunas: 'Belum lunas', menunggu_konfirmasi: 'Menunggu verifikasi', dispensasi: 'Dispensasi',
};

export default function TagihanScreen() {
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<any[]>('/riwayat-pembayaran-mahasiswa');
  const [mengunggah, setMengunggah] = useState<number | null>(null);

  if (memuat && !data) return <Muat />;
  const daftar = Array.isArray(data) ? data : [];
  const tertahan = daftar.filter((p) => !['lunas', 'dispensasi'].includes(p.status));
  const totalTertahan = tertahan.reduce((n, p) => n + Number(p.jumlah || 0), 0);

  const pilihSumber = (): Promise<'kamera' | 'galeri' | null> => new Promise((selesai) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: ['Batal', 'Ambil foto', 'Pilih dari galeri'], cancelButtonIndex: 0 },
        (i) => selesai(i === 1 ? 'kamera' : i === 2 ? 'galeri' : null));
    } else {
      Alert.alert('Bukti transfer', 'Ambil foto bukti transfer atau pilih dari galeri.', [
        { text: 'Batal', style: 'cancel', onPress: () => selesai(null) },
        { text: 'Galeri', onPress: () => selesai('galeri') },
        { text: 'Kamera', onPress: () => selesai('kamera') },
      ]);
    }
  });

  const unggah = async (p: any) => {
    const sumber = await pilihSumber();
    if (!sumber) return;
    const izin = sumber === 'kamera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('Izin ditolak', 'Izinkan akses ' + (sumber === 'kamera' ? 'kamera' : 'galeri') + ' di pengaturan Android.');
      return;
    }
    const opsi: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: false };
    const hasil = sumber === 'kamera' ? await ImagePicker.launchCameraAsync(opsi) : await ImagePicker.launchImageLibraryAsync(opsi);
    if (hasil.canceled || !hasil.assets?.length) return;

    const aset = hasil.assets[0];
    const form = new FormData();
    form.append('bukti_bayar', { uri: aset.uri, name: 'bukti-transfer.jpg', type: aset.mimeType || 'image/jpeg' } as any);
    setMengunggah(p.id);
    try {
      const r = await permintaan<{ message: string }>(`/pembayaran/${p.id}/bukti`, { form, timeout: 60000 });
      Alert.alert('Berhasil', r?.message || 'Bukti pembayaran terkirim. Menunggu verifikasi Bagian Keuangan.');
      muatUlang();
    } catch (e: any) {
      Alert.alert('Gagal mengunggah', e instanceof ApiError ? e.message : 'Coba lagi.');
    } finally {
      setMengunggah(null);
    }
  };

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan} luring={luring}>
      {galat && !data ? <Galat pesan={galat.message} onUlang={muatUlang} /> : null}
      <Kartu gelap>
        <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '800' }}>TAGIHAN BELUM SELESAI</Text>
        <Text style={{ color: warna.putih, fontSize: 24, fontWeight: '900', marginTop: 4 }}>{rupiah(totalTertahan)}</Text>
        <Text style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>
          KRS terbuka bila seluruh tagihan LUNAS atau mendapat DISPENSASI dari Bagian Keuangan.
        </Text>
      </Kartu>
      {daftar.length === 0 && !galat ? <Kartu><Kosong teks="Belum ada tagihan." ikon="wallet-outline" /></Kartu> : null}
      {daftar.map((p) => (
        <Kartu key={p.id} gaya={{ borderTopColor: warna[jenisStatus(p.status) === 'sukses' ? 'sukses' : jenisStatus(p.status) === 'bahaya' ? 'bahaya' : 'peringatan'] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: jarak.s }}>
              <Text style={{ fontWeight: '800', color: warna.teks }}>{String(p.jenis || 'Tagihan').replace(/_/g, ' ').toUpperCase()}</Text>
              <Text style={s.redupKecil}>{p.semester}</Text>
            </View>
            <Lencana teks={LABEL_STATUS[p.status] || p.status} jenis={jenisStatus(p.status)} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: warna.gelap, marginTop: jarak.s }}>{rupiah(p.jumlah)}</Text>
          {p.tanggal && p.tanggal !== '-' ? <Text style={s.redupKecil}>Dibayar/diunggah: {p.tanggal}</Text> : null}
          {p.keterangan ? <Text style={[s.redupKecil, { marginTop: 4 }]}>{p.keterangan}</Text> : null}
          {['belum_lunas', 'menunggu_konfirmasi'].includes(p.status) ? (
            <Tombol teks={p.status === 'menunggu_konfirmasi' ? 'Unggah ulang bukti' : 'Unggah bukti transfer'} ikon="camera-outline"
              jenis="garis" onPress={() => unggah(p)} memuat={mengunggah === p.id} gaya={{ marginTop: jarak.m }} />
          ) : null}
        </Kartu>
      ))}
    </Layar>
  );
}
