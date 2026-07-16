<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialRequestLog extends Model
{
    protected $fillable = [
        'material_request_id',
        'user_id',
        'action',
        'from_status',
        'to_status',
        'comments',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function materialRequest(): BelongsTo
    {
        return $this->belongsTo(
            MaterialRequest::class
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
