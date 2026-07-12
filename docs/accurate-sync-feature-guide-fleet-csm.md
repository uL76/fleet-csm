# Fleet CSM - Panduan Membuat Fitur Sinkronisasi Data dari Accurate

Dokumen ini digunakan sebagai standar kerja saat membuat fitur baru di Fleet CSM yang mengambil data dari Accurate Online, menyimpannya ke database lokal, lalu menampilkannya melalui React + Inertia.

Contoh implementasi yang sudah berjalan adalah fitur **Warehouse Accurate**.

---

## 1. Tech Stack

Fleet CSM menggunakan:

- Backend: Laravel 12
- Frontend: React + TypeScript
- Bridge: Inertia.js
- Styling: Tailwind CSS + TailAdmin custom layout
- Database: MySQL
- Local Environment: Laragon
- Accurate Integration: Accurate Online API
- Package Manager: npm
- Version Control: Git + GitHub

---

## 2. Pola Umum Fitur Sinkronisasi

Setiap fitur Accurate Sync sebaiknya mengikuti alur berikut:

```text
Accurate Online API
        ↓
Laravel Accurate Client
        ↓
Service khusus fitur
        ↓
Mapping response Accurate
        ↓
Simpan/update database lokal
        ↓
Controller Laravel
        ↓
React + Inertia
        ↓
Tabel, filter, summary, detail, dan tombol sync
```

Contoh modul:

```text
Warehouse
Item Master
Vendor
Customer
Purchase Order
Purchase Requisition
Purchase Invoice
Stock
```

---

## 3. Prinsip Utama

Saat membuat fitur sinkronisasi baru:

1. Jangan memanggil Accurate langsung dari React.
2. Token dan signature Accurate hanya boleh digunakan di backend Laravel.
3. Simpan konfigurasi Accurate di `.env`.
4. Gunakan service terpisah untuk logic API dan sinkronisasi.
5. Gunakan transaksi database untuk proses sync.
6. Gunakan field unik dari Accurate sebagai key utama sinkronisasi.
7. Jangan membuat duplikasi data lokal.
8. Jangan menghapus data lokal secara langsung jika data tidak ditemukan di Accurate; lebih aman nonaktifkan.
9. Simpan response mentah Accurate jika diperlukan untuk audit/debug.
10. Pastikan semua halaman Accurate berhasil diambil sebelum melakukan inaktivasi data lokal.

---

## 4. Struktur Folder Standar

Gunakan struktur berikut:

```text
app/
├── Http/
│   └── Controllers/
│       └── {Module}/
│           └── {Feature}Controller.php
│
├── Models/
│   └── {Feature}.php
│
└── Services/
    └── Accurate/
        ├── AccurateClient.php
        └── {Feature}SyncService.php

config/
└── services.php

database/
├── migrations/
│   └── xxxx_xx_xx_xxxxxx_create_{table}_table.php
│
└── seeders/
    └── MasterAdministratorSeeder.php

resources/
└── js/
    └── pages/
        └── {module}/
            └── Index.tsx

routes/
└── web.php
```

Contoh Warehouse:

```text
app/Models/Warehouse.php
app/Services/Accurate/AccurateClient.php
app/Services/Accurate/WarehouseSyncService.php
app/Http/Controllers/Warehouse/WarehouseController.php
resources/js/pages/warehouse/Index.tsx
```

---

## 5. Konfigurasi Accurate di `.env`

Tambahkan:

```env
ACCURATE_BASE_URL=https://iris.accurate.id/accurate/api
ACCURATE_API_TOKEN=
ACCURATE_SIGNATURE_SECRET=
ACCURATE_TIMEZONE=Asia/Jakarta
ACCURATE_TIMEOUT=90
ACCURATE_CONNECT_TIMEOUT=20
```

Jangan commit `.env`.

Pada `.env.example`:

```env
ACCURATE_BASE_URL=https://iris.accurate.id/accurate/api
ACCURATE_API_TOKEN=
ACCURATE_SIGNATURE_SECRET=
ACCURATE_TIMEZONE=Asia/Jakarta
ACCURATE_TIMEOUT=90
ACCURATE_CONNECT_TIMEOUT=20
```

---

