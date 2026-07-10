<?php

namespace App\Http\Controllers\Administrator;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Department;
use App\Models\Position;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PositionController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();

        $positions = Position::query()
            ->with([
                'company:id,company_code,company_name',
                'department:id,department_code,department_name',
            ])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('position_code', 'like', "%{$search}%")
                        ->orWhere('position_name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('company', function ($companyQuery) use ($search) {
                            $companyQuery
                                ->where('company_code', 'like', "%{$search}%")
                                ->orWhere('company_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('department', function ($departmentQuery) use ($search) {
                            $departmentQuery
                                ->where('department_code', 'like', "%{$search}%")
                                ->orWhere('department_name', 'like', "%{$search}%");
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

        return Inertia::render('administrator/positions/Index', [
            'positions' => $positions,
            'companies' => $companies,
            'departments' => $departments,
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
            'position_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('positions', 'position_code')
                    ->where(fn ($query) => $query
                        ->where('company_id', $request->company_id)
                        ->where('department_id', $request->department_id)
                    ),
            ],
            'position_name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        Position::create($validated);

        return redirect()
            ->route('administrator.positions.index')
            ->with('success', 'Position berhasil ditambahkan.');
    }

    public function update(Request $request, Position $position)
    {
        $validated = $request->validate([
            'company_id' => ['nullable', 'exists:companies,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('positions', 'position_code')
                    ->where(fn ($query) => $query
                        ->where('company_id', $request->company_id)
                        ->where('department_id', $request->department_id)
                    )
                    ->ignore($position->id),
            ],
            'position_name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $position->update($validated);

        return redirect()
            ->route('administrator.positions.index')
            ->with('success', 'Position berhasil diperbarui.');
    }

    public function destroy(Position $position)
    {
        Position::whereKey($position->id)->delete();

        return redirect()
            ->route('administrator.positions.index')
            ->with('success', 'Position berhasil dihapus.');
    }
}
