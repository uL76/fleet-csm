<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_requisition_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_requisition_id')
                ->constrained('purchase_requisitions')
                ->cascadeOnDelete();
            $table->unsignedBigInteger('accurate_detail_id')->nullable()->index();
            $table->unsignedBigInteger('accurate_pr_id')->nullable()->index();
            $table->string('pr_number', 100)->index();
            $table->string('mr_number', 100)->nullable()->index();
            $table->string('item_no', 100)->nullable()->index();
            $table->string('item_name')->nullable();
            $table->text('item_description')->nullable();
            $table->decimal('quantity', 18, 4)->default(0);
            $table->string('unit_name', 100)->nullable();
            $table->string('department_name', 150)->nullable();
            $table->string('project_name', 150)->nullable();
            $table->text('remarks')->nullable();
            $table->date('trans_date')->nullable()->index();
            $table->date('required_date')->nullable()->index();
            $table->boolean('is_closed')->default(false)->index();
            $table->json('accurate_raw')->nullable();
            $table->timestamps();

            $table->unique(
                ['purchase_requisition_id', 'accurate_detail_id'],
                'pr_detail_accurate_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_requisition_details');
    }
};
