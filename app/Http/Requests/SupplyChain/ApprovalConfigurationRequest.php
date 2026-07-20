<?php

namespace App\Http\Requests\SupplyChain;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApprovalConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'document_type' => strtoupper(trim((string) $this->input('document_type'))),
            'action_type' => strtoupper(trim((string) $this->input('action_type'))),
            'is_required' => $this->boolean('is_required'),
            'is_active' => $this->boolean('is_active'),
        ]);
    }

    public function rules(): array
    {
        $routeId = $this->route('approvalConfiguration')?->id;

        return [
            'document_type' => ['required', 'string', 'max:30', Rule::in(['MR', 'PR', 'PO'])],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'sequence' => [
                'required',
                'integer',
                'min:1',
                'max:99',
                Rule::unique('document_approval_routes', 'sequence')
                    ->where(fn ($query) => $query
                        ->where('document_type', $this->input('document_type'))
                        ->where('department_id', $this->input('department_id')))
                    ->ignore($routeId),
            ],
            'action_type' => ['required', 'string', Rule::in(['REVIEW', 'APPROVE'])],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'is_required' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'sequence.unique' => 'Sequence tersebut sudah digunakan untuk document type dan department yang sama.',
        ];
    }
}
