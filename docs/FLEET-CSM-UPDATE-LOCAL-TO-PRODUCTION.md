# Panduan Update Fleet CSM dari Lokal ke Website Production

Dokumen ini digunakan setiap kali ada perubahan kode di lokal dan perubahan tersebut ingin di-upload/deploy ke website:

```text
https://fleetcsm.ski-group.id
```

Environment:

- Lokal: Windows + Laragon
- Production: Hostinger Cloud Startup
- Repository: GitHub
- Frontend build: lokal
- Backend deploy: Git Pull via SSH
- Queue: Cron Job Hostinger

---

# 1. Alur Singkat

```text
Edit lokal
→ Test
→ Build frontend
→ Commit
→ Push GitHub
→ SSH Hostinger
→ Maintenance mode
→ Git pull
→ Composer install
→ Migration
→ Upload/copy build
→ Optimize
→ Queue restart
→ Up
→ Smoke test
```

---

# 2. Tahap Lokal

Masuk project:

```powershell
cd C:\laragon\www\fleet-csm
```

## 2.1 Cek perubahan

```powershell
git status
git diff
```

## 2.2 Jalankan test

```powershell
php artisan optimize:clear
php artisan test
```

## 2.3 Jalankan build

```powershell
npm ci
npm run build
```

Jika `npm ci` error `EPERM`:

```powershell
taskkill /F /IM node.exe
cmd /c "rmdir /s /q node_modules"
npm cache verify
npm ci
npm run build
```

## 2.4 Cek hasil build

```powershell
Get-ChildItem public\build
```

Pastikan ada:

```text
manifest.json
assets
```

## 2.5 Cek whitespace

```powershell
git diff --check
```

---

# 3. Commit dan Push

Stage seluruh perubahan:

```powershell
git add .
```

Cek:

```powershell
git status
git diff --cached --name-only
```

Pastikan tidak ada:

```text
.env
*.sql
storage/logs/*
vendor
node_modules
```

Commit:

```powershell
git commit -m "fix: describe the change"
```

Push:

```powershell
git push origin main
```

---

# 4. Masuk SSH Hostinger

```powershell
ssh -p PORT USERNAME@HOST
```

Masuk project:

```bash
cd /home/USER/domains/fleetcsm.ski-group.id/fleet-csm
```

Cek:

```bash
git status
```

Target:

```text
working tree clean
```

---

# 5. Aktifkan Maintenance Mode

```bash
php artisan down
```

Website akan masuk mode maintenance sementara.

---

# 6. Pull Kode Terbaru

```bash
git pull origin main
```

Cek commit:

```bash
git log -1 --oneline
```

Pastikan commit terbaru sudah masuk.

---

# 7. Update Dependency Backend

```bash
composer install \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction
```

Perintah ini aman dijalankan walaupun `composer.json` tidak berubah.

---

# 8. Jalankan Migration

```bash
php artisan migrate --force
```

Cek:

```bash
php artisan migrate:status
```

Jika tidak ada migration baru, Laravel hanya menampilkan bahwa tidak ada migration pending.

Jangan menjalankan:

```bash
php artisan migrate:fresh
```

di production.

---

# 9. Update Frontend Build

Hostinger Cloud Startup tidak menyediakan `npm` di SSH.

Karena itu build dilakukan di lokal.

## Opsi A — Upload via File Manager

Di lokal:

```powershell
Compress-Archive `
    -Path .\public\build\* `
    -DestinationPath .\public-build.zip `
    -Force
```

Upload ke:

```text
/home/USER/domains/fleetcsm.ski-group.id/public_html/
```

Extract sehingga hasil akhirnya:

```text
public_html/build/manifest.json
public_html/build/assets/
```

## Opsi B — Upload via SCP

```powershell
scp -P PORT -r `
    .\public\build `
    USERNAME@HOST:/home/USER/domains/fleetcsm.ski-group.id/public_html/
```

## Opsi C — Commit Build ke Git

Hapus `/public/build` dari `.gitignore`, lalu:

```powershell
git add -f public/build
git commit -m "build: update production assets"
git push origin main
```

Di Hostinger:

```bash
git pull origin main

rm -rf \
/home/USER/domains/fleetcsm.ski-group.id/public_html/build

