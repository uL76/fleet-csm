<?php

use App\Http\Controllers\Accurate\ItemMasterTestController;
use App\Http\Controllers\Administrator\CompanyController;
use App\Http\Controllers\Administrator\DepartmentController;
use App\Http\Controllers\Administrator\PositionController;
use App\Http\Controllers\Administrator\UserConfigController;
use App\Http\Controllers\Administrator\UserController;
use App\Http\Controllers\Administrator\UserLevelController;
use App\Http\Controllers\Purchasing\PurchaseOrderController;
use App\Http\Controllers\Purchasing\VendorController;
use App\Http\Controllers\Warehouse\ItemMasterController;
use App\Http\Controllers\Warehouse\WarehouseController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Dashboard routes
Route::get('/fleet-dashboard', function () {
    return Inertia::render('dashboard/Index');
})->name('dashboard');

Route::get('/material-request', function () {
    return Inertia::render('material-request/Index');
})->name('material-request.index');

Route::get('/purchase-order', function () {
    return Inertia::render('purchase-order/Index');
})->name('purchase-order.index');

Route::get('/receive-item', function () {
    return Inertia::render('receive-item/Index');
})->name('receive-item.index');

Route::get('/item-master', function () {
    return Inertia::render('item-master/Index');
})->name('item-master.index');

Route::get('/accurate-sync', function () {
    return Inertia::render('accurate-sync/Index');
})->name('accurate-sync.index');

Route::get('/approval', function () {
    return Inertia::render('approval/Index');
})->name('approval.index');

Route::get('/report', function () {
    return Inertia::render('report/Index');
})->name('report.index');

Route::get('/users', function () {
    return Inertia::render('users/Index');
})->name('users.index');

Route::get('/settings', function () {
    return Inertia::render('settings/Index');
})->name('settings.index');

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
            'item-master/sync',
            [
                ItemMasterController::class,
                'sync',
            ]
        )->name('item-master.sync');
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

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
