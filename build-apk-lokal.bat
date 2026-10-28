@echo off
setlocal
REM ===== Build APK SIAKAD STT GPI Papua di komputer Windows =====
REM Perlu: Node.js LTS, JDK 17, Android Studio (Android SDK). Lihat CARA-BUILD-LOKAL.txt
cd /d "%~dp0"
set EXPO_NO_GIT_STATUS=1
set CI=1

where node >nul 2>nul || (echo [X] Node.js belum terpasang. Unduh di https://nodejs.org & goto gagal)
where java >nul 2>nul || (echo [X] Java JDK 17 belum terpasang. & goto gagal)
if "%ANDROID_HOME%"=="" if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if "%ANDROID_HOME%"=="" (echo [X] Android SDK tidak ditemukan. Pasang Android Studio lalu buka sekali. & goto gagal)
if not exist credentials.json echo [!] credentials.json tidak ada - APK memakai kunci DEBUG (uji coba saja).

echo.
echo [1/4] Memasang paket (sekali di awal agak lama)...
call npm install --no-audit --no-fund || goto gagal
call npx expo install --fix || goto gagal

echo.
echo [2/4] Menyiapkan proyek Android...
call npx expo prebuild --platform android --clean --no-install || goto gagal
echo sdk.dir=%ANDROID_HOME:\=/%> android\local.properties

echo.
echo [3/4] Build APK (10-30 menit untuk build pertama)...
cd android
call gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a || (cd .. & goto gagal)
cd ..

echo.
echo [4/4] Selesai.
copy /y android\app\build\outputs\apk\release\app-release.apk sttgpi-siakad.apk >nul
echo APK: %CD%\sttgpi-siakad.apk
pause
exit /b 0

:gagal
echo.
echo BUILD GAGAL. Salin/foto pesan error di atas lalu kirim ke Claude.
pause
exit /b 1
