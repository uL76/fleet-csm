<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccurateSyncRun extends Model
{
    public const STATUS_PENDING = 'PENDING';

    public const STATUS_PROCESSING = 'PROCESSING';

    public const STATUS_COMPLETED = 'COMPLETED';

    public const STATUS_FAILED = 'FAILED';

    public const STATUS_CANCELLED = 'CANCELLED';

    protected $fillable = [
        'module',
        'sync_type',
        'status',
        'current_page',
        'total_pages',
        'page_size',
        'total_items',
        'processed_items',
        'inserted_items',
        'updated_items',
        'skipped_items',
        'failed_items',
        'inactivated_items',
        'error_message',
        'started_at',
        'finished_at',
        'created_by',
    ];

    protected $casts = [
        'current_page' => 'integer',
        'total_pages' => 'integer',
        'page_size' => 'integer',
        'total_items' => 'integer',
        'processed_items' => 'integer',
        'inserted_items' => 'integer',
        'updated_items' => 'integer',
        'skipped_items' => 'integer',
        'failed_items' => 'integer',
        'inactivated_items' => 'integer',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function getProgressPercentageAttribute(): int
    {
        if ($this->total_items > 0) {
            return min(
                100,
                (int) round(
                    ($this->processed_items / $this->total_items) * 100
                )
            );
        }

        if ($this->total_pages > 0) {
            return min(
                100,
                (int) round(
                    ($this->current_page / $this->total_pages) * 100
                )
            );
        }

        return 0;
    }

    public function isFinished(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_COMPLETED,
                self::STATUS_FAILED,
                self::STATUS_CANCELLED,
            ],
            true
        );
    }
}