## 6. Konfigurasi `config/services.php`

Tambahkan:

```php
'accurate' => [
    'base_url' => env(
        'ACCURATE_BASE_URL',
        'https://iris.accurate.id/accurate/api'
    ),
    'token' => env('ACCURATE_API_TOKEN'),
    'signature_secret' => env('ACCURATE_SIGNATURE_SECRET'),
    'timezone' => env('ACCURATE_TIMEZONE', 'Asia/Jakarta'),
    'timeout' => (int) env('ACCURATE_TIMEOUT', 90),
    'connect_timeout' => (int) env('ACCURATE_CONNECT_TIMEOUT', 20),
],
```

Setelah perubahan:

```bash
php artisan optimize:clear
```

---

## 7. Accurate Client

`AccurateClient` bertanggung jawab untuk:

- Membuat timestamp Accurate
- Membuat HMAC signature
- Menambahkan bearer token
- Menangani GET/POST
- Mengatur timeout
- Mengatur retry
- Mengembalikan response Laravel HTTP Client

File:

```text
app/Services/Accurate/AccurateClient.php
```

Contoh pola:

```php
<?php

namespace App\Services\Accurate;

use Carbon\Carbon;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AccurateClient
{
    private string $baseUrl;
    private string $token;
    private string $signatureSecret;
    private string $timezone;
    private int $timeout;
    private int $connectTimeout;

    public function __construct()
    {
        $this->baseUrl = rtrim(
            (string) config('services.accurate.base_url'),
            '/'
        );

        $this->token = (string) config('services.accurate.token');
        $this->signatureSecret = (string) config('services.accurate.signature_secret');
        $this->timezone = (string) config('services.accurate.timezone', 'Asia/Jakarta');
        $this->timeout = (int) config('services.accurate.timeout', 90);
        $this->connectTimeout = (int) config('services.accurate.connect_timeout', 20);

        if ($this->baseUrl === '' || $this->token === '' || $this->signatureSecret === '') {
            throw new RuntimeException('Konfigurasi Accurate belum lengkap.');
        }
    }

    private function headers(): array
    {
        $timestamp = Carbon::now($this->timezone)
            ->format('d/m/Y H:i:s');

        $signature = base64_encode(
            hash_hmac(
                'sha256',
                $timestamp,
                $this->signatureSecret,
                true
            )
        );

        return [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Api-Timestamp' => $timestamp,
            'X-Api-Signature' => $signature,
            'Accept' => 'application/json',
        ];
    }

    private function request(): PendingRequest
    {
        return Http::withHeaders($this->headers())
            ->connectTimeout($this->connectTimeout)
            ->timeout($this->timeout)
            ->retry(2, 500, throw: false);
    }

    public function get(string $endpoint, array $query = []): Response
    {
        return $this->request()->get(
            $this->baseUrl . '/' . ltrim($endpoint, '/'),
            $query
        );
    }

    public function post(string $endpoint, array $payload = []): Response
    {
        return $this->request()
            ->asForm()
            ->post(
                $this->baseUrl . '/' . ltrim($endpoint, '/'),
                $payload
            );
    }
}
```

---

## 8. Migration Database

Setiap fitur sinkronisasi minimal memiliki field:

```php
$table->id();
$table->string('accurate_id')->unique();
$table->boolean('is_active')->default(true);
$table->json('accurate_raw')->nullable();
$table->timestamp('last_sync_at')->nullable();
$table->timestamps();
```

Tambahkan field sesuai data endpoint.

Contoh Warehouse:

```php
$table->string('accurate_location_id')->nullable();
$table->string('warehouse_name');
$table->text('description')->nullable();
$table->string('street')->nullable();
$table->string('city')->nullable();
$table->string('province')->nullable();
$table->string('country')->nullable();
$table->string('zipcode')->nullable();
$table->string('pic')->nullable();
$table->boolean('is_damage_warehouse')->default(false);
```

Gunakan index untuk field yang sering difilter:

```php
$table->index('is_active');
$table->index('last_sync_at');
$table->index('warehouse_name');
```

---

## 9. Model Laravel

Model minimal memiliki:

- `$fillable`
- `$casts`
- Scope jika diperlukan

Contoh:

