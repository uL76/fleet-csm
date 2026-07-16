<?php

namespace App\Policies;

use App\Enums\MaterialRequestStatus;
use App\Models\MaterialRequest;
use App\Models\User;

class MaterialRequestPolicy
{
    public function before(
        User $user,
        string $ability
    ): ?bool {
        if (
            $user->userLevel?->level_code
            === 'super-admin'
        ) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $this->hasMenuPermission(
            $user,
            'material-request',
            'can_view'
        );
    }

    public function view(
        User $user,
        MaterialRequest $materialRequest
    ): bool {
        return $this->hasMenuPermission(
            $user,
            'material-request',
            'can_view'
        );
    }

    public function create(User $user): bool
    {
        return $this->hasMenuPermission(
            $user,
            'material-request',
            'can_create'
        );
    }

    public function update(
        User $user,
        MaterialRequest $materialRequest
    ): bool {
        return $this->hasMenuPermission(
            $user,
            'material-request',
            'can_edit'
        )
            && in_array(
                $materialRequest->status,
                [
                    MaterialRequestStatus::Draft,
                    MaterialRequestStatus::Revision,
                ],
                true
            )
            && $materialRequest->requested_by
                === $user->id;
    }

    public function delete(
        User $user,
        MaterialRequest $materialRequest
    ): bool {
        return $this->hasMenuPermission(
            $user,
            'material-request',
            'can_delete'
        )
            && $materialRequest->status
                === MaterialRequestStatus::Draft
            && $materialRequest->requested_by
                === $user->id;
    }

    public function submit(
        User $user,
        MaterialRequest $materialRequest
    ): bool {
        return $this->hasMenuPermission(
            $user,
            'material-request',
            'can_edit'
        )
            && in_array(
                $materialRequest->status,
                [
                    MaterialRequestStatus::Draft,
                    MaterialRequestStatus::Revision,
                ],
                true
            )
            && $materialRequest->requested_by
                === $user->id;
    }

    private function hasMenuPermission(
        User $user,
        string $menuCode,
        string $permissionColumn
    ): bool {
        return $user->userLevel
            ?->permissions()
            ->whereHas(
                'menu',
                fn ($query) => $query->where(
                    'menu_code',
                    $menuCode
                )
            )
            ->where(
                $permissionColumn,
                true
            )
            ->exists() ?? false;
    }
}
