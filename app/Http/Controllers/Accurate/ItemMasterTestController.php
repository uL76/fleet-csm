<?php

namespace App\Http\Controllers\Accurate;

use App\Http\Controllers\Controller;
use App\Services\Accurate\AccurateClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class ItemMasterTestController extends Controller
{
    public function __construct(
        private readonly AccurateClient $accurateClient
    ) {}

    public function testList(Request $request): JsonResponse
    {
        try {
            $response = $this->accurateClient->get(
                'item/list.do',
                [
                    'fields' => implode(',', [
                        'id',
                        'no',
                        'name',
                        'charField1',
                        'unit',
                        'unitName',
                    ]),

                    'sp.page' => 1,
                    'sp.pageSize' => 10,
                ]
            );

            $json = $response->json();

            return response()->json([
                'success' => $response->successful(),
                'http_status' => $response->status(),
                'response' => $json,
            ], $response->successful() ? 200 : 500);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 500);
        }
    }

    public function testDetail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'no' => ['required', 'string', 'max:100'],
        ]);

        try {
            $response = $this->accurateClient->get(
                'item/detail.do',
                [
                    'no' => $validated['no'],
                ]
            );

            $json = $response->json();
            $detail = data_get($json, 'd', []);

            return response()->json([
                'success' => $response->successful()
                    && data_get($json, 's') === true,

                'http_status' => $response->status(),

                'requested_item_no' => $validated['no'],

                'mapping_preview' => [
                    'accurate_id' => data_get($detail, 'id'),

                    'item_code' => data_get($detail, 'no'),

                    'part_number' => data_get(
                        $detail,
                        'charField1'
                    ),

                    'item_description' => data_get(
                        $detail,
                        'name'
                    ),

                    'unit_name' => $this->getUnitName(
                        $detail
                    ),
                ],

                'raw_detail' => $detail,

                'full_response' => $json,
            ], $response->successful() ? 200 : 500);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 500);
        }
    }

    private function getUnitName(array $item): ?string
    {
        $candidates = [
            data_get($item, 'unit.name'),
            data_get($item, 'unitName'),
            data_get($item, 'unit1.name'),
            data_get($item, 'detailUnit.name'),
        ];

        foreach ($candidates as $candidate) {
            if (
                is_string($candidate)
                && trim($candidate) !== ''
            ) {
                return trim($candidate);
            }
        }

        return null;
    }
}
