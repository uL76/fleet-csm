<?php

namespace App\Http\Controllers\Administrator;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();

        $companies = Company::query()
            ->when($search, function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('company_code', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('administrator/companies/Index', [
            'companies' => $companies,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('administrator/companies/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_code' => ['required', 'string', 'max:50', 'unique:companies,company_code'],
            'company_name' => ['required', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        Company::create($validated);

        return redirect()
            ->route('administrator.companies.index')
            ->with('success', 'Company berhasil ditambahkan.');
    }

    public function edit(Company $company)
    {
        return Inertia::render('administrator/companies/Edit', [
            'company' => $company,
        ]);
    }

    public function update(Request $request, Company $company)
    {
        $validated = $request->validate([
            'company_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('companies', 'company_code')->ignore($company->id),
            ],
            'company_name' => ['required', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $company->update($validated);

        return redirect()
            ->route('administrator.companies.index')
            ->with('success', 'Company berhasil diperbarui.');
    }

    public function destroy(Company $company)
{
    Company::whereKey($company->id)->delete();

    return redirect()
        ->route('administrator.companies.index')
        ->with('success', 'Company berhasil dihapus.');
}
}
