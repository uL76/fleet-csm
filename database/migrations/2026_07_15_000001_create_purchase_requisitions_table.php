<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_requisitions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('accurate_id')->nullable()->unique();
            $table->string('pr_number', 100)->unique();
            $table->string('pr_status', 100)->nullable()->index();
            $table->string('mr_number', 100)->nullable()->index();
            $table->date('trans_date')->nullable()->index();
            $table->date('required_date')->nullable()->index();
            $table->string('requester_name', 150)->nullable();
            $table->string('department_name', 150)->nullable();
            $table->string('project_name', 150)->nullable();
            $table->string('asset_id', 100)->nullable();
            $table->string('revision_no', 100)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_closed')->default(false)->index();
            $table->json('accurate_raw')->nullable();
            $table->timestamp('last_sync_at')->nullable()->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_requisitions');
    }
};
