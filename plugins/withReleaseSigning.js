// Plugin Expo: memasang tanda tangan rilis di android/app/build.gradle saat `expo prebuild`.
// Sumber kunci (urutan): variabel lingkungan ANDROID_KEYSTORE_PATH dkk. (GitHub Actions),
// lalu file credentials.json + sttgpi-release.jks di folder proyek (build lokal / EAS).
// Bila tidak ada keduanya, build rilis memakai kunci debug (hanya untuk uji coba).
const fs = require('fs');
const path = require('path');
const { withAppBuildGradle } = require('expo/config-plugins');

function kunciLokal(root) {
  const f = path.join(root, 'credentials.json');
  if (!fs.existsSync(f)) return null;
  const k = (JSON.parse(fs.readFileSync(f, 'utf8')).android || {}).keystore;
  if (!k || !k.keystorePath) return null;
  const jks = path.resolve(root, k.keystorePath);
  if (!fs.existsSync(jks)) {
    console.warn(`[signing] ${jks} tidak ditemukan — APK memakai kunci debug.`);
    return null;
  }
  return { ...k, keystorePath: jks };
}

const g = (s) => JSON.stringify(String(s)); // string Groovy aman (backslash Windows di-escape)

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes('releaseSttgpi')) return cfg;

    const lokal = kunciLokal(cfg.modRequest.projectRoot);
    const blok = lokal
      ? `
        releaseSttgpi {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: ${g(lokal.keystorePath.replace(/\\/g, '/'))})
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: ${g(lokal.keystorePassword)}
            keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: ${g(lokal.keyAlias)}
            keyPassword System.getenv("ANDROID_KEY_PASSWORD") ?: ${g(lokal.keyPassword)}
        }`
      : `
        releaseSttgpi {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }`;
    const pakai = lokal
      ? 'signingConfig signingConfigs.releaseSttgpi'
      : 'signingConfig (System.getenv("ANDROID_KEYSTORE_PATH") ? signingConfigs.releaseSttgpi : signingConfigs.debug)';

    const sebelum = src;
    src = src.replace(/(signingConfigs\s*\{)/, `$1${blok}`);
    const m = src.match(/buildTypes\s*\{[\s\S]*?release\s*\{/);
    if (src === sebelum || !m) throw new Error('[signing] Format build.gradle tidak dikenali.');
    const awal = m.index + m[0].length;
    const sisa = src.slice(awal).replace(/signingConfig\s+signingConfigs\.debug/, pakai);
    src = src.slice(0, awal) + sisa;

    cfg.modResults.contents = src;
    console.log(lokal ? '[signing] Kunci rilis STT GPI dipakai (credentials.json).' : '[signing] Kunci dari variabel lingkungan / debug.');
    return cfg;
  });
};
