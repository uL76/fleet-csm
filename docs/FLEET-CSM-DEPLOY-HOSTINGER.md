# Panduan Lengkap Deploy Fleet CSM ke Hostinger Cloud Startup

Dokumen ini menjelaskan alur deploy aplikasi **Fleet CSM** berbasis Laravel 12, Inertia React, Vite, MySQL, Queue Database, dan integrasi Accurate Online ke **Hostinger Cloud Startup**.

---

## 1. Gambaran Arsitektur

Stack aplikasi:

- Laravel 12
- PHP 8.2/8.3
- Inertia.js
- React + TypeScript
- Vite
- MySQL
- Database Queue
- Cron Job Hostinger
- Google Workspace SMTP
- Accurate Online API

Struktur deployment yang digunakan:

```text
/home/USER/domains/fleetcsm.ski-group.id/
├── fleet-csm
│   ├── app
│   ├── bootstrap
│   ├── config
│   ├── database
│   ├── public
│   ├── resources
│   ├── routes
│   ├── storage
│   ├── vendor
│   ├── artisan
│   └── .env
└── public_html
    ├── index.php
    ├── .htaccess
    ├── build
    ├── images
    └── storage -> symlink
```

Folder project Laravel diletakkan di:

```text
/home/USER/domains/fleetcsm.ski-group.id/fleet-csm
```

Document root domain menggunakan:

```text
/home/USER/domains/fleetcsm.ski-group.id/public_html
```

---

# 2. Persiapan Lokal Sebelum Deploy

## 2.1 Pastikan test lulus

```powershell
php artisan optimize:clear
php artisan test
```

Target:

```text
26 tests passed
```

## 2.2 Pastikan build frontend berhasil

```powershell
npm ci
npm run build
```

Folder hasil build:

```text
public/build
```

Minimal berisi:

```text
public/build/manifest.json
public/build/assets/
```

## 2.3 Cek migration

```powershell
php artisan migrate:status
```

Pastikan seluruh migration berstatus:

```text
Ran
```

## 2.4 Cek route

```powershell
php artisan route:list
```

Pastikan route penting tersedia:

```text
/dashboard
/warehouse/warehouses
/warehouse/item-master
/purchasing/vendor
/purchasing/purchase-requisition
/purchasing/purchase-order
/supply-chain/material-requests
/supply-chain/approval-configuration
```

## 2.5 Pastikan file sensitif tidak ikut Git

```powershell
git check-ignore -v .env
git ls-files .env
git diff --check
```

Hasil yang benar:

- `.env` ter-ignore
- `git ls-files .env` kosong
- `git diff --check` tidak menampilkan error

File yang tidak boleh di-commit:

```text
.env
.env.production
*.sql
storage/logs/*
vendor
node_modules
```

---

# 3. Konfigurasi `.env` Production

Contoh:

```env
APP_NAME="Fleet CSM"
APP_ENV=production
APP_KEY=base64:ISI_KEY_PRODUCTION
APP_DEBUG=false
APP_TIMEZONE=Asia/Jakarta
APP_URL=https://fleetcsm.ski-group.id

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

LOG_CHANNEL=stack
LOG_STACK=daily
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=uXXXXXXXX_fleetcsm
DB_USERNAME=uXXXXXXXX_fleetcsm
DB_PASSWORD="PASSWORD_DATABASE_HOSTINGER"

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_PATH=/
SESSION_DOMAIN=fleetcsm.ski-group.id
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

QUEUE_CONNECTION=database

CACHE_STORE=database
CACHE_PREFIX=fleetcsm_

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=admin@corpski.co.id
MAIL_PASSWORD="APP_PASSWORD_GOOGLE"
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=admin@corpski.co.id
MAIL_FROM_NAME="${APP_NAME}"

VITE_APP_NAME="${APP_NAME}"
VITE_APP_URL=https://fleetcsm.ski-group.id

ACCURATE_BASE_URL=https://iris.accurate.id/accurate/api
ACCURATE_API_TOKEN=TOKEN_ACCURATE_VALID
ACCURATE_SIGNATURE_SECRET=SECRET_ACCURATE_VALID
ACCURATE_TIMEZONE=Asia/Jakarta
ACCURATE_TIMEOUT=90
ACCURATE_CONNECT_TIMEOUT=20
```

Catatan:

- Gunakan kredensial production baru.
- Jangan gunakan `APP_DEBUG=true`.
- Jangan gunakan user MySQL root.
- Jangan commit `.env`.
- `MAIL_PASSWORD` harus memakai App Password Google Workspace.

---

# 4. Membuat Website dan Database di Hostinger

## 4.1 Buat domain/subdomain

Di hPanel:

```text
Websites
→ Add Website
→ fleetcsm.ski-group.id
```

Aktifkan SSL:

```text
Websites
→ fleetcsm.ski-group.id
→ Security
→ SSL
```

## 4.2 Buat database

Di hPanel:

```text
Websites
→ fleetcsm.ski-group.id
→ Databases
→ Management
```

Simpan:

```text
DB_HOST
DB_DATABASE
DB_USERNAME
DB_PASSWORD
```

