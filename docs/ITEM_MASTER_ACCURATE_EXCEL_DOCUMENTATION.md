# Dokumentasi Modul Item Master Accurate & Import Excel

## 1. Tujuan Modul

Modul **Item Master** pada Fleet CSM dibuat untuk menyimpan dan menampilkan data master item yang berasal dari Accurate Online.

Agar proses lebih cepat dan stabil, alur data dipisahkan menjadi dua bagian:

1. **Sinkronisasi list item dari Accurate**
2. **Import detail item dari Excel**

Dengan pendekatan ini, sistem tidak perlu memanggil `item/detail.do` satu per satu untuk belasan ribu item.

---

## 2. Arsitektur Akhir

### 2.1 Sinkronisasi Accurate List

Sumber data:

```text
item/list.do
```

Field yang diambil:

| Accurate | Fleet CSM |
|---|---|
| `id` | `accurate_id` |
| `no` | `item_code` |
| `name` | `item_description` |
| `charField1` | `part_number` |
| `unit1Name` | `unit_name` |
| `suspended` | `is_active` |

Proses sinkronisasi berjalan menggunakan queue dan diproses per halaman.

Alur:

```text
Klik Sync Item Master
→ ItemMasterController::startSync()
→ membuat AccurateSyncRun
→ dispatch SyncItemMasterPageJob
→ ItemMasterSyncService::syncPage()
→ request item/list.do
→ upsert ke item_masters
→ lanjut halaman berikutnya
→ finishSync()
→ status COMPLETED
```

### 2.2 Import Detail Excel

Sumber data:

```text
File Excel hasil export item Accurate
```

Pencocokan dilakukan berdasarkan:

```text
Part Code Excel = item_masters.item_code
```

Import Excel hanya memperbarui item yang sudah ada di database.

Item yang tidak ditemukan di database akan dihitung sebagai:

```text
Unmatched
```

Import tidak membuat item baru tanpa `accurate_id`.

---

## 3. File Utama yang Digunakan

### Sinkronisasi Accurate

```text
app/Http/Controllers/Warehouse/ItemMasterController.php
app/Jobs/Accurate/SyncItemMasterPageJob.php
app/Services/Accurate/ItemMasterSyncService.php
app/Services/Accurate/AccurateClient.php
app/Models/AccurateSyncRun.php
app/Models/ItemMaster.php
```

### Import Excel

```text
app/Http/Controllers/Warehouse/ItemMasterImportController.php
app/Imports/ItemMasterDetailImport.php
app/Models/ItemMasterImportRun.php
```

### Frontend

```text
resources/js/pages/warehouse/item-master/Index.tsx
```

### Migration

```text
database/migrations/*_create_accurate_sync_runs_table.php
database/migrations/*_add_sync_tracking_to_item_masters_table.php
database/migrations/*_add_excel_fields_to_item_masters_table.php
database/migrations/*_create_item_master_import_runs_table.php
```

### Route

```text
routes/web.php
```

---

## 4. Tabel Database

### 4.1 `item_masters`

Tabel utama Item Master.

Field dasar Accurate:

```text
accurate_id
item_code
part_number
item_description
unit_name
is_active
accurate_raw
sync_error
last_sync_at
last_seen_sync_id
last_seen_at
created_by
updated_by
```

Field hasil import Excel:

```text
category_name
item_type
brand_name
preferred_vendor
minimum_stock
total_stock
excel_inactive
length_cm
width_cm
height_cm
weight_gram
cross_reference_part_no
equipment_type
compatible_equipment_model
specification
bin_location_bpn
bin_location_jkt
class_movement
reorder_quantity
maximum_quantity
excel_imported_at
excel_imported_by
excel_source_file
```

### 4.2 `accurate_sync_runs`

Digunakan untuk menyimpan progress sinkronisasi Accurate.

Status:

```text
PENDING
PROCESSING
COMPLETED
FAILED
CANCELLED
```

### 4.3 `item_master_import_runs`

Digunakan untuk menyimpan progress import Excel.

Status:

```text
PENDING
PROCESSING
COMPLETED
FAILED
```

---

## 5. Sinkronisasi Accurate List

### 5.1 Controller

Method utama:

```text
index()
startSync()
syncProgress()
retrySync()
```

`startSync()` membuat record baru di `accurate_sync_runs`, mencegah sync ganda, lalu dispatch `SyncItemMasterPageJob`.

`syncProgress()` dipakai frontend untuk polling progress.

`retrySync()` melanjutkan sync dari halaman terakhir yang berhasil.

### 5.2 Job Queue

File:

```text
app/Jobs/Accurate/SyncItemMasterPageJob.php
```

Job melakukan:

1. membaca sync run;
2. menentukan halaman berikutnya;
3. mengubah status menjadi `PROCESSING`;
4. memanggil `ItemMasterSyncService::syncPage()`;
5. memperbarui progress;
6. dispatch halaman berikutnya;
7. menjalankan `finishSync()` setelah halaman terakhir;
8. mengubah status menjadi `COMPLETED`.

