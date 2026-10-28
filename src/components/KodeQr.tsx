import React, { useMemo } from 'react';
import { View } from 'react-native';

// qrcode-generator: pustaka JavaScript murni (tanpa modul native), sama dengan yang dipakai SIAKAD web
const qrcode: any = require('qrcode-generator');

/** Kode QR digambar dengan View biasa (sel gelap digabung per baris agar ringan). */
export default function KodeQr({ nilai, ukuran, warna = '#0B2545', latar = '#FFFFFF' }: {
  nilai: string; ukuran: number; warna?: string; latar?: string;
}) {
  const baris = useMemo(() => {
    if (!nilai) return [] as { y: number; ruas: [number, number][] }[];
    const qr = qrcode(0, 'M');
    qr.addData(nilai);
    qr.make();
    const n: number = qr.getModuleCount();
    const hasil: { y: number; ruas: [number, number][] }[] = [];
    for (let r = 0; r < n; r++) {
      const ruas: [number, number][] = [];
      let mulai = -1;
      for (let c = 0; c <= n; c++) {
        const gelap = c < n && qr.isDark(r, c);
        if (gelap && mulai < 0) mulai = c;
        if (!gelap && mulai >= 0) { ruas.push([mulai, c - mulai]); mulai = -1; }
      }
      hasil.push({ y: r, ruas });
    }
    return hasil;
  }, [nilai]);

  const n = baris.length || 1;
  const sel = ukuran / n;
  return (
    <View style={{ width: ukuran, height: ukuran, backgroundColor: latar }}>
      {baris.map((b) => b.ruas.map(([x, w]) => (
        <View key={`${b.y}-${x}`} style={{ position: 'absolute', top: b.y * sel, left: x * sel, width: w * sel + 0.4, height: sel + 0.4, backgroundColor: warna }} />
      )))}
    </View>
  );
}
