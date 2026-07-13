# Fleet CSM — Panduan Lengkap Modul Purchase Order Accurate

Dokumen ini menjadi panduan lengkap untuk implementasi, sinkronisasi, pengujian, dan pemeliharaan modul **Purchase Order Accurate** pada project **Fleet CSM**.

Dokumen ini disusun berdasarkan implementasi Laravel + React + Inertia yang sudah dibuat, termasuk integrasi dengan Accurate Online, penyimpanan header PO, detail item, custom field, pagination, filter, modal detail, summary, dan notifikasi hasil sinkronisasi.

> Catatan penting:
>
> Field **Bank Account** belum diimplementasikan pada tahap ini dan sengaja ditunda.
>
> Field yang sudah dipastikan:
>
> - `charField1` → MR Number
> - `charField4` → Asset ID
> - `charField5` → Project
> - `charField10` → Revisi Ke-

---

# 1. Tujuan Modul

Modul Purchase Order digunakan untuk:

1. Menarik daftar Purchase Order dari Accurate Online.
2. Mengambil detail setiap Purchase Order.
3. Menyimpan header PO ke database lokal Fleet CSM.
4. Menyimpan detail item PO ke database lokal.
5. Memperbarui PO yang sudah pernah tersimpan.
6. Memperbarui detail item yang berubah.
7. Menghapus detail lokal yang sudah tidak ada di Accurate setelah detail PO berhasil diambil.
8. Menampilkan data PO pada halaman React + Inertia.
9. Menyediakan pencarian, filter tanggal, filter status, pagination, dan detail modal.
10. Menampilkan statistik sinkronisasi.
11. Menampilkan hasil sync dengan flash message atau SweetAlert2.
12. Menjaga data invoice agar tidak tertimpa saat sync PO.
13. Menyimpan response mentah Accurate pada kolom `accurate_raw` untuk audit dan debugging.

---

# 2. Tech Stack

Modul ini menggunakan:

```text
Laravel
React
TypeScript
Inertia.js
TailAdmin
Tailwind CSS
MySQL
Accurate Online API
```

Pola arsitektur:

```text
React Index.tsx
    ↓
Inertia router.post()
    ↓
Laravel Route
    ↓
PurchaseOrderController
    ↓
PurchaseOrderSyncService
    ↓
AccurateClient
    ↓
Accurate Online API
    ↓
Database Transaction
    ↓
Redirect + Flash Session
    ↓
React Page
```

---

# 3. Struktur File

Struktur file modul:

```text
app/
├── Http/
│   └── Controllers/
│       └── Purchasing/
│           └── PurchaseOrderController.php
│
├── Models/
│   ├── PurchaseOrder.php
│   └── PurchaseOrderDetail.php
│
└── Services/
    └── Accurate/
        ├── AccurateClient.php
        └── PurchaseOrderSyncService.php

database/
├── migrations/
│   ├── create_purchase_orders_table.php
│   ├── create_purchase_order_details_table.php
│   ├── add_additional_fields_to_purchase_orders_tables.php
│   └── add_revision_no_to_purchase_orders_table.php
│
└── seeders/
    └── MasterAdministratorSeeder.php

resources/
└── js/
    └── pages/
        └── purchasing/
            └── purchase-order/
                └── Index.tsx

routes/
└── web.php
```

---

# 4. Endpoint Accurate

## 4.1 Daftar Purchase Order

```text
purchase-order/list.do
```

Parameter utama:

```text
filter.transDate.op=BETWEEN
filter.transDate.val[0]=dd/mm/yyyy
filter.transDate.val[1]=dd/mm/yyyy
sp.pageSize=100
sp.page=1
```

Contoh:

```php
$response = $this->client->get(
    'purchase-order/list.do',
    [
        'filter.transDate.op' => 'BETWEEN',
        'filter.transDate.val[0]' => $accurateStartDate,
        'filter.transDate.val[1]' => $accurateEndDate,
        'sp.pageSize' => 100,
        'sp.page' => $page,
    ]
);
```

## 4.2 Detail Purchase Order

```text
purchase-order/detail.do?id=ACCURATE_ID
```

Digunakan untuk mengambil:

