<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accurate_sync_runs', function (Blueprint $table) {
            $table->id();

            $table->string('module', 100)->index();
            $table->string('sync_type', 50)->index();

            $table->string('status', 30)
                ->default('PENDING')
                ->index();

            /*
             * current_page adalah halaman terakhir yang sudah selesai.
             * Jika current_page = 5, retry akan mulai dari page 6.
             */
            $table->unsignedInteger('current_page')
                ->default(0);

            $table->unsignedInteger('total_pages')
                ->default(0);

            $table->unsignedInteger('page_size')
                ->default(100);

            $table->unsignedBigInteger('total_items')
                ->default(0);

            $table->unsignedBigInteger('processed_items')
                ->default(0);

            $table->unsignedBigInteger('inserted_items')
                ->default(0);

            $table->unsignedBigInteger('updated_items')
                ->default(0);

            $table->unsignedBigInteger('skipped_items')
                ->default(0);

            $table->unsignedBigInteger('failed_items')
                ->default(0);

            $table->unsignedBigInteger('inactivated_items')
                ->default(0);

            $table->text('error_message')
                ->nullable();

            $table->timestamp('started_at')
                ->nullable();

            $table->timestamp('finished_at')
                ->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index([
                'module',
                'sync_type',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accurate_sync_runs');
    }
};
