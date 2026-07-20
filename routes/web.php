<?php

use App\Http\Controllers\Accurate\ItemMasterTestController;
use App\Http\Controllers\Administrator\CompanyController;
use App\Http\Controllers\Administrator\DepartmentController;
use App\Http\Controllers\Administrator\PositionController;
use App\Http\Controllers\Administrator\UserConfigController;
use App\Http\Controllers\Administrator\UserController;
use App\Http\Controllers\Administrator\UserLevelController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Purchasing\PurchaseOrderController;
use App\Http\Controllers\Purchasing\PurchaseRequisitionController;
use App\Http\Controllers\Purchasing\VendorController;
use App\Http\Controllers\SupplyChain\ApprovalConfigurationController;
use App\Http\Controllers\SupplyChain\MaterialRequestController;
use App\Http\Controllers\SupplyChain\MaterialRequestWorkflowController;
use App\Http\Controllers\Warehouse\ItemMasterController;
use App\Http\Controllers\Warehouse\ItemMasterImportController;
use App\Http\Controllers\Warehouse\WarehouseController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
})->name('home');

// Dashboard routes
Route::middleware(['auth'])->group(function (): void {
    Route::get(
        '/dashboard',
        [
            DashboardController::class,
            'index',
        ]
    )->name('dashboard');

    /*
     * Menjaga URL lama tetap berfungsi.
     */
    Route::get(
        '/fleet-dashboard',
        function () {
            return redirect()->route('dashboard');
        }
    )->name('fleet-dashboard');
});

// Authentication routes
Route::middleware(['auth'])->prefix('administrator')->name('administrator.')->group(function () {
    Route::resource('companies', CompanyController::class);

    Route::resource('users', UserController::class)->only([
        'index',
        'store',
        'update',
        'destroy',
    ]);

    Route::resource('user-levels', UserLevelController::class)->only([
        'index',
        'store',
        'update',
        'destroy',
    ]);

    Route::resource('positions', PositionController::class)->only([
        'index',
        'store',
        'update',
        'destroy',
    ]);

    Route::resource('departments', DepartmentController::class)->only([
        'index',
        'store',
        'update',
        'destroy',
    ]);

    Route::get('user-config', [UserConfigController::class, 'index'])
        ->name('user-config.index');

    Route::put('user-config', [UserConfigController::class, 'update'])
        ->name('user-config.update');

    Route::get('/timezone', function () {
        return Inertia::render('administrator/timezone/Index');
    })->name('timezone.index');
});

// Warehouse routes
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

Route::middleware(['auth'])
    ->prefix('accurate/item-master/test')
    ->name('accurate.item-master.test.')
    ->group(function () {
        Route::get(
            'list',
            [ItemMasterTestController::class, 'testList']
        )->name('list');

        Route::get(
            'detail',
            [ItemMasterTestController::class, 'testDetail']
        )->name('detail');
    });

Route::middleware(['auth'])
    ->prefix('warehouse')
    ->name('warehouse.')
    ->group(function () {
        Route::get(
            'item-master',
            [
                ItemMasterController::class,
                'index',
            ]
        )->name('item-master.index');

        Route::post(
            'item-master/sync/start',
            [
                ItemMasterController::class,
                'startSync',
            ]
        )->name('item-master.sync.start');

        Route::get(
            'item-master/sync/{syncRun}/progress',
            [
                ItemMasterController::class,
                'syncProgress',
            ]
        )->name('item-master.sync.progress');

        Route::post(
            'item-master/import',
            [
                ItemMasterImportController::class,
                'store',
            ]
        )->name('item-master.import.store');

        Route::get(
            'item-master/import/{importRun}/progress',
            [
                ItemMasterImportController::class,
                'progress',
            ]
        )->name('item-master.import.progress');

        Route::post(
            'item-master/sync/{syncRun}/retry',
            [
                ItemMasterController::class,
                'retrySync',
            ]
        )->name('item-master.sync.retry');
    });

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

        Route::get(
            'material-requests/{materialRequest}/edit-data',
            [
                MaterialRequestController::class,
                'editData',
            ]
        )->name(
            'material-requests.edit-data'
        );

        Route::post(
            'material-requests/{materialRequest}/submit',
            [
                MaterialRequestWorkflowController::class,
                'submit',
            ]
        )->name(
            'material-requests.submit'
        );

        Route::post(
            'material-requests/{materialRequest}/review',
            [
                MaterialRequestWorkflowController::class,
                'review',
            ]
        )->name(
            'material-requests.review'
        );

        Route::post(
            'material-requests/{materialRequest}/approve',
            [
                MaterialRequestWorkflowController::class,
                'approve',
            ]
        )->name(
            'material-requests.approve'
        );

        Route::post(
            'material-requests/{materialRequest}/revision',
            [
                MaterialRequestWorkflowController::class,
                'revision',
            ]
        )->name(
            'material-requests.revision'
        );

        Route::post(
            'material-requests/{materialRequest}/reject',
            [
                MaterialRequestWorkflowController::class,
                'reject',
            ]
        )->name(
            'material-requests.reject'
        );

        Route::resource(
            'material-requests',
            MaterialRequestController::class
        );
        Route::get(
            'approval-configuration',
            [ApprovalConfigurationController::class, 'index']
        )->name('approval-configuration.index');

        Route::put(
            'approval-configuration/{department}/matrix',
            [ApprovalConfigurationController::class, 'syncDepartment']
        )->name('approval-configuration.sync-department');

        Route::post(
            'approval-configuration/{department}/copy',
            [ApprovalConfigurationController::class, 'copyFromDepartment']
        )->name('approval-configuration.copy');
    });

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
