import React, { useLayoutEffect, useState } from 'react';
import { Alert, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../api/useData';
import { ApiError, permintaan } from '../api/client';
import { JENIS_DOKUMEN, pilihDokumen, unduhDanBuka, BerkasDipilih } from '../api/berkas';
import { bukaWeb } from '../navigation/web';
import { Galat, Isian, Kartu, Kosong, Layar, Lencana, Muat, s, Tombol } from '../components/ui';
import Lembar, { Pilihan } from '../components/Lembar';
import { keServer, keTanggal, sisaWaktu, tanggalJam } from '../utils/format';
import { jarak, sudut, warna } from '../theme';

type Bagian = 'materi' | 'tugas' | 'presensi' | 'forum';
const BAGIAN: { kunci: Bagian; label: string; ikon: any }[] = [
  { kunci: 'materi', label: 'Materi', ikon: 'document-text-outline' },
  { kunci: 'tugas', label: 'Tugas', ikon: 'clipboard-outline' },
  { kunci: 'presensi', label: 'Presensi', ikon: 'checkbox-outline' },
  { kunci: 'forum', label: 'Forum', ikon: 'chatbubbles-outline' },
];

const METODE = ['Tatap Muka / Ceramah & Diskusi', 'Daring (Vicon)', 'Diskusi Kelompok', 'Presentasi Mahasiswa', 'Praktik / Studi Kasus'];
const DURASI = [15, 30, 60, 90, 120];

function pesanGalat(e: any) {
  return e instanceof ApiError ? e.message : 'Terjadi kesalahan. Coba lagi.';
}

export default function VerumKelasScreen() {
  const nav = useNavigation<any>();
  const { params }: any = useRoute();
  const id = params.id;
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<any>(`/verum/kelas/${id}`);
  const [bagian, setBagian] = useState<Bagian>('materi');
  const [lembar, setLembar] = useState<null | 'materi' | 'tugas' | 'presensi'>(null);
  const [proses, setProses] = useState<string | null>(null);
  const dosen = data?.peran === 'dosen';

  useLayoutEffect(() => {
    if (!dosen) return;
    nav.setOptions({
      headerRight: () => (
        <Pressable hitSlop={12} onPress={() => Alert.alert('Kelola kelas', data?.kelas?.nama_kelas, [
          { text: 'Cetak rekap presensi', onPress: () => bukaWeb(nav, `/verum/kelas/${id}/presensi/cetak`, 'Rekap Presensi') },
          { text: 'Cetak BAP perkuliahan', onPress: () => bukaWeb(nav, `/verum/kelas/${id}/presensi/cetak-bap`, 'BAP Perkuliahan') },
          { text: 'Hapus kelas', style: 'destructive', onPress: hapusKelas },
          { text: 'Tutup', style: 'cancel' },
        ])}>
          <Ionicons name="ellipsis-vertical" size={20} color={warna.putih} />
        </Pressable>
      ),
    });
  }, [nav, dosen, data?.kelas?.nama_kelas]);

  const jalankan = async (kunci: string, fn: () => Promise<any>, sukses?: string) => {
    setProses(kunci);
    try {
      const r = await fn();
      if (sukses || r?.message) Alert.alert('Berhasil', r?.message || sukses);
      muatUlang();
      return true;
    } catch (e: any) {
      Alert.alert('Gagal', pesanGalat(e));
      return false;
    } finally {
      setProses(null);
    }
  };

  const hapusKelas = () => Alert.alert('Hapus kelas ini?', 'Seluruh materi, tugas, presensi, dan forum di kelas ini ikut terhapus.', [
    { text: 'Batal', style: 'cancel' },
    {
      text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await permintaan(`/verum/kelas/${id}`, { method: 'DELETE' });
          nav.goBack();
        } catch (e) {
          Alert.alert('Gagal', pesanGalat(e));
        }
      },
    },
  ]);

  if (memuat && !data) return <Muat />;
  if (galat && !data) return <Layar><Galat pesan={galat.message} onUlang={muatUlang} /></Layar>;
  if (!data) return null;

  const k = data.kelas || {};
  const vicon = data.vicon || {};

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan} luring={luring}>
      <Kartu gelap>
        <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '800' }}>{k.mata_kuliah?.kode_mk} · {k.mata_kuliah?.sks} SKS · {k.rombel ? 'ROMBEL ' + k.rombel : 'SEMUA ROMBEL'}</Text>
        <Text style={{ color: warna.putih, fontSize: 18, fontWeight: '900', marginTop: 2 }}>{k.nama_kelas}</Text>
        <Text style={{ color: '#cbd5e1', fontSize: 12 }}>{k.mata_kuliah?.nama_mk}{k.dosen ? ' · ' + k.dosen : ''} · {data.peserta} peserta</Text>
        {k.deskripsi ? <Text style={{ color: '#e2e8f0', fontSize: 13, marginTop: jarak.s }}>{k.deskripsi}</Text> : null}
        <View style={{ flexDirection: 'row', marginTop: jarak.m }}>
          {vicon.aktif ? (
            <Tombol teks="Gabung vicon" jenis="sukses" ikon="videocam" onPress={() => Linking.openURL(vicon.url)} gaya={{ flex: 1, marginRight: dosen ? jarak.s : 0 }} />
          ) : null}
          {dosen ? (
            <Tombol teks={vicon.aktif ? 'Akhiri vicon' : 'Mulai vicon'} jenis={vicon.aktif ? 'bahaya' : 'garis'} ikon={vicon.aktif ? 'stop-circle-outline' : 'videocam-outline'}
              memuat={proses === 'vicon'} gaya={{ flex: 1, backgroundColor: vicon.aktif ? warna.bahaya : warna.putih }}
              onPress={() => jalankan('vicon', () => permintaan(`/verum/kelas/${id}/vicon`, { method: 'PATCH', body: { aktif: !vicon.aktif } }))} />
          ) : !vicon.aktif ? <Text style={{ color: '#94a3b8', fontSize: 12 }}>Vicon belum dimulai dosen.</Text> : null}
        </View>
      </Kartu>

      <View style={{ flexDirection: 'row', marginBottom: jarak.m, backgroundColor: warna.kartu, borderRadius: sudut, borderWidth: 1, borderColor: warna.garis }}>
        {BAGIAN.map((b) => {
          const aktif = b.kunci === bagian;
          return (
            <Pressable key={b.kunci} onPress={() => setBagian(b.kunci)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: aktif ? warna.gelap : 'transparent', borderRadius: sudut }}>
              <Ionicons name={b.ikon} size={18} color={aktif ? warna.putih : warna.gelap} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: aktif ? warna.putih : warna.gelap, marginTop: 2 }}>{b.label.toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </View>

      {bagian === 'materi' ? <BagianMateri data={data} dosen={dosen} onTambah={() => setLembar('materi')} jalankan={jalankan} /> : null}
      {bagian === 'tugas' ? <BagianTugas data={data} dosen={dosen} onTambah={() => setLembar('tugas')} nav={nav} /> : null}
      {bagian === 'presensi' ? <BagianPresensi data={data} dosen={dosen} onTambah={() => setLembar('presensi')} nav={nav} jalankan={jalankan} proses={proses} /> : null}
      {bagian === 'forum' ? <BagianForum id={id} data={data} jalankan={jalankan} proses={proses} /> : null}

      <FormMateri terlihat={lembar === 'materi'} id={id} onTutup={() => setLembar(null)} onSelesai={() => { setLembar(null); muatUlang(); }} />
      <FormTugas terlihat={lembar === 'tugas'} id={id} onTutup={() => setLembar(null)} onSelesai={() => { setLembar(null); muatUlang(); }} />
      <FormPresensi terlihat={lembar === 'presensi'} id={id} pertemuan={data.pertemuan_berikut || 1} onTutup={() => setLembar(null)} onSelesai={() => { setLembar(null); muatUlang(); }} />
    </Layar>
  );
}

