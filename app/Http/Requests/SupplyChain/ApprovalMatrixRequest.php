<?php

namespace App\Http\Requests\SupplyChain;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApprovalMatrixRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $steps = collect($this->input('steps', []))
            ->map(function (array $step): array {
                return [
                    'sequence' => (int) ($step['sequence'] ?? 0),
                    'action_type' => strtoupper(
                        trim((string) ($step['action_type'] ?? ''))
                    ),
                    'is_required' => filter_var(
                        $step['is_required'] ?? true,
                        FILTER_VALIDATE_BOOLEAN
                    ),
                    'is_active' => filter_var(
                        $step['is_active'] ?? true,
                        FILTER_VALIDATE_BOOLEAN
                    ),
                    'user_ids' => collect($step['user_ids'] ?? [])
                        ->map(fn ($id) => (int) $id)
                        ->filter()
                        ->unique()
                        ->values()
                        ->all(),
                ];
            })
            ->sortBy('sequence')
            ->values()
            ->all();

        $this->merge([
            'document_type' => strtoupper(
                trim((string) $this->input('document_type', 'MR'))
            ),
            'steps' => $steps,
        ]);
    }

    public function rules(): array
    {
        return [
            'document_type' => [
                'required',
                'string',
                Rule::in(['MR', 'PR', 'PO']),
            ],
            'steps' => ['present', 'array'],
            'steps.*.sequence' => [
                'required',
                'integer',
                'min:1',
                'distinct',
            ],
            'steps.*.action_type' => [
                'required',
                Rule::in(['REVIEW', 'APPROVE']),
            ],
            'steps.*.is_required' => ['required', 'boolean'],
            'steps.*.is_active' => ['required', 'boolean'],
            'steps.*.user_ids' => ['required', 'array', 'min:1'],
            'steps.*.user_ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:users,id',
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $steps = collect($this->input('steps', []));

            if ($steps->isEmpty()) {
                return;
            }

            $activeSteps = $steps
                ->where('is_active', true)
                ->sortBy('sequence')
                ->values();

            if ($activeSteps->isEmpty()) {
                $validator->errors()->add(
                    'steps',
                    'Minimal harus ada satu approval step aktif.'
                );
                return;
            }

            $firstAction = $activeSteps->first()['action_type'] ?? null;
            if ($firstAction !== 'REVIEW') {
                $validator->errors()->add(
                    'steps',
                    'Step aktif pertama Material Request harus REVIEW.'
                );
            }

            $approveIndex = $activeSteps->search(
                fn ($step) => ($step['action_type'] ?? null) === 'APPROVE'
            );

            if ($approveIndex !== false) {
                $reviewBeforeApprove = $activeSteps
                    ->take($approveIndex)
                    ->contains(
                        fn ($step) => ($step['action_type'] ?? null) === 'REVIEW'
                    );

                if (! $reviewBeforeApprove) {
                    $validator->errors()->add(
                        'steps',
                        'APPROVE tidak boleh berada sebelum REVIEW.'
                    );
                }
            }
        });
    }
}
