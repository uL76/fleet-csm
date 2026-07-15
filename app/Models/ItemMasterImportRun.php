<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemMasterImportRun extends Model
{
    public const STATUS_PENDING = 'PENDING';

    public const STATUS_PROCESSING = 'PROCESSING';

    public const STATUS_COMPLETED = 'COMPLETED';

    public const STATUS_FAILED = 'FAILED';

    protected $fillable = [
        'status',
        'original_filename',
        'stored_path',
        'file_size',
        'total_rows',
        'processed_rows',
        'updated_rows',
        'unmatched_rows',
        'skipped_rows',
        'failed_rows',
        'error_samples',
        'error_message',
        'started_at',
        'finished_at',
        'created_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'total_rows' => 'integer',
        'processed_rows' => 'integer',
        'updated_rows' => 'integer',
        'unmatched_rows' => 'integer',
        'skipped_rows' => 'integer',
        'failed_rows' => 'integer',
        'error_samples' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    protected $appends = [
        'progress_percentage',
    ];

    public function getProgressPercentageAttribute(): int
    {
        if ($this->status === self::STATUS_COMPLETED) {
            return 100;
        }

        if ($this->total_rows <= 0) {
            return 0;
        }

        return min(
            100,
            max(
                0,
                (int) round(
                    ($this->processed_rows / $this->total_rows) * 100
                )
            )
        );
    }
}
