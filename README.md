# SIAKAD STT GPI Papua — Aplikasi Android

Aplikasi seluler resmi SIAKAD STT GPI Papua (React Native + Expo, TypeScript). Semua aturan akademik
(batas SKS, syarat bayar, persetujuan KRS, EDOM) tetap dihitung di server SIAKAD; aplikasi ini hanya
menampilkan dan mengirim data lewat API `/api` SIAKAD.

## Fitur
| Peran | Fitur |
|---|---|
| Mahasiswa | Beranda (IPK, jadwal hari ini, notifikasi), jadwal kuliah per rombel, isi KRS (pilih kelas paralel, sisa kursi, batas SKS), KHS per semester, tagihan & unggah bukti transfer (kamera/galeri), kalender, notifikasi |
| Dosen / Kaprodi | Jadwal mengajar, validasi KRS (lihat rincian, setujui/tolak dengan catatan), absensi kerja GPS + selfie, kalender, notifikasi |
| Pegawai / Tendik | Absensi kerja GPS + selfie & riwayat, kalender, notifikasi |

Data terakhir disimpan di HP sehingga tetap dapat dilihat saat sinyal lemah (mode luring).
Absensi menolak lokasi palsu (fake GPS) yang terdeteksi Android.

## Build APK otomatis
Setiap push ke `main` menjalankan GitHub Actions (**Build APK Android**) dan menerbitkan
`sttgpi-siakad.apk` di halaman **Releases**. Tautan tetap versi terbaru:

`https://github.com/randysilvio/mobilesia2.0/releases/latest/download/sttgpi-siakad.apk`

### Pengaturan sekali di GitHub (Settings › Secrets and variables › Actions)
- **Variables** › `API_URL` — alamat SIAKAD, mis. `https://siakad.sttgpi.ac.id` (bawaan `https://sttgpi.ac.id`).
- **Secrets** (kunci tanda tangan APK — simpan cadangannya, jangan sampai hilang):
  `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
  Tanpa secrets, APK ditandatangani kunci debug (hanya untuk uji coba).

### Build di komputer sendiri (tanpa GitHub/Expo)
Pasang Node.js LTS, JDK 17 dan Android Studio, letakkan `sttgpi-release.jks` + `credentials.json` di folder proyek,
lalu jalankan `build-apk-lokal.bat` (Windows) atau `./build-apk-lokal.sh` (Mac/Linux). Rincian: `CARA-BUILD-LOKAL.txt`.

### Alternatif: build di Expo (EAS)
Bila GitHub Actions tidak bisa dipakai, APK dibuat di server Expo (akun `rhandee`, kuota gratis).
Perlu Node.js LTS dan Git di komputer. Letakkan `sttgpi-release.jks` dan `credentials.json` (dari admin,
JANGAN di-commit) di folder repo, lalu:
```bash
npm install -g eas-cli
npm install
eas login
eas init        # sekali saja, membuat proyek di expo.dev
eas build -p android --profile apk
```
Tautan unduh APK muncul di terminal dan di https://expo.dev/accounts/rhandee.
Naikkan `VERSION_CODE` di `eas.json` setiap build baru agar HP mau memperbarui aplikasi.

### Paksa pembaruan
Server SIAKAD (`/api/check-version`) memakai `MOBILE_MIN_VERSION` di `.env`. Bila nomor build aplikasi
(lihat menu Lainnya) lebih kecil, pengguna diminta mengunduh APK terbaru.

## Pengembangan lokal
```bash
npm install
npx expo install --fix
npx expo start        # buka dengan aplikasi Expo Go / emulator
npm run typecheck
```
