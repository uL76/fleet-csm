<?php

namespace App\Http\Controllers\SupplyChain;

use App\Http\Controllers\Controller;
use App\Http\Requests\SupplyChain\StoreMaterialRequestRequest;
use App\Http\Requests\SupplyChain\UpdateMaterialRequestRequest;
use App\Models\Company;
use App\Models\Department;
use App\Models\ItemMaster;
use App\Models\MaterialRequest;
use App\Services\SupplyChain\MaterialRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class MaterialRequestController extends Controller
{
    public function __construct(
        private readonly MaterialRequestService $materialRequestService
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize(
            'viewAny',
            MaterialRequest::class
        );

        $search = trim(
            (string) $request->input('search', '')
        );

        $departmentId = $request->input(
            'department_id'
        );

        $status = trim(
            (string) $request->input('status', '')
        );

        $priority = trim(
            (string) $request->input('priority', '')
        );

        $dateFrom = $request->input(
            'date_from',
            now()->startOfMonth()->toDateString()
        );

        $dateTo = $request->input(
            'date_to',
            now()->toDateString()
        );

        $perPage = (int) $request->input(
            'per_page',
            10
        );

        if (! in_array(
            $perPage,
            [10, 25, 50, 100],
            true
        )) {
            $perPage = 10;
        }

        $query = MaterialRequest::query()
            ->with([
                'requester:id,name,email',
                'department:id,department_code,department_name',
                'company:id,company_code,company_name',
            ])
            ->withCount('items')
            ->when(
                $search !== '',
                function ($query) use ($search): void {
                    $query->where(
                        function ($query) use ($search): void {
                            $query
                                ->where(
                                    'mr_number',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'subject',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'customer_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'sales_order_no',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'reference_rfq',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhereHas(
                                    'requester',
                                    function ($requesterQuery) use (
                                        $search
                                    ): void {
                                        $requesterQuery->where(
                                            'name',
                                            'like',
                                            "%{$search}%"
                                        );
                                    }
                                );
                        }
                    );
                }
            )
            ->when(
                $departmentId,
                function ($query) use (
                    $departmentId
                ): void {
                    $query->where(
                        'department_id',
                        $departmentId
                    );
                }
            )
            ->when(
                $status !== '',
                function ($query) use (
                    $status
                ): void {
                    $query->where(
                        'status',
                        $status
                    );
                }
            )
            ->when(
                $priority !== '',
                function ($query) use (
                    $priority
                ): void {
                    $query->where(
                        'priority',
                        $priority
                    );
                }
            )
            ->when(
                $dateFrom,
                function ($query) use (
                    $dateFrom
                ): void {
                    $query->whereDate(
                        'mr_date',
                        '>=',
                        $dateFrom
                    );
                }
            )
            ->when(
                $dateTo,
                function ($query) use (
                    $dateTo
                ): void {
                    $query->whereDate(
                        'mr_date',
                        '<=',
                        $dateTo
                    );
                }
            );

        $materialRequests = (clone $query)
            ->latest('mr_date')
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        $materialRequests->getCollection()
            ->transform(function (
                MaterialRequest $materialRequest
            ) use ($request): MaterialRequest {
                $materialRequest->setAttribute(
                    'can_edit',
                    $request->user()->can(
                        'update',
                        $materialRequest
                    )
                );

                return $materialRequest;
            });

        $summaryBaseQuery =
            MaterialRequest::query();

        $summary = [
            'total' => (clone $summaryBaseQuery)->count(),

            'draft' => (clone $summaryBaseQuery)
                ->where('status', 'DRAFT')
                ->count(),

            'submitted' => (clone $summaryBaseQuery)
                ->whereIn('status', [
                    'SUBMITTED',
                    'IN_REVIEW',
                ])
                ->count(),

            'reviewed' => (clone $summaryBaseQuery)
                ->where('status', 'REVIEWED')
                ->count(),

            'approved' => (clone $summaryBaseQuery)
                ->where('status', 'APPROVED')
                ->count(),

            'revision' => (clone $summaryBaseQuery)
                ->where('status', 'REVISION')
                ->count(),

            'rejected' => (clone $summaryBaseQuery)
                ->where('status', 'REJECTED')
                ->count(),
        ];

        $departments = Department::query()
            ->where('is_active', true)
            ->orderBy('department_name')
            ->get([
                'id',
                'department_code',
                'department_name',
            ]);

        return Inertia::render(
            'supply-chain/material-request/Index',
            [
                'materialRequests' => $materialRequests,

                'summary' => $summary,

                'departments' => $departments,

                'companies' => $this->companyOptions(),

                'requester' => [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'department_id' => $request->user()->department_id,
                    'company_id' => $request->user()->company_id,
                ],

                'priorityOptions' => $this->priorityOptions(),

                'requestTypeOptions' => $this->requestTypeOptions(),

                'filters' => [
                    'search' => $search,

                    'department_id' => $departmentId,

                    'status' => $status,

                    'priority' => $priority,

                    'date_from' => $dateFrom,

                    'date_to' => $dateTo,

                    'per_page' => $perPage,
                ],

                'permissions' => [
                    'can_create' => $request->user()->can(
                        'create',
                        MaterialRequest::class
                    ),
                ],
            ]
        );
    }

    public function create(Request $request): Response
    {
        $this->authorize(
            'create',
            MaterialRequest::class
        );

        return Inertia::render(
            'supply-chain/material-request/Create',
            [
                'departments' => $this->departmentOptions(),

                'companies' => $this->companyOptions(),

                'requester' => [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'department_id' => $request->user()->department_id,
                    'company_id' => $request->user()->company_id,
                ],

                'priorityOptions' => $this->priorityOptions(),

                'requestTypeOptions' => $this->requestTypeOptions(),
            ]
        );
    }

    public function store(
        StoreMaterialRequestRequest $request
    ): RedirectResponse {
        $this->authorize(
            'create',
            MaterialRequest::class
        );

        $materialRequest =
            $this->materialRequestService->create(
                data: $request->validated(),
                userId: $request->user()->id
            );

        return to_route(
            'supply-chain.material-requests.index'
        )->with(
            'success',
            'Material Request berhasil dibuat.'
        );
    }

    public function show(
        Request $request,
        MaterialRequest $materialRequest
    ): Response {
        $this->authorize(
            'view',
            $materialRequest
        );

        $materialRequest->load([
            'requester:id,name,email',
            'department:id,department_code,department_name',
            'company:id,company_code,company_name',
            'items.itemMaster:id,item_code,item_description',
            'approvals.assignedUser:id,name,email',
            'approvals.actionUser:id,name,email',
            'logs.user:id,name,email',
        ]);

        return Inertia::render(
            'supply-chain/material-request/Show',
            [
                'materialRequest' => $materialRequest,

                'permissions' => [
                    'can_edit' => $request->user()->can(
                        'update',
                        $materialRequest
                    ),

                    'can_delete' => $request->user()->can(
                        'delete',
                        $materialRequest
                    ),

                    'can_submit' => $request->user()->can(
                        'submit',
                        $materialRequest
                    ),

                    'can_review' => $request->user()->can(
                        'review',
                        $materialRequest
                    ),

                    'can_approve' => $request->user()->can(
                        'approve',
                        $materialRequest
                    ),

                    'can_revision' => $request->user()->can(
                        'requestRevision',
                        $materialRequest
                    ),

                    'can_reject' => $request->user()->can(
                        'reject',
                        $materialRequest
                    ),
                ],

            ]
        );
    }

    public function edit(
        MaterialRequest $materialRequest
    ): Response {
        $this->authorize(
            'update',
            $materialRequest
        );

        $materialRequest->load([
            'items',
            'requester:id,name,email',
            'department:id,department_code,department_name',
            'company:id,company_code,company_name',
        ]);

        return Inertia::render(
            'supply-chain/material-request/Edit',
            [
                'materialRequest' => $materialRequest,

                'departments' => $this->departmentOptions(),

                'companies' => $this->companyOptions(),

                'priorityOptions' => $this->priorityOptions(),

                'requestTypeOptions' => $this->requestTypeOptions(),
            ]
        );
    }

    public function editData(
        MaterialRequest $materialRequest
    ): JsonResponse {
        $this->authorize(
            'update',
            $materialRequest
        );

        $materialRequest->load([
            'items',
            'requester:id,name,email',
        ]);

        return response()->json([
            'material_request' => $materialRequest,
        ]);
    }

    public function update(
        UpdateMaterialRequestRequest $request,
        MaterialRequest $materialRequest
    ): RedirectResponse {
        $this->authorize(
            'update',
            $materialRequest
        );

        $this->materialRequestService->update(
            materialRequest: $materialRequest,
            data: $request->validated(),
            userId: $request->user()->id
        );

        return to_route(
            'supply-chain.material-requests.index'
        )->with(
            'success',
            'Material Request berhasil diperbarui.'
        );
    }

    public function destroy(
        Request $request,
        MaterialRequest $materialRequest
    ): RedirectResponse {
        $this->authorize(
            'delete',
            $materialRequest
        );

        $this->materialRequestService->delete(
            materialRequest: $materialRequest,
            userId: $request->user()->id
        );

        return to_route(
            'supply-chain.material-requests.index'
        )->with(
            'success',
            'Material Request berhasil dihapus.'
        );
    }

    public function itemMasterOptions(
        Request $request
    ): JsonResponse {
        $this->authorize(
            'create',
            MaterialRequest::class
        );

        $search = trim(
            (string) $request->input('search', '')
        );

        $page = max(
            1,
            (int) $request->input('page', 1)
        );

        $limit = min(
            max(
                (int) $request->input('limit', 25),
                1
            ),
            50
        );

        $query = ItemMaster::query()
            ->where('is_active', true)
            ->when(
                $search !== '',
                function ($query) use ($search): void {
                    $query->where(
                        function ($query) use ($search): void {
                            $query
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
                                    'brand_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'cross_reference_part_no',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
                }
            )
            ->orderBy('item_code');

        $items = $query
            ->paginate(
                perPage: $limit,
                columns: [
                    'id',
                    'item_code',
                    'part_number',
                    'item_description',
                    'unit_name',
                    'brand_name',
                    'preferred_vendor',
                    'total_stock',
                    'minimum_stock',
                    'maximum_quantity',
                    'accurate_raw',
                ],
                page: $page
            );

        $data = collect($items->items())
            ->map(function (ItemMaster $item): array {
                $raw = $item->accurate_raw;

                if (is_string($raw)) {
                    $decoded = json_decode($raw, true);
                    $raw = is_array($decoded) ? $decoded : [];
                }

                if (! is_array($raw)) {
                    $raw = [];
                }

                $unitName = $item->unit_name
                    ?: Arr::get($raw, 'unit.name')
                    ?: Arr::get($raw, 'unitName')
                    ?: Arr::get($raw, 'unit')
                    ?: Arr::get($raw, 'unitNo');

                return [
                    'id' => $item->id,
                    'item_code' => $item->item_code,
                    'part_number' => $item->part_number,
                    'item_description' => $item->item_description,
                    'unit_name' => is_string($unitName) ? $unitName : null,
                    'brand_name' => $item->brand_name,
                    'preferred_vendor' => $item->preferred_vendor,
                    'total_stock' => $item->total_stock,
                    'minimum_stock' => $item->minimum_stock,
                    'maximum_quantity' => $item->maximum_quantity,
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $items->currentPage(),

                'last_page' => $items->lastPage(),

                'per_page' => $items->perPage(),

                'total' => $items->total(),

                'has_more' => $items->hasMorePages(),
            ],
        ]);
    }

    private function departmentOptions()
    {
        return Department::query()
            ->where('is_active', true)
            ->orderBy('department_name')
            ->get([
                'id',
                'department_code',
                'department_name',
            ]);
    }

    private function companyOptions()
    {
        return Company::query()
            ->where('is_active', true)
            ->orderBy('company_name')
            ->get([
                'id',
                'company_code',
                'company_name',
            ]);
    }

    private function priorityOptions(): array
    {
        return [
            [
                'value' => 'EMERGENCY',
                'label' => 'Emergency',
            ],
            [
                'value' => 'HIGH',
                'label' => 'High',
            ],
            [
                'value' => 'MEDIUM',
                'label' => 'Medium',
            ],
            [
                'value' => 'LOW',
                'label' => 'Low',
            ],
        ];
    }

    private function requestTypeOptions(): array
    {
        return [
            [
                'value' => 'STOCK_REPLENISHMENT',
                'label' => 'Stock Replenishment',
            ],
            [
                'value' => 'CUSTOMER_ORDER',
                'label' => 'Customer Order',
            ],
            [
                'value' => 'OFFICE_SUPPLY',
                'label' => 'Office Supply',
            ],
            [
                'value' => 'OTHER',
                'label' => 'Other',
            ],
        ];
    }
}
