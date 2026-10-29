import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../api/useData';
import { ApiError, permintaan } from '../api/client';
import { Angka, Galat, Kartu, Lencana, Muat, PitaLuring, s, Tombol, jenisStatus } from '../components/ui';
import { angka, jam, URUTAN_HARI } from '../utils/format';
import { skor, uraiKueri } from '../utils/cariPintar';
import { jarak, sudut, warna } from '../theme';

type Jadwal = { id: number; nama_kelas?: string; hari: string; jam_mulai: string; jam_selesai: string; ruang?: string; kuota?: number };
type MK = {
  id: number; kode_mk: string; nama_mk: string; sks: number; semester: number; jadwals?: Jadwal[];
  prasyarats?: { id: number; nama_mk: string }[]; dosen?: { nama_lengkap?: string } | null;
};
type Saring = { semester: number | null; hari: string | null; dipilih: boolean; adaKursi: boolean; prasyaratOk: boolean; sembunyikanLulus: boolean };
const SARING_AWAL: Saring = { semester: null, hari: null, dipilih: false, adaKursi: false, prasyaratOk: false, sembunyikanLulus: false };

const kelasDari = (j: Jadwal) => String(j.nama_kelas || 'A').toUpperCase();
const menit = (t?: string) => { const [h, m] = String(t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const tumpang = (a: Jadwal, b: Jadwal) => String(a.hari).toLowerCase() === String(b.hari).toLowerCase()
  && menit(a.jam_mulai) < menit(b.jam_selesai) && menit(b.jam_mulai) < menit(a.jam_selesai);
const slotKelas = (mk: MK, k?: string) => (mk.jadwals || []).filter((j) => kelasDari(j) === k);

export default function KrsIsiScreen() {
  const nav = useNavigation<any>();
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<any>('/krs/form');
  const [pilihan, setPilihan] = useState<Record<number, string>>({});
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesanAturan, setPesanAturan] = useState<string | null>(null);
  const [cari, setCari] = useState('');
  const [saring, setSaring] = useState<Saring>(SARING_AWAL);
  const [panelSaring, setPanelSaring] = useState(false);

  useEffect(() => {
    if (!data) return;
    const awal: Record<number, string> = {};
    (data.mk_diambil_ids || []).forEach((id: number) => {
      awal[id] = (data.kelas_diambil && data.kelas_diambil[id]) || 'A';
    });
    setPilihan(awal);
  }, [data]);

  const daftar: MK[] = Array.isArray(data?.mata_kuliahs) ? data.mata_kuliahs : [];
  const terkunci = data?.status_krs === 'Disetujui' && (data?.mk_diambil_ids || []).length > 0;
  const maxSks = Number(data?.max_sks || 0);
  const totalSks = useMemo(
    () => daftar.filter((mk) => pilihan[mk.id]).reduce((n, mk) => n + Number(mk.sks || 0), 0),
    [daftar, pilihan],
  );
  const lulus = useMemo(() => new Set<number>((data?.mk_lulus_ids || []).map(Number)), [data]);
  const terisiDari = (mk: MK) => (data?.terisi?.[mk.id] || {}) as Record<string, number>;
  const adaKursi = (mk: MK) => {
    const kelas = Array.from(new Set((mk.jadwals || []).map(kelasDari)));
    if (!kelas.length) return true;
    return kelas.some((k) => (terisiDari(mk)[k] || 0) < Number(slotKelas(mk, k)[0]?.kuota || 40));
  };
  const prasyaratOk = (mk: MK) => (mk.prasyarats || []).every((p) => lulus.has(Number(p.id)));

  /** Mata kuliah terpilih lain yang jadwalnya bertabrakan dengan kelas k dari mk. */
  const bentrokDengan = (mk: MK, k?: string) => {
    const slot = slotKelas(mk, k);
    if (!slot.length) return [] as string[];
    return daftar.filter((lain) => lain.id !== mk.id && pilihan[lain.id])
      .filter((lain) => slotKelas(lain, pilihan[lain.id]).some((x) => slot.some((y) => tumpang(x, y))))
      .map((lain) => lain.nama_mk);
  };

  const kueri = useMemo(() => uraiKueri(cari), [cari]);
  const jumlahSaring = (saring.semester !== null ? 1 : 0) + (saring.hari ? 1 : 0) + [saring.dipilih, saring.adaKursi, saring.prasyaratOk, saring.sembunyikanLulus].filter(Boolean).length;

  // Saring + skor pencarian. Yang sudah dipilih tidak pernah disembunyikan oleh filter "lulus"/"kursi".
  const hasil = useMemo(() => {
    const semesterKueri = kueri.semester ?? saring.semester;
    return daftar.map((mk) => {
      const dipilih = !!pilihan[mk.id];
      if (terkunci && !dipilih) return null;
      if (semesterKueri !== null && semesterKueri !== undefined && Number(mk.semester) !== semesterKueri) return null;
      if (kueri.sks !== undefined && Number(mk.sks) !== kueri.sks) return null;
      if (saring.dipilih && !dipilih) return null;
      if (saring.hari && !(mk.jadwals || []).some((j) => String(j.hari).toLowerCase() === saring.hari!.toLowerCase())) return null;
      if (!dipilih && saring.adaKursi && !adaKursi(mk)) return null;
      if (!dipilih && saring.prasyaratOk && !prasyaratOk(mk)) return null;
      if (!dipilih && saring.sembunyikanLulus && lulus.has(mk.id)) return null;
      const nilai = kueri.token.length ? skor(kueri, {
        kode: mk.kode_mk, nama: mk.nama_mk,
        tambahan: [mk.dosen?.nama_lengkap || '', ...(mk.jadwals || []).flatMap((j) => [j.hari, j.ruang || '', 'kelas ' + kelasDari(j)])],
        angka: [Number(mk.semester), Number(mk.sks)],
      }) : 1;
      return nilai ? { mk, nilai } : null;
    }).filter(Boolean) as { mk: MK; nilai: number }[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daftar, kueri, saring, pilihan, terkunci, lulus, data]);

  const mencari = kueri.token.length > 0;
  const perSemester = useMemo(() => {
    const grup: Record<string, MK[]> = {};
    hasil.forEach(({ mk }) => { (grup[mk.semester] = grup[mk.semester] || []).push(mk); });
    return Object.keys(grup).sort((a, b) => Number(a) - Number(b)).map((k) => ({ semester: k, item: grup[k] }));
  }, [hasil]);
  const urutSkor = useMemo(() => [...hasil].sort((a, b) => b.nilai - a.nilai || a.mk.semester - b.mk.semester).map((h) => h.mk), [hasil]);
  const daftarSemester = useMemo(() => Array.from(new Set(daftar.map((mk) => Number(mk.semester)))).sort((a, b) => a - b), [daftar]);
  const daftarHari = useMemo(() => URUTAN_HARI.filter((h) => daftar.some((mk) => (mk.jadwals || []).some((j) => String(j.hari).toLowerCase() === h.toLowerCase()))), [daftar]);
  const jumlahDipilih = Object.keys(pilihan).length;
  const resetSemua = () => { setCari(''); setSaring(SARING_AWAL); };

  if (memuat && !data) return <Muat />;

  if (galat && !data) {
    const soalBayar = /tagihan|pembayaran|keuangan|dispensasi/i.test(galat.message);
    return (
      <ScrollView style={s.layar} contentContainerStyle={{ padding: jarak.l }}
        refreshControl={<RefreshControl refreshing={menyegarkan} onRefresh={segarkan} />}>
        <Galat pesan={galat.message} onUlang={muatUlang} ikon={soalBayar ? 'wallet-outline' : 'lock-closed-outline'} />
        {soalBayar ? <Tombol teks="Lihat tagihan" ikon="wallet-outline" onPress={() => nav.navigate('Tagihan')} /> : null}
      </ScrollView>
    );
  }

  const alihkan = (mk: MK) => {
    if (terkunci) return;
    setPesanAturan(null);
    setPilihan((p) => {
      const baru = { ...p };
      if (baru[mk.id]) delete baru[mk.id];
      else baru[mk.id] = mk.jadwals && mk.jadwals.length ? kelasDari(mk.jadwals[0]) : 'A';
      return baru;
    });
  };

  const simpan = async () => {
    setPesanAturan(null);
    if (totalSks > maxSks) {
      setPesanAturan(`Total ${totalSks} SKS melebihi batas ${maxSks} SKS Anda.`);
      return;
    }
    const ids = Object.keys(pilihan).map(Number);
    setMenyimpan(true);
    try {
      if (ids.length === 0) {
        setPesanAturan('Pilih minimal satu mata kuliah.');
        return;
      }
      await permintaan('/krs/submit', { body: { mata_kuliahs: ids, nama_kelas: pilihan } });
      Alert.alert('KRS diajukan', 'KRS Anda tersimpan dan menunggu persetujuan Dosen Wali / Kaprodi.');
      nav.goBack();
    } catch (e: any) {
      setPesanAturan(e instanceof ApiError ? e.message : 'Gagal menyimpan KRS.');
    } finally {
      setMenyimpan(false);
    }
  };

  const renderMk = (mk: MK) => (
    <ItemMk key={mk.id} mk={mk} terisi={terisiDari(mk)} kelas={pilihan[mk.id]} terkunci={terkunci}
      lulus={lulus.has(mk.id)} prasyaratLulus={lulus}
      bentrok={pilihan[mk.id] ? bentrokDengan(mk, pilihan[mk.id]) : []}
      kelasBentrok={(k) => bentrokDengan(mk, k).length > 0}
      onAlih={() => alihkan(mk)} onKelas={(k) => setPilihan((p) => ({ ...p, [mk.id]: k }))} />
  );
  const chip = (aktif: boolean, label: string, onPress: () => void, ikon?: any) => (
    <Pressable key={label} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, marginRight: 6, marginBottom: 6,
      borderRadius: sudut, borderWidth: 1, borderColor: aktif ? warna.gelap : warna.garis, backgroundColor: aktif ? warna.gelap : warna.putih }}>
      {ikon ? <Ionicons name={ikon} size={13} color={aktif ? warna.putih : warna.redup} style={{ marginRight: 3 }} /> : null}
      <Text style={{ fontSize: 12, fontWeight: '800', color: aktif ? warna.putih : warna.gelap }}>{label}</Text>
    </Pressable>
  );
  const ubahSaring = (b: Partial<Saring>) => setSaring((x) => ({ ...x, ...b }));

  return (
    <View style={{ flex: 1, backgroundColor: warna.latar }}>
      {daftar.length > 0 ? (
        <View style={{ backgroundColor: warna.kartu, borderBottomWidth: 1, borderBottomColor: warna.garis, paddingHorizontal: jarak.l, paddingTop: jarak.s }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[s.isian, { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }]}>
              <Ionicons name="search" size={16} color={warna.redup} />
              <TextInput value={cari} onChangeText={setCari} placeholder="Cari kode, nama MK, dosen, hari, “smt 3”…" placeholderTextColor={warna.redup}
                style={{ flex: 1, paddingVertical: 9, marginLeft: 6, color: warna.teks }} autoCorrect={false} returnKeyType="search" />
              {cari ? <Pressable onPress={() => setCari('')} hitSlop={10}><Ionicons name="close-circle" size={18} color={warna.redup} /></Pressable> : null}
            </View>
            <Pressable onPress={() => setPanelSaring((v) => !v)} style={{ marginLeft: jarak.s, padding: 9, borderRadius: sudut, borderWidth: 1,
              borderColor: jumlahSaring ? warna.gelap : warna.garis, backgroundColor: jumlahSaring ? warna.gelap : warna.putih, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="options-outline" size={18} color={jumlahSaring ? warna.putih : warna.gelap} />
              {jumlahSaring ? <Text style={{ color: warna.putih, fontWeight: '900', fontSize: 12, marginLeft: 3 }}>{jumlahSaring}</Text> : null}
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ marginTop: jarak.s }}>
            {chip(saring.semester === null, 'Semua smt', () => ubahSaring({ semester: null }))}
            {daftarSemester.map((n) => chip(saring.semester === n, 'Smt ' + n, () => ubahSaring({ semester: saring.semester === n ? null : n })))}
            {chip(saring.dipilih, `Dipilih (${jumlahDipilih})`, () => ubahSaring({ dipilih: !saring.dipilih }), 'checkbox-outline')}
          </ScrollView>
          {panelSaring ? (
            <View style={{ paddingBottom: jarak.xs }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {chip(saring.adaKursi, 'Masih ada kursi', () => ubahSaring({ adaKursi: !saring.adaKursi }), 'people-outline')}
                {chip(saring.prasyaratOk, 'Prasyarat terpenuhi', () => ubahSaring({ prasyaratOk: !saring.prasyaratOk }), 'git-merge-outline')}
                {lulus.size ? chip(saring.sembunyikanLulus, `Sembunyikan yg lulus (${daftar.filter((m) => lulus.has(m.id)).length})`, () => ubahSaring({ sembunyikanLulus: !saring.sembunyikanLulus }), 'eye-off-outline') : null}
              </View>
              {daftarHari.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {daftarHari.map((h) => chip(saring.hari === h, h, () => ubahSaring({ hari: saring.hari === h ? null : h }), 'today-outline'))}
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: jarak.s }}>
            <Text style={[s.redupKecil, { flex: 1 }]}>
              {hasil.length} dari {daftar.length} mata kuliah{kueri.semester !== undefined ? ` · semester ${kueri.semester}` : ''}{kueri.sks !== undefined ? ` · ${kueri.sks} SKS` : ''}
            </Text>
            {cari || jumlahSaring ? <Pressable onPress={resetSemua} hitSlop={8}><Text style={{ fontSize: 12, fontWeight: '800', color: warna.primer }}>RESET</Text></Pressable> : null}
          </View>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={{ padding: jarak.l, paddingBottom: 120 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={menyegarkan} onRefresh={segarkan} />}>
        {luring ? <PitaLuring /> : null}
        <Kartu gelap>
          <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '800' }}>{String(data?.semester || '').toUpperCase()}</Text>
          <View style={{ flexDirection: 'row', marginTop: jarak.s }}>
            <Angka terang label="SKS dipilih" nilai={`${totalSks}/${maxSks}`} />
            <Angka terang label="IPK" nilai={angka(data?.ipk)} />
            <Angka terang label="Semester ke" nilai={String(data?.semester_ke ?? '-')} />
          </View>
          <View style={{ marginTop: jarak.m }}><Lencana teks={data?.status_krs || 'Belum Mengajukan'} jenis={jenisStatus(data?.status_krs)} /></View>
        </Kartu>

        {data?.catatan ? (
          <Kartu judul="Catatan Dosen Wali / Kaprodi" ikon="chatbox-ellipses-outline" gaya={{ borderTopColor: warna.peringatan }}>
            <Text style={s.teks}>{data.catatan}</Text>
          </Kartu>
        ) : null}

        {terkunci ? (
          <Kartu gaya={{ borderTopColor: warna.sukses }}>
            <Text style={s.teks}>KRS Anda sudah DISETUJUI dan terkunci. Untuk mengubah, minta Dosen Wali / Kaprodi membuka kembali.</Text>
          </Kartu>
        ) : null}

        {daftar.length === 0 ? (
          <Kartu><Text style={s.redup}>Belum ada mata kuliah yang ditawarkan untuk Anda pada semester ini.</Text></Kartu>
        ) : null}

        {daftar.length > 0 && hasil.length === 0 ? (
          <Kartu>
            <Text style={s.redup}>Tidak ada mata kuliah yang cocok{cari ? ` dengan “${cari}”` : ''}.</Text>
            <Text style={[s.redupKecil, { marginTop: 4 }]}>Coba kata lain, kode MK, nama dosen, nama hari, atau singkatan (mis. “ppl”).</Text>
            <Tombol teks="Hapus pencarian & filter" jenis="garis" ikon="refresh" onPress={resetSemua} gaya={{ marginTop: jarak.m }} />
          </Kartu>
        ) : null}

        {mencari ? (
          <>
            {urutSkor.length ? <Text style={s.judulBagian}>Hasil pencarian · {urutSkor.length}</Text> : null}
            {urutSkor.map((mk) => renderMk(mk))}
          </>
        ) : perSemester.map((g) => (
          <View key={g.semester}>
            <Text style={s.judulBagian}>Semester {g.semester} · {g.item.length}</Text>
            {g.item.map((mk) => renderMk(mk))}
          </View>
        ))}
      </ScrollView>

      {!terkunci && daftar.length > 0 ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: warna.kartu, borderTopWidth: 1, borderTopColor: warna.garis, padding: jarak.m }}>
          {pesanAturan ? <Text style={{ color: warna.bahaya, marginBottom: jarak.s, fontSize: 13 }}>{pesanAturan}</Text> : null}
          <Tombol teks={`Simpan KRS · ${totalSks} SKS`} ikon="save-outline" onPress={simpan} memuat={menyimpan}
            jenis={totalSks > maxSks ? 'bahaya' : 'gelap'} />
        </View>
      ) : null}
    </View>
  );
}

