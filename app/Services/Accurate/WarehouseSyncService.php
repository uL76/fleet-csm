<?php

namespace App\Services\Accurate;

use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class WarehouseSyncService
{
    private const PAGE_SIZE = 100;

    private const DAMAGE_KEYWORDS = [
        'DAMAGE',
        'RUSAK',
        'BROKEN',
        'QUARANTINE',
        'CLAIM',
        'SCRAP',
        'NG',
    ];

    public function __construct(
        private readonly AccurateClient $client
    ) {}

    public function sync(
        ?int $userId = null
    ): array {
        $warehouses = $this->fetchAll();

        if ($warehouses === []) {
            throw new RuntimeException(
                'Data warehouse Accurate kosong.'
            );
        }

        return DB::transaction(
            function () use (
                $warehouses,
                $userId
            ): array {
                $inserted = 0;
                $updated = 0;
                $skipped = 0;
                $inactivated = 0;

                $accurateIds = [];
                $syncTime = now();

                foreach ($warehouses as $warehouse) {
                    $mapped = $this->mapWarehouse(
                        $warehouse,
                        $syncTime,
                        $userId
                    );

                    if ($mapped === null) {
                        $skipped++;

                        continue;
                    }

                    $accurateIds[] =
                        $mapped['accurate_id'];

                    $existing = Warehouse::query()
                        ->where(
                            'accurate_id',
                            $mapped['accurate_id']
                        )
                        ->first();

                    if ($existing) {
                        unset($mapped['created_by']);

                        $existing->update($mapped);
                        $updated++;

                        continue;
                    }

                    Warehouse::create($mapped);
                    $inserted++;
                }

                if ($accurateIds !== []) {
                    $inactivated = Warehouse::query()
                        ->whereNotNull('accurate_id', 'and')
                        ->where('accurate_id', '<>', '')
                        ->whereNotIn(
                            'accurate_id',
                            array_values(
                                array_unique($accurateIds)
                            )
                        )
                        ->where('is_active', true)
                        ->update([
                            'is_active' => false,
                            'updated_by' => $userId,
                            'last_sync_at' => $syncTime,
                            'updated_at' => $syncTime,
                        ]);
                }

                return [
                    'total_accurate' => count($warehouses),

                    'inserted' => $inserted,
                    'updated' => $updated,
                    'skipped' => $skipped,
                    'inactivated' => $inactivated,
                    'synced_at' => $syncTime->format(
                        'Y-m-d H:i:s'
                    ),
                ];
            }
        );
    }

    private function fetchAll(): array
    {
        $page = 1;
        $allWarehouses = [];

        do {
            $response = $this->client->get(
                'warehouse/list.do',
                [
                    'fields' => implode(',', [
                        'id',
                        'name',
                        'description',
                        'locationId',
                        'suspended',
                        'street',
                        'city',
                        'province',
                        'country',
                        'zipcode',
                        'pic',
                    ]),

                    'sp.pageSize' => self::PAGE_SIZE,

                    'sp.page' => $page,
                ]
            );

            if (! $response->successful()) {
                throw new RuntimeException(
                    sprintf(
                        'Gagal menghubungi Accurate. HTTP %s.',
                        $response->status()
                    )
                );
            }

            $json = $response->json();

            if (! is_array($json)) {
                throw new RuntimeException(
                    'Response Accurate bukan JSON yang valid.'
                );
            }

            if (($json['s'] ?? false) !== true) {
                throw new RuntimeException(
                    $this->extractErrorMessage(
                        $json
                    )
                );
            }

            $pageData = $json['d'] ?? [];

            if (is_array($pageData)) {
                foreach ($pageData as $warehouse) {
                    if (is_array($warehouse)) {
                        $allWarehouses[] = $warehouse;
                    }
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

        return $allWarehouses;
    }

    private function mapWarehouse(
        array $warehouse,
        mixed $syncTime,
        ?int $userId
    ): ?array {
        $accurateId = $this->clean(
            $warehouse['id'] ?? null
        );

        $warehouseName = $this->clean(
            $warehouse['name'] ?? null
        );

        if (
            $accurateId === null ||
            $warehouseName === null
        ) {
            return null;
        }

        $description = $this->clean(
            $warehouse['description'] ?? null
        );

        $isSuspended = filter_var(
            $warehouse['suspended'] ?? false,
            FILTER_VALIDATE_BOOLEAN
        );

        return [
            'accurate_id' => $accurateId,

            'accurate_location_id' => $this->clean(
                $warehouse['locationId'] ?? null
            ),

            'warehouse_name' => $warehouseName,

            'description' => $description,

            'street' => $this->clean(
                $warehouse['street'] ?? null
            ),

            'city' => $this->clean(
                $warehouse['city'] ?? null
            ),

            'province' => $this->clean(
                $warehouse['province'] ?? null
            ),

            'country' => $this->clean(
                $warehouse['country'] ?? null
            ),

            'zipcode' => $this->clean(
                $warehouse['zipcode'] ?? null
            ),

            'pic' => $this->clean(
                $warehouse['pic'] ?? null
            ),

            'is_damage_warehouse' => $this->isDamageWarehouse(
                $warehouseName,
                $description
            ),

            'is_active' => ! $isSuspended,

            'accurate_raw' => $warehouse,

            'last_sync_at' => $syncTime,

            'created_by' => $userId,

            'updated_by' => $userId,
        ];
    }

    private function clean(
        mixed $value
    ): ?string {
        if ($value === null) {
            return null;
        }

        if (
            is_array($value) ||
            is_object($value)
        ) {
            return json_encode(
                $value,
                JSON_UNESCAPED_UNICODE
            );
        }

        $cleaned = trim((string) $value);

        return $cleaned !== ''
            ? $cleaned
            : null;
    }

    private function isDamageWarehouse(
        string $name,
        ?string $description
    ): bool {
        $text = mb_strtoupper(
            $name.' '.($description ?? '')
        );

        foreach (
            self::DAMAGE_KEYWORDS as $keyword
        ) {
            if (
                str_contains(
                    $text,
                    $keyword
                )
            ) {
                return true;
            }
        }

        return false;
    }

    private function extractErrorMessage(
        array $json
    ): string {
        $error = $json['d']
            ?? $json['message']
            ?? null;

        if (is_array($error)) {
            return implode(
                ' | ',
                array_map(
                    static fn (
                        mixed $value
                    ): string => (string) $value,
                    $error
                )
            );
        }

        if (
            is_string($error) &&
            trim($error) !== ''
        ) {
            return $error;
        }

        return 'Request warehouse Accurate gagal.';
    }
}