```php
protected $fillable = [
    'accurate_id',
    'warehouse_name',
    'description',
    'is_active',
    'accurate_raw',
    'last_sync_at',
];

protected $casts = [
    'is_active' => 'boolean',
    'accurate_raw' => 'array',
    'last_sync_at' => 'datetime',
];
```

---

## 10. Service Sinkronisasi

Setiap fitur harus memiliki service khusus:

```text
app/Services/Accurate/{Feature}SyncService.php
```

Service bertanggung jawab untuk:

1. Mengambil seluruh halaman Accurate
2. Validasi response
3. Mapping data
4. Insert data baru
5. Update data lama
6. Menonaktifkan data lokal yang sudah tidak ada di Accurate
7. Mengembalikan statistik sync

Contoh hasil sync:

```php
[
    'total_accurate' => 10,
    'inserted' => 2,
    'updated' => 8,
    'skipped' => 0,
    'inactivated' => 1,
    'synced_at' => '2026-07-13 00:00:00',
]
```

---

## 11. Pagination Accurate

Gunakan pola:

```php
$page = 1;
$pageSize = 100;
$allData = [];

do {
    $response = $client->get('endpoint/list.do', [
        'fields' => 'id,name,...',
        'sp.pageSize' => $pageSize,
        'sp.page' => $page,
    ]);

    // validasi response

    $pageData = $response->json('d', []);

    foreach ($pageData as $item) {
        $allData[] = $item;
    }

    $pageCount = (int) data_get(
        $response->json(),
        'sp.pageCount',
        1
    );

    $page++;
} while ($page <= $pageCount);
```

Jangan menyimpan data sebelum semua page berhasil diambil jika fitur menggunakan logic inaktivasi.

---

## 12. Mapping Data

Buat method terpisah:

```php
private function mapItem(array $item, $syncTime, ?int $userId): ?array
```

Validasi minimal:

```php
$accurateId = trim((string) ($item['id'] ?? ''));
$name = trim((string) ($item['name'] ?? ''));

if ($accurateId === '' || $name === '') {
    return null;
}
```

Map ke struktur lokal:

```php
return [
    'accurate_id' => $accurateId,
    'name' => $name,
    'is_active' => !filter_var(
        $item['suspended'] ?? false,
        FILTER_VALIDATE_BOOLEAN
    ),
    'accurate_raw' => $item,
    'last_sync_at' => $syncTime,
    'updated_by' => $userId,
];
```

---

## 13. Insert dan Update

Gunakan field unik Accurate:

```php
$existing = Model::query()
    ->where('accurate_id', $mapped['accurate_id'])
    ->first();

if ($existing) {
    unset($mapped['created_by']);
    $existing->update($mapped);
    $updated++;
} else {
    Model::create($mapped);
    $inserted++;
}
```

Jangan menggunakan nama sebagai unique key jika Accurate menyediakan `id`.

---

## 14. Inaktivasi Data Lokal

Gunakan hanya setelah semua data Accurate berhasil diambil:

```php
if ($accurateIds !== []) {
    $uniqueIds = array_values(array_unique($accurateIds));

    $inactivated = Model::query()
        ->whereNotNull('accurate_id', 'and')
        ->where('accurate_id', '<>', '')
        ->whereNotIn('accurate_id', $uniqueIds)
        ->where('is_active', true)
        ->update([
            'is_active' => false,
            'last_sync_at' => $syncTime,
            'updated_at' => $syncTime,
        ]);
}
```

Jangan hapus record secara permanen kecuali memang dibutuhkan.

---

## 15. Gunakan Database Transaction

Contoh:

```php
return DB::transaction(
    function () use ($items, $userId): array {
        // insert, update, inactivate

        return $result;
    },
    1
);
```

Parameter kedua `1` membantu menghindari warning Intelephense pada beberapa environment.

---

## 16. Controller

Controller minimal memiliki:

```text
index()
sync()
```

### `index()`

Tugasnya:

- Search
- Filter
- Pagination
- Summary
- Last sync
- Render Inertia

Contoh:

```php
return Inertia::render('warehouse/Index', [
    'warehouses' => $warehouses,
    'summary' => $summary,
    'filters' => [
        'search' => $search,
        'status' => $status,
        'type' => $type,
        'per_page' => $perPage,
    ],
    'lastSyncAt' => $lastSyncAt,
]);
```

