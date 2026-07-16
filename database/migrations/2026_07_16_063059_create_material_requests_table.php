<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_requests', function (Blueprint $table) {
            $table->id();

            $table->string('mr_number', 50)->unique();
            $table->date('mr_date');

            $table->foreignId('requested_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('department_id')
                ->constrained('departments')
                ->restrictOnDelete();

            $table->foreignId('company_id')
                ->nullable()
                ->constrained('companies')
                ->nullOnDelete();

            $table->string('branch', 100)->nullable();

            $table->enum('priority', [
                'EMERGENCY',
                'HIGH',
                'MEDIUM',
                'LOW',
            ])->default('MEDIUM');

            $table->date('required_date')->nullable();

            $table->enum('request_type', [
                'STOCK_REPLENISHMENT',
                'CUSTOMER_ORDER',
                'OFFICE_SUPPLY',
                'OTHER',
            ]);

            $table->string('customer_name', 150)->nullable();
            $table->string('sales_order_no', 100)->nullable();
            $table->string('reference_rfq', 100)->nullable();

            $table->string('subject', 255);
            $table->text('remarks')->nullable();

            $table->enum('status', [
                'DRAFT',
                'SUBMITTED',
                'IN_REVIEW',
                'REVIEWED',
                'APPROVED',
                'REVISION',
                'REJECTED',
                'CANCELLED',
                'CLOSED',
            ])->default('DRAFT');

            $table->unsignedInteger('current_approval_sequence')
                ->nullable();

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('closed_at')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index([
                'department_id',
                'status',
            ]);

            $table->index('mr_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_requests');
    }
};
