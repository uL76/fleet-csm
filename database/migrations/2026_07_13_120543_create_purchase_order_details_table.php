<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'purchase_order_details',
            function (Blueprint $table) {
                $table->id();

                $table->foreignId(
                    'purchase_order_id'
                )
                    ->constrained(
                        'purchase_orders'
                    )
                    ->cascadeOnDelete();

                $table->string(
                    'accurate_detail_id',
                    100
                )->unique();

                $table->string(
                    'accurate_po_id',
                    100
                )->index();

                $table->string(
                    'po_number',
                    100
                )->index();

                $table->string(
                    'pr_number',
                    100
                )
                    ->nullable()
                    ->index();

                $table->string(
                    'mr_number',
                    100
                )
                    ->nullable()
                    ->index();

                $table->string(
                    'item_no',
                    100
                )
                    ->nullable()
                    ->index();

                $table->text(
                    'item_name'
                )->nullable();

                $table->text(
                    'item_description'
                )->nullable();

                $table->decimal(
                    'quantity',
                    18,
                    4
                )->default(0);

                $table->decimal(
                    'unit_price',
                    20,
                    6
                )->default(0);

                $table->decimal(
                    'line_total',
                    20,
                    6
                )->default(0);

                $table->string(
                    'unit_name',
                    100
                )->nullable();

                $table->string(
                    'department_name',
                    255
                )->nullable();

                $table->string(
                    'project_name',
                    255
                )->nullable();

                $table->text(
                    'remarks'
                )->nullable();

                $table->date(
                    'trans_date'
                )
                    ->nullable()
                    ->index();

                $table->json(
                    'accurate_raw'
                )->nullable();

                $table->timestamps();
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'purchase_order_details'
        );
    }
};
