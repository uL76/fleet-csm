# Dokumentasi Modul Material Request — Fleet CSM

## 1. Ringkasan

Modul Material Request menggunakan Laravel 12, PHP 8.2, React, TypeScript, Inertia.js, TailAdmin, MySQL, SweetAlert2, dan Axios.

Alur utama:

```text
DRAFT → SUBMITTED → REVIEWED → APPROVED
```

Status tambahan:

```text
IN_REVIEW
REVISION
REJECTED
CANCELLED
CLOSED
```

Approval awal:

```text
Sequence 1 → REVIEW oleh Yuli
Sequence 2 → APPROVE oleh Jesen Erlando
```

Approval route disimpan berdasarkan `department_id`, bukan position.

---

## 2. Struktur Database

Tabel modul:

```text
material_requests
material_request_items
document_approval_routes
material_request_approvals
material_request_logs
```

### 2.1 `material_requests`

Header dokumen MR.

Field penting:

```text
id
mr_number
mr_date
requested_by
department_id
company_id
branch
priority
required_date
request_type
customer_name
sales_order_no
reference_rfq
subject
remarks
status
current_approval_sequence
submitted_at
reviewed_at
approved_at
rejected_at
closed_at
created_by
updated_by
created_at
updated_at
deleted_at
```

### 2.2 `material_request_items`

Detail barang:

```text
id
material_request_id
item_master_id
item_code
part_number
description
brand
uom
quantity
available_stock
required_date
suggested_vendor
estimated_price
lead_time_days
remarks
process_status
created_at
updated_at
```

### 2.3 `document_approval_routes`

Konfigurasi approval per department:

```text
document_type
department_id
sequence
action_type
user_id
is_required
is_active
```

### 2.4 `material_request_approvals`

Snapshot approval setelah MR disubmit.

### 2.5 `material_request_logs`

Audit trail, misalnya:

```text
CREATED
UPDATED
SUBMITTED
REVIEWED
APPROVED
REVISION_REQUESTED
REJECTED
DELETED
```

---

## 3. Enum Status

File:

```text
app/Enums/MaterialRequestStatus.php
```

```php
<?php

namespace App\Enums;

enum MaterialRequestStatus: string
{
    case Draft = 'DRAFT';
    case Submitted = 'SUBMITTED';
    case InReview = 'IN_REVIEW';
    case Reviewed = 'REVIEWED';
    case Approved = 'APPROVED';
    case Revision = 'REVISION';
    case Rejected = 'REJECTED';
    case Cancelled = 'CANCELLED';
    case Closed = 'CLOSED';
}
```

Tes:

```bash
php artisan tinker
```

```php
enum_exists(App\Enums\MaterialRequestStatus::class);
App\Enums\MaterialRequestStatus::Draft->value;
```

Hasil:

```text
true
DRAFT
```

Tes cast model:

```php
$mr = new App\Models\MaterialRequest();
$mr->status = App\Enums\MaterialRequestStatus::Draft;
$mr->status;
```

Hasil:

```text
App\Enums\MaterialRequestStatus::Draft
```

Jika enum tidak terbaca:

```bash
composer dump-autoload
php artisan optimize:clear
```

---

## 4. Model

### 4.1 `MaterialRequest`

File:

```text
app/Models/MaterialRequest.php
```

Cast:

```php
protected function casts(): array
{
    return [
        'status' => MaterialRequestStatus::class,
        'mr_date' => 'date',
        'required_date' => 'date',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'closed_at' => 'datetime',
    ];
}
```

Relationship:

```text
requester
department
company
creator
updater
items
approvals
logs
```

### 4.2 `MaterialRequestItem`

Relationship:

```text
materialRequest
itemMaster
```

Cast yang disarankan:

```php
protected function casts(): array
{
    return [
        'quantity' => 'decimal:2',
        'available_stock' => 'decimal:2',
        'estimated_price' => 'decimal:2',
        'required_date' => 'date',
    ];
}
```

---

