# Fleet CSM — Panduan Lengkap Modul Item Master Accurate

Dokumen ini menjadi panduan standar untuk membuat, memperbaiki, menguji, dan mengembangkan modul **Item Master Accurate** pada project Fleet CSM.

Modul ini menggunakan stack:

- Laravel
- React
- Inertia.js
- TailAdmin
- Tailwind CSS
- MySQL
- Accurate Online API
- SweetAlert2

---

# 1. Tujuan Modul

Modul Item Master digunakan untuk:

1. Menarik daftar item dari Accurate Online.
2. Mengambil detail setiap item.
3. Menyimpan item ke database lokal Fleet CSM.
4. Memperbarui item yang sudah ada.
5. Menambahkan item baru.
6. Menonaktifkan item lokal yang tidak lagi ditemukan di Accurate.
7. Menampilkan hasil sinkronisasi.
8. Menyediakan search, filter, pagination, summary, dan modal detail.
9. Menyimpan response mentah Accurate untuk audit dan debugging.
10. Menampilkan status proses sinkronisasi melalui SweetAlert2.

Modul ini bukan CRUD manual.

Artinya:

- Item tidak dibuat manual dari Fleet CSM.
- Item tidak diedit manual dari Fleet CSM.
- Item tidak dihapus manual dari Fleet CSM.
- Sumber data utama tetap Accurate Online.

---

# 2. Mapping Field Accurate

Mapping awal yang sudah diuji pada item Accurate nomor `108606`:

| Fleet CSM | Accurate | Contoh |
|---|---|---|
| `accurate_id` | `id` | `44022` |
| `item_code` | `no` | `108606` |
| `part_number` | `charField1` | `7N-7878` |
| `item_description` | `name` | `2 BOLT FLANGE COVER` |
| `unit_name` | `unit1.name` | `PCS` |
| `is_active` | kebalikan dari `suspended` | `true` |

Fallback UOM:

```php
data_get($item, 'unit1.name')
    ?? data_get($item, 'unit1Name')
    ?? data_get($item, 'vendorUnit.name')
    ?? data_get($item, 'vendorUnitName')
    ?? data_get($item, 'detailSellingPrice.0.unit.name')
```

Mapping utama:

```php
[
    'accurate_id' => (string) data_get($item, 'id'),
    'item_code' => data_get($item, 'no'),
    'part_number' => data_get($item, 'charField1'),
    'item_description' => data_get($item, 'name'),
    'unit_name' => data_get($item, 'unit1.name'),
    'is_active' => ! data_get($item, 'suspended', false),
]
```

---

# 3. Arsitektur Modul

Struktur file:

```text
app/
├── Http/
│   └── Controllers/
│       └── Warehouse/
│           └── ItemMasterController.php
├── Models/
│   └── ItemMaster.php
└── Services/
    └── Accurate/
        ├── AccurateClient.php
        └── ItemMasterSyncService.php

database/
└── migrations/
    ├── xxxx_xx_xx_xxxxxx_create_item_masters_table.php
    └── xxxx_xx_xx_xxxxxx_add_sync_error_to_item_masters_table.php

resources/
└── js/
    └── pages/
        └── warehouse/
            └── item-master/
                └── Index.tsx

routes/
└── web.php
```

Alur sinkronisasi:

```text
React Index.tsx
    ↓ router.post()
Laravel Web Route
    ↓
ItemMasterController::sync()
    ↓
ItemMasterSyncService::sync()
    ↓
AccurateClient::get()
    ↓
item/list.do
    ↓
item/detail.do
    ↓
Database
    ↓
Redirect + Flash
    ↓
Inertia
    ↓
SweetAlert hasil sinkronisasi
```

---

# 4. Membuat File Dasar

Jalankan:

```bash
php artisan make:model ItemMaster -m
php artisan make:controller Warehouse/ItemMasterController
```

Buat service manual:

```text
app/Services/Accurate/ItemMasterSyncService.php
```

Buat halaman React:

```text
resources/js/pages/warehouse/item-master/Index.tsx
```

---

# 5. Migration Item Master

File:

```text
database/migrations/xxxx_xx_xx_xxxxxx_create_item_masters_table.php
```

