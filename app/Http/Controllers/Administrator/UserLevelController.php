<?php

namespace App\Http\Controllers\Administrator;

use App\Http\Controllers\Controller;
use App\Models\UserLevel;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserLevelController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();

        $userLevels = UserLevel::query()
            ->when($search, function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('level_code', 'like', "%{$search}%")
                        ->orWhere('level_name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('level_order')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('administrator/user-levels/Index', [
            'userLevels' => $userLevels,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'level_code' => ['required', 'string', 'max:50', 'unique:user_levels,level_code'],
            'level_name' => ['required', 'string', 'max:150'],
            'level_order' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        UserLevel::create($validated);

        return redirect()
            ->route('administrator.user-levels.index')
            ->with('success', 'User level berhasil ditambahkan.');
    }

    public function update(Request $request, UserLevel $userLevel)
    {
        $validated = $request->validate([
            'level_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('user_levels', 'level_code')->ignore($userLevel->id),
            ],
            'level_name' => ['required', 'string', 'max:150'],
            'level_order' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $userLevel->update($validated);

        return redirect()
            ->route('administrator.user-levels.index')
            ->with('success', 'User level berhasil diperbarui.');
    }

    public function destroy(UserLevel $userLevel)
    {
        UserLevel::whereKey($userLevel->id)->delete();

        return redirect()
            ->route('administrator.user-levels.index')
            ->with('success', 'User level berhasil dihapus.');
    }
}
