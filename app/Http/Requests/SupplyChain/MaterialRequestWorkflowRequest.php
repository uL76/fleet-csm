<?php

namespace App\Http\Requests\SupplyChain;

use Illuminate\Foundation\Http\FormRequest;

class MaterialRequestWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $comments = trim(
            (string) $this->input('comments', '')
        );

        $this->merge([
            'comments' => $comments === ''
                ? null
                : $comments,
        ]);
    }

    public function rules(): array
    {
        return [
            'comments' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }
}