Untuk summary, gunakan:

```php
Warehouse::query()->count('*');
```

bukan:

```php
Warehouse::query()->count();
```

jika Intelephense memberi warning argument.

### `sync()`

Contoh:

```php
public function sync(
    Request $request,
    WarehouseSyncService $syncService
): RedirectResponse {
    try {
        $result = $syncService->sync(
            $request->user('web')?->id
        );

        return redirect()
            ->route('warehouse.warehouses.index')
            ->with('success', 'Sinkronisasi berhasil.')
            ->with('sync_result', $result);
    } catch (Throwable $exception) {
        report($exception);

        return redirect()
            ->route('warehouse.warehouses.index')
            ->with(
                'error',
                'Sinkronisasi gagal: ' . $exception->getMessage()
            );
    }
}
```

---

## 17. Route

Contoh Warehouse:

```php
Route::middleware(['auth'])
    ->prefix('warehouse')
    ->name('warehouse.')
    ->group(function () {
        Route::get(
            'warehouses',
            [WarehouseController::class, 'index']
        )->name('warehouses.index');

        Route::post(
            'warehouses/sync',
            [WarehouseController::class, 'sync']
        )->name('warehouses.sync');
    });
```

Cek route:

```bash
php artisan route:list --name=warehouse
```

---

## 18. React Page

Gunakan layout:

```tsx
import AppLayout from '@/layouts/tailadmin/AppLayout';
```

Fitur minimal pada halaman React:

- Judul halaman
- Deskripsi
- Last Sync
- Tombol Sync
- Alert success/error
- Statistik sync
- Summary card
- Search
- Filter status
- Filter tipe
- Per page
- Table
- Pagination
- Detail modal

React hanya memanggil route Laravel:

```tsx
router.post('/warehouse/warehouses/sync', {}, {
    preserveScroll: true,
    onStart: () => setSyncing(true),
    onFinish: () => setSyncing(false),
});
```

Jangan memanggil URL Accurate langsung dari React.

---

## 19. Flash Inertia

Pastikan `HandleInertiaRequests.php` mengirim:

```php
'flash' => [
    'success' => fn () => $request->session()->get('success'),
    'error' => fn () => $request->session()->get('error'),
    'sync_result' => fn () => $request->session()->get('sync_result'),
],
```

Jangan membuat dua key `flash`.

---

## 20. Sidebar

Untuk modul yang hanya memiliki satu halaman, gunakan direct path:

```tsx
{
    icon: <BoxCubeIcon />,
    name: 'Warehouse',
    path: '/warehouse/warehouses',
},
```

Untuk modul dengan banyak halaman, gunakan submenu.

---

## 21. Menu Seeder

Tambahkan ke `MasterAdministratorSeeder.php`:

```php
[
    'menu_code' => 'warehouses',
    'menu_name' => 'Warehouse',
    'menu_group' => 'Warehouse',
    'route_name' => 'warehouse.warehouses.index',
    'url' => '/warehouse/warehouses',
    'icon' => 'BoxIcon',
    'sort_order' => 100,
],
```

Hindari menu duplikat untuk URL yang sama.

---

## 22. Testing Backend

### Test Accurate Client

```bash
php artisan tinker
```

```php
$client = app(\App\Services\Accurate\AccurateClient::class);

$response = $client->get('warehouse/list.do', [
    'fields' => 'id,name,description,locationId,suspended',
    'sp.pageSize' => 10,
    'sp.page' => 1,
]);

$response->status();
$response->json();
```

### Test Sync Service

```php
$service = app(\App\Services\Accurate\WarehouseSyncService::class);
$result = $service->sync();
$result;
```

Jalankan dua kali untuk memastikan tidak ada duplikasi.

---

## 23. Testing Database

Cek duplikasi:

```sql
SELECT accurate_id, COUNT(*) AS total
FROM warehouses
GROUP BY accurate_id
HAVING COUNT(*) > 1;
```

Cek status:

```sql
SELECT
    accurate_id,
    warehouse_name,
    is_active,
    last_sync_at
FROM warehouses
ORDER BY warehouse_name;
```

