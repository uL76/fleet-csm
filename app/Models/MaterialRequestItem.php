<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialRequestItem extends Model
{
    protected $fillable = [
        'material_request_id',
        'item_master_id',
        'item_code',
        'part_number',
        'description',
        'brand',
        'uom',
        'quantity',
        'available_stock',
        'required_date',
        'suggested_vendor',
        'estimated_price',
        'lead_time_days',
        'remarks',
        'process_status',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'available_stock' => 'decimal:2',
            'estimated_price' => 'decimal:2',
            'required_date' => 'date',
        ];
    }

    public function materialRequest(): BelongsTo
    {
        return $this->belongsTo(
            MaterialRequest::class
        );
    }

    public function itemMaster(): BelongsTo
    {
        return $this->belongsTo(
            ItemMaster::class
        );
    }
}
