// Konfigurasi aplikasi. Nilai versi & alamat server diisi oleh GitHub Actions saat build:
//   VERSION_CODE  : nomor build (bertambah otomatis), dibandingkan dengan /api/check-version
//   VERSION_NAME  : versi yang tampil ke pengguna
//   API_URL       : alamat SIAKAD (variabel repo "API_URL"); tetap bisa diganti dari layar login
const fs = require('fs');
const path = require('path');

const versionCode = parseInt(process.env.VERSION_CODE || '3', 10);
const versionName = process.env.VERSION_NAME || '1.2.0';

// Push notifikasi butuh google-services.json dari Firebase (project stt-gpi-papua, paket id.ac.sttgpi.siakad).
// Taruh berkasnya di folder ini sebelum build. Tanpa berkas itu APK tetap jadi, hanya push yang nonaktif.
const adaGoogleServices = fs.existsSync(path.join(__dirname, 'google-services.json'));

// app.json menyimpan nilai yang ditulis otomatis oleh `eas init` (extra.eas.projectId); digabung di sini.
module.exports = ({ config }) => ({
  ...config,
  ...{
    name: 'SIAKAD STT GPI Papua',
    slug: 'sttgpi-siakad',
    owner: 'rhandee',
    version: versionName,
    orientation: 'portrait',
    icon: './assets/icon.png',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    android: {
      package: 'id.ac.sttgpi.siakad',
      versionCode,
      ...(adaGoogleServices ? { googleServicesFile: './google-services.json' } : {}),
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'RECORD_AUDIO', // vicon Verum (Jitsi) di dalam aplikasi
        'MODIFY_AUDIO_SETTINGS',
        'POST_NOTIFICATIONS', // push notifikasi (Android 13+)
      ],
      blockedPermissions: [
        'android.permission.ACCESS_BACKGROUND_LOCATION',
      ],
    },
    plugins: [
      './plugins/withReleaseSigning',
      'expo-secure-store',
      [
        'expo-notifications',
        { icon: './assets/notification-icon.png', color: '#1e293b', defaultChannel: 'siakad' },
      ],
      [
        'expo-location',
        { locationWhenInUsePermission: 'Lokasi dipakai untuk memastikan absensi dilakukan di area kampus.' },
      ],
      [
        'expo-image-picker',
        {
          cameraPermission: 'Kamera dipakai untuk foto selfie absensi dan foto bukti pembayaran.',
          photosPermission: 'Galeri dipakai untuk memilih foto bukti pembayaran.',
          microphonePermission: 'Mikrofon dipakai saat mengikuti vicon kelas Verum.',
        },
      ],
    ],
  },
  extra: {
    ...(config.extra || {}),
    apiUrl: process.env.API_URL || 'https://sttgpi.ac.id',
  },
});
