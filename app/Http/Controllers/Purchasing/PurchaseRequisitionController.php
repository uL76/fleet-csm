<?php

namespace App\Http\Controllers\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequisition;
use App\Services\Accurate\PurchaseRequisitionSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PurchaseRequisitionController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = trim((string) $request->input('status', ''));

        $startDate = trim(
            (string) $request->input(
                'start_date',
                now()->startOfMonth()->toDateString()
            )
        );

        $endDate = trim(
            (string) $request->input(
                'end_date',
                now()->toDateString()
            )
        );

        if ($startDate === '') {
            $startDate = now()
                ->startOfMonth()
                ->toDateString();
        }

        if ($endDate === '') {
            $endDate = now()
                ->toDateString();
        }

        $perPage = max(
            10,
            min(
                100,
                (int) $request->input('per_page', 10)
            )
        );

        $purchaseRequisitions = PurchaseRequisition::query()
            ->with([
                'details' => fn ($query) => $query->orderBy('id'),
            ])
            ->withCount('details')
            ->withSum('details as total_quantity', 'quantity')
            ->search($search)
            ->when(
                $status !== '',
                fn ($query) => $query->where('pr_status', $status)
            )
            ->when(
                $startDate !== '',
                fn ($query) => $query->whereDate(
                    'trans_date',
                    '>=',
                    $startDate
                )
            )
            ->when(
                $endDate !== '',
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

        $statuses = PurchaseRequisition::query()
            ->whereNotNull('pr_status')
            ->where('pr_status', '!=', '')
            ->distinct()
            ->orderBy('pr_status')
            ->pluck('pr_status')
            ->values();

        return Inertia::render(
            'purchasing/purchase-requisition/Index',
            [
                'purchaseRequisitions' => $purchaseRequisitions,
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'per_page' => $perPage,
                ],
                'statuses' => $statuses,
                'summary' => [
                    'total_pr' => PurchaseRequisition::query()->count(),
                    'total_open' => PurchaseRequisition::query()
                        ->where('is_closed', false)
                        ->count(),
                    'total_closed' => PurchaseRequisition::query()
                        ->where('is_closed', true)
                        ->count(),
                    'total_quantity' => (float) PurchaseRequisition::query()
                        ->withSum('details', 'quantity')
                        ->get()
                        ->sum('details_sum_quantity'),
                ],
                'lastSyncAt' => PurchaseRequisition::query()
                    ->max('last_sync_at'),
            ]
        );
    }

    public function sync(
        Request $request,
        PurchaseRequisitionSyncService $syncService
    ): RedirectResponse {
        $validated = $request->validate([
            'start_date' => ['required', 'date'],
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

            $message = $result['failed'] > 0
                ? 'Sinkronisasi PR selesai dengan beberapa kegagalan.'
                : 'Sinkronisasi Purchase Requisition berhasil.';

            return back()
                ->with('success', $message)
                ->with('sync_result', $result);
        } catch (Throwable $exception) {
            report($exception);

            return back()->with(
                'error',
                'Sinkronisasi Purchase Requisition gagal: '
                .$exception->getMessage()
            );
        }
    }
}
