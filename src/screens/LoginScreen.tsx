import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { ApiError, permintaan } from '../api/client';
import { ambilServer, normalisasi, serverBawaan, simpanServer, versiAplikasi } from '../api/config';
import { Isian, Kartu, s, Tombol } from '../components/ui';
import { jarak, warna } from '../theme';

export default function LoginScreen() {
  const { masuk } = useAuth();
  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [lihatSandi, setLihatSandi] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [server, setServer] = useState('');
  const [modalServer, setModalServer] = useState(false);

  useEffect(() => { ambilServer().then(setServer); }, []);

  const kirim = async () => {
    setPesan(null);
    if (!email.trim() || !sandi) {
      setPesan('Isi email dan kata sandi terlebih dahulu.');
      return;
    }
    setMemuat(true);
    try {
      await masuk(email, sandi);
    } catch (e: any) {
      setPesan(e instanceof ApiError ? e.message : 'Gagal masuk. Coba lagi.');
    } finally {
      setMemuat(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: warna.latar }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: jarak.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: jarak.xl }}>
          <Image source={require('../../assets/logo.png')} style={{ width: 110, height: 110 }} resizeMode="contain" />
          <Text style={{ fontSize: 22, fontWeight: '900', color: warna.gelap, marginTop: jarak.m }}>SIAKAD STT GPI PAPUA</Text>
          <Text style={[s.redup, { marginTop: 4 }]}>Sistem Informasi Akademik</Text>
        </View>

        <Kartu judul="Masuk ke akun Anda" ikon="log-in-outline">
          <Isian label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
            autoComplete="email" placeholder="nama@sttgpi.ac.id" />
          <View>
            <Isian label="Kata sandi" value={sandi} onChangeText={setSandi} secureTextEntry={!lihatSandi}
              autoComplete="password" placeholder="••••••••" onSubmitEditing={kirim} />
            <Pressable onPress={() => setLihatSandi(!lihatSandi)} style={{ position: 'absolute', right: 10, top: 32 }} hitSlop={10}>
              <Ionicons name={lihatSandi ? 'eye-off-outline' : 'eye-outline'} size={22} color={warna.redup} />
            </Pressable>
          </View>
          {pesan ? (
            <View style={{ flexDirection: 'row', backgroundColor: '#fee2e2', borderColor: '#fca5a5', borderWidth: 1, padding: jarak.s, marginBottom: jarak.m }}>
              <Ionicons name="alert-circle" size={18} color={warna.bahaya} />
              <Text style={{ color: '#991b1b', marginLeft: 6, flex: 1 }}>{pesan}</Text>
            </View>
          ) : null}
          <Tombol teks="Masuk" ikon="log-in-outline" onPress={kirim} memuat={memuat} />
          <Text style={[s.redupKecil, { textAlign: 'center', marginTop: jarak.m }]}>
            Lupa kata sandi? Gunakan menu "Lupa Password" di SIAKAD web atau hubungi BAAK.
          </Text>
        </Kartu>

        <Pressable onPress={() => setModalServer(true)} style={{ alignItems: 'center', padding: jarak.s }}>
          <Text style={s.redupKecil}>Server: {server || '-'}  ·  v{versiAplikasi().nama}</Text>
          <Text style={[s.redupKecil, { textDecorationLine: 'underline' }]}>Ubah alamat server</Text>
        </Pressable>
      </ScrollView>

      <ModalServer terlihat={modalServer} awal={server} onTutup={() => setModalServer(false)}
        onSimpan={async (u) => { await simpanServer(u); setServer(normalisasi(u)); setModalServer(false); }} />
    </KeyboardAvoidingView>
  );
}

function ModalServer({ terlihat, awal, onTutup, onSimpan }: { terlihat: boolean; awal: string; onTutup: () => void; onSimpan: (u: string) => void }) {
  const [url, setUrl] = useState(awal);
  const [uji, setUji] = useState<string | null>(null);
  const [menguji, setMenguji] = useState(false);
  useEffect(() => { setUrl(awal); setUji(null); }, [awal, terlihat]);

  const ujiKoneksi = async () => {
    setMenguji(true);
    setUji(null);
    const lama = await ambilServer();
    await simpanServer(url);
    try {
      await permintaan('/check-version', { tanpaToken: true, timeout: 10000 });
      setUji('Terhubung ke server SIAKAD.');
    } catch (e: any) {
      setUji('Gagal: ' + (e?.message || 'server tidak dapat dihubungi'));
    } finally {
      await simpanServer(lama);
      setMenguji(false);
    }
  };

  return (
    <Modal visible={terlihat} transparent animationType="fade" onRequestClose={onTutup}>
      <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: jarak.xl }}>
        <Kartu judul="Alamat server SIAKAD" ikon="server-outline">
          <Isian label="Alamat (URL)" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" placeholder="https://siakad.sttgpi.ac.id" />
          {uji ? <Text style={[s.teks, { marginBottom: jarak.m }]}>{uji}</Text> : null}
          <Tombol teks="Uji koneksi" jenis="garis" ikon="pulse-outline" onPress={ujiKoneksi} memuat={menguji} gaya={{ marginBottom: jarak.s }} />
          <Tombol teks="Simpan" ikon="save-outline" onPress={() => onSimpan(url)} gaya={{ marginBottom: jarak.s }} />
          <Tombol teks="Kembalikan bawaan" jenis="garis" onPress={() => setUrl(serverBawaan())} gaya={{ marginBottom: jarak.s }} />
          <Tombol teks="Batal" jenis="garis" onPress={onTutup} />
        </Kartu>
      </View>
    </Modal>
  );
}