Job menggunakan `WithoutOverlapping` agar sync run yang sama tidak berjalan ganda.

### 5.3 Service Accurate

File:

```text
app/Services/Accurate/ItemMasterSyncService.php
```

Endpoint yang digunakan hanya:

```text
item/list.do
```

Tidak ada pemanggilan:

```text
item/detail.do
```

Data diproses dengan `upsert()` berdasarkan `accurate_id`.

---

## 6. Import Excel Detail

### 6.1 Package

```bash
composer require maatwebsite/excel
```

### 6.2 Import Controller

File:

```text
app/Http/Controllers/Warehouse/ItemMasterImportController.php
```

Controller menangani upload, validasi, penyimpanan file, pembuatan import run, queued import, dan progress polling.

### 6.3 Import Class

File:

```text
app/Imports/ItemMasterDetailImport.php
```

Concern yang digunakan:

```php
ShouldQueue
ToCollection
WithHeadingRow
WithChunkReading
WithEvents
```

Trait:

```php
RegistersEventListeners
```

Chunk size:

```php
public function chunkSize(): int
{
    return 2000;
}
```

Heading row file terbaru:

```php
public function headingRow(): int
{
    return 1;
}
```

### 6.4 Mapping Excel

| Header Excel | Kolom Database |
|---|---|
| `Part Code` | `item_code` |
| `OEM Part Number` | `part_number` |
| `Part Description` | `item_description` |
| `Category` | `category_name` |
| `Type` | `item_type` |
| `UOM` | `unit_name` |
| `Brand` | `brand_name` |
| `Prefered Vendor` | `preferred_vendor` |
| `Min Stock` | `minimum_stock` |
| `Total Stock` | `total_stock` |
| `Non Aktif` | `excel_inactive` |
| `Panjang (cm)` | `length_cm` |
| `Lebar (cm)` | `width_cm` |
| `Tinggi (cm)` | `height_cm` |
| `Berat (gr)` | `weight_gram` |
| `CROSS REFERENCE PART NO` | `cross_reference_part_no` |
| `Equipment Type` | `equipment_type` |
| `Compatible Equipment Model` | `compatible_equipment_model` |
| `Spesification` | `specification` |
| `Bin Location BPN` | `bin_location_bpn` |
| `Bin Location JKT` | `bin_location_jkt` |
| `Class Movement` | `class_movement` |
| `Re-Order Quantity` | `reorder_quantity` |
| `Maximum Quantity` | `maximum_quantity` |

### 6.5 Aturan Import

```text
Excel Part Code ditemukan di item_masters
→ update data detail

Excel Part Code tidak ditemukan
→ unmatched

Part Code kosong
→ skipped

Terjadi exception per baris
→ failed
```

Nilai kosong dari Excel tidak menghapus data lama.

### 6.6 Perbaikan `accurate_id`

Karena `accurate_id` bersifat `NOT NULL`, setiap row upsert wajib membawa:

```php
'accurate_id' => $existing->accurate_id,
'item_code' => $itemCode,
```

Upsert menggunakan:

```php
DB::table('item_masters')->upsert(
    $upsertRows,
    ['accurate_id'],
    [...]
);
```

Tanpa `accurate_id`, MySQL menghasilkan:

```text
Field 'accurate_id' doesn't have a default value
```

### 6.7 Event Selesai dan Gagal

Import class harus mengimplementasikan `WithEvents`.

Event selesai:

```php
public static function afterImport(
    AfterImport $event
): void
```

Event gagal:

```php
public static function importFailed(
    ImportFailed $event
): void
```

Tanpa `WithEvents`, job selesai tetapi status import bisa tetap `PROCESSING`.

---

## 7. Hasil yang Dicapai

Hasil sync Accurate:

```text
Processed : 17.022
Inserted  : 16.024
Updated   : 998
Skipped   : 0
Failed    : 0
```

Hasil import Excel:

```text
Processed : 17.022
Updated   : 15.904
Unmatched : 1.118
Skipped   : 0
Failed    : 0
```

Arti hasil:

- `Updated`: Part Code Excel ditemukan di database;
- `Unmatched`: Part Code Excel tidak ditemukan pada hasil sync Accurate;
- `Skipped`: Part Code kosong;
- `Failed`: error parsing atau update.

---

## 8. Frontend `Index.tsx`

Fitur yang tersedia:

```text
Sync Item Master
Import Excel Detail
Progress sync Accurate
Progress import Excel
Filter
Search
Pagination
Modal detail
Collapse header
SweetAlert progress
Auto polling
```

Modal detail dibagi menjadi:

```text
Basic Information
Inventory
Compatibility
Warehouse Location
Dimension
Synchronization
```

