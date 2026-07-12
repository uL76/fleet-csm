<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Services\Accurate\WarehouseSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class WarehouseController extends Controller
{
    public function index(
        Request $request
    ): Response {
        $search = $request
            ->string('search')
            ->trim()
            ->toString();

        $status = $request
            ->string('status')
            ->trim()
            ->toString();

        $type = $request
            ->string('type')
            ->trim()
            ->toString();

        $perPage = (int) $request->input(
            'per_page',
            10
        );

        if (
            ! in_array(
                $perPage,
                [10, 25, 50, 100],
                true
            )
        ) {
            $perPage = 10;
        }

        $warehouses = Warehouse::query()
            ->when(
                $search !== '',
                function ($query) use ($search) {
                    $query->where(
                        function (
                            $subQuery
                        ) use ($search) {
                            $subQuery
                                ->where(
                                    'warehouse_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'accurate_id',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'accurate_location_id',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'description',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'city',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'province',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'pic',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
                }
            )
            ->when(
                $status === 'active',
                fn ($query) => $query->where(
                    'is_active',
                    true
                )
            )
            ->when(
                $status === 'inactive',
                fn ($query) => $query->where(
                    'is_active',
                    false
                )
            )
            ->when(
                $type === 'damage',
                fn ($query) => $query->where(
                    'is_damage_warehouse',
                    true
                )
            )
            ->when(
                $type === 'normal',
                fn ($query) => $query->where(
                    'is_damage_warehouse',
                    false
                )
            )
            ->orderByDesc('is_active')
            ->orderBy('warehouse_name')
            ->paginate($perPage)
            ->withQueryString();

        $summary = [
            'total' => Warehouse::query()->count('*'),

            'active' => Warehouse::query()
                ->where(
                    'is_active',
                    true
                )
                ->count(),

            'inactive' => Warehouse::query()
                ->where(
                    'is_active',
                    false
                )
                ->count(),

            'damage' => Warehouse::query()
                ->where(
                    'is_damage_warehouse',
                    true
                )
                ->count(),

            'normal' => Warehouse::query()
                ->where(
                    'is_damage_warehouse',
                    false
                )
                ->count(),
        ];

        $lastSyncAt = Warehouse::query()
            ->max('last_sync_at');

        return Inertia::render(
            'warehouse/Index',
            [
                'warehouses' => $warehouses,
                'summary' => $summary,
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'type' => $type,
                    'per_page' => $perPage,
                ],
                'lastSyncAt' => $lastSyncAt,
            ]
        );
    }

    public function sync(
        Request $request,
        WarehouseSyncService $syncService
    ): RedirectResponse {
        try {
            $user = $request->user('web');

            $result = $syncService->sync(
                $user?->id
            );

            return redirect()
                ->route('warehouse.warehouses.index')
                ->with(
                    'success',
                    'Sinkronisasi warehouse berhasil.'
                )
                ->with(
                    'sync_result',
                    $result
                );
        } catch (Throwable $exception) {
            report($exception);

            return redirect()
                ->route('warehouse.warehouses.index')
                ->with(
                    'error',
                    'Sinkronisasi warehouse gagal: '
                    .$exception->getMessage()
                );
        }
    }
}