Gunakan:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_masters', function (Blueprint $table) {
            $table->id();

            $table->string('accurate_id', 100)
                ->unique();

            $table->string('item_code', 100)
                ->unique();

            $table->string('part_number', 255)
                ->nullable()
                ->index();

            $table->text('item_description')
                ->nullable();

            $table->string('unit_name', 100)
                ->nullable();

            $table->boolean('is_active')
                ->default(true)
                ->index();

            $table->json('accurate_raw')
                ->nullable();

            $table->text('sync_error')
                ->nullable();

            $table->timestamp('last_sync_at')
                ->nullable()
                ->index();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_masters');
    }
};
```

Jalankan:

```bash
php artisan migrate
```

---

# 6. Migration Tambahan `sync_error`

Jika tabel sudah dibuat tetapi belum memiliki kolom `sync_error`, jangan mengubah migration lama.

Buat migration baru:

```bash
php artisan make:migration add_sync_error_to_item_masters_table
```

Isi:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_masters', function (Blueprint $table) {
            if (! Schema::hasColumn('item_masters', 'sync_error')) {
                $table->text('sync_error')
                    ->nullable()
                    ->after('accurate_raw');
            }
        });
    }

    public function down(): void
    {
        Schema::table('item_masters', function (Blueprint $table) {
            if (Schema::hasColumn('item_masters', 'sync_error')) {
                $table->dropColumn('sync_error');
            }
        });
    }
};
```

Jalankan:

```bash
php artisan migrate
php artisan optimize:clear
```

Cek struktur:

```sql
DESCRIBE item_masters;
```

Minimal harus ada:

```text
id
accurate_id
item_code
part_number
item_description
unit_name
is_active
accurate_raw
sync_error
last_sync_at
created_by
updated_by
created_at
updated_at
```

---

# 7. Model ItemMaster

File:

```text
app/Models/ItemMaster.php
```

Gunakan:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class ItemMaster extends Model
{
    protected $fillable = [
        'accurate_id',
        'item_code',
        'part_number',
        'item_description',
        'unit_name',
        'is_active',
        'accurate_raw',
        'sync_error',
        'last_sync_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'accurate_raw' => 'array',
        'last_sync_at' => 'datetime',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }
}
```

---

# 8. Prinsip ItemMasterSyncService

Service harus:

1. Mengambil semua halaman `item/list.do`.
2. Mengambil detail setiap item melalui `item/detail.do`.
3. Menggunakan `id` sebagai parameter utama.
4. Melakukan fallback menggunakan `no`.
5. Mapping hanya field yang sudah terverifikasi.
6. Insert item baru.
7. Update item lama.
8. Menyimpan raw response.
9. Menyimpan error per item.
10. Tetap lanjut jika satu item gagal.
11. Tidak menonaktifkan seluruh data jika semua detail gagal.
12. Membatasi error yang dikembalikan ke frontend.
13. Tidak memakai query Intelephense yang ambigu.

---

# 9. ItemMasterSyncService Final

File:

```text
app/Services/Accurate/ItemMasterSyncService.php
```

Catatan penting:

- File PHP harus dimulai dengan `<?php`.
- Jangan menyalin tanda markdown seperti ` ```php `.
- Jangan menaruh tanda backtick di akhir file.
- Tidak perlu menutup file dengan `?>`.

Bagian akhir file harus berupa:

```php
        return 'Accurate mengembalikan response gagal tanpa pesan error.';
    }
}
```

Tidak boleh ada:

```text
```
```

Validasi syntax:

```bash
php -l app/Services/Accurate/ItemMasterSyncService.php
```

Hasil yang benar:

```text
No syntax errors detected in app/Services/Accurate/ItemMasterSyncService.php
```

---

# 10. Error Backtick

Error:

```text
syntax error, unexpected token "`"
Unexpected '`'. Expected ';'.
Unexpected 'EndOfFile'.
```

Penyebab:

Tanda markdown ikut tercopy ke file PHP.

Contoh yang salah:

```text
```php
<?php
...
}
```
```

File PHP tidak boleh berisi:

```text
```php
```

atau:

```text
```
```

Solusi:

1. Buka file.
2. Tekan `Ctrl + G`.
3. Masukkan nomor baris error.
4. Hapus seluruh tanda backtick.
5. Pastikan kurung class tertutup.
6. Jalankan:

```bash
php -l app/Services/Accurate/ItemMasterSyncService.php
```

---

# 11. Controller Item Master

Method yang dibutuhkan:

```text
index()
sync()
```

Tidak perlu:

```text
store()
update()
destroy()
```

karena data berasal dari Accurate.

Controller index harus menangani:

- Search
- Filter status
- Filter part number
- Per page
- Pagination
- Summary
- Last sync
- Flash message

Controller sync harus:

- Memanggil service
- Mengirim user ID
- Redirect kembali
- Mengirim flash success
- Mengirim flash error
- Mengirim sync result

---

# 12. Route

Tambahkan import:

```php
use App\Http\Controllers\Warehouse\ItemMasterController;
```

Route:

```php
Route::middleware(['auth'])
    ->prefix('warehouse')
    ->name('warehouse.')
    ->group(function () {
        Route::get(
            'item-master',
            [ItemMasterController::class, 'index']
        )->name('item-master.index');

        Route::post(
            'item-master/sync',
            [ItemMasterController::class, 'sync']
        )->name('item-master.sync');
    });
