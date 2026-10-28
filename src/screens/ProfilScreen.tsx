import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { ambilServer, versiAplikasi } from '../api/config';
import { Baris, Kartu, Layar, s } from '../components/ui';

export default function ProfilScreen() {
  const { profil, muatProfil } = useAuth();
  const [server, setServer] = useState('');
  const [menyegarkan, setMenyegarkan] = useState(false);
  useEffect(() => { ambilServer().then(setServer); }, []);

  const segarkan = async () => {
    setMenyegarkan(true);
    try { await muatProfil(); } catch {} finally { setMenyegarkan(false); }
  };

  const m = profil?.mahasiswa;
  const d = profil?.dosen;
  return (
    <Layar menyegarkan={menyegarkan} onSegarkan={segarkan}>
      <Kartu judul="Akun" ikon="person-circle-outline">
        <Baris label="Nama" nilai={profil?.name || '-'} tebal />
        <Baris label="Email" nilai={profil?.email || '-'} />
        <Baris label="Peran" nilai={(profil?.roles || [profil?.role]).filter(Boolean).join(', ').replace(/_/g, ' ') + (profil?.is_kaprodi ? ', kaprodi' : '')} />
      </Kartu>
      {m ? (
        <Kartu judul="Data mahasiswa" ikon="school-outline">
          <Baris label="NIM" nilai={m.nim} tebal />
          <Baris label="Program studi" nilai={m.program_studi?.nama_prodi || '-'} />
          <Baris label="Angkatan" nilai={String(m.tahun_masuk || '-')} />
          <Baris label="Status" nilai={m.status_mahasiswa || '-'} />
        </Kartu>
      ) : null}
      {d ? (
        <Kartu judul="Data dosen" ikon="briefcase-outline">
          <Baris label="NIDN" nilai={d.nidn || '-'} tebal />
          <Baris label="Jabatan akademik" nilai={d.jabatan_akademik || '-'} />
          <Baris label="Status kepegawaian" nilai={d.status_kepegawaian || '-'} />
        </Kartu>
      ) : null}
      <Kartu judul="Aplikasi" ikon="phone-portrait-outline">
        <Baris label="Versi" nilai={`${versiAplikasi().nama} (build ${versiAplikasi().kode})`} />
        <Baris label="Server" nilai={server} />
      </Kartu>
      <Text style={[s.redupKecil, { textAlign: 'center' }]}>Perubahan nama & data induk dilakukan oleh BAAK / Administrator melalui SIAKAD web.</Text>
    </Layar>
  );
}