- Nomor PO
- Vendor
- Status
- Tanggal
- MR Number
- Project
- Asset ID
- Revisi
- Keterangan
- Syarat pembayaran
- Alamat kirim
- Pajak
- Close Order
- Detail item
- Quantity
- Unit
- Harga
- Diskon
- Warehouse
- Department
- Project per detail
- Remarks

---

# 5. Mapping Header Purchase Order

Mapping header yang digunakan:

| Accurate | Database Lokal |
|---|---|
| `id` | `accurate_id` |
| `number` | `po_number` |
| `statusName` / `status` | `po_status` |
| `vendor.vendorNo` | `vendor_no` |
| `vendor.name` | `vendor_name` |
| `charField1` | `mr_number` |
| `charField4` | `asset_id` |
| `charField5` | `project_name` |
| `charField10` | `revision_no` |
| `description` | `po_subject` |
| `transDate` | `trans_date` |
| `closed` / `closeOrder` / `isClosed` | `is_closed` |
| `subTotal` / `subtotal` | `subtotal_amount` |
| `discountAmount` | `discount_amount` |
| `taxAmount` | `tax_amount` |
| `taxable` / `isTaxable` | `is_taxable` |
| `inclusiveTax` / `isInclusiveTax` | `is_inclusive_tax` |
| `shipDate` / `shipmentDate` | `ship_date` |
| `paymentTerm.name` | `payment_term_name` |
| `toAddress` / `shipToAddress` | `shipping_address` |
| full detail JSON | `accurate_raw` |

## Catatan Custom Field

Mapping custom field sudah dipastikan:

```text
charField1  → MR Number
charField4  → Asset ID
charField5  → Project
charField10 → Revisi Ke-
```

Jangan mengubah mapping ini tanpa perubahan konfigurasi di Accurate.

---

# 6. Mapping Detail Item

| Accurate | Database Lokal |
|---|---|
| `id` / `detailId` | `accurate_detail_id` |
| header Accurate ID | `accurate_po_id` |
| header lokal ID | `purchase_order_id` |
| PO number | `po_number` |
| PR number | `pr_number` |
| MR number | `mr_number` |
| `item.no` | `item_no` |
| `item.name` | `item_name` |
| `item.description` | `item_description` |
| `quantity` | `quantity` |
| `unitPrice` | `unit_price` |
| `discountPercent` | `discount_percent` |
| `discountAmount` | `discount_amount` |
| total resmi Accurate | `line_total` |
| `itemUnit.name` | `unit_name` |
| `warehouse.id` | `warehouse_accurate_id` |
| `warehouse.name` | `warehouse_name` |
| `closed` / `closeOrder` | `is_closed` |
| `department.name` | `department_name` |
| `project.name` | `project_name` |
| `detailNotes` / `remarks` | `remarks` |
| header date | `trans_date` |
| full item JSON | `accurate_raw` |

---

# 7. Database Purchase Orders

Tabel header:

```text
purchase_orders
```

Kolom penting:

```text
id
accurate_id
po_number
po_status
vendor_no
vendor_name
mr_number
pr_number
invoice_number
po_subject
project_name
asset_id
revision_no
is_closed
trans_date
subtotal_amount
discount_amount
tax_amount
is_taxable
is_inclusive_tax
ship_date
payment_term_name
shipping_address
total_amount
accurate_raw
last_sync_at
created_by
updated_by
created_at
updated_at
```

## Catatan invoice

Field:

```text
invoice_number
```

tidak boleh diubah oleh proses sinkronisasi PO.

Service PO hanya menangani data Purchase Order.

Relasi invoice sebaiknya diisi oleh modul Purchase Invoice atau proses khusus invoice.

---

# 8. Database Purchase Order Details

Tabel detail:

```text
purchase_order_details
```

Kolom penting:

```text
id
purchase_order_id
accurate_detail_id
accurate_po_id
po_number
pr_number
mr_number
item_no
item_name
item_description
quantity
unit_price
discount_percent
discount_amount
line_total
unit_name
warehouse_accurate_id
warehouse_name
is_closed
department_name
project_name
remarks
trans_date
accurate_raw
created_at
updated_at
```

