import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../api/useData';
import { ApiError, permintaan } from '../api/client';
import { Angka, Baris, Galat, Isian, Kartu, Layar, Lencana, Muat, s, Tombol, jenisStatus } from '../components/ui';
import { angka, jam, tanggalJam } from '../utils/format';
import { jarak, warna } from '../theme';

const LABEL_PERAN: Record<string, string> = { wali: 'Anda Dosen Wali mahasiswa ini', kaprodi: 'Anda Kaprodi mahasiswa ini', keduanya: 'Anda Dosen Wali sekaligus Kaprodi', admin: 'Administrator' };

/** Rincian KRS untuk Dosen Wali / Kaprodi: setujui, tolak (dengan catatan), buka kembali, atau hapus MK (Dosen Wali). */
export default function DetailKrsScreen() {
  const { params }: any = useRoute();
  const { data, memuat, galat, menyegarkan, segarkan, muatUlang } = useData<any>(`/krs/validasi/${params.id}`);
  const [catatan, setCatatan] = useState('');
  const [proses, setProses] = useState<string | null>(null);

  if (memuat && !data) return <Muat />;
  if (galat && !data) return <Layar><Galat pesan={galat.message} onUlang={muatUlang} /></Layar>;

  const d = data || {};
  const mhs = d.mahasiswa || {};
  const status: string = d.status_krs || '-';
  const melebihi = Number(d.total_sks) > Number(d.max_sks);

  const kirim = async (aksi: 'Setujui' | 'Tolak' | 'Buka') => {
    setProses(aksi);
    try {
      const r = await permintaan<{ message: string }>(`/krs/validasi/${params.id}`, { body: { status: aksi, catatan: catatan.trim() || null } });
      Alert.alert('Berhasil', r?.message || 'Status KRS diperbarui.');
      setCatatan('');
      muatUlang();
    } catch (e: any) {
      Alert.alert('Gagal', e instanceof ApiError ? e.message : 'Coba lagi.');
    } finally {
      setProses(null);
    }
  };

  const putuskan = (aksi: 'Setujui' | 'Tolak' | 'Buka') => {
    if (aksi === 'Tolak' && !catatan.trim()) {
      Alert.alert('Catatan wajib', 'Tuliskan alasan penolakan agar mahasiswa tahu apa yang harus diperbaiki.');
      return;
    }
    const judul = aksi === 'Setujui' ? 'Setujui KRS?' : aksi === 'Tolak' ? 'Tolak KRS?' : 'Buka kembali persetujuan?';
    const isi = aksi === 'Buka'
      ? 'Status kembali menjadi Menunggu Persetujuan sehingga KRS dapat diubah.'
      : `${mhs.nama_lengkap} · ${d.total_sks} SKS`;
    Alert.alert(judul, isi, [
      { text: 'Batal', style: 'cancel' },
      { text: aksi === 'Buka' ? 'Buka kembali' : aksi, style: aksi === 'Setujui' ? 'default' : 'destructive', onPress: () => kirim(aksi) },
    ]);
  };

  const hapusMk = (mk: any) => {
    Alert.alert('Hapus dari KRS?', `${mk.kode_mk} · ${mk.nama_mk} akan dihapus dari KRS ${mhs.nama_lengkap}.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          try {
            const r = await permintaan<{ message: string }>(`/krs/validasi/${params.id}/mk/${mk.id}`, { method: 'DELETE' });
            Alert.alert('Berhasil', r?.message || 'Mata kuliah dihapus.');
            muatUlang();
          } catch (e: any) {
            Alert.alert('Gagal', e instanceof ApiError ? e.message : 'Coba lagi.');
          }
        },
      },
    ]);
  };

  const disetujui = status === 'Disetujui';

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan}>
      <Kartu gelap>
        <Text style={{ color: warna.putih, fontSize: 17, fontWeight: '900' }}>{mhs.nama_lengkap}</Text>
        <Text style={{ color: '#cbd5e1', fontSize: 12 }}>{mhs.nim} · {mhs.prodi} · Angkatan {mhs.angkatan}</Text>
        <Text style={{ color: '#cbd5e1', fontSize: 12, marginBottom: jarak.m }}>Dosen wali: {mhs.dosen_wali || '-'} · {LABEL_PERAN[d.peran] || ''}</Text>
        <View style={{ flexDirection: 'row' }}>
          <Angka terang label="SKS diambil" nilai={`${d.total_sks}/${d.max_sks}`} />
          <Angka terang label="IPK" nilai={angka(d.ipk)} />
          <Angka terang label="SKS lulus" nilai={String(d.sks_lulus ?? '-')} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: jarak.m }}>
          <Lencana teks={status} jenis={jenisStatus(status)} />
          <Text style={{ color: '#cbd5e1', fontSize: 12, marginLeft: jarak.s }}>{d.semester} · semester ke-{d.semester_ke}</Text>
        </View>
      </Kartu>
      {melebihi ? <Text style={{ color: warna.bahaya, marginBottom: jarak.m }}>Total SKS melebihi batas mahasiswa ini ({d.max_sks} SKS).</Text> : null}

      {d.catatan || d.divalidasi_oleh ? (
        <Kartu judul="Riwayat validasi" ikon="time-outline">
          {d.divalidasi_oleh ? <Baris label="Oleh" nilai={d.divalidasi_oleh} tebal /> : null}
          {d.divalidasi_pada ? <Baris label="Waktu" nilai={tanggalJam(d.divalidasi_pada)} /> : null}
          {d.catatan ? <Text style={[s.teks, { marginTop: jarak.s }]}>{d.catatan}</Text> : null}
        </Kartu>
      ) : null}

      <Kartu judul={`Rencana studi · ${(d.mata_kuliah || []).length} MK`} ikon="book-outline">
        {(d.mata_kuliah || []).length === 0 ? <Text style={s.redup}>Mahasiswa belum mengambil mata kuliah.</Text> : null}
        {(d.mata_kuliah || []).map((mk: any) => (
          <View key={mk.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: warna.garis }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: warna.teks }}>{mk.nama_mk}</Text>
                <Text style={s.redupKecil}>{mk.kode_mk} · {mk.sks} SKS · Smt {mk.semester} · Kelas {mk.kelas}</Text>
                {(mk.jadwal || []).map((j: any, i: number) => (
                  <Text key={i} style={s.redupKecil}>{j.hari} {jam(j.jam_mulai)}–{jam(j.jam_selesai)}{j.ruang ? ' · ' + j.ruang : ''}</Text>
                ))}
              </View>
              {d.bisa_hapus_mk ? (
                <Pressable onPress={() => hapusMk(mk)} hitSlop={10} style={{ padding: 6 }}>
                  <Ionicons name="trash-outline" size={20} color={warna.bahaya} />
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </Kartu>

      {disetujui ? (
        <Kartu judul="KRS disetujui" ikon="lock-closed-outline" gaya={{ borderTopColor: warna.sukses }}>
          {d.bisa_buka_kembali ? (
            <>
              <Text style={[s.teks, { marginBottom: jarak.m }]}>Buka kembali bila KRS perlu diubah. Mahasiswa dapat merevisi lalu mengajukan ulang.</Text>
              <Tombol teks="Buka kembali persetujuan" jenis="garis" ikon="lock-open-outline" onPress={() => putuskan('Buka')} memuat={proses === 'Buka'} />
            </>
          ) : (
            <Text style={s.teks}>Disetujui oleh {d.divalidasi_oleh || 'validator lain'}. Hanya validator tersebut atau Admin yang dapat membukanya kembali.</Text>
          )}
        </Kartu>
      ) : d.bisa_validasi ? (
        <Kartu judul="Keputusan" ikon="create-outline">
          <Isian label="Catatan untuk mahasiswa (wajib bila ditolak)" value={catatan} onChangeText={setCatatan} multiline
            style={{ minHeight: 80, textAlignVertical: 'top' }} placeholder="Contoh: ganti ke kelas B karena bentrok dengan …" />
          <Tombol teks="Setujui KRS" jenis="sukses" ikon="checkmark-circle-outline" onPress={() => putuskan('Setujui')} memuat={proses === 'Setujui'} gaya={{ marginBottom: jarak.s }} />
          <Tombol teks="Tolak KRS" jenis="bahaya" ikon="close-circle-outline" onPress={() => putuskan('Tolak')} memuat={proses === 'Tolak'} />
        </Kartu>
      ) : null}
    </Layar>
  );
}
