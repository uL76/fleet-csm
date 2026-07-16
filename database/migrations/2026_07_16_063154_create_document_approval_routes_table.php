<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create(
            'document_approval_routes',
            function (Blueprint $table): void {
                $table->id();

                $table->string('document_type', 50);

                $table->foreignId('department_id')
                    ->constrained('departments')
                    ->cascadeOnDelete();

                $table->unsignedInteger('sequence');

                $table->enum('action_type', [
                    'REVIEW',
                    'APPROVE',
                ]);

                $table->foreignId('user_id')
                    ->constrained('users')
                    ->restrictOnDelete();

                $table->boolean('is_required')
                    ->default(true);

                $table->boolean('is_active')
                    ->default(true);

                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('updated_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamps();

                $table->unique(
                    [
                        'document_type',
                        'department_id',
                        'sequence',
                    ],
                    'dar_doc_dept_sequence_uq'
                );

                $table->index(
                    [
                        'document_type',
                        'department_id',
                        'is_active',
                    ],
                    'dar_doc_dept_active_idx'
                );

                $table->index(
                    [
                        'user_id',
                        'is_active',
                    ],
                    'dar_user_active_idx'
                );
            }
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(
            'document_approval_routes'
        );
    }
};
