import React from 'react';
import { Text, View } from 'react-native';
import { useData } from '../api/useData';
import { Galat, Kartu, Kosong, Layar, Muat, s } from '../components/ui';
import { keTanggal, tanggal } from '../utils/format';
import { jarak, warna } from '../theme';

export default function KalenderScreen() {
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<any[]>('/kalender-akademik');
  if (memuat && !data) return <Muat />;
  const daftar = Array.isArray(data) ? data : [];
  const hariIni = new Date(); hariIni.setHours(0, 0, 0, 0);
  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan} luring={luring}>
      {galat && !data ? <Galat pesan={galat.message} onUlang={muatUlang} /> : null}
      {daftar.length === 0 && !galat ? <Kartu><Kosong teks="Belum ada agenda akademik." ikon="calendar-clear-outline" /></Kartu> : null}
      {daftar.map((k) => {
        const mulai = keTanggal(k.tanggal_mulai);
        const selesai = keTanggal(k.tanggal_selesai);
        const berlangsung = mulai && selesai && mulai <= hariIni && selesai >= hariIni;
        const lewat = selesai && selesai < hariIni;
        return (
          <Kartu key={k.id} gaya={{ borderTopColor: berlangsung ? warna.sukses : lewat ? warna.garis : warna.gelap, opacity: lewat ? 0.7 : 1 }}>
            <Text style={{ fontWeight: '800', color: warna.teks }}>{k.judul_kegiatan}</Text>
            <Text style={[s.redupKecil, { marginTop: 2 }]}>
              {tanggal(k.tanggal_mulai)}{k.tanggal_selesai && k.tanggal_selesai !== k.tanggal_mulai ? ' – ' + tanggal(k.tanggal_selesai) : ''}
              {berlangsung ? '  ·  SEDANG BERLANGSUNG' : ''}
            </Text>
            {k.deskripsi ? <Text style={[s.teks, { marginTop: jarak.s }]}>{k.deskripsi}</Text> : null}
          </Kartu>
        );
      })}
    </Layar>
  );
}
