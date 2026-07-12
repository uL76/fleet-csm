<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserLevelPermission extends Model
{
    protected $table = 'user_configs';

    protected $fillable = [
        'user_level_id',
        'menu_id',
        'can_view',
        'can_create',
        'can_edit',
        'can_delete',
        'can_review',
        'can_approve',
        'can_export',
    ];

    protected $casts = [
        'can_view' => 'boolean',
        'can_create' => 'boolean',
        'can_edit' => 'boolean',
        'can_delete' => 'boolean',
        'can_review' => 'boolean',
        'can_approve' => 'boolean',
        'can_export' => 'boolean',
    ];

    public function userLevel(): BelongsTo
    {
        return $this->belongsTo(UserLevel::class);
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }
}
