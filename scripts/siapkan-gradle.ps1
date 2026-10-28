# Dipanggil build-apk-lokal.bat setelah prebuild:
# - pakai Gradle versi "bin" (lebih kecil) dan batas waktu unduh 10 menit
# - bila ada gradle-<versi>-*.zip di folder proyek (diunduh lewat browser), pakai berkas itu (tanpa unduh ulang)
$p = 'android\gradle\wrapper\gradle-wrapper.properties'
$t = Get-Content $p -Raw
$t = $t -replace '-all\.zip', '-bin.zip'
if ($t -match 'networkTimeout=') { $t = $t -replace 'networkTimeout=\d+', 'networkTimeout=600000' } else { $t = $t.TrimEnd() + "`r`nnetworkTimeout=600000`r`n" }
$ver = [regex]::Match($t, 'gradle-([0-9.]+)-bin\.zip').Groups[1].Value
Write-Host "Gradle versi $ver"
$lokal = Get-ChildItem -Path . -Filter "gradle-$ver-*.zip" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($lokal) {
  $url = 'file:///' + ($lokal.FullName -replace '\\', '/')
  $t = [regex]::Replace($t, '(?m)^distributionUrl=.*$', "distributionUrl=$url")
  Write-Host "Memakai Gradle lokal: $($lokal.Name)"
} else {
  Write-Host "Gradle diunduh dari internet (gradle-$ver-bin.zip)."
}
Set-Content -Path $p -Value $t -NoNewline -Encoding ASCII
