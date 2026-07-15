<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_masters', function (Blueprint $table) {
            if (! Schema::hasColumn('item_masters', 'last_seen_sync_id')) {
                $table->unsignedBigInteger('last_seen_sync_id')
                    ->nullable()
                    ->after('last_sync_at')
                    ->index();
            }

            if (! Schema::hasColumn('item_masters', 'last_seen_at')) {
                $table->timestamp('last_seen_at')
                    ->nullable()
                    ->after('last_seen_sync_id')
                    ->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('item_masters', function (Blueprint $table) {
            if (Schema::hasColumn('item_masters', 'last_seen_at')) {
                $table->dropColumn('last_seen_at');
            }

            if (Schema::hasColumn('item_masters', 'last_seen_sync_id')) {
                $table->dropColumn('last_seen_sync_id');
            }
        });
    }
};
