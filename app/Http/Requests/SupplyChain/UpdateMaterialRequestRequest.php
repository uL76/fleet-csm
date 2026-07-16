<?php

namespace App\Http\Requests\SupplyChain;

use Illuminate\Validation\Rule;

class UpdateMaterialRequestRequest extends StoreMaterialRequestRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $items = collect($this->input('items', []))
            ->map(function (array $item): array {
                return [
                    ...$item,
                    'item_master_id' => $item['item_master_id'] ?? null,
                    'item_code' => trim((string) ($item['item_code'] ?? '')),
                    'part_number' => $this->nullableString(
                        $item['part_number'] ?? null
                    ),
                    'description' => trim(
                        (string) ($item['description'] ?? '')
                    ),
                    'brand' => $this->nullableString(
                        $item['brand'] ?? null
                    ),
                    'uom' => $this->nullableString(
                        $item['uom'] ?? null
                    ),
                    'quantity' => $item['quantity'] ?? null,
                    'available_stock' => $item['available_stock'] ?? 0,
                    'required_date' => $item['required_date'] ?? null,
                    'suggested_vendor' => $this->nullableString(
                        $item['suggested_vendor'] ?? null
                    ),
                    'estimated_price' => $item['estimated_price'] ?? null,
                    'lead_time_days' => $item['lead_time_days'] ?? null,
                    'remarks' => $this->nullableString(
                        $item['remarks'] ?? null
                    ),
                ];
            })
            ->values()
            ->all();

        $this->merge([
            'branch' => $this->nullableString(
                $this->input('branch')
            ),
            'customer_name' => $this->nullableString(
                $this->input('customer_name')
            ),
            'sales_order_no' => $this->nullableString(
                $this->input('sales_order_no')
            ),
            'reference_rfq' => $this->nullableString(
                $this->input('reference_rfq')
            ),
            'subject' => trim(
                (string) $this->input('subject', '')
            ),
            'remarks' => $this->nullableString(
                $this->input('remarks')
            ),
            'items' => $items,
        ]);
    }

    public function rules(): array
    {
        return [
            'mr_date' => [
                'required',
                'date',
            ],

            'department_id' => [
                'required',
                'integer',
                Rule::exists('departments', 'id')
                    ->where('is_active', true),
            ],

            'company_id' => [
                'nullable',
                'integer',
                Rule::exists('companies', 'id')
                    ->where('is_active', true),
            ],

            'branch' => [
                'nullable',
                'string',
                'max:100',
            ],

            'priority' => [
                'required',
                Rule::in([
                    'EMERGENCY',
                    'HIGH',
                    'MEDIUM',
                    'LOW',
                ]),
            ],

            'required_date' => [
                'nullable',
                'date',
                'after_or_equal:mr_date',
            ],

            'request_type' => [
                'required',
                Rule::in([
                    'STOCK_REPLENISHMENT',
                    'CUSTOMER_ORDER',
                    'OFFICE_SUPPLY',
                    'OTHER',
                ]),
            ],

            'customer_name' => [
                'nullable',
                'string',
                'max:150',
            ],

            'sales_order_no' => [
                'nullable',
                'string',
                'max:100',
            ],

            'reference_rfq' => [
                'nullable',
                'string',
                'max:100',
            ],

            'subject' => [
                'required',
                'string',
                'max:255',
            ],

            'remarks' => [
                'nullable',
                'string',
                'max:5000',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.item_master_id' => [
                'nullable',
                'integer',
                'exists:item_masters,id',
            ],

            'items.*.item_code' => [
                'required',
                'string',
                'max:100',
            ],

            'items.*.part_number' => [
                'nullable',
                'string',
                'max:150',
            ],

            'items.*.description' => [
                'required',
                'string',
                'max:255',
            ],

            'items.*.brand' => [
                'nullable',
                'string',
                'max:100',
            ],

            'items.*.uom' => [
                'nullable',
                'string',
                'max:50',
            ],

            'items.*.quantity' => [
                'required',
                'numeric',
                'gt:0',
                'max:999999999999.99',
            ],

            'items.*.available_stock' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'items.*.required_date' => [
                'nullable',
                'date',
            ],

            'items.*.suggested_vendor' => [
                'nullable',
                'string',
                'max:150',
            ],

            'items.*.estimated_price' => [
                'nullable',
                'numeric',
                'min:0',
                'max:9999999999999999.99',
            ],

            'items.*.lead_time_days' => [
                'nullable',
                'integer',
                'min:0',
                'max:3650',
            ],

            'items.*.remarks' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'mr_date.required' => 'Tanggal MR wajib diisi.',

            'department_id.required' => 'Department wajib dipilih.',

            'department_id.exists' => 'Department tidak valid atau sudah tidak aktif.',

            'priority.required' => 'Priority wajib dipilih.',

            'request_type.required' => 'Request type wajib dipilih.',

            'required_date.after_or_equal' => 'Required date tidak boleh lebih awal dari tanggal MR.',

            'subject.required' => 'Subject MR wajib diisi.',

            'items.required' => 'Material Request harus memiliki minimal satu item.',

            'items.min' => 'Material Request harus memiliki minimal satu item.',

            'items.*.item_code.required' => 'Item code wajib diisi.',

            'items.*.description.required' => 'Description item wajib diisi.',

            'items.*.quantity.required' => 'Quantity item wajib diisi.',

            'items.*.quantity.gt' => 'Quantity item harus lebih besar dari 0.',

            'items.*.available_stock.min' => 'Available stock tidak boleh negatif.',

            'items.*.estimated_price.min' => 'Estimated price tidak boleh negatif.',

            'items.*.lead_time_days.min' => 'Lead time tidak boleh negatif.',
        ];
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
