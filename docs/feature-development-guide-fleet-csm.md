# Fleet CSM - Panduan Menambahkan Fitur Baru

Dokumen ini digunakan sebagai standar kerja ketika ingin menambahkan fitur baru pada sistem Fleet CSM dengan tech stack yang sudah digunakan saat ini.

---

## 1. Tech Stack Project

Project Fleet CSM menggunakan stack berikut:

- Backend: Laravel 12
- Frontend: React
- Bridge: Inertia.js
- Styling: Tailwind CSS
- UI Layout: TailAdmin custom layout
- Database: MySQL
- Local Environment: Laragon
- Package Manager Frontend: npm
- Version Control: Git + GitHub

Struktur pendekatannya adalah Laravel sebagai backend utama, React sebagai halaman frontend, dan Inertia sebagai penghubung tanpa perlu membuat REST API manual untuk setiap halaman CRUD standar.

---

## 2. Prinsip Umum Menambahkan Fitur

Setiap fitur baru sebaiknya mengikuti pola yang sudah digunakan pada modul Administrator:

1. Buat migration database
2. Buat model Laravel
3. Buat controller Laravel
4. Tambahkan route di `routes/web.php`
5. Buat halaman React di `resources/js/pages`
6. Tambahkan menu ke tabel `menus` lewat seeder
7. Tambahkan permission default lewat seeder
8. Terapkan permission pada sidebar dan action button
9. Test fitur
10. Commit ke Git

Pola ini membuat fitur baru konsisten, mudah dikembangkan, dan mudah dikontrol berdasarkan permission.

---

## 3. Struktur Folder yang Digunakan

### Backend Laravel

```text
app/Models
app/Http/Controllers
app/Http/Controllers/Administrator
database/migrations
database/seeders
routes/web.php
```

### Frontend React + Inertia

```text
resources/js/pages
resources/js/layouts/tailadmin
resources/js/components
resources/js/context
resources/js/icons
```

### Dokumentasi

```text
docs
```

---

## 4. Standar Penamaan Fitur

Gunakan nama yang konsisten.

Contoh fitur: Material Request

| Bagian     | Nama                                                |
| ---------- | --------------------------------------------------- |
| Model      | `MaterialRequest`                                   |
| Controller | `MaterialRequestController`                         |
| Migration  | `create_material_requests_table`                    |
| Table      | `material_requests`                                 |
| Route URL  | `/scm/material-request`                             |
| Route Name | `scm.material-request.index`                        |
| React Page | `resources/js/pages/scm/material-request/Index.tsx` |
| Menu Code  | `material-request`                                  |

Contoh fitur: Warehouse

| Bagian     | Nama                                                |
| ---------- | --------------------------------------------------- |
| Model      | `Warehouse`                                         |
| Controller | `WarehouseController`                               |
| Migration  | `create_warehouses_table`                           |
| Table      | `warehouses`                                        |
| Route URL  | `/warehouse/warehouses`                             |
| Route Name | `warehouse.warehouses.index`                        |
| React Page | `resources/js/pages/warehouse/warehouses/Index.tsx` |
| Menu Code  | `warehouses`                                        |

---

## 5. Standar Database Migration

Setiap tabel utama disarankan memiliki field berikut:

```php
$table->id();
$table->boolean('is_active')->default(true);
$table->timestamps();
```

Jika fitur berupa transaksi, tambahkan field audit seperti:

```php
$table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
$table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
$table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
$table->timestamp('reviewed_at')->nullable();
$table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
$table->timestamp('approved_at')->nullable();
$table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
$table->timestamp('rejected_at')->nullable();
$table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
$table->timestamp('closed_at')->nullable();
```

Untuk fitur master data, gunakan pola:

```php
$table->string('code', 50)->unique();
$table->string('name', 150);
$table->text('description')->nullable();
$table->boolean('is_active')->default(true);
$table->timestamps();
```

Untuk fitur yang berkaitan dengan company, department, position:

```php
$table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
$table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
$table->foreignId('position_id')->nullable()->constrained('positions')->nullOnDelete();
```

---

## 6. Standar Model Laravel

Setiap model harus memiliki `$fillable`, `$casts`, dan relasi jika diperlukan.

