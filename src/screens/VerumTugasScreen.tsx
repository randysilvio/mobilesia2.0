import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../api/useData';
import { ApiError, permintaan } from '../api/client';
import { JENIS_DOKUMEN, pilihDokumen, unduhDanBuka } from '../api/berkas';
import { Galat, Kartu, Kosong, Layar, Lencana, Muat, s, Tombol } from '../components/ui';
import { sisaWaktu, tanggalJam } from '../utils/format';
import { jarak, sudut, warna } from '../theme';

const pesan = (e: any) => (e instanceof ApiError ? e.message : 'Terjadi kesalahan. Coba lagi.');

/** Rincian tugas Verum: mahasiswa mengumpulkan jawaban & melihat nilai; dosen memeriksa dan menilai seluruh peserta. */
export default function VerumTugasScreen() {
  const nav = useNavigation<any>();
  const { params }: any = useRoute();
  const { data, memuat, galat, menyegarkan, segarkan, muatUlang } = useData<any>(`/verum/tugas/${params.id}`);

  if (memuat && !data) return <Muat />;
  if (galat && !data) return <Layar><Galat pesan={galat.message} onUlang={muatUlang} /></Layar>;
  if (!data) return null;

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan}>
      <Kartu gelap>
        <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '800' }}>{String(data.kelas || '').toUpperCase()}</Text>
        <Text style={{ color: warna.putih, fontSize: 18, fontWeight: '900', marginTop: 2 }}>{data.judul}</Text>
        <Text style={{ color: data.lewat ? '#fca5a5' : '#fde68a', fontSize: 12, marginTop: 4 }}>
          Tenggat {tanggalJam(data.tenggat)} · {sisaWaktu(data.tenggat)}
        </Text>
      </Kartu>
      <Kartu judul="Instruksi" ikon="reader-outline"><Text style={s.teks}>{data.instruksi}</Text></Kartu>
      {data.peran === 'dosen'
        ? <PenilaianDosen data={data} muatUlang={muatUlang} onHapus={() => nav.goBack()} />
        : <PengumpulanMahasiswa data={data} muatUlang={muatUlang} />}
    </Layar>
  );
}

