import React from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jarak, sudut, warna } from '../theme';
import { tanggalJam } from '../utils/format';

type IkonNama = React.ComponentProps<typeof Ionicons>['name'];

export function Layar({
  children, menyegarkan, onSegarkan, luring, gulir = true, gaya,
}: {
  children: React.ReactNode; menyegarkan?: boolean; onSegarkan?: () => void; luring?: boolean; gulir?: boolean; gaya?: ViewStyle;
}) {
  const isi = (
    <>
      {luring ? <PitaLuring /> : null}
      {children}
    </>
  );
  if (!gulir) return <View style={[s.layar, gaya]}>{isi}</View>;
  return (
    <ScrollView
      style={s.layar}
      contentContainerStyle={[{ padding: jarak.l, paddingBottom: jarak.xl * 2 }, gaya]}
      refreshControl={onSegarkan ? <RefreshControl refreshing={!!menyegarkan} onRefresh={onSegarkan} colors={[warna.gelap]} /> : undefined}
      keyboardShouldPersistTaps="handled"
    >
      {isi}
    </ScrollView>
  );
}

export function PitaLuring({ waktu }: { waktu?: number }) {
  return (
    <View style={s.luring}>
      <Ionicons name="cloud-offline-outline" size={16} color={warna.peringatan} />
      <Text style={s.luringTeks}>
        Mode luring — menampilkan data tersimpan{waktu ? ` (${tanggalJam(new Date(waktu).toISOString())})` : ''}. Tarik ke bawah untuk mencoba lagi.
      </Text>
    </View>
  );
}

