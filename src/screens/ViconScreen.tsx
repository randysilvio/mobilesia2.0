import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Linking, PermissionsAndroid, Platform, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { Galat, Layar } from '../components/ui';
import { jarak, warna } from '../theme';

/**
 * Vicon kelas Verum (Jitsi Meet) sebagai popup di dalam aplikasi — tidak berpindah ke browser.
 * Nama peserta diisi otomatis dari akun SIAKAD; kamera & mikrofon diminta saat popup dibuka.
 */
export default function ViconScreen() {
  const nav = useNavigation<any>();
  const { params }: any = useRoute();
  const { profil } = useAuth();
  const webRef = useRef<any>(null);
  const [izin, setIzin] = useState<boolean | null>(Platform.OS === 'android' ? null : true);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const ruang: string = params?.url || '';
  // disableDeepLinking: tetap di halaman web Jitsi (tidak dialihkan ke Play Store / aplikasi Jitsi)
  const nama = JSON.stringify(profil?.name || 'Peserta');
  const alamat = `${ruang}#config.disableDeepLinking=true&config.prejoinConfig.enabled=true&userInfo.displayName=${encodeURIComponent(nama)}`;

  const keluar = () => Alert.alert('Tinggalkan vicon?', 'Anda akan keluar dari ruang kelas online.', [
    { text: 'Tetap di kelas', style: 'cancel' },
    { text: 'Keluar', style: 'destructive', onPress: () => nav.goBack() },
  ]);

  useLayoutEffect(() => {
    nav.setOptions({
      title: params?.judul ? `Vicon · ${params.judul}` : 'Vicon Kelas',
      headerLeft: () => (
        <Pressable onPress={keluar} hitSlop={12} style={{ marginRight: jarak.m }}>
          <Ionicons name="close" size={24} color={warna.putih} />
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={() => Linking.openURL(ruang)} hitSlop={12}>
          <Ionicons name="open-outline" size={22} color={warna.putih} />
        </Pressable>
      ),
    });
  }, [nav, params?.judul, ruang]);

  // Tombol kembali Android meminta konfirmasi agar tidak keluar kelas tanpa sengaja
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { keluar(); return true; });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO])
      .then((h) => setIzin(h[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED))
      .catch(() => setIzin(false));
  }, []);

  if (!ruang) return <Layar><Galat pesan="Tautan vicon tidak tersedia." /></Layar>;
  if (galat) return <Layar><Galat pesan={galat} onUlang={() => { setGalat(null); webRef.current?.reload(); }} ikon="videocam-off-outline" /></Layar>;
  if (izin === null) return <Layar><Text style={{ textAlign: 'center', color: warna.redup }}>Meminta izin kamera & mikrofon…</Text></Layar>;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {!izin ? (
        <View style={{ backgroundColor: '#fef3c7', padding: jarak.s }}>
          <Text style={{ color: '#92400e', fontSize: 12 }}>Izin mikrofon ditolak — Anda tetap bisa menyimak. Aktifkan di Pengaturan Android › Aplikasi › SIAKAD untuk berbicara.</Text>
        </View>
      ) : null}
      <WebView
        ref={webRef}
        source={{ uri: alamat }}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        mediaCapturePermissionGrantType="grant"
        allowsFullscreenVideo
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(r) => {
          // tautan non-web (intent://, market://, mailto:) dibuka oleh aplikasi yang sesuai
          if (/^https?:|^about:|^blob:|^data:/i.test(r.url)) return true;
          Linking.openURL(r.url).catch(() => {});
          return false;
        }}
        onLoadEnd={() => setMemuat(false)}
        onError={() => setGalat('Ruang vicon gagal dimuat. Periksa koneksi internet Anda.')}
        style={{ flex: 1 }}
      />
      {memuat ? (
        <View style={{ position: 'absolute', top: '45%', left: 0, right: 0, alignItems: 'center' }}>
          <ActivityIndicator color={warna.putih} size="large" />
          <Text style={{ color: warna.putih, marginTop: jarak.s, fontSize: 12 }}>Menyiapkan ruang kelas…</Text>
        </View>
      ) : null}
    </View>
  );
}