## 5. Approval Route Seeder

File:

```text
database/seeders/MaterialRequestApprovalRouteSeeder.php
```

Kolom department yang benar:

```text
department_name
```

Department:

```text
Finance
Management
Operation
Sales
Purchasing
Warehouse
Accounting
```

Reviewer:

```text
yuli@ciptasemangatmaju.com
```

Approver:

```text
jesen@ciptasemangatmaju.com
```

Jalankan:

```bash
php artisan db:seed --class=MaterialRequestApprovalRouteSeeder
```

Target:

```text
7 department × 2 sequence = 14 baris
```

Cek:

```sql
SELECT
    dar.id,
    dar.document_type,
    d.department_name,
    dar.sequence,
    dar.action_type,
    u.name AS assigned_user,
    u.email AS assigned_email,
    dar.is_required,
    dar.is_active
FROM document_approval_routes AS dar
INNER JOIN departments AS d
    ON d.id = dar.department_id
INNER JOIN users AS u
    ON u.id = dar.user_id
WHERE dar.document_type = 'MR'
ORDER BY d.department_name, dar.sequence;
```

---

## 6. Request Validation

File:

```text
app/Http/Requests/SupplyChain/
├── StoreMaterialRequestRequest.php
├── UpdateMaterialRequestRequest.php
└── MaterialRequestWorkflowRequest.php
```

Validasi header:

```text
mr_date              required date
department_id        required exists active
company_id           nullable exists active
priority             required enum
required_date        nullable date >= mr_date
request_type         required enum
subject              required max 255
remarks              nullable
```

Validasi item:

```text
items                        required array min 1
items.*.item_master_id       nullable exists
items.*.item_code            required
items.*.description          required
items.*.quantity             required numeric > 0
items.*.available_stock      numeric >= 0
items.*.estimated_price      numeric >= 0
items.*.lead_time_days       integer >= 0
```

---

## 7. Service

### 7.1 `MaterialRequestNumberService`

File:

```text
app/Services/SupplyChain/MaterialRequestNumberService.php
```

Format nomor:

```text
MR-2026-000001
MR-2026-000002
```

### 7.2 `MaterialRequestService`

File:

```text
app/Services/SupplyChain/MaterialRequestService.php
```

Fungsi:

```text
create()
update()
delete()
ensureEditable()
prepareItemPayload()
writeLog()
```

Saat create:

```text
status = MaterialRequestStatus::Draft
current_approval_sequence = null
created_by = user login
updated_by = user login
```

Karena status sudah dicast enum, gunakan:

```php
$materialRequest->status === MaterialRequestStatus::Draft
```

Bukan:

```php
$materialRequest->status === 'DRAFT'
```

Untuk log:

```php
MaterialRequestStatus::Draft->value
```

---

## 8. Policy

File:

```text
app/Policies/MaterialRequestPolicy.php
```

Ability:

```text
viewAny
view
create
update
delete
submit
```

Aturan:

```text
update:
- can_edit
- status DRAFT atau REVISION
- requested_by sama dengan user login

delete:
- can_delete
- status DRAFT
- requested_by sama dengan user login

submit:
- can_edit
- status DRAFT atau REVISION
- requested_by sama dengan user login
```

Base controller:

```php
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    use AuthorizesRequests;
}
```

---

## 9. Controller

File:

```text
app/Http/Controllers/SupplyChain/MaterialRequestController.php
```

Method:

```text
index()
create()
store()
show()
edit()
update()
destroy()
itemMasterOptions()
```

`index()` mengirim:

```text
materialRequests
summary
departments
filters
permissions
```

`create()` mengirim:

```text
departments
companies
requester
priorityOptions
requestTypeOptions
```

`show()` load:

```text
requester
department
company
items.itemMaster
approvals.assignedUser
approvals.actionUser
logs.user
```

`itemMasterOptions()` mendukung search:

```text
item_code
part_number
item_description
brand_name
cross_reference_part_no
```

---

## 10. Routes

