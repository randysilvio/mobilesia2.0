import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../api/useData';
import { Galat, Kartu, Kosong, Layar, Lencana, Muat, s, Tombol } from '../components/ui';
import { jarak, warna } from '../theme';

/** Daftar kelas Verum semester aktif (dosen: kelas yang dikelola; mahasiswa: sesuai KRS disetujui & rombel). */
export default function VerumScreen() {
  const nav = useNavigation<any>();
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<any>('/verum/kelas');

  if (memuat && !data) return <Muat />;
  if (galat && !data) return <Layar menyegarkan={menyegarkan} onSegarkan={segarkan}><Galat pesan={galat.message} onUlang={muatUlang} /></Layar>;

  const kelas: any[] = Array.isArray(data?.data) ? data.data : [];
  const dosen = data?.peran === 'dosen';

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan} luring={luring}>
      <Text style={[s.redup, { marginBottom: jarak.m }]}>
        Verum · kelas daring {data?.semester || ''}{dosen ? ' — materi, tugas, presensi & jurnal BAP.' : ' — materi, tugas, presensi & forum.'}
      </Text>
      {dosen ? <Tombol teks="Buat kelas baru" ikon="add-circle-outline" onPress={() => nav.navigate('VerumBuatKelas')} gaya={{ marginBottom: jarak.m }} /> : null}
      {data?.pesan ? <Kartu gaya={{ borderTopColor: warna.peringatan }}><Text style={s.teks}>{data.pesan}</Text></Kartu> : null}
      {kelas.length === 0 && !data?.pesan ? (
        <Kartu><Kosong teks={dosen ? 'Belum ada kelas Verum. Buat kelas untuk mata kuliah yang Anda ampu.' : 'Belum ada kelas Verum untuk mata kuliah Anda semester ini.'} ikon="school-outline" /></Kartu>
      ) : null}
      {kelas.map((k) => (
        <Pressable key={k.id} onPress={() => nav.navigate('VerumKelas', { id: k.id, nama: k.nama_kelas })}
          style={({ pressed }) => [s.kartu, { opacity: pressed ? 0.85 : 1, borderTopColor: k.is_meeting_active ? warna.bahaya : warna.gelap }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '900', color: warna.gelap, fontSize: 15 }}>{k.nama_kelas}</Text>
              <Text style={s.redupKecil}>{k.mata_kuliah?.kode_mk} · {k.mata_kuliah?.nama_mk} · {k.mata_kuliah?.sks} SKS</Text>
              <Text style={s.redupKecil}>{k.rombel ? `Rombel ${k.rombel}` : 'Semua rombel'}{!dosen && k.dosen ? ' · ' + k.dosen : ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={warna.redup} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: jarak.s }}>
            {k.is_meeting_active ? <View style={{ marginRight: 6, marginBottom: 4 }}><Lencana teks="Vicon live" jenis="bahaya" /></View> : null}
            {k.presensi_terbuka ? <View style={{ marginRight: 6, marginBottom: 4 }}><Lencana teks="Presensi dibuka" jenis="sukses" /></View> : null}
            <View style={{ marginRight: 6, marginBottom: 4 }}><Lencana teks={`${k.jumlah_materi} materi`} jenis="redup" /></View>
            <View style={{ marginBottom: 4 }}><Lencana teks={`${k.jumlah_tugas} tugas`} jenis="redup" /></View>
          </View>
        </Pressable>
      ))}
    </Layar>
  );
}
