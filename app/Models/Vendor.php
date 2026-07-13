<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    protected $fillable = [
        'accurate_id',
        'vendor_no',
        'vendor_name',
        'category_name',
        'email',
        'phone',
        'mobile_phone',
        'fax',
        'website',
        'npwp_no',
        'contact_name',
        'address',
        'street',
        'city',
        'province',
        'country',
        'zipcode',
        'notes',
        'is_active',
        'accurate_raw',
        'last_sync_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'accurate_id' => 'integer',
        'is_active' => 'boolean',
        'accurate_raw' => 'array',
        'last_sync_at' => 'datetime',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }
}
