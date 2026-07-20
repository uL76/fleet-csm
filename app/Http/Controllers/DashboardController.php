<?php

namespace App\Http\Controllers;

use App\Models\MaterialRequest;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequisition;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $now = now();

        $currentPeriodStart = $now->copy()->startOfMonth();
        $currentPeriodEnd = $now->copy()->endOfMonth();

        $previousPeriodStart = $now
            ->copy()
            ->subMonthNoOverflow()
            ->startOfMonth();

        $previousPeriodEnd = $now
            ->copy()
            ->subMonthNoOverflow()
            ->endOfMonth();

        /*
        |--------------------------------------------------------------------------
        | Summary Material Request
        |--------------------------------------------------------------------------
        */

        $totalMr = MaterialRequest::query()->count();

        $pendingMr = MaterialRequest::query()
            ->whereIn('status', [
                'DRAFT',
                'SUBMITTED',
                'IN_REVIEW',
                'REVIEWED',
                'REVISION',
            ])
            ->count();

        $approvedMr = MaterialRequest::query()
            ->where('status', 'APPROVED')
            ->count();

        $rejectedMr = MaterialRequest::query()
            ->where('status', 'REJECTED')
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Summary Purchase Requisition
        |--------------------------------------------------------------------------
        */

        $totalPr = PurchaseRequisition::query()->count();

        $openPr = PurchaseRequisition::query()
            ->where(function (Builder $query): void {
                $query
                    ->whereNull('is_closed')
                    ->orWhere('is_closed', false);
            })
            ->count();

        $closedPr = PurchaseRequisition::query()
            ->where('is_closed', true)
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Summary Purchase Order
        |--------------------------------------------------------------------------
        */

        $totalPo = PurchaseOrder::query()->count();

        $openPo = PurchaseOrder::query()
            ->where(function (Builder $query): void {
                $query
                    ->whereNull('is_closed')
                    ->orWhere('is_closed', false);
            })
            ->count();

        $closedPo = PurchaseOrder::query()
            ->where('is_closed', true)
            ->count();

        $totalPoAmount = (float) PurchaseOrder::query()
            ->sum('total_amount');

        $totalVendor = PurchaseOrder::query()
            ->whereNotNull('vendor_name')
            ->where('vendor_name', '!=', '')
            ->distinct()
            ->count('vendor_name');

        /*
        |--------------------------------------------------------------------------
        | Workflow MR -> PR -> PO
        |--------------------------------------------------------------------------
        */

        $mrWithPr = MaterialRequest::query()
            ->whereNotNull('mr_number')
            ->whereExists(function ($query): void {
                $query
                    ->selectRaw('1')
                    ->from('purchase_requisitions')
                    ->whereColumn(
                        'purchase_requisitions.mr_number',
                        'material_requests.mr_number'
                    );
            })
            ->count();

        $mrWithoutPr = max(0, $totalMr - $mrWithPr);

        $prWithPo = PurchaseRequisition::query()
            ->whereNotNull('pr_number')
            ->whereExists(function ($query): void {
                $query
                    ->selectRaw('1')
                    ->from('purchase_orders')
                    ->whereColumn(
                        'purchase_orders.pr_number',
                        'purchase_requisitions.pr_number'
                    );
            })
            ->count();

        $prWithoutPo = max(0, $totalPr - $prWithPo);

        $mrToPrPercentage = $this->percentage(
            $mrWithPr,
            $totalMr
        );

        $prToPoPercentage = $this->percentage(
            $prWithPo,
            $totalPr
        );

        $overallConversionPercentage = $this->percentage(
            $prWithPo,
            $totalMr
        );

        /*
        |--------------------------------------------------------------------------
        | Status Distribution
        |--------------------------------------------------------------------------
        */

        $mrStatusCounts = MaterialRequest::query()
            ->selectRaw('status, COUNT(*) AS total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $prStatusCounts = PurchaseRequisition::query()
            ->selectRaw('COALESCE(pr_status, "UNKNOWN") AS status_name, COUNT(*) AS total')
            ->groupBy('status_name')
            ->pluck('total', 'status_name');

        $poStatusCounts = PurchaseOrder::query()
            ->selectRaw('COALESCE(po_status, "UNKNOWN") AS status_name, COUNT(*) AS total')
            ->groupBy('status_name')
            ->pluck('total', 'status_name');

        /*
        |--------------------------------------------------------------------------
        | Trend
        |--------------------------------------------------------------------------
        */

        $currentMr = MaterialRequest::query()
            ->whereBetween('created_at', [
                $currentPeriodStart,
                $currentPeriodEnd,
            ])
            ->count();

        $previousMr = MaterialRequest::query()
            ->whereBetween('created_at', [
                $previousPeriodStart,
                $previousPeriodEnd,
            ])
            ->count();

        $currentPr = PurchaseRequisition::query()
            ->whereBetween('trans_date', [
                $currentPeriodStart->toDateString(),
                $currentPeriodEnd->toDateString(),
            ])
            ->count();

        $previousPr = PurchaseRequisition::query()
            ->whereBetween('trans_date', [
                $previousPeriodStart->toDateString(),
                $previousPeriodEnd->toDateString(),
            ])
            ->count();

        $currentPo = PurchaseOrder::query()
            ->whereBetween('trans_date', [
                $currentPeriodStart->toDateString(),
                $currentPeriodEnd->toDateString(),
            ])
            ->count();

        $previousPo = PurchaseOrder::query()
            ->whereBetween('trans_date', [
                $previousPeriodStart->toDateString(),
                $previousPeriodEnd->toDateString(),
            ])
            ->count();

        $currentPoAmount = (float) PurchaseOrder::query()
            ->whereBetween('trans_date', [
                $currentPeriodStart->toDateString(),
                $currentPeriodEnd->toDateString(),
            ])
            ->sum('total_amount');

        $previousPoAmount = (float) PurchaseOrder::query()
            ->whereBetween('trans_date', [
                $previousPeriodStart->toDateString(),
                $previousPeriodEnd->toDateString(),
            ])
            ->sum('total_amount');

        return Inertia::render('dashboard/Index', [
            'summary' => [
                'total_mr' => $totalMr,
                'pending_mr' => $pendingMr,
                'approved_mr' => $approvedMr,
                'rejected_mr' => $rejectedMr,

                'total_pr' => $totalPr,
                'open_pr' => $openPr,
                'closed_pr' => $closedPr,

                'total_po' => $totalPo,
                'open_po' => $openPo,
                'closed_po' => $closedPo,

                'total_po_amount' => $totalPoAmount,
                'total_vendor' => $totalVendor,
            ],

            'workflow' => [
                'mr_without_pr' => $mrWithoutPr,
                'mr_with_pr' => $mrWithPr,
                'pr_without_po' => $prWithoutPo,
                'pr_with_po' => $prWithPo,
                'mr_to_pr_percentage' => $mrToPrPercentage,
                'pr_to_po_percentage' => $prToPoPercentage,
                'overall_conversion_percentage' => $overallConversionPercentage,
            ],

            'mr_statuses' => [
                [
                    'label' => 'Draft',
                    'value' => (int) ($mrStatusCounts['DRAFT'] ?? 0),
                    'tone' => 'gray',
                ],
                [
                    'label' => 'Submitted',
                    'value' => (int) ($mrStatusCounts['SUBMITTED'] ?? 0),
                    'tone' => 'blue',
                ],
                [
                    'label' => 'In Review',
                    'value' => (int) ($mrStatusCounts['IN_REVIEW'] ?? 0),
                    'tone' => 'indigo',
                ],
                [
                    'label' => 'Reviewed',
                    'value' => (int) ($mrStatusCounts['REVIEWED'] ?? 0),
                    'tone' => 'purple',
                ],
                [
                    'label' => 'Approved',
                    'value' => (int) ($mrStatusCounts['APPROVED'] ?? 0),
                    'tone' => 'green',
                ],
                [
                    'label' => 'Revision',
                    'value' => (int) ($mrStatusCounts['REVISION'] ?? 0),
                    'tone' => 'amber',
                ],
                [
                    'label' => 'Rejected',
                    'value' => (int) ($mrStatusCounts['REJECTED'] ?? 0),
                    'tone' => 'red',
                ],
            ],

            'pr_statuses' => $this->statusItems(
                $prStatusCounts
            ),

            'po_statuses' => $this->statusItems(
                $poStatusCounts
            ),

            'monthly_procurement' => $this->monthlyProcurement(),

            'recent_activities' => $this->recentActivities(),

            'trends' => [
                'mr' => $this->trend(
                    $currentMr,
                    $previousMr
                ),

                'pr' => $this->trend(
                    $currentPr,
                    $previousPr
                ),

                'po' => $this->trend(
                    $currentPo,
                    $previousPo
                ),

                'po_amount' => $this->trend(
                    $currentPoAmount,
                    $previousPoAmount
                ),
            ],

            'last_updated_at' => now()->toIso8601String(),
        ]);
    }

    private function percentage(
        int|float $value,
        int|float $total
    ): float {
        if ($total <= 0) {
            return 0;
        }

        return round(
            ($value / $total) * 100,
            1
        );
    }

    private function trend(
        int|float $currentValue,
        int|float $previousValue
    ): array {
        if ($previousValue <= 0) {
            return [
                'value' => $currentValue > 0
                    ? 100
                    : 0,

                'direction' => $currentValue > 0
                    ? 'up'
                    : 'neutral',

                'label' => 'dibanding bulan sebelumnya',
            ];
        }

        $change = round(
            (($currentValue - $previousValue) / $previousValue) * 100,
            1
        );

        return [
            'value' => abs($change),

            'direction' => $change > 0
                ? 'up'
                : ($change < 0 ? 'down' : 'neutral'),

            'label' => 'dibanding bulan sebelumnya',
        ];
    }

    private function statusItems(
        Collection $statuses
    ): array {
        return $statuses
            ->map(function (
                mixed $total,
                mixed $status
            ): array {
                $label = trim(
                    (string) $status
                );

                return [
                    'label' => $label !== ''
                        ? $label
                        : 'Unknown',

                    'value' => (int) $total,

                    'tone' => $this->statusTone(
                        $label
                    ),
                ];
            })
            ->values()
            ->all();
    }

    private function statusTone(
        string $status
    ): string {
        $normalized = strtoupper(
            trim($status)
        );

        if (
            str_contains($normalized, 'CLOSE') ||
            str_contains($normalized, 'APPROV') ||
            str_contains($normalized, 'COMPLETE')
        ) {
            return 'green';
        }

        if (
            str_contains($normalized, 'REJECT') ||
            str_contains($normalized, 'CANCEL')
        ) {
            return 'red';
        }

        if (
            str_contains($normalized, 'PROCESS') ||
            str_contains($normalized, 'WAIT') ||
            str_contains($normalized, 'PENDING')
        ) {
            return 'amber';
        }

        if (
            str_contains($normalized, 'OPEN') ||
            str_contains($normalized, 'DRAFT')
        ) {
            return 'blue';
        }

        return 'gray';
    }

    private function monthlyProcurement(): array
    {
        $months = collect();

        for ($index = 5; $index >= 0; $index--) {
            $month = now()
                ->copy()
                ->subMonthsNoOverflow($index);

            $start = $month
                ->copy()
                ->startOfMonth();

            $end = $month
                ->copy()
                ->endOfMonth();

            $months->push([
                'month' => $month
                    ->locale('id')
                    ->translatedFormat('M Y'),

                'mr' => MaterialRequest::query()
                    ->whereBetween('created_at', [
                        $start,
                        $end,
                    ])
                    ->count(),

                'pr' => PurchaseRequisition::query()
                    ->whereBetween('trans_date', [
                        $start->toDateString(),
                        $end->toDateString(),
                    ])
                    ->count(),

                'po' => PurchaseOrder::query()
                    ->whereBetween('trans_date', [
                        $start->toDateString(),
                        $end->toDateString(),
                    ])
                    ->count(),
            ]);
        }

        return $months->all();
    }

    private function recentActivities(): array
    {
        $materialRequests = MaterialRequest::query()
            ->latest('updated_at')
            ->limit(5)
            ->get([
                'id',
                'mr_number',
                'subject',
                'status',
                'updated_at',
            ])
            ->map(function (
                MaterialRequest $materialRequest
            ): array {
                $status = is_object(
                    $materialRequest->status
                )
                    ? $materialRequest->status->value
                    : (string) $materialRequest->status;

                return [
                    'id' => 'mr-'.$materialRequest->id,
                    'type' => 'MR',
                    'document_number' => $materialRequest->mr_number,
                    'title' => $materialRequest->subject
                        ?: 'Material Request',
                    'status' => $status,
                    'status_tone' => $this->statusTone($status),
                    'date' => $materialRequest
                        ->updated_at
                        ?->toIso8601String(),
                    'url' => '/supply-chain/material-requests/'
                        .$materialRequest->id,
                ];
            });

        $purchaseRequisitions =
            PurchaseRequisition::query()
                ->latest('updated_at')
                ->limit(5)
                ->get([
                    'id',
                    'pr_number',
                    'description',
                    'pr_status',
                    'updated_at',
                ])
                ->map(function (
                    PurchaseRequisition $purchaseRequisition
                ): array {
                    return [
                        'id' => 'pr-'
                            .$purchaseRequisition->id,
                        'type' => 'PR',
                        'document_number' => $purchaseRequisition->pr_number,
                        'title' => $purchaseRequisition->description
                            ?: 'Purchase Requisition',
                        'status' => $purchaseRequisition->pr_status
                            ?: 'Unknown',
                        'status_tone' => $this->statusTone(
                            (string) $purchaseRequisition
                                ->pr_status
                        ),
                        'date' => $purchaseRequisition
                            ->updated_at
                            ?->toIso8601String(),
                        'url' => '/purchasing/purchase-requisition'
                            .'?search='
                            .urlencode(
                                (string) $purchaseRequisition
                                    ->pr_number
                            ),
                    ];
                });

        $purchaseOrders = PurchaseOrder::query()
            ->latest('updated_at')
            ->limit(5)
            ->get([
                'id',
                'po_number',
                'po_subject',
                'po_status',
                'updated_at',
            ])
            ->map(function (
                PurchaseOrder $purchaseOrder
            ): array {
                return [
                    'id' => 'po-'.$purchaseOrder->id,
                    'type' => 'PO',
                    'document_number' => $purchaseOrder->po_number,
                    'title' => $purchaseOrder->po_subject
                        ?: 'Purchase Order',
                    'status' => $purchaseOrder->po_status
                        ?: 'Unknown',
                    'status_tone' => $this->statusTone(
                        (string) $purchaseOrder->po_status
                    ),
                    'date' => $purchaseOrder
                        ->updated_at
                        ?->toIso8601String(),
                    'url' => '/purchasing/purchase-order'
                        .'?search='
                        .urlencode(
                            (string) $purchaseOrder->po_number
                        ),
                ];
            });

        return $materialRequests
            ->concat($purchaseRequisitions)
            ->concat($purchaseOrders)
            ->sortByDesc(function (
                array $activity
            ): int {
                return isset($activity['date'])
                    ? Carbon::parse(
                        $activity['date']
                    )->timestamp
                    : 0;
            })
            ->take(8)
            ->values()
            ->all();
    }
}
