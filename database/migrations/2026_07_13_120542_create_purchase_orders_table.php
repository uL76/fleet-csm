<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();

            $table->string('accurate_id', 100)
                ->unique();

            $table->string('po_number', 100)
                ->unique();

            $table->string('po_status', 100)
                ->nullable()
                ->index();

            $table->string('vendor_no', 100)
                ->nullable()
                ->index();

            $table->string('vendor_name', 255)
                ->nullable()
                ->index();

            $table->string('mr_number', 100)
                ->nullable()
                ->index();

            $table->string('pr_number', 100)
                ->nullable()
                ->index();

            $table->string('invoice_number', 100)
                ->nullable()
                ->index();

            $table->string('po_subject', 255)
                ->nullable();

            $table->string('project_name', 255)
                ->nullable()
                ->index();

            $table->string('asset_id', 100)
                ->nullable()
                ->index();

            $table->date('trans_date')
                ->nullable()
                ->index();

            $table->decimal(
                'total_amount',
                20,
                6
            )->default(0);

            $table->json('accurate_raw')
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
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'purchase_orders'
        );
    }
};
