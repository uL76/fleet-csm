<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

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

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