Relasi:

```text
purchase_orders.id
    ↓
purchase_order_details.purchase_order_id
```

---

# 9. Migration Tambahan

Jangan mengubah migration lama yang sudah pernah dijalankan.

Buat migration baru untuk setiap perubahan struktur.

## 9.1 Field Tambahan Header dan Detail

```bash
php artisan make:migration add_additional_fields_to_purchase_orders_tables
```

Field header:

```text
is_closed
subtotal_amount
discount_amount
tax_amount
is_taxable
is_inclusive_tax
ship_date
payment_term_name
shipping_address
```

Field detail:

```text
discount_percent
discount_amount
warehouse_accurate_id
warehouse_name
is_closed
```

## 9.2 Field Revisi

```bash
php artisan make:migration add_revision_no_to_purchase_orders_table
```

Contoh:

```php
Schema::table(
    'purchase_orders',
    function (Blueprint $table) {
        $table->string(
            'revision_no',
            100
        )
            ->nullable()
            ->index()
            ->after('asset_id');
    }
);
```

Jalankan migration:

```bash
php artisan migrate
```

Cek status:

```bash
php artisan migrate:status
```

---

# 10. Model PurchaseOrder

File:

```text
app/Models/PurchaseOrder.php
```

Field `$fillable` minimal:

```php
protected $fillable = [
    'accurate_id',
    'po_number',
    'po_status',
    'vendor_no',
    'vendor_name',
    'mr_number',
    'pr_number',
    'invoice_number',
    'po_subject',
    'project_name',
    'asset_id',
    'revision_no',
    'is_closed',
    'trans_date',
    'subtotal_amount',
    'discount_amount',
    'tax_amount',
    'is_taxable',
    'is_inclusive_tax',
    'ship_date',
    'payment_term_name',
    'shipping_address',
    'total_amount',
    'accurate_raw',
    'last_sync_at',
    'created_by',
    'updated_by',
];
```

Cast:

```php
protected $casts = [
    'is_closed' => 'boolean',
    'is_taxable' => 'boolean',
    'is_inclusive_tax' => 'boolean',
    'trans_date' => 'date',
    'ship_date' => 'date',
    'subtotal_amount' => 'decimal:6',
    'discount_amount' => 'decimal:6',
    'tax_amount' => 'decimal:6',
    'total_amount' => 'decimal:6',
    'accurate_raw' => 'array',
    'last_sync_at' => 'datetime',
];
```

Relasi:

```php
public function details(): HasMany
{
    return $this->hasMany(
        PurchaseOrderDetail::class
    );
}
```

Scope pencarian harus mencakup:

```text
po_number
vendor_no
vendor_name
mr_number
pr_number
project_name
asset_id
revision_no
```

---

# 11. Model PurchaseOrderDetail

File:

```text
app/Models/PurchaseOrderDetail.php
```

Field `$fillable`:

```php
protected $fillable = [
    'purchase_order_id',
    'accurate_detail_id',
    'accurate_po_id',
    'po_number',
    'pr_number',
    'mr_number',
    'item_no',
    'item_name',
    'item_description',
    'quantity',
    'unit_price',
    'discount_percent',
    'discount_amount',
    'line_total',
    'unit_name',
    'warehouse_accurate_id',
    'warehouse_name',
    'is_closed',
    'department_name',
    'project_name',
    'remarks',
    'trans_date',
    'accurate_raw',
];
```

Cast:

```php
protected $casts = [
    'quantity' => 'decimal:4',
    'unit_price' => 'decimal:6',
    'discount_percent' => 'decimal:6',
    'discount_amount' => 'decimal:6',
    'line_total' => 'decimal:6',
    'is_closed' => 'boolean',
    'trans_date' => 'date',
    'accurate_raw' => 'array',
];
```

Relasi:

```php
public function purchaseOrder(): BelongsTo
{
    return $this->belongsTo(
        PurchaseOrder::class
    );
}
```

---

# 12. PurchaseOrderSyncService

File:

```text
app/Services/Accurate/PurchaseOrderSyncService.php
```

Tanggung jawab service:

