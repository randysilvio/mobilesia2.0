import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../api/useData';
import { Galat, ItemMenu, Kartu, Kosong, Layar, Muat, s } from '../components/ui';
import { jarak } from '../theme';

export default function ValidasiKrsScreen() {
  const nav = useNavigation<any>();
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<any[]>('/krs/perlu-validasi');
  if (memuat && !data) return <Muat />;
  const daftar = Array.isArray(data) ? data : [];
  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan} luring={luring} gaya={{ padding: 0 }}>
      <View style={{ padding: jarak.l, paddingBottom: 0 }}>
        {galat && !data ? <Galat pesan={galat.message} onUlang={muatUlang} /> : null}
        <Text style={[s.redup, { marginBottom: jarak.m }]}>
          Mahasiswa wali (dan mahasiswa prodi bila Anda Kaprodi) yang KRS semester ini menunggu persetujuan. Cukup salah satu dari Dosen Wali atau Kaprodi yang menyetujui.
        </Text>
      </View>
      {daftar.length === 0 && !galat ? <Kartu gaya={{ marginHorizontal: jarak.l }}><Kosong teks="Tidak ada KRS yang menunggu validasi." ikon="checkmark-done-outline" /></Kartu> : null}
      {daftar.map((m) => (
        <ItemMenu key={m.id} ikon="person-circle-outline" teks={m.mahasiswa?.nama_lengkap || m.mahasiswa?.name}
          sub={'NIM ' + (m.mahasiswa?.nim || '-')} onPress={() => nav.navigate('DetailKrs', { id: m.id, nama: m.mahasiswa?.nama_lengkap })} />
      ))}
    </Layar>
  );
}
