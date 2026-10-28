import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Pressable, Text, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ApiError, permintaan } from '../api/client';
import { ambilServer } from '../api/config';
import { Galat, Layar } from '../components/ui';
import { jarak, warna } from '../theme';

/**
 * Popup SIAKAD web di dalam aplikasi. Aplikasi meminta tautan masuk sekali pakai (/api/web/sesi) sehingga
 * pengguna langsung masuk tanpa mengetik ulang email & kata sandi, dan tidak berpindah ke browser.
 */
export default function WebScreen() {
  const nav = useNavigation<any>();
  const { params }: any = useRoute();
  const tujuan: string = params?.tujuan || '/dashboard';
  const webRef = useRef<WebView>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [server, setServer] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [bisaKembali, setBisaKembali] = useState(false);

  const mulai = useCallback(async () => {
    setGalat(null);
    setUrl(null);
    try {
      setServer(await ambilServer());
      const r = await permintaan<{ url: string }>('/web/sesi', { body: { tujuan } });
      setUrl(r.url);
    } catch (e: any) {
      setGalat(e instanceof ApiError ? e.message : 'Tidak dapat membuka SIAKAD web.');
    }
  }, [tujuan]);

  useEffect(() => { mulai(); }, [mulai]);

  useLayoutEffect(() => {
    nav.setOptions({
      title: params?.judul || 'SIAKAD Web',
      headerLeft: () => (
        <Pressable onPress={() => nav.goBack()} hitSlop={12} style={{ marginRight: jarak.m }}>
          <Ionicons name="close" size={24} color={warna.putih} />
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={() => (url ? webRef.current?.reload() : mulai())} hitSlop={12}>
          <Ionicons name="refresh" size={22} color={warna.putih} />
        </Pressable>
      ),
    });
  }, [nav, params?.judul, url, mulai]);

  // Tombol kembali Android: mundur di dalam halaman web dulu, baru tutup popup
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (bisaKembali) {
        webRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [bisaKembali]);

  // Tautan ke luar SIAKAD (vicon, WhatsApp, peta, email) dibuka dengan aplikasi yang sesuai
  const izinkan = (req: WebViewNavigation) => {
    const u = req.url || '';
    if (u.startsWith('about:') || u.startsWith('data:') || u.startsWith('blob:')) return true;
    const asal = (url || '').match(/^https?:\/\/[^/]+/i)?.[0];
    if ((server && u.startsWith(server)) || (asal && u.startsWith(asal))) return true;
    Linking.openURL(u).catch(() => {});
    return false;
  };

  if (galat) {
    return <Layar><Galat pesan={galat} onUlang={mulai} ikon="globe-outline" /></Layar>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: warna.putih }}>
      {url ? (
        <WebView
          ref={webRef}
          source={{ uri: url }}
          incognito
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures
          onShouldStartLoadWithRequest={izinkan}
          onNavigationStateChange={(n) => setBisaKembali(n.canGoBack)}
          onLoadStart={() => setMemuat(true)}
          onLoadEnd={() => setMemuat(false)}
          onError={() => setGalat('Halaman SIAKAD web gagal dimuat. Periksa koneksi internet Anda.')}
          onHttpError={(e) => { if (e.nativeEvent.statusCode >= 500) setGalat('Server SIAKAD sedang bermasalah (kode ' + e.nativeEvent.statusCode + ').'); }}
          style={{ flex: 1 }}
        />
      ) : null}
      {memuat ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: jarak.s, alignItems: 'center', backgroundColor: 'rgba(241,245,249,0.92)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator color={warna.gelap} />
            <Text style={{ marginLeft: jarak.s, color: warna.gelap, fontSize: 12, fontWeight: '700' }}>{url ? 'Memuat halaman…' : 'Masuk otomatis ke SIAKAD web…'}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
