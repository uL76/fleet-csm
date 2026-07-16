<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseRequisition extends Model
{
    use HasFactory;

    protected $fillable = [
        'accurate_id',
        'pr_number',
        'pr_status',
        'mr_number',
        'trans_date',
        'required_date',
        'requester_name',
        'department_name',
        'project_name',
        'asset_id',
        'revision_no',
        'description',
        'is_closed',
        'accurate_raw',
        'last_sync_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'accurate_id' => 'integer',
        'trans_date' => 'date',
        'required_date' => 'date',
        'is_closed' => 'boolean',
        'accurate_raw' => 'array',
        'last_sync_at' => 'datetime',
    ];

    public function details(): HasMany
    {
        return $this->hasMany(PurchaseRequisitionDetail::class);
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        $search = trim((string) $search);

        if ($search === '') {
            return $query;
        }

        return $query->where(function (Builder $subQuery) use ($search): void {
            $subQuery
                ->where('pr_number', 'like', "%{$search}%")
                ->orWhere('mr_number', 'like', "%{$search}%")
                ->orWhere('pr_status', 'like', "%{$search}%")
                ->orWhere('requester_name', 'like', "%{$search}%")
                ->orWhere('department_name', 'like', "%{$search}%")
                ->orWhere('project_name', 'like', "%{$search}%")
                ->orWhere('asset_id', 'like', "%{$search}%")
                ->orWhere('revision_no', 'like', "%{$search}%");
        });
    }
}
