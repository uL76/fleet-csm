<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained('companies')
                ->nullOnDelete();

            $table->foreignId('department_id')
                ->nullable()
                ->after('company_id')
                ->constrained('departments')
                ->nullOnDelete();

            $table->foreignId('position_id')
                ->nullable()
                ->after('department_id')
                ->constrained('positions')
                ->nullOnDelete();

            $table->foreignId('user_level_id')
                ->nullable()
                ->after('position_id')
                ->constrained('user_levels')
                ->nullOnDelete();

            $table->string('employee_id', 100)->nullable()->after('user_level_id');
            $table->string('phone', 50)->nullable()->after('email');
            $table->string('status', 30)->default('active')->after('phone');

            $table->index('employee_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
            $table->dropConstrainedForeignId('department_id');
            $table->dropConstrainedForeignId('position_id');
            $table->dropConstrainedForeignId('user_level_id');

            $table->dropColumn([
                'employee_id',
                'phone',
                'status',
            ]);
        });
    }
};