## 4.3 Aktifkan SSH

Di hPanel:

```text
Websites
→ fleetcsm.ski-group.id
→ Advanced
→ SSH Access
```

Masuk dari PowerShell:

```powershell
ssh -p PORT USERNAME@HOST
```

---

# 5. Clone Project di Hostinger

Masuk ke folder domain:

```bash
cd ~/domains/fleetcsm.ski-group.id
```

Clone project:

```bash
git clone https://github.com/USERNAME/fleet-csm.git fleet-csm
```

Masuk folder project:

```bash
cd fleet-csm
```

Install dependency:

```bash
composer install \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction
```

Cek PHP:

```bash
php -v
composer check-platform-reqs
```

---

# 6. Membuat `.env` Production

```bash
cp .env.example .env
nano .env
```

Isi seluruh konfigurasi production.

Generate key:

```bash
php artisan key:generate
```

Bersihkan cache awal:

```bash
php artisan optimize:clear
```

Jika `CACHE_STORE=database` dan tabel cache belum ada, jalankan migration terlebih dahulu.

---

# 7. Menjalankan Migration

```bash
php artisan migrate --force
```

Cek:

```bash
php artisan migrate:status
```

Pastikan seluruh migration `Ran`.

Tabel penting:

```text
users
sessions
cache
cache_locks
jobs
job_batches
failed_jobs
companies
departments
positions
user_levels
user_configs
warehouses
vendors
item_masters
purchase_requisitions
purchase_orders
material_requests
document_approval_routes
material_request_approvals
```

---

# 8. Seeder Data Master

Jalankan seeder production:

```bash
php artisan db:seed \
    --class=Database\\Seeders\\MasterAdministratorSeeder \
    --force
```

Sebelum menjalankan, isi sementara:

```env
SEED_ADMIN_PASSWORD="PASSWORD_ADMIN_SEMENTARA"
SEED_DEFAULT_PASSWORD="PASSWORD_USER_SEMENTARA"
SEED_RESET_PASSWORDS=false
```

Setelah seeder selesai, hapus kembali variabel tersebut lalu:

```bash
php artisan optimize:clear
php artisan optimize
```

---

# 9. Menyiapkan `public_html`

Salin isi folder Laravel `public`:

```bash
cd ~/domains/fleetcsm.ski-group.id

cp -a fleet-csm/public/. public_html/
```

Hapus file bawaan Hostinger:

```bash
rm -f public_html/default.php
```

Edit:

```bash
nano public_html/index.php
```

Gunakan:

```php
<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

if (
    file_exists(
        $maintenance = __DIR__
            . '/../fleet-csm/storage/framework/maintenance.php'
    )
) {
    require $maintenance;
}

require __DIR__ . '/../fleet-csm/vendor/autoload.php';

(require_once __DIR__ . '/../fleet-csm/bootstrap/app.php')
    ->handleRequest(Request::capture());
```

Pastikan `.htaccess` ikut:

```bash
ls -la public_html
```

Minimal:

```text
.htaccess
index.php
build
images
favicon.ico
```

---

# 10. Storage Link

Hapus link lama:

```bash
rm -rf ~/domains/fleetcsm.ski-group.id/public_html/storage
```

Buat symlink:

```bash
ln -s \
~/domains/fleetcsm.ski-group.id/fleet-csm/storage/app/public \
~/domains/fleetcsm.ski-group.id/public_html/storage
```

---

# 11. Permission Folder

```bash
cd ~/domains/fleetcsm.ski-group.id/fleet-csm

chmod -R 775 storage bootstrap/cache
chmod -R 755 ~/domains/fleetcsm.ski-group.id/public_html
```

---

# 12. Build Frontend pada Hostinger Cloud Startup

Pada Hostinger Cloud Startup, `npm` bisa tidak tersedia di SSH.

Karena itu build dilakukan di lokal:

```powershell
npm ci
npm run build
```

Hasil:

```text
public/build
```

Upload ke:

```text
/home/USER/domains/fleetcsm.ski-group.id/public_html/build
```

Cara upload:

- SCP
- File Manager Hostinger
- Commit hasil build ke Git
- ZIP lalu extract

Pastikan strukturnya:

```text
public_html/build/manifest.json
public_html/build/assets/
```

Bukan:

```text
public_html/build/build/manifest.json
```

---

# 13. Queue Otomatis dengan Cron Job

Fleet CSM memakai:

```env
QUEUE_CONNECTION=database
```

Fitur yang membutuhkan queue:

- Import Excel Item Master
- Sync Item Master dari Accurate
- Retry sinkronisasi
- Job background lain yang menggunakan `dispatch()` atau `ShouldQueue`

## 13.1 Buat script queue

```bash
cd /home/USER/domains/fleetcsm.ski-group.id/fleet-csm
nano queue-cron.sh
```

Isi:

