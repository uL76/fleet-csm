<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Warehouse extends Model
{
    protected $fillable = [
        'accurate_id',
        'accurate_location_id',
        'warehouse_name',
        'description',
        'street',
        'city',
        'province',
        'country',
        'zipcode',
        'pic',
        'is_damage_warehouse',
        'is_active',
        'accurate_raw',
        'last_sync_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_damage_warehouse' => 'boolean',
        'is_active' => 'boolean',
        'accurate_raw' => 'array',
        'last_sync_at' => 'datetime',
    ];

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

    public function scopeActive(
        Builder $query
    ): Builder {
        return $query->where('is_active', true);
    }

    public function scopeInactive(
        Builder $query
    ): Builder {
        return $query->where('is_active', false);
    }

    public function scopeDamage(
        Builder $query
    ): Builder {
        return $query->where(
            'is_damage_warehouse',
            true
        );
    }

    public function scopeNormal(
        Builder $query
    ): Builder {
        return $query->where(
            'is_damage_warehouse',
            false
        );
    }
}
