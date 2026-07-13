<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_masters', function (Blueprint $table) {
            if (! Schema::hasColumn('item_masters', 'sync_error')) {
                $table->text('sync_error')
                    ->nullable()
                    ->after('accurate_raw');
            }
        });
    }

    public function down(): void
    {
        Schema::table('item_masters', function (Blueprint $table) {
            if (Schema::hasColumn('item_masters', 'sync_error')) {
                $table->dropColumn('sync_error');
            }
        });
    }
};
