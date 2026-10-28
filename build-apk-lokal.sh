#!/usr/bin/env bash
# Build APK SIAKAD STT GPI Papua di Mac/Linux. Perlu Node.js LTS, JDK 17, Android SDK.
set -euo pipefail
cd "$(dirname "$0")"
export ANDROID_HOME="${ANDROID_HOME:-$([ -d "$HOME/Library/Android/sdk" ] && echo "$HOME/Library/Android/sdk" || echo "$HOME/Android/Sdk")}"
[ -d "$ANDROID_HOME" ] || { echo "Android SDK tidak ditemukan ($ANDROID_HOME)"; exit 1; }
[ -f credentials.json ] || echo "[!] credentials.json tidak ada — APK memakai kunci DEBUG."
npm install --no-audit --no-fund
npx expo install --fix
npx expo prebuild --platform android --clean --no-install
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
(cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a)
cp android/app/build/outputs/apk/release/app-release.apk sttgpi-siakad.apk
echo "APK: $PWD/sttgpi-siakad.apk"