1. Validasi rentang tanggal.
2. Mengambil seluruh page daftar PO.
3. Mengambil detail setiap PO.
4. Mapping header.
5. Mapping detail.
6. Menyimpan header dengan transaction.
7. Menyimpan atau memperbarui detail.
8. Menghapus detail lokal yang sudah tidak ada di Accurate.
9. Menghitung total nilai.
10. Menyimpan `accurate_raw`.
11. Menghasilkan statistik sync.
12. Menyimpan maksimal sejumlah error agar flash tidak terlalu besar.

Statistik sync:

```text
total_list
processed
inserted
updated
detail_inserted
detail_updated
detail_deleted
detail_skipped
failed
errors
start_date
end_date
synced_at
```

## Prinsip penting

- Jangan menghapus header PO lokal hanya karena tidak ditemukan dalam satu periode sync.
- Jangan menimpa `invoice_number`.
- Jangan menghapus detail jika request detail Accurate gagal.
- Hapus detail lokal hanya setelah response detail Accurate berhasil diperoleh.
- Gunakan transaction per PO.
- Gunakan `accurate_id` sebagai identitas utama.
- Gunakan `po_number` sebagai fallback.
- Gunakan `accurate_detail_id` sebagai identitas detail.

---

# 13. Mapping Payment Term

Field Accurate:

```text
Syarat Pembayaran
```

Database:

```text
payment_term_name
```

Mapping yang direkomendasikan:

```php
'payment_term_name' =>
    $this->firstCleanValue(
        $detail,
        [
            'paymentTerm.name',
            'paymentTerm.paymentTermName',
            'paymentTerm.description',
            'paymentTermName',
            'term.name',
            'termName',
        ]
    )
    ?? $this->clean(
        is_string(
            $detail['paymentTerm'] ?? null
        )
            ? $detail['paymentTerm']
            : null
    ),
```

Contoh nilai:

```text
C.O.D
Net 30
Cash Before Delivery
```

---

# 14. Mapping Shipping Address

Field Accurate:

```text
Alamat Kirim
```

Database:

```text
shipping_address
```

Kandidat field response:

```text
toAddress
toAddress.address
toAddress.name
shipTo
shipTo.address
shipTo.name
shipToAddress
shippingAddress
deliveryAddress
deliveryAddress.address
```

Mapping:

```php
'shipping_address' =>
    $this->firstCleanValue(
        $detail,
        [
            'toAddress',
            'toAddress.address',
            'toAddress.name',
            'shipTo',
            'shipTo.address',
            'shipTo.name',
            'shipToAddress',
            'shippingAddress',
            'deliveryAddress',
            'deliveryAddress.address',
        ]
    )
    ?? $this->extractAddress(
        $detail['toAddress'] ?? null
    )
    ?? $this->extractAddress(
        $detail['shipTo'] ?? null
    ),
```

Helper:

```php
private function extractAddress(
    mixed $value
): ?string {
    if ($value === null) {
        return null;
    }

    if (
        is_string($value) ||
        is_numeric($value)
    ) {
        return $this->clean($value);
    }

    if (! is_array($value)) {
        return null;
    }

    $directValue = $this->firstCleanValue(
        $value,
        [
            'address',
            'name',
            'description',
            'fullAddress',
        ]
    );

    if ($directValue !== null) {
        return $directValue;
    }

    $parts = [
        $this->clean(
            $value['street'] ?? null
        ),
        $this->clean(
            $value['city'] ?? null
        ),
        $this->clean(
            $value['province'] ?? null
        ),
        $this->clean(
            $value['country'] ?? null
        ),
        $this->clean(
            $value['zipcode'] ?? null
        ),
    ];

    $parts = array_values(
        array_filter(
            $parts,
            static fn (
                ?string $part
            ): bool => $part !== null
        )
    );

    return $parts !== []
        ? implode(', ', $parts)
        : null;
}
```

---

# 15. Bank Account

Field Bank Account belum diimplementasikan.

Status:

```text
DITUNDA
```

Artinya saat ini belum perlu:

```text
bank_account_name
bank_account_id
bank_name
bank_account_no
```

Jangan menambahkan migration, model field, mapping service, atau tampilan React untuk Bank Account sebelum kebutuhan dan response Accurate dipastikan.

