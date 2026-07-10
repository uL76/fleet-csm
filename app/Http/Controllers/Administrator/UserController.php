<?php

namespace App\Http\Controllers\Administrator;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Department;
use App\Models\Position;
use App\Models\User;
use App\Models\UserLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();

        $users = User::query()
            ->with([
                'company:id,company_code,company_name',
                'department:id,department_code,department_name',
                'position:id,position_code,position_name',
                'userLevel:id,level_code,level_name',
            ])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('employee_id', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhereHas('company', function ($companyQuery) use ($search) {
                            $companyQuery
                                ->where('company_code', 'like', "%{$search}%")
                                ->orWhere('company_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('department', function ($departmentQuery) use ($search) {
                            $departmentQuery
                                ->where('department_code', 'like', "%{$search}%")
                                ->orWhere('department_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('position', function ($positionQuery) use ($search) {
                            $positionQuery
                                ->where('position_code', 'like', "%{$search}%")
                                ->orWhere('position_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('userLevel', function ($levelQuery) use ($search) {
                            $levelQuery
                                ->where('level_code', 'like', "%{$search}%")
                                ->orWhere('level_name', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $companies = Company::query()
            ->where('is_active', true)
            ->orderBy('company_name')
            ->get(['id', 'company_code', 'company_name']);

        $departments = Department::query()
            ->where('is_active', true)
            ->orderBy('department_name')
            ->get(['id', 'company_id', 'department_code', 'department_name']);

        $positions = Position::query()
            ->where('is_active', true)
            ->orderBy('position_name')
            ->get(['id', 'company_id', 'department_id', 'position_code', 'position_name']);

        $userLevels = UserLevel::query()
            ->where('is_active', true)
            ->orderBy('level_order')
            ->get(['id', 'level_code', 'level_name', 'level_order']);

        return Inertia::render('administrator/users/Index', [
            'users' => $users,
            'companies' => $companies,
            'departments' => $departments,
            'positions' => $positions,
            'userLevels' => $userLevels,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_id' => ['nullable', 'exists:companies,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id' => ['nullable', 'exists:positions,id'],
            'user_level_id' => ['nullable', 'exists:user_levels,id'],
            'employee_id' => ['nullable', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'status' => ['required', 'in:active,inactive'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        User::create([
            'company_id' => $validated['company_id'] ?? null,
            'department_id' => $validated['department_id'] ?? null,
            'position_id' => $validated['position_id'] ?? null,
            'user_level_id' => $validated['user_level_id'] ?? null,
            'employee_id' => $validated['employee_id'] ?? null,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'],
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()
            ->route('administrator.users.index')
            ->with('success', 'User berhasil ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'company_id' => ['nullable', 'exists:companies,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id' => ['nullable', 'exists:positions,id'],
            'user_level_id' => ['nullable', 'exists:user_levels,id'],
            'employee_id' => ['nullable', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:150'],
            'email' => [
                'required',
                'email',
                'max:150',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'status' => ['required', 'in:active,inactive'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        $payload = [
            'company_id' => $validated['company_id'] ?? null,
            'department_id' => $validated['department_id'] ?? null,
            'position_id' => $validated['position_id'] ?? null,
            'user_level_id' => $validated['user_level_id'] ?? null,
            'employee_id' => $validated['employee_id'] ?? null,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'],
        ];

        if (! empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        $user->update($payload);

        return redirect()
            ->route('administrator.users.index')
            ->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        User::whereKey($user->id)->delete();

        return redirect()
            ->route('administrator.users.index')
            ->with('success', 'User berhasil dihapus.');
    }
}
