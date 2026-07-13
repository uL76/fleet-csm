# Fleet CSM — Panduan Lengkap Modul Vendor Accurate

Dokumen ini menjadi panduan standar untuk membuat, memperbaiki, dan menguji modul **Vendor Accurate** pada project Fleet CSM.

Panduan ini dibuat agar implementasi modul Vendor konsisten dengan modul Warehouse yang sudah berjalan, terutama pada bagian:

- Laravel 12
- React + Inertia.js
- TailAdmin Layout
- Tailwind CSS
- MySQL
- Accurate Online API
- Permission
- Sinkronisasi data
- Flash message
- Pagination
- Filter
- Error handling
- Git workflow

---

# 1. Tujuan Modul

Modul Vendor digunakan untuk:

1. Menarik data vendor atau supplier dari Accurate Online.
2. Menyimpan data vendor ke database lokal Fleet CSM.
3. Memperbarui vendor yang sudah ada.
4. Menambahkan vendor baru.
5. Menonaktifkan vendor lokal yang sudah tidak ditemukan di Accurate.
6. Menyediakan halaman pencarian, filter, pagination, dan detail vendor.
7. Menyimpan response mentah Accurate untuk audit dan debugging.
8. Menampilkan hasil sinkronisasi kepada user.

Modul ini bukan modul CRUD manual.

Artinya:

- Data vendor tidak ditambahkan manual dari Fleet CSM.
- Data vendor tidak diedit manual dari Fleet CSM.
- Data vendor tidak dihapus manual dari Fleet CSM.
- Sumber data utama tetap Accurate Online.

---

# 2. Arsitektur Modul

Gunakan struktur berikut:

```text
app/
├── Http/
│   └── Controllers/
│       └── Purchasing/
│           └── VendorController.php
├── Models/
│   └── Vendor.php
└── Services/
    └── Accurate/
        ├── AccurateClient.php
        └── VendorSyncService.php

database/
├── migrations/
│   ├── xxxx_xx_xx_xxxxxx_create_vendors_table.php
│   └── xxxx_xx_xx_xxxxxx_add_audit_fields_to_vendors_table.php
└── seeders/
    └── MasterAdministratorSeeder.php

resources/
└── js/
    └── pages/
        └── purchasing/
            └── vendor/
                └── Index.tsx

routes/
└── web.php
```

Pola sinkronisasi:

```text
React Index.tsx
    ↓ router.post()
Laravel Web Route
    ↓
VendorController::sync()
    ↓
VendorSyncService::sync()
    ↓
AccurateClient::get()
    ↓
Accurate Online API
    ↓
Database Transaction
    ↓
Redirect Response + Flash
    ↓
Inertia Render
```

---

# 3. Penamaan yang Digunakan

Gunakan penamaan berikut secara konsisten:

| Bagian | Nama |
|---|---|
| Model | `Vendor` |
| Controller | `VendorController` |
| Service | `VendorSyncService` |
| Table | `vendors` |
| Route URL | `/purchasing/vendor` |
| Sync URL | `/purchasing/vendor/sync` |
| Route Name | `purchasing.vendor.index` |
| Sync Route Name | `purchasing.vendor.sync` |
| React Page | `resources/js/pages/purchasing/vendor/Index.tsx` |
| Menu Code | `vendor` |

Jangan mencampur nama berikut:

```text
vendor
vendors
dbvendor
supplier
suppliers
```

Untuk project Laravel ini, gunakan:

```text
vendors
```

sebagai nama tabel.

---

# 4. Perintah Membuat File Dasar

Jalankan:

```bash
php artisan make:model Vendor -m
php artisan make:controller Purchasing/VendorController
```

Buat file service secara manual:

```text
app/Services/Accurate/VendorSyncService.php
```

Buat folder React:

```text
resources/js/pages/purchasing/vendor
```

Buat file:

```text
resources/js/pages/purchasing/vendor/Index.tsx
```

---

# 5. Migration Tabel Vendor

File:

```text
database/migrations/xxxx_xx_xx_xxxxxx_create_vendors_table.php
```

