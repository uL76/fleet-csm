<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(
            'purchase_orders',
            function (Blueprint $table) {
                $table->boolean('is_closed')
                    ->default(false)
                    ->index()
                    ->after('asset_id');

                $table->decimal(
                    'subtotal_amount',
                    20,
                    6
                )
                    ->default(0)
                    ->after('trans_date');

                $table->decimal(
                    'discount_amount',
                    20,
                    6
                )
                    ->default(0)
                    ->after('subtotal_amount');

                $table->decimal(
                    'tax_amount',
                    20,
                    6
                )
                    ->default(0)
                    ->after('discount_amount');

                $table->boolean('is_taxable')
                    ->default(false)
                    ->after('tax_amount');

                $table->boolean('is_inclusive_tax')
                    ->default(false)
                    ->after('is_taxable');

                $table->date('ship_date')
                    ->nullable()
                    ->after('is_inclusive_tax');

                $table->string(
                    'payment_term_name',
                    255
                )
                    ->nullable()
                    ->after('ship_date');

                $table->text('shipping_address')
                    ->nullable()
                    ->after('payment_term_name');
            }
        );

        Schema::table(
            'purchase_order_details',
            function (Blueprint $table) {
                $table->decimal(
                    'discount_percent',
                    12,
                    6
                )
                    ->default(0)
                    ->after('unit_price');

                $table->decimal(
                    'discount_amount',
                    20,
                    6
                )
                    ->default(0)
                    ->after('discount_percent');

                $table->string(
                    'warehouse_accurate_id',
                    100
                )
                    ->nullable()
                    ->index()
                    ->after('unit_name');

                $table->string(
                    'warehouse_name',
                    255
                )
                    ->nullable()
                    ->index()
                    ->after('warehouse_accurate_id');

                $table->boolean('is_closed')
                    ->default(false)
                    ->index()
                    ->after('warehouse_name');
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'purchase_orders',
            function (Blueprint $table) {
                $table->dropColumn([
                    'is_closed',
                    'subtotal_amount',
                    'discount_amount',
                    'tax_amount',
                    'is_taxable',
                    'is_inclusive_tax',
                    'ship_date',
                    'payment_term_name',
                    'shipping_address',
                ]);
            }
        );

        Schema::table(
            'purchase_order_details',
            function (Blueprint $table) {
                $table->dropColumn([
                    'discount_percent',
                    'discount_amount',
                    'warehouse_accurate_id',
                    'warehouse_name',
                    'is_closed',
                ]);
            }
        );
    }
};
