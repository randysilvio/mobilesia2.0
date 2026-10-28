import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { aturToken, hapusCache, permintaan, saatSesiBerakhir } from '../api/client';
import { versiAplikasi } from '../api/config';

const KUNCI_TOKEN = 'siakad_token';
const KUNCI_PROFIL = 'siakad_profil';

export type Peran = 'mahasiswa' | 'dosen' | 'pegawai' | 'camaba' | 'umum';

export type Profil = {
  id: number;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  is_kaprodi?: boolean;
  mahasiswa?: any;
  dosen?: any;
};

type Konteks = {
  siap: boolean;
  token: string | null;
  profil: Profil | null;
  peran: Peran;
  perluUpdate: { url: string } | null;
  masuk: (email: string, password: string) => Promise<void>;
  keluar: () => Promise<void>;
  muatProfil: () => Promise<void>;
  cekVersi: () => Promise<void>;
};

const AuthContext = createContext<Konteks>(null as any);

export function peranDari(profil: Profil | null): Peran {
  const r = profil?.role;
  if (r === 'mahasiswa' || r === 'dosen' || r === 'pegawai' || r === 'camaba') return r;
  return 'umum';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [siap, setSiap] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [perluUpdate, setPerluUpdate] = useState<{ url: string } | null>(null);

  const bersihkanSesi = useCallback(async () => {
    aturToken(null);
    setToken(null);
    setProfil(null);
    await SecureStore.deleteItemAsync(KUNCI_TOKEN).catch(() => {});
    await SecureStore.deleteItemAsync(KUNCI_PROFIL).catch(() => {});
    await hapusCache();
  }, []);

  const muatProfil = useCallback(async () => {
    const p = await permintaan<Profil>('/user');
    setProfil(p);
    SecureStore.setItemAsync(KUNCI_PROFIL, JSON.stringify({
      id: p.id, name: p.name, email: p.email, role: p.role, roles: p.roles, is_kaprodi: p.is_kaprodi,
    })).catch(() => {});
  }, []);

  const cekVersi = useCallback(async () => {
    try {
      const v = await permintaan<{ min_version: number; download_url: string }>('/check-version', { tanpaToken: true, timeout: 10000 });
      if (Number(v.min_version) > versiAplikasi().kode) setPerluUpdate({ url: v.download_url });
      else setPerluUpdate(null);
    } catch {
      // tanpa jaringan: jangan blokir pengguna
    }
  }, []);

  useEffect(() => {
    saatSesiBerakhir(() => { bersihkanSesi(); });
    (async () => {
      cekVersi();
      try {
        const t = await SecureStore.getItemAsync(KUNCI_TOKEN);
        if (t) {
          aturToken(t);
          setToken(t);
          const simpan = await SecureStore.getItemAsync(KUNCI_PROFIL);
          if (simpan) setProfil(JSON.parse(simpan));
          muatProfil().catch(() => {}); // diperbarui di latar; bila luring tetap memakai profil tersimpan
        }
      } finally {
        setSiap(true);
      }
    })();
    return () => saatSesiBerakhir(null);
  }, [bersihkanSesi, cekVersi, muatProfil]);

  const masuk = useCallback(async (email: string, password: string) => {
    const hasil = await permintaan<{ token: string }>('/login', { body: { email: email.trim(), password }, tanpaToken: true });
    aturToken(hasil.token);
    await SecureStore.setItemAsync(KUNCI_TOKEN, hasil.token);
    try {
      await muatProfil();
      setToken(hasil.token);
    } catch (e) {
      await bersihkanSesi();
      throw e;
    }
  }, [muatProfil, bersihkanSesi]);

  const keluar = useCallback(async () => {
    try {
      await permintaan('/logout', { method: 'POST', timeout: 8000 });
    } catch {}
    await bersihkanSesi();
  }, [bersihkanSesi]);

  const nilai = useMemo(() => ({
    siap, token, profil, peran: peranDari(profil), perluUpdate, masuk, keluar, muatProfil, cekVersi,
  }), [siap, token, profil, perluUpdate, masuk, keluar, muatProfil, cekVersi]);

  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