Gunakan struktur berikut:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();

            $table->string('accurate_id', 100)
                ->unique();

            $table->string('vendor_no', 100)
                ->nullable()
                ->index();

            $table->string('vendor_name', 255)
                ->index();

            $table->string('category_name', 150)
                ->nullable();

            $table->string('email', 255)
                ->nullable();

            $table->string('phone', 100)
                ->nullable();

            $table->string('mobile_phone', 100)
                ->nullable();

            $table->string('fax', 100)
                ->nullable();

            $table->string('website', 255)
                ->nullable();

            $table->string('npwp_no', 100)
                ->nullable();

            $table->string('contact_name', 255)
                ->nullable();

            $table->text('address')
                ->nullable();

            $table->text('street')
                ->nullable();

            $table->string('city', 150)
                ->nullable();

            $table->string('province', 150)
                ->nullable();

            $table->string('country', 150)
                ->nullable();

            $table->string('zipcode', 50)
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->boolean('is_active')
                ->default(true)
                ->index();

            $table->json('accurate_raw')
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
        Schema::dropIfExists('vendors');
    }
};
```

## Kenapa `accurate_id` menggunakan string?

Walaupun sebagian Accurate ID terlihat numerik, penggunaan string lebih aman karena:

- Menghindari overflow.
- Menghindari asumsi tipe yang salah.
- Konsisten dengan modul Warehouse.
- Aman jika Accurate suatu saat mengubah format ID.

## Jalankan migration

```bash
php artisan migrate
```

## Jika tabel sudah ada

Jangan mengubah migration lama yang sudah pernah dijalankan di database lain.

Buat migration baru:

```bash
php artisan make:migration add_audit_fields_to_vendors_table
```

---

# 6. Model Vendor

File:

```text
app/Models/Vendor.php
```

Gunakan:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    protected $fillable = [
        'accurate_id',
        'vendor_no',
        'vendor_name',
        'category_name',
        'email',
        'phone',
        'mobile_phone',
        'fax',
        'website',
        'npwp_no',
        'contact_name',
        'address',
        'street',
        'city',
        'province',
        'country',
        'zipcode',
        'notes',
        'is_active',
        'accurate_raw',
        'last_sync_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'accurate_raw' => 'array',
        'last_sync_at' => 'datetime',
    ];

    public function scopeActive(
        Builder $query
    ): Builder {
        return $query->where(
            'is_active',
            true
        );
    }

    public function scopeInactive(
        Builder $query
    ): Builder {
        return $query->where(
            'is_active',
            false
        );
    }
}
```

## Kesalahan yang harus dihindari

Jangan lupa menambahkan field ini ke `$fillable`:

```text
created_by
updated_by
```

Jika tidak, field audit tidak akan tersimpan karena mass assignment protection.

---

# 7. Accurate Client

Gunakan `AccurateClient` yang sudah dipakai modul Warehouse.

Jangan membuat ulang:

- Header Accurate.
- Signature Accurate.
- Timestamp Accurate.
- Base URL Accurate.
- Token Accurate.

Contoh penggunaan:

```php
public function __construct(
    private readonly AccurateClient $client
) {}
```

Kemudian:

```php
$response = $this->client->get(
    'vendor/list.do',
    [
        'fields' => 'id,name',
        'sp.pageSize' => 100,
        'sp.page' => 1,
    ]
);
```

## Kesalahan yang harus dihindari

Jangan membuat service Vendor sendiri yang menggunakan:

```php
Http::withHeaders(...)
```

jika project sudah memiliki `AccurateClient`.

Hal tersebut dapat menyebabkan:

- Signature berbeda.
- Base URL berbeda.
- Header tidak konsisten.
- Timeout berbeda.
- Error authentication Accurate.

---

# 8. VendorSyncService

File:

```text
app/Services/Accurate/VendorSyncService.php
```

Prinsip yang harus diterapkan:

1. Gunakan `AccurateClient`.
2. Ambil semua halaman Accurate.
3. Gunakan database transaction.
4. Mapping data secara terpisah.
5. Skip data tanpa `accurate_id` atau `vendor_name`.
6. Update data berdasarkan `accurate_id`.
7. Insert data baru.
8. Nonaktifkan data lokal yang hilang dari Accurate.
9. Jangan hapus data lokal.
10. Return statistik sync.

