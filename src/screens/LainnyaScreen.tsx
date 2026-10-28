import React from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { ambilServer, versiAplikasi } from '../api/config';
import { ItemMenu, s } from '../components/ui';
import { jarak, warna } from '../theme';

export default function LainnyaScreen() {
  const nav = useNavigation<any>();
  const { peran, profil, keluar } = useAuth();

  const bukaWeb = async () => Linking.openURL(await ambilServer());
  const konfirmasiKeluar = () => Alert.alert('Keluar dari aplikasi?', 'Anda perlu masuk kembali untuk memakai aplikasi.', [
    { text: 'Batal', style: 'cancel' }, { text: 'Keluar', style: 'destructive', onPress: keluar },
  ]);

  return (
    <ScrollView style={s.layar}>
      <View style={{ padding: jarak.l, backgroundColor: warna.gelap }}>
        <Text style={{ color: warna.putih, fontWeight: '900', fontSize: 17 }}>{profil?.name}</Text>
        <Text style={{ color: '#cbd5e1', fontSize: 12 }}>{profil?.email}</Text>
      </View>
      <Text style={[s.judulBagian, { marginHorizontal: jarak.l }]}>Menu</Text>
      {peran === 'mahasiswa' ? <ItemMenu ikon="wallet-outline" teks="Tagihan & pembayaran" sub="Lihat tagihan, unggah bukti transfer" onPress={() => nav.navigate('Tagihan')} /> : null}
      <ItemMenu ikon="calendar-number-outline" teks="Kalender akademik" onPress={() => nav.navigate('Kalender')} />
      <ItemMenu ikon="notifications-outline" teks="Notifikasi" onPress={() => nav.navigate('Notifikasi')} />
      <ItemMenu ikon="person-outline" teks="Profil saya" onPress={() => nav.navigate('Profil')} />
      <ItemMenu ikon="globe-outline" teks="Buka SIAKAD web" sub="EDOM, cetak KHS/transkrip, surat, dan fitur lengkap lainnya" onPress={bukaWeb} />
      <Text style={[s.judulBagian, { marginHorizontal: jarak.l }]}>Akun</Text>
      <ItemMenu ikon="log-out-outline" teks="Keluar" onPress={konfirmasiKeluar} bahaya />
      <Text style={[s.redupKecil, { textAlign: 'center', marginVertical: jarak.xl }]}>
        SIAKAD STT GPI Papua · versi {versiAplikasi().nama} (build {versiAplikasi().kode})
      </Text>
    </ScrollView>
  );
}
