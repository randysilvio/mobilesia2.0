import React from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../api/useData';
import { Galat, Kartu, Kosong, Layar, Muat, s } from '../components/ui';
import { hariIni, jam, URUTAN_HARI } from '../utils/format';
import { jarak, warna } from '../theme';

export default function JadwalScreen() {
  const { peran } = useAuth();
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<any[]>('/jadwal-kuliah');

  if (memuat && !data) return <Muat />;
  const daftar = Array.isArray(data) ? data : [];
  const perHari = URUTAN_HARI.map((h) => ({
    hari: h,
    item: daftar.filter((j) => String(j.hari).toLowerCase() === h.toLowerCase())
      .sort((a, b) => String(a.jam_mulai).localeCompare(String(b.jam_mulai))),
  })).filter((g) => g.item.length > 0);
  const sekarang = hariIni();

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan} luring={luring}>
      {galat && !data ? <Galat pesan={galat.message} onUlang={muatUlang} /> : null}
      {!galat && perHari.length === 0 ? (
        <Kartu>
          <Kosong teks={peran === 'mahasiswa'
            ? 'Jadwal muncul setelah KRS semester ini disetujui Dosen Wali / Kaprodi.'
            : 'Belum ada jadwal mengajar pada semester aktif.'} ikon="calendar-clear-outline" />
        </Kartu>
      ) : null}
      {perHari.map((g) => (
        <Kartu key={g.hari} judul={g.hari + (g.hari === sekarang ? ' · Hari ini' : '')} ikon="calendar-outline"
          gaya={g.hari === sekarang ? { borderTopColor: warna.primer } : undefined}>
          {g.item.map((j, i) => (
            <View key={j.id} style={{ flexDirection: 'row', paddingVertical: jarak.s, borderTopWidth: i ? 1 : 0, borderTopColor: warna.garis }}>
              <View style={{ width: 70 }}>
                <Text style={{ fontWeight: '800', color: warna.gelap, fontVariant: ['tabular-nums'] }}>{jam(j.jam_mulai)}</Text>
                <Text style={[s.redupKecil, { fontVariant: ['tabular-nums'] }]}>{jam(j.jam_selesai)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: warna.teks }}>{j.mata_kuliah}</Text>
                <Text style={s.redupKecil}>{j.kode_mk} · Kelas {j.nama_kelas} · Ruang {j.ruang}</Text>
                {peran === 'mahasiswa' ? <Text style={s.redupKecil}>{j.dosen}</Text> : null}
              </View>
            </View>
          ))}
        </Kartu>
      ))}
    </Layar>
  );
}
