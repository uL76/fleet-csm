<?php

namespace App\Services\Accurate;

use App\Models\Vendor;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class VendorSyncService
{
    private const PAGE_SIZE = 100;

    public function __construct(
        private readonly AccurateClient $client
    ) {}

    public function sync(
        ?int $userId = null
    ): array {
        $vendors = $this->fetchAll();

        if ($vendors === []) {
            throw new RuntimeException(
                'Data vendor Accurate kosong.'
            );
        }

        return DB::transaction(
            function () use (
                $vendors,
                $userId
            ): array {
                $inserted = 0;
                $updated = 0;
                $skipped = 0;
                $inactivated = 0;

                $accurateIds = [];
                $syncTime = now();

                foreach ($vendors as $vendor) {
                    $mapped = $this->mapVendor(
                        $vendor,
                        $syncTime,
                        $userId
                    );

                    if ($mapped === null) {
                        $skipped++;

                        continue;
                    }

                    $accurateIds[] =
                        $mapped['accurate_id'];

                    $existing = Vendor::query()
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

                    Vendor::create($mapped);
                    $inserted++;
                }

                $accurateIds = array_values(
                    array_unique($accurateIds)
                );

                if ($accurateIds !== []) {
                    $inactivated = Vendor::query()
                        ->whereNotNull('accurate_id', 'and')
                        ->where('accurate_id', '<>', '')
                        ->whereNotIn(
                            'accurate_id',
                            $accurateIds
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
                    'total_accurate' => count($vendors),
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
        $allVendors = [];

        do {
            $response = $this->client->get(
                'vendor/list.do',
                [
                    'fields' => implode(',', [
                        'id',
                        'vendorNo',
                        'name',
                        'category',
                        'email',
                        'phone',
                        'mobilePhone',
                        'fax',
                        'website',
                        'npwpNo',
                        'contact',
                        'address',
                        'street',
                        'city',
                        'province',
                        'country',
                        'zipcode',
                        'notes',
                        'suspended',
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
                foreach ($pageData as $vendor) {
                    if (is_array($vendor)) {
                        $allVendors[] = $vendor;
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

        return $allVendors;
    }

    private function mapVendor(
        array $vendor,
        mixed $syncTime,
        ?int $userId
    ): ?array {
        $accurateId = $this->clean(
            $vendor['id'] ?? null
        );

        $vendorName = $this->clean(
            $vendor['name']
                ?? $vendor['vendorName']
                ?? null
        );

        if (
            $accurateId === null ||
            $vendorName === null
        ) {
            return null;
        }

        $isSuspended = filter_var(
            $vendor['suspended'] ?? false,
            FILTER_VALIDATE_BOOLEAN
        );

        return [
            'accurate_id' => $accurateId,

            'vendor_no' => $this->clean(
                $vendor['vendorNo']
                    ?? $vendor['no']
                    ?? $vendor['number']
                    ?? null
            ),

            'vendor_name' => $vendorName,

            'category_name' => $this->extractName(
                $vendor['category']
                    ?? $vendor['categoryName']
                    ?? null
            ),

            'email' => $this->clean(
                $vendor['email']
                    ?? $vendor['emailAddress']
                    ?? null
            ),

            'phone' => $this->clean(
                $vendor['phone']
                    ?? $vendor['phoneNo']
                    ?? null
            ),

            'mobile_phone' => $this->clean(
                $vendor['mobilePhone']
                    ?? $vendor['mobile']
                    ?? $vendor['mobileNo']
                    ?? null
            ),

            'fax' => $this->clean(
                $vendor['fax']
                    ?? $vendor['faxNo']
                    ?? null
            ),

            'website' => $this->clean(
                $vendor['website']
                    ?? $vendor['webSite']
                    ?? null
            ),

            'npwp_no' => $this->clean(
                $vendor['npwpNo']
                    ?? $vendor['taxNo']
                    ?? null
            ),

            'contact_name' => $this->extractName(
                $vendor['contact']
                    ?? $vendor['contactName']
                    ?? null
            ),

            'address' => $this->clean(
                $vendor['address']
                    ?? $vendor['billAddress']
                    ?? $vendor['shipAddress']
                    ?? null
            ),

            'street' => $this->clean(
                $vendor['street'] ?? null
            ),

            'city' => $this->clean(
                $vendor['city'] ?? null
            ),

            'province' => $this->clean(
                $vendor['province'] ?? null
            ),

            'country' => $this->clean(
                $vendor['country'] ?? null
            ),

            'zipcode' => $this->clean(
                $vendor['zipcode']
                    ?? $vendor['zipCode']
                    ?? null
            ),

            'notes' => $this->clean(
                $vendor['notes']
                    ?? $vendor['description']
                    ?? null
            ),

            'is_active' => ! $isSuspended,

            'accurate_raw' => $vendor,

            'last_sync_at' => $syncTime,

            'created_by' => $userId,

            'updated_by' => $userId,
        ];
    }

    private function extractName(
        mixed $value
    ): ?string {
        if (is_array($value)) {
            return $this->clean(
                $value['name']
                    ?? $value['value']
                    ?? $value['no']
                    ?? null
            );
        }

        return $this->clean($value);
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
                    ): string => is_scalar($value)
                        ? (string) $value
                        : json_encode(
                            $value,
                            JSON_UNESCAPED_UNICODE
                        ),
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

        return 'Request vendor Accurate gagal.';
    }
}
