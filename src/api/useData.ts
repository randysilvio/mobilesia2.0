import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ambil, ApiError } from './client';

/** Memuat data dari API, memuat ulang setiap kali layar dibuka, dan mendukung tarik-untuk-segarkan. */
export function useData<T = any>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [memuat, setMemuat] = useState(!!path);
  const [menyegarkan, setMenyegarkan] = useState(false);
  const [galat, setGalat] = useState<ApiError | null>(null);
  const [luring, setLuring] = useState(false);
  const aktif = useRef(true);
  const sudahAdaData = useRef(false);

  useEffect(() => () => { aktif.current = false; }, []);

  const muat = useCallback(async (segar = false) => {
    if (!path) return;
    segar ? setMenyegarkan(true) : setMemuat(true);
    try {
      const hasil = await ambil<T>(path);
      if (!aktif.current) return;
      setData(hasil.data);
      sudahAdaData.current = true;
      setLuring(hasil.luring);
      setGalat(null);
    } catch (e: any) {
      if (!aktif.current) return;
      setGalat(e instanceof ApiError ? e : new ApiError(0, e?.message || 'Terjadi kesalahan.'));
    } finally {
      if (aktif.current) {
        setMemuat(false);
        setMenyegarkan(false);
      }
    }
  }, [path]);

  // Kunjungan pertama menampilkan indikator muat penuh; kunjungan berikutnya menyegarkan diam-diam
  useFocusEffect(useCallback(() => { muat(sudahAdaData.current); }, [muat]));

  return { data, memuat, menyegarkan, galat, luring, segarkan: () => muat(true), muatUlang: () => muat(false) };
}
