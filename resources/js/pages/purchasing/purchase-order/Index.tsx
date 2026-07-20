import AppLayout from '@/layouts/tailadmin/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    FormEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import Swal from 'sweetalert2';

type PurchaseOrderDetail = {
    id: number;
    purchase_order_id: number;
    accurate_detail_id: string;
    accurate_po_id: string;
    po_number: string;
    pr_number: string | null;
    mr_number: string | null;
    item_no: string | null;
    item_name: string | null;
    item_description: string | null;
    quantity: string | number;
    unit_price: string | number;
    discount_percent: string | number;
    discount_amount: string | number;
    line_total: string | number;
    unit_name: string | null;
    warehouse_accurate_id: string | null;
    warehouse_name: string | null;
    is_closed: boolean;
    department_name: string | null;
    project_name: string | null;
    remarks: string | null;
    trans_date: string | null;
};

type PurchaseOrderRow = {
    id: number;
    accurate_id: string;
    po_number: string;
    po_status: string | null;
    vendor_no: string | null;
    vendor_name: string | null;
    mr_number: string | null;
    pr_number: string | null;
    invoice_number: string | null;
    po_subject: string | null;
    project_name: string | null;
    asset_id: string | null;
    revision_no: string | null;
    is_closed: boolean;
    trans_date: string | null;
    subtotal_amount: string | number;
    discount_amount: string | number;
    tax_amount: string | number;
    is_taxable: boolean;
    is_inclusive_tax: boolean;
    ship_date: string | null;
    payment_term_name: string | null;
    shipping_address: string | null;
    total_amount: string | number;
    total_quantity: string | number | null;
    last_sync_at: string | null;
    created_at: string;
    updated_at: string;
    details_count: number;
    details?: PurchaseOrderDetail[];
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedPurchaseOrders = {
    data: PurchaseOrderRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

type Summary = {
    total_po: number;
    total_amount: string | number;
    total_vendor: number;
    total_open: number;
};

type Filters = {
    search?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    per_page?: number;
};

type SyncResult = {
    total_list: number;
    processed?: number;
    inserted: number;
    updated: number;
    detail_inserted: number;
    detail_updated: number;
    detail_deleted?: number;
    detail_skipped?: number;
    failed: number;
    errors?: string[];
    start_date?: string;
    end_date?: string;
    synced_at: string;
};

type Flash = {
    success?: string;
    error?: string;
    sync_result?: SyncResult;
};

type PageProps = {
    purchaseOrders: PaginatedPurchaseOrders;
    summary: Summary;
    statuses: string[];
    filters: Filters;
    lastSyncAt: string | null;
    flash?: Flash;
};

function formatDate(
    value: string | null,
): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

function formatDateTime(
    value: string | null,
): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function formatCurrency(
    value: string | number | null | undefined,
): string {
    const amount = Number(value ?? 0);

    if (Number.isNaN(amount)) {
        return 'Rp 0';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatNumber(
    value: string | number | null | undefined,
    maximumFractionDigits = 4,
): string {
    const number = Number(value ?? 0);

    if (Number.isNaN(number)) {
        return '0';
    }

    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits,
    }).format(number);
}

function normalizeStatus(
    status: string | null,
): string {
    return String(status ?? '')
        .trim()
        .toLowerCase();
}

function stripHtml(
    value: string,
): string {
    if (typeof window === 'undefined') {
        return value
            .replace(/<[^>]*>/g, '')
            .replace(/&laquo;/g, '«')
            .replace(/&raquo;/g, '»')
            .replace(/&amp;/g, '&');
    }

    const element = document.createElement('textarea');

    element.innerHTML = value;

    return element.value;
}

function escapeAlertHtml(
    value: string | number | null | undefined,
): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function buildSyncResultBox(
    label: string,
    value: number,
): string {
    return `
        <div style="
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 12px;
            background: #f8fafc;
        ">
            <div style="
                color: #64748b;
                font-size: 12px;
                font-weight: 600;
            ">
                ${escapeAlertHtml(label)}
            </div>

            <div style="
                margin-top: 4px;
                color: #0f172a;
                font-size: 20px;
                font-weight: 700;
            ">
                ${Number(value ?? 0).toLocaleString(
        'id-ID',
    )}
            </div>
        </div>
    `;
}


type DatePickerFieldProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    min?: string;
    max?: string;
};

function DatePickerField({
    id,
    label,
    value,
    onChange,
    min,
    max,
}: DatePickerFieldProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const openPicker = () => {
        const input = inputRef.current;

        if (!input) {
            return;
        }

        input.focus();

        if (
            typeof input.showPicker === 'function'
        ) {
            input.showPicker();
        }
    };

    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
                {label}
            </label>

            <div className="relative">
                <input
                    ref={inputRef}
                    id={id}
                    type="date"
                    value={value}
                    min={min}
                    max={max}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                    onClick={openPicker}
                    className="h-12 w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 pr-12 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />

                <button
                    type="button"
                    onClick={openPicker}
                    aria-label={`Buka kalender ${label}`}
                    title={`Buka kalender ${label}`}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-gray-500 transition hover:bg-gray-50 hover:text-brand-600 focus:outline-none"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 5.25h13.5A1.5 1.5 0 0 1 20.25 6.75v12A1.5 1.5 0 0 1 18.75 20.25H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default function PurchaseOrderIndex() {
    const {
        purchaseOrders,
        summary,
        statuses,
        filters,
        lastSyncAt,
        flash,
    } = usePage<PageProps>().props;

    const [search, setSearch] = useState(
        filters.search ?? '',
    );

    const [status, setStatus] = useState(
        filters.status ?? '',
    );

    const [startDate, setStartDate] = useState(
        filters.start_date ?? '',
    );

    const [endDate, setEndDate] = useState(
        filters.end_date ?? '',
    );

    const [perPage, setPerPage] = useState(
        String(filters.per_page ?? 10),
    );

    const [syncing, setSyncing] = useState(false);

    const [
        selectedPurchaseOrder,
        setSelectedPurchaseOrder,
    ] = useState<PurchaseOrderRow | null>(
        null,
    );

    const summaryCards = useMemo(
        () => [
            {
                label: 'Total PO',
                displayValue:
                    summary.total_po.toLocaleString(
                        'id-ID',
                    ),
                description:
                    'Seluruh Purchase Order lokal',
                accentClass:
                    'bg-brand-50 text-brand-600',
            },
            {
                label: 'Open PO',
                displayValue:
                    summary.total_open.toLocaleString(
                        'id-ID',
                    ),
                description:
                    'Purchase Order masih terbuka',
                accentClass:
                    'bg-green-50 text-green-600',
            },
            {
                label: 'Total Vendor',
                displayValue:
                    summary.total_vendor.toLocaleString(
                        'id-ID',
                    ),
                description:
                    'Vendor unik pada Purchase Order',
                accentClass:
                    'bg-blue-50 text-blue-600',
            },
            {
                label: 'Total Nilai PO',
                displayValue: formatCurrency(
                    summary.total_amount,
                ),
                description:
                    'Akumulasi nilai seluruh PO',
                accentClass:
                    'bg-amber-50 text-amber-600',
            },
        ],
        [summary],
    );

    useEffect(() => {
        setSearch(filters.search ?? '');
        setStatus(filters.status ?? '');
        setStartDate(filters.start_date ?? '');
        setEndDate(filters.end_date ?? '');
        setPerPage(
            String(filters.per_page ?? 10),
        );
    }, [filters]);

    useEffect(() => {
        if (flash?.error) {
            void Swal.fire({
                icon: 'error',
                title: 'Sinkronisasi gagal',
                text: flash.error,
                confirmButtonText: 'Tutup',
                confirmButtonColor: '#ef4444',
            });

            return;
        }

        if (flash?.success && flash.sync_result) {
            const result = flash.sync_result;

            const errorSection =
                result.errors && result.errors.length > 0
                    ? `
                    <div style="
                        margin-top: 16px;
                        padding: 12px;
                        border-radius: 10px;
                        background: #fef2f2;
                        color: #b91c1c;
                        text-align: left;
                        font-size: 13px;
                    ">
                        <strong>Detail error:</strong>
                        <ul style="
                            margin: 8px 0 0 18px;
                        ">
                            ${result.errors
                        .map(
                            (error) =>
                                `<li>${escapeAlertHtml(
                                    error,
                                )}</li>`,
                        )
                        .join('')}
                        </ul>
                    </div>
                `
                    : '';

            void Swal.fire({
                icon:
                    result.failed > 0
                        ? 'warning'
                        : 'success',

                title:
                    result.failed > 0
                        ? 'Sinkronisasi selesai dengan catatan'
                        : 'Sinkronisasi berhasil',

                html: `
                <div style="
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                    gap: 10px;
                    margin-top: 12px;
                    text-align: left;
                ">
                    ${buildSyncResultBox(
                    'Total List',
                    result.total_list,
                )}

                    ${buildSyncResultBox(
                    'Processed',
                    result.processed ??
                    result.total_list,
                )}

                    ${buildSyncResultBox(
                    'PO Baru',
                    result.inserted,
                )}

                    ${buildSyncResultBox(
                    'PO Diperbarui',
                    result.updated,
                )}

                    ${buildSyncResultBox(
                    'Detail Baru',
                    result.detail_inserted,
                )}

                    ${buildSyncResultBox(
                    'Detail Diperbarui',
                    result.detail_updated,
                )}

                    ${buildSyncResultBox(
                    'Detail Dihapus',
                    result.detail_deleted ?? 0,
                )}

                    ${buildSyncResultBox(
                    'Gagal',
                    result.failed,
                )}
                </div>

                <div style="
                    margin-top: 14px;
                    color: #64748b;
                    font-size: 13px;
                ">
                    Selesai pada
                    ${escapeAlertHtml(
                    result.synced_at,
                )}
                </div>

                ${errorSection}
            `,

                confirmButtonText: 'Selesai',
                confirmButtonColor: '#465fff',
                width: 620,
            });

            return;
        }

        if (flash?.success) {
            void Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: flash.success,
                confirmButtonText: 'Selesai',
                confirmButtonColor: '#465fff',
            });
        }
    }, [flash]);

    const handleFilter = (
        event: FormEvent,
    ) => {
        event.preventDefault();

        router.get(
            '/purchasing/purchase-order',
            {
                search,
                status,
                start_date: startDate,
                end_date: endDate,
                per_page: perPage,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleClearFilter = () => {
        setSearch('');
        setStatus('');
        setPerPage('10');

        router.get(
            '/purchasing/purchase-order',
            {
                start_date: startDate,
                end_date: endDate,
                per_page: 10,
            },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handlePerPageChange = (
        value: string,
    ) => {
        setPerPage(value);

        router.get(
            '/purchasing/purchase-order',
            {
                search,
                status,
                start_date: startDate,
                end_date: endDate,
                per_page: value,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSync = async () => {
        if (syncing) {
            return;
        }

        if (!startDate || !endDate) {
            await Swal.fire({
                icon: 'warning',
                title: 'Periode belum lengkap',
                text: 'Tanggal awal dan tanggal akhir wajib diisi.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#465fff',
            });

            return;
        }

        if (
            new Date(endDate).getTime() <
            new Date(startDate).getTime()
        ) {
            await Swal.fire({
                icon: 'warning',
                title: 'Periode tidak valid',
                text: 'Tanggal akhir tidak boleh lebih kecil dari tanggal awal.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#465fff',
            });

            return;
        }

        const confirmation = await Swal.fire({
            icon: 'question',
            title: 'Sinkronisasi Purchase Order',
            html: `
            Sinkronkan Purchase Order dari
            <strong>${startDate}</strong>
            sampai
            <strong>${endDate}</strong>?
        `,
            showCancelButton: true,
            confirmButtonText: 'Ya, sinkronkan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#465fff',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
        });

        if (!confirmation.isConfirmed) {
            return;
        }

        router.post(
            '/purchasing/purchase-order/sync',
            {
                start_date: startDate,
                end_date: endDate,
            },
            {
                preserveScroll: true,

                onStart: () => {
                    setSyncing(true);

                    Swal.fire({
                        title: 'Sinkronisasi berjalan',
                        html: `
                        Sedang menarik data Purchase Order
                        dari Accurate Online.<br><br>
                        Mohon jangan menutup halaman ini.
                    `,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });
                },

                onFinish: () => {
                    setSyncing(false);

                    /*
                     * Modal loading ditutup.
                     * Hasil akhir akan ditampilkan melalui useEffect
                     * berdasarkan flash Laravel.
                     */
                    Swal.close();
                },

                onError: async (errors) => {
                    setSyncing(false);

                    const message = Object.values(errors)
                        .map((value) => String(value))
                        .join('<br>');

                    await Swal.fire({
                        icon: 'error',
                        title: 'Validasi gagal',
                        html:
                            message ||
                            'Data sinkronisasi tidak valid.',
                        confirmButtonText: 'Tutup',
                        confirmButtonColor: '#ef4444',
                    });
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Purchase Order Accurate" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Purchase Order Accurate
                        </h1>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Data Purchase Order yang
                            disinkronkan dari Accurate
                            Online.
                        </p>

                        <p className="mt-2 text-xs font-medium text-gray-500">
                            Last sync:{' '}
                            <span className="font-semibold text-gray-700">
                                {formatDateTime(
                                    lastSyncAt,
                                )}
                            </span>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleSync}
                        disabled={syncing}
                        className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {syncing
                            ? 'Syncing Purchase Order...'
                            : 'Sync Purchase Order'}
                    </button>
                </div>

                {flash?.success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {flash.error}
                    </div>
                )}

                {flash?.sync_result && (
                    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-base font-bold text-brand-700">
                                    Hasil Sinkronisasi
                                </h2>

                                <p className="mt-1 text-sm font-medium text-brand-600">
                                    Purchase Order Accurate
                                    diproses pada{' '}
                                    {
                                        flash.sync_result
                                            .synced_at
                                    }
                                </p>

                                {flash.sync_result
                                    .start_date &&
                                    flash.sync_result
                                        .end_date && (
                                        <p className="mt-1 text-xs font-medium text-brand-600">
                                            Periode:{' '}
                                            {
                                                flash
                                                    .sync_result
                                                    .start_date
                                            }{' '}
                                            sampai{' '}
                                            {
                                                flash
                                                    .sync_result
                                                    .end_date
                                            }
                                        </p>
                                    )}
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                            <SyncResultItem
                                label="Total List"
                                value={
                                    flash.sync_result
                                        .total_list
                                }
                            />

                            <SyncResultItem
                                label="Processed"
                                value={
                                    flash.sync_result
                                        .processed ??
                                    flash.sync_result
                                        .total_list
                                }
                            />

                            <SyncResultItem
                                label="PO Inserted"
                                value={
                                    flash.sync_result
                                        .inserted
                                }
                            />

                            <SyncResultItem
                                label="PO Updated"
                                value={
                                    flash.sync_result
                                        .updated
                                }
                            />

                            <SyncResultItem
                                label="Detail Inserted"
                                value={
                                    flash.sync_result
                                        .detail_inserted
                                }
                            />

                            <SyncResultItem
                                label="Detail Updated"
                                value={
                                    flash.sync_result
                                        .detail_updated
                                }
                            />

                            <SyncResultItem
                                label="Detail Deleted"
                                value={
                                    flash.sync_result
                                        .detail_deleted ??
                                    0
                                }
                            />

                            <SyncResultItem
                                label="Detail Skipped"
                                value={
                                    flash.sync_result
                                        .detail_skipped ??
                                    0
                                }
                            />

                            <SyncResultItem
                                label="Failed"
                                value={
                                    flash.sync_result
                                        .failed
                                }
                            />
                        </div>

                        {flash.sync_result.errors &&
                            flash.sync_result.errors
                                .length > 0 && (
                                <div className="mt-4 rounded-xl border border-red-200 bg-white p-4">
                                    <h3 className="text-sm font-bold text-red-700">
                                        Detail Error
                                    </h3>

                                    <ul className="mt-2 space-y-1 text-sm font-medium text-red-600">
                                        {flash.sync_result.errors.map(
                                            (
                                                error,
                                                index,
                                            ) => (
                                                <li
                                                    key={`${error}-${index}`}
                                                >
                                                    •{' '}
                                                    {
                                                        error
                                                    }
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            )}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <MetricCard
                            key={card.label}
                            label={card.label}
                            displayValue={
                                card.displayValue
                            }
                            description={
                                card.description
                            }
                            accentClass={
                                card.accentClass
                            }
                        />
                    ))}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <form
                        onSubmit={handleFilter}
                        className="mb-6 grid grid-cols-1 gap-3 xl:grid-cols-12"
                    >
                        <div className="xl:col-span-3">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Search
                            </label>

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target
                                            .value,
                                    )
                                }
                                placeholder="PO, MR, PR, vendor, project, asset, revision..."
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>

                        <div className="xl:col-span-2">
                            <DatePickerField
                                id="purchase-order-start-date"
                                label="Start Date"
                                value={startDate}
                                max={endDate || undefined}
                                onChange={setStartDate}
                            />
                        </div>

                        <div className="xl:col-span-2">
                            <DatePickerField
                                id="purchase-order-end-date"
                                label="End Date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={setEndDate}
                            />
                        </div>

                        <div className="xl:col-span-2">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Status
                            </label>

                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(
                                        event.target
                                            .value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="">
                                    All Status
                                </option>

                                {statuses.map(
                                    (statusItem) => (
                                        <option
                                            key={
                                                statusItem
                                            }
                                            value={
                                                statusItem
                                            }
                                        >
                                            {
                                                statusItem
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div className="xl:col-span-1">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Rows
                            </label>

                            <select
                                value={perPage}
                                onChange={(event) =>
                                    handlePerPageChange(
                                        event.target
                                            .value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="10">
                                    10
                                </option>
                                <option value="25">
                                    25
                                </option>
                                <option value="50">
                                    50
                                </option>
                                <option value="100">
                                    100
                                </option>
                            </select>
                        </div>

                        <div className="flex items-end gap-2 xl:col-span-2">
                            <button
                                type="submit"
                                className="h-12 flex-1 rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-800"
                            >
                                Search
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleClearFilter
                                }
                                className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                                Clear
                            </button>
                        </div>
                    </form>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full min-w-[1780px] table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        No
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        PO Number
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Date
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Vendor
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        MR Number
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        PR Number
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Project
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Asset
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Revision
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Subject
                                    </th>

                                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Item
                                    </th>

                                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Total Amount
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Last Sync
                                    </th>

                                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white">
                                {purchaseOrders.data
                                    .length > 0 ? (
                                    purchaseOrders.data.map(
                                        (
                                            purchaseOrder,
                                            index,
                                        ) => (
                                            <tr
                                                key={
                                                    purchaseOrder.id
                                                }
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="px-5 py-4 text-sm font-medium text-gray-600">
                                                    {(purchaseOrders.current_page -
                                                        1) *
                                                        purchaseOrders.per_page +
                                                        index +
                                                        1}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-semibold text-gray-900">
                                                        {
                                                            purchaseOrder.po_number
                                                        }
                                                    </div>

                                                    <div className="mt-1 text-xs font-medium text-gray-500">
                                                        ID:{' '}
                                                        {
                                                            purchaseOrder.accurate_id
                                                        }
                                                    </div>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-700">
                                                    {formatDate(
                                                        purchaseOrder.trans_date,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <PurchaseOrderStatusBadge
                                                        status={
                                                            purchaseOrder.po_status
                                                        }
                                                    />
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="max-w-[230px] font-semibold text-gray-900">
                                                        {purchaseOrder.vendor_name ??
                                                            '-'}
                                                    </div>

                                                    <div className="mt-1 text-xs font-medium text-gray-500">
                                                        {purchaseOrder.vendor_no ??
                                                            '-'}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {purchaseOrder.mr_number ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {purchaseOrder.pr_number ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {purchaseOrder.project_name ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {purchaseOrder.asset_id ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {purchaseOrder.revision_no ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div
                                                        className="max-w-[280px] truncate text-sm font-medium text-gray-700"
                                                        title={
                                                            purchaseOrder.po_subject ??
                                                            undefined
                                                        }
                                                    >
                                                        {purchaseOrder.po_subject ??
                                                            '-'}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-center">
                                                    <span className="inline-flex whitespace-nowrap rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                                        {
                                                            purchaseOrder.details_count
                                                        }{' '}
                                                        Item (
                                                        {formatNumber(
                                                            purchaseOrder.total_quantity,
                                                        )}
                                                        )
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-gray-900">
                                                    {formatCurrency(
                                                        purchaseOrder.total_amount,
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                    {formatDateTime(
                                                        purchaseOrder.last_sync_at,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedPurchaseOrder(
                                                                    purchaseOrder,
                                                                )
                                                            }
                                                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                                        >
                                                            Detail
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    )
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={15}
                                            className="px-5 py-12 text-center text-sm font-medium text-gray-500"
                                        >
                                            Data Purchase
                                            Order belum
                                            tersedia. Pilih
                                            periode lalu klik
                                            Sync Purchase
                                            Order.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="text-sm font-medium text-gray-500">
                            Menampilkan{' '}
                            {purchaseOrders.from ?? 0}–
                            {purchaseOrders.to ?? 0} dari{' '}
                            {purchaseOrders.total} data
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {purchaseOrders.links.map(
                                (link, index) => (
                                    <button
                                        key={`${link.label}-${index}`}
                                        type="button"
                                        disabled={
                                            !link.url
                                        }
                                        onClick={() => {
                                            if (
                                                link.url
                                            ) {
                                                router.visit(
                                                    link.url,
                                                    {
                                                        preserveState:
                                                            true,
                                                        preserveScroll:
                                                            true,
                                                    },
                                                );
                                            }
                                        }}
                                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${link.active
                                            ? 'bg-brand-500 text-white'
                                            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                            } disabled:cursor-not-allowed disabled:opacity-50`}
                                    >
                                        {stripHtml(
                                            link.label,
                                        )}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedPurchaseOrder && (
                <PurchaseOrderDetailModal
                    purchaseOrder={
                        selectedPurchaseOrder
                    }
                    onClose={() =>
                        setSelectedPurchaseOrder(
                            null,
                        )
                    }
                />
            )}
        </AppLayout>
    );
}

function MetricCard({
    label,
    displayValue,
    description,
    accentClass,
}: {
    label: string;
    displayValue: string;
    description: string;
    accentClass: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-500">
                        {label}
                    </p>

                    <p className="mt-3 break-words text-2xl font-bold text-gray-900">
                        {displayValue}
                    </p>

                    <p className="mt-2 text-xs font-medium text-gray-500">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${accentClass}`}
                >
                    PO
                </div>
            </div>
        </div>
    );
}

function SyncResultItem({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-xl border border-brand-100 bg-white px-4 py-3">
            <div className="text-xs font-semibold text-gray-500">
                {label}
            </div>

            <div className="mt-1 text-xl font-bold text-gray-900">
                {value.toLocaleString('id-ID')}
            </div>
        </div>
    );
}

function PurchaseOrderStatusBadge({
    status,
}: {
    status: string | null;
}) {
    const normalizedStatus =
        normalizeStatus(status);

    let className =
        'bg-gray-100 text-gray-700';

    if (
        normalizedStatus.includes('open') ||
        normalizedStatus.includes('process') ||
        normalizedStatus.includes('draft') ||
        normalizedStatus.includes('waiting')
    ) {
        className =
            'bg-blue-100 text-blue-700';
    } else if (
        normalizedStatus.includes('closed') ||
        normalizedStatus.includes('close') ||
        normalizedStatus.includes('complete') ||
        normalizedStatus.includes('finish')
    ) {
        className =
            'bg-green-100 text-green-700';
    } else if (
        normalizedStatus.includes('cancel') ||
        normalizedStatus.includes('void') ||
        normalizedStatus.includes('reject')
    ) {
        className =
            'bg-red-100 text-red-700';
    } else if (
        normalizedStatus.includes('partial') ||
        normalizedStatus.includes('pending')
    ) {
        className =
            'bg-amber-100 text-amber-700';
    }

    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${className}`}
        >
            {status || 'Unknown'}
        </span>
    );
}

function PurchaseOrderDetailModal({
    purchaseOrder,
    onClose,
}: {
    purchaseOrder: PurchaseOrderRow;
    onClose: () => void;
}) {
    const details =
        purchaseOrder.details ?? [];

    const headerItems: Array<{
        label: string;
        value: string;
    }> = [
            {
                label: 'PO Number',
                value: purchaseOrder.po_number,
            },
            {
                label: 'Accurate ID',
                value: purchaseOrder.accurate_id,
            },
            {
                label: 'Transaction Date',
                value: formatDate(
                    purchaseOrder.trans_date,
                ),
            },
            {
                label: 'Status',
                value:
                    purchaseOrder.po_status ?? '-',
            },
            {
                label: 'Vendor Number',
                value:
                    purchaseOrder.vendor_no ?? '-',
            },
            {
                label: 'Vendor Name',
                value:
                    purchaseOrder.vendor_name ?? '-',
            },
            {
                label: 'MR Number',
                value:
                    purchaseOrder.mr_number ?? '-',
            },
            {
                label: 'PR Number',
                value:
                    purchaseOrder.pr_number ?? '-',
            },
            {
                label: 'Invoice Number',
                value:
                    purchaseOrder.invoice_number ?? '-',
            },
            {
                label: 'Project',
                value:
                    purchaseOrder.project_name ?? '-',
            },
            {
                label: 'Asset ID',
                value:
                    purchaseOrder.asset_id ?? '-',
            },
            {
                label: 'Revision',
                value:
                    purchaseOrder.revision_no ?? '-',
            },
            {
                label: 'Close Order',
                value: purchaseOrder.is_closed
                    ? 'Yes'
                    : 'No',
            },
            {
                label: 'Ship Date',
                value: formatDate(
                    purchaseOrder.ship_date,
                ),
            },
            {
                label: 'Payment Term',
                value:
                    purchaseOrder.payment_term_name ??
                    '-',
            },
            {
                label: 'Shipping Address',
                value:
                    purchaseOrder.shipping_address ??
                    '-',
            },
            {
                label: 'Taxable',
                value: purchaseOrder.is_taxable
                    ? 'Yes'
                    : 'No',
            },
            {
                label: 'Inclusive Tax',
                value:
                    purchaseOrder.is_inclusive_tax
                        ? 'Yes'
                        : 'No',
            },
            {
                label: 'Subtotal',
                value: formatCurrency(
                    purchaseOrder.subtotal_amount,
                ),
            },
            {
                label: 'Discount',
                value: formatCurrency(
                    purchaseOrder.discount_amount,
                ),
            },
            {
                label: 'Tax',
                value: formatCurrency(
                    purchaseOrder.tax_amount,
                ),
            },
            {
                label: 'Subject',
                value:
                    purchaseOrder.po_subject ?? '-',
            },
            {
                label: 'Total Item',
                value: `${purchaseOrder.details_count} Item (${formatNumber(
                    purchaseOrder.total_quantity,
                )})`,
            },
            {
                label: 'Total Amount',
                value: formatCurrency(
                    purchaseOrder.total_amount,
                ),
            },
            {
                label: 'Last Sync',
                value: formatDateTime(
                    purchaseOrder.last_sync_at,
                ),
            },
        ];

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 px-4 py-6"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <div className="max-h-[92vh] w-full max-w-[1500px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Purchase Order Detail
                        </h2>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Informasi header dan detail item
                            Purchase Order Accurate.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                    <div className="xl:col-span-1">
                        <h3 className="mb-3 text-base font-bold text-gray-900">
                            Header Purchase Order
                        </h3>

                        <div className="overflow-hidden rounded-xl border border-gray-200">
                            {headerItems.map(
                                (item, index) => (
                                    <div
                                        key={item.label}
                                        className={`grid grid-cols-1 gap-1 px-5 py-4 ${index <
                                            headerItems.length -
                                            1
                                            ? 'border-b border-gray-100'
                                            : ''
                                            }`}
                                    >
                                        <div className="text-sm font-semibold text-gray-500">
                                            {
                                                item.label
                                            }
                                        </div>

                                        <div className="break-words text-sm font-medium text-gray-900">
                                            {
                                                item.value
                                            }
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>

                    <div className="xl:col-span-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className="text-base font-bold text-gray-900">
                                Detail Item
                            </h3>

                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                {details.length} Item (
                                {formatNumber(
                                    purchaseOrder.total_quantity,
                                )}
                                )
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full min-w-[1650px] table-auto">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            No
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Item Code
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Item Name
                                        </th>

                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Quantity
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Unit
                                        </th>

                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Unit Price
                                        </th>

                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Discount
                                        </th>

                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Line Total
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Warehouse
                                        </th>

                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Closed
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Department
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Project
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Remarks
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {details.length > 0 ? (
                                        details.map(
                                            (
                                                detail,
                                                index,
                                            ) => (
                                                <tr
                                                    key={
                                                        detail.id
                                                    }
                                                    className="transition hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-600">
                                                        {index +
                                                            1}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">
                                                        {detail.item_no ?? '-'}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div
                                                            className="max-w-[320px] whitespace-normal text-sm font-semibold text-gray-900"
                                                            title={
                                                                detail.item_name ??
                                                                undefined
                                                            }
                                                        >
                                                            {detail.item_name ?? '-'}
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-700">
                                                        {formatNumber(
                                                            detail.quantity,
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {detail.unit_name ??
                                                            '-'}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                                                        {formatCurrency(
                                                            detail.unit_price,
                                                        )}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                                                        <div>
                                                            {formatCurrency(
                                                                detail.discount_amount,
                                                            )}
                                                        </div>

                                                        {Number(
                                                            detail.discount_percent,
                                                        ) >
                                                            0 && (
                                                                <div className="mt-1 text-xs text-gray-500">
                                                                    {formatNumber(
                                                                        detail.discount_percent,
                                                                        2,
                                                                    )}
                                                                    %
                                                                </div>
                                                            )}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-gray-900">
                                                        {formatCurrency(
                                                            detail.line_total,
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="text-sm font-medium text-gray-700">
                                                            {detail.warehouse_name ??
                                                                '-'}
                                                        </div>

                                                        {detail.warehouse_accurate_id && (
                                                            <div className="mt-1 text-xs text-gray-500">
                                                                ID:{' '}
                                                                {
                                                                    detail.warehouse_accurate_id
                                                                }
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${detail.is_closed
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                                }`}
                                                        >
                                                            {detail.is_closed
                                                                ? 'Yes'
                                                                : 'No'}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {detail.department_name ??
                                                            '-'}
                                                    </td>

                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {detail.project_name ??
                                                            '-'}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div
                                                            className="max-w-[220px] whitespace-normal text-sm text-gray-600"
                                                            title={
                                                                detail.remarks ??
                                                                undefined
                                                            }
                                                        >
                                                            {detail.remarks ??
                                                                '-'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ),
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={13}
                                                className="px-4 py-10 text-center text-sm font-medium text-gray-500"
                                            >
                                                Detail item
                                                belum dimuat
                                                pada response
                                                halaman.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>

                                {details.length > 0 && (
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-4 text-right text-sm font-bold text-gray-700"
                                            >
                                                Total
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold text-gray-900">
                                                {formatCurrency(
                                                    purchaseOrder.total_amount,
                                                )}
                                            </td>

                                            <td colSpan={5} />
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {details.length === 0 && (
                            <p className="mt-3 text-xs font-medium text-amber-600">
                                Agar detail item muncul
                                dalam modal, controller
                                harus memuat relasi
                                `details` menggunakan
                                `with('details')`.
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
