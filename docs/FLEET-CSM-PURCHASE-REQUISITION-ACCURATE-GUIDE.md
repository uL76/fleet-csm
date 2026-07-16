# Fleet CSM — Dokumentasi Modul Purchase Requisition Accurate

Dokumen ini menjelaskan implementasi modul **Purchase Requisition Accurate** pada project **Fleet CSM** menggunakan Laravel, React, Inertia.js, TailAdmin, MySQL, dan Accurate Online API.

## 1. Tujuan Modul

Modul ini digunakan untuk:

1. Menarik daftar Purchase Requisition dari Accurate Online.
2. Mengambil detail setiap Purchase Requisition.
3. Menyimpan header PR ke database lokal.
4. Menyimpan detail item PR ke database lokal.
5. Memperbarui data tanpa duplikasi.
6. Menghapus detail lokal yang sudah tidak ada pada response Accurate.
7. Menampilkan data melalui React + Inertia.
8. Menyediakan filter, pagination, summary, modal detail, dan SweetAlert.
9. Menyimpan `accurate_raw` untuk audit dan debugging.

## 2. Tech Stack

```text
Laravel
React
TypeScript
Inertia.js
TailAdmin
Tailwind CSS
MySQL
Accurate Online API
SweetAlert2
```

Alur modul:

```text
React Index.tsx
    ↓
Inertia router.post()
    ↓
Laravel Route
    ↓
PurchaseRequisitionController
    ↓
PurchaseRequisitionSyncService
    ↓
AccurateClient
    ↓
Accurate Online API
    ↓
Database Transaction
    ↓
Redirect + Flash Session
    ↓
React Page + SweetAlert
```

## 3. Struktur File

```text
app/
├── Http/Controllers/Purchasing/
│   └── PurchaseRequisitionController.php
├── Models/
│   ├── PurchaseRequisition.php
│   └── PurchaseRequisitionDetail.php
└── Services/Accurate/
    └── PurchaseRequisitionSyncService.php

database/migrations/
├── 2026_07_15_000001_create_purchase_requisitions_table.php
└── 2026_07_15_000002_create_purchase_requisition_details_table.php

resources/js/pages/purchasing/purchase-requisition/
└── Index.tsx

routes/
└── web.php
```

## 4. Endpoint Accurate

### 4.1 List Purchase Requisition

```text
purchase-requisition/list.do
```

Parameter:

```text
filter.transDate.op=BETWEEN
filter.transDate.val[0]=dd/mm/yyyy
filter.transDate.val[1]=dd/mm/yyyy
sp.pageSize=100
sp.page=1
```

### 4.2 Detail Purchase Requisition

```text
purchase-requisition/detail.do?id=ACCURATE_ID
```

## 5. Mapping Header

| Accurate | Database Lokal |
|---|---|
| `id` | `accurate_id` |
| `number` | `pr_number` |
| `statusName` / `status` | `pr_status` |
| `charField1` | `mr_number` |
| `transDate` | `trans_date` |
| `requiredDate` / `requestDate` / `expectedDate` | `required_date` |
| `requester.name` / `employee.name` | `requester_name` |
| `department.name` | `department_name` |
| `charField5` / `project.name` | `project_name` |
| `charField4` | `asset_id` |
| `charField10` | `revision_no` |
| `description` / `notes` / `remark` | `description` |
| `closed` / `closeOrder` / `isClosed` | `is_closed` |
| full JSON | `accurate_raw` |
| waktu sync | `last_sync_at` |

Custom field:

```text
charField1  → MR Number
charField4  → Asset ID
charField5  → Project
charField10 → Revision Number
```

## 6. Mapping Detail

| Accurate | Database Lokal |
|---|---|
| `id` / `detailId` | `accurate_detail_id` |
| header Accurate ID | `accurate_pr_id` |
| header lokal ID | `purchase_requisition_id` |
| header PR number | `pr_number` |
| header MR number | `mr_number` |
| `item.no` / `item.code` | `item_no` |
| `item.name` | `item_name` |
| `item.description` | `item_description` |
| `quantity` / `qty` | `quantity` |
| `itemUnit.name` / `unit.name` | `unit_name` |
| `department.name` | `department_name` |
| `project.name` | `project_name` |
| `detailNotes` / `remarks` | `remarks` |
| header transaction date | `trans_date` |
| detail required date | `required_date` |
| `closed` / `closeOrder` | `is_closed` |
| full JSON | `accurate_raw` |

Fallback array detail:

```text
detailItem
detail
details
items
purchaseRequisitionDetail
purchaseRequisitionDetails
purchaseRequisitionItem
purchaseRequisitionItems
```

## 7. Database

Tabel header:

```text
purchase_requisitions
```

Tabel detail:

```text
purchase_requisition_details
```

Relasi:

```text
purchase_requisitions.id
    ↓
purchase_requisition_details.purchase_requisition_id
```

## 8. Route

```php
Route::middleware(['auth'])
    ->prefix('purchasing')
    ->name('purchasing.')
    ->group(function () {
        Route::get(
            'purchase-requisition',
            [PurchaseRequisitionController::class, 'index']
        )->name('purchase-requisition.index');

        Route::post(
            'purchase-requisition/sync',
            [PurchaseRequisitionController::class, 'sync']
        )->name('purchase-requisition.sync');
    });
```

