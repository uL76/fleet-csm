<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    protected $fillable = [
        'accurate_id',
        'po_number',
        'po_status',
        'vendor_no',
        'vendor_name',
        'mr_number',
        'pr_number',
        'invoice_number',
        'po_subject',
        'project_name',
        'asset_id',
        'revision_no',
        'is_closed',
        'trans_date',
        'subtotal_amount',
        'discount_amount',
        'tax_amount',
        'is_taxable',
        'is_inclusive_tax',
        'ship_date',
        'payment_term_name',
        'shipping_address',
        'total_amount',
        'accurate_raw',
        'last_sync_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_closed' => 'boolean',
        'is_taxable' => 'boolean',
        'is_inclusive_tax' => 'boolean',
        'trans_date' => 'date',
        'ship_date' => 'date',
        'subtotal_amount' => 'decimal:6',
        'discount_amount' => 'decimal:6',
        'tax_amount' => 'decimal:6',
        'total_amount' => 'decimal:6',
        'accurate_raw' => 'array',
        'last_sync_at' => 'datetime',
    ];

    public function details(): HasMany
    {
        return $this->hasMany(
            PurchaseOrderDetail::class
        );
    }

    public function scopeSearch(
        Builder $query,
        string $search
    ): Builder {
        if ($search === '') {
            return $query;
        }

        return $query->where(
            function (Builder $subQuery) use ($search) {
                $subQuery
                    ->where(
                        'po_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'vendor_no',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'vendor_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'mr_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'pr_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'project_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'asset_id',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'revision_no',
                        'like',
                        "%{$search}%"
                    );
            }
        );
    }
}