Contoh struktur:

```php
<?php

namespace App\Services\Accurate;

use App\Models\Vendor;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class VendorSyncService
{
    private const PAGE_SIZE = 100;

    public function __construct(
        private readonly AccurateClient $client
    ) {}

    public function sync(
        ?int $userId = null
    ): array {
        $vendors = $this->fetchAll();

        if ($vendors === []) {
            throw new RuntimeException(
                'Data vendor Accurate kosong.'
            );
        }

        return DB::transaction(
            function () use (
                $vendors,
                $userId
            ): array {
                $inserted = 0;
                $updated = 0;
                $skipped = 0;
                $inactivated = 0;

                $accurateIds = [];
                $syncTime = now();

                foreach ($vendors as $vendor) {
                    $mapped = $this->mapVendor(
                        $vendor,
                        $syncTime,
                        $userId
                    );

                    if ($mapped === null) {
                        $skipped++;

                        continue;
                    }

                    $accurateIds[] =
                        $mapped['accurate_id'];

                    $existing = Vendor::query()
                        ->where(
                            'accurate_id',
                            $mapped['accurate_id']
                        )
                        ->first();

                    if ($existing) {
                        unset(
                            $mapped['created_by']
                        );

                        $existing->update(
                            $mapped
                        );

                        $updated++;

                        continue;
                    }

                    Vendor::create($mapped);

                    $inserted++;
                }

                $accurateIds = array_values(
                    array_unique($accurateIds)
                );

                if ($accurateIds !== []) {
                    $inactivated = Vendor::query()
                        ->whereNotNull(
                            'accurate_id'
                        )
                        ->where(
                            'accurate_id',
                            '<>',
                            ''
                        )
                        ->whereNotIn(
                            'accurate_id',
                            $accurateIds
                        )
                        ->where(
                            'is_active',
                            true
                        )
                        ->update([
                            'is_active' => false,
                            'updated_by' => $userId,
                            'last_sync_at' =>
                                $syncTime,
                            'updated_at' =>
                                $syncTime,
                        ]);
                }

                return [
                    'total_accurate' =>
                        count($vendors),

                    'inserted' => $inserted,
                    'updated' => $updated,
                    'skipped' => $skipped,
                    'inactivated' =>
                        $inactivated,

                    'synced_at' =>
                        $syncTime->format(
                            'Y-m-d H:i:s'
                        ),
                ];
            }
        );
    }
}
```

---

# 9. Fetch Pagination Accurate

Gunakan pola yang sama seperti Warehouse:

```php
private function fetchAll(): array
{
    $page = 1;
    $allVendors = [];

    do {
        $response = $this->client->get(
            'vendor/list.do',
            [
                'fields' => implode(',', [
                    'id',
                    'vendorNo',
                    'name',
                    'category',
                    'email',
                    'phone',
                    'mobilePhone',
                    'fax',
                    'website',
                    'npwpNo',
                    'contact',
                    'address',
                    'street',
                    'city',
                    'province',
                    'country',
                    'zipcode',
                    'notes',
                    'suspended',
                ]),

                'sp.pageSize' =>
                    self::PAGE_SIZE,

                'sp.page' => $page,
            ]
        );

        if (! $response->successful()) {
            throw new RuntimeException(
                sprintf(
                    'Gagal menghubungi Accurate. HTTP %s.',
                    $response->status()
                )
            );
        }

        $json = $response->json();

        if (! is_array($json)) {
            throw new RuntimeException(
                'Response Accurate bukan JSON yang valid.'
            );
        }

        if (($json['s'] ?? false) !== true) {
            throw new RuntimeException(
                $this->extractErrorMessage(
                    $json
                )
            );
        }

        $pageData = $json['d'] ?? [];

        if (is_array($pageData)) {
            foreach ($pageData as $vendor) {
                if (is_array($vendor)) {
                    $allVendors[] = $vendor;
                }
            }
        }

        $pageCount = max(
            1,
            (int) data_get(
                $json,
                'sp.pageCount',
                1
            )
        );

        $page++;
    } while ($page <= $pageCount);

    return $allVendors;
}
```

