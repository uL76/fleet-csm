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
                $table->string(
                    'revision_no',
                    100
                )
                    ->nullable()
                    ->after('asset_id')
                    ->index();
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'purchase_orders',
            function (Blueprint $table) {
                $table->dropIndex([
                    'revision_no',
                ]);

                $table->dropColumn(
                    'revision_no'
                );
            }
        );
    }
};
