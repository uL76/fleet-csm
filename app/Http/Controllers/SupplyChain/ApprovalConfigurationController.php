<?php

namespace App\Http\Controllers\SupplyChain;

use App\Http\Controllers\Controller;
use App\Http\Requests\SupplyChain\ApprovalMatrixRequest;
use App\Models\Department;
use App\Models\DocumentApprovalRoute;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalConfigurationController extends Controller
{
    public function index(Request $request): Response
    {
        $documentType = strtoupper(
            trim((string) $request->input('document_type', 'MR'))
        );

        if (! in_array($documentType, ['MR', 'PR', 'PO'], true)) {
            $documentType = 'MR';
        }

        $search = trim((string) $request->input('search', ''));

        $departments = Department::query()
            ->when(
                $search,
                fn ($query, $value) => $query->where(
                    'department_name',
                    'like',
                    "%{$value}%"
                )
            )
            ->orderBy('department_name')
            ->get(['id', 'department_name']);

        $routes = DocumentApprovalRoute::query()
            ->with('user:id,name,email')
            ->where('document_type', $documentType)
            ->whereIn('department_id', $departments->pluck('id'))
            ->orderBy('department_id')
            ->orderBy('sequence')
            ->orderBy('user_id')
            ->get();

        $routesByDepartment = $routes->groupBy('department_id');

        $cards = $departments->map(function (Department $department) use (
            $routesByDepartment
        ): array {
            $departmentRoutes = $routesByDepartment->get(
                $department->id,
                collect()
            );

            $steps = $departmentRoutes
                ->groupBy('sequence')
                ->map(function ($rows, $sequence): array {
                    $first = $rows->first();

                    return [
                        'sequence' => (int) $sequence,
                        'action_type' => $first->action_type,
                        'is_required' => (bool) $first->is_required,
                        'is_active' => (bool) $first->is_active,
                        'users' => $rows->map(fn ($route) => [
                            'route_id' => $route->id,
                            'user_id' => $route->user_id,
                            'name' => $route->user?->name,
                            'email' => $route->user?->email,
                        ])->values(),
                    ];
                })
                ->sortBy('sequence')
                ->values();

            return [
                'department_id' => $department->id,
                'department_name' => $department->department_name,
                'steps' => $steps,
            ];
        });

        return Inertia::render(
            'supply-chain/approval-configuration/Index',
            [
                'documentType' => $documentType,
                'search' => $search,
                'cards' => $cards,
                'users' => User::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'email']),
                'documentTypes' => [
                    ['value' => 'MR', 'label' => 'Material Request'],
                    ['value' => 'PR', 'label' => 'Purchase Requisition'],
                    ['value' => 'PO', 'label' => 'Purchase Order'],
                ],
            ]
        );
    }

    public function syncDepartment(
        ApprovalMatrixRequest $request,
        Department $department
    ): RedirectResponse {
        $data = $request->validated();

        DB::transaction(function () use ($data, $department): void {
            DocumentApprovalRoute::query()
                ->where('document_type', $data['document_type'])
                ->where('department_id', $department->id)
                ->delete();

            foreach ($data['steps'] as $step) {
                foreach ($step['user_ids'] as $userId) {
                    DocumentApprovalRoute::query()->create([
                        'document_type' => $data['document_type'],
                        'department_id' => $department->id,
                        'sequence' => $step['sequence'],
                        'action_type' => $step['action_type'],
                        'user_id' => $userId,
                        'is_required' => $step['is_required'],
                        'is_active' => $step['is_active'],
                    ]);
                }
            }
        });

        return back()->with(
            'success',
            "Approval matrix {$department->department_name} berhasil disimpan."
        );
    }

    public function copyFromDepartment(
        Request $request,
        Department $department
    ): RedirectResponse {
        $validated = $request->validate([
            'document_type' => ['required', 'in:MR,PR,PO'],
            'source_department_id' => [
                'required',
                'integer',
                'exists:departments,id',
                'different:department_id',
            ],
        ]);

        $sourceDepartmentId = (int) $validated['source_department_id'];
        $documentType = $validated['document_type'];

        $sourceRoutes = DocumentApprovalRoute::query()
            ->where('document_type', $documentType)
            ->where('department_id', $sourceDepartmentId)
            ->orderBy('sequence')
            ->get();

        if ($sourceRoutes->isEmpty()) {
            return back()->with(
                'error',
                'Department sumber belum memiliki approval matrix.'
            );
        }

        DB::transaction(function () use (
            $department,
            $documentType,
            $sourceRoutes
        ): void {
            DocumentApprovalRoute::query()
                ->where('document_type', $documentType)
                ->where('department_id', $department->id)
                ->delete();

            foreach ($sourceRoutes as $route) {
                DocumentApprovalRoute::query()->create([
                    'document_type' => $documentType,
                    'department_id' => $department->id,
                    'sequence' => $route->sequence,
                    'action_type' => $route->action_type,
                    'user_id' => $route->user_id,
                    'is_required' => $route->is_required,
                    'is_active' => $route->is_active,
                ]);
            }
        });

        return back()->with(
            'success',
            "Approval matrix berhasil disalin ke {$department->department_name}."
        );
    }
}
