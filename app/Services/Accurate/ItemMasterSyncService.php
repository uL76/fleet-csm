<?php

namespace App\Services\Accurate;

use App\Models\AccurateSyncRun;
use App\Models\ItemMaster;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ItemMasterSyncService
{
    public function __construct(
        private readonly AccurateClient $client
    ) {}

    /**
     * Memproses satu halaman daftar item Accurate.
     */
    public function syncPage(
        AccurateSyncRun $syncRun,
        int $page
    ): array {
        $responseData = $this->fetchItemPage(
            $page,
            $syncRun->page_size
        );

        $items = $responseData['items'];
        $totalPages = $responseData['total_pages'];
        $totalItems = $responseData['total_items'];

        $syncTime = now();

        $rows = [];
        $skipped = 0;

        foreach ($items as $item) {
            if (! is_array($item)) {
                $skipped++;

                continue;
            }

            $mapped = $this->mapListItem(
                $item,
                $syncRun,
                $syncTime
            );

            if ($mapped === null) {
                $skipped++;

                continue;
            }

            $rows[] = $mapped;
        }

        $accurateIds = array_values(
            array_unique(
                array_column(
                    $rows,
                    'accurate_id'
                )
            )
        );

        $existingIds = [];

        if ($accurateIds !== []) {
            $existingIds = DB::table('item_masters')
                ->whereIn(
                    'accurate_id',
                    $accurateIds
                )
                ->pluck('accurate_id')
                ->map(
                    static fn (mixed $value): string => (string) $value
                )
                ->all();
        }

        $existingLookup = array_fill_keys(
            $existingIds,
            true
        );

        $inserted = 0;
        $updated = 0;

        foreach ($accurateIds as $accurateId) {
            if (isset($existingLookup[$accurateId])) {
                $updated++;
            } else {
                $inserted++;
            }
        }

        if ($rows !== []) {
            ItemMaster::query()->upsert(
                $rows,
                ['accurate_id'],
                [
                    'item_code',
                    'part_number',
                    'item_description',
                    'unit_name',
                    'is_active',
                    'accurate_raw',
                    'sync_error',
                    'last_sync_at',
                    'last_seen_sync_id',
                    'last_seen_at',
                    'updated_by',
                    'updated_at',
                ]
            );
        }

        return [
            'page' => $page,
            'total_pages' => $totalPages,
            'total_items' => $totalItems,
            'page_item_count' => count($items),
            'processed' => count($rows),
            'inserted' => $inserted,
            'updated' => $updated,
            'skipped' => $skipped,
        ];
    }

    /**
     * Mengambil satu halaman item/list.do.
     *
     * Untuk field master dasar, detail.do tidak lagi dipanggil.
     */
    private function fetchItemPage(
        int $page,
        int $pageSize
    ): array {
        $response = $this->client->get(
            'item/list.do',
            [
                'fields' => implode(',', [
                    'id',
                    'no',
                    'name',
                    'charField1',
                    'unit1Name',
                    'suspended',
                ]),

                'sp.pageSize' => $pageSize,
                'sp.page' => $page,
            ]
        );

        if (! $response->successful()) {
            throw new RuntimeException(
                sprintf(
                    'Gagal mengambil daftar item Accurate halaman %d. HTTP %s.',
                    $page,
                    $response->status()
                )
            );
        }

        $json = $response->json();

        if (! is_array($json)) {
            throw new RuntimeException(
                sprintf(
                    'Response item Accurate halaman %d bukan JSON valid.',
                    $page
                )
            );
        }

        if (data_get($json, 's') !== true) {
            throw new RuntimeException(
                sprintf(
                    'Accurate menolak daftar item halaman %d: %s',
                    $page,
                    $this->extractErrorMessage($json)
                )
            );
        }

        $items = data_get(
            $json,
            'd',
            []
        );

        if (! is_array($items)) {
            throw new RuntimeException(
                sprintf(
                    'Data item Accurate halaman %d memiliki format tidak valid.',
                    $page
                )
            );
        }

        $totalPages = max(
            1,
            (int) data_get(
                $json,
                'sp.pageCount',
                1
            )
        );

        /*
         * Beberapa response Accurate menggunakan rowCount.
         * Jika tidak tersedia, estimasi menggunakan page count.
         */
        $totalItems = (int) data_get(
            $json,
            'sp.rowCount',
            0
        );

        if ($totalItems <= 0) {
            $totalItems = $totalPages * $pageSize;

            if ($page === $totalPages) {
                $totalItems =
                    (($totalPages - 1) * $pageSize)
                    + count($items);
            }
        }

        return [
            'items' => $items,
            'total_pages' => $totalPages,
            'total_items' => $totalItems,
        ];
    }

    private function mapListItem(
        array $item,
        AccurateSyncRun $syncRun,
        Carbon $syncTime
    ): ?array {
        $accurateId = $this->nullableString(
            data_get($item, 'id')
        );

        $itemCode = $this->nullableString(
            data_get($item, 'no')
        );

        if (
            $accurateId === null
            || $itemCode === null
        ) {
            return null;
        }

        $suspended = filter_var(
            data_get(
                $item,
                'suspended',
                false
            ),
            FILTER_VALIDATE_BOOLEAN
        );

        return [
            'accurate_id' => $accurateId,
            'item_code' => $itemCode,

            'part_number' => $this->nullableString(
                data_get(
                    $item,
                    'charField1'
                )
            ),

            'item_description' => $this->nullableString(
                data_get(
                    $item,
                    'name'
                )
            ),

            'unit_name' => $this->resolveListUnitName(
                $item
            ),

            'is_active' => ! $suspended,

            /*
             * upsert tidak menjalankan cast model.
             * Array harus diubah menjadi JSON manual.
             */
            'accurate_raw' => $this->encodeRawData(
                $item
            ),

            'sync_error' => null,

            'last_sync_at' => $syncTime,
            'last_seen_sync_id' => $syncRun->id,
            'last_seen_at' => $syncTime,

            'created_by' => $syncRun->created_by,
            'updated_by' => $syncRun->created_by,

            'created_at' => $syncTime,
            'updated_at' => $syncTime,
        ];
    }

    private function resolveListUnitName(
        array $item
    ): ?string {
        $candidates = [
            data_get($item, 'unit1Name'),
            data_get($item, 'unit1.name'),
            data_get($item, 'unitName'),
            data_get($item, 'unit.name'),
        ];

        foreach ($candidates as $candidate) {
            /*
             * Kadang Accurate bisa mengirim object/array.
             */
            if (is_array($candidate)) {
                $candidate =
                    data_get($candidate, 'name')
                    ?? data_get($candidate, 'value')
                    ?? null;
            }

            $value = $this->nullableString(
                $candidate
            );

            if ($value !== null) {
                return $value;
            }
        }

        return null;
    }

    /**
     * Hanya dipanggil setelah seluruh halaman berhasil.
     */
    public function finishSync(
        AccurateSyncRun $syncRun
    ): int {
        return ItemMaster::query()
            ->where(
                function ($query) use (
                    $syncRun
                ): void {
                    $query
                        ->whereNull(
                            'last_seen_sync_id'
                        )
                        ->orWhere(
                            'last_seen_sync_id',
                            '<>',
                            $syncRun->id
                        );
                }
            )
            ->where(
                'is_active',
                true
            )
            ->update([
                'is_active' => false,
                'updated_by' => $syncRun->created_by,
                'updated_at' => now(),
            ]);
    }

    private function nullableString(
        mixed $value
    ): ?string {
        if (
            ! is_string($value)
            && ! is_numeric($value)
        ) {
            return null;
        }

        $value = trim(
            (string) $value
        );

        return $value !== ''
            ? $value
            : null;
    }

    private function encodeRawData(
        array $data
    ): string {
        $encoded = json_encode(
            $data,
            JSON_UNESCAPED_UNICODE
            | JSON_UNESCAPED_SLASHES
            | JSON_INVALID_UTF8_SUBSTITUTE
            | JSON_THROW_ON_ERROR
        );

        return $encoded;
    }

    private function extractErrorMessage(
        array $response
    ): string {
        $candidates = [
            data_get($response, 'message'),
            data_get($response, 'error'),
            data_get($response, 'errors'),
            data_get($response, 'd'),
        ];

        foreach ($candidates as $candidate) {
            if (
                is_string($candidate)
                && trim($candidate) !== ''
            ) {
                return trim($candidate);
            }

            if (is_array($candidate)) {
                return json_encode(
                    $candidate,
                    JSON_UNESCAPED_UNICODE
                    | JSON_UNESCAPED_SLASHES
                ) ?: 'Accurate mengembalikan error.';
            }
        }

        return 'Accurate mengembalikan response gagal tanpa pesan.';
    }
}
