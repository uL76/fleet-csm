<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_levels', function (Blueprint $table) {
            $table->id();
            $table->string('level_code', 50)->unique();
            $table->string('level_name', 150);
            $table->unsignedInteger('level_order')->default(0);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('level_name');
            $table->index('level_order');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_levels');
    }
};
