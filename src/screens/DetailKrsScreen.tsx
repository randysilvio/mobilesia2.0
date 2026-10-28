import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useData } from '../api/useData';
import { ApiError, permintaan } from '../api/client';
import { Angka, Baris, Galat, Isian, Kartu, Layar, Lencana, Muat, s, Tombol, jenisStatus } from '../components/ui';
import { angka } from '../utils/format';
import { jarak, warna } from '../theme';

export default function DetailKrsScreen() {
  const nav = useNavigation<any>();
  const { params }: any = useRoute();
  const { data, memuat, galat, menyegarkan, segarkan, muatUlang } = useData<any>(`/krs/validasi/${params.id}`);
  const [catatan, setCatatan] = useState('');
  const [proses, setProses] = useState<string | null>(null);

  if (memuat && !data) return <Muat />;
  if (galat && !data) return <Layar><Galat pesan={galat.message} onUlang={muatUlang} /></Layar>;

  const putuskan = (status: 'Setujui' | 'Tolak') => {
    if (status === 'Tolak' && !catatan.trim()) {
      Alert.alert('Catatan wajib', 'Tuliskan alasan penolakan agar mahasiswa tahu apa yang harus diperbaiki.');
      return;
    }
    Alert.alert(status === 'Setujui' ? 'Setujui KRS?' : 'Tolak KRS?',
      `${data?.mahasiswa?.nama_lengkap} · ${data?.total_sks} SKS`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: status, style: status === 'Tolak' ? 'destructive' : 'default', onPress: async () => {
            setProses(status);
            try {
              const r = await permintaan<{ message: string }>(`/krs/validasi/${params.id}`, { body: { status, catatan: catatan.trim() || null } });
              Alert.alert('Berhasil', r?.message || 'Status KRS diperbarui.');
              nav.goBack();
            } catch (e: any) {
              Alert.alert('Gagal', e instanceof ApiError ? e.message : 'Coba lagi.');
            } finally {
              setProses(null);
            }
          },
        },
      ]);
  };

  const mhs = data?.mahasiswa || {};
  const melebihi = Number(data?.total_sks) > Number(data?.max_sks);

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan}>
      <Kartu gelap>
        <Text style={{ color: warna.putih, fontSize: 17, fontWeight: '900' }}>{mhs.nama_lengkap}</Text>
        <Text style={{ color: '#cbd5e1', fontSize: 12, marginBottom: jarak.m }}>{mhs.nim} · {mhs.prodi} · Semester ke-{data?.semester_ke}</Text>
        <View style={{ flexDirection: 'row' }}>
          <Angka terang label="Total SKS" nilai={`${data?.total_sks}/${data?.max_sks}`} />
          <Angka terang label="IPK" nilai={angka(data?.ipk)} />
        </View>
        <View style={{ marginTop: jarak.m }}><Lencana teks={data?.status_krs || '-'} jenis={jenisStatus(data?.status_krs)} /></View>
      </Kartu>
      {melebihi ? <Text style={{ color: warna.bahaya, marginBottom: jarak.m }}>Total SKS melebihi batas mahasiswa ini.</Text> : null}

      <Kartu judul={`Rencana studi · ${data?.semester || ''}`} ikon="book-outline">
        {(data?.mata_kuliah || []).map((mk: any) => (
          <Baris key={mk.id} label={`${mk.kode_mk} · ${mk.nama_mk} (Kelas ${mk.kelas})`} nilai={`${mk.sks} SKS`} tebal />
        ))}
      </Kartu>

      {data?.catatan ? <Kartu judul="Catatan sebelumnya" ikon="chatbox-outline"><Text style={s.teks}>{data.catatan}</Text></Kartu> : null}

      <Kartu judul="Keputusan" ikon="create-outline">
        <Isian label="Catatan untuk mahasiswa (wajib bila ditolak)" value={catatan} onChangeText={setCatatan} multiline
          style={{ minHeight: 80, textAlignVertical: 'top' }} placeholder="Contoh: ganti kelas B karena bentrok dengan ..." />
        <Tombol teks="Setujui KRS" jenis="sukses" ikon="checkmark-circle-outline" onPress={() => putuskan('Setujui')} memuat={proses === 'Setujui'} gaya={{ marginBottom: jarak.s }} />
        <Tombol teks="Tolak KRS" jenis="bahaya" ikon="close-circle-outline" onPress={() => putuskan('Tolak')} memuat={proses === 'Tolak'} />
      </Kartu>
    </Layar>
  );
}
