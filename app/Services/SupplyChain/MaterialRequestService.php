<?php

namespace App\Services\SupplyChain;

use App\Enums\MaterialRequestStatus;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MaterialRequestService
{
    public function __construct(
        private readonly MaterialRequestNumberService $numberService
    ) {}

    public function create(
        array $data,
        int $userId
    ): MaterialRequest {
        return DB::transaction(function () use (
            $data,
            $userId
        ): MaterialRequest {
            $items = $data['items'] ?? [];

            unset($data['items']);

            $materialRequest = MaterialRequest::query()
                ->create([
                    ...$data,

                    'mr_number' => $this->numberService->generate(),

                    'requested_by' => $userId,

                    'status' => MaterialRequestStatus::Draft,

                    'current_approval_sequence' => null,

                    'created_by' => $userId,

                    'updated_by' => $userId,
                ]);

            foreach ($items as $item) {
                $materialRequest->items()->create(
                    $this->prepareItemPayload($item)
                );
            }

            $this->writeLog(
                materialRequest: $materialRequest,
                userId: $userId,
                action: 'CREATED',
                fromStatus: null,
                toStatus: 'DRAFT'
            );

            return $materialRequest->load([
                'requester',
                'department',
                'company',
                'items',
            ]);
        });
    }

    public function update(
        MaterialRequest $materialRequest,
        array $data,
        int $userId
    ): MaterialRequest {
        $this->ensureEditable($materialRequest);

        return DB::transaction(function () use (
            $materialRequest,
            $data,
            $userId
        ): MaterialRequest {
            $items = $data['items'] ?? [];

            unset($data['items']);

            $oldStatus = $materialRequest->status;

            if (is_object($oldStatus)) {
                $oldStatus = $oldStatus->value;
            }

            $materialRequest->update([
                ...$data,
                'updated_by' => $userId,
            ]);

            /*
             * Saat status masih DRAFT atau REVISION,
             * detail item aman dibuat ulang.
             */
            $materialRequest->items()->delete();

            foreach ($items as $item) {
                $materialRequest->items()->create(
                    $this->prepareItemPayload($item)
                );
            }

            $this->writeLog(
                materialRequest: $materialRequest,
                userId: $userId,
                action: 'UPDATED',
                fromStatus: $oldStatus,
                toStatus: $oldStatus
            );

            return $materialRequest->refresh()->load([
                'requester',
                'department',
                'company',
                'items',
            ]);
        });
    }

    public function delete(
        MaterialRequest $materialRequest,
        int $userId
    ): void {
        $status = $materialRequest->status;

        if (is_object($status)) {
            $status = $status->value;
        }

        if (
            $materialRequest->status
            !== MaterialRequestStatus::Draft
        ) {
            throw ValidationException::withMessages([
                'material_request' => 'Hanya Material Request berstatus DRAFT yang dapat dihapus.',
            ]);
        }

        DB::transaction(function () use (
            $materialRequest,
            $userId
        ): void {
            $this->writeLog(
                materialRequest: $materialRequest,
                userId: $userId,
                action: 'DELETED',
                fromStatus: 'DRAFT',
                toStatus: null
            );

            $materialRequest->delete();
        });
    }

    private function ensureEditable(
        MaterialRequest $materialRequest
    ): void {
        if (! in_array(
            $materialRequest->status,
            [
                MaterialRequestStatus::Draft,
                MaterialRequestStatus::Revision,
            ],
            true
        )) {
            throw ValidationException::withMessages([
                'material_request' => 'Material Request hanya dapat diedit saat berstatus DRAFT atau REVISION.',
            ]);
        }
    }

    private function prepareItemPayload(
        array $item
    ): array {
        return [
            'item_master_id' => $item['item_master_id'] ?? null,

            'item_code' => $item['item_code'],

            'part_number' => $item['part_number'] ?? null,

            'description' => $item['description'],

            'brand' => $item['brand'] ?? null,

            'uom' => $item['uom'] ?? null,

            'quantity' => $item['quantity'],

            'available_stock' => $item['available_stock'] ?? 0,

            'required_date' => $item['required_date'] ?? null,

            'suggested_vendor' => $item['suggested_vendor'] ?? null,

            'estimated_price' => $item['estimated_price'] ?? null,

            'lead_time_days' => $item['lead_time_days'] ?? null,

            'remarks' => $item['remarks'] ?? null,

            'process_status' => $item['process_status'] ?? 'PENDING',
        ];
    }

    private function writeLog(
        MaterialRequest $materialRequest,
        int $userId,
        string $action,
        ?string $fromStatus,
        ?string $toStatus,
        ?string $comments = null,
        ?array $metadata = null
    ): void {
        MaterialRequestLog::query()->create([
            'material_request_id' => $materialRequest->id,

            'user_id' => $userId,

            'action' => $action,

            'from_status' => $fromStatus,

            'to_status' => $toStatus,

            'comments' => $comments,

            'metadata' => $metadata,
        ]);
    }
}