```

Cek route:

```bash
php artisan route:list --name=warehouse.item-master
```

Hasil:

```text
GET|HEAD  warehouse/item-master
POST      warehouse/item-master/sync
```

---

# 13. Halaman React

Gunakan layout:

```tsx
import AppLayout from '@/layouts/tailadmin/AppLayout';
```

Import Inertia:

```tsx
import { Head, router, usePage } from '@inertiajs/react';
```

Kolom tabel tahap awal:

```text
No
Item Code
Part Number
Part Description
UOM
Status
Last Sync
Action
```

Search mencakup:

```text
item_code
part_number
item_description
unit_name
accurate_id
```

---

# 14. SweetAlert2

Install:

```bash
npm install sweetalert2
```

Import:

```tsx
import Swal from 'sweetalert2';
```

SweetAlert digunakan untuk:

1. Konfirmasi sinkronisasi.
2. Loading selama request.
3. Success alert.
4. Error alert.
5. Menampilkan summary hasil sinkronisasi.

Contoh konfirmasi:

```tsx
const result = await Swal.fire({
    title: 'Sinkronisasi Item Master',
    text: 'Seluruh data item akan ditarik dari Accurate.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, sinkronkan',
    cancelButtonText: 'Batal',
});
```

Loading:

```tsx
Swal.fire({
    title: 'Sinkronisasi berlangsung',
    text: 'Sedang menarik data item dari Accurate.',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
        Swal.showLoading();
    },
});
```

---

# 15. Batasan Progress Sinkronisasi

Dengan alur saat ini:

```text
POST sync
→ Laravel memproses semua item
→ response selesai
```

Frontend hanya bisa menampilkan:

```text
Loading...
```

Frontend belum bisa mengetahui:

```text
250 / 4000 item
```

Progress nyata membutuhkan:

- Laravel Queue
- Job
- Tabel sync jobs
- processed_items
- total_items
- failed_items
- polling dari React
- endpoint progress

Untuk tahap awal, SweetAlert loading sudah cukup.

---

# 16. Testing Bertahap

Sebelum sync semua item, batasi dahulu:

```php
$listItems = array_slice(
    $this->fetchAllItemList(),
    0,
    10
);
```

Setelah 10 item berhasil, kembalikan:

```php
$listItems = $this->fetchAllItemList();
```

Test urutannya:

1. Pastikan migration berhasil.
2. Pastikan kolom `sync_error` ada.
3. Pastikan syntax service valid.
4. Test sync 10 item.
5. Periksa data database.
6. Test search.
7. Test pagination.
8. Test modal detail.
9. Test SweetAlert.
10. Baru sync seluruh item.

---

# 17. Query Pemeriksaan Database

Cek satu item:

```sql
SELECT
    accurate_id,
    item_code,
    part_number,
    item_description,
    unit_name,
    is_active,
    sync_error,
    last_sync_at
FROM item_masters
WHERE item_code = '108606';
```

Hasil yang diharapkan:

```text
accurate_id      = 44022
item_code        = 108606
part_number      = 7N-7878
item_description = 2 BOLT FLANGE COVER
unit_name        = PCS
is_active        = 1
sync_error       = NULL
```

Cek 10 data terbaru:

```sql
SELECT
    id,
    item_code,
    part_number,
    item_description,
    unit_name,
    is_active,
    sync_error,
    last_sync_at
FROM item_masters
ORDER BY id DESC
LIMIT 10;
```

---

# 18. Troubleshooting

## Unknown column `sync_error`

Error:

```text
Unknown column 'sync_error' in 'field list'
```

Penyebab:

Kolom belum ada di tabel.

Solusi:

```bash
php artisan make:migration add_sync_error_to_item_masters_table
php artisan migrate
php artisan optimize:clear
```

---

## Error 419

Penyebab:

- Menggunakan fetch manual.
- Route ada di `api.php`.
- CSRF tidak ikut.
- Session expired.

Solusi:

Gunakan:

```tsx
router.post(
    '/warehouse/item-master/sync',
    {},
    {
        preserveScroll: true,
    },
);
```

Pastikan route ada di:

```text
routes/web.php
```

---

## Route tidak ditemukan

Jalankan:

```bash
php artisan route:list --name=warehouse.item-master
php artisan optimize:clear
```

---

## Class tidak ditemukan

Jalankan:

```bash
composer dump-autoload
php artisan optimize:clear
```

Pastikan namespace:

```php
namespace App\Services\Accurate;
```

---

## Syntax error backtick

Jalankan:

```bash
php -l app/Services/Accurate/ItemMasterSyncService.php
```

Hapus semua:

```text
`
```

