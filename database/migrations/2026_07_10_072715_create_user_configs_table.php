<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_configs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_level_id')
                ->constrained('user_levels')
                ->cascadeOnDelete();

            $table->foreignId('menu_id')
                ->constrained('menus')
                ->cascadeOnDelete();

            $table->boolean('can_view')->default(false);
            $table->boolean('can_create')->default(false);
            $table->boolean('can_edit')->default(false);
            $table->boolean('can_delete')->default(false);
            $table->boolean('can_review')->default(false);
            $table->boolean('can_approve')->default(false);
            $table->boolean('can_export')->default(false);

            $table->timestamps();

            $table->unique(['user_level_id', 'menu_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_configs');
    }
};
