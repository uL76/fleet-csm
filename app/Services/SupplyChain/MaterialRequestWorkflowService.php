<?php

namespace App\Services\SupplyChain;

use App\Enums\MaterialRequestStatus;
use App\Models\DocumentApprovalRoute;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestApproval;
use App\Models\MaterialRequestLog;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MaterialRequestWorkflowService
{
    public function submit(MaterialRequest $materialRequest, User $user): MaterialRequest
    {
        return DB::transaction(function () use ($materialRequest, $user): MaterialRequest {
            $mr = MaterialRequest::query()
                ->withCount('items')
                ->lockForUpdate()
                ->findOrFail($materialRequest->id);

            if (! in_array($mr->status, [
                MaterialRequestStatus::Draft,
                MaterialRequestStatus::Revision,
            ], true)) {
                throw ValidationException::withMessages([
                    'workflow' => 'MR hanya dapat disubmit dari status DRAFT atau REVISION.',
                ]);
            }

            if ($mr->requested_by !== $user->id) {
                throw ValidationException::withMessages([
                    'workflow' => 'Hanya pembuat MR yang dapat melakukan submit.',
                ]);
            }

            if ($mr->items_count < 1) {
                throw ValidationException::withMessages([
                    'workflow' => 'MR harus memiliki minimal satu item.',
                ]);
            }

            $routes = DocumentApprovalRoute::query()
                ->where('document_type', 'MR')
                ->where('department_id', $mr->department_id)
                ->where('is_active', true)
                ->orderBy('sequence')
                ->orderBy('user_id')
                ->get();

            $this->validateRouteMatrix($routes);

            MaterialRequestApproval::query()
                ->where('material_request_id', $mr->id)
                ->delete();

            foreach ($routes as $route) {
                MaterialRequestApproval::query()->create([
                    'material_request_id' => $mr->id,
                    'sequence' => $route->sequence,
                    'action_type' => $route->action_type,
                    'assigned_user_id' => $route->user_id,
                    'action_user_id' => null,
                    'status' => 'PENDING',
                    'comments' => null,
                    'acted_at' => null,
                ]);
            }

            $firstSequence = (int) $routes->min('sequence');
            $fromStatus = $mr->status->value;

            $mr->update([
                'status' => MaterialRequestStatus::Submitted,
                'current_approval_sequence' => $firstSequence,
                'submitted_at' => now(),
                'reviewed_at' => null,
                'approved_at' => null,
                'rejected_at' => null,
                'updated_by' => $user->id,
            ]);

            $this->log(
                $mr->id,
                $user->id,
                'SUBMITTED',
                $fromStatus,
                MaterialRequestStatus::Submitted->value,
                null,
                [
                    'first_sequence' => $firstSequence,
                    'approval_rows' => $routes->count(),
                    'step_count' => $routes->pluck('sequence')->unique()->count(),
                ]
            );

            return $mr->refresh();
        });
    }

    public function review(
        MaterialRequest $materialRequest,
        User $user,
        ?string $comments = null
    ): MaterialRequest {
        return $this->completeCurrentStep(
            $materialRequest,
            $user,
            'REVIEW',
            $comments
        );
    }

    public function approve(
        MaterialRequest $materialRequest,
        User $user,
        ?string $comments = null
    ): MaterialRequest {
        return $this->completeCurrentStep(
            $materialRequest,
            $user,
            'APPROVE',
            $comments
        );
    }

    public function requestRevision(
        MaterialRequest $materialRequest,
        User $user,
        string $comments
    ): MaterialRequest {
        return $this->stopCurrentStep(
            $materialRequest,
            $user,
            'REVISION',
            MaterialRequestStatus::Revision,
            'REVISION_REQUESTED',
            $comments
        );
    }

    public function reject(
        MaterialRequest $materialRequest,
        User $user,
        string $comments
    ): MaterialRequest {
        return $this->stopCurrentStep(
            $materialRequest,
            $user,
            'REJECTED',
            MaterialRequestStatus::Rejected,
            'REJECTED',
            $comments
        );
    }

    private function completeCurrentStep(
        MaterialRequest $materialRequest,
        User $user,
        string $expectedAction,
        ?string $comments
    ): MaterialRequest {
        return DB::transaction(function () use (
            $materialRequest,
            $user,
            $expectedAction,
            $comments
        ): MaterialRequest {
            $mr = MaterialRequest::query()
                ->lockForUpdate()
                ->findOrFail($materialRequest->id);

            $currentRows = $this->currentStepRows($mr);
            $actingRow = $this->assignedRow(
                $currentRows,
                $user,
                $expectedAction
            );

            $fromStatus = $mr->status->value;

            $actingRow->update([
                'status' => 'APPROVED',
                'action_user_id' => $user->id,
                'comments' => $comments,
                'acted_at' => now(),
            ]);

            MaterialRequestApproval::query()
                ->where('material_request_id', $mr->id)
                ->where('sequence', $mr->current_approval_sequence)
                ->where('id', '!=', $actingRow->id)
                ->where('status', 'PENDING')
                ->update([
                    'status' => 'SKIPPED',
                ]);

            if ($expectedAction === 'REVIEW') {
                $mr->reviewed_at = now();
            }

            $nextSequence = MaterialRequestApproval::query()
                ->where('material_request_id', $mr->id)
                ->where('sequence', '>', $actingRow->sequence)
                ->min('sequence');

            if ($nextSequence !== null) {
                $nextAction = MaterialRequestApproval::query()
                    ->where('material_request_id', $mr->id)
                    ->where('sequence', $nextSequence)
                    ->value('action_type');

                $mr->status = $nextAction === 'APPROVE'
                    ? MaterialRequestStatus::Reviewed
                    : MaterialRequestStatus::InReview;
                $mr->current_approval_sequence = (int) $nextSequence;
            } else {
                $mr->status = MaterialRequestStatus::Approved;
                $mr->current_approval_sequence = null;
                $mr->approved_at = now();
            }

            $mr->updated_by = $user->id;
            $mr->save();

            $this->log(
                $mr->id,
                $user->id,
                $expectedAction === 'REVIEW' ? 'REVIEWED' : 'APPROVED',
                $fromStatus,
                $mr->status->value,
                $comments,
                [
                    'sequence' => $actingRow->sequence,
                    'acted_by' => $user->id,
                    'completion_rule' => 'ANY',
                    'next_sequence' => $nextSequence,
                ]
            );

            return $mr->refresh();
        });
    }

    private function stopCurrentStep(
        MaterialRequest $materialRequest,
        User $user,
        string $rowStatus,
        MaterialRequestStatus $targetStatus,
        string $logAction,
        string $comments
    ): MaterialRequest {
        return DB::transaction(function () use (
            $materialRequest,
            $user,
            $rowStatus,
            $targetStatus,
            $logAction,
            $comments
        ): MaterialRequest {
            $comments = trim($comments);

            if ($comments === '') {
                throw ValidationException::withMessages([
                    'comments' => 'Komentar wajib diisi.',
                ]);
            }

            $mr = MaterialRequest::query()
                ->lockForUpdate()
                ->findOrFail($materialRequest->id);

            $currentRows = $this->currentStepRows($mr);
            $actingRow = $this->assignedRow($currentRows, $user);
            $fromStatus = $mr->status->value;

            $actingRow->update([
                'status' => $rowStatus,
                'action_user_id' => $user->id,
                'comments' => $comments,
                'acted_at' => now(),
            ]);

            MaterialRequestApproval::query()
                ->where('material_request_id', $mr->id)
                ->where('sequence', $mr->current_approval_sequence)
                ->where('id', '!=', $actingRow->id)
                ->where('status', 'PENDING')
                ->update(['status' => 'SKIPPED']);

            $update = [
                'status' => $targetStatus,
                'current_approval_sequence' => null,
                'updated_by' => $user->id,
            ];

            if ($targetStatus === MaterialRequestStatus::Rejected) {
                $update['rejected_at'] = now();
            }

            $mr->update($update);

            $this->log(
                $mr->id,
                $user->id,
                $logAction,
                $fromStatus,
                $targetStatus->value,
                $comments,
                [
                    'sequence' => $actingRow->sequence,
                    'acted_by' => $user->id,
                ]
            );

            return $mr->refresh();
        });
    }

    private function currentStepRows(MaterialRequest $mr): Collection
    {
        if ($mr->current_approval_sequence === null) {
            throw ValidationException::withMessages([
                'workflow' => 'MR tidak memiliki approval step aktif.',
            ]);
        }

        $rows = MaterialRequestApproval::query()
            ->where('material_request_id', $mr->id)
            ->where('sequence', $mr->current_approval_sequence)
            ->where('status', 'PENDING')
            ->lockForUpdate()
            ->get();

        if ($rows->isEmpty()) {
            throw ValidationException::withMessages([
                'workflow' => 'Approval step aktif tidak ditemukan atau sudah diproses.',
            ]);
        }

        return $rows;
    }

    private function assignedRow(
        Collection $rows,
        User $user,
        ?string $expectedAction = null
    ): MaterialRequestApproval {
        $row = $rows->first(
            fn (MaterialRequestApproval $approval) =>
                $approval->assigned_user_id === $user->id
                && (
                    $expectedAction === null
                    || $approval->action_type === $expectedAction
                )
        );

        if (! $row) {
            throw ValidationException::withMessages([
                'workflow' => 'Anda bukan user yang ditugaskan pada approval step aktif.',
            ]);
        }

        return $row;
    }

    private function validateRouteMatrix(Collection $routes): void
    {
        if ($routes->isEmpty()) {
            throw ValidationException::withMessages([
                'workflow' => 'Approval matrix MR untuk department ini belum tersedia.',
            ]);
        }

        $steps = $routes->groupBy('sequence')->sortKeys();

        foreach ($steps as $sequence => $rows) {
            if ($rows->pluck('action_type')->unique()->count() !== 1) {
                throw ValidationException::withMessages([
                    'workflow' => "Sequence {$sequence} memiliki action type yang tidak konsisten.",
                ]);
            }
        }

        $firstAction = $steps->first()->first()->action_type;
        if ($firstAction !== 'REVIEW') {
            throw ValidationException::withMessages([
                'workflow' => 'Approval step pertama MR wajib REVIEW.',
            ]);
        }
    }

    private function log(
        int $materialRequestId,
        int $userId,
        string $action,
        ?string $fromStatus,
        ?string $toStatus,
        ?string $comments = null,
        ?array $metadata = null
    ): void {
        MaterialRequestLog::query()->create([
            'material_request_id' => $materialRequestId,
            'user_id' => $userId,
            'action' => $action,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'comments' => $comments,
            'metadata' => $metadata,
        ]);
    }
}