yang berasal dari markdown.

---

## Sinkronisasi terlalu lama

Tambahkan sementara:

```php
if (function_exists('set_time_limit')) {
    @set_time_limit(0);
}
```

Untuk production, gunakan Queue.

---

## Semua item lokal menjadi inactive

Penyebab:

Daftar Accurate tidak lengkap atau detail gagal seluruhnya.

Pencegahan:

Jangan jalankan inaktivasi jika:

```php
$accurateIds === []
```

Gunakan:

```php
if ($accurateIds === []) {
    return 0;
}
```

---

# 19. Checklist Anti Error

## Database

- [ ] Tabel `item_masters` tersedia.
- [ ] `accurate_id` unique.
- [ ] `item_code` unique.
- [ ] `sync_error` tersedia.
- [ ] `accurate_raw` bertipe JSON.
- [ ] `last_sync_at` tersedia.
- [ ] Migration berhasil.

## Model

- [ ] Semua field ada di `$fillable`.
- [ ] `accurate_raw` cast array.
- [ ] `is_active` cast boolean.
- [ ] `last_sync_at` cast datetime.

## Service

- [ ] Menggunakan `AccurateClient`.
- [ ] Mengambil semua page.
- [ ] Mengambil detail setiap item.
- [ ] Mapping `charField1`.
- [ ] Mapping `unit1.name`.
- [ ] Ada fallback UOM.
- [ ] Error per item tidak menghentikan sync.
- [ ] Error logging tidak membuat error berantai.
- [ ] Inaktivasi aman.
- [ ] Tidak ada backtick markdown.

## Controller

- [ ] `index()` mengembalikan Inertia Response.
- [ ] `sync()` mengembalikan RedirectResponse.
- [ ] Flash success tersedia.
- [ ] Flash error tersedia.
- [ ] Sync result tersedia.

## React

- [ ] Menggunakan TailAdmin AppLayout.
- [ ] Menggunakan `router.post()`.
- [ ] SweetAlert2 terpasang.
- [ ] Loading muncul.
- [ ] Hasil sync muncul.
- [ ] Search bekerja.
- [ ] Filter bekerja.
- [ ] Pagination bekerja.
- [ ] Modal detail bekerja.

---

# 20. Perintah Validasi

Jalankan:

```bash
php -l app/Services/Accurate/ItemMasterSyncService.php
php artisan migrate:status
php artisan route:list --name=warehouse.item-master
php artisan optimize:clear
composer dump-autoload
npm run dev
```

Buka:

```text
http://127.0.0.1:8000/warehouse/item-master
```

---

# 21. Git Workflow

Cek perubahan:

```bash
git status
```

Commit semua perubahan:

```bash
git add .
git commit -m "Menambahkan modul Item Master sync Accurate"
git push
```

Commit terpisah:

```bash
git add database/migrations app/Models/ItemMaster.php
git commit -m "Menambahkan database dan model Item Master"

git add app/Services/Accurate/ItemMasterSyncService.php
git commit -m "Menambahkan service sinkronisasi Item Master Accurate"

git add app/Http/Controllers/Warehouse/ItemMasterController.php routes/web.php
git commit -m "Menambahkan controller dan route Item Master"

git add resources/js/pages/warehouse/item-master/Index.tsx
git commit -m "Menambahkan halaman Item Master Accurate"

git add package.json package-lock.json
git commit -m "Menambahkan SweetAlert untuk sinkronisasi Item Master"

git push
```

---

# 22. Rekomendasi Pengembangan Berikutnya

Setelah versi dasar stabil, pengembangan dapat dilanjutkan ke:

1. Laravel Queue.
2. Progress sinkronisasi nyata.
3. Retry failed item.
4. Filter brand.
5. Filter category.
6. Filter warehouse stock.
7. Stock per warehouse.
8. Export Excel.
9. Detail raw Accurate.
10. Sync satu item.
11. Scheduled sync.
12. Audit log.
13. Sync history.
14. Dashboard error sync.

---

# 23. Kesimpulan

Modul Item Master harus mengikuti pola:

```text
AccurateClient
ItemMasterSyncService
ItemMasterController
Web Route
Inertia Redirect
Flash Session
React router.post
SweetAlert2
TailAdmin Index
```

Mapping utama yang digunakan:

```text
id          → accurate_id
no          → item_code
charField1  → part_number
name        → item_description
unit1.name  → unit_name
suspended   → kebalikan is_active
```

Kesalahan utama yang harus dihindari:

```text
kolom database belum dibuat
sync_error tidak tersedia
route di api.php
fetch manual
pagination Accurate tidak lengkap
detail item tidak diambil
semua item dinonaktifkan saat Accurate gagal
error logging membuat error baru
backtick markdown ikut tercopy
```