export function Kartu({ children, judul, ikon, kanan, gaya, gelap }: {
  children?: React.ReactNode; judul?: string; ikon?: IkonNama; kanan?: React.ReactNode; gaya?: ViewStyle; gelap?: boolean;
}) {
  return (
    <View style={[s.kartu, gelap && { backgroundColor: warna.gelap, borderColor: warna.gelap }, gaya]}>
      {judul ? (
        <View style={s.kartuKepala}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {ikon ? <Ionicons name={ikon} size={16} color={gelap ? warna.putih : warna.gelap} style={{ marginRight: 6 }} /> : null}
            <Text style={[s.kartuJudul, gelap && { color: warna.putih }]} numberOfLines={1}>{judul}</Text>
          </View>
          {kanan}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const WARNA_LENCANA: Record<string, string> = {
  sukses: warna.sukses, peringatan: warna.peringatan, bahaya: warna.bahaya, info: warna.info, gelap: warna.gelap, redup: warna.redup,
};

export function Lencana({ teks, jenis = 'gelap' }: { teks: string; jenis?: keyof typeof WARNA_LENCANA | string }) {
  const c = WARNA_LENCANA[jenis] || warna.gelap;
  return (
    <View style={[s.lencana, { borderColor: c, backgroundColor: c + '18' }]}>
      <Text style={[s.lencanaTeks, { color: c }]}>{teks.toUpperCase()}</Text>
    </View>
  );
}

export function Tombol({ teks, onPress, jenis = 'gelap', ikon, memuat, nonaktif, gaya }: {
  teks: string; onPress: () => void; jenis?: 'gelap' | 'garis' | 'bahaya' | 'sukses'; ikon?: IkonNama; memuat?: boolean; nonaktif?: boolean; gaya?: ViewStyle;
}) {
  const latar = jenis === 'garis' ? 'transparent' : jenis === 'bahaya' ? warna.bahaya : jenis === 'sukses' ? warna.sukses : warna.gelap;
  const teksWarna = jenis === 'garis' ? warna.gelap : warna.putih;
  const mati = nonaktif || memuat;
  return (
    <Pressable
      onPress={onPress}
      disabled={mati}
      style={({ pressed }) => [s.tombol, { backgroundColor: latar, opacity: mati ? 0.5 : pressed ? 0.8 : 1 },
        jenis === 'garis' && { borderWidth: 1, borderColor: warna.gelap }, gaya]}
    >
      {memuat ? <ActivityIndicator color={teksWarna} /> : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {ikon ? <Ionicons name={ikon} size={18} color={teksWarna} style={{ marginRight: 8 }} /> : null}
          <Text style={[s.tombolTeks, { color: teksWarna }]}>{teks.toUpperCase()}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Isian(props: TextInputProps & { label: string }) {
  const { label, style, ...lain } = props;
  return (
    <View style={{ marginBottom: jarak.m }}>
      <Text style={s.label}>{label.toUpperCase()}</Text>
      <TextInput placeholderTextColor={warna.redup} style={[s.isian, style]} {...lain} />
    </View>
  );
}

export function Muat({ teks = 'Memuat data…' }: { teks?: string }) {
  return (
    <View style={s.tengah}>
      <ActivityIndicator size="large" color={warna.gelap} />
      <Text style={[s.redup, { marginTop: jarak.m }]}>{teks}</Text>
    </View>
  );
}

export function Galat({ pesan, onUlang, ikon = 'alert-circle-outline' }: { pesan: string; onUlang?: () => void; ikon?: IkonNama }) {
  return (
    <View style={[s.kartu, { alignItems: 'center', paddingVertical: jarak.xl }]}>
      <Ionicons name={ikon} size={40} color={warna.peringatan} />
      <Text style={[s.teks, { textAlign: 'center', marginVertical: jarak.m }]}>{pesan}</Text>
      {onUlang ? <Tombol teks="Coba lagi" jenis="garis" ikon="refresh" onPress={onUlang} /> : null}
    </View>
  );
}

export function Kosong({ teks, ikon = 'file-tray-outline' }: { teks: string; ikon?: IkonNama }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: jarak.xl }}>
      <Ionicons name={ikon} size={36} color={warna.redup} />
      <Text style={[s.redup, { marginTop: jarak.s, textAlign: 'center' }]}>{teks}</Text>
    </View>
  );
}

export function Baris({ label, nilai, tebal }: { label: string; nilai?: React.ReactNode; tebal?: boolean }) {
  return (
    <View style={s.baris}>
      <Text style={s.barisLabel}>{label}</Text>
      {typeof nilai === 'string' || typeof nilai === 'number'
        ? <Text style={[s.barisNilai, tebal && { fontWeight: '700' }]}>{nilai}</Text>
        : nilai}
    </View>
  );
}

export function Angka({ label, nilai, satuan, terang }: { label: string; nilai: string | number; satuan?: string; terang?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[s.angkaLabel, terang && { color: '#cbd5e1' }]}>{label.toUpperCase()}</Text>
      <Text style={[s.angkaNilai, terang && { color: warna.putih }]}>
        {nilai}{satuan ? <Text style={{ fontSize: 13, fontWeight: '600' }}> {satuan}</Text> : null}
      </Text>
    </View>
  );
}

export function ItemMenu({ ikon, teks, sub, onPress, bahaya }: { ikon: IkonNama; teks: string; sub?: string; onPress: () => void; bahaya?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.menu, pressed && { backgroundColor: warna.latar }]}>
      <Ionicons name={ikon} size={22} color={bahaya ? warna.bahaya : warna.gelap} />
      <View style={{ flex: 1, marginLeft: jarak.m }}>
        <Text style={[s.menuTeks, bahaya && { color: warna.bahaya }]}>{teks}</Text>
        {sub ? <Text style={s.redupKecil}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={warna.redup} />
    </Pressable>
  );
}

export const s = StyleSheet.create({
  layar: { flex: 1, backgroundColor: warna.latar },
  tengah: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: jarak.xl, backgroundColor: warna.latar },
  kartu: {
    backgroundColor: warna.kartu, borderRadius: sudut, borderWidth: 1, borderColor: warna.garis, borderTopWidth: 3,
    borderTopColor: warna.gelap, padding: jarak.l, marginBottom: jarak.m,
  },
  kartuKepala: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: jarak.m },
  kartuJudul: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, color: warna.gelap, textTransform: 'uppercase' },
  lencana: { borderWidth: 1, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  lencanaTeks: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  tombol: { minHeight: 46, borderRadius: sudut, alignItems: 'center', justifyContent: 'center', paddingHorizontal: jarak.l },
  tombolTeks: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  label: { fontSize: 11, fontWeight: '800', color: warna.gelap, marginBottom: 6, letterSpacing: 0.3 },
  isian: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: sudut, backgroundColor: warna.putih, paddingHorizontal: jarak.m,
    paddingVertical: 10, fontSize: 15, color: warna.teks,
  },
  teks: { fontSize: 14, color: warna.teks, lineHeight: 20 },
  redup: { fontSize: 13, color: warna.redup },
  redupKecil: { fontSize: 12, color: warna.redup, marginTop: 2 },
  baris: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: warna.garis },
  barisLabel: { fontSize: 13, color: warna.redup, flex: 1, marginRight: jarak.s },
  barisNilai: { fontSize: 13, color: warna.teks, textAlign: 'right', flexShrink: 1 },
  angkaLabel: { fontSize: 10, fontWeight: '800', color: warna.redup, letterSpacing: 0.4 },
  angkaNilai: { fontSize: 24, fontWeight: '800', color: warna.teks, marginTop: 2, fontVariant: ['tabular-nums'] },
  menu: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: jarak.l, backgroundColor: warna.kartu, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: warna.garis },
  menuTeks: { fontSize: 15, fontWeight: '600', color: warna.teks },
  luring: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d', padding: jarak.s, borderRadius: sudut, marginBottom: jarak.m },
  luringTeks: { fontSize: 12, color: '#92400e', marginLeft: 6, flex: 1 },
  judulBagian: { fontSize: 12, fontWeight: '800', color: warna.redup, letterSpacing: 0.5, marginTop: jarak.m, marginBottom: jarak.s, textTransform: 'uppercase' },
});

/** Lencana status yang dipakai berulang (KRS, tagihan, absensi). */
export function jenisStatus(status?: string | null): string {
  const v = (status || '').toLowerCase().replace(/_/g, ' ');
  // urutan penting: "belum lunas" mengandung kata "lunas"
  if (v.includes('belum mengajukan')) return 'redup';
  if (['ditolak', 'belum', 'alpha', 'alpa'].some((k) => v.includes(k))) return 'bahaya';
  if (['menunggu', 'konfirmasi', 'izin', 'sakit'].some((k) => v.includes(k))) return 'peringatan';
  if (['disetujui', 'lunas', 'hadir', 'dispensasi'].some((k) => v.includes(k))) return 'sukses';
  return 'redup';
}
