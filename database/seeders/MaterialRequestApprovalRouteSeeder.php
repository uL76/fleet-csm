<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\DocumentApprovalRoute;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class MaterialRequestApprovalRouteSeeder extends Seeder
{
    /**
     * Jalankan seeder routing approval Material Request.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | REVIEWER DAN APPROVER
        |--------------------------------------------------------------------------
        |
        | Berdasarkan MasterAdministratorSeeder:
        |
        | Yuli:
        | yuli@ciptasemangatmaju.com
        |
        | Jesen Erlando:
        | jesen@ciptasemangatmaju.com
        |
        | Gunakan email karena lebih presisi daripada pencarian nama.
        |
        */

        $reviewer = User::query()
            ->where(
                'email',
                'yuli@ciptasemangatmaju.com'
            )
            ->first();

        $approver = User::query()
            ->where(
                'email',
                'jesen@ciptasemangatmaju.com'
            )
            ->first();

        if (! $reviewer) {
            throw new RuntimeException(
                'User reviewer Yuli tidak ditemukan. '
                .'Pastikan user yuli@ciptasemangatmaju.com sudah tersedia.'
            );
        }

        if (! $approver) {
            throw new RuntimeException(
                'User approver Jesen Erlando tidak ditemukan. '
                .'Pastikan user jesen@ciptasemangatmaju.com sudah tersedia.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | DEPARTMENT YANG MENGGUNAKAN ROUTING MR
        |--------------------------------------------------------------------------
        |
        | Jangan menggunakan position seperti:
        | - Staff Warehouse
        | - Staff Purchasing
        | - Driver
        | - Kurir
        |
        | Routing disimpan berdasarkan department_id.
        |
        */

        $departmentNames = [
            'Finance',
            'Management',
            'Operation',
            'Sales',
            'Purchasing',
            'Warehouse',
            'Accounting',
        ];

        $departments = Department::query()
            ->whereIn(
                'department_name',
                $departmentNames
            )
            ->where('is_active', true)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | VALIDASI DEPARTMENT
        |--------------------------------------------------------------------------
        */

        $foundDepartmentNames = $departments
            ->pluck('department_name')
            ->all();

        $missingDepartmentNames = array_values(
            array_diff(
                $departmentNames,
                $foundDepartmentNames
            )
        );

        if ($missingDepartmentNames !== []) {
            throw new RuntimeException(
                'Department berikut tidak ditemukan: '
                .implode(', ', $missingDepartmentNames)
                .'. Jalankan MasterAdministratorSeeder terlebih dahulu.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | MEMBUAT ROUTING
        |--------------------------------------------------------------------------
        |
        | Sequence 1 = REVIEW oleh Yuli
        | Sequence 2 = APPROVE oleh Jesen
        |
        */

        foreach ($departments as $department) {
            DocumentApprovalRoute::updateOrCreate(
                [
                    'document_type' => 'MR',
                    'department_id' => $department->id,
                    'sequence' => 1,
                ],
                [
                    'action_type' => 'REVIEW',
                    'user_id' => $reviewer->id,
                    'is_required' => true,
                    'is_active' => true,
                    'created_by' => $reviewer->id,
                    'updated_by' => $reviewer->id,
                ]
            );

            DocumentApprovalRoute::updateOrCreate(
                [
                    'document_type' => 'MR',
                    'department_id' => $department->id,
                    'sequence' => 2,
                ],
                [
                    'action_type' => 'APPROVE',
                    'user_id' => $approver->id,
                    'is_required' => true,
                    'is_active' => true,
                    'created_by' => $approver->id,
                    'updated_by' => $approver->id,
                ]
            );
        }

        $this->command?->info(
            sprintf(
                'Routing approval MR berhasil dibuat untuk %d department.',
                $departments->count()
            )
        );
    }
}
