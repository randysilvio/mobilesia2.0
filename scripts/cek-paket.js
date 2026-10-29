// Memastikan semua paket di package.json sudah terpasang sebelum Metro/Gradle berjalan.
// Mencegah galat "Unable to resolve module ..." setelah package.json diperbarui tanpa `npm install`.
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');
const kurang = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
  .filter((n) => !fs.existsSync(path.join(__dirname, '..', 'node_modules', n, 'package.json')));
if (kurang.length) {
  console.error('\n[X] Paket belum terpasang: ' + kurang.join(', '));
  console.error('    Jalankan dulu:  npm install   lalu   npx expo install --fix\n');
  process.exit(1);
}
console.log('[OK] Semua paket terpasang.');