### Menyembunyikan Progress Setelah Selesai

Card progress tidak ditampilkan saat status sudah `COMPLETED`.

Contoh:

```tsx
{syncRun
    && syncRun.status !== 'COMPLETED'
    && syncRun.status !== 'CANCELLED' && (
        <SyncProgressCard run={syncRun} />
    )}

{importRun
    && importRun.status !== 'COMPLETED' && (
        <ImportProgressCard run={importRun} />
    )}
```

Setelah selesai:

```tsx
setSyncRun(null);
setImportRun(null);
```

---

## 9. Route

```php
Route::get(
    'item-master',
    [ItemMasterController::class, 'index']
)->name('item-master.index');

Route::post(
    'item-master/sync/start',
    [ItemMasterController::class, 'startSync']
)->name('item-master.sync.start');

Route::get(
    'item-master/sync/{syncRun}/progress',
    [ItemMasterController::class, 'syncProgress']
)->name('item-master.sync.progress');

Route::post(
    'item-master/sync/{syncRun}/retry',
    [ItemMasterController::class, 'retrySync']
)->name('item-master.sync.retry');

Route::post(
    'item-master/import',
    [ItemMasterImportController::class, 'store']
)->name('item-master.import.store');

Route::get(
    'item-master/import/{importRun}/progress',
    [ItemMasterImportController::class, 'progress']
)->name('item-master.import.progress');
```

---

## 10. Queue

`.env`:

```env
QUEUE_CONNECTION=database
```

Worker development:

```bash
php artisan queue:work --tries=3 --timeout=600
```

Worker debugging:

```bash
php artisan queue:work --tries=1 --timeout=600 -v
```

Setelah perubahan kode queue:

```bash
php artisan queue:restart
```

---

## 11. Perintah Validasi

```bash
php -l app/Imports/ItemMasterDetailImport.php
php -l app/Http/Controllers/Warehouse/ItemMasterController.php
php -l app/Http/Controllers/Warehouse/ItemMasterImportController.php
php -l app/Jobs/Accurate/SyncItemMasterPageJob.php
php -l app/Services/Accurate/ItemMasterSyncService.php

php artisan migrate:status
php artisan route:list --name=warehouse.item-master
composer dump-autoload
php artisan optimize:clear
npm run build
```

---

## 12. Query Pemeriksaan Database

### Total item

```sql
SELECT COUNT(*) AS total
FROM item_masters;
```

### Item hasil import Excel

```sql
SELECT COUNT(*) AS imported_items
FROM item_masters
WHERE excel_imported_at IS NOT NULL;
```

### Progress sync terakhir

```sql
SELECT
    id,
    status,
    current_page,
    total_pages,
    processed_items,
    inserted_items,
    updated_items,
    skipped_items,
    failed_items
FROM accurate_sync_runs
WHERE module = 'item_master'
ORDER BY id DESC
LIMIT 1;
```

### Progress import terakhir

```sql
SELECT
    id,
    status,
    original_filename,
    processed_rows,
    updated_rows,
    unmatched_rows,
    skipped_rows,
    failed_rows,
    error_message
FROM item_master_import_runs
ORDER BY id DESC
LIMIT 1;
```

---

## 13. Catatan Penting

1. Jangan menghapus `item_masters` setelah sync list selesai.
2. Import Excel membutuhkan data list agar dapat mengambil `accurate_id`.
3. Jangan insert item Excel yang tidak ditemukan di Accurate.
4. Jangan mengubah `is_active` dari Excel.
5. Status Accurate tetap berasal dari `item/list.do`.
6. `excel_inactive` hanya menyimpan status dari Excel.
7. Gunakan `accurate_id` sebagai key utama upsert.
8. Gunakan `item_code` untuk mencari pasangan dari Excel.
9. Restart queue worker setelah mengubah class import atau job.
10. Pastikan tidak ada import lama berstatus `PENDING` atau `PROCESSING` sebelum memulai import baru.

---

## 14. Alur Operasional

### Sinkronisasi List

```text
1. Jalankan queue worker
2. Buka halaman Item Master
3. Klik Sync Item Master
4. Tunggu status COMPLETED
5. Periksa jumlah item
```

### Import Detail

```text
1. Pastikan sync list selesai
2. Klik Import Excel Detail
3. Pilih file Excel
4. Tunggu status COMPLETED
5. Periksa Updated, Unmatched, Skipped, Failed
6. Buka modal Detail untuk verifikasi
```

---

## 15. Kesimpulan

Modul Item Master sekarang menggunakan pola:

```text
Accurate item/list.do
→ identitas dan status item

Excel import
→ detail item

Queue
→ proses background

Polling
→ progress realtime

Retry
→ melanjutkan proses gagal
```

Pendekatan ini lebih cepat daripada mengambil detail item satu per satu melalui `item/detail.do`, lebih aman terhadap timeout, dan lebih mudah dipantau.
