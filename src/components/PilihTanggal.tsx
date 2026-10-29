import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { s } from './ui';
import { jarak, sudut, warna } from '../theme';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const dua = (n: number) => (n < 10 ? '0' + n : String(n));
export const keIso = (d: Date) => `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
export function dariIso(v?: string | null): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}
export function labelTanggal(v?: string | null, pendek = false): string {
  const d = dariIso(v);
  if (!d) return '-';
  const b = BULAN[d.getMonth()];
  return `${d.getDate()} ${pendek ? b.slice(0, 3) : b} ${d.getFullYear()}`;
}

/** Isian tanggal dengan kalender bulanan (tanpa paket native tambahan). Nilai: "TTTT-BB-HH". */
export default function PilihTanggal({ label, nilai, onPilih, minimal }: {
  label: string; nilai?: string | null; onPilih: (iso: string) => void; minimal?: string | null;
}) {
  const [buka, setBuka] = useState(false);
  const awal = dariIso(nilai) || new Date();
  const [tampil, setTampil] = useState(new Date(awal.getFullYear(), awal.getMonth(), 1));
  const batas = dariIso(minimal);
  const hariIniIso = keIso(new Date());

  const sel = useMemo(() => {
    const geser = (tampil.getDay() + 6) % 7; // Senin = kolom pertama
    const jumlah = new Date(tampil.getFullYear(), tampil.getMonth() + 1, 0).getDate();
    const hasil: (Date | null)[] = Array(geser).fill(null);
    for (let i = 1; i <= jumlah; i++) hasil.push(new Date(tampil.getFullYear(), tampil.getMonth(), i));
    while (hasil.length % 7) hasil.push(null);
    return hasil;
  }, [tampil]);

  const bukaPemilih = () => {
    const d = dariIso(nilai) || dariIso(minimal) || new Date();
    setTampil(new Date(d.getFullYear(), d.getMonth(), 1));
    setBuka(true);
  };
  const geserBulan = (n: number) => setTampil(new Date(tampil.getFullYear(), tampil.getMonth() + n, 1));

  return (
    <View style={{ marginBottom: jarak.m, flex: 1 }}>
      <Text style={s.label}>{label.toUpperCase()}</Text>
      <Pressable onPress={bukaPemilih} style={[s.isian, { flexDirection: 'row', alignItems: 'center' }]}>
        <Ionicons name="calendar-outline" size={16} color={warna.redup} />
        <Text style={{ marginLeft: 6, color: nilai ? warna.teks : warna.redup, fontWeight: '700' }}>{nilai ? labelTanggal(nilai, true) : 'Pilih tanggal'}</Text>
      </Pressable>

      <Modal visible={buka} transparent animationType="fade" onRequestClose={() => setBuka(false)}>
        <Pressable onPress={() => setBuka(false)} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', padding: jarak.l }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: warna.kartu, borderRadius: sudut * 2, padding: jarak.m }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: jarak.s }}>
              <Pressable onPress={() => geserBulan(-1)} hitSlop={10} style={{ padding: 6 }}><Ionicons name="chevron-back" size={20} color={warna.gelap} /></Pressable>
              <Text style={{ flex: 1, textAlign: 'center', fontWeight: '900', color: warna.gelap }}>{BULAN[tampil.getMonth()]} {tampil.getFullYear()}</Text>
              <Pressable onPress={() => geserBulan(1)} hitSlop={10} style={{ padding: 6 }}><Ionicons name="chevron-forward" size={20} color={warna.gelap} /></Pressable>
            </View>
            <View style={{ flexDirection: 'row' }}>
              {HARI.map((h) => <Text key={h} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', color: h === 'Min' ? warna.bahaya : warna.redup }}>{h}</Text>)}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
              {sel.map((d, i) => {
                if (!d) return <View key={'k' + i} style={{ width: '14.2857%', height: 40 }} />;
                const iso = keIso(d);
                const dipilih = iso === nilai;
                const mati = !!batas && d < batas;
                return (
                  <Pressable key={iso} disabled={mati} onPress={() => { onPilih(iso); setBuka(false); }}
                    style={{ width: '14.2857%', height: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: dipilih ? warna.gelap : 'transparent', borderWidth: iso === hariIniIso && !dipilih ? 1 : 0, borderColor: warna.gelap }}>
                      <Text style={{ fontWeight: dipilih ? '900' : '600', color: dipilih ? warna.putih : mati ? warna.garis : warna.teks }}>{d.getDate()}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: jarak.s }}>
              <Pressable onPress={() => setTampil(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} style={{ padding: 8 }}>
                <Text style={{ fontWeight: '800', color: warna.primer }}>BULAN INI</Text>
              </Pressable>
              <Pressable onPress={() => setBuka(false)} style={{ padding: 8 }}><Text style={{ fontWeight: '800', color: warna.redup }}>TUTUP</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
