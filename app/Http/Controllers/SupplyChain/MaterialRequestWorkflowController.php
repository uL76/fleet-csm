<?php

namespace App\Http\Controllers\SupplyChain;

use App\Http\Controllers\Controller;
use App\Http\Requests\SupplyChain\MaterialRequestWorkflowRequest;
use App\Models\MaterialRequest;
use App\Services\SupplyChain\MaterialRequestWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MaterialRequestWorkflowController extends Controller
{
    public function __construct(
        private readonly MaterialRequestWorkflowService $workflowService
    ) {}

    public function submit(
        Request $request,
        MaterialRequest $materialRequest
    ): RedirectResponse {
        $this->authorize('submit', $materialRequest);

        $this->workflowService->submit(
            $materialRequest,
            $request->user()
        );

        return back()->with(
            'success',
            'Material Request berhasil disubmit.'
        );
    }

    public function review(
        MaterialRequestWorkflowRequest $request,
        MaterialRequest $materialRequest
    ): RedirectResponse {
        $this->authorize('review', $materialRequest);

        $this->workflowService->review(
            $materialRequest,
            $request->user(),
            $request->validated('comments')
        );

        return back()->with(
            'success',
            'Material Request berhasil direview.'
        );
    }

    public function approve(
        MaterialRequestWorkflowRequest $request,
        MaterialRequest $materialRequest
    ): RedirectResponse {
        $this->authorize('approve', $materialRequest);

        $this->workflowService->approve(
            $materialRequest,
            $request->user(),
            $request->validated('comments')
        );

        return back()->with(
            'success',
            'Material Request berhasil diapprove.'
        );
    }

    public function revision(
        MaterialRequestWorkflowRequest $request,
        MaterialRequest $materialRequest
    ): RedirectResponse {
        $this->authorize('requestRevision', $materialRequest);

        $this->workflowService->requestRevision(
            $materialRequest,
            $request->user(),
            (string) $request->validated('comments')
        );

        return back()->with(
            'success',
            'Material Request dikembalikan untuk revisi.'
        );
    }

    public function reject(
        MaterialRequestWorkflowRequest $request,
        MaterialRequest $materialRequest
    ): RedirectResponse {
        $this->authorize('reject', $materialRequest);

        $this->workflowService->reject(
            $materialRequest,
            $request->user(),
            (string) $request->validated('comments')
        );

        return back()->with(
            'success',
            'Material Request berhasil ditolak.'
        );
    }
}
