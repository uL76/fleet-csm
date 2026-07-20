<?php

namespace App\Policies;

use App\Enums\MaterialRequestStatus;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestApproval;
use App\Models\User;
use App\Models\UserLevelPermission;

class MaterialRequestPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->userLevel?->level_code === 'super-admin') {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $this->hasPermission($user, 'can_view');
    }

    public function view(User $user, MaterialRequest $materialRequest): bool
    {
        return $this->hasPermission($user, 'can_view');
    }

    public function create(User $user): bool
    {
        return $this->hasPermission($user, 'can_create');
    }

    public function update(User $user, MaterialRequest $materialRequest): bool
    {
        return $this->hasPermission($user, 'can_edit')
            && $materialRequest->requested_by === $user->id
            && in_array($materialRequest->status, [
                MaterialRequestStatus::Draft,
                MaterialRequestStatus::Revision,
            ], true);
    }

    public function delete(User $user, MaterialRequest $materialRequest): bool
    {
        return $this->hasPermission($user, 'can_delete')
            && $materialRequest->requested_by === $user->id
            && $materialRequest->status === MaterialRequestStatus::Draft;
    }

    public function submit(User $user, MaterialRequest $materialRequest): bool
    {
        return $this->hasPermission($user, 'can_edit')
            && $materialRequest->requested_by === $user->id
            && in_array($materialRequest->status, [
                MaterialRequestStatus::Draft,
                MaterialRequestStatus::Revision,
            ], true);
    }

    public function review(User $user, MaterialRequest $materialRequest): bool
    {
        return $this->hasPermission($user, 'can_review')
            && $this->isAssignedCurrentApprover(
                $user,
                $materialRequest,
                'REVIEW'
            );
    }

    public function approve(User $user, MaterialRequest $materialRequest): bool
    {
        return $this->hasPermission($user, 'can_approve')
            && $this->isAssignedCurrentApprover(
                $user,
                $materialRequest,
                'APPROVE'
            );
    }

    public function requestRevision(
        User $user,
        MaterialRequest $materialRequest
    ): bool {
        return $this->isAssignedCurrentApprover($user, $materialRequest);
    }

    public function reject(User $user, MaterialRequest $materialRequest): bool
    {
        return $this->isAssignedCurrentApprover($user, $materialRequest);
    }

    private function hasPermission(User $user, string $column): bool
    {
        $allowedColumns = [
            'can_view',
            'can_create',
            'can_edit',
            'can_delete',
            'can_review',
            'can_approve',
            'can_export',
        ];

        if (! in_array($column, $allowedColumns, true)) {
            return false;
        }

        if (! $user->user_level_id) {
            return false;
        }

        return UserLevelPermission::query()
            ->where('user_level_id', $user->user_level_id)
            ->whereHas(
                'menu',
                fn ($query) => $query->where(
                    'menu_code',
                    'material-request'
                )
            )
            ->where($column, true)
            ->exists();
    }

    private function isAssignedCurrentApprover(
        User $user,
        MaterialRequest $materialRequest,
        ?string $actionType = null
    ): bool {
        if ($materialRequest->current_approval_sequence === null) {
            return false;
        }

        return MaterialRequestApproval::query()
            ->where('material_request_id', $materialRequest->id)
            ->where('sequence', $materialRequest->current_approval_sequence)
            ->where('assigned_user_id', $user->id)
            ->where('status', 'PENDING')
            ->when(
                $actionType,
                fn ($query) => $query->where('action_type', $actionType)
            )
            ->exists();
    }
}
