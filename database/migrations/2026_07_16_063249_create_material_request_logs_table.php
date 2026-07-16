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
            'material_request_logs',
            function (Blueprint $table): void {
                $table->id();

                $table->foreignId('material_request_id')
                    ->constrained('material_requests')
                    ->cascadeOnDelete();

                $table->foreignId('user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->string('action', 100);

                $table->string('from_status', 50)
                    ->nullable();

                $table->string('to_status', 50)
                    ->nullable();

                $table->text('comments')
                    ->nullable();

                $table->json('metadata')
                    ->nullable();

                $table->timestamps();

                $table->index(
                    [
                        'material_request_id',
                        'created_at',
                    ],
                    'mrl_request_created_idx'
                );

                $table->index(
                    [
                        'user_id',
                        'created_at',
                    ],
                    'mrl_user_created_idx'
                );

                $table->index(
                    [
                        'action',
                        'created_at',
                    ],
                    'mrl_action_created_idx'
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
            'material_request_logs'
        );
    }
};