function ItemMk({ mk, kelas, terisi, terkunci, lulus, prasyaratLulus, bentrok, kelasBentrok, onAlih, onKelas }: {
  mk: MK; kelas?: string; terisi: Record<string, number>; terkunci: boolean; lulus: boolean; prasyaratLulus: Set<number>;
  bentrok: string[]; kelasBentrok: (k: string) => boolean; onAlih: () => void; onKelas: (k: string) => void;
}) {
  const dipilih = !!kelas;
  const slot = (mk.jadwals || []).reduce<Record<string, Jadwal[]>>((acc, j) => {
    (acc[kelasDari(j)] = acc[kelasDari(j)] || []).push(j);
    return acc;
  }, {});
  const prasyarat = mk.prasyarats || [];
  const kurangPrasyarat = prasyarat.filter((p) => !prasyaratLulus.has(Number(p.id)));
  return (
    <View style={[s.kartu, { padding: jarak.m, borderTopColor: bentrok.length ? warna.bahaya : dipilih ? warna.sukses : warna.garis }]}>
      <Pressable onPress={onAlih} disabled={terkunci} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name={dipilih ? 'checkbox' : 'square-outline'} size={24} color={dipilih ? warna.sukses : warna.redup} />
        <View style={{ flex: 1, marginLeft: jarak.s }}>
          <Text style={{ fontWeight: '700', color: warna.teks }}>{mk.nama_mk}</Text>
          <Text style={s.redupKecil}>{mk.kode_mk} · {mk.sks} SKS · Semester {mk.semester}{mk.dosen?.nama_lengkap ? ' · ' + mk.dosen.nama_lengkap : ''}</Text>
          {lulus ? <Text style={[s.redupKecil, { color: warna.info }]}>Sudah pernah lulus — memilih lagi berarti mengulang/perbaikan nilai.</Text> : null}
          {prasyarat.length ? (
            <Text style={[s.redupKecil, { color: kurangPrasyarat.length ? warna.bahaya : warna.sukses }]}>
              {kurangPrasyarat.length ? 'Prasyarat belum lulus: ' + kurangPrasyarat.map((p) => p.nama_mk).join(', ') : 'Prasyarat terpenuhi: ' + prasyarat.map((p) => p.nama_mk).join(', ')}
            </Text>
          ) : null}
          {bentrok.length ? <Text style={[s.redupKecil, { color: warna.bahaya, fontWeight: '700' }]}>Jadwal bentrok dengan {bentrok.join(', ')}. Pilih kelas lain.</Text> : null}
        </View>
      </Pressable>
      {dipilih && Object.keys(slot).length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: jarak.s }}>
          {Object.keys(slot).sort().map((k) => {
            const aktif = kelas === k;
            const j = slot[k];
            const isi = terisi[k] || 0;
            const kuota = Number(j[0].kuota || 40);
            const penuh = isi >= kuota && !aktif;
            const tabrak = kelasBentrok(k);
            return (
              <Pressable key={k} disabled={terkunci} onPress={() => onKelas(k)}
                style={{ borderWidth: 1, borderColor: aktif ? (tabrak ? warna.bahaya : warna.gelap) : tabrak ? warna.bahaya : warna.garis,
                  backgroundColor: aktif ? (tabrak ? warna.bahaya : warna.gelap) : warna.putih, opacity: penuh ? 0.6 : 1,
                  borderRadius: sudut, paddingVertical: 6, paddingHorizontal: 8, marginRight: 6, marginBottom: 6 }}>
                <Text style={{ fontWeight: '800', fontSize: 12, color: aktif ? warna.putih : warna.gelap }}>KELAS {k}{tabrak ? ' · BENTROK' : ''}</Text>
                {j.map((x) => (
                  <Text key={x.id} style={{ fontSize: 11, color: aktif ? '#e2e8f0' : warna.redup }}>{x.hari} {jam(x.jam_mulai)}–{jam(x.jam_selesai)}{x.ruang ? ' · ' + x.ruang : ''}</Text>
                ))}
                <Text style={{ fontSize: 11, color: aktif ? '#e2e8f0' : isi >= kuota ? warna.bahaya : warna.redup }}>{isi >= kuota ? 'PENUH ' : 'Kursi '}{isi}/{kuota}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