cp -a \
public/build \
/home/USER/domains/fleetcsm.ski-group.id/public_html/build
```

---

# 10. Perubahan File Public

Jika yang berubah hanya React/CSS:

```text
cukup update public_html/build
```

Jika yang berubah favicon, logo, robots, image:

```bash
cp -a \
public/images/. \
/home/USER/domains/fleetcsm.ski-group.id/public_html/images/
```

Jangan menimpa `public_html/index.php` dengan file `public/index.php` bawaan Laravel, karena `public_html/index.php` sudah dimodifikasi khusus Hostinger.

---

# 11. Bersihkan Cache

```bash
php artisan optimize:clear
php artisan optimize
```

Restart queue:

```bash
php artisan queue:restart
```

Permission:

```bash
chmod -R 775 storage bootstrap/cache
```

---

# 12. Aktifkan Kembali Website

```bash
php artisan up
```

---

# 13. Smoke Test

Buka:

```text
https://fleetcsm.ski-group.id
```

Tes sesuai perubahan:

- Login
- Dashboard
- Halaman yang diubah
- Filter
- Modal
- Pagination
- Create/Update/Delete
- Queue
- Email
- Accurate Sync
- Logout

Hard refresh:

```text
Ctrl + Shift + R
```

---

# 14. Cek Log

```bash
tail -n 100 storage/logs/laravel.log
tail -n 100 storage/logs/queue-cron.log
php artisan queue:failed
```

---

# 15. Update Seeder

Perubahan file seeder tidak otomatis mengubah database.

Contoh:

```php
'url' => '/dashboard',
```

Agar masuk database, pilih salah satu:

## Jalankan Seeder

```bash
php artisan db:seed \
    --class=Database\\Seeders\\MasterAdministratorSeeder \
    --force
```

Gunakan hanya bila seeder aman dan tidak mereset password.

## Jalankan SQL langsung

```sql
UPDATE menus
SET
    url = '/dashboard',
    route_name = 'dashboard',
    updated_at = NOW()
WHERE menu_code = 'dashboard';
```

---

# 16. Update Backend Saja

Jika hanya file PHP berubah:

```text
app/
routes/
database/migrations/
config/
```

Tidak perlu upload build frontend.

Urutan:

```bash
php artisan down
git pull origin main
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan optimize:clear
php artisan optimize
php artisan queue:restart
php artisan up
```

---

# 17. Update Frontend Saja

Jika hanya file berikut berubah:

```text
resources/js/
resources/css/
```

Lakukan:

Lokal:

```powershell
npm run build
git add .
git commit -m "fix: update frontend"
git push origin main
```

Hostinger:

```bash
php artisan down
git pull origin main
```

Upload:

```text
public/build
```

Lalu:

```bash
php artisan optimize:clear
php artisan optimize
php artisan up
```

---

# 18. Update Backend + Frontend

Urutan lengkap:

## Lokal

```powershell
php artisan test
npm run build
git add .
git commit -m "feat: update module"
git push origin main
```

## Hostinger

```bash
cd /home/USER/domains/fleetcsm.ski-group.id/fleet-csm

php artisan down

git pull origin main

composer install \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction

php artisan migrate --force
```

Upload `public/build`, kemudian:

```bash
php artisan optimize:clear
php artisan optimize
php artisan queue:restart
chmod -R 775 storage bootstrap/cache
php artisan up
```

---

# 19. Script Deployment yang Direkomendasikan

Buat:

```bash
nano deploy.sh
```

Isi:

```bash
#!/bin/bash

set -e

PROJECT="/home/USER/domains/fleetcsm.ski-group.id/fleet-csm"

cd "$PROJECT"

php artisan down || true

git pull origin main

composer install \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction

php artisan migrate --force
php artisan optimize:clear
php artisan optimize
php artisan queue:restart

chmod -R 775 storage bootstrap/cache

php artisan up

echo "Deployment backend selesai."
echo "Pastikan public/build terbaru sudah di-upload."
```

Permission:

```bash
chmod +x deploy.sh
```

Jalankan:

```bash
./deploy.sh
```

---

# 20. Rollback Cepat

Lihat commit:

```bash
git log --oneline -5
```

Rollback sementara:

```bash
git checkout COMMIT_SEBELUMNYA
```

Atau revert:

```bash
git revert COMMIT_BERMASALAH
git push origin main
```

Lalu deploy ulang.

Untuk production, `git revert` lebih aman daripada rewrite history.

---

# 21. Checklist Update

```text
[ ] Test lokal berhasil
[ ] Build lokal berhasil
[ ] Git diff bersih
[ ] Commit berhasil
[ ] Push berhasil
[ ] SSH masuk
[ ] Maintenance aktif
[ ] Git pull berhasil
[ ] Composer install berhasil
[ ] Migration berhasil
[ ] Build frontend ter-upload
[ ] Cache dibersihkan
[ ] Queue direstart
[ ] Permission benar
[ ] Website aktif
[ ] Smoke test berhasil
[ ] Log bersih
```

---

# 22. Perintah Ringkas Harian

## Lokal

```powershell
php artisan test
npm run build
git add .
git commit -m "fix: update Fleet CSM"
git push origin main
```

## Hostinger

```bash
cd /home/USER/domains/fleetcsm.ski-group.id/fleet-csm

php artisan down
git pull origin main
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan optimize:clear
php artisan optimize
php artisan queue:restart
php artisan up
```

Kemudian upload ulang:

```text
public/build
```

ke:

```text
public_html/build
```
