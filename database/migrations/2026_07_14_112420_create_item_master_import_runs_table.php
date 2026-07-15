<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'item_master_import_runs',
            function (Blueprint $table): void {
                $table->id();

                $table->string(
                    'status',
                    30
                )
                    ->default('PENDING')
                    ->index();

                $table->string(
                    'original_filename',
                    255
                );

                $table->string(
                    'stored_path',
                    500
                );

                $table->unsignedBigInteger(
                    'file_size'
                )->default(0);

                $table->unsignedBigInteger(
                    'total_rows'
                )->default(0);

                $table->unsignedBigInteger(
                    'processed_rows'
                )->default(0);

                $table->unsignedBigInteger(
                    'updated_rows'
                )->default(0);

                $table->unsignedBigInteger(
                    'unmatched_rows'
                )->default(0);

                $table->unsignedBigInteger(
                    'skipped_rows'
                )->default(0);

                $table->unsignedBigInteger(
                    'failed_rows'
                )->default(0);

                $table->json(
                    'error_samples'
                )->nullable();

                $table->text(
                    'error_message'
                )->nullable();

                $table->timestamp(
                    'started_at'
                )->nullable();

                $table->timestamp(
                    'finished_at'
                )->nullable();

                $table->foreignId(
                    'created_by'
                )
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamps();
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'item_master_import_runs'
        );
    }
};
