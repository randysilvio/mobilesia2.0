import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../api/useData';
import { ApiError, permintaan } from '../api/client';
import { Angka, Galat, Kartu, Lencana, Muat, PitaLuring, s, Tombol, jenisStatus } from '../components/ui';
import { angka, jam } from '../utils/format';
import { jarak, sudut, warna } from '../theme';

type Jadwal = { id: number; nama_kelas?: string; hari: string; jam_mulai: string; jam_selesai: string; ruang?: string; kuota?: number };
type MK = { id: number; kode_mk: string; nama_mk: string; sks: number; semester: number; jadwals?: Jadwal[]; prasyarats?: { id: number; nama_mk: string }[] };

const kelasDari = (j: Jadwal) => String(j.nama_kelas || 'A').toUpperCase();

export default function KrsScreen() {
  const nav = useNavigation<any>();
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<any>('/krs/form');
  const [pilihan, setPilihan] = useState<Record<number, string>>({});
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesanAturan, setPesanAturan] = useState<string | null>(null);

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
  const perSemester = useMemo(() => {
    const grup: Record<string, MK[]> = {};
    daftar.forEach((mk) => { (grup[mk.semester] = grup[mk.semester] || []).push(mk); });
    return Object.keys(grup).sort((a, b) => Number(a) - Number(b)).map((k) => ({ semester: k, item: grup[k] }));
  }, [daftar]);

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
      await permintaan('/krs/submit', { body: { mata_kuliahs: ids, nama_kelas: pilihan } });
      Alert.alert('KRS tersimpan', 'KRS Anda berhasil disimpan dan menunggu persetujuan Dosen Wali / Kaprodi.');
      muatUlang();
    } catch (e: any) {
      setPesanAturan(e instanceof ApiError ? e.message : 'Gagal menyimpan KRS.');
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: warna.latar }}>
      <ScrollView contentContainerStyle={{ padding: jarak.l, paddingBottom: 120 }}
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

        {perSemester.map((g) => (
          <View key={g.semester}>
            <Text style={s.judulBagian}>Semester {g.semester}</Text>
            {g.item.filter((mk) => !terkunci || pilihan[mk.id]).map((mk) => (
              <ItemMk key={mk.id} mk={mk} terisi={data?.terisi?.[mk.id] || {}} kelas={pilihan[mk.id]} terkunci={terkunci}
                onAlih={() => alihkan(mk)} onKelas={(k) => setPilihan((p) => ({ ...p, [mk.id]: k }))} />
            ))}
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

function ItemMk({ mk, kelas, terisi, terkunci, onAlih, onKelas }: {
  mk: MK; kelas?: string; terisi: Record<string, number>; terkunci: boolean; onAlih: () => void; onKelas: (k: string) => void;
}) {
  const dipilih = !!kelas;
  const slot = (mk.jadwals || []).reduce<Record<string, Jadwal[]>>((acc, j) => {
    (acc[kelasDari(j)] = acc[kelasDari(j)] || []).push(j);
    return acc;
  }, {});
  return (
    <View style={[s.kartu, { padding: jarak.m, borderTopColor: dipilih ? warna.sukses : warna.garis }]}>
      <Pressable onPress={onAlih} disabled={terkunci} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name={dipilih ? 'checkbox' : 'square-outline'} size={24} color={dipilih ? warna.sukses : warna.redup} />
        <View style={{ flex: 1, marginLeft: jarak.s }}>
          <Text style={{ fontWeight: '700', color: warna.teks }}>{mk.nama_mk}</Text>
          <Text style={s.redupKecil}>{mk.kode_mk} · {mk.sks} SKS · Semester {mk.semester}</Text>
          {mk.prasyarats && mk.prasyarats.length ? (
            <Text style={[s.redupKecil, { color: warna.peringatan }]}>Prasyarat: {mk.prasyarats.map((p) => p.nama_mk).join(', ')}</Text>
          ) : null}
        </View>
      </Pressable>
      {dipilih && Object.keys(slot).length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: jarak.s }}>
          {Object.keys(slot).sort().map((k) => {
            const aktif = kelas === k;
            const j = slot[k];
            const isi = terisi[k] || 0;
            const kuota = Number(j[0].kuota || 40);
            return (
              <Pressable key={k} disabled={terkunci} onPress={() => onKelas(k)}
                style={{ borderWidth: 1, borderColor: aktif ? warna.gelap : warna.garis, backgroundColor: aktif ? warna.gelap : warna.putih,
                  borderRadius: sudut, paddingVertical: 6, paddingHorizontal: 8, marginRight: 6, marginBottom: 6 }}>
                <Text style={{ fontWeight: '800', fontSize: 12, color: aktif ? warna.putih : warna.gelap }}>KELAS {k}</Text>
                {j.map((x) => (
                  <Text key={x.id} style={{ fontSize: 11, color: aktif ? '#cbd5e1' : warna.redup }}>{x.hari} {jam(x.jam_mulai)}–{jam(x.jam_selesai)}</Text>
                ))}
                <Text style={{ fontSize: 11, color: aktif ? '#cbd5e1' : isi >= kuota ? warna.bahaya : warna.redup }}>Kursi {isi}/{kuota}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
