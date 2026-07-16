<?php

namespace App\Services\Accurate;

use App\Models\PurchaseRequisition;
use App\Models\PurchaseRequisitionDetail;
use Carbon\Carbon;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class PurchaseRequisitionSyncService
{
    public function __construct(
        private readonly AccurateClient $client
    ) {}

    public function sync(string $startDate, string $endDate, ?int $userId = null): array
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        if ($start->greaterThan($end)) {
            throw new RuntimeException('Tanggal mulai tidak boleh lebih besar dari tanggal selesai.');
        }

        $result = [
            'total_list' => 0,
            'processed' => 0,
            'inserted' => 0,
            'updated' => 0,
            'detail_inserted' => 0,
            'detail_updated' => 0,
            'detail_deleted' => 0,
            'failed' => 0,
            'errors' => [],
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'synced_at' => now()->toDateTimeString(),
        ];

        $page = 1;
        $pageCount = 1;

        do {
            $listResponse = $this->client->get('purchase-requisition/list.do', [
                'filter.transDate.op' => 'BETWEEN',
                'filter.transDate.val[0]' => $start->format('d/m/Y'),
                'filter.transDate.val[1]' => $end->format('d/m/Y'),
                'sp.pageSize' => 100,
                'sp.page' => $page,
            ]);

            $listData = $this->assertSuccessful(
                $listResponse,
                'Gagal mengambil daftar Purchase Requisition.'
            );

            $rows = Arr::get($listData, 'd', []);
            $result['total_list'] += count($rows);
            $pageCount = max(1, (int) Arr::get($listData, 'sp.pageCount', 1));

            foreach ($rows as $listRow) {
                $accurateId = Arr::get($listRow, 'id');

                if (! $accurateId) {
                    $result['failed']++;
                    $this->pushError($result, 'PR pada response list tidak memiliki ID Accurate.');

                    continue;
                }

                try {
                    $detailResponse = $this->client->get('purchase-requisition/detail.do', [
                        'id' => $accurateId,
                    ]);

                    $detailData = $this->assertSuccessful(
                        $detailResponse,
                        "Gagal mengambil detail PR Accurate ID {$accurateId}."
                    );

                    $detail = Arr::get($detailData, 'd', []);
                    $this->savePurchaseRequisition($detail, $userId, $result);
                    $result['processed']++;
                } catch (Throwable $exception) {
                    $result['failed']++;
                    $this->pushError($result, $exception->getMessage());

                    Log::error('Purchase Requisition Accurate sync failed', [
                        'accurate_id' => $accurateId,
                        'message' => $exception->getMessage(),
                        'exception' => $exception,
                    ]);
                }
            }

            $page++;
        } while ($page <= $pageCount);

        return $result;
    }

    private function savePurchaseRequisition(array $detail, ?int $userId, array &$result): void
    {
        $accurateId = $this->nullableInteger(Arr::get($detail, 'id'));
        $prNumber = $this->clean(Arr::get($detail, 'number'));

        if (! $accurateId || ! $prNumber) {
            throw new RuntimeException('Detail PR tidak memiliki Accurate ID atau nomor PR.');
        }

        DB::transaction(function () use ($detail, $accurateId, $prNumber, $userId, &$result): void {
            $purchaseRequisition = PurchaseRequisition::query()
                ->where('accurate_id', $accurateId)
                ->orWhere('pr_number', $prNumber)
                ->first();

            $isNew = $purchaseRequisition === null;
            $purchaseRequisition ??= new PurchaseRequisition;

            $headerData = $this->mapHeader($detail);
            $headerData['updated_by'] = $userId;

            if ($isNew) {
                $headerData['created_by'] = $userId;
            }

            $purchaseRequisition->fill($headerData);
            $purchaseRequisition->save();

            $isNew ? $result['inserted']++ : $result['updated']++;

            $retainedLocalIds = [];

            foreach ($this->detailRows($detail) as $index => $row) {
                $mapped = $this->mapDetail(
                    row: $row,
                    header: $purchaseRequisition,
                    fallbackIndex: $index
                );

                $query = PurchaseRequisitionDetail::query()
                    ->where('purchase_requisition_id', $purchaseRequisition->id);

                if ($mapped['accurate_detail_id'] !== null) {
                    $query->where('accurate_detail_id', $mapped['accurate_detail_id']);
                } else {
                    $query
                        ->whereNull('accurate_detail_id')
                        ->where('item_no', $mapped['item_no'])
                        ->where('item_name', $mapped['item_name'])
                        ->where('quantity', $mapped['quantity']);
                }

                $localDetail = $query->first();
                $detailIsNew = $localDetail === null;
                $localDetail ??= new PurchaseRequisitionDetail;
                $localDetail->fill($mapped);
                $localDetail->save();

                $retainedLocalIds[] = $localDetail->id;
                $detailIsNew
                    ? $result['detail_inserted']++
                    : $result['detail_updated']++;
            }

            $deleteQuery = $purchaseRequisition->details();

            if ($retainedLocalIds !== []) {
                $deleteQuery->whereNotIn('id', $retainedLocalIds);
            }

            $result['detail_deleted'] += $deleteQuery->delete();
        });
    }

    private function mapHeader(array $detail): array
    {
        return [
            'accurate_id' => $this->nullableInteger(Arr::get($detail, 'id')),
            'pr_number' => $this->clean(Arr::get($detail, 'number')),
            'pr_status' => $this->firstCleanValue($detail, ['statusName', 'status']),
            'mr_number' => $this->clean(Arr::get($detail, 'charField1')),
            'trans_date' => $this->parseDate(Arr::get($detail, 'transDate')),
            'required_date' => $this->parseDate($this->firstValue($detail, [
                'requiredDate',
                'requestDate',
                'expectedDate',
            ])),
            'requester_name' => $this->firstCleanValue($detail, [
                'requester.name',
                'employee.name',
                'requestedBy.name',
                'requesterName',
                'requestBy',
            ]),
            'department_name' => $this->firstCleanValue($detail, [
                'department.name',
                'departmentName',
            ]),
            'project_name' => $this->firstCleanValue($detail, [
                'charField5',
                'project.name',
                'projectName',
            ]),
            'asset_id' => $this->clean(Arr::get($detail, 'charField4')),
            'revision_no' => $this->clean(Arr::get($detail, 'charField10')),
            'description' => $this->firstCleanValue($detail, [
                'description',
                'notes',
                'remark',
            ]),
            'is_closed' => $this->toBoolean($this->firstValue($detail, [
                'closed',
                'closeOrder',
                'isClosed',
            ])),
            'accurate_raw' => $detail,
            'last_sync_at' => now(),
        ];
    }

    private function mapDetail(
        array $row,
        PurchaseRequisition $header,
        int $fallbackIndex
    ): array {
        return [
            'purchase_requisition_id' => $header->id,
            'accurate_detail_id' => $this->nullableInteger($this->firstValue($row, [
                'id',
                'detailId',
                'purchaseRequisitionDetailId',
            ])),
            'accurate_pr_id' => $header->accurate_id,
            'pr_number' => $header->pr_number,
            'mr_number' => $header->mr_number,
            'item_no' => $this->firstCleanValue($row, [
                'item.no',
                'item.code',
                'itemNo',
                'itemCode',
                'itemNumber',
            ]) ?? "DETAIL-{$fallbackIndex}",
            'item_name' => $this->firstCleanValue($row, [
                'item.name',
                'itemName',
                'name',
            ]),
            'item_description' => $this->firstCleanValue($row, [
                'item.description',
                'itemDescription',
                'detailName',
                'description',
            ]),
            'quantity' => $this->toDecimal($this->firstValue($row, [
                'quantity',
                'qty',
                'itemQuantity',
            ])),
            'unit_name' => $this->firstCleanValue($row, [
                'itemUnit.name',
                'unit.name',
                'unitName',
                'itemUnitName',
            ]),
            'department_name' => $this->firstCleanValue($row, [
                'department.name',
                'departmentName',
            ]),
            'project_name' => $this->firstCleanValue($row, [
                'project.name',
                'projectName',
            ]),
            'remarks' => $this->firstCleanValue($row, [
                'detailNotes',
                'remarks',
                'remark',
                'notes',
            ]),
            'trans_date' => $header->trans_date,
            'required_date' => $this->parseDate($this->firstValue($row, [
                'requiredDate',
                'requestDate',
                'expectedDate',
            ])) ?? $header->required_date,
            'is_closed' => $this->toBoolean($this->firstValue($row, [
                'closed',
                'closeOrder',
                'isClosed',
            ])),
            'accurate_raw' => $row,
        ];
    }

    private function detailRows(array $detail): array
    {
        foreach ([
            'detailItem',
            'detail',
            'details',
            'items',
            'purchaseRequisitionDetail',
            'purchaseRequisitionDetails',
            'purchaseRequisitionItem',
            'purchaseRequisitionItems',
        ] as $key) {
            $rows = Arr::get($detail, $key);

            if (is_array($rows)) {
                return array_values($rows);
            }
        }

        return [];
    }

    private function assertSuccessful(
        Response $response,
        string $message
    ): array {
        if (! $response->successful()) {
            throw new RuntimeException(
                "{$message} HTTP {$response->status()}: {$response->body()}"
            );
        }

        $responseData = $response->json();

        if (! is_array($responseData)) {
            throw new RuntimeException(
                "{$message} Response Accurate bukan JSON yang valid."
            );
        }

        if (($responseData['s'] ?? false) !== true) {
            $accurateMessage = $this->firstCleanValue($responseData, [
                'd.0',
                'message',
                'error',
            ]);

            throw new RuntimeException(
                $accurateMessage
                    ? "{$message} {$accurateMessage}"
                    : $message
            );
        }

        return $responseData;
    }

    private function firstValue(array $data, array $paths): mixed
    {
        foreach ($paths as $path) {
            $value = Arr::get($data, $path);

            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return null;
    }

    private function firstCleanValue(array $data, array $paths): ?string
    {
        return $this->clean($this->firstValue($data, $paths));
    }

    private function clean(mixed $value): ?string
    {
        if ($value === null || is_array($value) || is_object($value)) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function parseDate(mixed $value): ?string
    {
        $value = $this->clean($value);

        if (! $value) {
            return null;
        }

        foreach (['d/m/Y', 'Y-m-d', 'd-m-Y'] as $format) {
            try {
                return Carbon::createFromFormat($format, $value)->toDateString();
            } catch (Throwable) {
                // Try the next format.
            }
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (Throwable) {
            return null;
        }
    }

    private function nullableInteger(mixed $value): ?int
    {
        return is_numeric($value) ? (int) $value : null;
    }

    private function toDecimal(mixed $value): float
    {
        if (is_string($value)) {
            $value = str_replace(',', '', $value);
        }

        return is_numeric($value) ? (float) $value : 0.0;
    }

    private function toBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        return in_array(strtolower(trim((string) $value)), [
            'true',
            'yes',
            'y',
            'closed',
            'close',
        ], true);
    }

    private function pushError(array &$result, string $message): void
    {
        if (count($result['errors']) < 20) {
            $result['errors'][] = $message;
        }
    }
}
