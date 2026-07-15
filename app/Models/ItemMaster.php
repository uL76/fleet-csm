<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class ItemMaster extends Model
{
    protected $fillable = [
        'accurate_id',
        'item_code',
        'part_number',
        'item_description',
        'unit_name',
        'is_active',
        'accurate_raw',
        'sync_error',
        'last_sync_at',
        'last_seen_sync_id',
        'last_seen_at',
        'created_by',
        'updated_by',
        'category_name',
        'item_type',
        'brand_name',
        'preferred_vendor',
        'minimum_stock',
        'total_stock',
        'excel_inactive',
        'length_cm',
        'width_cm',
        'height_cm',
        'weight_gram',
        'cross_reference_part_no',
        'equipment_type',
        'compatible_equipment_model',
        'specification',
        'bin_location_bpn',
        'bin_location_jkt',
        'class_movement',
        'reorder_quantity',
        'maximum_quantity',
        'excel_imported_at',
        'excel_imported_by',
        'excel_source_file',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'accurate_raw' => 'array',
        'last_sync_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'minimum_stock' => 'decimal:4',
        'total_stock' => 'decimal:4',
        'excel_inactive' => 'boolean',
        'length_cm' => 'decimal:4',
        'width_cm' => 'decimal:4',
        'height_cm' => 'decimal:4',
        'weight_gram' => 'decimal:4',
        'reorder_quantity' => 'decimal:4',
        'maximum_quantity' => 'decimal:4',
        'excel_imported_at' => 'datetime',
    ];

    public function scopeActive(
        Builder $query
    ): Builder {
        return $query->where(
            'is_active',
            true
        );
    }

    public function scopeInactive(
        Builder $query
    ): Builder {
        return $query->where(
            'is_active',
            false
        );
    }
}
