<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(
            'item_masters',
            function (Blueprint $table): void {
                $table->string(
                    'category_name',
                    255
                )->nullable();

                $table->string(
                    'item_type',
                    100
                )->nullable();

                $table->string(
                    'brand_name',
                    255
                )->nullable();

                $table->string(
                    'preferred_vendor',
                    255
                )->nullable();

                $table->decimal(
                    'minimum_stock',
                    18,
                    4
                )->nullable();

                $table->decimal(
                    'total_stock',
                    18,
                    4
                )->nullable();

                /*
                 * Dipisahkan dari is_active.
                 * Status resmi tetap dari Accurate.
                 */
                $table->boolean(
                    'excel_inactive'
                )->nullable();

                $table->decimal(
                    'length_cm',
                    18,
                    4
                )->nullable();

                $table->decimal(
                    'width_cm',
                    18,
                    4
                )->nullable();

                $table->decimal(
                    'height_cm',
                    18,
                    4
                )->nullable();

                $table->decimal(
                    'weight_gram',
                    18,
                    4
                )->nullable();

                $table->string(
                    'cross_reference_part_no',
                    500
                )->nullable();

                $table->string(
                    'equipment_type',
                    255
                )->nullable();

                $table->text(
                    'compatible_equipment_model'
                )->nullable();

                $table->text(
                    'specification'
                )->nullable();

                $table->string(
                    'bin_location_bpn',
                    255
                )->nullable();

                $table->string(
                    'bin_location_jkt',
                    255
                )->nullable();

                $table->string(
                    'class_movement',
                    100
                )->nullable();

                $table->decimal(
                    'reorder_quantity',
                    18,
                    4
                )->nullable();

                $table->decimal(
                    'maximum_quantity',
                    18,
                    4
                )->nullable();

                $table->timestamp(
                    'excel_imported_at'
                )->nullable()->index();

                $table->foreignId(
                    'excel_imported_by'
                )
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->string(
                    'excel_source_file',
                    255
                )->nullable();
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'item_masters',
            function (Blueprint $table): void {
                $table->dropForeign([
                    'excel_imported_by',
                ]);

                $table->dropColumn([
                    'category_name',
                    'item_type',
                    'brand_name',
                    'preferred_vendor',
                    'minimum_stock',
                    'total_stock',
                    'excel_inactive',
                    'length_cm',
                    'width_cm',
                    'height_cm',
                    'weight_gram',
                    'cross_reference_part_no',
                    'equipment_type',
                    'compatible_equipment_model',
                    'specification',
                    'bin_location_bpn',
                    'bin_location_jkt',
                    'class_movement',
                    'reorder_quantity',
                    'maximum_quantity',
                    'excel_imported_at',
                    'excel_imported_by',
                    'excel_source_file',
                ]);
            }
        );
    }
};