```bash
#!/bin/bash

PROJECT="/home/USER/domains/fleetcsm.ski-group.id/fleet-csm"
PHP="/usr/bin/php"
LOG="$PROJECT/storage/logs/queue-cron.log"
LOCK="/tmp/fleetcsm-queue.lock"

mkdir -p "$PROJECT/storage/logs"
touch "$LOG"

echo "Queue cron started: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG"

/usr/bin/flock -n "$LOCK" \
    "$PHP" "$PROJECT/artisan" queue:work database \
    --queue=default \
    --stop-when-empty \
    --sleep=1 \
    --tries=3 \
    --timeout=600 \
    --no-interaction \
    >> "$LOG" 2>&1

EXIT_CODE=$?

echo "Queue cron finished: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG"
echo "Exit code: $EXIT_CODE" >> "$LOG"

exit "$EXIT_CODE"
```

Permission:

```bash
chmod +x queue-cron.sh
```

Tes:

```bash
./queue-cron.sh
```

## 13.2 Cron Job hPanel

Pilih:

```text
Kustom
```

Command:

```bash
/bin/bash /home/USER/domains/fleetcsm.ski-group.id/fleet-csm/queue-cron.sh
```

Jadwal:

```text
* * * * *
```

Artinya setiap menit.

## 13.3 Cek log queue

```bash
tail -n 100 storage/logs/queue-cron.log
```

Target:

```text
Queue cron started: ...
RUNNING
DONE
Queue cron finished: ...
Exit code: 0
```

---

# 14. Scheduler Laravel

Cek:

```bash
php artisan schedule:list
```

Jika ada task, buat script scheduler:

```bash
nano scheduler-cron.sh
```

Isi:

```bash
#!/bin/bash

PROJECT="/home/USER/domains/fleetcsm.ski-group.id/fleet-csm"
PHP="/usr/bin/php"
LOG="$PROJECT/storage/logs/scheduler-cron.log"

"$PHP" "$PROJECT/artisan" schedule:run \
    --no-interaction \
    >> "$LOG" 2>&1
```

Cron:

```bash
/bin/bash /home/USER/domains/fleetcsm.ski-group.id/fleet-csm/scheduler-cron.sh
```

Jadwal:

```text
* * * * *
```

Jika `schedule:list` kosong, scheduler belum diperlukan.

---

# 15. Final Optimization

```bash
php artisan optimize:clear
php artisan optimize
php artisan queue:restart
```

Cek:

```bash
php artisan about
```

Target:

```text
Environment: production
Debug Mode: OFF
```

---

# 16. Verifikasi Production

Tes:

- Login
- Logout
- Dashboard
- User Config
- Warehouse Sync
- Vendor Sync
- Item Master Sync
- Item Master Excel Import
- Purchase Requisition Sync
- Purchase Order Sync
- Material Request Create
- Material Request Submit
- Review
- Approve
- Revision
- Reject
- Approval Configuration
- Email Reset Password
- WhatsApp Link
- Upload Storage
- Queue Cron

Cek log:

```bash
tail -n 200 storage/logs/laravel.log
tail -n 200 storage/logs/queue-cron.log
php artisan queue:failed
```

---

# 17. Troubleshooting Umum

## 17.1 White Screen

Penyebab umum:

- `default.php` masih ada
- `index.php` salah path
- build frontend belum tersedia
- APP_KEY belum ada

Perbaikan:

```bash
rm -f public_html/default.php
php artisan optimize:clear
```

## 17.2 419 Page Expired

Penyebab:

- session domain salah
- secure cookie aktif di HTTP lokal
- cookie lama

Production:

```env
SESSION_DOMAIN=fleetcsm.ski-group.id
SESSION_SECURE_COOKIE=true
```

Lokal:

```env
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
```

## 17.3 MissingAppKeyException

```bash
php artisan key:generate
php artisan optimize:clear
```

## 17.4 Queue PENDING

```bash
./queue-cron.sh
tail -n 100 storage/logs/queue-cron.log
php artisan queue:failed
```

## 17.5 Import Stuck PROCESSING

Pastikan import class menggunakan:

```php
WithEvents
RegistersEventListeners
afterImport
importFailed
```

Tutup record lama bila diperlukan:

```sql
UPDATE item_master_import_runs
SET
    status = 'COMPLETED',
    finished_at = NOW(),
    error_message = NULL
WHERE status IN ('PENDING', 'PROCESSING');
```

---

# 18. Backup

Backup database dari phpMyAdmin:

```text
hPanel
→ Databases
→ phpMyAdmin
→ Export
```

Simpan di luar repository.

Jangan commit backup SQL ke Git.

---

# 19. Checklist Selesai Deploy

```text
[ ] Domain aktif
[ ] SSL aktif
[ ] PHP sesuai
[ ] Database production terhubung
[ ] APP_KEY tersedia
[ ] APP_DEBUG=false
[ ] Migration Ran
[ ] Seeder berhasil
[ ] public_html/index.php benar
[ ] default.php dihapus
[ ] build tersedia
[ ] storage symlink aktif
[ ] permission benar
[ ] cron queue aktif
[ ] email terkirim
[ ] Accurate sync bekerja
[ ] login/logout bekerja
[ ] log bersih
[ ] backup tersedia
```
