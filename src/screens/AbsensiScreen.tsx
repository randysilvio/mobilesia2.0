import React, { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useData } from '../api/useData';
import { ApiError, permintaan } from '../api/client';
import { Baris, Kartu, Kosong, Layar, Lencana, s, Tombol, jenisStatus } from '../components/ui';
import { hariIni, jam, tanggal } from '../utils/format';
import { jarak, warna } from '../theme';

export default function AbsensiScreen() {
  const status = useData<any>('/status-absensi');
  const riwayat = useData<any>('/absensi/riwayat');
  const [proses, setProses] = useState<string | null>(null);

  const hariIniData = status.data;
  const jenis: 'check-in' | 'check-out' | null = !hariIniData?.check_in ? 'check-in' : !hariIniData?.check_out ? 'check-out' : null;

  const absen = async () => {
    if (!jenis) return;
    try {
      setProses('Meminta izin lokasi…');
      const izinLokasi = await Location.requestForegroundPermissionsAsync();
      if (!izinLokasi.granted) {
        Alert.alert('Izin lokasi diperlukan', 'Absensi memerlukan lokasi untuk memastikan Anda berada di area kampus.', [
          { text: 'Tutup', style: 'cancel' }, { text: 'Buka pengaturan', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        Alert.alert('GPS mati', 'Nyalakan GPS/Lokasi di HP Anda lalu coba lagi.');
        return;
      }
      setProses('Mencari titik lokasi…');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const palsu = !!(pos as any).mocked;
      if (palsu) {
        Alert.alert('Lokasi palsu terdeteksi', 'Matikan aplikasi pengubah lokasi (fake GPS) lalu coba lagi.');
        return;
      }

      setProses('Membuka kamera…');
      const izinKamera = await ImagePicker.requestCameraPermissionsAsync();
      if (!izinKamera.granted) {
        Alert.alert('Izin kamera diperlukan', 'Foto selfie diperlukan sebagai bukti kehadiran.');
        return;
      }
      const foto = await ImagePicker.launchCameraAsync({ cameraType: ImagePicker.CameraType.front, quality: 0.5, allowsEditing: false });
      if (foto.canceled || !foto.assets?.length) return;

      setProses('Mengirim absensi…');
      const form = new FormData();
      form.append('latitude', String(pos.coords.latitude));
      form.append('longitude', String(pos.coords.longitude));
      form.append('is_mocked', palsu ? '1' : '0');
      form.append(jenis === 'check-in' ? 'foto_check_in' : 'foto_check_out',
        { uri: foto.assets[0].uri, name: 'selfie.jpg', type: foto.assets[0].mimeType || 'image/jpeg' } as any);
      const r = await permintaan<{ message: string }>(`/absensi/${jenis}`, { form, timeout: 60000 });
      Alert.alert('Berhasil', r?.message || 'Absensi tercatat.');
      status.muatUlang();
      riwayat.muatUlang();
    } catch (e: any) {
      Alert.alert('Absensi gagal', e instanceof ApiError ? e.message : (e?.message || 'Coba lagi.'));
    } finally {
      setProses(null);
    }
  };

  const daftar: any[] = Array.isArray(riwayat.data?.data) ? riwayat.data.data : [];

  return (
    <Layar menyegarkan={status.menyegarkan} onSegarkan={() => { status.segarkan(); riwayat.segarkan(); }} luring={status.luring}>
      <Kartu gelap>
        <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '800' }}>{hariIni().toUpperCase()}, {tanggal(new Date().toISOString()).toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', marginTop: jarak.m }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '800' }}>CHECK-IN</Text>
            <Text style={{ color: warna.putih, fontSize: 26, fontWeight: '900' }}>{jam(hariIniData?.check_in)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '800' }}>CHECK-OUT</Text>
            <Text style={{ color: warna.putih, fontSize: 26, fontWeight: '900' }}>{jam(hariIniData?.check_out)}</Text>
          </View>
        </View>
      </Kartu>

      {jenis ? (
        <Tombol teks={proses || (jenis === 'check-in' ? 'Check-in sekarang' : 'Check-out sekarang')}
          ikon={jenis === 'check-in' ? 'log-in-outline' : 'log-out-outline'} jenis={jenis === 'check-in' ? 'sukses' : 'gelap'}
          onPress={absen} memuat={!!proses} gaya={{ marginBottom: jarak.m, minHeight: 56 }} />
      ) : (
        <Kartu gaya={{ borderTopColor: warna.sukses }}><Text style={s.teks}>Absensi hari ini sudah lengkap. Terima kasih!</Text></Kartu>
      )}
      <Text style={[s.redupKecil, { marginBottom: jarak.m }]}>
        Pastikan GPS aktif dan Anda berada di dalam radius lokasi kerja kampus. Foto selfie diambil sebagai bukti kehadiran.
      </Text>

      <Kartu judul="Riwayat absensi" ikon="time-outline">
        {daftar.length === 0 ? <Kosong teks={riwayat.memuat ? 'Memuat…' : 'Belum ada riwayat absensi.'} /> : daftar.map((a) => (
          <View key={a.id} style={{ paddingVertical: jarak.s, borderBottomWidth: 1, borderBottomColor: warna.garis }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', color: warna.teks }}>{tanggal(a.tanggal_absensi)}</Text>
              <Lencana teks={a.status_kehadiran || '-'} jenis={jenisStatus(a.status_kehadiran)} />
            </View>
            <Baris label={`Masuk ${jam(a.waktu_check_in)} · Pulang ${jam(a.waktu_check_out)}`} nilai={a.lokasi_kerja?.nama_lokasi || ''} />
            {a.keterangan ? <Text style={s.redupKecil}>{a.keterangan}</Text> : null}
          </View>
        ))}
      </Kartu>
    </Layar>
  );
}
