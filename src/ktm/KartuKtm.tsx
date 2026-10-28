import React, { useState } from 'react';
import { Image, LayoutChangeEvent, Text, View } from 'react-native';
import KodeQr from '../components/KodeQr';
import { WARNA_KTM as W } from './desain';

const LOGO = require('../../assets/logo.png');

export type DataKtm = {
  nama: string; nim: string; prodi: string; angkatan: string; status: string; aktif: boolean;
  foto_url?: string | null; token: string; verifikasi_url: string; semester?: string | null;
  kampus: { nama: string; singkatan: string; kota: string; logo_url?: string };
};

/** Kartu E-KTM ukuran kartu ID (85,6 × 54 mm). Desain & warna tetap, sama dengan KTM di SIAKAD web. */
export default function KartuKtm({ data }: { data: DataKtm }) {
  const [lebar, setLebar] = useState(0);
  const tinggi = lebar / 1.585;
  const f = lebar / 440; // skala huruf terhadap lebar kartu
  const pad = lebar * 0.046;
  const onLayout = (e: LayoutChangeEvent) => setLebar(e.nativeEvent.layout.width);

  return (
    <View onLayout={onLayout} style={{ width: '100%', height: tinggi || undefined, aspectRatio: lebar ? undefined : 1.585, borderRadius: 16 * f || 16, overflow: 'hidden', backgroundColor: W.latar, elevation: 6 }}>
      {lebar ? (
        <>
          {/* ornamen latar (tetap) */}
          <View style={{ position: 'absolute', width: lebar * 0.9, height: lebar * 0.9, borderRadius: lebar, backgroundColor: W.latarUjung, top: -lebar * 0.45, right: -lebar * 0.3, opacity: 0.85 }} />
          <View style={{ position: 'absolute', width: lebar * 0.42, height: lebar * 0.42, borderRadius: lebar, borderWidth: 2, borderColor: W.emas, opacity: 0.12, bottom: -lebar * 0.16, left: -lebar * 0.1 }} />

          {/* kepala */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: lebar * 0.036, marginHorizontal: pad, paddingBottom: lebar * 0.024, borderBottomWidth: 1, borderBottomColor: W.emas }}>
            <View style={{ width: lebar * 0.11, height: lebar * 0.11, borderRadius: lebar, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={LOGO} style={{ width: lebar * 0.085, height: lebar * 0.085 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1, marginHorizontal: lebar * 0.03 }}>
              <Text numberOfLines={2} style={{ color: W.teks, fontWeight: '800', fontSize: 11 * f, letterSpacing: 0.2, textTransform: 'uppercase' }}>{data.kampus?.nama}</Text>
              <Text style={{ color: W.emasMuda, fontSize: 8.5 * f, letterSpacing: 1.6 * f, marginTop: 2 * f }}>KARTU TANDA MAHASISWA</Text>
            </View>
            <View style={{ backgroundColor: W.emas, borderRadius: 6 * f, paddingHorizontal: 8 * f, paddingVertical: 2 * f }}>
              <Text style={{ color: W.latar, fontWeight: '900', fontSize: 15 * f, letterSpacing: 1.2 * f }}>KTM</Text>
            </View>
          </View>

          {/* isi */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: pad }}>
            <View style={{ width: lebar * 0.2, aspectRatio: 3 / 4, borderRadius: 8 * f, borderWidth: 2, borderColor: W.emas, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              {data.foto_url ? (
                <Image source={{ uri: data.foto_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Text style={{ color: W.emasMuda, fontWeight: '800', fontSize: 30 * f }}>{(data.nama || '?').charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View style={{ flex: 1, marginHorizontal: lebar * 0.04 }}>
              <Text numberOfLines={2} style={{ color: W.teks, fontWeight: '800', fontSize: 14 * f, lineHeight: 16 * f, textTransform: 'uppercase' }}>{data.nama}</Text>
              <Text style={{ color: W.emasMuda, fontWeight: '700', fontSize: 14 * f, letterSpacing: 0.8 * f, marginTop: 2 * f, fontFamily: 'monospace' }}>{data.nim}</Text>
              <Text numberOfLines={1} style={{ color: W.teks, fontSize: 9.5 * f, marginTop: 4 * f }}>
                <Text style={{ color: W.teksRedup, fontSize: 8 * f, letterSpacing: 0.6 * f }}>PROGRAM STUDI  </Text>{data.prodi}
              </Text>
              <Text numberOfLines={1} style={{ color: W.teks, fontSize: 9.5 * f, marginTop: 2 * f }}>
                <Text style={{ color: W.teksRedup, fontSize: 8 * f, letterSpacing: 0.6 * f }}>ANGKATAN  </Text>{data.angkatan}
              </Text>
              <View style={{ alignSelf: 'flex-start', marginTop: 5 * f, backgroundColor: data.aktif ? W.aktif : W.nonaktif, borderRadius: 20, paddingHorizontal: 7 * f, paddingVertical: 2 * f }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 8.5 * f, letterSpacing: 1 * f }}>{String(data.status || '').toUpperCase()}</Text>
              </View>
            </View>
            <View style={{ width: lebar * 0.23, height: lebar * 0.23, backgroundColor: '#fff', borderRadius: 8 * f, alignItems: 'center', justifyContent: 'center' }}>
              <KodeQr nilai={data.verifikasi_url} ukuran={lebar * 0.19} warna={W.latar} />
            </View>
          </View>

          {/* kaki */}
          <View style={{ backgroundColor: W.emas, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: pad, paddingVertical: lebar * 0.018 }}>
            <Text style={{ color: W.latar, fontWeight: '800', fontSize: 8.5 * f, letterSpacing: 0.5 * f }}>{String(data.kampus?.singkatan || '').toUpperCase()} · {String(data.kampus?.kota || '').toUpperCase()}</Text>
            <Text numberOfLines={1} style={{ color: W.latar, fontWeight: '800', fontSize: 8.5 * f, fontFamily: 'monospace', flexShrink: 1, marginLeft: 8 }}>{data.token}</Text>
          </View>

          {!data.aktif ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: '40%', alignSelf: 'center', transform: [{ rotate: '-14deg' }], borderWidth: 3, borderColor: '#f87171', borderRadius: 8, paddingHorizontal: 14 * f, paddingVertical: 4 * f, backgroundColor: 'rgba(11,37,69,0.6)' }}>
              <Text style={{ color: '#f87171', fontWeight: '900', fontSize: 20 * f, letterSpacing: 2 * f }}>TIDAK AKTIF</Text>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
