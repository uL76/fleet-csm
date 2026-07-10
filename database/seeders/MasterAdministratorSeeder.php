<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Department;
use App\Models\Position;
use App\Models\UserLevel;
use Illuminate\Database\Seeder;

class MasterAdministratorSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::updateOrCreate(
            ['company_code' => 'csm'],
            [
                'company_name' => 'PT. Cipta Semangat Maju',
                'email' => 'corporate@ciptasemangatmaju.com',
                'phone' => null,
                'address' => 'Jl. Karang Anyar Raya Komp. Karang Anyar Permai Baru No.55 Blk C No.2-3, RT.3/RW.6, Karang Anyar, Kecamatan Sawah Besar, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10740',
                'is_active' => true,
            ]
        );

        $department = Department::updateOrCreate(
            [
                'company_id' => $company->id,
                'department_code' => 'ict',
            ],
            [
                'department_name' => 'ICT',
                'description' => 'ICT',
                'is_active' => true,
            ]
        );

        Position::updateOrCreate(
            [
                'company_id' => $company->id,
                'department_id' => $department->id,
                'position_code' => 'staff-it',
            ],
            [
                'position_name' => 'Staff IT',
                'description' => 'Staff IT',
                'is_active' => true,
            ]
        );
        $userLevels = [
            [
                'level_code' => 'super-admin',
                'level_name' => 'Super Admin',
                'level_order' => 1,
                'description' => 'Full access ke seluruh sistem.',
            ],
            [
                'level_code' => 'administrator',
                'level_name' => 'Administrator',
                'level_order' => 2,
                'description' => 'Akses administrasi dan master data.',
            ],
            [
                'level_code' => 'manager',
                'level_name' => 'Manager',
                'level_order' => 3,
                'description' => 'Akses monitoring dan approval level manager.',
            ],
            [
                'level_code' => 'supervisor',
                'level_name' => 'Supervisor',
                'level_order' => 4,
                'description' => 'Akses operasional dan approval supervisor.',
            ],
            [
                'level_code' => 'staff',
                'level_name' => 'Staff',
                'level_order' => 5,
                'description' => 'Akses input dan update data operasional.',
            ],
            [
                'level_code' => 'viewer',
                'level_name' => 'Viewer',
                'level_order' => 6,
                'description' => 'Akses melihat data tanpa perubahan.',
            ],
        ];

        foreach ($userLevels as $level) {
            UserLevel::updateOrCreate(
                ['level_code' => $level['level_code']],
                [
                    'level_name' => $level['level_name'],
                    'level_order' => $level['level_order'],
                    'description' => $level['description'],
                    'is_active' => true,
                ]
            );
        }
    }
}
