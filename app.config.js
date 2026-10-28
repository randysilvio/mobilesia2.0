// Konfigurasi aplikasi. Nilai versi & alamat server diisi oleh GitHub Actions saat build:
//   VERSION_CODE  : nomor build (bertambah otomatis), dibandingkan dengan /api/check-version
//   VERSION_NAME  : versi yang tampil ke pengguna
//   API_URL       : alamat SIAKAD (variabel repo "API_URL"); tetap bisa diganti dari layar login
const versionCode = parseInt(process.env.VERSION_CODE || '1', 10);
const versionName = process.env.VERSION_NAME || '1.0.0';

module.exports = {
  expo: {
    name: 'SIAKAD STT GPI Papua',
    slug: 'sttgpi-siakad',
    owner: 'rhandee',
    version: versionName,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    android: {
      package: 'id.ac.sttgpi.siakad',
      versionCode,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
      ],
      blockedPermissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
      ],
    },
    plugins: [
      'expo-secure-store',
      [
        'expo-location',
        { locationWhenInUsePermission: 'Lokasi dipakai untuk memastikan absensi dilakukan di area kampus.' },
      ],
      [
        'expo-image-picker',
        {
          cameraPermission: 'Kamera dipakai untuk foto selfie absensi dan foto bukti pembayaran.',
          photosPermission: 'Galeri dipakai untuk memilih foto bukti pembayaran.',
          microphonePermission: false,
        },
      ],
    ],
    extra: {
      apiUrl: process.env.API_URL || 'https://sttgpi.ac.id',
    },
  },
};
