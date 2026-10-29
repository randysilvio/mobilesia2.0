#!/usr/bin/env bash
# Build APK SIAKAD STT GPI Papua di Mac/Linux. Perlu Node.js LTS, JDK 17, Android SDK.
set -euo pipefail
cd "$(dirname "$0")"
export EXPO_NO_GIT_STATUS=1 CI=1
export ANDROID_HOME="${ANDROID_HOME:-$([ -d "$HOME/Library/Android/sdk" ] && echo "$HOME/Library/Android/sdk" || echo "$HOME/Android/Sdk")}"
[ -d "$ANDROID_HOME" ] || { echo "Android SDK tidak ditemukan ($ANDROID_HOME)"; exit 1; }
[ -f credentials.json ] || echo "[!] credentials.json tidak ada — APK memakai kunci DEBUG."
[ -f google-services.json ] || echo "[!] google-services.json tidak ada — push notifikasi HP nonaktif."
npm install --no-audit --no-fund
npx expo install --fix
npx expo prebuild --platform android --clean --no-install
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
W=android/gradle/wrapper/gradle-wrapper.properties
sed -i.bak -e 's/-all\.zip/-bin.zip/' -e 's/networkTimeout=[0-9]*/networkTimeout=600000/' "$W"
V=$(sed -n 's/.*gradle-\([0-9.]*\)-bin\.zip.*/\1/p' "$W")
Z=$(ls gradle-"$V"-*.zip 2>/dev/null | head -1 || true)
[ -n "$Z" ] && sed -i.bak "s|^distributionUrl=.*|distributionUrl=file://$PWD/$Z|" "$W" && echo "Memakai Gradle lokal: $Z"
for i in 1 2 3; do (cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a) && break; [ $i = 3 ] && exit 1; echo "Mencoba lagi ($i/3)..."; sleep 15; done
cp android/app/build/outputs/apk/release/app-release.apk sttgpi-siakad.apk
echo "APK: $PWD/sttgpi-siakad.apk"