Cek route:

```bash
php artisan route:list --name=purchasing.purchase-requisition
```

## 9. React Index.tsx

Path:

```text
resources/js/pages/purchasing/purchase-requisition/Index.tsx
```

Import layout:

```tsx
import AppLayout from '@/layouts/tailadmin/AppLayout';
```

Fitur halaman:

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
Purchase Requisition Table
Pagination
Purchase Requisition Detail Modal
```

## 10. Perbaikan Error Response Accurate

Error:

```text
Argument #1 ($response) must be of type array,
Illuminate\Http\Client\Response given
```

Penyebabnya, `AccurateClient->get()` mengembalikan:

```php
Illuminate\Http\Client\Response
```

bukan array.

Perbaikan:

```php
use Illuminate\Http\Client\Response;
```

Method final:

```php
private function assertSuccessful(
    Response $response,
    string $message
): array {
    if (! $response->successful()) {
        throw new RuntimeException(
            "{$message} HTTP {$response->status()}: {$response->body()}"
        );
    }

    $responseData = $response->json();

    if (! is_array($responseData)) {
        throw new RuntimeException(
            "{$message} Response Accurate bukan JSON yang valid."
        );
    }

    if (($responseData['s'] ?? false) !== true) {
        $accurateMessage = $this->firstCleanValue(
            $responseData,
            ['d.0', 'message', 'error']
        );

        throw new RuntimeException(
            $accurateMessage
                ? "{$message} {$accurateMessage}"
                : $message
        );
    }

    return $responseData;
}
```

Pemakaian list:

```php
$listData = $this->assertSuccessful(
    $listResponse,
    'Gagal mengambil daftar Purchase Requisition.'
);

$rows = Arr::get($listData, 'd', []);
$pageCount = max(
    1,
    (int) Arr::get($listData, 'sp.pageCount', 1)
);
```

Pemakaian detail:

```php
$detailData = $this->assertSuccessful(
    $detailResponse,
    "Gagal mengambil detail PR Accurate ID {$accurateId}."
);

$detail = Arr::get($detailData, 'd', []);
```

## 11. Windows dan Laravel Pail

`php artisan pail` tidak berjalan native di Windows karena membutuhkan extension `pcntl`.

Gunakan PowerShell:

```powershell
Get-Content storage\logs\laravel.log -Wait -Tail 50
```

Untuk mengosongkan log:

```powershell
Clear-Content storage\logs\laravel.log
```

## 12. Validasi

```bash
php -l app/Services/Accurate/PurchaseRequisitionSyncService.php
php -l app/Http/Controllers/Purchasing/PurchaseRequisitionController.php
php -l app/Models/PurchaseRequisition.php
php -l app/Models/PurchaseRequisitionDetail.php
php artisan route:list --name=purchasing.purchase-requisition
php artisan migrate:status
php artisan optimize:clear
composer dump-autoload
npm run dev
```

Build production:

```bash
npm run build
```

## 13. Testing Checklist

- [ ] Route GET PR tersedia.
- [ ] Route POST sync PR tersedia.
- [ ] Migration header sudah `Ran`.
- [ ] Migration detail sudah `Ran`.
- [ ] Model dan relasi tersedia.
- [ ] List PR berhasil diambil.
- [ ] Pagination Accurate berjalan.
- [ ] Detail PR berhasil diambil.
- [ ] Header tersimpan.
- [ ] Detail tersimpan.
- [ ] Sync ulang tidak duplikat.
- [ ] Detail lama dapat dihapus.
- [ ] SweetAlert muncul.
- [ ] Summary tampil.
- [ ] Modal detail dapat dibuka.
- [ ] Item Code dan Item Name terpisah.

## 14. Perintah Git

Commit seluruh perubahan:

```bash
git status
git add .
git commit -m "Menyelesaikan modul Purchase Requisition Accurate"
git push
```

Commit khusus file modul PR:

```bash
git status
git add app/Services/Accurate/PurchaseRequisitionSyncService.php
git add app/Http/Controllers/Purchasing/PurchaseRequisitionController.php
git add app/Models/PurchaseRequisition.php
git add app/Models/PurchaseRequisitionDetail.php
git add resources/js/pages/purchasing/purchase-requisition/Index.tsx
git add database/migrations
git add routes/web.php

git commit -m "Memperbaiki sinkronisasi Purchase Requisition Accurate"
git push
```

Rekomendasi final:

```bash
git status
git add .
git commit -m "Menyelesaikan modul Purchase Requisition Accurate"
git push
```

## 15. Kesimpulan

Modul Purchase Requisition Accurate mengikuti pola yang sama dengan modul Purchase Order:

```text
AccurateClient
PurchaseRequisitionSyncService
PurchaseRequisitionController
PurchaseRequisition Model
PurchaseRequisitionDetail Model
Inertia Redirect
Flash Session
React Index.tsx
SweetAlert2
```

Perbaikan terpenting adalah memproses `Illuminate\Http\Client\Response` melalui `response->json()` sebelum membaca data Accurate sebagai array.
