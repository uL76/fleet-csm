import AppLayout from '@/layouts/tailadmin/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ChangeEvent,
    FormEvent,
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import Swal from 'sweetalert2';

type ItemMaster = {
    id: number;
    accurate_id: string;
    item_code: string;
    part_number: string | null;
    item_description: string | null;
    unit_name: string | null;
    is_active: boolean;
    accurate_raw: Record<string, unknown> | null;
    sync_error: string | null;
    last_sync_at: string | null;
    created_at: string;
    updated_at: string;

    category_name: string | null;
    item_type: string | null;
    brand_name: string | null;
    preferred_vendor: string | null;
    minimum_stock: string | null;
    total_stock: string | null;
    excel_inactive: boolean | null;
    length_cm: string | null;
    width_cm: string | null;
    height_cm: string | null;
    weight_gram: string | null;
    cross_reference_part_no: string | null;
    equipment_type: string | null;
    compatible_equipment_model: string | null;
    specification: string | null;
    bin_location_bpn: string | null;
    bin_location_jkt: string | null;
    class_movement: string | null;
    reorder_quantity: string | null;
    maximum_quantity: string | null;
    excel_imported_at: string | null;
    excel_source_file: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedItemMasters = {
    data: ItemMaster[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

type Summary = {
    total: number;
    active: number;
    inactive: number;
    with_part_number: number;
    without_part_number: number;
};

type Filters = {
    search?: string;
    status?: string;
    part_number?: string;
    per_page?: number;
};

type ItemSyncStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED';

type ItemSyncRun = {
    id: number;
    status: ItemSyncStatus;
    current_page: number;
    total_pages: number;
    page_size: number;
    total_items: number;
    processed_items: number;
    inserted_items: number;
    updated_items: number;
    skipped_items: number;
    failed_items: number;
    inactivated_items: number;
    progress_percentage: number;
    error_message: string | null;
    started_at: string | null;
    finished_at: string | null;
};

type ImportStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED';

type ImportErrorSample = {
    row: number;
    message: string;
};

type ItemImportRun = {
    id: number;
    status: ImportStatus;
    original_filename: string;
    total_rows: number;
    processed_rows: number;
    updated_rows: number;
    unmatched_rows: number;
    skipped_rows: number;
    failed_rows: number;
    progress_percentage: number;
    error_samples: ImportErrorSample[] | null;
    error_message: string | null;
    started_at: string | null;
    finished_at: string | null;
};

type PageProps = {
    items: PaginatedItemMasters;
    summary: Summary;
    filters: Filters;
    lastSyncAt: string | null;
    lastExcelImportAt: string | null;
    latestSyncRun: ItemSyncRun | null;
    latestImportRun: ItemImportRun | null;
};

type SyncApiResponse = {
    status: string;
    message?: string;
    sync_run: ItemSyncRun;
};

type ImportApiResponse = {
    status: string;
    message?: string;
    import_run: ItemImportRun;
};

const HEADER_COLLAPSE_STORAGE_KEY =
    'fleet-csm-item-master-header-collapsed';

function formatDateTime(value: string | null): string {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function formatValue(value: string | null): string {
    return value && value.trim() !== '' ? value : '-';
}

function escapeHtml(value: string | null): string {
    if (!value) return '';

    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getAxiosMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const responseMessage = error.response?.data?.message;

        if (
            typeof responseMessage === 'string'
            && responseMessage !== ''
        ) {
            return responseMessage;
        }

        const errors = error.response?.data?.errors;

        if (errors && typeof errors === 'object') {
            const firstError = Object.values(errors)
                .flat()
                .find((value) => typeof value === 'string');

            if (typeof firstError === 'string') {
                return firstError;
            }
        }

        return error.message;
    }

    if (error instanceof Error) return error.message;

    return 'Terjadi kesalahan yang tidak diketahui.';
}

function readInitialHeaderCollapsed(): boolean {
    if (typeof window === 'undefined') return false;

    return (
        window.localStorage.getItem(
            HEADER_COLLAPSE_STORAGE_KEY,
        ) === '1'
    );
}

export default function ItemMasterIndex() {
    const {
        items,
        summary,
        filters,
        lastSyncAt,
        lastExcelImportAt,
        latestSyncRun,
        latestImportRun,
    } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [partNumber, setPartNumber] = useState(
        filters.part_number ?? '',
    );
    const [perPage, setPerPage] = useState(
        String(filters.per_page ?? 10),
    );
    const [syncing, setSyncing] = useState(
        latestSyncRun?.status === 'PENDING'
        || latestSyncRun?.status === 'PROCESSING',
    );
    const [syncRun, setSyncRun] = useState<ItemSyncRun | null>(
        latestSyncRun
            && latestSyncRun.status !== 'COMPLETED'
            && latestSyncRun.status !== 'CANCELLED'
            ? latestSyncRun
            : null,
    );
    const [importing, setImporting] = useState(
        latestImportRun?.status === 'PENDING'
        || latestImportRun?.status === 'PROCESSING',
    );
    const [importRun, setImportRun] = useState<ItemImportRun | null>(
        latestImportRun
            && latestImportRun.status !== 'COMPLETED'
            ? latestImportRun
            : null,
    );
    const [headerCollapsed, setHeaderCollapsed] = useState(
        readInitialHeaderCollapsed,
    );
    const [selectedItem, setSelectedItem] =
        useState<ItemMaster | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const pollTimerRef = useRef<number | null>(null);
    const importPollTimerRef = useRef<number | null>(null);
    const monitoringRunIdRef = useRef<number | null>(null);
    const monitoringImportIdRef = useRef<number | null>(null);
    const mountedRef = useRef(true);
    const monitorSyncRef = useRef<
        ((syncRunId: number) => Promise<void>) | null
    >(null);
    const monitorImportRef = useRef<
        ((importRunId: number) => Promise<void>) | null
    >(null);

    const summaryCards = useMemo(
        () => [
            {
                label: 'Total Item',
                value: summary.total,
                description: 'Seluruh Item Master lokal',
                accentClass: 'bg-brand-50 text-brand-600',
            },
            {
                label: 'Active',
                value: summary.active,
                description: 'Item aktif di Accurate',
                accentClass: 'bg-green-50 text-green-600',
            },
            {
                label: 'Inactive',
                value: summary.inactive,
                description: 'Item nonaktif di Accurate',
                accentClass: 'bg-red-50 text-red-600',
            },
            {
                label: 'With Part Number',
                value: summary.with_part_number,
                description: 'Item memiliki part number',
                accentClass: 'bg-blue-50 text-blue-600',
            },
            {
                label: 'Without Part Number',
                value: summary.without_part_number,
                description: 'Item tanpa part number',
                accentClass: 'bg-amber-50 text-amber-600',
            },
        ],
        [summary],
    );

    useEffect(() => {
        setSearch(filters.search ?? '');
        setStatus(filters.status ?? '');
        setPartNumber(filters.part_number ?? '');
        setPerPage(String(filters.per_page ?? 10));
    }, [filters]);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;

            if (pollTimerRef.current !== null) {
                window.clearTimeout(pollTimerRef.current);
            }

            if (importPollTimerRef.current !== null) {
                window.clearTimeout(importPollTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        window.localStorage.setItem(
            HEADER_COLLAPSE_STORAGE_KEY,
            headerCollapsed ? '1' : '0',
        );
    }, [headerCollapsed]);

    const reloadItemData = useCallback(() => {
        router.reload({
            only: [
                'items',
                'summary',
                'lastSyncAt',
                'lastExcelImportAt',
                'latestSyncRun',
                'latestImportRun',
            ],
        });
    }, []);

    const renderSyncProgress = useCallback((run: ItemSyncRun) => {
        const percentage = Math.max(
            0,
            Math.min(100, run.progress_percentage ?? 0),
        );

        Swal.update({
            title: 'Sinkronisasi Item Master',
            html: `
                <div style="text-align:left">
                    <div>Halaman: <strong>${run.current_page} dari ${run.total_pages || '-'}</strong></div>
                    <div style="margin-top:12px;width:100%;height:14px;border-radius:999px;background:#e2e8f0;overflow:hidden;">
                        <div style="width:${percentage}%;height:100%;background:#465fff;"></div>
                    </div>
                    <div style="margin-top:8px;text-align:center;font-weight:700;">${percentage}%</div>
                    <div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
                        <div>Processed: <strong>${run.processed_items.toLocaleString('id-ID')}</strong></div>
                        <div>Total: <strong>${run.total_items.toLocaleString('id-ID')}</strong></div>
                        <div>Inserted: <strong>${run.inserted_items.toLocaleString('id-ID')}</strong></div>
                        <div>Updated: <strong>${run.updated_items.toLocaleString('id-ID')}</strong></div>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
        });
    }, []);

    const retryItemSync = useCallback(
        async (syncRunId: number): Promise<void> => {
            try {
                const response = await axios.post<SyncApiResponse>(
                    `/warehouse/item-master/sync/${syncRunId}/retry`,
                );

                setSyncRun(response.data.sync_run);
                setSyncing(true);
                monitoringRunIdRef.current = null;

                window.setTimeout(() => {
                    void monitorSyncRef.current?.(
                        response.data.sync_run.id,
                    );
                }, 250);
            } catch (error) {
                setSyncing(false);

                await Swal.fire({
                    title: 'Gagal melanjutkan sinkronisasi',
                    text: getAxiosMessage(error),
                    icon: 'error',
                });
            }
        },
        [],
    );

    const monitorSync = useCallback(
        async (syncRunId: number): Promise<void> => {
            if (
                monitoringRunIdRef.current === syncRunId
                && pollTimerRef.current !== null
            ) {
                return;
            }

            monitoringRunIdRef.current = syncRunId;
            setSyncing(true);

            Swal.fire({
                title: 'Sinkronisasi Item Master',
                html: 'Menyiapkan proses sinkronisasi...',
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading(),
            });

            const poll = async (): Promise<void> => {
                try {
                    const response = await axios.get<SyncApiResponse>(
                        `/warehouse/item-master/sync/${syncRunId}/progress`,
                    );

                    const run = response.data.sync_run;

                    if (!mountedRef.current) return;

                    setSyncRun(run);

                    if (
                        run.status === 'PENDING'
                        || run.status === 'PROCESSING'
                    ) {
                        renderSyncProgress(run);

                        pollTimerRef.current = window.setTimeout(
                            () => void poll(),
                            2000,
                        );

                        return;
                    }

                    pollTimerRef.current = null;
                    monitoringRunIdRef.current = null;
                    setSyncing(false);

                    if (run.status === 'COMPLETED') {
                        await Swal.fire({
                            title: 'Sinkronisasi selesai',
                            icon: 'success',
                            html: `
                                <div style="text-align:left;line-height:1.8">
                                    <div>Total: <strong>${run.total_items.toLocaleString('id-ID')}</strong></div>
                                    <div>Inserted: <strong>${run.inserted_items.toLocaleString('id-ID')}</strong></div>
                                    <div>Updated: <strong>${run.updated_items.toLocaleString('id-ID')}</strong></div>
                                    <div>Inactivated: <strong>${run.inactivated_items.toLocaleString('id-ID')}</strong></div>
                                </div>
                            `,
                        });

                        setSyncRun(null);
                        reloadItemData();

                        return;
                    }

                    if (run.status === 'FAILED') {
                        const retry = await Swal.fire({
                            title: 'Sinkronisasi berhenti',
                            icon: 'error',
                            html: `
                                <div style="text-align:left">
                                    <p>Halaman terakhir berhasil: <strong>${run.current_page}</strong></p>
                                    <p style="margin-top:12px;color:#b91c1c">
                                        ${escapeHtml(run.error_message ?? 'Terjadi kesalahan.')}
                                    </p>
                                </div>
                            `,
                            showCancelButton: true,
                            confirmButtonText: 'Lanjutkan Sync',
                            cancelButtonText: 'Tutup',
                        });

                        if (retry.isConfirmed) {
                            await retryItemSync(run.id);
                        }
                    }
                } catch (error) {
                    pollTimerRef.current = null;
                    monitoringRunIdRef.current = null;
                    setSyncing(false);

                    await Swal.fire({
                        title: 'Gagal membaca progress',
                        text: getAxiosMessage(error),
                        icon: 'error',
                    });
                }
            };

            await poll();
        },
        [reloadItemData, renderSyncProgress, retryItemSync],
    );

    monitorSyncRef.current = monitorSync;

    const monitorImport = useCallback(
        async (importRunId: number): Promise<void> => {
            if (
                monitoringImportIdRef.current === importRunId
                && importPollTimerRef.current !== null
            ) {
                return;
            }

            monitoringImportIdRef.current = importRunId;
            setImporting(true);

            Swal.fire({
                title: 'Import Detail Item',
                html: 'Menyiapkan import Excel...',
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading(),
            });

            const poll = async (): Promise<void> => {
                try {
                    const response = await axios.get<ImportApiResponse>(
                        `/warehouse/item-master/import/${importRunId}/progress`,
                    );

                    const run = response.data.import_run;

                    if (!mountedRef.current) return;

                    setImportRun(run);

                    if (
                        run.status === 'PENDING'
                        || run.status === 'PROCESSING'
                    ) {
                        Swal.update({
                            title: 'Import Detail Item',
                            html: `
                                <div style="text-align:left;line-height:1.8">
                                    <div>Processed: <strong>${run.processed_rows.toLocaleString('id-ID')}</strong></div>
                                    <div>Updated: <strong>${run.updated_rows.toLocaleString('id-ID')}</strong></div>
                                    <div>Unmatched: <strong>${run.unmatched_rows.toLocaleString('id-ID')}</strong></div>
                                    <div>Skipped: <strong>${run.skipped_rows.toLocaleString('id-ID')}</strong></div>
                                    <div>Failed: <strong>${run.failed_rows.toLocaleString('id-ID')}</strong></div>
                                </div>
                            `,
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                        });

                        importPollTimerRef.current = window.setTimeout(
                            () => void poll(),
                            2000,
                        );

                        return;
                    }

                    importPollTimerRef.current = null;
                    monitoringImportIdRef.current = null;
                    setImporting(false);

                    if (run.status === 'COMPLETED') {
                        await Swal.fire({
                            title: 'Import selesai',
                            icon: 'success',
                            html: `
                                <div style="text-align:left;line-height:1.8">
                                    <div>Updated: <strong>${run.updated_rows.toLocaleString('id-ID')}</strong></div>
                                    <div>Unmatched: <strong>${run.unmatched_rows.toLocaleString('id-ID')}</strong></div>
                                    <div>Skipped: <strong>${run.skipped_rows.toLocaleString('id-ID')}</strong></div>
                                    <div>Failed: <strong>${run.failed_rows.toLocaleString('id-ID')}</strong></div>
                                </div>
                            `,
                        });

                        setImportRun(null);
                        reloadItemData();

                        return;
                    }

                    await Swal.fire({
                        title: 'Import gagal',
                        icon: 'error',
                        text: run.error_message ?? 'Import Excel gagal.',
                    });
                } catch (error) {
                    importPollTimerRef.current = null;
                    monitoringImportIdRef.current = null;
                    setImporting(false);

                    await Swal.fire({
                        title: 'Gagal membaca progress import',
                        text: getAxiosMessage(error),
                        icon: 'error',
                    });
                }
            };

            await poll();
        },
        [reloadItemData],
    );

    monitorImportRef.current = monitorImport;

    useEffect(() => {
        if (
            latestSyncRun
            && (
                latestSyncRun.status === 'PENDING'
                || latestSyncRun.status === 'PROCESSING'
            )
        ) {
            void monitorSync(latestSyncRun.id);
        }
    }, [latestSyncRun, monitorSync]);

    useEffect(() => {
        if (
            latestImportRun
            && (
                latestImportRun.status === 'PENDING'
                || latestImportRun.status === 'PROCESSING'
            )
        ) {
            void monitorImport(latestImportRun.id);
        }
    }, [latestImportRun, monitorImport]);

    const handleImportExcel = async (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];

        event.target.value = '';

        if (!file) return;

        const confirmation = await Swal.fire({
            title: 'Import Detail Item',
            html: `
                <div style="text-align:left">
                    <div><strong>File:</strong> ${escapeHtml(file.name)}</div>
                    <div style="margin-top:8px">Data dicocokkan berdasarkan Part Code.</div>
                    <div style="margin-top:8px;color:#64748b;font-size:13px">
                        Accurate ID dan status aktif tidak diubah.
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Mulai Import',
            cancelButtonText: 'Batal',
        });

        if (!confirmation.isConfirmed) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setImporting(true);

            const response = await axios.post<ImportApiResponse>(
                '/warehouse/item-master/import',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );

            setImportRun(response.data.import_run);
            await monitorImport(response.data.import_run.id);
        } catch (error) {
            setImporting(false);

            if (
                axios.isAxiosError(error)
                && error.response?.status === 409
            ) {
                const existingRun = error.response.data
                    ?.import_run as ItemImportRun | undefined;

                if (existingRun) {
                    setImportRun(existingRun);
                    await monitorImport(existingRun.id);
                    return;
                }
            }

            await Swal.fire({
                title: 'Import gagal dimulai',
                text: getAxiosMessage(error),
                icon: 'error',
            });
        }
    };

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            '/warehouse/item-master',
            {
                search,
                status,
                part_number: partNumber,
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
        setPartNumber('');
        setPerPage('10');

        router.get(
            '/warehouse/item-master',
            {},
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSyncItemMaster = async () => {
        if (syncing) {
            if (syncRun) await monitorSync(syncRun.id);
            return;
        }

        const confirmation = await Swal.fire({
            title: 'Sinkronisasi Item Master',
            text: 'Data list item akan diproses per halaman.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Mulai Sinkronisasi',
            cancelButtonText: 'Batal',
        });

        if (!confirmation.isConfirmed) return;

        try {
            setSyncing(true);

            const response = await axios.post<SyncApiResponse>(
                '/warehouse/item-master/sync/start',
            );

            setSyncRun(response.data.sync_run);
            await monitorSync(response.data.sync_run.id);
        } catch (error) {
            setSyncing(false);

            if (
                axios.isAxiosError(error)
                && error.response?.status === 409
            ) {
                const existingRun = error.response.data
                    ?.sync_run as ItemSyncRun | undefined;

                if (existingRun) {
                    setSyncRun(existingRun);
                    await monitorSync(existingRun.id);
                    return;
                }
            }

            await Swal.fire({
                title: 'Gagal memulai sinkronisasi',
                text: getAxiosMessage(error),
                icon: 'error',
            });
        }
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);

        router.get(
            '/warehouse/item-master',
            {
                search,
                status,
                part_number: partNumber,
                per_page: value,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Item Master Accurate" />

            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportExcel}
            />

            <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div
                        className={`flex flex-col justify-between gap-4 sm:flex-row sm:items-center ${headerCollapsed ? 'px-4 py-3' : 'px-6 py-5'
                            }`}
                    >
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1
                                    className={
                                        headerCollapsed
                                            ? 'text-lg font-bold text-gray-900'
                                            : 'text-2xl font-bold text-gray-900'
                                    }
                                >
                                    Item Master Accurate
                                </h1>

                                {syncRun && (
                                    <SyncStatusBadge status={syncRun.status} />
                                )}
                            </div>

                            {!headerCollapsed && (
                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    Master item dari Accurate dan detail dari Excel.
                                </p>
                            )}

                            <div
                                className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-gray-500 ${headerCollapsed ? 'mt-1' : 'mt-2'
                                    }`}
                            >
                                <span>
                                    Accurate sync:{' '}
                                    <strong className="text-gray-700">
                                        {formatDateTime(lastSyncAt)}
                                    </strong>
                                </span>

                                <span>
                                    Excel import:{' '}
                                    <strong className="text-gray-700">
                                        {formatDateTime(lastExcelImportAt)}
                                    </strong>
                                </span>

                                {headerCollapsed && (
                                    <>
                                        <CompactStat label="Total" value={summary.total} />
                                        <CompactStat label="Active" value={summary.active} />
                                        <CompactStat label="Inactive" value={summary.inactive} />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setHeaderCollapsed((current) => !current)
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                <ChevronIcon collapsed={headerCollapsed} />
                                {headerCollapsed
                                    ? 'Expand Header'
                                    : 'Collapse Header'}
                            </button>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={importing}
                                className="inline-flex items-center justify-center rounded-xl border border-brand-500 bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {importing
                                    ? 'Importing...'
                                    : 'Import Excel Detail'}
                            </button>

                            <button
                                type="button"
                                onClick={handleSyncItemMaster}
                                disabled={syncing && !syncRun}
                                className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {syncing
                                    ? 'Lihat Progress Sync'
                                    : 'Sync Item Master'}
                            </button>
                        </div>
                    </div>
                </div>

                {!headerCollapsed && (
                    <>
                        {syncRun
                            && syncRun.status !== 'COMPLETED'
                            && syncRun.status !== 'CANCELLED' && (
                                <SyncProgressCard run={syncRun} />
                            )}

                        {importRun
                            && importRun.status !== 'COMPLETED' && (
                                <ImportProgressCard run={importRun} />
                            )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            {summaryCards.map((card) => (
                                <MetricCard
                                    key={card.label}
                                    label={card.label}
                                    value={card.value}
                                    description={card.description}
                                    accentClass={card.accentClass}
                                />
                            ))}
                        </div>
                    </>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <form
                        onSubmit={handleSearch}
                        className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-12"
                    >
                        <div className="lg:col-span-4">
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search item code, part number, description, brand, bin location..."
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <select
                                value={partNumber}
                                onChange={(event) =>
                                    setPartNumber(event.target.value)
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800"
                            >
                                <option value="">All Part Number</option>
                                <option value="with">With Part Number</option>
                                <option value="without">Without Part Number</option>
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <select
                                value={perPage}
                                onChange={(event) =>
                                    handlePerPageChange(event.target.value)
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800"
                            >
                                <option value="10">10 rows</option>
                                <option value="25">25 rows</option>
                                <option value="50">50 rows</option>
                                <option value="100">100 rows</option>
                            </select>
                        </div>

                        <div className="flex gap-2 lg:col-span-2">
                            <button
                                type="submit"
                                className="h-12 flex-1 rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white"
                            >
                                Search
                            </button>

                            <button
                                type="button"
                                onClick={handleClearFilter}
                                className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700"
                            >
                                Clear
                            </button>
                        </div>
                    </form>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full min-w-[1150px] table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <TableHeader>No</TableHeader>
                                    <TableHeader>Item Code</TableHeader>
                                    <TableHeader>Part Number</TableHeader>
                                    <TableHeader>Description</TableHeader>
                                    <TableHeader>UOM</TableHeader>
                                    <TableHeader>Brand</TableHeader>
                                    <TableHeader>Status</TableHeader>
                                    <TableHeader>Excel Import</TableHeader>
                                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white">
                                {items.data.length > 0 ? (
                                    items.data.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {(items.current_page - 1)
                                                    * items.per_page
                                                    + index
                                                    + 1}
                                            </td>
                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                                {item.item_code}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-700">
                                                {item.part_number ?? '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div
                                                    className="max-w-[340px] truncate text-sm text-gray-700"
                                                    title={item.item_description ?? undefined}
                                                >
                                                    {item.item_description ?? '-'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-700">
                                                {item.unit_name ?? '-'}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-700">
                                                {item.brand_name ?? '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge active={item.is_active} />
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {formatDateTime(item.excel_imported_at)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedItem(item)}
                                                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Detail
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-5 py-12 text-center text-sm text-gray-500"
                                        >
                                            Data Item Master belum tersedia.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="text-sm text-gray-500">
                            Menampilkan {items.from ?? 0}–{items.to ?? 0}{' '}
                            dari {items.total} data
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {items.links.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => {
                                        if (link.url) {
                                            router.visit(link.url, {
                                                preserveState: true,
                                                preserveScroll: true,
                                            });
                                        }
                                    }}
                                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${link.active
                                        ? 'bg-brand-500 text-white'
                                        : 'border border-gray-300 bg-white text-gray-700'
                                        } disabled:opacity-50`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {selectedItem && (
                <ItemDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </AppLayout>
    );
}

function SyncProgressCard({ run }: { run: ItemSyncRun }) {
    return (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="font-bold text-brand-700">
                        Progress Sinkronisasi
                    </h2>
                    <p className="mt-1 text-sm text-brand-600">
                        Halaman {run.current_page} dari {run.total_pages || '-'}
                    </p>
                </div>
                <SyncStatusBadge status={run.status} />
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                <div
                    className="h-full rounded-full bg-brand-500"
                    style={{
                        width: `${Math.max(
                            0,
                            Math.min(100, run.progress_percentage),
                        )}%`,
                    }}
                />
            </div>
        </div>
    );
}

function ImportProgressCard({ run }: { run: ItemImportRun }) {
    return (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-bold text-blue-700">
                        Import Excel Detail
                    </h2>
                    <p className="mt-1 text-sm text-blue-600">
                        {run.original_filename}
                    </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                    {run.status}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <ImportMetric label="Processed" value={run.processed_rows} />
                <ImportMetric label="Updated" value={run.updated_rows} />
                <ImportMetric label="Unmatched" value={run.unmatched_rows} />
                <ImportMetric label="Skipped" value={run.skipped_rows} />
                <ImportMetric label="Failed" value={run.failed_rows} />
            </div>

            {run.error_message && (
                <div className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700">
                    {run.error_message}
                </div>
            )}
        </div>
    );
}

function ImportMetric({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-xl border border-blue-100 bg-white px-4 py-3">
            <div className="text-xs font-semibold text-gray-500">
                {label}
            </div>
            <div className="mt-1 text-xl font-bold text-gray-900">
                {value.toLocaleString('id-ID')}
            </div>
        </div>
    );
}

function CompactStat({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <span>
            {label}:{' '}
            <strong className="text-gray-800">
                {value.toLocaleString('id-ID')}
            </strong>
        </span>
    );
}

function ChevronIcon({
    collapsed,
}: {
    collapsed: boolean;
}) {
    return (
        <svg
            viewBox="0 0 20 20"
            fill="none"
            className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''
                }`}
            aria-hidden="true"
        >
            <path
                d="M5 12.5L10 7.5L15 12.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function SyncStatusBadge({
    status,
}: {
    status: ItemSyncStatus;
}) {
    const statusClass: Record<ItemSyncStatus, string> = {
        PENDING: 'bg-amber-100 text-amber-700',
        PROCESSING: 'bg-blue-100 text-blue-700',
        COMPLETED: 'bg-green-100 text-green-700',
        FAILED: 'bg-red-100 text-red-700',
        CANCELLED: 'bg-gray-200 text-gray-700',
    };

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass[status]}`}
        >
            {status}
        </span>
    );
}

function TableHeader({ children }: { children: ReactNode }) {
    return (
        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            {children}
        </th>
    );
}

function MetricCard({
    label,
    value,
    description,
    accentClass,
}: {
    label: string;
    value: number;
    description: string;
    accentClass: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-gray-500">
                        {label}
                    </p>
                    <p className="mt-3 text-3xl font-bold text-gray-900">
                        {value.toLocaleString('id-ID')}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-xs font-bold ${accentClass}`}
                >
                    {value.toLocaleString('id-ID')}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${active
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
                }`}
        >
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function ItemDetailModal({
    item,
    onClose,
}: {
    item: ItemMaster;
    onClose: () => void;
}) {
    const sections = [
        {
            title: 'Basic Information',
            items: [
                ['Item Code', item.item_code],
                ['Part Number', formatValue(item.part_number)],
                ['Description', formatValue(item.item_description)],
                ['UOM', formatValue(item.unit_name)],
                ['Category', formatValue(item.category_name)],
                ['Type', formatValue(item.item_type)],
                ['Brand', formatValue(item.brand_name)],
                ['Preferred Vendor', formatValue(item.preferred_vendor)],
            ],
        },
        {
            title: 'Inventory',
            items: [
                ['Minimum Stock', formatValue(item.minimum_stock)],
                ['Total Stock', formatValue(item.total_stock)],
                ['Reorder Quantity', formatValue(item.reorder_quantity)],
                ['Maximum Quantity', formatValue(item.maximum_quantity)],
                ['Class Movement', formatValue(item.class_movement)],
            ],
        },
        {
            title: 'Compatibility',
            items: [
                [
                    'Cross Reference Part No',
                    formatValue(item.cross_reference_part_no),
                ],
                ['Equipment Type', formatValue(item.equipment_type)],
                [
                    'Compatible Equipment Model',
                    formatValue(item.compatible_equipment_model),
                ],
                ['Specification', formatValue(item.specification)],
            ],
        },
        {
            title: 'Warehouse Location',
            items: [
                ['Bin Location BPN', formatValue(item.bin_location_bpn)],
                ['Bin Location JKT', formatValue(item.bin_location_jkt)],
            ],
        },
        {
            title: 'Dimension',
            items: [
                ['Length (cm)', formatValue(item.length_cm)],
                ['Width (cm)', formatValue(item.width_cm)],
                ['Height (cm)', formatValue(item.height_cm)],
                ['Weight (gr)', formatValue(item.weight_gram)],
            ],
        },
        {
            title: 'Synchronization',
            items: [
                ['Accurate ID', item.accurate_id],
                ['Accurate Status', item.is_active ? 'Active' : 'Inactive'],
                [
                    'Excel Inactive',
                    item.excel_inactive === null
                        ? '-'
                        : item.excel_inactive
                            ? 'Ya'
                            : 'Tidak',
                ],
                ['Accurate Last Sync', formatDateTime(item.last_sync_at)],
                [
                    'Excel Imported At',
                    formatDateTime(item.excel_imported_at),
                ],
                [
                    'Excel Source File',
                    formatValue(item.excel_source_file),
                ],
                ['Sync Error', formatValue(item.sync_error)],
            ],
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
            <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Item Master Detail
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Detail Accurate dan hasil import Excel.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-5">
                    {sections.map((section) => (
                        <section
                            key={section.title}
                            className="overflow-hidden rounded-xl border border-gray-200"
                        >
                            <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
                                <h3 className="text-sm font-bold text-gray-800">
                                    {section.title}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {section.items.map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="border-b border-gray-100 px-5 py-4 md:border-r"
                                    >
                                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            {label}
                                        </div>
                                        <div className="mt-1 break-words text-sm font-medium text-gray-900">
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