```php
Route::middleware([
    'auth',
    'verified',
])
    ->prefix('supply-chain')
    ->name('supply-chain.')
    ->group(function (): void {
        Route::get(
            'material-requests/item-master-options',
            [
                MaterialRequestController::class,
                'itemMasterOptions',
            ]
        )->name(
            'material-requests.item-master-options'
        );

        Route::resource(
            'material-requests',
            MaterialRequestController::class
        );
    });
```

Route `item-master-options` harus berada sebelum resource.

Validasi:

```bash
php artisan route:list --name=supply-chain.material-requests
```

---

## 11. Frontend React

Folder:

```text
resources/js/pages/supply-chain/material-request/
```

Struktur:

```text
Index.tsx
Create.tsx
Edit.tsx
Show.tsx
types.ts
components/
├── MaterialRequestForm.tsx
├── MaterialRequestItemsTable.tsx
├── ItemMasterPickerModal.tsx
├── PriorityBadge.tsx
└── StatusBadge.tsx
```

### `Index.tsx`

Fitur:

```text
header collapse/expand
summary card
filter
pagination
detail modal
status badge
priority badge
create button
```

### `Create.tsx`

Membuat MR baru dan menyimpan sebagai Draft.

### `MaterialRequestForm.tsx`

Reusable untuk Create dan Edit.

Bagian:

```text
MR Header Information
Reference Information
Request Information
Material Request Items
```

### `ItemMasterPickerModal.tsx`

Fitur:

```text
search server-side
debounce
pagination Load More
axios
select item
prevent duplicate
```

### `MaterialRequestItemsTable.tsx`

Kolom:

```text
Item Code
Part Number
Description
Brand
UOM
Stock
Qty Request
Required Date
Suggested Vendor
Estimated Price
Lead Time
Remarks
Action
```

### `Show.tsx`

Menampilkan:

```text
header MR
request information
workflow information
item detail
approval timeline
audit history
edit button
delete button
submit button
```

Saat ini tombol Submit masih placeholder.

---

## 12. Dependency Frontend

Install:

```bash
npm install axios sweetalert2
```

Digunakan untuk:

```text
konfirmasi Save Draft
konfirmasi Update Draft
konfirmasi Delete
warning duplicate item
warning quantity invalid
```

---

## 13. Testing CRUD Draft

### Create

Buka:

```text
/supply-chain/material-requests/create
```

Tes:

```text
department tampil
company tampil
requester otomatis
modal Item Master terbuka
search Item Master berhasil
item dapat dipilih
duplicate item ditolak
quantity dapat diubah
Save Draft berhasil
redirect ke Show
```

Cek header:

```sql
SELECT
    id,
    mr_number,
    mr_date,
    requested_by,
    department_id,
    company_id,
    priority,
    request_type,
    subject,
    status,
    created_at
FROM material_requests
ORDER BY id DESC
LIMIT 10;
```

Cek item:

```sql
SELECT
    id,
    material_request_id,
    item_master_id,
    item_code,
    description,
    quantity,
    available_stock,
    estimated_price,
    process_status
FROM material_request_items
ORDER BY id DESC
LIMIT 20;
```

Cek log:

```sql
SELECT
    id,
    material_request_id,
    user_id,
    action,
    from_status,
    to_status,
    comments,
    created_at
FROM material_request_logs
ORDER BY id DESC
LIMIT 20;
```

Target:

```text
action = CREATED
to_status = DRAFT
```

### Edit

Tes perubahan:

```text
subject
priority
required_date
quantity
vendor
estimated_price
remarks
```

Target:

```text
status tetap DRAFT
header berubah
detail item berubah
log UPDATED tersimpan
```

### Delete

Target:

```text
SweetAlert muncul
deleted_at terisi
redirect ke Index
flash success muncul
```

Cek:

```sql
SELECT
    id,
    mr_number,
    status,
    deleted_at
FROM material_requests
ORDER BY id DESC
LIMIT 10;
```

---