## Kesalahan yang harus dihindari

Jangan hanya mengambil halaman pertama.

Kesalahan umum:

```php
'sp.page' => 1
```

tanpa loop pagination.

Akibatnya:

- Jumlah vendor tidak lengkap.
- Vendor lokal yang berada di halaman berikutnya dianggap hilang.
- Vendor dapat salah dinonaktifkan.

---

# 10. Mapping Vendor

Gunakan method khusus:

```php
private function mapVendor(
    array $vendor,
    mixed $syncTime,
    ?int $userId
): ?array
```

Field minimum wajib:

```text
accurate_id
vendor_name
```

Jika salah satu kosong:

```php
return null;
```

Mapping status:

```php
$isSuspended = filter_var(
    $vendor['suspended'] ?? false,
    FILTER_VALIDATE_BOOLEAN
);

'is_active' => ! $isSuspended,
```

Artinya:

```text
suspended = true
is_active = false
```

dan:

```text
suspended = false
is_active = true
```

Simpan response mentah:

```php
'accurate_raw' => $vendor,
```

---

# 11. VendorController

File:

```text
app/Http/Controllers/Purchasing/VendorController.php
```

Method utama:

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

karena Vendor berasal dari Accurate.

---

# 12. Controller Index

Controller harus menangani:

- Search.
- Status.
- Contact.
- Per page.
- Pagination.
- Summary.
- Last sync.
- Inertia props.

Gunakan validasi `per_page`:

```php
$perPage = (int) $request->input(
    'per_page',
    10
);

if (
    ! in_array(
        $perPage,
        [10, 25, 50, 100],
        true
    )
) {
    $perPage = 10;
}
```

## Search

Gunakan closure:

```php
->when(
    $search !== '',
    function ($query) use ($search) {
        $query->where(
            function ($subQuery) use ($search) {
                $subQuery
                    ->where(
                        'vendor_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'vendor_no',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'accurate_id',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'email',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'phone',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'mobile_phone',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'npwp_no',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'city',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'province',
                        'like',
                        "%{$search}%"
                    );
            }
        );
    }
)
```

---

# 13. Summary Query yang Aman

Gunakan query berikut:

```php
$summary = [
    'total' => Vendor::query()
        ->count(),

    'active' => Vendor::query()
        ->where(
            'is_active',
            true
        )
        ->count(),

    'inactive' => Vendor::query()
        ->where(
            'is_active',
            false
        )
        ->count(),

    'with_email' => Vendor::query()
        ->where(
            'email',
            '!=',
            null
        )
        ->where(
            'email',
            '<>',
            ''
        )
        ->count(),

    'with_phone' => Vendor::query()
        ->where(
            function ($query) {
                $query
                    ->where(
                        function (
                            $phoneQuery
                        ) {
                            $phoneQuery
                                ->where(
                                    'phone',
                                    '!=',
                                    null
                                )
                                ->where(
                                    'phone',
                                    '<>',
                                    ''
                                );
                        }
                    )
                    ->orWhere(
                        function (
                            $mobileQuery
                        ) {
                            $mobileQuery
                                ->where(
                                    'mobile_phone',
                                    '!=',
                                    null
                                )
                                ->where(
                                    'mobile_phone',
                                    '<>',
                                    ''
                                );
                        }
                    );
            }
        )
        ->count(),
];
```

## Catatan Intelephense

Secara Laravel, ini valid:

```php
->whereNotNull('email')
```

Namun pada beberapa konfigurasi Intelephense, dapat muncul:

```text
Not enough arguments. Expected 2. Found 1.
```

Jika error hanya berasal dari Intelephense, gunakan pola berikut agar tidak ditandai:

```php
->where('email', '!=', null)
```

Jangan gunakan:

```php
->where('email', null)
```

karena bentuk tersebut bisa dibaca ambigu oleh analyzer.

---

# 14. Controller Sync

Gunakan `RedirectResponse`, bukan JSON response.

