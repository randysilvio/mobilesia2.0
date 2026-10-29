@echo off
REM Menjalankan aplikasi (mode pengembangan) di emulator / HP yang tersambung USB.
REM Selalu memasang paket & membangun ulang bagian native agar modul baru (webview, dll.) ikut terpasang.
cd /d "%~dp0"
set EXPO_NO_GIT_STATUS=1
call npm install --no-audit --no-fund || goto gagal
call npx expo install --fix || goto gagal
call node scripts\cek-paket.js || goto gagal
call npx expo prebuild --platform android --clean --no-install || goto gagal
call npx expo run:android || goto gagal
exit /b 0
:gagal
echo.
echo GAGAL. Salin/foto pesan error di atas lalu kirim ke Claude.
pause
exit /b 1
