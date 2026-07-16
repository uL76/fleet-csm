<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_request_approvals', function (Blueprint $table) {
            $table->id();

            $table->foreignId('material_request_id')
                ->constrained('material_requests')
                ->cascadeOnDelete();

            $table->foreignId('approval_route_id')
                ->nullable()
                ->constrained('document_approval_routes')
                ->nullOnDelete();

            $table->unsignedInteger('sequence');

            $table->enum('action_type', [
                'REVIEW',
                'APPROVE',
            ]);

            $table->foreignId('assigned_user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('action_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->enum('status', [
                'PENDING',
                'APPROVED',
                'REJECTED',
                'REVISION',
                'SKIPPED',
            ])->default('PENDING');

            $table->text('comments')->nullable();
            $table->timestamp('acted_at')->nullable();

            $table->timestamps();

            $table->index(
                [
                    'material_request_id',
                    'sequence',
                    'status',
                ],
                'mra_mr_seq_status_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_request_approvals');
    }
};
