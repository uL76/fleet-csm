<?php

namespace App\Services\SupplyChain;

use App\Models\MaterialRequest;
use Illuminate\Support\Facades\DB;

class MaterialRequestNumberService
{
    public function generate(): string
    {
        return DB::transaction(function (): string {
            $year = now()->format('Y');
            $prefix = "MR-{$year}-";

            $lastMaterialRequest = MaterialRequest::query()
                ->withTrashed()
                ->where(
                    'mr_number',
                    'like',
                    "{$prefix}%"
                )
                ->lockForUpdate()
                ->orderByDesc('id')
                ->first();

            $lastSequence = 0;

            if ($lastMaterialRequest) {
                $lastSequence = (int) substr(
                    $lastMaterialRequest->mr_number,
                    -6
                );
            }

            return sprintf(
                '%s%06d',
                $prefix,
                $lastSequence + 1
            );
        });
    }
}
