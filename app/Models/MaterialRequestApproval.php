<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialRequestApproval extends Model
{
    protected $fillable = [
        'material_request_id',
        'approval_route_id',
        'sequence',
        'action_type',
        'assigned_user_id',
        'action_by',
        'status',
        'comments',
        'acted_at',
    ];

    protected function casts(): array
    {
        return [
            'acted_at' => 'datetime',
        ];
    }

    public function materialRequest(): BelongsTo
    {
        return $this->belongsTo(
            MaterialRequest::class
        );
    }

    public function approvalRoute(): BelongsTo
    {
        return $this->belongsTo(
            DocumentApprovalRoute::class,
            'approval_route_id'
        );
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'assigned_user_id'
        );
    }

    public function actionUser(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'action_by'
        );
    }
}
