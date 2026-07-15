<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Imports\ItemMasterDetailImport;
use App\Models\ItemMasterImportRun;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\File;
use Maatwebsite\Excel\Facades\Excel;

class ItemMasterImportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $runningImport = ItemMasterImportRun::query()
            ->whereIn(
                'status',
                [
                    ItemMasterImportRun::STATUS_PENDING,
                    ItemMasterImportRun::STATUS_PROCESSING,
                ]
            )
            ->latest('id')
            ->first();

        if ($runningImport) {
            return response()->json(
                [
                    'status' => 'already_running',
                    'message' => 'Import Item Master masih berjalan.',
                    'import_run' => $this->payload($runningImport),
                ],
                409
            );
        }

        $validated = $request->validate([
            'file' => [
                'required',
                File::types(['xlsx', 'xls'])->max('25mb'),
            ],
        ]);

        $file = $validated['file'];
        $storedPath = $file->store(
            'item-master-imports',
            'local'
        );

        $user = $request->user('web');

        $importRun = ItemMasterImportRun::query()->create([
            'status' => ItemMasterImportRun::STATUS_PENDING,
            'original_filename' => $file->getClientOriginalName(),
            'stored_path' => $storedPath,
            'file_size' => $file->getSize() ?: 0,
            'total_rows' => 0,
            'processed_rows' => 0,
            'updated_rows' => 0,
            'unmatched_rows' => 0,
            'skipped_rows' => 0,
            'failed_rows' => 0,
            'error_samples' => [],
            'error_message' => null,
            'started_at' => null,
            'finished_at' => null,
            'created_by' => $user?->id,
        ]);

        Excel::queueImport(
            new ItemMasterDetailImport(
                importRunId: $importRun->id,
                userId: $user?->id,
                sourceFilename: $file->getClientOriginalName()
            ),
            $storedPath,
            'local'
        );

        return response()->json(
            [
                'status' => 'started',
                'message' => 'Import Item Master dimulai.',
                'import_run' => $this->payload($importRun),
            ],
            202
        );
    }

    public function progress(
        ItemMasterImportRun $importRun
    ): JsonResponse {
        $importRun->refresh();

        return response()->json([
            'status' => 'success',
            'import_run' => $this->payload($importRun),
        ]);
    }

    private function payload(
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
