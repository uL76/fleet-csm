<?php

namespace App\Imports;

use App\Models\ItemMaster;
use App\Models\ItemMasterImportRun;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\RegistersEventListeners;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Events\AfterImport;
use Maatwebsite\Excel\Events\ImportFailed;
use Throwable;

class ItemMasterDetailImport implements ShouldQueue, ToCollection, WithChunkReading, WithEvents, WithHeadingRow
{
    use RegistersEventListeners;

    public function __construct(
        public readonly int $importRunId,
        public readonly ?int $userId,
        public readonly string $sourceFilename
    ) {}

    public function collection(Collection $rows): void
    {
        $importRun = ItemMasterImportRun::query()
            ->findOrFail($this->importRunId);

        $importRun->update([
            'status' => ItemMasterImportRun::STATUS_PROCESSING,
            'started_at' => $importRun->started_at ?? now(),
        ]);

        $firstRow = $rows->first();

        $firstRowArray = is_array($firstRow)
            ? $firstRow
            : (
                method_exists($firstRow, 'toArray')
                    ? $firstRow->toArray()
                    : []
            );

        if (! array_key_exists('part_code', $firstRowArray)) {
            throw new \RuntimeException(
                'Header Excel tidak sesuai. Pastikan "Part Code" berada pada baris pertama.'
            );
        }

        $itemCodes = $rows
            ->map(
                fn (mixed $row): ?string => $this->nullableString(
                    $row['part_code'] ?? null
                )
            )
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($itemCodes === []) {
            $importRun->update([
                'processed_rows' => $importRun->processed_rows + $rows->count(),
                'skipped_rows' => $importRun->skipped_rows + $rows->count(),
            ]);

            return;
        }

        $existingItems = ItemMaster::query()
            ->whereIn('item_code', $itemCodes)
            ->get()
            ->keyBy('item_code');

        $upsertRows = [];
        $unmatched = 0;
        $skipped = 0;
        $failed = 0;
        $errors = [];

        foreach ($rows as $index => $row) {
            try {
                $itemCode = $this->nullableString(
                    $row['part_code'] ?? null
                );

                if ($itemCode === null) {
                    $skipped++;

                    continue;
                }

                $existing = $existingItems->get($itemCode);

                if (! $existing) {
                    $unmatched++;

                    continue;
                }

                $existing = $existingItems->get($itemCode);

                if (! $existing) {
                    $unmatched++;

                    continue;
                }

                $upsertRows[] = [
                    'accurate_id' => $existing->accurate_id,
                    'item_code' => $itemCode,

                    'part_number' => $this->preferExcelValue(
                        $row['oem_part_number'] ?? null,
                        $existing->part_number
                    ),

                    'item_description' => $this->preferExcelValue(
                        $row['part_description'] ?? null,
                        $existing->item_description
                    ),

                    'unit_name' => $this->preferExcelValue(
                        $row['uom'] ?? null,
                        $existing->unit_name
                    ),

                    'category_name' => $this->preferExcelValue(
                        $row['category'] ?? null,
                        $existing->category_name
                    ),

                    'item_type' => $this->preferExcelValue(
                        $row['type'] ?? null,
                        $existing->item_type
                    ),

                    'brand_name' => $this->preferExcelValue(
                        $row['brand'] ?? null,
                        $existing->brand_name
                    ),

                    'preferred_vendor' => $this->preferExcelValue(
                        $row['prefered_vendor']
                            ?? $row['preferred_vendor']
                            ?? null,
                        $existing->preferred_vendor
                    ),

                    'minimum_stock' => $this->preferDecimal(
                        $row['min_stock'] ?? null,
                        $existing->minimum_stock
                    ),

                    'total_stock' => $this->preferDecimal(
                        $row['total_stock'] ?? null,
                        $existing->total_stock
                    ),

                    'excel_inactive' => $this->parseInactive(
                        $row['non_aktif'] ?? null,
                        $existing->excel_inactive
                    ),

                    'length_cm' => $this->preferDecimal(
                        $row['panjang_cm'] ?? null,
                        $existing->length_cm
                    ),

                    'width_cm' => $this->preferDecimal(
                        $row['lebar_cm'] ?? null,
                        $existing->width_cm
                    ),

                    'height_cm' => $this->preferDecimal(
                        $row['tinggi_cm'] ?? null,
                        $existing->height_cm
                    ),

                    'weight_gram' => $this->preferDecimal(
                        $row['berat_gr'] ?? null,
                        $existing->weight_gram
                    ),

                    'cross_reference_part_no' => $this->preferExcelValue(
                        $row['cross_reference_part_no'] ?? null,
                        $existing->cross_reference_part_no
                    ),

                    'equipment_type' => $this->preferExcelValue(
                        $row['equipment_type'] ?? null,
                        $existing->equipment_type
                    ),

                    'compatible_equipment_model' => $this->preferExcelValue(
                        $row['compatible_equipment_model'] ?? null,
                        $existing->compatible_equipment_model
                    ),

                    'specification' => $this->preferExcelValue(
                        $row['spesification']
                            ?? $row['specification']
                            ?? null,
                        $existing->specification
                    ),

                    'bin_location_bpn' => $this->preferExcelValue(
                        $row['bin_location_bpn'] ?? null,
                        $existing->bin_location_bpn
                    ),

                    'bin_location_jkt' => $this->preferExcelValue(
                        $row['bin_location_jkt'] ?? null,
                        $existing->bin_location_jkt
                    ),

                    'class_movement' => $this->preferExcelValue(
                        $row['class_movement'] ?? null,
                        $existing->class_movement
                    ),

                    'reorder_quantity' => $this->preferDecimal(
                        $row['re_order_quantity']
                            ?? $row['reorder_quantity']
                            ?? null,
                        $existing->reorder_quantity
                    ),

                    'maximum_quantity' => $this->preferDecimal(
                        $row['maximum_quantity'] ?? null,
                        $existing->maximum_quantity
                    ),

                    'excel_imported_at' => now(),
                    'excel_imported_by' => $this->userId,
                    'excel_source_file' => $this->sourceFilename,
                    'updated_by' => $this->userId,
                    'updated_at' => now(),
                ];
            } catch (Throwable $exception) {
                $failed++;

                if (count($errors) < 25) {
                    $errors[] = [
                        'row' => $index + 2,
                        'message' => $exception->getMessage(),
                    ];
                }
            }
        }

        if ($upsertRows !== []) {
            DB::table('item_masters')->upsert(
                $upsertRows,
                ['accurate_id'],
                [
                    'item_code',
                    'part_number',
                    'item_description',
                    'unit_name',
                    'category_name',
                    'item_type',
                    'brand_name',
                    'preferred_vendor',
                    'minimum_stock',
                    'total_stock',
                    'excel_inactive',
                    'length_cm',
                    'width_cm',
                    'height_cm',
                    'weight_gram',
                    'cross_reference_part_no',
                    'equipment_type',
                    'compatible_equipment_model',
                    'specification',
                    'bin_location_bpn',
                    'bin_location_jkt',
                    'class_movement',
                    'reorder_quantity',
                    'maximum_quantity',
                    'excel_imported_at',
                    'excel_imported_by',
                    'excel_source_file',
                    'updated_by',
                    'updated_at',
                ]
            );
        }

        $importRun->refresh();

        $combinedErrors = array_slice(
            array_merge(
                $importRun->error_samples ?? [],
                $errors
            ),
            0,
            25
        );

        $importRun->update([
            'processed_rows' => $importRun->processed_rows + $rows->count(),
            'updated_rows' => $importRun->updated_rows + count($upsertRows),
            'unmatched_rows' => $importRun->unmatched_rows + $unmatched,
            'skipped_rows' => $importRun->skipped_rows + $skipped,
            'failed_rows' => $importRun->failed_rows + $failed,
            'error_samples' => $combinedErrors,
        ]);
    }