Jika nanti diperlukan, buat migration baru terpisah.

---

# 16. PurchaseOrderController

File:

```text
app/Http/Controllers/Purchasing/PurchaseOrderController.php
```

Method utama:

```text
index()
sync()
```

## Query index

Query harus memuat:

```php
$purchaseOrders = PurchaseOrder::query()
    ->with([
        'details' => function ($query) {
            $query->orderBy('id');
        },
    ])
    ->withCount('details')
    ->withSum(
        'details as total_quantity',
        'quantity'
    )
    ->search($search)
    ->when(
        $status !== '',
        fn ($query) => $query->where(
            'po_status',
            $status
        )
    )
    ->when(
        $startDate,
        fn ($query) => $query->whereDate(
            'trans_date',
            '>=',
            $startDate
        )
    )
    ->when(
        $endDate,
        fn ($query) => $query->whereDate(
            'trans_date',
            '<=',
            $endDate
        )
    )
    ->latest('trans_date')
    ->latest('id')
    ->paginate($perPage)
    ->withQueryString();
```

Pastikan tidak ada assignment ganda seperti:

```php
$purchaseOrders =
    $purchaseOrders = PurchaseOrder::query();
```

Yang benar:

```php
$purchaseOrders = PurchaseOrder::query();
```

## Summary

```php
$summary = [
    'total_po' => PurchaseOrder::query()
        ->count(),

    'total_amount' => PurchaseOrder::query()
        ->sum('total_amount'),

    'total_vendor' => PurchaseOrder::query()
        ->where('vendor_name', '!=', null)
        ->distinct('vendor_name')
        ->count('vendor_name'),

    'total_open' => PurchaseOrder::query()
        ->where('is_closed', false)
        ->count(),
];
```

---

# 17. Route

File:

```text
routes/web.php
```

Route:

```php
Route::middleware(['auth'])
    ->prefix('purchasing')
    ->name('purchasing.')
    ->group(function () {
        Route::get(
            'purchase-order',
            [
                PurchaseOrderController::class,
                'index',
            ]
        )->name(
            'purchase-order.index'
        );

        Route::post(
            'purchase-order/sync',
            [
                PurchaseOrderController::class,
                'sync',
            ]
        )->name(
            'purchase-order.sync'
        );
    });
```

Cek route:

```bash
php artisan route:list --name=purchasing.purchase-order
```

---

# 18. React Index.tsx

File:

```text
resources/js/pages/purchasing/purchase-order/Index.tsx
```

Halaman memiliki:

```text
Header
Last Sync
Sync Button
Flash Success
Flash Error
Sync Result
Summary Cards
Search
Start Date
End Date
Status
Rows per Page
Purchase Order Table
Pagination
Purchase Order Detail Modal
```

## Tabel Header PO

Kolom utama:

```text
No
PO Number
Date
Status
Vendor
MR Number
PR Number
Project
Asset
Revision
Subject
Item
Total Amount
Last Sync
Action
```

## Jumlah Item

Tampilan:

```text
5 Item (8)
```

Artinya:

```text
5 = jumlah baris detail
8 = total quantity
```

Controller harus memiliki:

```php
->withCount('details')
->withSum(
    'details as total_quantity',
    'quantity'
)
```

---

# 19. Tabel Detail Item

Kolom detail final:

```text
No
Item Code
Item Name
Quantity
Unit
Unit Price
Discount
Line Total
Warehouse
Closed
Department
Project
Remarks
```

Kolom `Description` dihapus dari tampilan.

Field `item_description` tetap boleh disimpan dalam database dan model untuk kebutuhan audit, tetapi tidak ditampilkan.

Contoh pemisahan item:

```text
Item Code: 109307
Item Name: HOSE 1" X 400CM
```

---

# 20. SweetAlert2

TailAdmin tidak selalu menyediakan modal konfirmasi global seperti SweetAlert2.

Gunakan:

```bash
npm install sweetalert2
```

Import:

```tsx
import Swal from 'sweetalert2';
```

Alur sync:

