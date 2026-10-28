import React from 'react';
import { Image, Linking, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { versiAplikasi } from '../api/config';
import { Kartu, s, Tombol } from '../components/ui';
import { jarak, warna } from '../theme';

export default function UpdateScreen() {
  const { perluUpdate, cekVersi } = useAuth();
  return (
    <View style={[s.tengah, { padding: jarak.xl }]}>
      <Image source={require('../../assets/logo.png')} style={{ width: 90, height: 90, marginBottom: jarak.l }} resizeMode="contain" />
      <Kartu judul="Pembaruan wajib" ikon="cloud-download-outline" gaya={{ alignSelf: 'stretch' }}>
        <Text style={[s.teks, { marginBottom: jarak.l }]}>
          Versi aplikasi ini ({versiAplikasi().nama}) sudah tidak didukung. Unduh dan pasang versi terbaru untuk melanjutkan.
        </Text>
        <Tombol teks="Unduh versi terbaru" ikon="download-outline" onPress={() => perluUpdate && Linking.openURL(perluUpdate.url)} gaya={{ marginBottom: jarak.s }} />
        <Tombol teks="Periksa lagi" jenis="garis" ikon="refresh" onPress={cekVersi} />
      </Kartu>
      <Text style={[s.redupKecil, { color: warna.redup, textAlign: 'center' }]}>
        Bila Android meminta izin, izinkan pemasangan dari browser/berkas untuk aplikasi resmi kampus ini.
      </Text>
    </View>
  );
}
