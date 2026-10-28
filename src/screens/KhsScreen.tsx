import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../api/useData';
import { Angka, Galat, Kartu, Kosong, Layar, Lencana, Muat, s } from '../components/ui';
import { angka } from '../utils/format';
import { jarak, warna } from '../theme';

const WARNA_NILAI: Record<string, string> = { A: 'sukses', B: 'info', C: 'gelap', D: 'peringatan', E: 'bahaya' };

export default function KhsScreen() {
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<any>('/khs-mahasiswa');
  const [terbuka, setTerbuka] = useState<number | null>(null);

  if (memuat && !data) return <Muat />;
  if (galat && !data) {
    return (
      <Layar menyegarkan={menyegarkan} onSegarkan={segarkan}>
        <Galat pesan={galat.status === 403 ? galat.message + ' Pengisian EDOM dilakukan di SIAKAD web.' : galat.message} onUlang={muatUlang} />
      </Layar>
    );
  }

  const m = data?.mahasiswa || {};
  const daftar: any[] = Array.isArray(data?.khs) ? data.khs : [];
  const aktif = terbuka ?? (daftar[0]?.semester_id || null);

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan} luring={luring}>
      <Kartu gelap>
        <Text style={{ color: warna.putih, fontWeight: '800', fontSize: 16 }}>{m.nama}</Text>
        <Text style={{ color: '#cbd5e1', fontSize: 12, marginBottom: jarak.m }}>{m.nim} · {m.prodi}</Text>
        <View style={{ flexDirection: 'row' }}>
          <Angka terang label="IPK" nilai={angka(m.ipk)} />
          <Angka terang label="SKS lulus" nilai={String(m.total_sks_lulus ?? 0)} satuan="SKS" />
        </View>
      </Kartu>

      {daftar.length === 0 ? <Kartu><Kosong teks="Belum ada riwayat studi." /></Kartu> : null}

      {daftar.map((smt) => {
        const buka = aktif === smt.semester_id;
        return (
          <View key={smt.semester_id} style={[s.kartu, { padding: 0 }]}>
            <Pressable onPress={() => setTerbuka(buka ? -1 : smt.semester_id)} style={{ flexDirection: 'row', alignItems: 'center', padding: jarak.l }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: warna.gelap }}>{smt.semester || `Semester #${smt.semester_id}`}</Text>
                <Text style={s.redupKecil}>IPS {angka(smt.ips)} · {smt.total_sks} SKS bernilai</Text>
              </View>
              <Ionicons name={buka ? 'chevron-up' : 'chevron-down'} size={20} color={warna.redup} />
            </Pressable>
            {buka ? (smt.mata_kuliah || []).map((mk: any, i: number) => (
              <View key={mk.kode + i} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: jarak.l, paddingVertical: 10, borderTopWidth: 1, borderTopColor: warna.garis }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: warna.teks, fontWeight: '600' }}>{mk.nama}</Text>
                  <Text style={s.redupKecil}>{mk.kode} · {mk.sks} SKS</Text>
                </View>
                {mk.nilai && mk.nilai !== '-' ? <Lencana teks={mk.nilai} jenis={WARNA_NILAI[mk.nilai] || 'gelap'} /> : <Text style={s.redupKecil}>Belum dinilai</Text>}
              </View>
            )) : null}
          </View>
        );
      })}
      <Text style={[s.redupKecil, { textAlign: 'center' }]}>KHS dan transkrip resmi bersegel QR dicetak dari SIAKAD web.</Text>
    </Layar>
  );
}
