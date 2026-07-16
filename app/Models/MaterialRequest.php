<?php

namespace App\Models;

use App\Enums\MaterialRequestStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MaterialRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'mr_number',
        'mr_date',
        'requested_by',
        'department_id',
        'company_id',
        'branch',
        'priority',
        'required_date',
        'request_type',
        'customer_name',
        'sales_order_no',
        'reference_rfq',
        'subject',
        'remarks',
        'status',
        'current_approval_sequence',
        'submitted_at',
        'reviewed_at',
        'approved_at',
        'rejected_at',
        'closed_at',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => MaterialRequestStatus::class,

            'mr_date' => 'date',
            'required_date' => 'date',

            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'requested_by'
        );
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(
            Department::class
        );
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(
            Company::class
        );
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'updated_by'
        );
    }

    public function items(): HasMany
    {
        return $this->hasMany(
            MaterialRequestItem::class
        );
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(
            MaterialRequestApproval::class
        )->orderBy('sequence');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(
            MaterialRequestLog::class
        )->latest();
    }
}
