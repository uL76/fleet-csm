<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Administrator\UserController;
use App\Http\Controllers\Administrator\CompanyController;
use App\Http\Controllers\Administrator\DepartmentController;
use App\Http\Controllers\Administrator\PositionController;
use App\Http\Controllers\Administrator\UserLevelController;
use App\Http\Controllers\Administrator\UserConfigController;

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

Route::get('/warehouse', function () {
    return Inertia::render('warehouse/Index');
})->name('warehouse.index');

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

    Route::get('/users', function () {
        return Inertia::render('administrator/users/Index');
    })->name('users.index');

    Route::get('/user-levels', function () {
        return Inertia::render('administrator/user-levels/Index');
    })->name('user-levels.index');

    Route::get('/positions', function () {
        return Inertia::render('administrator/positions/Index');
    })->name('positions.index');

    Route::get('/departments', function () {
        return Inertia::render('administrator/departments/Index');
    })->name('departments.index');

    Route::get('/user-config', function () {
        return Inertia::render('administrator/user-config/Index');
    })->name('user-config.index');

    Route::get('/timezone', function () {
        return Inertia::render('administrator/timezone/Index');
    })->name('timezone.index');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
