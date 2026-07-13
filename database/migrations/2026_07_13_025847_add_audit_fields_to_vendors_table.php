<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(
            'vendors',
            function (Blueprint $table) {
                $table->foreignId('created_by')
                    ->nullable()
                    ->after('last_sync_at')
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('updated_by')
                    ->nullable()
                    ->after('created_by')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'vendors',
            function (Blueprint $table) {
                $table->dropConstrainedForeignId(
                    'updated_by'
                );

                $table->dropConstrainedForeignId(
                    'created_by'
                );
            }
        );
    }
};
