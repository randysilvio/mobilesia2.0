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
if not exist node_modules\babel-preset-expo (if exist node_modules rmdir /s /q node_modules)
call npm install --no-audit --no-fund || goto gagal
call npx expo install --fix || goto gagal

echo.
echo [2/4] Menyiapkan proyek Android...
call npx expo prebuild --platform android --clean --no-install || goto gagal
echo sdk.dir=%ANDROID_HOME:\=/%> android\local.properties
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\siapkan-gradle.ps1 || goto gagal

echo.
echo [3/4] Build APK (10-30 menit untuk build pertama)...
cd android
set /a coba=0
:ulang
set /a coba+=1
call gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a && goto sukses
if %coba% GEQ 3 (cd .. & goto gagal)
echo.
echo Koneksi terputus atau build gagal - mencoba lagi, percobaan %coba% dari 3...
timeout /t 15 >nul
goto ulang
:sukses
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
echo Bila error "Connection reset" saat mengunduh gradle: unduh berkas gradle lewat browser
echo (tautan ada di CARA-BUILD-LOKAL.txt), taruh di folder ini, lalu jalankan ulang.
pause
exit /b 1
