<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Jobs\Accurate\SyncItemMasterPageJob;
use App\Models\AccurateSyncRun;
use App\Models\ItemMaster;
use App\Models\ItemMasterImportRun;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ItemMasterController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = trim((string) $request->input('status', ''));
        $partNumber = trim((string) $request->input('part_number', ''));
        $perPage = (int) $request->input('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $items = ItemMaster::query()
            ->when(
                $search !== '',
                function (Builder $query) use ($search): void {
                    $query->where(
                        function (Builder $subQuery) use ($search): void {
                            $subQuery
                                ->where('item_code', 'like', "%{$search}%")
                                ->orWhere('part_number', 'like', "%{$search}%")
                                ->orWhere('item_description', 'like', "%{$search}%")
                                ->orWhere('unit_name', 'like', "%{$search}%")
                                ->orWhere('accurate_id', 'like', "%{$search}%")
                                ->orWhere('category_name', 'like', "%{$search}%")
                                ->orWhere('brand_name', 'like', "%{$search}%")
                                ->orWhere('preferred_vendor', 'like', "%{$search}%")
                                ->orWhere('cross_reference_part_no', 'like', "%{$search}%")
                                ->orWhere('equipment_type', 'like', "%{$search}%")
                                ->orWhere('compatible_equipment_model', 'like', "%{$search}%")
                                ->orWhere('bin_location_jkt', 'like', "%{$search}%")
                                ->orWhere('bin_location_bpn', 'like', "%{$search}%");
                        }
                    );
                }
            )
            ->when(
                $status === 'active',
                fn (Builder $query): Builder => $query->where('is_active', true)
            )
            ->when(
                $status === 'inactive',
                fn (Builder $query): Builder => $query->where('is_active', false)
            )
            ->when(
                $partNumber === 'with',
                function (Builder $query): void {
                    $query
                        ->whereNotNull('part_number')
                        ->where('part_number', '<>', '');
                }
            )
            ->when(
                $partNumber === 'without',
                function (Builder $query): void {
                    $query->where(
                        function (Builder $subQuery): void {
                            $subQuery
                                ->whereNull('part_number')
                                ->orWhere('part_number', '');
                        }
                    );
                }
            )
            ->orderBy('item_code')
            ->paginate($perPage)
            ->withQueryString();

        $summary = [
            'total' => ItemMaster::query()->count(),
            'active' => ItemMaster::query()
                ->where('is_active', true)
                ->count(),
            'inactive' => ItemMaster::query()
                ->where('is_active', false)
                ->count(),
            'with_part_number' => ItemMaster::query()
                ->whereNotNull('part_number')
                ->where('part_number', '<>', '')
                ->count(),
            'without_part_number' => ItemMaster::query()
                ->where(
                    function (Builder $query): void {
                        $query
                            ->whereNull('part_number')
                            ->orWhere('part_number', '');
                    }
                )
                ->count(),
        ];

        $lastSyncAt = ItemMaster::query()->max('last_sync_at');
        $lastExcelImportAt = ItemMaster::query()->max('excel_imported_at');

        $latestSyncRun = AccurateSyncRun::query()
            ->where('module', 'item_master')
            ->where('sync_type', 'list')
            ->latest('id')
            ->first();

        $latestImportRun = ItemMasterImportRun::query()
            ->latest('id')
            ->first();

        return Inertia::render(
            'warehouse/item-master/Index',
            [
                'items' => $items,
                'summary' => $summary,
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'part_number' => $partNumber,
                    'per_page' => $perPage,
                ],
                'lastSyncAt' => $lastSyncAt,
                'lastExcelImportAt' => $lastExcelImportAt,
                'latestSyncRun' => $latestSyncRun
                    ? $this->syncRunPayload($latestSyncRun)
                    : null,
                'latestImportRun' => $latestImportRun
                    ? $this->importRunPayload($latestImportRun)
                    : null,
            ]
        );
    }

    public function startSync(Request $request): JsonResponse
    {
        $runningSync = AccurateSyncRun::query()
            ->where('module', 'item_master')
            ->where('sync_type', 'list')
            ->whereIn(
                'status',
                [
                    AccurateSyncRun::STATUS_PENDING,
                    AccurateSyncRun::STATUS_PROCESSING,
                ]
            )
            ->latest('id')
            ->first();

        if ($runningSync) {
            return response()->json(
                [
                    'status' => 'already_running',
                    'message' => 'Sinkronisasi Item Master masih berjalan.',
                    'sync_run' => $this->syncRunPayload($runningSync),
                ],
                409
            );
        }

        $user = $request->user('web');

        $syncRun = AccurateSyncRun::query()->create([
            'module' => 'item_master',
            'sync_type' => 'list',
            'status' => AccurateSyncRun::STATUS_PENDING,
            'current_page' => 0,
            'total_pages' => 0,
            'page_size' => 100,
            'total_items' => 0,
            'processed_items' => 0,
            'inserted_items' => 0,
            'updated_items' => 0,
            'skipped_items' => 0,
            'failed_items' => 0,
            'inactivated_items' => 0,
            'error_message' => null,
            'started_at' => null,
            'finished_at' => null,
            'created_by' => $user?->id,
        ]);

        SyncItemMasterPageJob::dispatch($syncRun->id);

        return response()->json(
            [
                'status' => 'started',
                'message' => 'Sinkronisasi Item Master dimulai.',
                'sync_run' => $this->syncRunPayload($syncRun),
            ],
            202
        );
    }

    public function syncProgress(
        AccurateSyncRun $syncRun
    ): JsonResponse {
        $this->ensureItemMasterSyncRun($syncRun);

        $syncRun->refresh();

        return response()->json([
            'status' => 'success',
            'sync_run' => $this->syncRunPayload($syncRun),
        ]);
    }

    public function retrySync(
        Request $request,
        AccurateSyncRun $syncRun
    ): JsonResponse {
        $this->ensureItemMasterSyncRun($syncRun);

        if ($syncRun->status !== AccurateSyncRun::STATUS_FAILED) {
            return response()->json(
                [
                    'status' => 'invalid_status',
                    'message' => 'Hanya sinkronisasi berstatus FAILED yang dapat dilanjutkan.',
                ],
                422
            );
        }

        $runningSync = AccurateSyncRun::query()
            ->where('module', 'item_master')
            ->where('sync_type', 'list')
            ->where('id', '<>', $syncRun->id)
            ->whereIn(
                'status',
                [
                    AccurateSyncRun::STATUS_PENDING,
                    AccurateSyncRun::STATUS_PROCESSING,
                ]
            )
            ->exists();

        if ($runningSync) {
            return response()->json(
                [
                    'status' => 'already_running',
                    'message' => 'Masih ada sinkronisasi Item Master lain yang berjalan.',
                ],
                409
            );
        }

        $syncRun->update([
            'status' => AccurateSyncRun::STATUS_PENDING,
            'error_message' => null,
            'finished_at' => null,
        ]);

        SyncItemMasterPageJob::dispatch($syncRun->id);

        return response()->json(
            [
                'status' => 'resumed',
                'message' => 'Sinkronisasi dilanjutkan dari halaman terakhir yang berhasil.',
                'sync_run' => $this->syncRunPayload($syncRun->fresh()),
            ],
            202
        );
    }

    private function ensureItemMasterSyncRun(
        AccurateSyncRun $syncRun
    ): void {
        if (
            $syncRun->module !== 'item_master'
            || $syncRun->sync_type !== 'list'
        ) {
            abort(404);
        }
    }

    private function syncRunPayload(
        AccurateSyncRun $syncRun
    ): array {
        return [
            'id' => $syncRun->id,
            'status' => $syncRun->status,
            'current_page' => $syncRun->current_page,
            'total_pages' => $syncRun->total_pages,
            'page_size' => $syncRun->page_size,
            'total_items' => $syncRun->total_items,
            'processed_items' => $syncRun->processed_items,
            'inserted_items' => $syncRun->inserted_items,
            'updated_items' => $syncRun->updated_items,
            'skipped_items' => $syncRun->skipped_items,
            'failed_items' => $syncRun->failed_items,
            'inactivated_items' => $syncRun->inactivated_items,
            'progress_percentage' => $syncRun->progress_percentage,
            'error_message' => $syncRun->error_message,
            'started_at' => $syncRun->started_at?->format('Y-m-d H:i:s'),
            'finished_at' => $syncRun->finished_at?->format('Y-m-d H:i:s'),
        ];
    }

    private function importRunPayload(
        ItemMasterImportRun $run
    ): array {
        return [
            'id' => $run->id,
            'status' => $run->status,
            'original_filename' => $run->original_filename,
            'total_rows' => $run->total_rows,
            'processed_rows' => $run->processed_rows,
            'updated_rows' => $run->updated_rows,
            'unmatched_rows' => $run->unmatched_rows,
            'skipped_rows' => $run->skipped_rows,
            'failed_rows' => $run->failed_rows,
            'progress_percentage' => $run->progress_percentage,
            'error_samples' => $run->error_samples,
            'error_message' => $run->error_message,
            'started_at' => $run->started_at?->format('Y-m-d H:i:s'),
            'finished_at' => $run->finished_at?->format('Y-m-d H:i:s'),
        ];
    }
}