// ------------------------------------------------------------------ materi

function BagianMateri({ data, dosen, onTambah, jalankan }: any) {
  const [membuka, setMembuka] = useState<number | null>(null);
  const materi: any[] = data.materi || [];
  const buka = async (m: any) => {
    if (m.file_url) {
      setMembuka(m.id);
      try {
        await unduhDanBuka(m.file_url, m.nama_file || `${m.judul}.pdf`);
      } catch (e) {
        Alert.alert('Gagal membuka materi', pesanGalat(e));
      } finally {
        setMembuka(null);
      }
    } else if (m.link_url) {
      Linking.openURL(m.link_url).catch(() => Alert.alert('Tautan tidak dapat dibuka', m.link_url));
    }
  };
  const hapus = (m: any) => Alert.alert('Hapus materi?', m.judul, [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus', style: 'destructive', onPress: () => jalankan('hapus-materi', () => permintaan(`/verum/materi/${m.id}`, { method: 'DELETE' })) },
  ]);

  return (
    <>
      {dosen ? <Tombol teks="Tambah materi" ikon="add" jenis="garis" onPress={onTambah} gaya={{ marginBottom: jarak.m }} /> : null}
      {materi.length === 0 ? <Kartu><Kosong teks="Belum ada materi." ikon="document-text-outline" /></Kartu> : null}
      {materi.map((m) => (
        <View key={m.id} style={[s.kartu, { padding: jarak.m }]}>
          <Pressable onPress={() => buka(m)} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={m.file_url ? 'document-attach-outline' : 'link-outline'} size={24} color={warna.gelap} />
            <View style={{ flex: 1, marginLeft: jarak.s }}>
              <Text style={{ fontWeight: '700', color: warna.teks }}>{m.judul}</Text>
              {m.deskripsi ? <Text style={s.redupKecil}>{m.deskripsi}</Text> : null}
              <Text style={s.redupKecil}>{m.file_url ? (m.nama_file || 'Berkas') : m.link_url} · {tanggalJam(m.dibuat)}</Text>
            </View>
            <Ionicons name={membuka === m.id ? 'hourglass-outline' : m.file_url ? 'download-outline' : 'open-outline'} size={20} color={warna.redup} />
          </Pressable>
          {dosen ? (
            <Pressable onPress={() => hapus(m)} style={{ alignSelf: 'flex-end', marginTop: 6 }} hitSlop={8}>
              <Text style={{ color: warna.bahaya, fontSize: 12, fontWeight: '700' }}>HAPUS</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </>
  );
}

function FormMateri({ terlihat, id, onTutup, onSelesai }: any) {
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [sumber, setSumber] = useState<'file' | 'link'>('file');
  const [berkas, setBerkas] = useState<BerkasDipilih | null>(null);
  const [link, setLink] = useState('');
  const [kirim, setKirim] = useState(false);

  const pilih = async () => {
    try {
      const b = await pilihDokumen(JENIS_DOKUMEN.materi, 10);
      if (b) setBerkas(b);
    } catch (e) {
      Alert.alert('Berkas ditolak', pesanGalat(e));
    }
  };

  const simpan = async () => {
    if (!judul.trim()) return Alert.alert('Judul wajib', 'Isi judul materi.');
    if (sumber === 'file' && !berkas) return Alert.alert('Pilih berkas', 'Pilih berkas materi (PDF, Office, atau ZIP, maks. 10 MB).');
    if (sumber === 'link' && !/^https?:\/\//i.test(link.trim())) return Alert.alert('Tautan tidak valid', 'Tautan harus diawali http:// atau https://');
    const form = new FormData();
    form.append('judul', judul.trim());
    if (deskripsi.trim()) form.append('deskripsi', deskripsi.trim());
    if (sumber === 'file' && berkas) form.append('file_materi', { uri: berkas.uri, name: berkas.name, type: berkas.mimeType } as any);
    if (sumber === 'link') form.append('link_url', link.trim());
    setKirim(true);
    try {
      await permintaan(`/verum/kelas/${id}/materi`, { form, timeout: 120000 });
      setJudul(''); setDeskripsi(''); setBerkas(null); setLink('');
      Alert.alert('Berhasil', 'Materi ditambahkan.');
      onSelesai();
    } catch (e) {
      Alert.alert('Gagal', pesanGalat(e));
    } finally {
      setKirim(false);
    }
  };

  return (
    <Lembar terlihat={terlihat} judul="Tambah materi" onTutup={onTutup}>
      <Isian label="Judul" value={judul} onChangeText={setJudul} placeholder="Contoh: Pengantar Dogmatika — Bab 1" />
      <Isian label="Deskripsi (opsional)" value={deskripsi} onChangeText={setDeskripsi} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
      <Text style={s.label}>SUMBER MATERI</Text>
      <Pilihan opsi={[{ nilai: 'file', label: 'Unggah berkas' }, { nilai: 'link', label: 'Tautan' }]} nilai={sumber} onPilih={setSumber} />
      {sumber === 'file' ? (
        <Tombol teks={berkas ? berkas.name : 'Pilih berkas (maks. 10 MB)'} ikon="attach-outline" jenis="garis" onPress={pilih} gaya={{ marginBottom: jarak.m }} />
      ) : (
        <Isian label="Tautan" value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" placeholder="https://…" />
      )}
      <Tombol teks="Simpan materi" ikon="save-outline" onPress={simpan} memuat={kirim} />
    </Lembar>
  );
}

// ------------------------------------------------------------------ tugas

function BagianTugas({ data, dosen, onTambah, nav }: any) {
  const tugas: any[] = data.tugas || [];
  return (
    <>
      {dosen ? <Tombol teks="Buat tugas" ikon="add" jenis="garis" onPress={onTambah} gaya={{ marginBottom: jarak.m }} /> : null}
      {tugas.length === 0 ? <Kartu><Kosong teks="Belum ada tugas." ikon="clipboard-outline" /></Kartu> : null}
      {tugas.map((t) => {
        const saya = t.saya || {};
        const status = dosen
          ? <Lencana teks={`${t.rekap?.dikumpulkan ?? 0}/${t.rekap?.peserta ?? 0} kumpul · ${t.rekap?.dinilai ?? 0} dinilai`} jenis="info" />
          : saya.nilai !== null && saya.nilai !== undefined ? <Lencana teks={`Nilai ${saya.nilai}`} jenis="sukses" />
          : saya.dikumpulkan ? <Lencana teks="Sudah dikumpulkan" jenis="sukses" />
          : t.lewat ? <Lencana teks="Tidak mengumpulkan" jenis="bahaya" />
          : <Lencana teks="Belum dikumpulkan" jenis="peringatan" />;
        return (
          <Pressable key={t.id} onPress={() => nav.navigate('VerumTugas', { id: t.id, nama: t.judul })} style={({ pressed }) => [s.kartu, { padding: jarak.m, opacity: pressed ? 0.85 : 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: warna.teks }}>{t.judul}</Text>
                <Text style={[s.redupKecil, t.lewat ? null : { color: warna.peringatan }]}>Tenggat {tanggalJam(t.tenggat)} · {sisaWaktu(t.tenggat)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={warna.redup} />
            </View>
            <View style={{ marginTop: jarak.s }}>{status}</View>
          </Pressable>
        );
      })}
    </>
  );
}

function FormTugas({ terlihat, id, onTutup, onSelesai }: any) {
  const besok = new Date(Date.now() + 7 * 86400000);
  const [judul, setJudul] = useState('');
  const [instruksi, setInstruksi] = useState('');
  const [tgl, setTgl] = useState(keServer(besok).slice(0, 10));
  const [jamTenggat, setJamTenggat] = useState('23:59');
  const [kirim, setKirim] = useState(false);

  const setHari = (n: number) => setTgl(keServer(new Date(Date.now() + n * 86400000)).slice(0, 10));

  const simpan = async () => {
    if (!judul.trim() || !instruksi.trim()) return Alert.alert('Belum lengkap', 'Isi judul dan instruksi tugas.');
    const d = keTanggal(`${tgl} ${jamTenggat}:00`);
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(tgl) || !/^\d{2}:\d{2}$/.test(jamTenggat)) return Alert.alert('Tenggat tidak valid', 'Gunakan format tanggal TTTT-BB-HH dan jam JJ:MM.');
    if (d.getTime() <= Date.now()) return Alert.alert('Tenggat sudah lewat', 'Pilih tenggat di masa depan.');
    setKirim(true);
    try {
      await permintaan(`/verum/kelas/${id}/tugas`, { body: { judul: judul.trim(), instruksi: instruksi.trim(), tenggat_waktu: keServer(d) } });
      setJudul(''); setInstruksi('');
      Alert.alert('Berhasil', 'Tugas dibuat.');
      onSelesai();
    } catch (e) {
      Alert.alert('Gagal', pesanGalat(e));
    } finally {
      setKirim(false);
    }
  };

  return (
    <Lembar terlihat={terlihat} judul="Buat tugas" onTutup={onTutup}>
      <Isian label="Judul" value={judul} onChangeText={setJudul} placeholder="Contoh: Esai Doktrin Allah" />
      <Isian label="Instruksi" value={instruksi} onChangeText={setInstruksi} multiline style={{ minHeight: 100, textAlignVertical: 'top' }} />
      <Text style={s.label}>TENGGAT</Text>
      <Pilihan opsi={[{ nilai: 1, label: '+1 hari' }, { nilai: 3, label: '+3 hari' }, { nilai: 7, label: '+7 hari' }, { nilai: 14, label: '+14 hari' }]} nilai={null} onPilih={setHari} />
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 3, marginRight: jarak.s }}><Isian label="Tanggal (TTTT-BB-HH)" value={tgl} onChangeText={setTgl} keyboardType="numbers-and-punctuation" /></View>
        <View style={{ flex: 2 }}><Isian label="Jam (JJ:MM)" value={jamTenggat} onChangeText={setJamTenggat} keyboardType="numbers-and-punctuation" /></View>
      </View>
      <Text style={[s.redupKecil, { marginBottom: jarak.m }]}>Mahasiswa mengunggah PDF/DOC/DOCX/ZIP maks. 10 MB sebelum tenggat.</Text>
      <Tombol teks="Simpan tugas" ikon="save-outline" onPress={simpan} memuat={kirim} />
    </Lembar>
  );
}

// ------------------------------------------------------------------ presensi

function BagianPresensi({ data, dosen, onTambah, nav, jalankan, proses }: any) {
  const presensi: any[] = data.presensi || [];
  const hadir = (p: any) => jalankan('hadir-' + p.id, () => permintaan(`/verum/presensi/${p.id}/hadir`, { method: 'POST' }));
  return (
    <>
      {dosen ? <Tombol teks="Buka presensi & jurnal BAP" ikon="add" jenis="garis" onPress={onTambah} gaya={{ marginBottom: jarak.m }} /> : null}
      {presensi.length === 0 ? <Kartu><Kosong teks="Belum ada sesi presensi." ikon="checkbox-outline" /></Kartu> : null}
      {presensi.map((p) => (
        <Pressable key={p.id} disabled={!dosen} onPress={() => nav.navigate('VerumPresensi', { id: p.id, nama: `Pertemuan ${p.pertemuan_ke}` })}
          style={[s.kartu, { padding: jarak.m, borderTopColor: p.terbuka ? warna.sukses : warna.garis }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: warna.gelap, alignItems: 'center', justifyContent: 'center', marginRight: jarak.s }}>
              <Text style={{ color: warna.putih, fontWeight: '900' }}>{p.pertemuan_ke}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: warna.teks }}>{p.judul_pertemuan}</Text>
              <Text style={s.redupKecil}>{tanggalJam(p.waktu_buka)} – {tanggalJam(p.waktu_tutup).split(', ')[1] || ''}</Text>
              {p.materi_aktual ? <Text style={s.redupKecil} numberOfLines={2}>{p.materi_aktual}</Text> : null}
            </View>
            {dosen ? <Ionicons name="chevron-forward" size={18} color={warna.redup} /> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: jarak.s, flexWrap: 'wrap' }}>
            {p.terbuka ? <View style={{ marginRight: 6 }}><Lencana teks="Dibuka" jenis="sukses" /></View> : <View style={{ marginRight: 6 }}><Lencana teks="Ditutup" jenis="redup" /></View>}
            {dosen ? <Lencana teks={`${p.jumlah_hadir} hadir`} jenis="info" />
              : p.hadir ? <Lencana teks="Hadir" jenis="sukses" />
              : !p.terbuka ? <Lencana teks="Tidak hadir" jenis="bahaya" /> : null}
          </View>
          {!dosen && p.terbuka && !p.hadir ? (
            <Tombol teks="Saya hadir" ikon="hand-right-outline" jenis="sukses" onPress={() => hadir(p)} memuat={proses === 'hadir-' + p.id} gaya={{ marginTop: jarak.m }} />
          ) : null}
        </Pressable>
      ))}
    </>
  );
}

function FormPresensi({ terlihat, id, pertemuan, onTutup, onSelesai }: any) {
  const [ke, setKe] = useState(String(pertemuan));
  const [judul, setJudul] = useState('');
  const [materi, setMateri] = useState('');
  const [metode, setMetode] = useState(METODE[0]);
  const [durasi, setDurasi] = useState(30);
  const [kirim, setKirim] = useState(false);

  React.useEffect(() => { if (terlihat) setKe(String(pertemuan)); }, [terlihat, pertemuan]);

  const simpan = async () => {
    const n = parseInt(ke, 10);
    if (!n || n < 1 || n > 32) return Alert.alert('Pertemuan tidak valid', 'Isi nomor pertemuan 1–32.');
    if (!judul.trim()) return Alert.alert('Judul wajib', 'Isi judul/topik pertemuan.');
    setKirim(true);
    try {
      await permintaan(`/verum/kelas/${id}/presensi`, { body: { pertemuan_ke: n, judul_pertemuan: judul.trim(), materi_aktual: materi.trim() || null, metode_pembelajaran: metode, durasi } });
      setJudul(''); setMateri('');
      Alert.alert('Presensi dibuka', `Mahasiswa dapat menandai hadir selama ${durasi} menit.`);
      onSelesai();
    } catch (e) {
      Alert.alert('Gagal', pesanGalat(e));
    } finally {
      setKirim(false);
    }
  };

  return (
    <Lembar terlihat={terlihat} judul="Buka presensi & jurnal BAP" onTutup={onTutup}>
      <Isian label="Pertemuan ke" value={ke} onChangeText={setKe} keyboardType="number-pad" />
      <Isian label="Judul / topik pertemuan" value={judul} onChangeText={setJudul} />
      <Isian label="Materi yang disampaikan (jurnal BAP)" value={materi} onChangeText={setMateri} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
      <Text style={s.label}>METODE PEMBELAJARAN</Text>
      <Pilihan opsi={METODE.map((m) => ({ nilai: m, label: m }))} nilai={metode} onPilih={setMetode} />
      <Text style={s.label}>PRESENSI DIBUKA SELAMA</Text>
      <Pilihan opsi={DURASI.map((d) => ({ nilai: d, label: `${d} menit` }))} nilai={durasi} onPilih={setDurasi} />
      <Tombol teks="Buka presensi" ikon="checkmark-circle-outline" onPress={simpan} memuat={kirim} />
    </Lembar>
  );
}

// ------------------------------------------------------------------ forum

function BagianForum({ id, data, jalankan, proses }: any) {
  const [teks, setTeks] = useState('');
  const postingan: any[] = data.postingan || [];
  const kirim = async () => {
    if (!teks.trim()) return;
    const ok = await jalankan('kirim', () => permintaan(`/verum/kelas/${id}/forum`, { body: { konten: teks.trim() } }).then(() => null));
    if (ok) setTeks('');
  };
  const hapus = (p: any) => Alert.alert('Hapus postingan?', p.konten.slice(0, 80), [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus', style: 'destructive', onPress: () => jalankan('hapus-' + p.id, () => permintaan(`/verum/forum/${p.id}`, { method: 'DELETE' }).then(() => null)) },
  ]);
  return (
    <>
      <View style={[s.kartu, { padding: jarak.m }]}>
        <TextInput value={teks} onChangeText={setTeks} multiline maxLength={2000} placeholder="Tulis pertanyaan atau pengumuman untuk kelas…"
          placeholderTextColor={warna.redup} style={[s.isian, { minHeight: 70, textAlignVertical: 'top' }]} />
        <Tombol teks="Kirim" ikon="send-outline" onPress={kirim} memuat={proses === 'kirim'} nonaktif={!teks.trim()} gaya={{ marginTop: jarak.s }} />
      </View>
      {postingan.length === 0 ? <Kartu><Kosong teks="Belum ada diskusi." ikon="chatbubbles-outline" /></Kartu> : null}
      {postingan.map((p) => (
        <View key={p.id} style={[s.kartu, { padding: jarak.m, borderTopColor: p.dosen ? warna.info : warna.garis }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontWeight: '800', color: warna.gelap, flex: 1 }}>{p.penulis}{p.dosen ? '  · Dosen' : ''}</Text>
            {p.bisa_hapus ? <Pressable onPress={() => hapus(p)} hitSlop={10}><Ionicons name="trash-outline" size={16} color={warna.redup} /></Pressable> : null}
          </View>
          <Text style={s.teks}>{p.konten}</Text>
          <Text style={s.redupKecil}>{tanggalJam(p.waktu)}</Text>
        </View>
      ))}
    </>
  );
}
