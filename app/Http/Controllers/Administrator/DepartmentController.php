<?php

namespace App\Http\Controllers\Administrator;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();

        $departments = Department::query()
            ->with('company:id,company_code,company_name')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('department_code', 'like', "%{$search}%")
                        ->orWhere('department_name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('company', function ($companyQuery) use ($search) {
                            $companyQuery
                                ->where('company_code', 'like', "%{$search}%")
                                ->orWhere('company_name', 'like', "%{$search}%");
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

        return Inertia::render('administrator/departments/Index', [
            'departments' => $departments,
            'companies' => $companies,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_id' => ['nullable', 'exists:companies,id'],
            'department_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('departments', 'department_code')
                    ->where(fn ($query) => $query->where('company_id', $request->company_id)),
            ],
            'department_name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        Department::create($validated);

        return redirect()
            ->route('administrator.departments.index')
            ->with('success', 'Department berhasil ditambahkan.');
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'company_id' => ['nullable', 'exists:companies,id'],
            'department_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('departments', 'department_code')
                    ->where(fn ($query) => $query->where('company_id', $request->company_id))
                    ->ignore($department->id),
            ],
            'department_name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $department->update($validated);

        return redirect()
            ->route('administrator.departments.index')
            ->with('success', 'Department berhasil diperbarui.');
    }

    public function destroy(Department $department)
    {
        Department::whereKey($department->id)->delete();

        return redirect()
            ->route('administrator.departments.index')
            ->with('success', 'Department berhasil dihapus.');
    }
}
