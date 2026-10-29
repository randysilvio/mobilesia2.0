import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../api/useData';
import { Angka, Baris, Kartu, Kosong, Layar, Lencana, s, jenisStatus } from '../components/ui';
import { angka, hariIni, jam, tanggal } from '../utils/format';
import { jarak, warna } from '../theme';

const LABEL_PERAN: Record<string, string> = {
  mahasiswa: 'Mahasiswa', dosen: 'Dosen', pegawai: 'Pegawai / Tendik', camaba: 'Calon Mahasiswa', umum: 'Pengguna',
};

export default function HomeScreen() {
  const { profil, peran } = useAuth();
  const nav = useNavigation<any>();
  const butuhJadwal = peran === 'mahasiswa' || peran === 'dosen';
  const butuhAbsensi = peran === 'dosen' || peran === 'pegawai';

  const jadwal = useData<any[]>(butuhJadwal ? '/jadwal-kuliah' : null);
  const khs = useData<any>(peran === 'mahasiswa' ? '/khs-mahasiswa' : null);
  const validasi = useData<any[]>(peran === 'dosen' ? '/krs/perlu-validasi' : null);
  const absensi = useData<any>(butuhAbsensi ? '/status-absensi' : null);
  const notif = useData<any[]>('/notifikasi');
  const verum = useData<any>(butuhJadwal ? '/verum/kelas' : null);

  const segarkan = () => {
    notif.segarkan();
    butuhJadwal && jadwal.segarkan();
    peran === 'mahasiswa' && khs.segarkan();
    peran === 'dosen' && validasi.segarkan();
    butuhAbsensi && absensi.segarkan();
    butuhJadwal && verum.segarkan();
  };
  const kelasRamai = (Array.isArray(verum.data?.data) ? verum.data.data : []).filter((k: any) => k.is_meeting_active || k.presensi_terbuka);

  const hari = hariIni();
  const jadwalHariIni = (Array.isArray(jadwal.data) ? jadwal.data : [])
    .filter((j) => String(j.hari).toLowerCase() === hari.toLowerCase())
    .sort((a, b) => String(a.jam_mulai).localeCompare(String(b.jam_mulai)));
  const belumDibaca = (Array.isArray(notif.data) ? notif.data : []).filter((n) => !n.read_at).length;

  return (
    <Layar menyegarkan={notif.menyegarkan} onSegarkan={segarkan} luring={notif.luring}>
      <Kartu gelap>
        <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '700' }}>SHALOM,</Text>
        <Text style={{ color: warna.putih, fontSize: 20, fontWeight: '900', marginTop: 2 }} numberOfLines={2}>{profil?.name || '-'}</Text>
        <View style={{ flexDirection: 'row', marginTop: jarak.s, alignItems: 'center' }}>
          <Lencana teks={LABEL_PERAN[peran] + (profil?.is_kaprodi ? ' · Kaprodi' : '')} jenis="info" />
          <Text style={{ color: '#cbd5e1', fontSize: 12, marginLeft: jarak.s }}>{hari}, {tanggal(new Date().toISOString())}</Text>
        </View>
      </Kartu>

      {peran === 'mahasiswa' ? (
        <View style={{ flexDirection: 'row', marginBottom: jarak.m }}>
          {[
            { ikon: 'card-outline', label: 'E-KTM', ke: 'Ktm' },
            { ikon: 'ribbon-outline', label: 'KHS', ke: 'Khs' },
            { ikon: 'school-outline', label: 'Verum', ke: 'VerumTab' },
            { ikon: 'wallet-outline', label: 'Tagihan', ke: 'Tagihan' },
          ].map((t, i) => (
            <Pressable key={t.ke} onPress={() => nav.navigate(t.ke)}
              style={({ pressed }) => [s.kartu, { flex: 1, alignItems: 'center', paddingVertical: jarak.m, paddingHorizontal: 4, marginBottom: 0, marginLeft: i ? jarak.s : 0, opacity: pressed ? 0.8 : 1 }]}>
              <Ionicons name={t.ikon as any} size={24} color={warna.gelap} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: warna.gelap, marginTop: 4 }}>{t.label.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {(profil?.roles || []).includes('admin') ? (
        <Pressable onPress={() => nav.navigate('KalenderAdmin')}>
          <Kartu judul="Panel kalender akademik" ikon="options-outline" gaya={{ borderTopColor: warna.primer }} kanan={<Ionicons name="chevron-forward" size={18} color={warna.redup} />}>
            <Text style={s.redupKecil}>Buka/tutup periode KRS, validasi KRS, EDOM, input nilai, dan PMB langsung dari HP.</Text>
          </Kartu>
        </Pressable>
      ) : null}

      {kelasRamai.length ? (
        <Pressable onPress={() => nav.navigate('VerumTab')}>
          <Kartu judul="Verum sekarang" ikon="radio-outline" gaya={{ borderTopColor: warna.bahaya }} kanan={<Ionicons name="chevron-forward" size={18} color={warna.redup} />}>
            {kelasRamai.map((k: any) => (
              <Pressable key={k.id} onPress={() => nav.navigate('VerumKelas', { id: k.id, nama: k.nama_kelas })} style={{ paddingVertical: 6 }}>
                <Text style={{ fontWeight: '700', color: warna.teks }}>{k.nama_kelas}</Text>
                <Text style={s.redupKecil}>{[k.is_meeting_active ? 'Vicon sedang berlangsung' : null, k.presensi_terbuka ? 'Presensi dibuka' : null].filter(Boolean).join(' · ')}</Text>
              </Pressable>
            ))}
          </Kartu>
        </Pressable>
      ) : null}

      {peran === 'mahasiswa' ? (
        <Kartu judul="Capaian akademik" ikon="school-outline">
          {khs.galat ? (
            <Text style={s.redup}>{khs.galat.status === 403 ? khs.galat.message + ' Isi EDOM lewat menu Lainnya.' : khs.galat.message}</Text>
          ) : (
            <View style={{ flexDirection: 'row' }}>
              <Angka label="IPK" nilai={khs.data ? angka(khs.data.mahasiswa?.ipk) : '-'} />
              <Angka label="SKS lulus" nilai={khs.data ? String(khs.data.mahasiswa?.total_sks_lulus ?? 0) : '-'} satuan="SKS" />
            </View>
          )}
        </Kartu>
      ) : null}

      {peran === 'dosen' ? (
        <Pressable onPress={() => nav.navigate('ValidasiTab')}>
          <Kartu judul="KRS menunggu validasi" ikon="checkmark-done-outline" kanan={<Ionicons name="chevron-forward" size={18} color={warna.redup} />}>
            <Angka label="Mahasiswa" nilai={Array.isArray(validasi.data) ? validasi.data.length : '-'} satuan="orang" />
          </Kartu>
        </Pressable>
      ) : null}

      {butuhAbsensi ? (
        <Pressable onPress={() => nav.navigate('AbsensiTab')}>
          <Kartu judul="Absensi hari ini" ikon="finger-print-outline" kanan={<Ionicons name="chevron-forward" size={18} color={warna.redup} />}>
            {absensi.data ? (
              <>
                <Baris label="Check-in" nilai={jam(absensi.data.check_in)} tebal />
                <Baris label="Check-out" nilai={jam(absensi.data.check_out)} tebal />
                <View style={{ marginTop: jarak.s }}><Lencana teks={absensi.data.status_kehadiran || '-'} jenis={jenisStatus(absensi.data.status_kehadiran)} /></View>
              </>
            ) : <Text style={s.redup}>{absensi.memuat ? 'Memuat…' : 'Belum check-in hari ini. Ketuk untuk absen.'}</Text>}
          </Kartu>
        </Pressable>
      ) : null}

      {butuhJadwal ? (
        <Kartu judul={`Jadwal ${hari}`} ikon="calendar-outline">
          {jadwal.memuat && !jadwal.data ? <Text style={s.redup}>Memuat…</Text>
            : jadwal.galat ? <Text style={s.redup}>{jadwal.galat.message}</Text>
            : jadwalHariIni.length === 0 ? <Kosong teks="Tidak ada perkuliahan hari ini." ikon="cafe-outline" />
            : jadwalHariIni.map((j) => (
              <View key={j.id} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: warna.garis }}>
                <Text style={{ width: 92, fontWeight: '800', color: warna.gelap, fontVariant: ['tabular-nums'] }}>{jam(j.jam_mulai)}–{jam(j.jam_selesai)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: warna.teks }}>{j.mata_kuliah}</Text>
                  <Text style={s.redupKecil}>Kelas {j.nama_kelas} · Ruang {j.ruang}{peran === 'mahasiswa' ? ' · ' + j.dosen : ''}</Text>
                </View>
              </View>
            ))}
        </Kartu>
      ) : null}

      <Pressable onPress={() => nav.navigate('Notifikasi')}>
        <Kartu judul="Notifikasi" ikon="notifications-outline" kanan={<Ionicons name="chevron-forward" size={18} color={warna.redup} />}>
          <Text style={s.teks}>{belumDibaca > 0 ? `${belumDibaca} pemberitahuan belum dibaca.` : 'Tidak ada pemberitahuan baru.'}</Text>
        </Kartu>
      </Pressable>
    </Layar>
  );
}
