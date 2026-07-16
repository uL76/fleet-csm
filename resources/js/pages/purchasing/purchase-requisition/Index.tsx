import AppLayout from '@/layouts/tailadmin/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from 'react';
import Swal from 'sweetalert2';

type PurchaseRequisitionDetail = {
    id: number;
    purchase_requisition_id: number;
    accurate_detail_id: string | null;
    accurate_pr_id: string;
    pr_number: string;
    mr_number: string | null;
    item_no: string | null;
    item_name: string | null;
    item_description: string | null;
    quantity: string | number;
    unit_name: string | null;
    department_name: string | null;
    project_name: string | null;
    remarks: string | null;
    trans_date: string | null;
};

type PurchaseRequisitionRow = {
    id: number;
    accurate_id: string;
    pr_number: string;
    pr_status: string | null;
    mr_number: string | null;
    pr_subject: string | null;
    project_name: string | null;
    asset_id: string | null;
    revision_no: string | null;
    is_closed: boolean;
    trans_date: string | null;
    required_date: string | null;
    total_quantity: string | number | null;
    last_sync_at: string | null;
    created_at: string;
    updated_at: string;
    details_count: number;
    details?: PurchaseRequisitionDetail[];
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedPurchaseRequisitions = {
    data: PurchaseRequisitionRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

type Summary = {
    total_pr: number;
    total_open: number;
    total_closed: number;
    total_quantity: string | number;
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
    purchaseRequisitions: PaginatedPurchaseRequisitions;
    summary: Summary;
    statuses: string[];
    filters: Filters;
    lastSyncAt: string | null;
    flash?: Flash;
};

function formatDate(value: string | null): string {
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

function formatDateTime(value: string | null): string {
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

function normalizeStatus(status: string | null): string {
    return String(status ?? '').trim().toLowerCase();
}

function stripHtml(value: string): string {
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
                ${Number(value ?? 0).toLocaleString('id-ID')}
            </div>
        </div>
    `;
}

export default function PurchaseRequisitionIndex() {
    const {
        purchaseRequisitions,
        summary,
        statuses,
        filters,
        lastSyncAt,
        flash,
    } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
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
        selectedPurchaseRequisition,
        setSelectedPurchaseRequisition,
    ] = useState<PurchaseRequisitionRow | null>(null);

    const summaryCards = useMemo(
        () => [
            {
                label: 'Total PR',
                displayValue:
                    summary.total_pr.toLocaleString('id-ID'),
                description:
                    'Seluruh Purchase Requisition lokal',
                accentClass:
                    'bg-brand-50 text-brand-600',
            },
            {
                label: 'Open PR',
                displayValue:
                    summary.total_open.toLocaleString('id-ID'),
                description:
                    'Purchase Requisition masih terbuka',
                accentClass:
                    'bg-blue-50 text-blue-600',
            },
            {
                label: 'Closed PR',
                displayValue:
                    summary.total_closed.toLocaleString('id-ID'),
                description:
                    'Purchase Requisition sudah selesai',
                accentClass:
                    'bg-green-50 text-green-600',
            },
            {
                label: 'Total Quantity',
                displayValue: formatNumber(
                    summary.total_quantity,
                ),
                description:
                    'Akumulasi quantity seluruh item PR',
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
        setPerPage(String(filters.per_page ?? 10));
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
                        <ul style="margin: 8px 0 0 18px;">
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
                        grid-template-columns: repeat(2, minmax(0, 1fr));
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
                    'PR Baru',
                    result.inserted,
                )}
                        ${buildSyncResultBox(
                    'PR Diperbarui',
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
                        ${escapeAlertHtml(result.synced_at)}
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

    const handleFilter = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            '/purchasing/purchase-requisition',
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
            '/purchasing/purchase-requisition',
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

    const handlePerPageChange = (value: string) => {
        setPerPage(value);

        router.get(
            '/purchasing/purchase-requisition',
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
            title: 'Sinkronisasi Purchase Requisition',
            html: `
                Sinkronkan Purchase Requisition dari
                <strong>${escapeAlertHtml(startDate)}</strong>
                sampai
                <strong>${escapeAlertHtml(endDate)}</strong>?
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
            '/purchasing/purchase-requisition/sync',
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
                            Sedang menarik data Purchase Requisition
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
            <Head title="Purchase Requisition Accurate" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Purchase Requisition Accurate
                        </h1>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Data Purchase Requisition yang
                            disinkronkan dari Accurate Online.
                        </p>

                        <p className="mt-2 text-xs font-medium text-gray-500">
                            Last sync:{' '}
                            <span className="font-semibold text-gray-700">
                                {formatDateTime(lastSyncAt)}
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
                            ? 'Syncing Purchase Requisition...'
                            : 'Sync Purchase Requisition'}
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
                        <div>
                            <h2 className="text-base font-bold text-brand-700">
                                Hasil Sinkronisasi
                            </h2>

                            <p className="mt-1 text-sm font-medium text-brand-600">
                                Purchase Requisition Accurate
                                diproses pada{' '}
                                {flash.sync_result.synced_at}
                            </p>

                            {flash.sync_result.start_date &&
                                flash.sync_result.end_date && (
                                    <p className="mt-1 text-xs font-medium text-brand-600">
                                        Periode:{' '}
                                        {
                                            flash.sync_result
                                                .start_date
                                        }{' '}
                                        sampai{' '}
                                        {
                                            flash.sync_result
                                                .end_date
                                        }
                                    </p>
                                )}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                            <SyncResultItem
                                label="Total List"
                                value={
                                    flash.sync_result.total_list
                                }
                            />
                            <SyncResultItem
                                label="Processed"
                                value={
                                    flash.sync_result.processed ??
                                    flash.sync_result.total_list
                                }
                            />
                            <SyncResultItem
                                label="PR Inserted"
                                value={
                                    flash.sync_result.inserted
                                }
                            />
                            <SyncResultItem
                                label="PR Updated"
                                value={
                                    flash.sync_result.updated
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
                                        .detail_deleted ?? 0
                                }
                            />
                            <SyncResultItem
                                label="Detail Skipped"
                                value={
                                    flash.sync_result
                                        .detail_skipped ?? 0
                                }
                            />
                            <SyncResultItem
                                label="Failed"
                                value={
                                    flash.sync_result.failed
                                }
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <MetricCard
                            key={card.label}
                            label={card.label}
                            displayValue={card.displayValue}
                            description={card.description}
                            accentClass={card.accentClass}
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
                                    setSearch(event.target.value)
                                }
                                placeholder="PR, MR, project, asset, revision..."
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>

                        <div className="xl:col-span-2">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Start Date
                            </label>

                            <input
                                type="date"
                                value={startDate}
                                onChange={(event) =>
                                    setStartDate(
                                        event.target.value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>

                        <div className="xl:col-span-2">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                End Date
                            </label>

                            <input
                                type="date"
                                value={endDate}
                                onChange={(event) =>
                                    setEndDate(
                                        event.target.value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>

                        <div className="xl:col-span-2">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Status
                            </label>

                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="">
                                    All Status
                                </option>

                                {statuses.map((statusItem) => (
                                    <option
                                        key={statusItem}
                                        value={statusItem}
                                    >
                                        {statusItem}
                                    </option>
                                ))}
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
                                        event.target.value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
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
                                onClick={handleClearFilter}
                                className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                                Clear
                            </button>
                        </div>
                    </form>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full min-w-[1450px] table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <TableHeader>No</TableHeader>
                                    <TableHeader>
                                        PR Number
                                    </TableHeader>
                                    <TableHeader>Date</TableHeader>
                                    <TableHeader>Status</TableHeader>
                                    <TableHeader>
                                        MR Number
                                    </TableHeader>
                                    <TableHeader>
                                        Project
                                    </TableHeader>
                                    <TableHeader>
                                        Asset
                                    </TableHeader>
                                    <TableHeader>
                                        Revision
                                    </TableHeader>
                                    <TableHeader>
                                        Subject
                                    </TableHeader>
                                    <TableHeader align="center">
                                        Item
                                    </TableHeader>
                                    <TableHeader>
                                        Required Date
                                    </TableHeader>
                                    <TableHeader>
                                        Last Sync
                                    </TableHeader>
                                    <TableHeader align="right">
                                        Action
                                    </TableHeader>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white">
                                {purchaseRequisitions.data
                                    .length > 0 ? (
                                    purchaseRequisitions.data.map(
                                        (
                                            purchaseRequisition,
                                            index,
                                        ) => (
                                            <tr
                                                key={
                                                    purchaseRequisition.id
                                                }
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="px-5 py-4 text-sm font-medium text-gray-600">
                                                    {(purchaseRequisitions.current_page -
                                                        1) *
                                                        purchaseRequisitions.per_page +
                                                        index +
                                                        1}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-semibold text-gray-900">
                                                        {
                                                            purchaseRequisition.pr_number
                                                        }
                                                    </div>

                                                    <div className="mt-1 text-xs font-medium text-gray-500">
                                                        ID:{' '}
                                                        {
                                                            purchaseRequisition.accurate_id
                                                        }
                                                    </div>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-700">
                                                    {formatDate(
                                                        purchaseRequisition.trans_date,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <PurchaseRequisitionStatusBadge
                                                        status={
                                                            purchaseRequisition.pr_status
                                                        }
                                                    />
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {purchaseRequisition.mr_number ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {purchaseRequisition.project_name ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {purchaseRequisition.asset_id ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {purchaseRequisition.revision_no ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div
                                                        className="max-w-[280px] truncate text-sm font-medium text-gray-700"
                                                        title={
                                                            purchaseRequisition.pr_subject ??
                                                            undefined
                                                        }
                                                    >
                                                        {purchaseRequisition.pr_subject ??
                                                            '-'}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-center">
                                                    <span className="inline-flex whitespace-nowrap rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                                        {
                                                            purchaseRequisition.details_count
                                                        }{' '}
                                                        Item (
                                                        {formatNumber(
                                                            purchaseRequisition.total_quantity,
                                                        )}
                                                        )
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-700">
                                                    {formatDate(
                                                        purchaseRequisition.required_date,
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                    {formatDateTime(
                                                        purchaseRequisition.last_sync_at,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedPurchaseRequisition(
                                                                    purchaseRequisition,
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
                                            colSpan={13}
                                            className="px-5 py-12 text-center text-sm font-medium text-gray-500"
                                        >
                                            Data Purchase
                                            Requisition belum
                                            tersedia. Pilih
                                            periode lalu klik
                                            Sync Purchase
                                            Requisition.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="text-sm font-medium text-gray-500">
                            Menampilkan{' '}
                            {purchaseRequisitions.from ?? 0}–
                            {purchaseRequisitions.to ?? 0} dari{' '}
                            {purchaseRequisitions.total} data
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {purchaseRequisitions.links.map(
                                (link, index) => (
                                    <button
                                        key={`${link.label}-${index}`}
                                        type="button"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
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
                                        {stripHtml(link.label)}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedPurchaseRequisition && (
                <PurchaseRequisitionDetailModal
                    purchaseRequisition={
                        selectedPurchaseRequisition
                    }
                    onClose={() =>
                        setSelectedPurchaseRequisition(null)
                    }
                />
            )}
        </AppLayout>
    );
}

function TableHeader({
    children,
    align = 'left',
}: {
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
}) {
    const alignClass =
        align === 'center'
            ? 'text-center'
            : align === 'right'
                ? 'text-right'
                : 'text-left';

    return (
        <th
            className={`px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-600 ${alignClass}`}
        >
            {children}
        </th>
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
                    PR
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

function PurchaseRequisitionStatusBadge({
    status,
}: {
    status: string | null;
}) {
    const normalizedStatus = normalizeStatus(status);

    let className = 'bg-gray-100 text-gray-700';

    if (
        normalizedStatus.includes('open') ||
        normalizedStatus.includes('process') ||
        normalizedStatus.includes('draft') ||
        normalizedStatus.includes('waiting')
    ) {
        className = 'bg-blue-100 text-blue-700';
    } else if (
        normalizedStatus.includes('closed') ||
        normalizedStatus.includes('close') ||
        normalizedStatus.includes('complete') ||
        normalizedStatus.includes('finish')
    ) {
        className = 'bg-green-100 text-green-700';
    } else if (
        normalizedStatus.includes('cancel') ||
        normalizedStatus.includes('void') ||
        normalizedStatus.includes('reject')
    ) {
        className = 'bg-red-100 text-red-700';
    } else if (
        normalizedStatus.includes('partial') ||
        normalizedStatus.includes('pending')
    ) {
        className = 'bg-amber-100 text-amber-700';
    }

    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${className}`}
        >
            {status || 'Unknown'}
        </span>
    );
}

function PurchaseRequisitionDetailModal({
    purchaseRequisition,
    onClose,
}: {
    purchaseRequisition: PurchaseRequisitionRow;
    onClose: () => void;
}) {
    const details = purchaseRequisition.details ?? [];

    const headerItems: Array<{
        label: string;
        value: string;
    }> = [
            {
                label: 'PR Number',
                value: purchaseRequisition.pr_number,
            },
            {
                label: 'Accurate ID',
                value: purchaseRequisition.accurate_id,
            },
            {
                label: 'Transaction Date',
                value: formatDate(
                    purchaseRequisition.trans_date,
                ),
            },
            {
                label: 'Required Date',
                value: formatDate(
                    purchaseRequisition.required_date,
                ),
            },
            {
                label: 'Status',
                value: purchaseRequisition.pr_status ?? '-',
            },
            {
                label: 'MR Number',
                value: purchaseRequisition.mr_number ?? '-',
            },
            {
                label: 'Project',
                value:
                    purchaseRequisition.project_name ?? '-',
            },
            {
                label: 'Asset ID',
                value: purchaseRequisition.asset_id ?? '-',
            },
            {
                label: 'Revision',
                value:
                    purchaseRequisition.revision_no ?? '-',
            },
            {
                label: 'Close PR',
                value: purchaseRequisition.is_closed
                    ? 'Yes'
                    : 'No',
            },
            {
                label: 'Subject',
                value:
                    purchaseRequisition.pr_subject ?? '-',
            },
            {
                label: 'Total Item',
                value: `${purchaseRequisition.details_count} Item (${formatNumber(
                    purchaseRequisition.total_quantity,
                )})`,
            },
            {
                label: 'Last Sync',
                value: formatDateTime(
                    purchaseRequisition.last_sync_at,
                ),
            },
        ];

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 px-4 py-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="max-h-[92vh] w-full max-w-[1450px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Purchase Requisition Detail
                        </h2>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Informasi header dan detail item
                            Purchase Requisition Accurate.
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
                            Header Purchase Requisition
                        </h3>

                        <div className="overflow-hidden rounded-xl border border-gray-200">
                            {headerItems.map((item, index) => (
                                <div
                                    key={item.label}
                                    className={`grid grid-cols-1 gap-1 px-5 py-4 ${index <
                                            headerItems.length - 1
                                            ? 'border-b border-gray-100'
                                            : ''
                                        }`}
                                >
                                    <div className="text-sm font-semibold text-gray-500">
                                        {item.label}
                                    </div>

                                    <div className="break-words text-sm font-medium text-gray-900">
                                        {item.value}
                                    </div>
                                </div>
                            ))}
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
                                    purchaseRequisition.total_quantity,
                                )}
                                )
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full min-w-[1200px] table-auto">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <TableHeader>No</TableHeader>
                                        <TableHeader>
                                            Item Code
                                        </TableHeader>
                                        <TableHeader>
                                            Item Name
                                        </TableHeader>
                                        <TableHeader align="right">
                                            Quantity
                                        </TableHeader>
                                        <TableHeader>
                                            Unit
                                        </TableHeader>
                                        <TableHeader>
                                            Department
                                        </TableHeader>
                                        <TableHeader>
                                            Project
                                        </TableHeader>
                                        <TableHeader>
                                            Remarks
                                        </TableHeader>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {details.length > 0 ? (
                                        details.map(
                                            (detail, index) => (
                                                <tr
                                                    key={detail.id}
                                                    className="transition hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-600">
                                                        {index + 1}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">
                                                        {detail.item_no ??
                                                            '-'}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div
                                                            className="max-w-[340px] whitespace-normal text-sm font-semibold text-gray-900"
                                                            title={
                                                                detail.item_name ??
                                                                undefined
                                                            }
                                                        >
                                                            {detail.item_name ??
                                                                '-'}
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
                                                            className="max-w-[260px] whitespace-normal text-sm text-gray-600"
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
                                                colSpan={8}
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
                                                colSpan={3}
                                                className="px-4 py-4 text-right text-sm font-bold text-gray-700"
                                            >
                                                Total Quantity
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold text-gray-900">
                                                {formatNumber(
                                                    purchaseRequisition.total_quantity,
                                                )}
                                            </td>

                                            <td colSpan={4} />
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {details.length === 0 && (
                            <p className="mt-3 text-xs font-medium text-amber-600">
                                Agar detail item muncul dalam
                                modal, controller harus memuat
                                relasi `details` menggunakan
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
