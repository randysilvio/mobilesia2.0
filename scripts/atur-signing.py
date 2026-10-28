"""Menambahkan konfigurasi tanda tangan rilis ke android/app/build.gradle hasil `expo prebuild`.

Kunci dibaca dari variabel lingkungan saat Gradle berjalan (diisi GitHub Actions dari Secrets):
  ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD
Bila ANDROID_KEYSTORE_PATH kosong, build rilis tetap ditandatangani kunci debug (bisa dipasang untuk uji coba).
"""
import re
import sys

path = 'android/app/build.gradle'
src = open(path, encoding='utf-8').read()

if 'signingConfigs.releaseSttgpi' in src:
    print('Signing sudah diatur.')
    sys.exit(0)

release_cfg = '''
        releaseSttgpi {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }'''

src, n1 = re.subn(r'(signingConfigs\s*\{)', r'\1' + release_cfg, src, count=1)

# Ganti signingConfig di dalam blok buildTypes.release
m = re.search(r'buildTypes\s*\{.*?release\s*\{', src, flags=re.S)
n2 = 0
if m:
    awal = m.end()
    potong = src[awal:]
    potong, n2 = re.subn(r'signingConfig\s+signingConfigs\.debug',
                         'signingConfig (System.getenv("ANDROID_KEYSTORE_PATH") ? signingConfigs.releaseSttgpi : signingConfigs.debug)',
                         potong, count=1)
    src = src[:awal] + potong

if n1 != 1 or n2 != 1:
    print(f'GAGAL mengatur signing (signingConfigs={n1}, release={n2}). Periksa template build.gradle.')
    sys.exit(1)

open(path, 'w', encoding='utf-8').write(src)
print('Signing rilis diatur.')
