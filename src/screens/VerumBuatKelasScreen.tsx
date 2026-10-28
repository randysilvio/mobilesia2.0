import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../api/useData';
import { ApiError, permintaan } from '../api/client';
import { Galat, Isian, Kartu, Kosong, Layar, Muat, s, Tombol } from '../components/ui';
import { Pilihan } from '../components/Lembar';
import { jarak, warna } from '../theme';

/** Dosen membuat kelas Verum untuk mata kuliah yang diampu (pengampu utama atau team teaching), per rombel atau semua rombel. */
export default function VerumBuatKelasScreen() {
  const nav = useNavigation<any>();
  const { data, memuat, galat, muatUlang } = useData<any[]>('/verum/kelas-form');
  const [mkId, setMkId] = useState<number | null>(null);
  const [rombel, setRombel] = useState<string>('');
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kirim, setKirim] = useState(false);

  if (memuat && !data) return <Muat />;
  if (galat && !data) return <Layar><Galat pesan={galat.message} onUlang={muatUlang} /></Layar>;

  const daftar: any[] = Array.isArray(data) ? data : [];
  const mk = daftar.find((m) => m.id === mkId);

  const pilihMk = (m: any) => {
    setMkId(m.id);
    setRombel('');
    setNama(m.nama_mk);
  };
  const pilihRombel = (r: string) => {
    setRombel(r);
    if (mk) setNama(r ? `${mk.nama_mk} — Kelas ${r}` : mk.nama_mk);
  };

  const simpan = async () => {
    if (!mkId) return Alert.alert('Pilih mata kuliah', 'Pilih mata kuliah yang akan dibuatkan kelas.');
    if (!nama.trim()) return Alert.alert('Nama kelas wajib', 'Isi nama kelas.');
    setKirim(true);
    try {
      const r = await permintaan<{ message: string; id: number }>('/verum/kelas', { body: { mata_kuliah_id: mkId, nama_kelas: nama.trim(), rombel: rombel || null, deskripsi: deskripsi.trim() || null } });
      Alert.alert('Berhasil', r?.message || 'Kelas dibuat.');
      nav.replace('VerumKelas', { id: r.id, nama: nama.trim() });
    } catch (e: any) {
      Alert.alert('Gagal', e instanceof ApiError ? e.message : 'Coba lagi.');
    } finally {
      setKirim(false);
    }
  };

  return (
    <Layar>
      <Text style={s.judulBagian}>1. Mata kuliah yang Anda ampu</Text>
      {daftar.length === 0 ? <Kartu><Kosong teks="Anda belum tercatat mengampu mata kuliah." ikon="book-outline" /></Kartu> : null}
      {daftar.map((m) => {
        const aktif = m.id === mkId;
        return (
          <Pressable key={m.id} onPress={() => pilihMk(m)} style={[s.kartu, { padding: jarak.m, flexDirection: 'row', alignItems: 'center', borderTopColor: aktif ? warna.sukses : warna.garis }]}>
            <Ionicons name={aktif ? 'radio-button-on' : 'radio-button-off'} size={22} color={aktif ? warna.sukses : warna.redup} />
            <View style={{ flex: 1, marginLeft: jarak.s }}>
              <Text style={{ fontWeight: '700', color: warna.teks }}>{m.nama_mk}</Text>
              <Text style={s.redupKecil}>{m.kode_mk} · Semester {m.semester} · Rombel {m.rombel?.length ? m.rombel.join(', ') : '-'}</Text>
            </View>
          </Pressable>
        );
      })}

      {mk ? (
        <Kartu judul="2. Detail kelas" ikon="school-outline">
          <Text style={s.label}>ROMBEL PESERTA</Text>
          <Pilihan opsi={[{ nilai: '', label: 'Semua rombel' }, ...(mk.rombel || []).map((r: string) => ({ nilai: r, label: `Kelas ${r}` }))]} nilai={rombel} onPilih={pilihRombel} />
          <Isian label="Nama kelas" value={nama} onChangeText={setNama} />
          <Isian label="Deskripsi (opsional)" value={deskripsi} onChangeText={setDeskripsi} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
          <Text style={[s.redupKecil, { marginBottom: jarak.m }]}>Peserta otomatis: mahasiswa yang KRS-nya disetujui{rombel ? ` dan berada di rombel ${rombel}` : ''}.</Text>
          <Tombol teks="Buat kelas" ikon="add-circle-outline" onPress={simpan} memuat={kirim} />
        </Kartu>
      ) : null}
    </Layar>
  );
}
