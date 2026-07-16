<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequisitionDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_requisition_id',
        'accurate_detail_id',
        'accurate_pr_id',
        'pr_number',
        'mr_number',
        'item_no',
        'item_name',
        'item_description',
        'quantity',
        'unit_name',
        'department_name',
        'project_name',
        'remarks',
        'trans_date',
        'required_date',
        'is_closed',
        'accurate_raw',
    ];

    protected $casts = [
        'accurate_detail_id' => 'integer',
        'accurate_pr_id' => 'integer',
        'quantity' => 'decimal:4',
        'trans_date' => 'date',
        'required_date' => 'date',
        'is_closed' => 'boolean',
        'accurate_raw' => 'array',
    ];

    public function purchaseRequisition(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequisition::class);
    }
}
