<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderDetail extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'accurate_detail_id',
        'accurate_po_id',
        'po_number',
        'pr_number',
        'mr_number',
        'item_no',
        'item_name',
        'item_description',
        'quantity',
        'unit_price',
        'discount_percent',
        'discount_amount',
        'line_total',
        'unit_name',
        'warehouse_accurate_id',
        'warehouse_name',
        'is_closed',
        'department_name',
        'project_name',
        'remarks',
        'trans_date',
        'accurate_raw',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:6',
        'discount_percent' => 'decimal:6',
        'discount_amount' => 'decimal:6',
        'line_total' => 'decimal:6',
        'is_closed' => 'boolean',
        'trans_date' => 'date',
        'accurate_raw' => 'array',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(
            PurchaseOrder::class
        );
    }
}
