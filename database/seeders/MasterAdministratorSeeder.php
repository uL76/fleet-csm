<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Department;
use App\Models\Menu;
use App\Models\Position;
use App\Models\User;
use App\Models\UserLevel;
use App\Models\UserLevelPermission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MasterAdministratorSeeder extends Seeder
{
    public function run(): void
    {
        $company = $this->seedCompany();

        $userLevels = $this->seedUserLevels();

        $this->seedDefaultAdminUser($company, $userLevels);

        $this->seedEmployees($company, $userLevels);

        $this->seedMenus();

        $this->seedDefaultPermissions();
    }

    private function seedCompany(): Company
    {
        return Company::updateOrCreate(
            [
                'company_code' => 'csm',
            ],
            [
                'company_name' => 'PT. Cipta Semangat Maju',
                'email' => 'corporate@ciptasemangatmaju.com',
                'phone' => null,
                'address' => 'Jl. Karang Anyar Raya Komp. Karang Anyar Permai Baru No.55 Blk C No.2-3, RT.3/RW.6, Karang Anyar, Kecamatan Sawah Besar, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10740',
                'is_active' => true,
            ]
        );
    }

    private function seedUserLevels(): array
    {
        $levels = [
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

        $createdLevels = [];

        foreach ($levels as $level) {
            $createdLevels[$level['level_code']] = UserLevel::updateOrCreate(
                [
                    'level_code' => $level['level_code'],
                ],
                [
                    'level_name' => $level['level_name'],
                    'level_order' => $level['level_order'],
                    'description' => $level['description'],
                    'is_active' => true,
                ]
            );
        }

        return $createdLevels;
    }

    private function seedDefaultAdminUser(Company $company, array $userLevels): void
    {
        $department = $this->firstOrCreateDepartment(
            $company,
            'ict',
            'ICT'
        );

        $position = $this->firstOrCreatePosition(
            $company,
            $department,
            'staff-it',
            'Staff IT'
        );

        User::updateOrCreate(
            [
                'email' => 'admin@corpski.co.id',
            ],
            [
                'name' => 'Administrator Fleet CSM',
                'password' => Hash::make('Aulia123#'),
                'email_verified_at' => now(),
                'company_id' => $company->id,
                'department_id' => $department->id,
                'position_id' => $position->id,
                'user_level_id' => $userLevels['super-admin']->id,
                'employee_id' => null,
                'phone' => null,
                'status' => 'active',
            ]
        );
    }

    private function seedEmployees(Company $company, array $userLevels): void
    {
        $employees = [
            [
                'name' => 'Yuli',
                'department' => 'Finance',
                'position' => 'Finance',
                'level' => 'staff',
            ],
            [
                'name' => 'Jesen Erlando',
                'department' => 'Management',
                'position' => 'Direktur',
                'level' => 'manager',
            ],
            [
                'name' => 'Bayu Trisna',
                'department' => 'Operation',
                'position' => 'Driver',
                'level' => 'staff',
            ],
            [
                'name' => 'Johni Setiawan',
                'department' => 'Sales',
                'position' => 'Sales',
                'level' => 'staff',
            ],
            [
                'name' => 'Novindah',
                'department' => 'Purchasing',
                'position' => 'Staff Purchasing',
                'level' => 'staff',
            ],
            [
                'name' => 'Ficky Leonardo',
                'department' => 'Warehouse',
                'position' => 'Staff Warehouse',
                'level' => 'staff',
            ],
            [
                'name' => 'Danil',
                'department' => 'Warehouse',
                'position' => 'Staff Warehouse',
                'level' => 'staff',
            ],
            [
                'name' => 'Ebieta Alya Chasanah',
                'department' => 'Accounting',
                'position' => 'Staff Accounting',
                'level' => 'staff',
            ],
            [
                'name' => 'Kerin Ovanda',
                'department' => 'Finance',
                'position' => 'Staff Invoicing',
                'level' => 'staff',
            ],
            [
                'name' => 'Alek Sandria',
                'department' => 'Warehouse',
                'position' => 'Staff Warehouse',
                'level' => 'staff',
            ],
            [
                'name' => 'David Novelainder',
                'department' => 'Operation',
                'position' => 'Kurir',
                'level' => 'staff',
            ],
            [
                'name' => 'Vidhiya Addini',
                'department' => 'Warehouse',
                'position' => 'Inventory Control Staff',
                'level' => 'staff',
            ],
        ];

        foreach ($employees as $employee) {
            $firstWord = $this->getFirstWord($employee['name']);
            $email = strtolower($firstWord).'@ciptasemangatmaju.com';
            $password = ucfirst(strtolower($firstWord)).'123';

            $department = $this->firstOrCreateDepartment(
                $company,
                $this->makeCode($employee['department']),
                $employee['department']
            );

            $position = $this->firstOrCreatePosition(
                $company,
                $department,
                $this->makeCode($employee['position']),
                $employee['position']
            );

            User::updateOrCreate(
                [
                    'email' => $email,
                ],
                [
                    'name' => $employee['name'],
                    'password' => Hash::make($password),
                    'email_verified_at' => now(),
                    'company_id' => $company->id,
                    'department_id' => $department->id,
                    'position_id' => $position->id,
                    'user_level_id' => $userLevels[$employee['level']]->id,
                    'employee_id' => null,
                    'phone' => null,
                    'status' => 'active',
                ]
            );
        }
    }

    private function firstOrCreateDepartment(
        Company $company,
        string $departmentCode,
        string $departmentName
    ): Department {
        return Department::updateOrCreate(
            [
                'company_id' => $company->id,
                'department_code' => $departmentCode,
            ],
            [
                'department_name' => $departmentName,
                'description' => $departmentName,
                'is_active' => true,
            ]
        );
    }

    private function firstOrCreatePosition(
        Company $company,
        Department $department,
        string $positionCode,
        string $positionName
    ): Position {
        return Position::updateOrCreate(
            [
                'company_id' => $company->id,
                'department_id' => $department->id,
                'position_code' => $positionCode,
            ],
            [
                'position_name' => $positionName,
                'description' => $positionName,
                'is_active' => true,
            ]
        );
    }

    private function getFirstWord(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name));

        return $parts[0] ?? $name;
    }

    private function makeCode(string $value): string
    {
        $value = strtolower(trim($value));
        $value = preg_replace('/[^a-z0-9]+/', '-', $value);
        $value = trim($value, '-');

        return $value ?: 'unknown';
    }

    private function seedMenus(): void
    {
        $menus = [
            [
                'menu_code' => 'dashboard',
                'menu_name' => 'Dashboard',
                'menu_group' => 'Dashboard',
                'route_name' => 'dashboard',
                'url' => '/fleet-dashboard',
                'icon' => 'GridIcon',
                'sort_order' => 1,
            ],

            [
                'menu_code' => 'companies',
                'menu_name' => 'Companies',
                'menu_group' => 'Administrator',
                'route_name' => 'administrator.companies.index',
                'url' => '/administrator/companies',
                'icon' => 'BuildingIcon',
                'sort_order' => 10,
            ],
            [
                'menu_code' => 'departments',
                'menu_name' => 'Departments',
                'menu_group' => 'Administrator',
                'route_name' => 'administrator.departments.index',
                'url' => '/administrator/departments',
                'icon' => 'ListIcon',
                'sort_order' => 20,
            ],
            [
                'menu_code' => 'positions',
                'menu_name' => 'Positions',
                'menu_group' => 'Administrator',
                'route_name' => 'administrator.positions.index',
                'url' => '/administrator/positions',
                'icon' => 'UserCircleIcon',
                'sort_order' => 30,
            ],
            [
                'menu_code' => 'user-levels',
                'menu_name' => 'User Levels',
                'menu_group' => 'Administrator',
                'route_name' => 'administrator.user-levels.index',
                'url' => '/administrator/user-levels',
                'icon' => 'ShieldIcon',
                'sort_order' => 40,
            ],
            [
                'menu_code' => 'users',
                'menu_name' => 'Users',
                'menu_group' => 'Administrator',
                'route_name' => 'administrator.users.index',
                'url' => '/administrator/users',
                'icon' => 'UserIcon',
                'sort_order' => 50,
            ],
            [
                'menu_code' => 'user-config',
                'menu_name' => 'User Config',
                'menu_group' => 'Administrator',
                'route_name' => 'administrator.user-config.index',
                'url' => '/administrator/user-config',
                'icon' => 'SettingsIcon',
                'sort_order' => 60,
            ],

            [
                'menu_code' => 'purchase-requisition',
                'menu_name' => 'Purchase Requisition',
                'menu_group' => 'Purchasing',
                'route_name' => 'purchasing.purchase-requisition.index',
                'url' => '/purchasing/purchase-requisition',
                'icon' => 'FileIcon',
                'sort_order' => 100,
            ],
            [
                'menu_code' => 'purchase-order',
                'menu_name' => 'Purchase Order',
                'menu_group' => 'Purchasing',
                'route_name' => 'purchasing.purchase-order.index',
                'url' => '/purchasing/purchase-order',
                'icon' => 'DocumentTextIcon',
                'sort_order' => 110,
            ],
            [
                'menu_code' => 'vendor',
                'menu_name' => 'Vendor',
                'menu_group' => 'Purchasing',
                'route_name' => 'purchasing.vendor.index',
                'url' => '/purchasing/vendor',
                'icon' => 'BuildingIcon',
                'sort_order' => 120,
            ],

            [
                'menu_code' => 'material-request',
                'menu_name' => 'Material Request',
                'menu_group' => 'SCM',
                'route_name' => null,
                'url' => '/scm/material-request',
                'icon' => 'FileIcon',
                'sort_order' => 200,
            ],
            [
                'menu_code' => 'receive-item',
                'menu_name' => 'Receive Item',
                'menu_group' => 'SCM',
                'route_name' => null,
                'url' => '/scm/receive-item',
                'icon' => 'BoxIcon',
                'sort_order' => 210,
            ],

            [
                'menu_code' => 'item-master',
                'menu_name' => 'Item Master',
                'menu_group' => 'Warehouse',
                'route_name' => 'warehouse.item-master.index',
                'url' => '/warehouse/item-master',
                'icon' => 'CubeIcon',
                'sort_order' => 300,
            ],
            [
                'menu_code' => 'warehouses',
                'menu_name' => 'Warehouses',
                'menu_group' => 'Warehouse',
                'route_name' => 'warehouse.warehouses.index',
                'url' => '/warehouse/warehouses',
                'icon' => 'BoxIcon',
                'sort_order' => 310,
            ],

            [
                'menu_code' => 'approval',
                'menu_name' => 'Approval',
                'menu_group' => 'Workflow',
                'route_name' => null,
                'url' => '/workflow/approval',
                'icon' => 'CheckCircleIcon',
                'sort_order' => 400,
            ],

            [
                'menu_code' => 'reports',
                'menu_name' => 'Reports',
                'menu_group' => 'Reports',
                'route_name' => null,
                'url' => '/reports',
                'icon' => 'PieChartIcon',
                'sort_order' => 500,
            ],
        ];

        foreach ($menus as $menu) {
            Menu::updateOrCreate(
                [
                    'menu_code' => $menu['menu_code'],
                ],
                [
                    'menu_name' => $menu['menu_name'],
                    'menu_group' => $menu['menu_group'],
                    'route_name' => $menu['route_name'],
                    'url' => $menu['url'],
                    'icon' => $menu['icon'],
                    'sort_order' => $menu['sort_order'],
                    'is_active' => true,
                ]
            );
        }
    }

    private function seedDefaultPermissions(): void
    {
        $menus = Menu::query()->get();
        $userLevels = UserLevel::query()->get();

        foreach ($userLevels as $level) {
            foreach ($menus as $menu) {
                $isSuperAdmin = $level->level_code === 'super-admin';
                $isAdministrator = $level->level_code === 'administrator';
                $isManager = $level->level_code === 'manager';
                $isSupervisor = $level->level_code === 'supervisor';
                $isStaff = $level->level_code === 'staff';
                $isViewer = $level->level_code === 'viewer';

                UserLevelPermission::updateOrCreate(
                    [
                        'user_level_id' => $level->id,
                        'menu_id' => $menu->id,
                    ],
                    [
                        'can_view' => $isSuperAdmin || $isAdministrator || $isManager || $isSupervisor || $isStaff || $isViewer,
                        'can_create' => $isSuperAdmin || $isAdministrator || $isStaff,
                        'can_edit' => $isSuperAdmin || $isAdministrator || $isStaff,
                        'can_delete' => $isSuperAdmin || $isAdministrator,
                        'can_review' => $isSuperAdmin || $isAdministrator || $isSupervisor,
                        'can_approve' => $isSuperAdmin || $isAdministrator || $isManager,
                        'can_export' => $isSuperAdmin || $isAdministrator || $isManager || $isSupervisor,
                    ]
                );
            }
        }
    }
}
