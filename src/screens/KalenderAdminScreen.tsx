import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ApiError, permintaan } from '../api/client';
import { Galat, Isian, Kartu, Kosong, Lencana, Muat, s, Tombol } from '../components/ui';
import Lembar, { Pilihan } from '../components/Lembar';
import PilihTanggal, { keIso, labelTanggal } from '../components/PilihTanggal';
import { jarak, sudut, warna } from '../theme';

/**
 * Panel kendali Kalender Akademik (khusus Admin). Sama dengan halaman web Admin → Kalender:
 * acara berjenis selain "Informasi" otomatis membuka/menutup KRS, validasi KRS, EDOM, input nilai, dan PMB.
 */

type Acara = {
  id: number; judul_kegiatan: string; deskripsi?: string; tanggal_mulai: string; tanggal_selesai: string;
  jenis: string; jenis_label: string; pengendali: boolean; status: string;
  tahun_akademik_id?: number; tahun_akademik?: string; pmb_period_id?: number; pmb?: string;
  target_roles: number[]; peran: string[];
};
type Opsi = {
  jenis: { kunci: string; label: string; butuh: 'tahun_akademik' | 'pmb' | null }[];
  peran: { id: number; nama: string }[];
  tahun_akademik: { id: number; nama: string; aktif: boolean }[];
  pmb: { id: number; nama: string }[];
};
type Ringkasan = {
  tahun_akademik?: string; saklar_krs: 'buka' | 'tutup'; krs_buka: boolean; krs_pesan?: string;
  jenis: { jenis: string; label: string; id?: number; status: string; mulai?: string; selesai?: string; acara?: Acara | null }[];
};

const SINGKAT: Record<string, string> = {
  informasi: 'Informasi', krs: 'Pengisian KRS', validasi_krs: 'Validasi KRS', edom: 'EDOM', input_nilai: 'Input nilai', pmb: 'PMB',
};
const EFEK: Record<string, string> = {
  informasi: 'Hanya tampil di kalender, tanpa efek ke sistem.',
  krs: 'Mahasiswa hanya bisa mengisi/mengubah KRS di rentang ini. Tanggal KRS Tahun Akademik ikut diperbarui.',
  validasi_krs: 'Dosen Wali & Kaprodi hanya bisa memvalidasi KRS di rentang ini. Admin tetap bisa kapan saja.',
  edom: 'Sesi evaluasi dosen (EDOM) dibuka otomatis di rentang ini.',
  input_nilai: 'Dosen hanya bisa menyimpan nilai di rentang ini. Admin tetap bisa kapan saja.',
  pmb: 'Pendaftaran gelombang PMB dibuka dan ditutup sesuai rentang ini.',
};
const STATUS: Record<string, [string, string]> = {
  berlangsung: ['Berlangsung', 'sukses'], akan_datang: ['Akan datang', 'info'], selesai: ['Selesai', 'redup'], tidak_dijadwalkan: ['Belum dijadwalkan', 'peringatan'],
};
const FILTER = [
  { nilai: '', label: 'Semua' }, { nilai: 'pengendali', label: 'Pengendali' }, { nilai: 'berlangsung', label: 'Berlangsung' },
  { nilai: 'akan_datang', label: 'Akan datang' }, { nilai: 'selesai', label: 'Selesai' },
];

type Form = {
  id?: number; judul_kegiatan: string; deskripsi: string; tanggal_mulai: string; tanggal_selesai: string;
  jenis: string; tahun_akademik_id?: number | null; pmb_period_id?: number | null; target_roles: number[];
};

