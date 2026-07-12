<?php

namespace App\Http\Controllers\Administrator;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\UserLevel;
use App\Models\UserLevelPermission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserConfigController extends Controller
{
    public function index(Request $request)
    {
        $selectedLevelId = $request->integer('user_level_id');

        $userLevels = UserLevel::query()
            ->where('is_active', true)
            ->orderBy('level_order')
            ->get(['id', 'level_code', 'level_name', 'level_order']);

        if (! $selectedLevelId && $userLevels->isNotEmpty()) {
            $selectedLevelId = $userLevels->first()->id;
        }

        $menus = Menu::query()
            ->where('is_active', true)
            ->orderBy('menu_group')
            ->orderBy('sort_order')
            ->orderBy('menu_name')
            ->get([
                'id',
                'menu_code',
                'menu_name',
                'menu_group',
                'route_name',
                'url',
                'icon',
                'sort_order',
            ]);

        $permissions = UserLevelPermission::query()
            ->where('user_level_id', $selectedLevelId)
            ->get()
            ->keyBy('menu_id');

        $permissionRows = $menus->map(function ($menu) use ($permissions) {
            $permission = $permissions->get($menu->id);

            return [
                'menu_id' => $menu->id,
                'menu_code' => $menu->menu_code,
                'menu_name' => $menu->menu_name,
                'menu_group' => $menu->menu_group,
                'route_name' => $menu->route_name,
                'url' => $menu->url,
                'icon' => $menu->icon,
                'sort_order' => $menu->sort_order,
                'can_view' => (bool) optional($permission)->can_view,
                'can_create' => (bool) optional($permission)->can_create,
                'can_edit' => (bool) optional($permission)->can_edit,
                'can_delete' => (bool) optional($permission)->can_delete,
                'can_review' => (bool) optional($permission)->can_review,
                'can_approve' => (bool) optional($permission)->can_approve,
                'can_export' => (bool) optional($permission)->can_export,
            ];
        });

        return Inertia::render('administrator/user-config/Index', [
            'userLevels' => $userLevels,
            'selectedLevelId' => $selectedLevelId,
            'permissionRows' => $permissionRows->values(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'user_level_id' => ['required', 'exists:user_levels,id'],
            'permissions' => ['required', 'array'],
            'permissions.*.menu_id' => ['required', 'exists:menus,id'],
            'permissions.*.can_view' => ['required', 'boolean'],
            'permissions.*.can_create' => ['required', 'boolean'],
            'permissions.*.can_edit' => ['required', 'boolean'],
            'permissions.*.can_delete' => ['required', 'boolean'],
            'permissions.*.can_review' => ['required', 'boolean'],
            'permissions.*.can_approve' => ['required', 'boolean'],
            'permissions.*.can_export' => ['required', 'boolean'],
        ]);

        foreach ($validated['permissions'] as $permission) {
            UserLevelPermission::updateOrCreate(
                [
                    'user_level_id' => $validated['user_level_id'],
                    'menu_id' => $permission['menu_id'],
                ],
                [
                    'can_view' => $permission['can_view'],
                    'can_create' => $permission['can_create'],
                    'can_edit' => $permission['can_edit'],
                    'can_delete' => $permission['can_delete'],
                    'can_review' => $permission['can_review'],
                    'can_approve' => $permission['can_approve'],
                    'can_export' => $permission['can_export'],
                ]
            );
        }

        return redirect()
            ->route('administrator.user-config.index', [
                'user_level_id' => $validated['user_level_id'],
            ])
            ->with('success', 'Permission berhasil diperbarui.');
    }
}
