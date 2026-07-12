<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();

            $table
                ->string('accurate_id', 100)
                ->unique();

            $table
                ->string('accurate_location_id', 100)
                ->nullable()
                ->index();

            $table
                ->string('warehouse_name', 150)
                ->index();

            $table
                ->text('description')
                ->nullable();

            $table
                ->string('street', 255)
                ->nullable();

            $table
                ->string('city', 100)
                ->nullable()
                ->index();

            $table
                ->string('province', 100)
                ->nullable()
                ->index();

            $table
                ->string('country', 100)
                ->nullable();

            $table
                ->string('zipcode', 30)
                ->nullable();

            $table
                ->string('pic', 150)
                ->nullable();

            $table
                ->boolean('is_damage_warehouse')
                ->default(false)
                ->index();

            $table
                ->boolean('is_active')
                ->default(true)
                ->index();

            $table
                ->json('accurate_raw')
                ->nullable();

            $table
                ->timestamp('last_sync_at')
                ->nullable()
                ->index();

            $table
                ->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table
                ->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
