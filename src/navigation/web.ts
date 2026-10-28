/** Membuka halaman SIAKAD web sebagai popup di dalam aplikasi (masuk otomatis, tanpa pindah ke browser). */
export function bukaWeb(nav: any, tujuan: string, judul?: string) {
  nav.navigate('Web', { tujuan, judul: judul || 'SIAKAD Web' });
}
