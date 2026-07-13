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
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'accurate_raw' => 'array',
        'last_sync_at' => 'datetime',
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