---

## 24. Testing Frontend

Checklist:

- [ ] Halaman dapat dibuka
- [ ] Menu sidebar tampil
- [ ] Tombol Sync bekerja
- [ ] Loading state tampil
- [ ] Data masuk ke database
- [ ] Data tampil di tabel
- [ ] Search bekerja
- [ ] Filter bekerja
- [ ] Pagination bekerja
- [ ] Detail modal bekerja
- [ ] Sync kedua tidak membuat duplikasi
- [ ] Error API tampil dengan benar
- [ ] Tidak ada token Accurate di browser Network
- [ ] Tidak ada error console
- [ ] `npm run build` berhasil

---

## 25. Error Umum

### `Not enough arguments. Expected 1. Found 0.` pada `count()`

Gunakan:

```php
->count('*')
```

### `Not enough arguments. Expected 2. Found 1.` pada `whereNotNull()`

Gunakan:

```php
->whereNotNull('accurate_id', 'and')
```

### Warning pada `$request->user()`

Gunakan:

```php
$request->user('web')?->id
```

### Inertia component tidak ditemukan

Pastikan path controller sesuai file React:

```php
Inertia::render('warehouse/Index')
```

untuk file:

```text
resources/js/pages/warehouse/Index.tsx
```

### Menu tidak tampil di sidebar

Seeder hanya menyimpan menu ke database. Jika sidebar masih statis, tambahkan menu langsung ke `AppSidebar.tsx`.

---

## 26. Urutan Pembuatan Fitur Baru

Gunakan urutan berikut:

```text
1. Tentukan endpoint Accurate
2. Tentukan fields yang dibutuhkan
3. Buat migration
4. Jalankan migration
5. Buat model
6. Buat Accurate Client jika belum ada
7. Buat Sync Service
8. Test response Accurate
9. Test service di Tinker
10. Buat controller
11. Buat route
12. Buat React page
13. Tambahkan flash Inertia
14. Tambahkan sidebar
15. Tambahkan menu seeder
16. Test sync pertama
17. Test sync kedua
18. Test inaktivasi
19. Test filter dan pagination
20. Build frontend
21. Commit Git
```

---

## 27. Template Penamaan

Contoh fitur Item Master:

| Bagian | Nama |
|---|---|
| Model | `ItemMaster` |
| Controller | `ItemMasterController` |
| Service | `ItemMasterSyncService` |
| Table | `item_masters` |
| Route URL | `/warehouse/item-master` |
| Route Name | `warehouse.item-master.index` |
| React Page | `resources/js/pages/item-master/Index.tsx` |
| Menu Code | `item-master` |

Contoh fitur Vendor:

| Bagian | Nama |
|---|---|
| Model | `Vendor` |
| Controller | `VendorController` |
| Service | `VendorSyncService` |
| Table | `vendors` |
| Route URL | `/scm/vendors` |
| Route Name | `scm.vendors.index` |
| React Page | `resources/js/pages/vendors/Index.tsx` |
| Menu Code | `vendors` |

---

## 28. Git Workflow

Sebelum commit:

```bash
git status
```

Pastikan `.env` tidak ikut terdeteksi.

Kemudian:

```bash
git add .
git commit -m "Menambahkan sinkronisasi warehouse Accurate"
git push
```

Untuk fitur lain, gunakan pola commit:

```bash
git commit -m "Menambahkan sinkronisasi item master Accurate"
```

atau:

```bash
git commit -m "Menambahkan sinkronisasi vendor Accurate"
```

---

## 29. Rekomendasi Commit untuk Tahap Warehouse Saat Ini

Gunakan:

```bash
git add .
git commit -m "Menambahkan fitur sinkronisasi warehouse Accurate"
git push
```

---

## 30. Kesimpulan

Standar fitur Accurate Sync di Fleet CSM adalah:

```text
Migration
Model
Accurate Client
Sync Service
Controller
Route
React Page
Sidebar
Menu Seeder
Testing
Git Commit
```

Dengan pola ini, fitur lain seperti Item Master, Vendor, Customer, Purchase Order, Purchase Invoice, dan Stock dapat dibuat dengan struktur yang konsisten, aman, dan mudah dirawat.
