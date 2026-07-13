<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_masters', function (Blueprint $table) {
            $table->id();

            $table->string('accurate_id', 100)
                ->unique();

            $table->string('item_code', 100)
                ->unique();

            $table->string('part_number', 255)
                ->nullable()
                ->index();

            $table->text('item_description')
                ->nullable();

            $table->string('unit_name', 100)
                ->nullable();

            $table->boolean('is_active')
                ->default(true)
                ->index();

            $table->json('accurate_raw')
                ->nullable();

            $table->text('sync_error')
                ->nullable();

            $table->timestamp('last_sync_at')
                ->nullable()
                ->index();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index([
                'item_code',
                'part_number',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_masters');
    }
};
