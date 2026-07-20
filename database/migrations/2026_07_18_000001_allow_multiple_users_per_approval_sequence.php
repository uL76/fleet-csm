<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            DB::connection()->getDriverName()
            !== 'mysql'
        ) {
            return;
        }

        $this->replaceUniqueIndex(
            'document_approval_routes',
            [
                'document_type',
                'department_id',
                'sequence',
                'user_id',
            ],
            'dar_document_department_sequence_user_unique'
        );

        $this->replaceUniqueIndex(
            'material_request_approvals',
            [
                'material_request_id',
                'sequence',
                'assigned_user_id',
            ],
            'mra_request_sequence_user_unique'
        );
    }

    public function down(): void
    {
        if (
            DB::connection()->getDriverName()
            !== 'mysql'
        ) {
            return;
        }

        Schema::table(
            'document_approval_routes',
            function (Blueprint $table): void {
                $table->dropUnique(
                    'dar_document_department_sequence_user_unique'
                );
            }
        );

        Schema::table(
            'material_request_approvals',
            function (Blueprint $table): void {
                $table->dropUnique(
                    'mra_request_sequence_user_unique'
                );
            }
        );
    }

    private function replaceUniqueIndex(
        string $table,
        array $columns,
        string $newIndexName
    ): void {
        $indexes = DB::select(
            "SHOW INDEX FROM `{$table}` WHERE Non_unique = 0"
        );

        $indexNames = collect($indexes)
            ->pluck('Key_name')
            ->filter()
            ->unique()
            ->reject(
                fn (string $name): bool => $name === 'PRIMARY'
                    || $name === $newIndexName
            );

        foreach ($indexNames as $indexName) {
            Schema::table(
                $table,
                function (
                    Blueprint $blueprint
                ) use (
                    $indexName
                ): void {
                    $blueprint->dropUnique(
                        $indexName
                    );
                }
            );
        }

        $existingNewIndex = collect($indexes)
            ->pluck('Key_name')
            ->contains($newIndexName);

        if ($existingNewIndex) {
            return;
        }

        Schema::table(
            $table,
            function (
                Blueprint $blueprint
            ) use (
                $columns,
                $newIndexName
            ): void {
                $blueprint->unique(
                    $columns,
                    $newIndexName
                );
            }
        );
    }
};
