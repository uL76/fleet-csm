<?php

namespace App\Jobs\Accurate;

use App\Models\AccurateSyncRun;
use App\Services\Accurate\ItemMasterSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Throwable;

class SyncItemMasterPageJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $timeout = 300;

    public int $maxExceptions = 3;

    public function __construct(
        public readonly int $syncRunId
    ) {}

    public function middleware(): array
    {
        return [
            (new WithoutOverlapping(
                'item-master-sync-'.$this->syncRunId
            ))
                ->expireAfter(360)
                ->dontRelease(),
        ];
    }

    public function backoff(): array
    {
        return [
            10,
            30,
            60,
        ];
    }

    public function handle(
        ItemMasterSyncService $syncService
    ): void {
        $syncRun = AccurateSyncRun::query()
            ->findOrFail(
                $this->syncRunId
            );

        if (
            $syncRun->status
            === AccurateSyncRun::STATUS_COMPLETED
        ) {
            return;
        }

        if (
            $syncRun->status
            === AccurateSyncRun::STATUS_CANCELLED
        ) {
            return;
        }

        $nextPage =
            $syncRun->current_page + 1;

        $syncRun->update([
            'status' => AccurateSyncRun::STATUS_PROCESSING,

            'started_at' => $syncRun->started_at ?? now(),

            'error_message' => null,
        ]);

        try {
            $result = $syncService->syncPage(
                $syncRun,
                $nextPage
            );

            /*
             * Refresh untuk mencegah update menggunakan nilai lama.
             */
            $syncRun->refresh();

            $syncRun->update([
                'status' => AccurateSyncRun::STATUS_PROCESSING,

                'current_page' => $result['page'],

                'total_pages' => $result['total_pages'],

                'total_items' => $result['total_items'],

                'processed_items' => $syncRun->processed_items
                    + $result['processed'],

                'inserted_items' => $syncRun->inserted_items
                    + $result['inserted'],

                'updated_items' => $syncRun->updated_items
                    + $result['updated'],

                'skipped_items' => $syncRun->skipped_items
                    + $result['skipped'],

                'error_message' => null,
            ]);

            if (
                $result['page']
                < $result['total_pages']
            ) {
                self::dispatch(
                    $syncRun->id
                );

                return;
            }

            $inactivated =
                $syncService->finishSync(
                    $syncRun
                );

            $syncRun->update([
                'status' => AccurateSyncRun::STATUS_COMPLETED,

                'inactivated_items' => $inactivated,

                'processed_items' => max(
                    $syncRun->processed_items,
                    $result['total_items']
                ),

                'finished_at' => now(),
                'error_message' => null,
            ]);
        } catch (Throwable $exception) {
            report($exception);

            $syncRun->refresh();

            $syncRun->update([
                'status' => AccurateSyncRun::STATUS_FAILED,

                'failed_items' => $syncRun->failed_items + 1,

                'error_message' => mb_substr(
                    $exception->getMessage(),
                    0,
                    5000
                ),
            ]);

            throw $exception;
        }
    }

    public function failed(
        ?Throwable $exception
    ): void {
        $syncRun = AccurateSyncRun::query()
            ->find(
                $this->syncRunId
            );

        if (! $syncRun) {
            return;
        }

        $syncRun->update([
            'status' => AccurateSyncRun::STATUS_FAILED,

            'error_message' => mb_substr(
                $exception?->getMessage()
                    ?? 'Queue Item Master gagal.',
                0,
                5000
            ),
        ]);
    }
}
