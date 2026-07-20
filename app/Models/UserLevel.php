<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserLevel extends Model
{
    protected $fillable = [
        'level_code',
        'level_name',
        'level_order',
        'description',
        'is_active',
    ];

    protected $casts = [
        'level_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function permissions(): HasMany
    {
        return $this->hasMany(
            UserLevelPermission::class,
            'user_level_id'
        );
    }
}