```text
Klik Sync
    ↓
Konfirmasi SweetAlert
    ↓
Loading SweetAlert
    ↓
Request Inertia
    ↓
Flash Laravel
    ↓
Success / Warning / Error SweetAlert
```

Loading harus ditutup saat:

```tsx
onFinish
```

Hasil akhir dapat dibaca dari:

```text
flash.success
flash.error
flash.sync_result
```

---

# 21. HandleInertiaRequests

Pastikan flash dibagikan.

File:

```text
app/Http/Middleware/HandleInertiaRequests.php
```

Contoh:

```php
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
```

---

# 22. Troubleshooting

## 22.1 Data Payment Term Kosong

Periksa:

```text
paymentTerm
paymentTerm.name
paymentTermName
term.name
```

Tambahkan log sementara:

```php
logger()->info(
    'PO Payment Term',
    [
        'number' =>
            $detail['number'] ?? null,

        'paymentTerm' =>
            $detail['paymentTerm'] ?? null,

        'paymentTermName' =>
            $detail['paymentTermName'] ?? null,
    ]
);
```

## 22.2 Shipping Address Kosong

Periksa:

```text
toAddress
shipTo
shipToAddress
shippingAddress
deliveryAddress
```

Tambahkan log:

```php
logger()->info(
    'PO Shipping Address',
    [
        'number' =>
            $detail['number'] ?? null,

        'toAddress' =>
            $detail['toAddress'] ?? null,

        'shipTo' =>
            $detail['shipTo'] ?? null,

        'shipToAddress' =>
            $detail['shipToAddress'] ?? null,
    ]
);
```

## 22.3 Revision Kosong

Pastikan mapping:

```php
'revision_no' => $this->clean(
    $detail['charField10'] ?? null
),
```

Pastikan kolom tersedia:

```text
purchase_orders.revision_no
```

## 22.4 Warehouse Detail Kosong

Periksa:

```text
warehouse.id
warehouse.name
warehouseId
warehouseName
```

## 22.5 Total Tidak Sesuai

Gunakan total resmi Accurate terlebih dahulu.

Fallback:

```text
quantity × unit_price - discount_amount
```

## 22.6 Detail Tidak Muncul di Modal

Controller harus memuat relasi:

```php
->with('details')
```

atau:

```php
->with([
    'details' => function ($query) {
        $query->orderBy('id');
    },
])
```

## 22.7 Error 419

Pastikan React menggunakan:

```tsx
router.post()
```

Bukan:

```tsx
fetch()
```

Pastikan route berada di:

```text
routes/web.php
```

## 22.8 Error Mass Assignment

Tambahkan field ke `$fillable`.

## 22.9 Field Baru Tidak Ditemukan

Jalankan:

```bash
php artisan migrate:status
php artisan migrate
php artisan optimize:clear
```

---

# 23. Testing Checklist

## Database

- [ ] Tabel `purchase_orders` tersedia.
- [ ] Tabel `purchase_order_details` tersedia.
- [ ] `revision_no` tersedia.
- [ ] `payment_term_name` tersedia.
- [ ] `shipping_address` tersedia.
- [ ] Field tambahan header tersedia.
- [ ] Field tambahan detail tersedia.

## Model

- [ ] Semua field header ada di `$fillable`.
- [ ] Semua field detail ada di `$fillable`.
- [ ] Cast boolean benar.
- [ ] Cast decimal benar.
- [ ] Relasi header-detail benar.

## Service

- [ ] List PO berhasil diambil.
- [ ] Pagination Accurate berjalan.
- [ ] Detail PO berhasil diambil.
- [ ] Header tersimpan.
- [ ] Detail tersimpan.
- [ ] Sync kedua tidak duplikat.
- [ ] Detail lama diperbarui.
- [ ] Detail yang hilang dihapus dengan aman.
- [ ] `invoice_number` tidak tertimpa.
- [ ] `charField10` masuk ke `revision_no`.
- [ ] Payment term terisi.
- [ ] Shipping address terisi.
- [ ] Warehouse detail terisi.
- [ ] Discount detail terisi.
- [ ] Total resmi Accurate tersimpan.

## Controller

