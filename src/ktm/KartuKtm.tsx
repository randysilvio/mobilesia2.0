import React, { useState } from 'react';
import { Image, ImageBackground, LayoutChangeEvent, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import KodeQr from '../components/KodeQr';
import { KANVAS, POSISI, WARNA_KTM as W, ukuranTeks } from './desain';

// Latar (logo, judul, label, ornamen geometris & batik Papua) — gambar yang sama dengan SIAKAD web
const LATAR = require('../../assets/ktm-latar.jpg');

export type DataKtm = {
  nama: string; nim: string; prodi: string; angkatan: string; status: string; aktif: boolean;
  foto_url?: string | null; token: string; verifikasi_url: string; semester?: string | null;
  kampus: { nama: string; singkatan: string; kota: string; logo_url?: string };
};

/** Kartu E-KTM 85,6 × 54 mm. Desain tetap, identik dengan KTM di SIAKAD web. */
export default function KartuKtm({ data }: { data: DataKtm }) {
  const [lebar, setLebar] = useState(0);
  const [fontSiap] = useFonts({
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
  });
  const k = lebar / KANVAS.w; // px layar per px kanvas
  const huruf = (nama: 'Poppins-Bold' | 'Poppins-Medium') => (fontSiap ? { fontFamily: nama } : { fontWeight: '700' as const });
  const onLayout = (e: LayoutChangeEvent) => setLebar(e.nativeEvent.layout.width);
  const f = POSISI.foto;
  const nilai = [data.nama, data.nim, data.prodi, data.angkatan];

  return (
    <View onLayout={onLayout} style={{ width: '100%', aspectRatio: KANVAS.w / KANVAS.h, borderRadius: 38 * k || 12, overflow: 'hidden', backgroundColor: W.latar, elevation: 6 }}>
      {lebar ? (
        <ImageBackground source={LATAR} style={{ flex: 1 }} resizeMode="stretch">
          {/* foto */}
          <View style={{ position: 'absolute', left: f.x * k, top: f.y * k, width: f.w * k, height: f.h * k, borderRadius: 24 * k, borderWidth: Math.max(2, 6 * k),
            borderColor: W.oranye, backgroundColor: '#F6C99A', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {data.foto_url ? (
              <Image source={{ uri: data.foto_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text style={[huruf('Poppins-Bold'), { color: W.ungu, opacity: 0.55, fontSize: 150 * k }]}>{(data.nama || '?').charAt(0).toUpperCase()}</Text>
            )}
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: data.aktif ? W.aktif : W.nonaktif, paddingVertical: 9 * k }}>
              <Text style={[huruf('Poppins-Bold'), { color: '#fff', textAlign: 'center', fontSize: 23 * k, letterSpacing: 2 * k }]}>
                {data.aktif ? 'MAHASISWA AKTIF' : String(data.status || '').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* nilai: Nama, NIM, Prodi, Angkatan */}
          {nilai.map((t, i) => {
            const ukuran = ukuranTeks(String(t || ''));
            return (
              <Text key={i} numberOfLines={1} style={[huruf('Poppins-Bold'), {
                position: 'absolute', left: POSISI.nilaiX * k, width: POSISI.nilaiLebar * k,
                top: (POSISI.nilaiBaris[i] - ukuran * 0.92) * k, fontSize: ukuran * k, lineHeight: ukuran * 1.35 * k, color: W.ungu,
              }]}>{t}</Text>
            );
          })}

          {/* kode QR verifikasi */}
          <View style={{ position: 'absolute', left: POSISI.qr.x * k, top: POSISI.qr.y * k }}>
            <KodeQr nilai={data.verifikasi_url} ukuran={POSISI.qr.s * k} warna={W.ungu} />
          </View>

          <Text style={{ position: 'absolute', left: POSISI.token.x * k, top: (POSISI.token.y - 22) * k, fontFamily: 'monospace', fontWeight: '700', fontSize: 22 * k, color: W.ungu, opacity: 0.75 }}>
            ID {data.token}
          </Text>

          {!data.aktif ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 380 * k, left: 640 * k, transform: [{ rotate: '-12deg' }], borderWidth: 6 * k, borderColor: W.nonaktif,
              borderRadius: 16 * k, paddingHorizontal: 28 * k, paddingVertical: 6 * k, backgroundColor: 'rgba(253,223,193,0.85)' }}>
              <Text style={[huruf('Poppins-Bold'), { color: W.nonaktif, fontSize: 68 * k, letterSpacing: 6 * k }]}>TIDAK AKTIF</Text>
            </View>
          ) : null}
        </ImageBackground>
      ) : null}
    </View>
  );
}
