import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jarak, sudut, warna } from '../theme';

/** Lembar formulir dari bawah layar (dipakai untuk tambah materi, tugas, presensi, jurnal, dst.). */
export default function Lembar({ terlihat, judul, onTutup, children }: {
  terlihat: boolean; judul: string; onTutup: () => void; children: React.ReactNode;
}) {
  return (
    <Modal visible={terlihat} transparent animationType="slide" onRequestClose={onTutup}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable onPress={onTutup} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' }} />
        <View style={{ backgroundColor: warna.latar, borderTopLeftRadius: sudut * 3, borderTopRightRadius: sudut * 3, maxHeight: '88%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: jarak.l, borderBottomWidth: 1, borderBottomColor: warna.garis, backgroundColor: warna.kartu, borderTopLeftRadius: sudut * 3, borderTopRightRadius: sudut * 3 }}>
            <Text style={{ flex: 1, fontWeight: '900', color: warna.gelap, fontSize: 15 }}>{judul}</Text>
            <Pressable onPress={onTutup} hitSlop={12}><Ionicons name="close" size={22} color={warna.redup} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: jarak.l, paddingBottom: jarak.xl * 2 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Deretan pilihan (chip). */
export function Pilihan({ opsi, nilai, onPilih }: {
  opsi: { nilai: any; label: string }[]; nilai: any; onPilih: (v: any) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: jarak.m }}>
      {opsi.map((o) => {
        const aktif = o.nilai === nilai;
        return (
          <Pressable key={String(o.nilai)} onPress={() => onPilih(o.nilai)}
            style={{ paddingVertical: 8, paddingHorizontal: 12, marginRight: 6, marginBottom: 6, borderRadius: sudut, borderWidth: 1,
              borderColor: aktif ? warna.gelap : warna.garis, backgroundColor: aktif ? warna.gelap : warna.putih }}>
            <Text style={{ fontWeight: '800', fontSize: 12, color: aktif ? warna.putih : warna.gelap }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
