<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_request_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('material_request_id')
                ->constrained('material_requests')
                ->cascadeOnDelete();

            $table->foreignId('item_master_id')
                ->nullable()
                ->constrained('item_masters')
                ->nullOnDelete();

            /*
             * Snapshot data item.
             * Tetap disimpan agar histori MR tidak berubah
             * saat Item Master diperbarui.
             */
            $table->string('item_code', 100);
            $table->string('part_number', 150)->nullable();
            $table->string('description', 255);
            $table->string('brand', 100)->nullable();
            $table->string('uom', 50)->nullable();

            $table->decimal('quantity', 15, 2);
            $table->decimal('available_stock', 15, 2)
                ->default(0);

            $table->date('required_date')->nullable();
            $table->string('suggested_vendor', 150)->nullable();
            $table->decimal('estimated_price', 18, 2)
                ->nullable();

            $table->unsignedInteger('lead_time_days')
                ->nullable();

            $table->text('remarks')->nullable();

            $table->enum('process_status', [
                'PENDING',
                'STOCK',
                'ORDER',
                'CASH',
                'CANCELLED',
            ])->default('PENDING');

            $table->timestamps();

            $table->index('item_code');
            $table->index('process_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_request_items');
    }
};
