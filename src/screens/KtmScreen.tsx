import React, { useState } from 'react';
import { Linking, Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useData } from '../api/useData';
import { Galat, Kartu, Layar, Muat, s, Tombol } from '../components/ui';
import KodeQr from '../components/KodeQr';
import KartuKtm, { DataKtm } from '../ktm/KartuKtm';
import { WARNA_KTM } from '../ktm/desain';
import { jarak, warna } from '../theme';

/** E-KTM digital. Data terakhir tersimpan sehingga kartu tetap bisa ditunjukkan saat tidak ada sinyal. */
export default function KtmScreen() {
  const { data, memuat, galat, luring, menyegarkan, segarkan, muatUlang } = useData<DataKtm>('/ktm');
  const [qrBesar, setQrBesar] = useState(false);
  const { width } = useWindowDimensions();

  if (memuat && !data) return <Muat teks="Menyiapkan kartu…" />;
  if (galat && !data) return <Layar><Galat pesan={galat.message} onUlang={muatUlang} /></Layar>;
  if (!data) return null;

  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan} luring={luring}>
      <Pressable onPress={() => setQrBesar(true)}>
        <KartuKtm data={data} />
      </Pressable>
      <Text style={[s.redupKecil, { textAlign: 'center', marginTop: jarak.s, marginBottom: jarak.l }]}>Ketuk kartu untuk memperbesar kode QR.</Text>

      <Kartu judul="Tentang kartu ini" ikon="shield-checkmark-outline">
        <Text style={s.teks}>
          KTM digital resmi {data.kampus?.singkatan}. Petugas dapat memindai kode QR untuk memastikan keaslian dan status kemahasiswaan Anda saat ini
          {data.semester ? ` (semester ${data.semester})` : ''}.
        </Text>
        {!data.aktif ? <Text style={[s.teks, { color: warna.bahaya, marginTop: jarak.s }]}>Status Anda saat ini {data.status}; kartu tidak berlaku sebagai tanda mahasiswa aktif.</Text> : null}
        <Tombol teks="Buka halaman verifikasi" jenis="garis" ikon="open-outline" onPress={() => Linking.openURL(data.verifikasi_url)} gaya={{ marginTop: jarak.m }} />
      </Kartu>

      <Modal visible={qrBesar} transparent animationType="fade" onRequestClose={() => setQrBesar(false)}>
        <Pressable onPress={() => setQrBesar(false)} style={{ flex: 1, backgroundColor: 'rgba(61,35,80,0.95)', alignItems: 'center', justifyContent: 'center', padding: jarak.xl }}>
          <View style={{ backgroundColor: '#fff', padding: jarak.l, borderRadius: 12 }}>
            <KodeQr nilai={data.verifikasi_url} ukuran={Math.min(width - 96, 320)} warna={WARNA_KTM.ungu} />
          </View>
          <Text style={{ color: WARNA_KTM.latar, fontWeight: '800', fontSize: 16, marginTop: jarak.l }}>{data.nama}</Text>
          <Text style={{ color: WARNA_KTM.oranye, fontFamily: 'monospace', fontSize: 15 }}>{data.nim}</Text>
          <Text style={{ color: WARNA_KTM.latar, opacity: 0.7, fontSize: 12, marginTop: jarak.l }}>Ketuk di mana saja untuk menutup</Text>
        </Pressable>
      </Modal>
    </Layar>
  );
}