```php
public function sync(
    Request $request,
    VendorSyncService $syncService
): RedirectResponse {
    try {
        $user = $request->user('web');

        $result = $syncService->sync(
            $user?->id
        );

        return redirect()
            ->route(
                'purchasing.vendor.index'
            )
            ->with(
                'success',
                'Sinkronisasi vendor berhasil.'
            )
            ->with(
                'sync_result',
                $result
            );
    } catch (Throwable $exception) {
        report($exception);

        return redirect()
            ->route(
                'purchasing.vendor.index'
            )
            ->with(
                'error',
                'Sinkronisasi vendor gagal: '
                .$exception->getMessage()
            );
    }
}
```

## Kenapa menggunakan RedirectResponse?

Karena React menggunakan Inertia:

```tsx
router.post(...)
```

Pola Inertia yang benar adalah:

```text
POST
→ controller
→ redirect
→ flash
→ render page
```

---

# 15. Route

File:

```text
routes/web.php
```

Tambahkan:

```php
use App\Http\Controllers\Purchasing\VendorController;
```

Route:

```php
Route::middleware(['auth'])
    ->prefix('purchasing')
    ->name('purchasing.')
    ->group(function () {
        Route::get(
            'vendor',
            [VendorController::class, 'index']
        )->name('vendor.index');

        Route::post(
            'vendor/sync',
            [VendorController::class, 'sync']
        )->name('vendor.sync');
    });
```

## Kesalahan yang harus dihindari

Jangan taruh route ini di:

```text
routes/api.php
```

Harus di:

```text
routes/web.php
```

karena membutuhkan:

- Session.
- Authentication web.
- CSRF.
- Flash session.
- Inertia redirect.

## Cek route

```bash
php artisan route:list --name=purchasing.vendor
```

Harus muncul:

```text
GET|HEAD  purchasing/vendor
POST      purchasing/vendor/sync
```

---

# 16. React Index.tsx

Gunakan layout:

```tsx
import AppLayout from '@/layouts/tailadmin/AppLayout';
```

Jangan gunakan:

```tsx
import AppLayout from '@/layouts/AppLayout';
```

jika project menggunakan layout TailAdmin.

Gunakan:

```tsx
const {
    vendors,
    summary,
    filters,
    lastSyncAt,
    flash,
} = usePage<PageProps>().props;
```

---

# 17. Sync React yang Benar

Gunakan:

```tsx
const handleSyncVendor = () => {
    if (syncing) {
        return;
    }

    const confirmed = window.confirm(
        'Sinkronkan seluruh data vendor dari Accurate?',
    );

    if (!confirmed) {
        return;
    }

    router.post(
        '/purchasing/vendor/sync',
        {},
        {
            preserveScroll: true,

            onStart: () => {
                setSyncing(true);
            },

            onFinish: () => {
                setSyncing(false);
            },
        },
    );
};
```

## Jangan menggunakan fetch manual

Jangan gunakan:

```tsx
fetch('/purchasing/vendor/sync', {
    method: 'POST',
});
```

karena dapat menyebabkan:

```text
419 Page Expired
CSRF token mismatch
```

`router.post()` milik Inertia sudah mengikuti konfigurasi session dan CSRF Laravel.

---

# 18. Flash Message Inertia

Periksa file:

```text
app/Http/Middleware/HandleInertiaRequests.php
```

Pastikan ada:

```php
public function share(
    Request $request
): array {
    return [
        ...parent::share($request),

        'flash' => [
            'success' => fn () =>
                $request->session()->get(
                    'success'
                ),

            'error' => fn () =>
                $request->session()->get(
                    'error'
                ),

            'sync_result' => fn () =>
                $request->session()->get(
                    'sync_result'
                ),
        ],
    ];
}
```

Jika flash tidak dibagikan, sinkronisasi bisa berhasil tetapi pesan hasil sync tidak muncul di React.

---

# 19. Pagination

Controller:

```php
->paginate($perPage)
->withQueryString();
```

React:

```tsx
router.visit(
    link.url,
    {
        preserveState: true,
        preserveScroll: true,
    },
);
```

## Kesalahan yang harus dihindari

Jangan menghilangkan:

```php
->withQueryString()
```