function PengumpulanMahasiswa({ data, muatUlang }: any) {
  const saya = data.saya || {};
  const [unggah, setUnggah] = useState(false);
  const [buka, setBuka] = useState(false);

  const kumpulkan = async () => {
    try {
      const b = await pilihDokumen(JENIS_DOKUMEN.jawaban, 10);
      if (!b) return;
      Alert.alert(saya.dikumpulkan ? 'Ganti jawaban?' : 'Kumpulkan jawaban?', b.name, [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kumpulkan', onPress: async () => {
            const form = new FormData();
            form.append('file_jawaban', { uri: b.uri, name: b.name, type: b.mimeType } as any);
            setUnggah(true);
            try {
              const r = await permintaan<{ message: string }>(`/verum/tugas/${data.id}/kumpulkan`, { form, timeout: 120000 });
              Alert.alert('Berhasil', r?.message || 'Jawaban terkumpul.');
              muatUlang();
            } catch (e) {
              Alert.alert('Gagal mengumpulkan', pesan(e));
            } finally {
              setUnggah(false);
            }
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Berkas ditolak', pesan(e));
    }
  };

  const lihat = async () => {
    setBuka(true);
    try {
      await unduhDanBuka(`/berkas/jawaban-tugas/${saya.berkas_id}`, 'jawaban-saya.pdf');
    } catch (e) {
      Alert.alert('Gagal membuka', pesan(e));
    } finally {
      setBuka(false);
    }
  };

  const dinilai = saya.nilai !== null && saya.nilai !== undefined;
  return (
    <Kartu judul="Pengumpulan saya" ikon="cloud-upload-outline" gaya={{ borderTopColor: dinilai || saya.dikumpulkan ? warna.sukses : data.lewat ? warna.bahaya : warna.peringatan }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: jarak.s }}>
        {dinilai ? <Lencana teks={`Nilai ${saya.nilai}`} jenis="sukses" />
          : saya.dikumpulkan ? <Lencana teks="Sudah dikumpulkan" jenis="sukses" />
          : data.lewat ? <Lencana teks="Tidak mengumpulkan" jenis="bahaya" />
          : <Lencana teks="Belum dikumpulkan" jenis="peringatan" />}
        {saya.waktu ? <Text style={[s.redupKecil, { marginLeft: jarak.s, marginTop: 0 }]}>{tanggalJam(saya.waktu)}</Text> : null}
      </View>
      {saya.catatan ? (
        <View style={{ backgroundColor: warna.latar, padding: jarak.m, borderRadius: sudut, marginBottom: jarak.m }}>
          <Text style={s.label}>UMPAN BALIK DOSEN</Text>
          <Text style={s.teks}>{saya.catatan}</Text>
        </View>
      ) : null}
      {saya.berkas_id ? <Tombol teks="Lihat jawaban saya" jenis="garis" ikon="document-outline" onPress={lihat} memuat={buka} gaya={{ marginBottom: jarak.s }} /> : null}
      {!data.lewat ? (
        <>
          <Tombol teks={saya.dikumpulkan ? 'Ganti jawaban' : 'Unggah jawaban'} ikon="cloud-upload-outline" onPress={kumpulkan} memuat={unggah} />
          <Text style={[s.redupKecil, { marginTop: jarak.s }]}>PDF, DOC, DOCX, atau ZIP · maks. 10 MB · dapat diganti sampai tenggat.</Text>
        </>
      ) : <Text style={s.redup}>Batas waktu pengumpulan sudah ditutup.</Text>}
    </Kartu>
  );
}

function PenilaianDosen({ data, muatUlang, onHapus }: any) {
  const peserta: any[] = data.peserta || [];
  const [nilai, setNilai] = useState<Record<number, string>>({});
  const [catatan, setCatatan] = useState<Record<number, string>>({});
  const [simpan, setSimpan] = useState(false);
  const [membuka, setMembuka] = useState<number | null>(null);

  useEffect(() => {
    const n: Record<number, string> = {};
    const c: Record<number, string> = {};
    peserta.forEach((p) => {
      n[p.id] = p.nilai !== null && p.nilai !== undefined ? String(p.nilai) : '';
      c[p.id] = p.catatan || '';
    });
    setNilai(n);
    setCatatan(c);
  }, [data]);

  const kirim = async () => {
    for (const p of peserta) {
      const v = (nilai[p.id] || '').replace(',', '.').trim();
      if (v !== '' && (isNaN(Number(v)) || Number(v) < 0 || Number(v) > 100)) {
        return Alert.alert('Nilai tidak valid', `Nilai ${p.nama_lengkap} harus 0–100.`);
      }
    }
    const nBody: Record<string, any> = {};
    const cBody: Record<string, any> = {};
    peserta.forEach((p) => {
      const v = (nilai[p.id] || '').replace(',', '.').trim();
      nBody[p.id] = v === '' ? null : Number(v);
      cBody[p.id] = (catatan[p.id] || '').trim() || null;
    });
    setSimpan(true);
    try {
      const r = await permintaan<{ message: string }>(`/verum/tugas/${data.id}/nilai`, { body: { nilai: nBody, catatan_dosen: cBody } });
      Alert.alert('Tersimpan', r?.message || 'Nilai disimpan.');
      muatUlang();
    } catch (e) {
      Alert.alert('Gagal', pesan(e));
    } finally {
      setSimpan(false);
    }
  };

  const lihat = async (p: any) => {
    setMembuka(p.id);
    try {
      await unduhDanBuka(`/berkas/jawaban-tugas/${p.berkas_id}`, `jawaban-${p.nim}.pdf`);
    } catch (e) {
      Alert.alert('Gagal membuka', pesan(e));
    } finally {
      setMembuka(null);
    }
  };

  const hapus = () => Alert.alert('Hapus tugas ini?', 'Seluruh jawaban & nilai pada tugas ini ikut terhapus.', [
    { text: 'Batal', style: 'cancel' },
    {
      text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await permintaan(`/verum/tugas/${data.id}`, { method: 'DELETE' });
          onHapus();
        } catch (e) {
          Alert.alert('Gagal', pesan(e));
        }
      },
    },
  ]);

  const kumpul = peserta.filter((p) => p.dikumpulkan).length;
  return (
    <>
      <Text style={s.judulBagian}>Peserta · {kumpul}/{peserta.length} mengumpulkan</Text>
      {peserta.length === 0 ? <Kartu><Kosong teks="Belum ada peserta resmi (KRS disetujui) di kelas ini." ikon="people-outline" /></Kartu> : null}
      {peserta.map((p) => (
        <View key={p.id} style={[s.kartu, { padding: jarak.m, borderTopColor: p.dikumpulkan ? warna.sukses : warna.garis }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: warna.teks }}>{p.nama_lengkap}</Text>
              <Text style={s.redupKecil}>{p.nim} · {p.dikumpulkan ? 'Dikumpulkan ' + tanggalJam(p.waktu) : 'Belum mengumpulkan'}</Text>
            </View>
            {p.berkas_id ? (
              <Pressable onPress={() => lihat(p)} hitSlop={8} style={{ padding: 6 }}>
                <Ionicons name={membuka === p.id ? 'hourglass-outline' : 'document-attach-outline'} size={22} color={warna.gelap} />
              </Pressable>
            ) : null}
            <TextInput value={nilai[p.id] ?? ''} onChangeText={(v) => setNilai((x) => ({ ...x, [p.id]: v }))} keyboardType="decimal-pad" maxLength={6}
              placeholder="0–100" placeholderTextColor={warna.redup} style={[s.isian, { width: 72, textAlign: 'center', marginLeft: jarak.s, paddingVertical: 6 }]} />
          </View>
          <TextInput value={catatan[p.id] ?? ''} onChangeText={(v) => setCatatan((x) => ({ ...x, [p.id]: v }))} maxLength={500}
            placeholder="Umpan balik (opsional)" placeholderTextColor={warna.redup} style={[s.isian, { marginTop: jarak.s, paddingVertical: 6, fontSize: 13 }]} />
        </View>
      ))}
      {peserta.length > 0 ? <Tombol teks="Simpan nilai & umpan balik" ikon="save-outline" onPress={kirim} memuat={simpan} gaya={{ marginBottom: jarak.m }} /> : null}
      <Text style={[s.redupKecil, { marginBottom: jarak.m }]}>Nilai boleh diisi walau tugas dikumpulkan luring. Nilai tugas ikut sinkron ke buku nilai lewat menu Nilai di SIAKAD web.</Text>
      <Tombol teks="Hapus tugas" jenis="bahaya" ikon="trash-outline" onPress={hapus} />
    </>
  );
}