## 14. Error yang Sudah Diselesaikan

### Index name terlalu panjang

Gunakan nama manual:

```php
$table->index(
    [
        'material_request_id',
        'sequence',
        'status',
    ],
    'mra_mr_seq_status_idx'
);
```

### Seeder memakai kolom `name`

Gunakan:

```text
department_name
```

### Controller tidak memiliki `authorize()`

Tambahkan:

```php
use AuthorizesRequests;
```

### Enum tidak ditemukan

Pastikan file:

```text
app/Enums/MaterialRequestStatus.php
```

Lalu:

```bash
composer dump-autoload
php artisan optimize:clear
```

---

## 15. Status Implementasi

Sudah dibuat:

```text
database migration
model
relationship
enum
approval route seeder
request validation
number service
material request service
policy
controller
routes
Index
Create
Edit
Show
Item Master Picker
Items Table
SweetAlert
CRUD Draft frontend
```

Sedang diuji:

```text
Create Draft
Edit Draft
Delete Draft
database log
soft delete
```

Belum dikerjakan:

```text
Submit MR
snapshot approval
Review oleh Yuli
Approve oleh Jesen
Revision
Reject
Approval Configuration page
notification
export PDF
print MR
```

---

## 16. Tahap Berikutnya

### Submit MR

```text
DRAFT
→ ambil approval route berdasarkan department
→ copy ke material_request_approvals
→ sequence pertama PENDING
→ status SUBMITTED
→ submitted_at terisi
→ current_approval_sequence = 1
→ log SUBMITTED
```

### Review MR

```text
SUBMITTED
→ Yuli REVIEW
→ sequence 1 APPROVED
→ status MR REVIEWED
→ reviewed_at terisi
→ current_approval_sequence = 2
```

### Approve MR

```text
REVIEWED
→ Jesen APPROVE
→ sequence 2 APPROVED
→ status MR APPROVED
→ approved_at terisi
→ current_approval_sequence = null
```

### Revision

```text
SUBMITTED atau REVIEWED
→ REVISION
→ komentar wajib
→ pembuat dapat edit
→ submit ulang
```

### Reject

```text
SUBMITTED atau REVIEWED
→ REJECTED
→ komentar wajib
→ rejected_at terisi
→ workflow berhenti
```

---

## 17. Perintah Validasi

Backend:

```bash
php -l app/Enums/MaterialRequestStatus.php
php -l app/Models/MaterialRequest.php
php -l app/Services/SupplyChain/MaterialRequestNumberService.php
php -l app/Services/SupplyChain/MaterialRequestService.php
php -l app/Policies/MaterialRequestPolicy.php
php -l app/Http/Controllers/SupplyChain/MaterialRequestController.php
```

Laravel:

```bash
composer dump-autoload
php artisan optimize:clear
php artisan route:list --name=supply-chain.material-requests
```

Frontend:

```bash
npm run build
```

Development:

```bash
npm run dev
```

---

## 18. Catatan Teknis

- Authorization wajib diperiksa di backend.
- Frontend hanya mengatur tampilan tombol.
- Gunakan transaction pada create, update, submit, review, approve, revision, dan reject.
- Gunakan `lockForUpdate()` pada workflow untuk mencegah aksi ganda.
- Approval route harus disnapshot saat submit.
- Gunakan email atau user ID untuk menentukan reviewer/approver.
- Audit log tidak boleh dihapus.
- Resubmit setelah revision sebaiknya memakai approval round/version.

---

## 19. Checklist CRUD Draft

```text
[ ] Enum terbaca
[ ] Save Draft berhasil
[ ] MR number terbentuk
[ ] Header tersimpan
[ ] Item tersimpan
[ ] Log CREATED tersimpan
[ ] Show tampil
[ ] Edit berhasil
[ ] Log UPDATED tersimpan
[ ] Delete Draft berhasil
[ ] Soft delete aktif
[ ] Index terupdate
[ ] npm run build berhasil
[ ] route:list sesuai
```