    /**
     * Header file Excel berada pada baris pertama.
     */
    public function headingRow(): int
    {
        return 1;
    }

    /**
     * 2.000 baris per chunk mengurangi jumlah queue job
     * dari sekitar 35 job menjadi sekitar 9 job.
     */
    public function chunkSize(): int
    {
        return 2000;
    }

    public static function afterImport(
        AfterImport $event
    ): void {
        $import = $event->getConcernable();

        if (! $import instanceof self) {
            return;
        }

        $run = ItemMasterImportRun::query()
            ->find($import->importRunId);

        if (! $run) {
            return;
        }

        $run->refresh();

        $run->update([
            'status' => ItemMasterImportRun::STATUS_COMPLETED,

            'total_rows' => max(
                $run->total_rows,
                $run->processed_rows
            ),

            'finished_at' => now(),
            'error_message' => null,
        ]);
    }

    public static function importFailed(ImportFailed $event): void
    {
        $import = $event->getConcernable();

        if (! $import instanceof self) {
            return;
        }

        $run = ItemMasterImportRun::query()
            ->find($import->importRunId);

        if (! $run) {
            return;
        }

        $run->update([
            'status' => ItemMasterImportRun::STATUS_FAILED,
            'error_message' => mb_substr(
                $event->getException()->getMessage(),
                0,
                5000
            ),
            'finished_at' => now(),
        ]);
    }

    private function nullableString(mixed $value): ?string
    {
        if (
            $value === null
            || is_array($value)
            || is_object($value)
        ) {
            return null;
        }

        $value = trim((string) $value);

        return $value !== '' ? $value : null;
    }

    private function preferExcelValue(
        mixed $excelValue,
        mixed $existingValue
    ): ?string {
        return $this->nullableString($excelValue)
            ?? $this->nullableString($existingValue);
    }

    private function preferDecimal(
        mixed $excelValue,
        mixed $existingValue
    ): ?string {
        return $this->parseDecimal($excelValue)
            ?? $this->parseDecimal($existingValue);
    }

    private function parseDecimal(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_int($value) || is_float($value)) {
            return number_format((float) $value, 4, '.', '');
        }

        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        if ($value === '') {
            return null;
        }

        $value = str_replace(
            [' ', "\xc2\xa0"],
            '',
            $value
        );

        if (
            str_contains($value, ',')
            && str_contains($value, '.')
        ) {
            $value = str_replace('.', '', $value);
            $value = str_replace(',', '.', $value);
        } elseif (str_contains($value, ',')) {
            $value = str_replace(',', '.', $value);
        }

        if (! is_numeric($value)) {
            return null;
        }

        return number_format((float) $value, 4, '.', '');
    }

    private function parseInactive(
        mixed $value,
        mixed $existing
    ): ?bool {
        $normalized = mb_strtolower(
            trim((string) $value)
        );

        if ($normalized === '') {
            return $existing === null
                ? null
                : (bool) $existing;
        }

        if (
            in_array(
                $normalized,
                ['ya', 'yes', 'y', '1', 'true'],
                true
            )
        ) {
            return true;
        }

        if (
            in_array(
                $normalized,
                ['tidak', 'no', 'n', '0', 'false'],
                true
            )
        ) {
            return false;
        }

        return $existing === null
            ? null
            : (bool) $existing;
    }
}