export default function KalenderAdminScreen() {
  const [daftar, setDaftar] = useState<Acara[]>([]);
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
  const [opsi, setOpsi] = useState<Opsi | null>(null);
  const [halaman, setHalaman] = useState({ kini: 1, akhir: 1, total: 0 });
  const [cari, setCari] = useState('');
  const [filter, setFilter] = useState('');
  const [memuat, setMemuat] = useState(true);
  const [menyegarkan, setMenyegarkan] = useState(false);
  const [memuatLagi, setMemuatLagi] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [galatForm, setGalatForm] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [ubahSaklar, setUbahSaklar] = useState(false);
  const urutan = useRef(0);

  const muat = useCallback(async (hal = 1, mode: 'awal' | 'segar' | 'lagi' = 'awal') => {
    const no = ++urutan.current;
    mode === 'segar' ? setMenyegarkan(true) : mode === 'lagi' ? setMemuatLagi(true) : setMemuat(true);
    try {
      const qs = new URLSearchParams();
      if (cari.trim()) qs.set('q', cari.trim());
      if (filter === 'pengendali') qs.set('jenis', 'pengendali');
      else if (filter) qs.set('status', filter);
      qs.set('page', String(hal));
      const [res, o] = await Promise.all([
        permintaan<any>('/admin/kalender?' + qs.toString()),
        opsi ? Promise.resolve(opsi) : permintaan<Opsi>('/admin/kalender/opsi'),
      ]);
      if (no !== urutan.current) return; // hasil pencarian lama, abaikan
      setDaftar((d) => (hal > 1 ? [...d, ...res.data] : res.data));
      setHalaman({ kini: res.halaman, akhir: res.halaman_terakhir, total: res.total });
      setRingkasan(res.ringkasan);
      setOpsi(o);
      setGalat(null);
    } catch (e: any) {
      if (no === urutan.current) setGalat(e instanceof ApiError ? e.message : 'Gagal memuat kalender.');
    } finally {
      if (no === urutan.current) { setMemuat(false); setMenyegarkan(false); setMemuatLagi(false); }
    }
  }, [cari, filter, opsi]);

  // Cari otomatis 350 md setelah berhenti mengetik / ganti filter
  useEffect(() => {
    const t = setTimeout(() => muat(1, daftar.length ? 'segar' : 'awal'), cari ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cari, filter]);
  const muatTerkini = useRef(muat);
  muatTerkini.current = muat;
  const pernahFokus = useRef(false);
  useFocusEffect(useCallback(() => {
    if (pernahFokus.current) muatTerkini.current(1, 'segar');
    pernahFokus.current = true;
  }, []));

  const formBaru = (jenis = 'informasi'): Form => {
    const taAktif = opsi?.tahun_akademik.find((t) => t.aktif)?.id ?? opsi?.tahun_akademik[0]?.id ?? null;
    return {
      judul_kegiatan: jenis === 'informasi' ? '' : SINGKAT[jenis] + (ringkasan?.tahun_akademik ? ' ' + ringkasan.tahun_akademik : ''),
      deskripsi: '', tanggal_mulai: keIso(new Date()), tanggal_selesai: keIso(new Date()), jenis,
      tahun_akademik_id: taAktif, pmb_period_id: opsi?.pmb[0]?.id ?? null, target_roles: (opsi?.peran || []).map((p) => p.id),
    };
  };
  const bukaForm = (a?: Acara, jenis?: string) => {
    setGalatForm(null);
    setForm(a ? {
      id: a.id, judul_kegiatan: a.judul_kegiatan, deskripsi: a.deskripsi || '', tanggal_mulai: a.tanggal_mulai, tanggal_selesai: a.tanggal_selesai,
      jenis: a.jenis, tahun_akademik_id: a.tahun_akademik_id, pmb_period_id: a.pmb_period_id, target_roles: a.target_roles,
    } : formBaru(jenis));
  };
  // Ketuk baris kendali: ubah acaranya bila sudah dijadwalkan, atau buat baru dengan jenis tersebut
  const bukaDariRingkasan = (j: Ringkasan['jenis'][number]) => (j.acara ? bukaForm(j.acara) : bukaForm(undefined, j.jenis));

  const simpan = async () => {
    if (!form) return;
    setGalatForm(null);
    if (!form.judul_kegiatan.trim()) return setGalatForm('Judul kegiatan wajib diisi.');
    if (form.tanggal_selesai < form.tanggal_mulai) return setGalatForm('Tanggal selesai tidak boleh sebelum tanggal mulai.');
    if (!form.target_roles.length) return setGalatForm('Pilih minimal satu peran yang melihat agenda ini.');
    const butuh = opsi?.jenis.find((j) => j.kunci === form.jenis)?.butuh;
    if (butuh === 'tahun_akademik' && !form.tahun_akademik_id) return setGalatForm('Pilih Tahun Akademik yang dikendalikan.');
    if (butuh === 'pmb' && !form.pmb_period_id) return setGalatForm('Pilih Gelombang PMB yang dikendalikan.');
    setMenyimpan(true);
    try {
      const body = { ...form, judul_kegiatan: form.judul_kegiatan.trim(), deskripsi: form.deskripsi.trim() || null };
      const res = await permintaan<any>(form.id ? `/admin/kalender/${form.id}` : '/admin/kalender', { method: form.id ? 'PUT' : 'POST', body });
      setForm(null);
      Alert.alert('Tersimpan', res?.message || 'Agenda tersimpan.');
      muat(1, 'segar');
    } catch (e: any) {
      setGalatForm(e instanceof ApiError ? e.message : 'Gagal menyimpan agenda.');
    } finally {
      setMenyimpan(false);
    }
  };

  const hapus = () => {
    if (!form?.id) return;
    const pengendali = form.jenis !== 'informasi';
    Alert.alert('Hapus agenda?', pengendali
      ? 'Kendali otomatis dilepas. Tanggal terakhir tetap tersimpan di pengaturan terkait dan bisa diubah manual di web.'
      : 'Agenda akan hilang dari kalender semua pengguna.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await permintaan(`/admin/kalender/${form.id}`, { method: 'DELETE' });
          setForm(null);
          muat(1, 'segar');
        } catch (e: any) {
          setGalatForm(e instanceof ApiError ? e.message : 'Gagal menghapus.');
        }
      } },
    ]);
  };

  const alihSaklar = (tutup: boolean) => {
    Alert.alert(tutup ? 'Tutup darurat pengisian KRS?' : 'Lepas tutup darurat?', tutup
      ? 'Semua mahasiswa tidak bisa mengisi/mengubah KRS walau kalender masih membuka periode KRS.'
      : 'Pengisian KRS kembali mengikuti tanggal di kalender.', [
      { text: 'Batal', style: 'cancel' },
      { text: tutup ? 'Tutup KRS' : 'Lepaskan', style: tutup ? 'destructive' : 'default', onPress: async () => {
        setUbahSaklar(true);
        try {
          const res = await permintaan<any>('/admin/kalender/saklar-krs', { body: { status: tutup ? 'tutup' : 'buka' } });
          setRingkasan(res.ringkasan);
        } catch (e: any) {
          Alert.alert('Gagal', e instanceof ApiError ? e.message : 'Saklar tidak berubah.');
        } finally {
          setUbahSaklar(false);
        }
      } },
    ]);
  };

  if (memuat && !daftar.length && !ringkasan) return <Muat teks="Memuat kalender akademik…" />;
  if (galat && !ringkasan) return <View style={[s.layar, { padding: jarak.l }]}><Galat pesan={galat} onUlang={() => muat(1)} /></View>;

  const butuhForm = form ? opsi?.jenis.find((j) => j.kunci === form.jenis)?.butuh : null;
  const ubah = (b: Partial<Form>) => setForm((f) => (f ? { ...f, ...b } : f));

  return (
    <View style={{ flex: 1, backgroundColor: warna.latar }}>
      <ScrollView contentContainerStyle={{ padding: jarak.l, paddingBottom: 110 }} keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={menyegarkan} onRefresh={() => muat(1, 'segar')} colors={[warna.gelap]} />}>

        {ringkasan ? (
          <Kartu gelap judul={'Kendali sistem · ' + (ringkasan.tahun_akademik || 'tidak ada TA aktif')} ikon="options-outline">
            {ringkasan.jenis.map((j) => {
              const [lbl, jns] = STATUS[j.status] || [j.status, 'redup'];
              return (
                <Pressable key={j.jenis} onPress={() => bukaDariRingkasan(j)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: warna.putih, fontWeight: '800' }}>{SINGKAT[j.jenis] || j.label}</Text>
                    <Text style={{ color: '#cbd5e1', fontSize: 12 }}>{j.mulai ? `${labelTanggal(j.mulai, true)} – ${labelTanggal(j.selesai, true)}` : 'Ketuk untuk menjadwalkan'}</Text>
                  </View>
                  <Lencana teks={lbl} jenis={jns} />
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 6 }} />
                </Pressable>
              );
            })}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: jarak.m }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: warna.putih, fontWeight: '800' }}>Tutup darurat KRS</Text>
                <Text style={{ color: ringkasan.krs_buka ? '#86efac' : '#fca5a5', fontSize: 12 }}>
                  {ringkasan.krs_buka ? 'KRS sedang DIBUKA untuk mahasiswa' : (ringkasan.krs_pesan || 'KRS sedang ditutup')}
                </Text>
              </View>
              {ubahSaklar ? <ActivityIndicator color={warna.putih} /> : (
                <Switch value={ringkasan.saklar_krs === 'tutup'} onValueChange={alihSaklar} trackColor={{ true: warna.bahaya, false: '#475569' }} thumbColor={warna.putih} />
              )}
            </View>
          </Kartu>
        ) : null}

        <View style={[s.isian, { flexDirection: 'row', alignItems: 'center', paddingVertical: 0, marginBottom: jarak.s, backgroundColor: warna.kartu }]}>
          <Ionicons name="search" size={16} color={warna.redup} />
          <TextInput value={cari} onChangeText={setCari} placeholder="Cari judul atau keterangan agenda" placeholderTextColor={warna.redup}
            style={{ flex: 1, paddingVertical: 10, marginLeft: 6, color: warna.teks }} returnKeyType="search" />
          {cari ? <Pressable onPress={() => setCari('')} hitSlop={10}><Ionicons name="close-circle" size={18} color={warna.redup} /></Pressable> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: jarak.s }}>
          <Pilihan opsi={FILTER} nilai={filter} onPilih={setFilter} />
        </ScrollView>
        <Text style={[s.redupKecil, { marginBottom: jarak.s }]}>{halaman.total} agenda{menyegarkan ? ' · memperbarui…' : ''}</Text>

        {!daftar.length ? <Kartu><Kosong teks={cari || filter ? 'Tidak ada agenda yang cocok.' : 'Belum ada agenda.'} ikon="calendar-clear-outline" /></Kartu> : null}
        {daftar.map((a) => {
          const [lbl, jns] = STATUS[a.status] || [a.status, 'redup'];
          return (
            <Pressable key={a.id} onPress={() => bukaForm(a)} style={({ pressed }) => [s.kartu, { padding: jarak.m, opacity: pressed ? 0.85 : 1, borderTopColor: a.pengendali ? warna.primer : warna.garis }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: jarak.s }}>
                  <Text style={{ fontWeight: '800', color: warna.teks }}>{a.judul_kegiatan}</Text>
                  <Text style={s.redupKecil}>{labelTanggal(a.tanggal_mulai, true)}{a.tanggal_selesai !== a.tanggal_mulai ? ' – ' + labelTanggal(a.tanggal_selesai, true) : ''}</Text>
                </View>
                <Lencana teks={lbl} jenis={jns} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
                {a.pengendali ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: jarak.s }}>
                    <Ionicons name="flash" size={12} color={warna.primer} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: warna.primer, marginLeft: 2 }}>{(SINGKAT[a.jenis] || a.jenis_label).toUpperCase()}</Text>
                  </View>
                ) : null}
                {a.tahun_akademik || a.pmb ? <Text style={[s.redupKecil, { marginRight: jarak.s }]}>{a.tahun_akademik || a.pmb}</Text> : null}
                <Text style={s.redupKecil} numberOfLines={1}>{a.peran.join(', ')}</Text>
              </View>
            </Pressable>
          );
        })}
        {halaman.kini < halaman.akhir ? (
          <Tombol teks="Muat lebih banyak" jenis="garis" memuat={memuatLagi} onPress={() => muat(halaman.kini + 1, 'lagi')} />
        ) : null}
      </ScrollView>

      <Pressable onPress={() => bukaForm()} style={({ pressed }) => ({
        position: 'absolute', right: jarak.l, bottom: jarak.l, backgroundColor: warna.gelap, borderRadius: sudut * 2,
        paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.85 : 1, elevation: 4,
      })}>
        <Ionicons name="add" size={20} color={warna.putih} />
        <Text style={{ color: warna.putih, fontWeight: '900', marginLeft: 4 }}>AGENDA</Text>
      </Pressable>

      <Lembar terlihat={!!form} judul={form?.id ? 'Ubah agenda' : 'Agenda baru'} onTutup={() => setForm(null)}>
        {form ? (
          <>
            <Text style={s.label}>JENIS / EFEK KE SISTEM</Text>
            <Pilihan opsi={(opsi?.jenis || []).map((j) => ({ nilai: j.kunci, label: SINGKAT[j.kunci] || j.label }))} nilai={form.jenis}
              onPilih={(v) => ubah({ jenis: v })} />
            <View style={{ flexDirection: 'row', backgroundColor: form.jenis === 'informasi' ? warna.kartu : '#eff6ff', borderRadius: sudut, padding: jarak.s, marginBottom: jarak.m }}>
              <Ionicons name={form.jenis === 'informasi' ? 'information-circle-outline' : 'flash-outline'} size={16} color={warna.primer} />
              <Text style={[s.redupKecil, { flex: 1, marginLeft: 6, color: warna.teks }]}>{EFEK[form.jenis]}</Text>
            </View>

            {butuhForm === 'tahun_akademik' ? (
              <>
                <Text style={s.label}>TAHUN AKADEMIK YANG DIKENDALIKAN</Text>
                <Pilihan opsi={(opsi?.tahun_akademik || []).slice(0, 6).map((t) => ({ nilai: t.id, label: t.nama + (t.aktif ? ' ●' : '') }))}
                  nilai={form.tahun_akademik_id} onPilih={(v) => ubah({ tahun_akademik_id: v })} />
              </>
            ) : null}
            {butuhForm === 'pmb' ? (
              <>
                <Text style={s.label}>GELOMBANG PMB</Text>
                {opsi?.pmb.length ? (
                  <Pilihan opsi={opsi.pmb.slice(0, 8).map((p) => ({ nilai: p.id, label: p.nama }))} nilai={form.pmb_period_id} onPilih={(v) => ubah({ pmb_period_id: v })} />
                ) : <Text style={[s.redupKecil, { marginBottom: jarak.m, color: warna.bahaya }]}>Belum ada gelombang PMB. Buat dulu di SIAKAD web.</Text>}
              </>
            ) : null}

            <Isian label="Judul kegiatan" value={form.judul_kegiatan} onChangeText={(t) => ubah({ judul_kegiatan: t })} placeholder="mis. Pengisian KRS Ganjil" />
            <View style={{ flexDirection: 'row' }}>
              <PilihTanggal label="Mulai" nilai={form.tanggal_mulai}
                onPilih={(v) => ubah({ tanggal_mulai: v, tanggal_selesai: form.tanggal_selesai < v ? v : form.tanggal_selesai })} />
              <View style={{ width: jarak.s }} />
              <PilihTanggal label="Selesai (ikut dihitung)" nilai={form.tanggal_selesai} minimal={form.tanggal_mulai} onPilih={(v) => ubah({ tanggal_selesai: v })} />
            </View>
            {form.jenis !== 'informasi' ? (
              <Text style={[s.redupKecil, { marginTop: -6, marginBottom: jarak.m }]}>Berlaku sampai {labelTanggal(form.tanggal_selesai)} pukul 23.59 WIT.</Text>
            ) : null}
            <Isian label="Keterangan (opsional)" value={form.deskripsi} onChangeText={(t) => ubah({ deskripsi: t })} multiline
              style={{ minHeight: 70, textAlignVertical: 'top' }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={[s.label, { flex: 1, marginBottom: 0 }]}>DITAMPILKAN & DIBERITAHUKAN KE</Text>
              <Pressable hitSlop={8} onPress={() => ubah({ target_roles: form.target_roles.length === (opsi?.peran.length || 0) ? [] : (opsi?.peran || []).map((p) => p.id) })}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: warna.primer }}>{form.target_roles.length === (opsi?.peran.length || 0) ? 'KOSONGKAN' : 'PILIH SEMUA'}</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: jarak.m }}>
              {(opsi?.peran || []).map((p) => {
                const aktif = form.target_roles.includes(p.id);
                return (
                  <Pressable key={p.id} onPress={() => ubah({ target_roles: aktif ? form.target_roles.filter((x) => x !== p.id) : [...form.target_roles, p.id] })}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, marginRight: 6, marginBottom: 6, borderRadius: sudut, borderWidth: 1,
                      borderColor: aktif ? warna.gelap : warna.garis, backgroundColor: aktif ? warna.gelap : warna.putih }}>
                    <Ionicons name={aktif ? 'checkmark' : 'add'} size={13} color={aktif ? warna.putih : warna.redup} />
                    <Text style={{ fontSize: 12, fontWeight: '700', marginLeft: 3, color: aktif ? warna.putih : warna.gelap }}>{p.nama}</Text>
                  </Pressable>
                );
              })}
            </View>
            {!form.id ? <Text style={[s.redupKecil, { marginBottom: jarak.m }]}>Pengguna dengan peran terpilih mendapat notifikasi (dan push di HP) saat agenda dibuat.</Text> : null}

            {galatForm ? <Text style={{ color: warna.bahaya, marginBottom: jarak.s }}>{galatForm}</Text> : null}
            <Tombol teks={form.id ? 'Simpan perubahan' : 'Tambahkan agenda'} ikon="save-outline" memuat={menyimpan} onPress={simpan} />
            {form.id ? <Tombol teks="Hapus agenda" ikon="trash-outline" jenis="garis" onPress={hapus} gaya={{ marginTop: jarak.s, borderColor: warna.bahaya }} /> : null}
          </>
        ) : null}
      </Lembar>
    </View>
  );
}