Contoh:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExampleFeature extends Model
{
    protected $fillable = [
        'company_id',
        'code',
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
```

Jika nama tabel tidak mengikuti default Laravel, tambahkan:

```php
protected $table = 'nama_tabel';
```

---

## 7. Standar Controller Laravel

Controller CRUD standar minimal memiliki:

```text
index()
store()
update()
destroy()
```

Untuk fitur dengan approval, tambahkan:

```text
submit()
review()
approve()
reject()
close()
```

### Pola `index()`

`index()` bertugas:

1. Membaca filter search
2. Query data utama
3. Load relasi dengan `with()`
4. Mengambil data dropdown
5. Kirim ke Inertia page

Contoh:

```php
public function index(Request $request)
{
    $search = $request->string('search')->toString();

    $records = ExampleFeature::query()
        ->with(['company:id,company_code,company_name'])
        ->when($search, function ($query) use ($search) {
            $query->where(function ($subQuery) use ($search) {
                $subQuery
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        })
        ->latest()
        ->paginate(10)
        ->withQueryString();

    return Inertia::render('module/example-feature/Index', [
        'records' => $records,
        'filters' => [
            'search' => $search,
        ],
    ]);
}
```

### Pola `store()`

```php
public function store(Request $request)
{
    $validated = $request->validate([
        'code' => ['required', 'string', 'max:50', 'unique:example_features,code'],
        'name' => ['required', 'string', 'max:150'],
        'description' => ['nullable', 'string'],
        'is_active' => ['required', 'boolean'],
    ]);

    ExampleFeature::create($validated);

    return redirect()
        ->route('module.example-feature.index')
        ->with('success', 'Data berhasil ditambahkan.');
}
```

### Pola `update()`

```php
public function update(Request $request, ExampleFeature $exampleFeature)
{
    $validated = $request->validate([
        'code' => [
            'required',
            'string',
            'max:50',
            Rule::unique('example_features', 'code')->ignore($exampleFeature->id),
        ],
        'name' => ['required', 'string', 'max:150'],
        'description' => ['nullable', 'string'],
        'is_active' => ['required', 'boolean'],
    ]);

    $exampleFeature->update($validated);

    return redirect()
        ->route('module.example-feature.index')
        ->with('success', 'Data berhasil diperbarui.');
}
```

### Pola `destroy()`

```php
public function destroy(ExampleFeature $exampleFeature)
{
    ExampleFeature::whereKey($exampleFeature->id)->delete();

    return redirect()
        ->route('module.example-feature.index')
        ->with('success', 'Data berhasil dihapus.');
}
```

---

## 8. Standar Route

Route ditulis di:

```text
routes/web.php
```

Untuk modul Administrator:

```php
Route::middleware(['auth'])->prefix('administrator')->name('administrator.')->group(function () {
    Route::resource('example-features', ExampleFeatureController::class)->only([
        'index',
        'store',
        'update',
        'destroy',
    ]);
});
```

Untuk modul SCM:

```php
Route::middleware(['auth'])->prefix('scm')->name('scm.')->group(function () {
    Route::resource('material-request', MaterialRequestController::class)->only([
        'index',
        'store',
        'update',
        'destroy',
    ]);
});
```

Untuk route action khusus:

```php
Route::put('material-request/{materialRequest}/submit', [MaterialRequestController::class, 'submit'])
    ->name('material-request.submit');

Route::put('material-request/{materialRequest}/review', [MaterialRequestController::class, 'review'])
    ->name('material-request.review');

Route::put('material-request/{materialRequest}/approve', [MaterialRequestController::class, 'approve'])
    ->name('material-request.approve');

Route::put('material-request/{materialRequest}/reject', [MaterialRequestController::class, 'reject'])
    ->name('material-request.reject');
```

---

## 9. Standar React Page

React page diletakkan di:

```text
resources/js/pages/{module}/{feature}/Index.tsx
```

Contoh:

```text
resources/js/pages/scm/material-request/Index.tsx
resources/js/pages/administrator/users/Index.tsx
resources/js/pages/warehouse/item-master/Index.tsx
```

Pola page CRUD standar:

1. Import `AppLayout`
2. Import `router`, `useForm`, `usePage`
3. Buat type data
4. Ambil props dari Inertia
5. Buat state search
6. Buat state modal
7. Buat form dengan `useForm`
8. Buat function search
9. Buat function open create modal
10. Buat function open edit modal
11. Buat function submit
12. Buat function delete
13. Render table
14. Render pagination
15. Render modal form

---

## 10. Standar TypeScript Props

Contoh:

```tsx
type RecordItem = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
};

type PaginatedRecords = {
    data: RecordItem[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type PageProps = {
    records: PaginatedRecords;
    filters: {
        search?: string;
    };
    flash?: {
        success?: string;
    };
};
```

Gunakan fallback aman jika props mungkin belum terkirim:

```tsx
const pageProps = usePage().props as unknown as Partial<PageProps>;
const records = pageProps.records;
const filters = pageProps.filters ?? {};
const flash = pageProps.flash;
```

---

## 11. Standar UI CRUD

Setiap halaman CRUD sebaiknya memiliki:

1. Judul halaman
2. Deskripsi halaman
3. Tombol Add
4. Alert success
5. Search input
6. Table data
7. Empty state
8. Pagination
9. Modal Add/Edit
10. Confirm delete

Tombol action standar:

```text
Add
Edit
Delete
Review
Approve
Reject
Export
```

---

## 12. Standar Permission

Permission disimpan berdasarkan user level dan menu.

Tabel:

```text
menus
user_configs
```

Permission yang digunakan:

```text
can_view
can_create
can_edit
can_delete
can_review
can_approve
can_export
```

Aturan UI:

| Permission  | Fungsi                        |
| ----------- | ----------------------------- |
| can_view    | Melihat menu dan halaman      |
| can_create  | Menampilkan tombol Add/Create |
| can_edit    | Menampilkan tombol Edit       |
| can_delete  | Menampilkan tombol Delete     |
| can_review  | Menampilkan tombol Review     |
| can_approve | Menampilkan tombol Approve    |
| can_export  | Menampilkan tombol Export     |

---

## 13. Standar Menu Seeder

Setiap fitur baru harus ditambahkan ke `MasterAdministratorSeeder.php` pada method `seedMenus()`.

Contoh:

```php
[
    'menu_code' => 'material-request',
    'menu_name' => 'Material Request',
    'menu_group' => 'SCM',
    'route_name' => 'scm.material-request.index',
    'url' => '/scm/material-request',
    'icon' => 'FileIcon',
    'sort_order' => 100,
],
```

Setelah menambahkan menu baru, jalankan:

```bash
php artisan db:seed --class=MasterAdministratorSeeder
```

Jika masih development dan aman reset data:

```bash
php artisan migrate:fresh --seed
```

---

## 14. Standar Flow Transaksi

Untuk fitur transaksi seperti Material Request, gunakan status flow.

Contoh status:

```text
draft
submitted
reviewed
approved
rejected
closed
```

Flow:

```text
Draft
↓
Submitted
↓
Reviewed
↓
Approved
↓
Closed
```

Jika ditolak:

```text
Submitted / Reviewed
↓
Rejected
```

Permission yang digunakan:

| Action  | Permission                              |
| ------- | --------------------------------------- |
| Submit  | can_create / can_edit                   |
| Review  | can_review                              |
| Approve | can_approve                             |
| Reject  | can_approve atau can_review sesuai flow |
| Close   | can_approve                             |
| Export  | can_export                              |

---

## 15. Standar Audit Trail

Untuk transaksi, simpan siapa dan kapan action dilakukan.

Field minimal:

```text
created_by
updated_by
submitted_by
submitted_at
reviewed_by
reviewed_at
approved_by
approved_at
rejected_by
rejected_at
closed_by
closed_at
```

Ini penting agar history dokumen jelas.

---

## 16. Standar Validasi

Validasi dilakukan di controller menggunakan `$request->validate()`.

Contoh:

```php
$validated = $request->validate([
    'name' => ['required', 'string', 'max:150'],
    'email' => ['required', 'email', 'max:150'],
    'is_active' => ['required', 'boolean'],
]);
```

Untuk unique saat update:

```php
Rule::unique('table_name', 'column_name')->ignore($model->id)
```

Untuk foreign key:

```php
'company_id' => ['nullable', 'exists:companies,id']
```

---

## 17. Standar Search

Search standar menggunakan `when()`:

```php
->when($search, function ($query) use ($search) {
    $query->where(function ($subQuery) use ($search) {
        $subQuery
            ->where('code', 'like', "%{$search}%")
            ->orWhere('name', 'like', "%{$search}%");
    });
})
```

Untuk search relasi:

```php
->orWhereHas('company', function ($companyQuery) use ($search) {
    $companyQuery
        ->where('company_code', 'like', "%{$search}%")
        ->orWhere('company_name', 'like', "%{$search}%");
})
```

---

## 18. Standar Pagination

Gunakan:

```php
->paginate(10)
->withQueryString();
```

Frontend menggunakan:

```tsx
{
    records.links.map((link, index) => (
        <button
            key={index}
            type="button"
            disabled={!link.url}
            onClick={() => link.url && router.visit(link.url)}
            dangerouslySetInnerHTML={{ __html: link.label }}
        />
    ));
}
```

---

## 19. Standar Git Workflow

Setiap fitur dibuat dalam commit yang jelas.

Cek status:

```bash
git status
```

Tambahkan file:

```bash
git add .
```

Commit:

```bash
git commit -m "Menambahkan fitur nama fitur"
```

Push:

```bash
git push
```

Contoh:

```bash
git add .
git commit -m "Menambahkan CRUD material request"
git push
```

---

## 20. Checklist Menambahkan Fitur Baru

Gunakan checklist ini setiap membuat fitur baru.

### Database

- [ ] Buat migration
- [ ] Tentukan nama tabel
- [ ] Tambahkan foreign key jika perlu
- [ ] Tambahkan field status jika transaksi
- [ ] Tambahkan field audit jika transaksi
- [ ] Jalankan migration

### Backend

- [ ] Buat model
- [ ] Isi fillable
- [ ] Isi casts
- [ ] Tambahkan relasi
- [ ] Buat controller
- [ ] Buat method index
- [ ] Buat method store
- [ ] Buat method update
- [ ] Buat method destroy
- [ ] Tambahkan method action khusus jika perlu

### Route

- [ ] Import controller di `routes/web.php`
- [ ] Tambahkan route resource
- [ ] Tambahkan route action khusus
- [ ] Jalankan `php artisan optimize:clear`
- [ ] Cek `php artisan route:list`

### Frontend

- [ ] Buat folder page
- [ ] Buat `Index.tsx`
- [ ] Buat type data
- [ ] Buat form state
- [ ] Buat table
- [ ] Buat modal add/edit
- [ ] Buat delete confirmation
- [ ] Buat pagination
- [ ] Tambahkan permission check

### Menu & Permission

- [ ] Tambahkan menu di seeder
- [ ] Jalankan seeder
- [ ] Pastikan permission terbentuk
- [ ] Terapkan menu ke sidebar
- [ ] Terapkan permission ke tombol action

### Testing

- [ ] Test open halaman
- [ ] Test search
- [ ] Test add
- [ ] Test edit
- [ ] Test delete
- [ ] Test permission
- [ ] Test responsive mobile
- [ ] Test tidak ada error console

### Git

- [ ] `git status`
- [ ] `git add .`
- [ ] `git commit -m "..."`
- [ ] `git push`

---

## 21. Urutan Rekomendasi Pengembangan Berikutnya

Setelah Administrator Module selesai, urutan yang direkomendasikan adalah:

1. Apply permission ke sidebar
2. Apply permission ke action button
3. Material Request
4. Material Request Review
5. Material Request Approval
6. Purchase Request / Purchase Order
7. Receive Item
8. Item Master
9. Warehouse Stock
10. Accurate Sync
11. Report & Dashboard

---

## 22. Catatan Penting

Jangan membuat route duplikat untuk URL yang sama.

Contoh salah:

```php
Route::get('user-config', [UserConfigController::class, 'index'])
    ->name('user-config.index');

Route::get('/user-config', function () {
    return Inertia::render('administrator/user-config/Index');
})->name('user-config.index');
```

Route kedua akan menimpa controller dan membuat props tidak terkirim.

Gunakan satu route saja:

```php
Route::get('user-config', [UserConfigController::class, 'index'])
    ->name('user-config.index');
```

Jangan membuat dua tabel permission untuk fungsi yang sama.

Pilih salah satu:

```text
user_configs
```

atau:

```text
user_level_permissions
```

Untuk project ini, permission menggunakan:

```text
user_configs
```

Model `UserLevelPermission` diarahkan ke tabel tersebut:

```php
protected $table = 'user_configs';
```

---

## 23. Kesimpulan

Setiap fitur baru di Fleet CSM harus mengikuti pola yang konsisten:

```text
Migration
Model
Controller
Route
React Page
Menu Seeder
Permission
Testing
Git Commit
```

Dengan pola ini, sistem akan lebih rapi, mudah dikembangkan, dan tidak membingungkan saat fitur semakin banyak.
