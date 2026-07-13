<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('accurate_id')->unique();
            $table->string('vendor_no', 100)->nullable()->index();
            $table->string('vendor_name', 255)->index();
            $table->string('category_name', 150)->nullable();

            $table->string('email', 255)->nullable();
            $table->string('phone', 100)->nullable();
            $table->string('mobile_phone', 100)->nullable();
            $table->string('fax', 100)->nullable();
            $table->string('website', 255)->nullable();

            $table->string('npwp_no', 100)->nullable();
            $table->string('contact_name', 255)->nullable();

            $table->text('address')->nullable();
            $table->text('street')->nullable();
            $table->string('city', 150)->nullable();
            $table->string('province', 150)->nullable();
            $table->string('country', 150)->nullable();
            $table->string('zipcode', 50)->nullable();

            $table->text('notes')->nullable();

            $table->boolean('is_active')->default(true)->index();

            $table->json('accurate_raw')->nullable();
            $table->timestamp('last_sync_at')->nullable()->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};
