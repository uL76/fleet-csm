<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
