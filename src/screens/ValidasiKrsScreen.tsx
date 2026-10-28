import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../api/useData';
import { Galat, Kartu, Kosong, Layar, Lencana, Muat, s, jenisStatus } from '../components/ui';
import { jarak, sudut, warna } from '../theme';

const FILTER = [
  { kunci: 'menunggu', label: 'Menunggu' },
  { kunci: 'ditolak', label: 'Ditolak' },
  { kunci: 'disetujui', label: 'Disetujui' },
  { kunci: 'belum', label: 'Belum isi' },
  { kunci: 'semua', label: 'Semua' },
];

const LABEL_PERAN: Record<string, string> = { wali: 'Anak wali', kaprodi: 'Prodi (Kaprodi)', keduanya: 'Anak wali · Prodi', admin: 'Admin' };

/** Antrean & pemantauan KRS untuk Dosen Wali / Kaprodi. Cukup salah satu dari keduanya yang menyetujui. */
export default function ValidasiKrsScreen() {
  const nav = useNavigation<any>();
  const [filter, setFilter] = useState('menunggu');
  const [cari, setCari] = useState('');
  const [kueri, setKueri] = useState('');
  const path = `/krs/mahasiswa?status=${filter}${kueri ? '&q=' + encodeURIComponent(kueri) : ''}`;
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<any>(path);

  const daftar: any[] = Array.isArray(data?.data) ? data.data : [];
  const ringkas = data?.ringkas || {};

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan} luring={luring}>
      <Text style={[s.redup, { marginBottom: jarak.s }]}>
        KRS {data?.semester || 'semester aktif'} — anak wali Anda{'\n'}dan mahasiswa prodi bila Anda Kaprodi.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: jarak.m }}>
        {FILTER.map((f) => {
          const aktif = f.kunci === filter;
          return (
            <Pressable key={f.kunci} onPress={() => setFilter(f.kunci)}
              style={{ paddingVertical: 8, paddingHorizontal: 12, marginRight: 6, borderRadius: sudut, borderWidth: 1,
                borderColor: aktif ? warna.gelap : warna.garis, backgroundColor: aktif ? warna.gelap : warna.putih }}>
              <Text style={{ fontWeight: '800', fontSize: 12, color: aktif ? warna.putih : warna.gelap }}>
                {f.label.toUpperCase()}{ringkas[f.kunci] !== undefined ? ` · ${ringkas[f.kunci]}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: sudut, backgroundColor: warna.putih, paddingHorizontal: jarak.m, marginBottom: jarak.m }}>
        <Ionicons name="search" size={18} color={warna.redup} />
        <TextInput value={cari} onChangeText={setCari} onSubmitEditing={() => setKueri(cari.trim())} returnKeyType="search"
          placeholder="Cari nama atau NIM" placeholderTextColor={warna.redup} style={{ flex: 1, paddingVertical: 10, marginLeft: 8, color: warna.teks }} />
        {kueri ? <Pressable onPress={() => { setCari(''); setKueri(''); }}><Ionicons name="close-circle" size={18} color={warna.redup} /></Pressable> : null}
      </View>

      {memuat && !data ? <Muat /> : null}
      {galat && !data ? <Galat pesan={galat.message} onUlang={muatUlang} /> : null}
      {data && daftar.length === 0 ? (
        <Kartu><Kosong teks={filter === 'menunggu' ? 'Tidak ada KRS yang menunggu validasi.' : 'Tidak ada mahasiswa pada kategori ini.'} ikon="checkmark-done-outline" /></Kartu>
      ) : null}
      {daftar.map((m) => (
        <Pressable key={m.id} onPress={() => nav.navigate('DetailKrs', { id: m.id, nama: m.nama_lengkap })}
          style={({ pressed }) => [s.kartu, { padding: jarak.m, opacity: pressed ? 0.85 : 1, borderTopColor: warna[jenisStatus(m.status_krs) === 'sukses' ? 'sukses' : jenisStatus(m.status_krs) === 'bahaya' ? 'bahaya' : jenisStatus(m.status_krs) === 'peringatan' ? 'peringatan' : 'garis'] }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: warna.teks }}>{m.nama_lengkap}</Text>
              <Text style={s.redupKecil}>{m.nim} · {m.prodi} · {m.angkatan}</Text>
              <Text style={s.redupKecil}>{LABEL_PERAN[m.peran] || ''}{m.jumlah_mk ? ` · ${m.jumlah_mk} MK · ${m.total_sks} SKS` : ''}</Text>
              {m.divalidasi_oleh ? <Text style={s.redupKecil}>Divalidasi: {m.divalidasi_oleh}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Lencana teks={m.status_krs} jenis={jenisStatus(m.status_krs)} />
              <Ionicons name="chevron-forward" size={18} color={warna.redup} style={{ marginTop: 6 }} />
            </View>
          </View>
        </Pressable>
      ))}
    </Layar>
  );
}
