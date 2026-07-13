<?php

namespace App\Services\Accurate;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderDetail;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Throwable;

class PurchaseOrderSyncService
{
    private const PAGE_SIZE = 100;

    public function __construct(
        private readonly AccurateClient $client
    ) {}

    /**
     * Sinkronisasi Purchase Order Accurate berdasarkan rentang tanggal.
     *
     * @param  string  $startDate  Format Y-m-d
     * @param  string  $endDate  Format Y-m-d
     */
    public function sync(
        string $startDate,
        string $endDate,
        ?int $userId = null
    ): array {
        $validatedDates = $this->validateDateRange(
            $startDate,
            $endDate
        );

        $purchaseOrderList = $this->fetchList(
            $validatedDates['start_date'],
            $validatedDates['end_date']
        );

        $statistics = [
            'total_list' => count($purchaseOrderList),
            'processed' => 0,
            'inserted' => 0,
            'updated' => 0,
            'detail_inserted' => 0,
            'detail_updated' => 0,
            'detail_deleted' => 0,
            'detail_skipped' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        foreach ($purchaseOrderList as $listItem) {
            if (! is_array($listItem)) {
                $statistics['failed']++;

                $this->appendError(
                    $statistics,
                    'Data daftar PO Accurate bukan array yang valid.'
                );

                continue;
            }

            $accurateId = $this->clean(
                $listItem['id'] ?? null
            );

            if ($accurateId === null) {
                $statistics['failed']++;

                $this->appendError(
                    $statistics,
                    'Ada data daftar PO yang tidak memiliki Accurate ID.'
                );

                continue;
            }

            try {
                $detail = $this->fetchDetail(
                    $accurateId
                );

                $result = $this->savePurchaseOrder(
                    $detail,
                    $userId
                );

                $statistics['processed']++;
                $statistics['inserted'] +=
                    $result['inserted'];

                $statistics['updated'] +=
                    $result['updated'];

                $statistics['detail_inserted'] +=
                    $result['detail_inserted'];

                $statistics['detail_updated'] +=
                    $result['detail_updated'];

                $statistics['detail_deleted'] +=
                    $result['detail_deleted'];

                $statistics['detail_skipped'] +=
                    $result['detail_skipped'];
            } catch (Throwable $exception) {
                report($exception);

                $statistics['failed']++;

                $poNumber = $this->clean(
                    $listItem['number'] ?? null
                );

                $identifier = $poNumber !== null
                    ? "PO {$poNumber}"
                    : "Accurate ID {$accurateId}";

                $this->appendError(
                    $statistics,
                    $identifier.': '.$exception->getMessage()
                );
            }
        }

        $statistics['start_date'] =
            $validatedDates['start_date'];

        $statistics['end_date'] =
            $validatedDates['end_date'];

        $statistics['synced_at'] =
            now()->format('Y-m-d H:i:s');

        return $statistics;
    }

    /**
     * Mengambil seluruh daftar Purchase Order Accurate.
     */
    private function fetchList(
        string $startDate,
        string $endDate
    ): array {
        $page = 1;
        $pageCount = 1;
        $purchaseOrders = [];

        $accurateStartDate = Carbon::createFromFormat(
            'Y-m-d',
            $startDate
        )->format('d/m/Y');

        $accurateEndDate = Carbon::createFromFormat(
            'Y-m-d',
            $endDate
        )->format('d/m/Y');

        do {
            $response = $this->client->get(
                'purchase-order/list.do',
                [
                    'fields' => implode(',', [
                        'id',
                        'number',
                        'transDate',
                        'status',
                        'statusName',
                    ]),

                    'filter.transDate.op' => 'BETWEEN',

                    'filter.transDate.val[0]' => $accurateStartDate,

                    'filter.transDate.val[1]' => $accurateEndDate,

                    'sp.pageSize' => self::PAGE_SIZE,

                    'sp.page' => $page,
                ]
            );

            if (! $response->successful()) {
                throw new RuntimeException(
                    sprintf(
                        'Gagal mengambil daftar Purchase Order Accurate. HTTP %s.',
                        $response->status()
                    )
                );
            }

            $json = $response->json();

            if (! is_array($json)) {
                throw new RuntimeException(
                    'Response daftar Purchase Order Accurate bukan JSON yang valid.'
                );
            }

            if (($json['s'] ?? false) !== true) {
                throw new RuntimeException(
                    $this->extractErrorMessage(
                        $json,
                        'Request daftar Purchase Order Accurate gagal.'
                    )
                );
            }

            $pageData = $json['d'] ?? [];

            if (is_array($pageData)) {
                foreach ($pageData as $purchaseOrder) {
                    if (is_array($purchaseOrder)) {
                        $purchaseOrders[] =
                            $purchaseOrder;
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

        return $purchaseOrders;
    }

    /**
     * Mengambil detail satu Purchase Order Accurate.
     */
    private function fetchDetail(
        string $accurateId
    ): array {
        $response = $this->client->get(
            'purchase-order/detail.do',
            [
                'id' => $accurateId,
            ]
        );

        if (! $response->successful()) {
            throw new RuntimeException(
                sprintf(
                    'Gagal mengambil detail Purchase Order Accurate ID %s. HTTP %s.',
                    $accurateId,
                    $response->status()
                )
            );
        }

        $json = $response->json();

        if (! is_array($json)) {
            throw new RuntimeException(
                "Response detail PO Accurate ID {$accurateId} bukan JSON yang valid."
            );
        }

        if (($json['s'] ?? false) !== true) {
            throw new RuntimeException(
                $this->extractErrorMessage(
                    $json,
                    "Request detail PO Accurate ID {$accurateId} gagal."
                )
            );
        }

        $detail = $json['d'] ?? null;

        if (! is_array($detail)) {
            throw new RuntimeException(
                "Data detail PO Accurate ID {$accurateId} kosong."
            );
        }

        return $detail;
    }

    /**
     * Menyimpan header dan detail satu Purchase Order.
     */
    private function savePurchaseOrder(
        array $detail,
        ?int $userId
    ): array {
        return DB::transaction(
            function () use (
                $detail,
                $userId
            ): array {
                $syncTime = now();

                $header = $this->mapHeader(
                    $detail,
                    $syncTime,
                    $userId
                );

                $existingPurchaseOrder =
                    PurchaseOrder::query()
                        ->where(
                            'accurate_id',
                            $header['accurate_id']
                        )
                        ->first();

                /*
                 * Fallback berdasarkan nomor PO.
                 * Berguna jika Accurate ID sebelumnya belum tersimpan
                 * tetapi nomor PO sudah ada.
                 */
                if (! $existingPurchaseOrder) {
                    $existingPurchaseOrder =
                        PurchaseOrder::query()
                            ->where(
                                'po_number',
                                $header['po_number']
                            )
                            ->first();
                }

                $inserted = 0;
                $updated = 0;

                if ($existingPurchaseOrder) {
                    unset(
                        $header['created_by']
                    );

                    /*
                     * invoice_number tidak dimasukkan ke mapping header.
                     * Dengan demikian sync PO tidak akan menimpa relasi
                     * invoice yang sudah disimpan oleh modul lain.
                     */
                    $existingPurchaseOrder->update(
                        $header
                    );

                    $purchaseOrder =
                        $existingPurchaseOrder;

                    $updated = 1;
                } else {
                    $purchaseOrder =
                        PurchaseOrder::create(
                            $header
                        );

                    $inserted = 1;
                }

                $items = $this->extractDetailItems(
                    $detail
                );

                $detailInserted = 0;
                $detailUpdated = 0;
                $detailDeleted = 0;
                $detailSkipped = 0;

                $accurateDetailIds = [];
                $totalAmount = 0.0;

                foreach ($items as $item) {
                    if (! is_array($item)) {
                        $detailSkipped++;

                        continue;
                    }

                    $mappedDetail =
                        $this->mapDetail(
                            $item,
                            $purchaseOrder,
                            $header
                        );

                    if ($mappedDetail === null) {
                        $detailSkipped++;

                        continue;
                    }

                    $accurateDetailIds[] =
                        $mappedDetail[
                            'accurate_detail_id'
                        ];

                    $existingDetail =
                        PurchaseOrderDetail::query()
                            ->where(
                                'accurate_detail_id',
                                $mappedDetail[
                                    'accurate_detail_id'
                                ]
                            )
                            ->first();

                    /*
                     * Fallback tambahan agar detail milik PO lain
                     * tidak salah diperbarui apabila terdapat ID
                     * detail yang tidak konsisten.
                     */
                    if (
                        $existingDetail &&
                        (int) $existingDetail
                            ->purchase_order_id !==
                        (int) $purchaseOrder->id
                    ) {
                        $existingDetail =
                            PurchaseOrderDetail::query()
                                ->where(
                                    'purchase_order_id',
                                    $purchaseOrder->id
                                )
                                ->where(
                                    'accurate_detail_id',
                                    $mappedDetail[
                                        'accurate_detail_id'
                                    ]
                                )
                                ->first();
                    }

                    if ($existingDetail) {
                        $existingDetail->update(
                            $mappedDetail
                        );

                        $detailUpdated++;
                    } else {
                        PurchaseOrderDetail::create(
                            $mappedDetail
                        );

                        $detailInserted++;
                    }

                    $totalAmount += (float) (
                        $mappedDetail['line_total']
                        ?? 0
                    );
                }

                /*
                 * Hapus detail lokal yang sudah tidak ada pada
                 * detail PO Accurate terbaru.
                 *
                 * Proses ini hanya dilakukan setelah request detail
                 * Accurate berhasil, sehingga tidak menghapus detail
                 * akibat kegagalan koneksi.
                 */
                $detailQuery =
                    PurchaseOrderDetail::query()
                        ->where(
                            'purchase_order_id',
                            $purchaseOrder->id
                        );

                if ($accurateDetailIds !== []) {
                    $detailDeleted = $detailQuery
                        ->whereNotIn(
                            'accurate_detail_id',
                            array_values(
                                array_unique(
                                    $accurateDetailIds
                                )
                            )
                        )
                        ->delete();
                } elseif ($items === []) {
                    /*
                     * Jika Accurate benar-benar mengembalikan array detail
                     * kosong, detail lokal PO ikut dihapus agar sesuai
                     * dengan kondisi terbaru Accurate.
                     */
                    $detailDeleted =
                        $detailQuery->delete();
                }

                $officialTotalAmount = $this->toDecimal(
                    $this->firstValue(
                        $detail,
                        [
                            'totalAmount',
                            'grandTotal',
                            'total',
                            'netAmount',
                        ],
                        $totalAmount
                    )
                );

                $officialSubtotalAmount =
                    $this->toDecimal(
                        $this->firstValue(
                            $detail,
                            [
                                'subTotal',
                                'subtotal',
                                'subTotalAmount',
                            ],
                            $totalAmount
                        )
                    );

                $purchaseOrder->update([
                    'subtotal_amount' => $officialSubtotalAmount,

                    'total_amount' => $officialTotalAmount,

                    'last_sync_at' => $syncTime,

                    'updated_by' => $userId,
                ]);

                return [
                    'inserted' => $inserted,
                    'updated' => $updated,
                    'detail_inserted' => $detailInserted,
                    'detail_updated' => $detailUpdated,
                    'detail_deleted' => $detailDeleted,
                    'detail_skipped' => $detailSkipped,
                ];
            }
        );
    }

    /**
     * Mapping header Purchase Order Accurate.
     */
    private function mapHeader(
        array $detail,
        mixed $syncTime,
        ?int $userId
    ): array {
        $accurateId = $this->clean(
            $detail['id'] ?? null
        );

        $poNumber = $this->clean(
            $detail['number'] ?? null
        );

        if ($accurateId === null) {
            throw new RuntimeException(
                'Accurate ID Purchase Order kosong.'
            );
        }

        if ($poNumber === null) {
            throw new RuntimeException(
                "Nomor Purchase Order Accurate ID {$accurateId} kosong."
            );
        }

        $prNumber = $this->extractPrNumber(
            $detail
        );

        $mrNumber = $this->clean(
            $detail['charField1'] ?? null
        );

        if (
            $prNumber === null &&
            $mrNumber !== null
        ) {
            $prNumber =
                $this->findPrNumberByMrNumber(
                    $mrNumber
                );
        }

        return [
            'accurate_id' => $accurateId,

            'po_number' => $poNumber,

            'po_status' => $this->clean(
                $detail['statusName']
                    ?? $detail['status']
                    ?? null
            ),

            'vendor_no' => $this->firstCleanValue(
                $detail,
                [
                    'vendor.vendorNo',
                    'vendor.no',
                    'vendor.number',
                    'vendorNo',
                    'vendorNumber',
                    'vendorCode',
                ]
            ),

            'vendor_name' => $this->firstCleanValue(
                $detail,
                [
                    'vendor.name',
                    'vendorName',
                ]
            ),

            'mr_number' => $this->clean(
                $detail['charField1'] ?? null
            ),

            'project_name' => $this->clean(
                $detail['charField5'] ?? null
            ),

            'asset_id' => $this->clean(
                $detail['charField4'] ?? null
            ),

            'revision_no' => $this->clean(
                $detail['charField10'] ?? null
            ),

            'pr_number' => $prNumber,

            'po_subject' => $this->clean(
                $detail['description'] ?? null
            ),

            'project_name' => $this->clean(
                $detail['charField5'] ?? null
            ),

            'asset_id' => $this->clean(
                $detail['charField4'] ?? null
            ),

            'is_closed' => $this->toBoolean(
                $this->firstValue(
                    $detail,
                    [
                        'closed',
                        'closeOrder',
                        'isClosed',
                    ],
                    false
                )
            ),

            'trans_date' => $this->parseAccurateDate(
                $detail['transDate'] ?? null
            ),

            'subtotal_amount' => $this->toDecimal(
                $this->firstValue(
                    $detail,
                    [
                        'subTotal',
                        'subtotal',
                        'subTotalAmount',
                    ],
                    0
                )
            ),

            'discount_amount' => $this->toDecimal(
                $this->firstValue(
                    $detail,
                    [
                        'discountAmount',
                        'totalDiscount',
                        'discount',
                    ],
                    0
                )
            ),

            'tax_amount' => $this->toDecimal(
                $this->firstValue(
                    $detail,
                    [
                        'taxAmount',
                        'totalTax',
                        'tax',
                    ],
                    0
                )
            ),

            'is_taxable' => $this->toBoolean(
                $this->firstValue(
                    $detail,
                    [
                        'taxable',
                        'isTaxable',
                    ],
                    false
                )
            ),

            'is_inclusive_tax' => $this->toBoolean(
                $this->firstValue(
                    $detail,
                    [
                        'inclusiveTax',
                        'isInclusiveTax',
                    ],
                    false
                )
            ),

            'ship_date' => $this->parseAccurateDate(
                $this->firstValue(
                    $detail,
                    [
                        'shipDate',
                        'shipmentDate',
                    ]
                )
            ),

            'payment_term_name' => $this->firstCleanValue(
                $detail,
                [
                    'paymentTerm.name',
                    'paymentTerm.paymentTermName',
                    'paymentTerm.description',
                    'paymentTermName',
                    'term.name',
                    'termName',
                ]
            )
    ?? $this->clean(
        is_string(
            $detail['paymentTerm'] ?? null
        )
            ? $detail['paymentTerm']
            : null
    ),

            'shipping_address' => $this->firstCleanValue(
                $detail,
                [
                    'toAddress',
                    'toAddress.address',
                    'toAddress.name',
                    'shipTo',
                    'shipTo.address',
                    'shipTo.name',
                    'shipToAddress',
                    'shippingAddress',
                    'deliveryAddress',
                    'deliveryAddress.address',
                ]
            )
                ?? $this->extractAddress(
                    $detail['toAddress'] ?? null
                )
                ?? $this->extractAddress(
                    $detail['shipTo'] ?? null
                ),

            'accurate_raw' => $detail,

            'last_sync_at' => $syncTime,

            'created_by' => $userId,

            'updated_by' => $userId,
        ];
    }

    /**
     * Mengambil collection detail item dari response PO.
     */
    private function extractDetailItems(
        array $detail
    ): array {
        $candidateKeys = [
            'detailItem',
            'detail',
            'details',
            'itemDetail',
        ];

        foreach ($candidateKeys as $key) {
            $candidate = $detail[$key] ?? null;

            if (is_array($candidate)) {
                return array_values(
                    $candidate
                );
            }
        }

        return [];
    }

    /**
     * Mapping satu detail item Purchase Order.
     */
    private function mapDetail(
        array $item,
        PurchaseOrder $purchaseOrder,
        array $header
    ): ?array {
        $accurateDetailId =
            $this->firstCleanValue(
                $item,
                [
                    'id',
                    'detailId',
                ]
            );

        if ($accurateDetailId === null) {
            return null;
        }

        $quantity = $this->toDecimal(
            $this->firstValue(
                $item,
                [
                    'quantity',
                    'qty',
                    'unitQuantity',
                ],
                0
            )
        );

        $unitPrice = $this->toDecimal(
            $this->firstValue(
                $item,
                [
                    'unitPrice',
                    'price',
                    'itemUnitPrice',
                    'unitCost',
                    'cost',
                    'item.price',
                ],
                0
            )
        );

        $discountPercent = $this->toDecimal(
            $this->firstValue(
                $item,
                [
                    'discountPercent',
                    'discountPct',
                    'discountRate',
                ],
                0
            )
        );

        $discountAmount = $this->toDecimal(
            $this->firstValue(
                $item,
                [
                    'discountAmount',
                    'discountValue',
                    'discount',
                ],
                0
            )
        );

        $calculatedLineTotal = (
            $quantity * $unitPrice
        ) - $discountAmount;

        $lineTotal = $this->toDecimal(
            $this->firstValue(
                $item,
                [
                    'totalPrice',
                    'totalAmount',
                    'netAmount',
                    'amount',
                    'total',
                ],
                $calculatedLineTotal
            )
        );

        return [
            'purchase_order_id' => $purchaseOrder->id,

            'accurate_detail_id' => $accurateDetailId,

            'accurate_po_id' => $header['accurate_id'],

            'po_number' => $header['po_number'],

            'pr_number' => $header['pr_number'],

            'mr_number' => $header['mr_number'],

            'item_no' => $this->firstCleanValue(
                $item,
                [
                    'item.no',
                    'item.itemNo',
                    'item.code',
                    'itemCode',
                    'itemNo',
                    'no',
                ]
            ),

            'item_name' => $this->firstCleanValue(
                $item,
                [
                    'item.name',
                    'item.itemName',
                    'itemName',
                    'name',
                ]
            ),

            'item_description' => $this->firstCleanValue(
                $item,
                [
                    'item.description',
                    'itemDescription',
                    'description',
                    'detailNotes',
                    'notes',
                ]
            ),

            'quantity' => $quantity,

            'unit_price' => $unitPrice,

            'line_total' => $lineTotal,

            'unit_name' => $this->firstCleanValue(
                $item,
                [
                    'itemUnit.name',
                    'itemUnit.unitName',
                    'unit.name',
                    'unitName',
                    'uom',
                ]
            ),

            'warehouse_accurate_id' => $this->firstCleanValue(
                $item,
                [
                    'warehouse.id',
                    'warehouseId',
                ]
            ),

            'warehouse_name' => $this->firstCleanValue(
                $item,
                [
                    'warehouse.name',
                    'warehouseName',
                ]
            ),

            'is_closed' => $this->toBoolean(
                $this->firstValue(
                    $item,
                    [
                        'closed',
                        'closeOrder',
                        'isClosed',
                    ],
                    false
                )
            ),

            'department_name' => $this->firstCleanValue(
                $item,
                [
                    'department.name',
                    'departmentName',
                ]
            ),

            'project_name' => $this->firstCleanValue(
                $item,
                [
                    'project.name',
                    'projectName',
                ]
            )
                ?? $header['project_name'],

            'remarks' => $this->firstCleanValue(
                $item,
                [
                    'detailNotes',
                    'remarks',
                    'notes',
                ]
            ),

            'trans_date' => $header['trans_date'],

            'accurate_raw' => $item,
        ];
    }

    /**
     * Mengambil nomor Purchase Requisition dari berbagai bentuk response.
     */
    private function extractPrNumber(
        array $detail
    ): ?string {
        $prNumber = $this->firstCleanValue(
            $detail,
            [
                'purchaseRequisition.number',
                'purchaseRequisition.no',
                'purchaseRequisition.name',
                'purchaseRequisitionNumber',
                'prNumber',
            ]
        );

        if ($prNumber !== null) {
            return $prNumber;
        }

        $purchaseRequisition =
            $detail['purchaseRequisition']
            ?? null;

        if (
            is_string($purchaseRequisition) ||
            is_numeric($purchaseRequisition)
        ) {
            return $this->clean(
                $purchaseRequisition
            );
        }

        if (is_array($purchaseRequisition)) {
            return $this->firstCleanValue(
                $purchaseRequisition,
                [
                    'number',
                    'no',
                    'name',
                ]
            );
        }

        return null;
    }

    /**
     * Fallback nomor PR berdasarkan nomor MR.
     *
     * Method ini tidak menyebabkan error jika tabel dbpr
     * belum tersedia.
     */
    private function findPrNumberByMrNumber(
        string $mrNumber
    ): ?string {
        try {
            if (! Schema::hasTable('dbpr')) {
                return null;
            }

            if (
                ! Schema::hasColumn(
                    'dbpr',
                    'mr_number'
                ) ||
                ! Schema::hasColumn(
                    'dbpr',
                    'pr_number'
                )
            ) {
                return null;
            }

            $prNumber = DB::table('dbpr')
                ->where(
                    'mr_number',
                    $mrNumber
                )
                ->whereNotNull(
                    'pr_number'
                )
                ->where(
                    'pr_number',
                    '<>',
                    ''
                )
                ->orderByDesc('id')
                ->value('pr_number');

            return $this->clean(
                $prNumber
            );
        } catch (Throwable $exception) {
            report($exception);

            return null;
        }
    }

    private function extractAddress(
        mixed $value
    ): ?string {
        if ($value === null) {
            return null;
        }

        if (
            is_string($value) ||
            is_numeric($value)
        ) {
            return $this->clean($value);
        }

        if (! is_array($value)) {
            return null;
        }

        $directValue = $this->firstCleanValue(
            $value,
            [
                'address',
                'name',
                'description',
                'fullAddress',
            ]
        );

        if ($directValue !== null) {
            return $directValue;
        }

        $parts = [
            $this->clean(
                $value['street'] ?? null
            ),
            $this->clean(
                $value['city'] ?? null
            ),
            $this->clean(
                $value['province'] ?? null
            ),
            $this->clean(
                $value['country'] ?? null
            ),
            $this->clean(
                $value['zipcode'] ?? null
            ),
        ];

        $parts = array_values(
            array_filter(
                $parts,
                static fn (
                    ?string $part
                ): bool => $part !== null
            )
        );

        return $parts !== []
            ? implode(', ', $parts)
            : null;
    }

    /**
     * Validasi tanggal sinkronisasi.
     */
    private function validateDateRange(
        string $startDate,
        string $endDate
    ): array {
        try {
            $start = Carbon::createFromFormat(
                'Y-m-d',
                $startDate
            )->startOfDay();

            $end = Carbon::createFromFormat(
                'Y-m-d',
                $endDate
            )->startOfDay();
        } catch (Throwable) {
            throw new RuntimeException(
                'Format tanggal sinkronisasi harus Y-m-d.'
            );
        }

        if ($end->lt($start)) {
            throw new RuntimeException(
                'Tanggal akhir tidak boleh lebih kecil dari tanggal awal.'
            );
        }

        return [
            'start_date' => $start->format('Y-m-d'),

            'end_date' => $end->format('Y-m-d'),
        ];
    }

    /**
     * Mengubah tanggal Accurate menjadi format Y-m-d.
     */
    private function parseAccurateDate(
        mixed $value
    ): ?string {
        $date = $this->clean($value);

        if ($date === null) {
            return null;
        }

        $formats = [
            'd/m/Y',
            'Y-m-d',
            'd-m-Y',
            'Y/m/d',
            'd/m/Y H:i:s',
            'Y-m-d H:i:s',
        ];

        foreach ($formats as $format) {
            try {
                $parsed = Carbon::createFromFormat(
                    $format,
                    $date
                );

                if ($parsed !== false) {
                    return $parsed->format(
                        'Y-m-d'
                    );
                }
            } catch (Throwable) {
                // Lanjut mencoba format berikutnya.
            }
        }

        try {
            return Carbon::parse(
                $date
            )->format('Y-m-d');
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Mengambil nilai pertama dari path yang tersedia.
     */
    private function firstValue(
        array $data,
        array $paths,
        mixed $default = null
    ): mixed {
        foreach ($paths as $path) {
            $value = data_get(
                $data,
                $path
            );

            if (
                $value !== null &&
                $value !== ''
            ) {
                return $value;
            }
        }

        return $default;
    }

    /**
     * Mengambil dan membersihkan nilai pertama dari beberapa path.
     */
    private function firstCleanValue(
        array $data,
        array $paths
    ): ?string {
        $value = $this->firstValue(
            $data,
            $paths
        );

        return $this->clean($value);
    }

    /**
     * Membersihkan nilai string dari response Accurate.
     */
    private function clean(
        mixed $value
    ): ?string {
        if ($value === null) {
            return null;
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        if (
            is_array($value) ||
            is_object($value)
        ) {
            $encoded = json_encode(
                $value,
                JSON_UNESCAPED_UNICODE |
                JSON_UNESCAPED_SLASHES
            );

            return $encoded !== false
                ? $encoded
                : null;
        }

        $cleaned = trim(
            (string) $value
        );

        return $cleaned !== ''
            ? $cleaned
            : null;
    }

    /**
     * Mengubah nilai Accurate menjadi angka decimal.
     */
    private function toDecimal(
        mixed $value
    ): float {
        if ($value === null || $value === '') {
            return 0.0;
        }

        if (is_int($value) || is_float($value)) {
            return round(
                (float) $value,
                6
            );
        }

        $normalized = trim(
            (string) $value
        );

        if ($normalized === '') {
            return 0.0;
        }

        /*
         * Menghapus karakter nonangka selain minus,
         * titik, dan koma.
         */
        $normalized = preg_replace(
            '/[^0-9,\.\-]/',
            '',
            $normalized
        ) ?? '';

        if ($normalized === '') {
            return 0.0;
        }

        $hasComma = str_contains(
            $normalized,
            ','
        );

        $hasDot = str_contains(
            $normalized,
            '.'
        );

        if ($hasComma && $hasDot) {
            $lastComma = strrpos(
                $normalized,
                ','
            );

            $lastDot = strrpos(
                $normalized,
                '.'
            );

            if (
                $lastComma !== false &&
                $lastDot !== false &&
                $lastComma > $lastDot
            ) {
                /*
                 * Format seperti 1.250.000,50
                 */
                $normalized = str_replace(
                    '.',
                    '',
                    $normalized
                );

                $normalized = str_replace(
                    ',',
                    '.',
                    $normalized
                );
            } else {
                /*
                 * Format seperti 1,250,000.50
                 */
                $normalized = str_replace(
                    ',',
                    '',
                    $normalized
                );
            }
        } elseif ($hasComma) {
            /*
             * Anggap koma sebagai decimal separator.
             */
            $normalized = str_replace(
                ',',
                '.',
                $normalized
            );
        }

        if (! is_numeric($normalized)) {
            return 0.0;
        }

        return round(
            (float) $normalized,
            6
        );
    }

    private function toBoolean(
        mixed $value
    ): bool {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        $normalized = mb_strtolower(
            trim((string) $value)
        );

        return in_array(
            $normalized,
            [
                'true',
                '1',
                'yes',
                'y',
                'ya',
                'closed',
            ],
            true
        );
    }

    /**
     * Mengambil pesan error dari response Accurate.
     */
    private function extractErrorMessage(
        array $json,
        string $fallback
    ): string {
        $error = $json['d']
            ?? $json['message']
            ?? $json['error']
            ?? null;

        if (is_array($error)) {
            $messages = [];

            array_walk_recursive(
                $error,
                static function (
                    mixed $value
                ) use (&$messages): void {
                    if (
                        is_scalar($value) &&
                        trim((string) $value) !== ''
                    ) {
                        $messages[] =
                            trim((string) $value);
                    }
                }
            );

            if ($messages !== []) {
                return implode(
                    ' | ',
                    array_values(
                        array_unique($messages)
                    )
                );
            }
        }

        if (
            is_string($error) &&
            trim($error) !== ''
        ) {
            return trim($error);
        }

        return $fallback;
    }

    /**
     * Membatasi daftar error agar response flash tidak terlalu besar.
     */
    private function appendError(
        array &$statistics,
        string $message
    ): void {
        if (
            count($statistics['errors']) >= 20
        ) {
            return;
        }

        $statistics['errors'][] = $message;
    }
}
