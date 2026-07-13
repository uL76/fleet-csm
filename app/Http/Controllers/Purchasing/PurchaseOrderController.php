<?php

namespace App\Http\Controllers\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Services\Accurate\PurchaseOrderSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PurchaseOrderController extends Controller
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

        $startDate = $request->input(
            'start_date',
            now()->startOfMonth()
                ->format('Y-m-d')
        );

        $endDate = $request->input(
            'end_date',
            now()->format('Y-m-d')
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

        $purchaseOrders = PurchaseOrder::query()
            ->with([
                'details' => function ($query) {
                    $query->orderBy('id');
                },
            ])
            ->withCount('details')
            ->withSum(
                'details as total_quantity',
                'quantity'
            )
            ->search($search)
            ->when(
                $status !== '',
                fn ($query) => $query->where(
                    'po_status',
                    $status
                )
            )
            ->when(
                $startDate,
                fn ($query) => $query->whereDate(
                    'trans_date',
                    '>=',
                    $startDate
                )
            )
            ->when(
                $endDate,
                fn ($query) => $query->whereDate(
                    'trans_date',
                    '<=',
                    $endDate
                )
            )
            ->latest('trans_date')
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        $summary = [
            'total_po' => PurchaseOrder::query()->count('*'),

            'total_amount' => PurchaseOrder::query()
                ->sum('total_amount'),

            'total_vendor' => PurchaseOrder::query()
                ->where(
                    'vendor_name',
                    '!=',
                    null
                )
                ->distinct(
                    'vendor_name'
                )
                ->count(
                    'vendor_name'
                ),

            'total_open' => PurchaseOrder::query()
                ->where('is_closed', false)
                ->count(),
        ];

        $statuses =
            PurchaseOrder::query()
                ->where(
                    'po_status',
                    '!=',
                    null
                )
                ->where(
                    'po_status',
                    '<>',
                    ''
                )
                ->distinct()
                ->orderBy('po_status')
                ->pluck('po_status');

        return Inertia::render(
            'purchasing/purchase-order/Index',
            [
                'purchaseOrders' => $purchaseOrders,

                'summary' => $summary,

                'statuses' => $statuses,

                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'per_page' => $perPage,
                ],

                'lastSyncAt' => PurchaseOrder::query()
                    ->max('last_sync_at'),
            ]
        );
    }

    public function sync(
        Request $request,
        PurchaseOrderSyncService $syncService
    ): RedirectResponse {
        $validated = $request->validate([
            'start_date' => [
                'required',
                'date',
            ],

            'end_date' => [
                'required',
                'date',
                'after_or_equal:start_date',
            ],
        ]);

        try {
            $result = $syncService->sync(
                $validated['start_date'],
                $validated['end_date'],
                $request->user()?->id
            );

            return redirect()
                ->route(
                    'purchasing.purchase-order.index',
                    [
                        'start_date' => $validated[
                                'start_date'
                            ],
                        'end_date' => $validated[
                                'end_date'
                            ],
                    ]
                )
                ->with(
                    'success',
                    'Sinkronisasi Purchase Order berhasil.'
                )
                ->with(
                    'sync_result',
                    $result
                );
        } catch (Throwable $exception) {
            report($exception);

            return redirect()
                ->route(
                    'purchasing.purchase-order.index'
                )
                ->with(
                    'error',
                    'Sinkronisasi Purchase Order gagal: '
                    .$exception->getMessage()
                );
        }
    }
}
