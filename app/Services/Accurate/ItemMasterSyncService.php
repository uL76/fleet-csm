<?php

namespace App\Services\Accurate;

use App\Models\ItemMaster;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class ItemMasterSyncService
{
    private const PAGE_SIZE = 100;

    private const MAX_RECORDED_ERRORS = 20;

    private const MAX_ERROR_LENGTH = 5000;

    public function __construct(
        private readonly AccurateClient $client
    ) {}

    /**
     * Sinkronisasi seluruh Item Master dari Accurate.
     *
     * Mapping utama:
     * - id          -> accurate_id
     * - no          -> item_code
     * - charField1  -> part_number
     * - name        -> item_description
     * - unit1.name  -> unit_name
     * - suspended   -> kebalikan is_active
     */
    public function sync(
        ?int $userId = null
    ): array {
        /*
         * Sinkronisasi detail dilakukan satu per satu.
         * Ini membantu proses local development agar tidak berhenti
         * karena batas execution time PHP.
         *
         * Untuk production dengan jumlah item sangat banyak,
         * sebaiknya dipindahkan ke Laravel Queue.
         */
        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }

        $listItems = $this->fetchAllItemList();

        if ($listItems === []) {
            throw new RuntimeException(
                'Data item dari Accurate kosong.'
            );
        }

        $inserted = 0;
        $updated = 0;
        $skipped = 0;
        $failed = 0;

        $accurateIds = [];
        $errors = [];

        $syncTime = now();

        foreach ($listItems as $listItem) {
            if (! is_array($listItem)) {
                $skipped++;

                continue;
            }

            $accurateId = $this->nullableString(
                data_get($listItem, 'id')
            );

            $itemCode = $this->nullableString(
                data_get($listItem, 'no')
            );

            if (
                $accurateId === null
                || $itemCode === null
            ) {
                $skipped++;

                $this->appendError(
                    $errors,
                    [
                        'accurate_id' => $accurateId,
                        'item_code' => $itemCode,
                        'message' => 'Item dilewati karena Accurate ID atau Item Code kosong.',
                    ]
                );

                continue;
            }

            try {
                $detail = $this->fetchItemDetail(
                    $accurateId,
                    $itemCode
                );

                $mapped = $this->mapItem(
                    $detail,
                    $syncTime,
                    $userId
                );

                if ($mapped === null) {
                    $skipped++;

                    $this->appendError(
                        $errors,
                        [
                            'accurate_id' => $accurateId,
                            'item_code' => $itemCode,
                            'message' => 'Item dilewati karena hasil mapping tidak lengkap.',
                        ]
                    );

                    continue;
                }

                /*
                 * Accurate ID hanya dicatat setelah detail berhasil
                 * diambil dan mapping berhasil.
                 */
                $accurateIds[] =
                    $mapped['accurate_id'];

                DB::transaction(
                    function () use (
                        $mapped,
                        &$inserted,
                        &$updated
                    ): void {
                        $existing = ItemMaster::query()
                            ->where(
                                'accurate_id',
                                $mapped['accurate_id']
                            )
                            ->orWhere(
                                'item_code',
                                $mapped['item_code']
                            )
                            ->first();

                        if ($existing) {
                            $updateData = $mapped;

                            /*
                             * Jangan mengubah created_by ketika record
                             * yang sudah ada diperbarui.
                             */
                            unset(
                                $updateData['created_by']
                            );

                            $existing->update(
                                $updateData
                            );

                            $updated++;

                            return;
                        }

                        ItemMaster::create(
                            $mapped
                        );

                        $inserted++;
                    }
                );
            } catch (Throwable $exception) {
                report($exception);

                $failed++;

                $message = $this->limitErrorMessage(
                    $exception->getMessage()
                );

                $this->appendError(
                    $errors,
                    [
                        'accurate_id' => $accurateId,
                        'item_code' => $itemCode,
                        'message' => $message,
                    ]
                );

                /*
                 * Pencatatan error dibuat terpisah.
                 * Jika proses penyimpanan error juga gagal,
                 * sinkronisasi item berikutnya tetap berjalan.
                 */
                $this->recordItemSyncError(
                    $accurateId,
                    $itemCode,
                    $message,
                    $syncTime,
                    $userId
                );
            }
        }

        $accurateIds = array_values(
            array_unique(
                array_filter(
                    $accurateIds,
                    static fn (
                        mixed $value
                    ): bool => is_string($value)
                        && $value !== ''
                )
            )
        );

        $inactivated = $this->inactivateMissingItems(
            $accurateIds,
            $syncTime,
            $userId
        );

        return [
            'total_accurate' => count($listItems),

            'inserted' => $inserted,
            'updated' => $updated,
            'skipped' => $skipped,
            'failed' => $failed,
            'inactivated' => $inactivated,

            'synced_at' => $syncTime->format(
                'Y-m-d H:i:s'
            ),

            'errors' => array_slice(
                $errors,
                0,
                self::MAX_RECORDED_ERRORS
            ),
        ];
    }

    /**
     * Mengambil seluruh daftar Item Accurate dengan pagination.
     */
    private function fetchAllItemList(): array
    {
        $page = 1;
        $pageCount = 1;
        $allItems = [];

        do {
            $response = $this->client->get(
                'item/list.do',
                [
                    'fields' => implode(',', [
                        'id',
                        'no',
                        'name',
                        'suspended',
                    ]),

                    'sp.pageSize' => self::PAGE_SIZE,

                    'sp.page' => $page,
                ]
            );

            if (! $response->successful()) {
                throw new RuntimeException(
                    sprintf(
                        'Gagal mengambil daftar item Accurate pada halaman %d. HTTP %s.',
                        $page,
                        $response->status()
                    )
                );
            }

            $json = $response->json();

            if (! is_array($json)) {
                throw new RuntimeException(
                    sprintf(
                        'Response daftar item Accurate halaman %d bukan JSON yang valid.',
                        $page
                    )
                );
            }

            if (
                data_get($json, 's')
                !== true
            ) {
                throw new RuntimeException(
                    sprintf(
                        'Daftar item Accurate halaman %d gagal: %s',
                        $page,
                        $this->extractErrorMessage(
                            $json
                        )
                    )
                );
            }

            $pageItems = data_get(
                $json,
                'd',
                []
            );

            if (! is_array($pageItems)) {
                throw new RuntimeException(
                    sprintf(
                        'Data daftar item Accurate halaman %d memiliki format tidak valid.',
                        $page
                    )
                );
            }

            foreach ($pageItems as $item) {
                if (is_array($item)) {
                    $allItems[] = $item;
                }
            }

            $pageCount = max(
                1,
                (int) data_get(
                    $json,
                    'sp.pageCount',
                    1
                )
            );

            $page++;
        } while ($page <= $pageCount);

        return $allItems;
    }

    /**
     * Mengambil detail item.
     *
     * Prioritas pertama menggunakan ID.
     * Jika gagal, lakukan fallback menggunakan nomor item.
     */
    private function fetchItemDetail(
        string $accurateId,
        string $itemCode
    ): array {
        try {
            return $this->requestItemDetail(
                [
                    'id' => $accurateId,
                ],
                $itemCode
            );
        } catch (Throwable $idException) {
            report($idException);

            try {
                return $this->requestItemDetail(
                    [
                        'no' => $itemCode,
                    ],
                    $itemCode
                );
            } catch (Throwable $numberException) {
                throw new RuntimeException(
                    sprintf(
                        'Gagal mengambil detail item %s menggunakan ID maupun nomor item. ID error: %s | No error: %s',
                        $itemCode,
                        $this->limitErrorMessage(
                            $idException->getMessage(),
                            1000
                        ),
                        $this->limitErrorMessage(
                            $numberException->getMessage(),
                            1000
                        )
                    ),
                    previous: $numberException
                );
            }
        }
    }

    /**
     * Menjalankan request detail Item Accurate.
     */
    private function requestItemDetail(
        array $parameters,
        string $itemCode
    ): array {
        $response = $this->client->get(
            'item/detail.do',
            $parameters
        );

        if (! $response->successful()) {
            throw new RuntimeException(
                sprintf(
                    'Gagal mengambil detail item %s. HTTP %s.',
                    $itemCode,
                    $response->status()
                )
            );
        }

        $json = $response->json();

        if (! is_array($json)) {
            throw new RuntimeException(
                sprintf(
                    'Response detail item %s bukan JSON yang valid.',
                    $itemCode
                )
            );
        }

        if (
            data_get($json, 's')
            !== true
        ) {
            throw new RuntimeException(
                sprintf(
                    'Detail item %s gagal: %s',
                    $itemCode,
                    $this->extractErrorMessage(
                        $json
                    )
                )
            );
        }

        $detail = data_get(
            $json,
            'd'
        );

        if (! is_array($detail)) {
            throw new RuntimeException(
                sprintf(
                    'Detail item %s kosong atau memiliki format tidak valid.',
                    $itemCode
                )
            );
        }

        return $detail;
    }

    /**
     * Mapping response detail Accurate ke tabel item_masters.
     */
    private function mapItem(
        array $item,
        Carbon $syncTime,
        ?int $userId
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

            'unit_name' => $this->resolveUnitName(
                $item
            ),

            'is_active' => ! $suspended,

            'accurate_raw' => $item,

            'sync_error' => null,

            'last_sync_at' => $syncTime,

            'created_by' => $userId,

            'updated_by' => $userId,
        ];
    }

    /**
     * Mencari UOM dari beberapa kemungkinan field.
     */
    private function resolveUnitName(
        array $item
    ): ?string {
        $candidates = [
            data_get(
                $item,
                'unit1.name'
            ),

            data_get(
                $item,
                'unit1Name'
            ),

            data_get(
                $item,
                'vendorUnit.name'
            ),

            data_get(
                $item,
                'vendorUnitName'
            ),

            data_get(
                $item,
                'detailSellingPrice.0.unit.name'
            ),
        ];

        foreach ($candidates as $candidate) {
            $unitName =
                $this->nullableString(
                    $candidate
                );

            if ($unitName !== null) {
                return $unitName;
            }
        }

        return null;
    }

    /**
     * Menonaktifkan item lokal yang tidak lagi ditemukan
     * pada hasil sinkronisasi Accurate.
     */
    private function inactivateMissingItems(
        array $accurateIds,
        Carbon $syncTime,
        ?int $userId
    ): int {
        /*
         * Jangan melakukan inaktivasi jika tidak ada satu pun
         * item detail yang berhasil diproses.
         *
         * Ini mencegah semua item lokal salah dinonaktifkan
         * ketika Accurate sedang mengalami gangguan.
         */
        if ($accurateIds === []) {
            return 0;
        }

        return ItemMaster::query()
            ->where(
                'accurate_id',
                '!=',
                null
            )
            ->where(
                'accurate_id',
                '<>',
                ''
            )
            ->whereNotIn(
                'accurate_id',
                $accurateIds
            )
            ->where(
                'is_active',
                true
            )
            ->update([
                'is_active' => false,

                'updated_by' => $userId,

                'last_sync_at' => $syncTime,

                'updated_at' => $syncTime,
            ]);
    }

    /**
     * Menyimpan error sinkronisasi pada item yang sudah ada.
     */
    private function recordItemSyncError(
        string $accurateId,
        string $itemCode,
        string $message,
        Carbon $syncTime,
        ?int $userId
    ): void {
        try {
            ItemMaster::query()
                ->where(
                    function ($query) use (
                        $accurateId,
                        $itemCode
                    ): void {
                        $query
                            ->where(
                                'accurate_id',
                                $accurateId
                            )
                            ->orWhere(
                                'item_code',
                                $itemCode
                            );
                    }
                )
                ->update([
                    'sync_error' => $this->limitErrorMessage(
                        $message
                    ),

                    'last_sync_at' => $syncTime,

                    'updated_by' => $userId,

                    'updated_at' => $syncTime,
                ]);
        } catch (Throwable $loggingException) {
            /*
             * Error logging tidak boleh menghentikan
             * proses sinkronisasi item berikutnya.
             */
            report($loggingException);
        }
    }

    /**
     * Menambahkan error ke daftar hasil dengan batas maksimal.
     */
    private function appendError(
        array &$errors,
        array $error
    ): void {
        if (
            count($errors)
            >= self::MAX_RECORDED_ERRORS
        ) {
            return;
        }

        $errors[] = $error;
    }

    /**
     * Mengubah nilai menjadi string nullable yang bersih.
     */
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

    /**
     * Membatasi panjang pesan error agar aman disimpan.
     */
    private function limitErrorMessage(
        string $message,
        int $length = self::MAX_ERROR_LENGTH
    ): string {
        $message = trim($message);

        if ($message === '') {
            return 'Terjadi kesalahan yang tidak diketahui.';
        }

        return mb_substr(
            $message,
            0,
            $length
        );
    }

    /**
     * Mengambil pesan error dari response Accurate.
     */
    private function extractErrorMessage(
        array $response
    ): string {
        $candidates = [
            data_get(
                $response,
                'message'
            ),

            data_get(
                $response,
                'error'
            ),

            data_get(
                $response,
                'd'
            ),

            data_get(
                $response,
                'errors'
            ),
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

        return 'Accurate mengembalikan response gagal tanpa pesan error.';
    }
}
