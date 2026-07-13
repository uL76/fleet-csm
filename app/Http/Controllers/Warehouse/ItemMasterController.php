<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\ItemMaster;
use App\Services\Accurate\ItemMasterSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ItemMasterController extends Controller
{
    public function index(
        Request $request
    ): Response {
        $search = trim(
            (string) $request->input(
                'search',
                ''
            )
        );

        $status = trim(
            (string) $request->input(
                'status',
                ''
            )
        );

        $partNumber = trim(
            (string) $request->input(
                'part_number',
                ''
            )
        );

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

        $query = ItemMaster::query()
            ->when(
                $search !== '',
                function ($query) use (
                    $search
                ): void {
                    $query->where(
                        function (
                            $subQuery
                        ) use (
                            $search
                        ): void {
                            $subQuery
                                ->where(
                                    'item_code',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'part_number',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'item_description',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'unit_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'accurate_id',
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
                $partNumber === 'with',
                function ($query): void {
                    $query
                        ->where(
                            'part_number',
                            '!=',
                            null
                        )
                        ->where(
                            'part_number',
                            '<>',
                            ''
                        );
                }
            )
            ->when(
                $partNumber === 'without',
                function ($query): void {
                    $query->where(
                        function (
                            $subQuery
                        ): void {
                            $subQuery
                                ->whereNull(
                                    'part_number'
                                )
                                ->orWhere(
                                    'part_number',
                                    ''
                                );
                        }
                    );
                }
            )
            ->orderBy(
                'item_code'
            );

        $items = $query
            ->paginate($perPage)
            ->withQueryString();

        $summary = [
            'total' => ItemMaster::query()->count('*'),

            'active' => ItemMaster::query()
                ->where(
                    'is_active',
                    true
                )
                ->count(),

            'inactive' => ItemMaster::query()
                ->where(
                    'is_active',
                    false
                )
                ->count(),

            'with_part_number' => ItemMaster::query()
                ->where(
                    'part_number',
                    '!=',
                    null
                )
                ->where(
                    'part_number',
                    '<>',
                    ''
                )
                ->count(),

            'without_part_number' => ItemMaster::query()
                ->where(
                    function (
                        $query
                    ): void {
                        $query
                            ->whereNull(
                                'part_number'
                            )
                            ->orWhere(
                                'part_number',
                                ''
                            );
                    }
                )
                ->count(),
        ];

        $lastSyncAt = ItemMaster::query()
            ->max('last_sync_at');

        return Inertia::render(
            'warehouse/item-master/Index',
            [
                'items' => $items,

                'summary' => $summary,

                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'part_number' => $partNumber,
                    'per_page' => $perPage,
                ],

                'lastSyncAt' => $lastSyncAt,

                'flash' => [
                    'success' => $request->session()
                        ->get('success'),

                    'error' => $request->session()
                        ->get('error'),

                    'sync_result' => $request->session()
                        ->get(
                            'sync_result'
                        ),
                ],
            ]
        );
    }

    public function sync(
        Request $request,
        ItemMasterSyncService $syncService
    ): RedirectResponse {
        try {
            $user = $request->user('web');

            $result = $syncService->sync(
                $user?->id
            );

            return redirect()
                ->route(
                    'warehouse.item-master.index'
                )
                ->with(
                    'success',
                    'Sinkronisasi Item Master dari Accurate berhasil.'
                )
                ->with(
                    'sync_result',
                    $result
                );
        } catch (Throwable $exception) {
            report($exception);

            return redirect()
                ->route(
                    'warehouse.item-master.index'
                )
                ->with(
                    'error',
                    'Sinkronisasi Item Master gagal: '
                    .$exception->getMessage()
                );
        }
    }
}
