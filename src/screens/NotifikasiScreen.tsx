import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../api/useData';
import { permintaan } from '../api/client';
import { Galat, Kartu, Kosong, Layar, Muat, s, Tombol } from '../components/ui';
import { tanggalJam } from '../utils/format';
import { jarak, warna } from '../theme';

export default function NotifikasiScreen() {
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<any[]>('/notifikasi');
  if (memuat && !data) return <Muat />;
  const daftar = Array.isArray(data) ? data : [];

  const baca = async (n: any) => {
    if (n.read_at) return;
    try {
      await permintaan(`/notifikasi/${n.id}/read`, { method: 'POST' });
      muatUlang();
    } catch {}
  };

  const belum = daftar.filter((n) => !n.read_at).length;
  const bacaSemua = async () => {
    try {
      await permintaan('/notifikasi/baca-semua', { method: 'POST' });
      muatUlang();
    } catch {}
  };

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan} luring={luring}>
      {galat && !data ? <Galat pesan={galat.message} onUlang={muatUlang} /> : null}
      {belum > 1 ? <Tombol teks={`Tandai ${belum} dibaca`} ikon="checkmark-done-outline" jenis="garis" onPress={bacaSemua} gaya={{ marginBottom: jarak.m }} /> : null}
      {daftar.length === 0 && !galat ? <Kartu><Kosong teks="Belum ada pemberitahuan." ikon="notifications-off-outline" /></Kartu> : null}
      {daftar.map((n) => {
        const d = n.data || {};
        return (
          <Pressable key={n.id} onPress={() => baca(n)}>
            <View style={[s.kartu, { flexDirection: 'row', borderTopColor: n.read_at ? warna.garis : warna.primer }]}>
              <Ionicons name={n.read_at ? 'mail-open-outline' : 'mail-unread-outline'} size={22} color={n.read_at ? warna.redup : warna.primer} />
              <View style={{ flex: 1, marginLeft: jarak.m }}>
                <Text style={{ fontWeight: n.read_at ? '600' : '800', color: warna.teks }}>{d.title || 'Pemberitahuan'}</Text>
                {d.message ? <Text style={[s.teks, { marginTop: 2 }]}>{d.message}</Text> : null}
                <Text style={s.redupKecil}>{tanggalJam(n.created_at)}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </Layar>
  );
}
