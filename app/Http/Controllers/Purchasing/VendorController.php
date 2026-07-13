<?php

namespace App\Http\Controllers\Purchasing;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Services\Accurate\VendorSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class VendorController extends Controller
{
    public function index(
        Request $request
    ): Response {
        $search = $request
            ->string('search')
            ->trim()
            ->toString();

        $status = $request
            ->string('status')
            ->trim()
            ->toString();

        $contact = $request
            ->string('contact')
            ->trim()
            ->toString();

        $perPage = (int) $request->input(
            'per_page',
            10
        );

        if (
            ! in_array(
                $perPage,
                [10, 25, 50, 100],
                true
            )
        ) {
            $perPage = 10;
        }

        $vendors = Vendor::query()
            ->when(
                $search !== '',
                function ($query) use ($search) {
                    $query->where(
                        function ($subQuery) use ($search) {
                            $subQuery
                                ->where(
                                    'vendor_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'vendor_no',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'accurate_id',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'category_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'email',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'phone',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'mobile_phone',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'npwp_no',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'contact_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'address',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'street',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'city',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'province',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
                }
            )
            ->when(
                $status === 'active',
                fn ($query) => $query->where(
                    'is_active',
                    true
                )
            )
            ->when(
                $status === 'inactive',
                fn ($query) => $query->where(
                    'is_active',
                    false
                )
            )
            ->when(
                $contact === 'email',
                fn ($query) => $query
                    ->whereNotNull('email')
                    ->where('email', '<>', '')
            )
            ->when(
                $contact === 'phone',
                function ($query) {
                    $query->where(
                        function ($contactQuery) {
                            $contactQuery
                                ->where(
                                    function ($phoneQuery) {
                                        $phoneQuery
                                            ->whereNotNull('phone')
                                            ->where(
                                                'phone',
                                                '<>',
                                                ''
                                            );
                                    }
                                )
                                ->orWhere(
                                    function ($mobileQuery) {
                                        $mobileQuery
                                            ->whereNotNull(
                                                'mobile_phone'
                                            )
                                            ->where(
                                                'mobile_phone',
                                                '<>',
                                                ''
                                            );
                                    }
                                );
                        }
                    );
                }
            )
            ->when(
                $contact === 'no_contact',
                function ($query) {
                    $query
                        ->where(
                            function ($emailQuery) {
                                $emailQuery
                                    ->whereNull('email')
                                    ->orWhere('email', '');
                            }
                        )
                        ->where(
                            function ($phoneQuery) {
                                $phoneQuery
                                    ->whereNull('phone')
                                    ->orWhere('phone', '');
                            }
                        )
                        ->where(
                            function ($mobileQuery) {
                                $mobileQuery
                                    ->whereNull('mobile_phone')
                                    ->orWhere(
                                        'mobile_phone',
                                        ''
                                    );
                            }
                        );
                }
            )
            ->orderByDesc('is_active')
            ->orderBy('vendor_name')
            ->paginate($perPage)
            ->withQueryString();

        $summary = [
            'total' => Vendor::query()->count('*'),

            'active' => Vendor::query()
                ->where('is_active', true)
                ->count(),

            'inactive' => Vendor::query()
                ->where('is_active', false)
                ->count(),

            'with_email' => Vendor::query()
                ->where('email', '!=', null)
                ->where('email', '<>', '')
                ->count(),

            'with_phone' => Vendor::query()
                ->where(
                    function ($query) {
                        $query
                            ->where(
                                function ($phoneQuery) {
                                    $phoneQuery
                                        ->whereNotNull('phone')
                                        ->where(
                                            'phone',
                                            '<>',
                                            ''
                                        );
                                }
                            )
                            ->orWhere(
                                function ($mobileQuery) {
                                    $mobileQuery
                                        ->whereNotNull(
                                            'mobile_phone'
                                        )
                                        ->where(
                                            'mobile_phone',
                                            '<>',
                                            ''
                                        );
                                }
                            );
                    }
                )
                ->count(),
        ];

        $lastSyncAt = Vendor::query()
            ->max('last_sync_at');

        return Inertia::render(
            'purchasing/vendor/Index',
            [
                'vendors' => $vendors,

                'summary' => $summary,

                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'contact' => $contact,
                    'per_page' => $perPage,
                ],

                'lastSyncAt' => $lastSyncAt,
            ]
        );
    }

    public function sync(
        Request $request,
        VendorSyncService $syncService
    ): RedirectResponse {
        try {
            $user = $request->user('web');

            $result = $syncService->sync(
                $user?->id
            );

            return redirect()
                ->route('purchasing.vendor.index')
                ->with(
                    'success',
                    'Sinkronisasi vendor berhasil.'
                )
                ->with(
                    'sync_result',
                    $result
                );
        } catch (Throwable $exception) {
            report($exception);

            return redirect()
                ->route('purchasing.vendor.index')
                ->with(
                    'error',
                    'Sinkronisasi vendor gagal: '
                    .$exception->getMessage()
                );
        }
    }
}
