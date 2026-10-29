import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { versiAplikasi } from '../api/config';
import { bukaDiBrowser } from '../navigation/web';
import { bukaPengaturanNotifikasi, daftarkanPush, statusPush, StatusPush } from '../push/notifikasi';
import { ItemMenu, s } from '../components/ui';
import { jarak, warna } from '../theme';

type Item = { ikon: any; teks: string; sub?: string; ke?: string; web?: [string, string] };

/** Menu lain per peran. Fitur yang hanya ada di SIAKAD web dibuka di browser HP. */
export default function LainnyaScreen() {
  const nav = useNavigation<any>();
  const { peran, profil, keluar } = useAuth();
  const kaprodi = !!profil?.is_kaprodi;
  const admin = (profil?.roles || []).includes('admin');
  const [push, setPush] = useState<StatusPush | null>(null);
  useFocusEffect(useCallback(() => { statusPush().then(setPush); }, []));

  const aplikasi: Item[] = peran === 'mahasiswa' ? [
    { ikon: 'card-outline', teks: 'Kartu Tanda Mahasiswa (E-KTM)', sub: 'Tunjukkan KTM digital ber-QR, bisa tanpa sinyal', ke: 'Ktm' },
    { ikon: 'ribbon-outline', teks: 'KHS & transkrip', sub: 'Nilai per semester, unduh PDF resmi', ke: 'Khs' },
    { ikon: 'wallet-outline', teks: 'Tagihan & pembayaran', sub: 'Lihat tagihan, unggah bukti transfer', ke: 'Tagihan' },
  ] : peran === 'dosen' ? [
    { ikon: 'calendar-outline', teks: 'Jadwal mengajar', ke: 'Jadwal' },
  ] : [];

  const umum: Item[] = [
    ...(admin ? [{ ikon: 'options-outline', teks: 'Panel kalender akademik', sub: 'Admin · atur periode KRS, validasi, EDOM, nilai, PMB', ke: 'KalenderAdmin' }] : []),
    { ikon: 'calendar-number-outline', teks: 'Kalender akademik', ke: 'Kalender' },
    { ikon: 'notifications-outline', teks: 'Notifikasi', ke: 'Notifikasi' },
    { ikon: 'person-outline', teks: 'Profil saya', ke: 'Profil' },
  ];

  const web: Item[] = peran === 'mahasiswa' ? [
    { ikon: 'star-outline', teks: 'Evaluasi dosen (EDOM)', web: ['/evaluasi', 'Evaluasi Dosen'] },
    { ikon: 'mail-outline', teks: 'Layanan surat', sub: 'Surat aktif kuliah & lainnya', web: ['/layanan-surat', 'Layanan Surat'] },
    { ikon: 'people-outline', teks: 'Tracer study alumni', web: ['/tracer-study', 'Tracer Study'] },
  ] : peran === 'dosen' ? [
    { ikon: 'create-outline', teks: 'Input nilai', sub: 'Pilih mata kuliah di dashboard dosen, lalu Nilai', web: ['/dosen/dashboard', 'Input Nilai'] },
    { ikon: 'people-circle-outline', teks: 'Perwalian', sub: kaprodi ? 'Anak wali & penetapan dosen wali (Kaprodi)' : 'Daftar anak wali', web: ['/perwalian', 'Perwalian'] },
    { ikon: 'briefcase-outline', teks: 'Tridharma & BKD', web: ['/dosen/tridharma', 'Tridharma & BKD'] },
    ...(kaprodi ? [{ ikon: 'stats-chart-outline', teks: 'Dashboard Kaprodi', web: ['/kaprodi/dashboard', 'Dashboard Kaprodi'] as [string, string] }] : []),
  ] : [];

  const buka = (i: Item) => (i.web ? bukaDiBrowser(i.web[0]) : nav.navigate(i.ke));
  const konfirmasiKeluar = () => Alert.alert('Keluar dari aplikasi?', 'Anda perlu masuk kembali untuk memakai aplikasi.', [
    { text: 'Batal', style: 'cancel' }, { text: 'Keluar', style: 'destructive', onPress: keluar },
  ]);

  const daftar = (judul: string, item: Item[]) => item.length ? (
    <>
      <Text style={[s.judulBagian, { marginHorizontal: jarak.l }]}>{judul}</Text>
      {item.map((i) => <ItemMenu key={i.teks} ikon={i.ikon} teks={i.teks} sub={i.sub} onPress={() => buka(i)} />)}
    </>
  ) : null;

  return (
    <ScrollView style={s.layar}>
      <View style={{ padding: jarak.l, backgroundColor: warna.gelap }}>
        <Text style={{ color: warna.putih, fontWeight: '900', fontSize: 17 }}>{profil?.name}</Text>
        <Text style={{ color: '#cbd5e1', fontSize: 12 }}>{profil?.email}</Text>
      </View>
      {daftar('Menu', [...aplikasi, ...umum])}
      {daftar('SIAKAD web (dibuka di browser)', [...web, { ikon: 'globe-outline', teks: 'Dashboard SIAKAD web', sub: 'Semua fitur lengkap', web: ['/dashboard', 'SIAKAD Web'] }])}
      <Text style={[s.judulBagian, { marginHorizontal: jarak.l }]}>Akun</Text>
      {push && push !== 'tidak_tersedia' ? (
        <ItemMenu ikon={push === 'aktif' ? 'notifications' : 'notifications-off-outline'} teks="Notifikasi di HP"
          sub={push === 'aktif' ? 'Aktif — pemberitahuan muncul walau aplikasi tertutup' : push === 'ditolak' ? 'Diblokir — ketuk untuk membuka pengaturan HP' : 'Belum aktif — ketuk untuk mengaktifkan'}
          onPress={async () => {
            if (push === 'ditolak') return bukaPengaturanNotifikasi();
            const hasil = await daftarkanPush(true);
            setPush(hasil);
            if (hasil === 'aktif') Alert.alert('Notifikasi aktif', 'HP ini akan menerima pemberitahuan KRS, Verum, dan agenda akademik.');
            else if (hasil === 'ditolak') Alert.alert('Izin ditolak', 'Aktifkan izin notifikasi untuk SIAKAD di pengaturan HP.', [{ text: 'Nanti' }, { text: 'Buka pengaturan', onPress: bukaPengaturanNotifikasi }]);
            else if (hasil === 'belum') Alert.alert('Belum berhasil', 'Tidak dapat menghubungi server. Coba lagi saat ada sinyal.');
          }} />
      ) : null}
      <ItemMenu ikon="log-out-outline" teks="Keluar" onPress={konfirmasiKeluar} bahaya />
      <Text style={[s.redupKecil, { textAlign: 'center', marginVertical: jarak.xl }]}>
        SIAKAD STT GPI Papua · versi {versiAplikasi().nama} (build {versiAplikasi().kode})
      </Text>
    </ScrollView>
  );
}
