import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../api/useData';
import { ApiError } from '../api/client';
import { unduhDanBuka } from '../api/berkas';
import { bukaDiBrowser } from '../navigation/web';
import { Angka, Baris, Galat, Kartu, Kosong, Layar, Lencana, Muat, s, Tombol, jenisStatus } from '../components/ui';
import { angka, jam, tanggal, tanggalJam } from '../utils/format';
import { jarak, warna } from '../theme';

/** Ringkasan KRS semester aktif: status, catatan & validator, daftar MK + jadwal, isi/revisi, dan unduh KRS final. */
export default function KrsScreen() {
  const nav = useNavigation<any>();
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<any>('/krs/saya');
  const [mengunduh, setMengunduh] = useState(false);

  if (memuat && !data) return <Muat />;
  if (galat && !data) return <Layar menyegarkan={menyegarkan} onSegarkan={segarkan}><Galat pesan={galat.message} onUlang={muatUlang} /></Layar>;

  const d = data || {};
  const mk: any[] = Array.isArray(d.mata_kuliah) ? d.mata_kuliah : [];
  const status: string = d.status_krs || 'Belum Mengajukan';
  const ditolak = status === 'Ditolak';
  const periode = d.periode || {};

  const unduh = async () => {
    setMengunduh(true);
    try {
      await unduhDanBuka('/dokumen/krs', `KRS-${(d.semester || '').replace(/[^\w]+/g, '-')}.pdf`);
    } catch (e: any) {
      Alert.alert('KRS belum bisa diunduh', e instanceof ApiError ? e.message : 'Coba lagi.');
    } finally {
      setMengunduh(false);
    }
  };

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan} luring={luring}>
      <Kartu gelap>
        <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '800' }}>KRS {String(d.semester || '').toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', marginTop: jarak.s }}>
          <Angka terang label="SKS" nilai={`${d.total_sks ?? 0}/${d.max_sks ?? '-'}`} />
          <Angka terang label="IPK" nilai={angka(d.ipk)} />
          <Angka terang label="Semester ke" nilai={String(d.semester_ke ?? '-')} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: jarak.m, flexWrap: 'wrap' }}>
          <Lencana teks={status} jenis={jenisStatus(status)} />
          {d.dosen_wali ? <Text style={{ color: '#cbd5e1', fontSize: 12, marginLeft: jarak.s }}>Dosen wali: {d.dosen_wali}</Text> : null}
        </View>
        {periode.mulai && periode.selesai ? (
          <Text style={{ color: '#cbd5e1', fontSize: 12, marginTop: jarak.s }}>
            Periode KRS {tanggal(periode.mulai)} – {tanggal(periode.selesai)} · {periode.buka ? 'DIBUKA' : 'DITUTUP'}
          </Text>
        ) : null}
      </Kartu>

      {d.catatan || d.divalidasi_oleh ? (
        <Kartu judul={ditolak ? 'KRS ditolak — perlu diperbaiki' : 'Catatan validasi'} ikon={ditolak ? 'alert-circle-outline' : 'chatbox-ellipses-outline'}
          gaya={{ borderTopColor: ditolak ? warna.bahaya : status === 'Disetujui' ? warna.sukses : warna.peringatan }}>
          {d.catatan ? <Text style={[s.teks, { marginBottom: jarak.s }]}>{d.catatan}</Text> : null}
          {d.divalidasi_oleh ? <Text style={s.redupKecil}>Oleh {d.divalidasi_oleh}{d.divalidasi_pada ? ' · ' + tanggalJam(d.divalidasi_pada) : ''}</Text> : null}
        </Kartu>
      ) : null}

      {/* Aksi utama */}
      {d.bisa_ubah ? (
        <Tombol teks={mk.length === 0 ? 'Isi KRS' : ditolak ? 'Perbaiki KRS' : 'Ubah KRS'} ikon="create-outline"
          onPress={() => nav.navigate('KrsIsi')} gaya={{ marginBottom: jarak.m }} />
      ) : d.alasan_terkunci && status !== 'Disetujui' ? (
        <Kartu gaya={{ borderTopColor: warna.peringatan }}>
          <View style={{ flexDirection: 'row' }}>
            <Ionicons name="lock-closed-outline" size={18} color={warna.peringatan} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={[s.teks, { flex: 1 }]}>{d.alasan_terkunci}</Text>
          </View>
          {d.gerbang_bayar ? <Tombol teks="Lihat tagihan" ikon="wallet-outline" jenis="garis" onPress={() => nav.navigate('Tagihan')} gaya={{ marginTop: jarak.m }} /> : null}
          {d.edom_belum && !d.gerbang_bayar ? <Tombol teks="Isi EDOM di SIAKAD web" ikon="star-outline" jenis="garis" onPress={() => bukaDiBrowser('/evaluasi')} gaya={{ marginTop: jarak.m }} /> : null}
        </Kartu>
      ) : null}

      {status === 'Disetujui' ? (
        <Kartu gaya={{ borderTopColor: warna.sukses }}>
          <Text style={s.teks}>KRS sudah disetujui dan terkunci. Bila perlu mengubah, minta validator yang menyetujui membuka kembali persetujuan.</Text>
          {d.bisa_cetak ? <Tombol teks="Unduh KRS resmi (PDF)" ikon="download-outline" onPress={unduh} memuat={mengunduh} gaya={{ marginTop: jarak.m }} /> : null}
        </Kartu>
      ) : null}

      <Text style={s.judulBagian}>Mata kuliah diambil ({mk.length})</Text>
      {mk.length === 0 ? <Kartu><Kosong teks="Belum ada mata kuliah di KRS semester ini." ikon="list-outline" /></Kartu> : null}
      {mk.map((m) => (
        <View key={m.id} style={[s.kartu, { padding: jarak.m }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: warna.teks }}>{m.nama_mk}</Text>
              <Text style={s.redupKecil}>{m.kode_mk} · {m.sks} SKS · Kelas {m.kelas}{m.dosen ? ' · ' + m.dosen : ''}</Text>
            </View>
            <Lencana teks={`${m.sks} SKS`} jenis="gelap" />
          </View>
          {(m.jadwal || []).map((j: any, i: number) => (
            <Baris key={i} label={j.hari} nilai={`${jam(j.jam_mulai)}–${jam(j.jam_selesai)}${j.ruang ? ' · ' + j.ruang : ''}`} />
          ))}
        </View>
      ))}
    </Layar>
  );
}