Jika dihilangkan, filter akan hilang saat pindah halaman.

---

# 20. Menu Seeder

Tambahkan pada `MasterAdministratorSeeder.php`:

```php
[
    'menu_code' => 'vendor',
    'menu_name' => 'Vendor',
    'menu_group' => 'Purchasing',
    'route_name' =>
        'purchasing.vendor.index',
    'url' => '/purchasing/vendor',
    'icon' => 'BuildingIcon',
    'sort_order' => 30,
],
```

Jalankan:

```bash
php artisan db:seed --class=MasterAdministratorSeeder
php artisan optimize:clear
```

---

# 21. Permission

Permission minimum:

```text
can_view
can_create
can_export
```

Mapping:

| Permission | Fungsi |
|---|---|
| `can_view` | Melihat menu dan halaman Vendor |
| `can_create` | Menjalankan Sync Vendor |
| `can_export` | Export Vendor |

Tidak perlu:

```text
can_edit
can_delete
```

karena Vendor bukan CRUD manual.

---

# 22. Checklist Anti Error

## Database

- [ ] Tabel `vendors` sudah ada.
- [ ] `accurate_id` unique.
- [ ] `created_by` nullable.
- [ ] `updated_by` nullable.
- [ ] `accurate_raw` bertipe JSON.
- [ ] `is_active` bertipe boolean.
- [ ] Migration berhasil dijalankan.

## Model

- [ ] Semua field ada di `$fillable`.
- [ ] `accurate_raw` di-cast ke array.
- [ ] `last_sync_at` di-cast ke datetime.
- [ ] `is_active` di-cast ke boolean.

## Service

- [ ] Menggunakan `AccurateClient`.
- [ ] Tidak membuat signature Accurate baru.
- [ ] Mengambil semua halaman.
- [ ] Menggunakan transaction.
- [ ] Skip vendor tanpa ID/nama.
- [ ] Update berdasarkan `accurate_id`.
- [ ] Vendor yang hilang hanya dinonaktifkan.
- [ ] Tidak menghapus vendor lokal.
- [ ] `created_by` di-unset saat update.

## Controller

- [ ] `index()` mengembalikan Inertia Response.
- [ ] `sync()` mengembalikan RedirectResponse.
- [ ] Menggunakan route name yang benar.
- [ ] Query summary tidak error Intelephense.
- [ ] `per_page` divalidasi.

## Route

- [ ] Route berada di `web.php`.
- [ ] Route berada di middleware `auth`.
- [ ] Tidak ada route duplikat.
- [ ] URL React sama dengan URL route.

## React

- [ ] Menggunakan TailAdmin AppLayout.
- [ ] Menggunakan `router.post()`.
- [ ] Tidak menggunakan fetch manual.
- [ ] Ada `onStart`.
- [ ] Ada `onFinish`.
- [ ] Ada flash success/error.
- [ ] Ada flash sync result.
- [ ] Filter menggunakan `router.get()`.
- [ ] Pagination mempertahankan state.

---

# 23. Troubleshooting

## Error 419

Gejala:

```text
POST vendor/sync
419
```

Penyebab umum:

- Menggunakan fetch manual.
- Route berada di `api.php`.
- Session expired.
- Route tidak menggunakan middleware web.
- CSRF cookie tidak ikut.

Solusi:

```tsx
router.post(
    '/purchasing/vendor/sync',
    {},
    {
        preserveScroll: true,
    },
);
```

Pastikan route berada di:

```text
routes/web.php
```

---

## Error route tidak ditemukan

Jalankan:

```bash
php artisan route:list --name=purchasing.vendor
```

Lalu:

```bash
php artisan optimize:clear
```

---

## Error class tidak ditemukan

Contoh:

```text
Target class VendorSyncService does not exist
```

Periksa namespace:

```php
namespace App\Services\Accurate;
```

Import controller:

```php
use App\Services\Accurate\VendorSyncService;
```

Lalu jalankan:

```bash
composer dump-autoload
php artisan optimize:clear
```

---

## Error mass assignment

Gejala:

```text
Add [field] to fillable property
```

Solusi:

Tambahkan field tersebut ke:

```php
protected $fillable = [];
```

---

## Error kolom tidak ditemukan

Gejala:

```text
Unknown column created_by
```

Solusi:

Pastikan migration audit sudah dijalankan:

```bash
php artisan migrate:status
php artisan migrate
```

---

## Error response Accurate kosong

Periksa:

```text
storage/logs/laravel.log
```

Tambahkan sementara:

```php
logger()->info(
    'Accurate Vendor Response',
    [
        'response' => $json,
    ]
);
```

Jangan meninggalkan log response besar terlalu lama di production.

---

## Error Intelephense whereNotNull

Gunakan:

```php
->where(
    'email',
    '!=',
    null
)
```

Kemudian:

```text
Ctrl + Shift + P
Intelephense: Clear Cache
```

---

# 24. Testing

Jalankan:

```bash
php artisan optimize:clear
php artisan route:list --name=purchasing.vendor
npm run dev
```

Buka:

```text
http://localhost/purchasing/vendor
```

Test:

1. Halaman terbuka.
2. Menu Vendor muncul.
3. Tombol Sync dapat diklik.
4. Tidak ada error 419.
5. Response Accurate berhasil.
6. Data masuk ke tabel `vendors`.
7. Vendor lama diperbarui.
8. Vendor baru ditambahkan.
9. Vendor yang hilang dinonaktifkan.
10. Summary tampil benar.
11. Search bekerja.
12. Filter status bekerja.
13. Filter contact bekerja.
14. Per page bekerja.
15. Pagination bekerja.
16. Modal detail bekerja.
17. Flash sync result muncul.
18. Tidak ada error console.
19. Tidak ada error Laravel log.

---

# 25. Perintah Git

Cek perubahan:

```bash
git status
```

Tambahkan seluruh perubahan:

```bash
git add .
```

Commit:

```bash
git commit -m "Menambahkan modul vendor sync Accurate"
```

Push:

```bash
git push
```

Perintah lengkap:

```bash
git status
git add .
git commit -m "Menambahkan modul vendor sync Accurate"
git push
```

Alternatif commit yang lebih detail:

```bash
git add .
git commit -m "Menambahkan vendor master dan sinkronisasi Accurate"
git push
```

Jika hanya ingin commit file Vendor:

```bash
git add app/Models/Vendor.php
git add app/Http/Controllers/Purchasing/VendorController.php
git add app/Services/Accurate/VendorSyncService.php
git add resources/js/pages/purchasing/vendor/Index.tsx
git add routes/web.php
git add database/migrations
git add database/seeders/MasterAdministratorSeeder.php

git commit -m "Menambahkan modul vendor sync Accurate"
git push
```

---

# 26. Rekomendasi Commit Terpisah

Untuk history Git yang lebih rapi:

```bash
git add database/migrations app/Models/Vendor.php
git commit -m "Menambahkan database dan model vendor"

git add app/Services/Accurate/VendorSyncService.php
git commit -m "Menambahkan service sinkronisasi vendor Accurate"

git add app/Http/Controllers/Purchasing/VendorController.php routes/web.php
git commit -m "Menambahkan controller dan route vendor"

git add resources/js/pages/purchasing/vendor/Index.tsx
git commit -m "Menambahkan halaman vendor Accurate"

git add database/seeders/MasterAdministratorSeeder.php
git commit -m "Menambahkan menu vendor"

git push
```

---

# 27. Kesimpulan

Modul Vendor harus mengikuti pola modul Warehouse yang sudah stabil:

```text
AccurateClient
VendorSyncService
VendorController
Inertia Redirect
Flash Session
React router.post
TailAdmin Index
```

Kesalahan utama yang harus dihindari:

```text
fetch manual
route di api.php
route duplikat
signature Accurate baru
pagination Accurate tidak lengkap
fillable tidak lengkap
migration audit belum dijalankan
flash tidak dibagikan
vendor lokal dihapus
```

Dengan mengikuti dokumen ini, modul Vendor akan lebih aman, konsisten, mudah dirawat, dan lebih kecil kemungkinan mengalami error 419, mapping, route, database, atau Inertia.
