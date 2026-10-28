import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useData } from '../api/useData';
import { ApiError, permintaan } from '../api/client';
import { Galat, Isian, Kartu, Kosong, Layar, Lencana, Muat, s, Tombol } from '../components/ui';
import { Pilihan } from '../components/Lembar';

const METODE = ['Tatap Muka / Ceramah & Diskusi', 'Daring (Vicon)', 'Diskusi Kelompok', 'Presentasi Mahasiswa', 'Praktik / Studi Kasus'];
import { jam } from '../utils/format';
import { jarak, warna } from '../theme';

/** Daftar hadir satu pertemuan & ubah Jurnal BAP (dosen pengampu). */
export default function VerumPresensiScreen() {
  const { params }: any = useRoute();
  const { data, memuat, galat, menyegarkan, segarkan, muatUlang } = useData<any>(`/verum/presensi/${params.id}`);
  const [judul, setJudul] = useState('');
  const [materi, setMateri] = useState('');
  const [metode, setMetode] = useState(METODE[0]);
  const [simpan, setSimpan] = useState(false);

  useEffect(() => {
    if (!data) return;
    setJudul(data.judul_pertemuan || '');
    setMateri(data.materi_aktual || '');
    setMetode(data.metode_pembelajaran || METODE[0]);
  }, [data]);

  if (memuat && !data) return <Muat />;
  if (galat && !data) return <Layar><Galat pesan={galat.message} onUlang={muatUlang} /></Layar>;
  if (!data) return null;

  const peserta: any[] = data.peserta || [];
  const perbarui = async () => {
    if (!judul.trim()) return Alert.alert('Judul wajib', 'Isi judul/topik pertemuan.');
    setSimpan(true);
    try {
      // Kirim semua kolom jurnal: server menyimpan ulang seluruhnya (kolom kosong = dikosongkan)
      const body = { judul_pertemuan: judul.trim(), materi_aktual: materi.trim() || null, metode_pembelajaran: metode };
      const r = await permintaan<{ message: string }>(`/verum/presensi/${params.id}/jurnal`, { method: 'PATCH', body });
      Alert.alert('Tersimpan', r?.message || 'Jurnal diperbarui.');
      muatUlang();
    } catch (e: any) {
      Alert.alert('Gagal', e instanceof ApiError ? e.message : 'Coba lagi.');
    } finally {
      setSimpan(false);
    }
  };

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan}>
      <Kartu gelap>
        <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '800' }}>PERTEMUAN {data.pertemuan_ke}</Text>
        <Text style={{ color: warna.putih, fontSize: 17, fontWeight: '900' }}>{data.judul_pertemuan}</Text>
        <Text style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>{data.jumlah_hadir} dari {peserta.length} peserta hadir</Text>
      </Kartu>

      <Kartu judul="Ubah jurnal BAP" ikon="create-outline">
        <Isian label="Judul / topik" value={judul} onChangeText={setJudul} />
        <Isian label="Materi yang disampaikan" value={materi} onChangeText={setMateri} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
        <Text style={s.label}>METODE PEMBELAJARAN</Text>
        <Pilihan opsi={Array.from(new Set([...METODE, metode])).map((m) => ({ nilai: m, label: m }))} nilai={metode} onPilih={setMetode} />
        <Tombol teks="Simpan jurnal" ikon="save-outline" onPress={perbarui} memuat={simpan} />
      </Kartu>

      <Text style={s.judulBagian}>Daftar hadir</Text>
      {peserta.length === 0 ? <Kartu><Kosong teks="Belum ada peserta resmi." ikon="people-outline" /></Kartu> : null}
      <View style={[s.kartu, { padding: 0 }]}>
        {peserta.map((p) => (
          <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: jarak.m, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: warna.garis }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: warna.teks }}>{p.nama_lengkap}</Text>
              <Text style={s.redupKecil}>{p.nim}{p.waktu ? ' · ' + jam(p.waktu) : ''}</Text>
            </View>
            <Lencana teks={p.hadir ? 'Hadir' : 'Belum/Tidak'} jenis={p.hadir ? 'sukses' : 'redup'} />
          </View>
        ))}
      </View>
    </Layar>
  );
}