- [ ] Filter search berjalan.
- [ ] Filter status berjalan.
- [ ] Filter tanggal berjalan.
- [ ] Pagination berjalan.
- [ ] `details_count` tersedia.
- [ ] `total_quantity` tersedia.
- [ ] Summary benar.

## React

- [ ] Header tampil.
- [ ] Sync button bekerja.
- [ ] Loading tampil.
- [ ] SweetAlert selesai muncul.
- [ ] Item Code dan Item Name terpisah.
- [ ] Description tidak tampil.
- [ ] Revision tampil.
- [ ] Payment term tampil di modal.
- [ ] Shipping address tampil di modal.
- [ ] Discount tampil.
- [ ] Warehouse tampil.
- [ ] Close Order tampil.
- [ ] Pagination bekerja.
- [ ] Tidak ada TypeScript error.
- [ ] Tidak ada console error.

---

# 24. Perintah Build dan Clear Cache

Setelah perubahan:

```bash
php artisan migrate
php artisan optimize:clear
composer dump-autoload
npm run build
```

Untuk development:

```bash
npm run dev
```

Cek sintaks PHP:

```bash
php -l app/Services/Accurate/PurchaseOrderSyncService.php
php -l app/Http/Controllers/Purchasing/PurchaseOrderController.php
php -l app/Models/PurchaseOrder.php
php -l app/Models/PurchaseOrderDetail.php
```

---

# 25. Perintah Git

## Opsi cepat

```bash
git status
git add .
git commit -m "Menambahkan modul Purchase Order Accurate"
git push
```

## Commit yang lebih sesuai dengan perubahan saat ini

```bash
git status
git add .
git commit -m "Menyempurnakan sinkronisasi Purchase Order Accurate"
git push
```

## Commit yang lebih detail

```bash
git status
git add .
git commit -m "Menambahkan mapping detail dan informasi tambahan Purchase Order"
git push
```

## Commit khusus integrasi PO

```bash
git add app/Models/PurchaseOrder.php
git add app/Models/PurchaseOrderDetail.php
git add app/Services/Accurate/PurchaseOrderSyncService.php
git add app/Http/Controllers/Purchasing/PurchaseOrderController.php
git add resources/js/pages/purchasing/purchase-order/Index.tsx
git add database/migrations
git add routes/web.php
git add database/seeders/MasterAdministratorSeeder.php

git commit -m "Menyempurnakan modul Purchase Order Accurate"
git push
```

## Rekomendasi commit terpisah

```bash
git add database/migrations
git add app/Models/PurchaseOrder.php
git add app/Models/PurchaseOrderDetail.php
git commit -m "Menambahkan struktur data Purchase Order"

git add app/Services/Accurate/PurchaseOrderSyncService.php
git commit -m "Menambahkan sinkronisasi Purchase Order Accurate"

git add app/Http/Controllers/Purchasing/PurchaseOrderController.php
git add routes/web.php
git commit -m "Menambahkan controller dan route Purchase Order"

git add resources/js/pages/purchasing/purchase-order/Index.tsx
git commit -m "Menyempurnakan halaman Purchase Order Accurate"

git add database/seeders/MasterAdministratorSeeder.php
git commit -m "Menambahkan menu Purchase Order"

git push
```

---

# 26. Rekomendasi Commit Final

Untuk kondisi perubahan saat ini, gunakan:

```bash
git status
git add .
git commit -m "Menyempurnakan modul Purchase Order Accurate"
git push
```

---

# 27. Kesimpulan

Modul Purchase Order Accurate menggunakan pola:

```text
AccurateClient
PurchaseOrderSyncService
PurchaseOrderController
PurchaseOrder Model
PurchaseOrderDetail Model
Inertia Redirect
Flash Session
React Index.tsx
SweetAlert2
```

Mapping custom field:

```text
charField1  → MR Number
charField4  → Asset ID
charField5  → Project
charField10 → Revisi Ke-
```

Field yang sudah termasuk:

```text
Payment Term
Shipping Address
Revision
Close Order
Tax
Discount
Warehouse
Total Quantity
Item Code
Item Name
```

Field yang belum diterapkan:

```text
Bank Account
```

Bank Account sengaja ditunda agar tidak menambah field dan mapping sebelum response Accurate dipastikan.
