<?php

namespace App\Services\SupplyChain;

use App\Models\DocumentApprovalRoute;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestApproval;
use App\Models\MaterialRequestLog;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ApprovalWorkflowService
{
    public function initialize(MaterialRequest $materialRequest): void
    {
        DB::transaction(function () use ($materialRequest): void {
            $routes = DocumentApprovalRoute::query()
                ->where('document_type', 'MR')
                ->where(
                    'department_id',
                    $materialRequest->department_id
                )
                ->where('is_active', true)
                ->orderBy('sequence')
                ->get();

            if ($routes->isEmpty()) {
                throw new RuntimeException(
                    'Routing approval MR untuk department ini belum dikonfigurasi.'
                );
            }

            $materialRequest->approvals()->delete();

            foreach ($routes as $route) {
                $materialRequest->approvals()->create([
                    'approval_route_id' => $route->id,
                    'sequence' => $route->sequence,
                    'action_type' => $route->action_type,
                    'assigned_user_id' => $route->user_id,
                    'status' => 'PENDING',
                ]);
            }

            $firstRoute = $routes->first();

            $oldStatus = $materialRequest->status;

            $materialRequest->update([
                'status' => 'SUBMITTED',
                'current_approval_sequence' => $firstRoute->sequence,
                'submitted_at' => now(),
            ]);

            $this->log(
                $materialRequest,
                'SUBMITTED',
                $oldStatus,
                'SUBMITTED'
            );
        });
    }

    public function currentApproval(
        MaterialRequest $materialRequest
    ): ?MaterialRequestApproval {
        return $materialRequest->approvals()
            ->where('status', 'PENDING')
            ->orderBy('sequence')
            ->first();
    }

    public function ensureUserCanAct(
        MaterialRequest $materialRequest,
        User $user,
        string $expectedAction
    ): MaterialRequestApproval {
        $approval = $this->currentApproval(
            $materialRequest
        );

        if (! $approval) {
            throw new AuthorizationException(
                'Tidak ada approval yang sedang menunggu.'
            );
        }

        if ($approval->assigned_user_id !== $user->id) {
            throw new AuthorizationException(
                'Anda bukan user yang ditugaskan untuk tahap approval ini.'
            );
        }

        if ($approval->action_type !== $expectedAction) {
            throw new AuthorizationException(
                'Aksi tidak sesuai dengan tahap workflow saat ini.'
            );
        }

        return $approval;
    }

    private function log(
        MaterialRequest $materialRequest,
        string $action,
        ?string $fromStatus,
        ?string $toStatus,
        ?string $comments = null
    ): void {
        MaterialRequestLog::create([
            'material_request_id' => $materialRequest->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'comments' => $comments,
        ]);
    }
}
