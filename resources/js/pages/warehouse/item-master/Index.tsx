import AppLayout from '@/layouts/tailadmin/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from 'react';

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

type SyncError = {
    accurate_id: string | null;
    item_code: string | null;
    message: string;
};

type SyncResult = {
    total_accurate: number;
    inserted: number;
    updated: number;
    skipped: number;
    failed: number;
    inactivated: number;
    synced_at: string;
    errors?: SyncError[];
};

type Flash = {
    success?: string;
    error?: string;
    sync_result?: SyncResult;
};

type PageProps = {
    items: PaginatedItemMasters;
    summary: Summary;
    filters: Filters;
    lastSyncAt: string | null;
    flash?: Flash;
};

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

export default function ItemMasterIndex() {
    const {
        items,
        summary,
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

    const [partNumber, setPartNumber] =
        useState(
            filters.part_number ?? '',
        );

    const [perPage, setPerPage] =
        useState(
            String(
                filters.per_page ?? 10,
            ),
        );

    const [syncing, setSyncing] =
        useState(false);

    const [
        selectedItem,
        setSelectedItem,
    ] = useState<ItemMaster | null>(
        null,
    );

    const summaryCards = useMemo(
        () => [
            {
                label: 'Total Item',
                value: summary.total,
                description:
                    'Seluruh Item Master lokal',
                accentClass:
                    'bg-brand-50 text-brand-600',
            },
            {
                label: 'Active',
                value: summary.active,
                description:
                    'Item aktif di Accurate',
                accentClass:
                    'bg-green-50 text-green-600',
            },
            {
                label: 'Inactive',
                value: summary.inactive,
                description:
                    'Item nonaktif di Accurate',
                accentClass:
                    'bg-red-50 text-red-600',
            },
            {
                label: 'With Part Number',
                value:
                    summary.with_part_number,
                description:
                    'Item memiliki charField1',
                accentClass:
                    'bg-blue-50 text-blue-600',
            },
            {
                label: 'Without Part Number',
                value:
                    summary.without_part_number,
                description:
                    'Item tanpa charField1',
                accentClass:
                    'bg-amber-50 text-amber-600',
            },
        ],
        [summary],
    );

    useEffect(() => {
        setSearch(
            filters.search ?? '',
        );

        setStatus(
            filters.status ?? '',
        );

        setPartNumber(
            filters.part_number ?? '',
        );

        setPerPage(
            String(
                filters.per_page ?? 10,
            ),
        );
    }, [filters]);

    const handleSearch = (
        event: FormEvent,
    ) => {
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
            return;
        }

        const result = await Swal.fire({
            title: 'Sinkronisasi Item Master',
            text: 'Seluruh data item akan ditarik dari Accurate. Proses dapat memerlukan waktu.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, sinkronkan',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            focusCancel: true,
        });

        if (!result.isConfirmed) {
            return;
        }

        router.post(
            '/warehouse/item-master/sync',
            {},
            {
                preserveScroll: true,

                onStart: () => {
                    setSyncing(true);

                    Swal.fire({
                        title: 'Sinkronisasi berlangsung',
                        html: `
                        <div style="margin-top:8px">
                            Sedang menarik daftar dan detail item dari Accurate.
                        </div>
                        <div style="margin-top:8px;font-size:12px;color:#64748b">
                            Jangan menutup atau me-refresh halaman ini.
                        </div>
                    `,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,

                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });
                },

                onSuccess: (page) => {
                    const props = page.props as {
                        flash?: {
                            success?: string;
                            error?: string;
                            sync_result?: {
                                total_accurate: number;
                                inserted: number;
                                updated: number;
                                skipped: number;
                                failed: number;
                                inactivated: number;
                            };
                        };
                    };

                    const flash = props.flash;
                    const syncResult =
                        flash?.sync_result;

                    if (flash?.error) {
                        Swal.fire({
                            title: 'Sinkronisasi gagal',
                            text: flash.error,
                            icon: 'error',
                            confirmButtonText: 'Tutup',
                        });

                        return;
                    }

                    Swal.fire({
                        title: 'Sinkronisasi selesai',
                        icon: 'success',
                        html: syncResult
                            ? `
                            <div style="text-align:left;line-height:1.8">
                                <div><strong>Total Accurate:</strong> ${syncResult.total_accurate}</div>
                                <div><strong>Inserted:</strong> ${syncResult.inserted}</div>
                                <div><strong>Updated:</strong> ${syncResult.updated}</div>
                                <div><strong>Skipped:</strong> ${syncResult.skipped}</div>
                                <div><strong>Failed:</strong> ${syncResult.failed}</div>
                                <div><strong>Inactivated:</strong> ${syncResult.inactivated}</div>
                            </div>
                        `
                            : flash?.success ??
                            'Sinkronisasi berhasil.',
                        confirmButtonText: 'Selesai',
                    });
                },

                onError: (errors) => {
                    const message =
                        Object.values(errors)
                            .map((error) =>
                                String(error),
                            )
                            .join('\n') ||
                        'Terjadi kesalahan saat sinkronisasi.';

                    Swal.fire({
                        title: 'Sinkronisasi gagal',
                        text: message,
                        icon: 'error',
                        confirmButtonText: 'Tutup',
                    });
                },

                onFinish: () => {
                    setSyncing(false);
                },
            },
        );
    };

    const handlePerPageChange = (
        value: string,
    ) => {
        setPerPage(value);

        router.get(
            '/warehouse/item-master',
            {
                search,
                status,
                part_number:
                    partNumber,
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

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Item Master Accurate
                        </h1>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Master item yang
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
                        onClick={
                            handleSyncItemMaster
                        }
                        disabled={syncing}
                        className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {syncing
                            ? 'Syncing Item...'
                            : 'Sync Item Master'}
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
                                Sinkronisasi diproses
                                pada{' '}
                                {
                                    flash
                                        .sync_result
                                        .synced_at
                                }
                            </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                            <SyncResultItem
                                label="Total Accurate"
                                value={
                                    flash
                                        .sync_result
                                        .total_accurate
                                }
                            />

                            <SyncResultItem
                                label="Inserted"
                                value={
                                    flash
                                        .sync_result
                                        .inserted
                                }
                            />

                            <SyncResultItem
                                label="Updated"
                                value={
                                    flash
                                        .sync_result
                                        .updated
                                }
                            />

                            <SyncResultItem
                                label="Skipped"
                                value={
                                    flash
                                        .sync_result
                                        .skipped
                                }
                            />

                            <SyncResultItem
                                label="Failed"
                                value={
                                    flash
                                        .sync_result
                                        .failed
                                }
                            />

                            <SyncResultItem
                                label="Inactivated"
                                value={
                                    flash
                                        .sync_result
                                        .inactivated
                                }
                            />
                        </div>

                        {flash.sync_result
                            .errors &&
                            flash.sync_result
                                .errors.length >
                            0 && (
                                <div className="mt-4 rounded-xl border border-red-200 bg-white p-4">
                                    <h3 className="text-sm font-bold text-red-700">
                                        Error Item
                                    </h3>

                                    <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                                        {flash.sync_result.errors.map(
                                            (
                                                error,
                                                index,
                                            ) => (
                                                <div
                                                    key={`${error.accurate_id}-${index}`}
                                                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                                                >
                                                    Item{' '}
                                                    {error.item_code ??
                                                        '-'}
                                                    :{' '}
                                                    {
                                                        error.message
                                                    }
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {summaryCards.map(
                        (card) => (
                            <MetricCard
                                key={
                                    card.label
                                }
                                label={
                                    card.label
                                }
                                value={
                                    card.value
                                }
                                description={
                                    card.description
                                }
                                accentClass={
                                    card.accentClass
                                }
                            />
                        ),
                    )}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <form
                        onSubmit={
                            handleSearch
                        }
                        className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-12"
                    >
                        <div className="lg:col-span-4">
                            <input
                                type="search"
                                value={search}
                                onChange={(
                                    event,
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Search item code, part number, description, UOM..."
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <select
                                value={status}
                                onChange={(
                                    event,
                                ) =>
                                    setStatus(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="">
                                    All Status
                                </option>

                                <option value="active">
                                    Active
                                </option>

                                <option value="inactive">
                                    Inactive
                                </option>
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <select
                                value={
                                    partNumber
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setPartNumber(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="">
                                    All Part Number
                                </option>

                                <option value="with">
                                    With Part Number
                                </option>

                                <option value="without">
                                    Without Part Number
                                </option>
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <select
                                value={perPage}
                                onChange={(
                                    event,
                                ) =>
                                    handlePerPageChange(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="10">
                                    10 rows
                                </option>

                                <option value="25">
                                    25 rows
                                </option>

                                <option value="50">
                                    50 rows
                                </option>

                                <option value="100">
                                    100 rows
                                </option>
                            </select>
                        </div>

                        <div className="flex gap-2 lg:col-span-2">
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
                        <table className="w-full min-w-[1050px] table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <TableHeader>
                                        No
                                    </TableHeader>

                                    <TableHeader>
                                        Item Code
                                    </TableHeader>

                                    <TableHeader>
                                        Part Number
                                    </TableHeader>

                                    <TableHeader>
                                        Part Description
                                    </TableHeader>

                                    <TableHeader>
                                        UOM
                                    </TableHeader>

                                    <TableHeader>
                                        Status
                                    </TableHeader>

                                    <TableHeader>
                                        Last Sync
                                    </TableHeader>

                                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white">
                                {items.data
                                    .length >
                                    0 ? (
                                    items.data.map(
                                        (
                                            item,
                                            index,
                                        ) => (
                                            <tr
                                                key={
                                                    item.id
                                                }
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="px-5 py-4 text-sm font-medium text-gray-600">
                                                    {(items.current_page -
                                                        1) *
                                                        items.per_page +
                                                        index +
                                                        1}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">
                                                    {
                                                        item.item_code
                                                    }
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-700">
                                                    {item.part_number ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div
                                                        className="max-w-[380px] truncate text-sm font-medium text-gray-700"
                                                        title={
                                                            item.item_description ??
                                                            undefined
                                                        }
                                                    >
                                                        {item.item_description ??
                                                            '-'}
                                                    </div>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-700">
                                                    {item.unit_name ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <StatusBadge
                                                        active={
                                                            item.is_active
                                                        }
                                                    />
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                    {formatDateTime(
                                                        item.last_sync_at,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedItem(
                                                                    item,
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
                                            colSpan={
                                                8
                                            }
                                            className="px-5 py-12 text-center text-sm font-medium text-gray-500"
                                        >
                                            Data Item
                                            Master belum
                                            tersedia.
                                            Silakan klik
                                            Sync Item
                                            Master.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="text-sm font-medium text-gray-500">
                            Menampilkan{' '}
                            {items.from ?? 0}–
                            {items.to ?? 0} dari{' '}
                            {items.total} data
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {items.links.map(
                                (
                                    link,
                                    index,
                                ) => (
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
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                link.label,
                                        }}
                                    />
                                ),
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedItem && (
                <ItemDetailModal
                    item={selectedItem}
                    onClose={() =>
                        setSelectedItem(
                            null,
                        )
                    }
                />
            )}
        </AppLayout>
    );
}

function TableHeader({
    children,
}: {
    children: React.ReactNode;
}) {
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
                        {value.toLocaleString(
                            'id-ID',
                        )}
                    </p>

                    <p className="mt-2 text-xs font-medium text-gray-500">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-xs font-bold ${accentClass}`}
                >
                    {value.toLocaleString(
                        'id-ID',
                    )}
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
                {value.toLocaleString(
                    'id-ID',
                )}
            </div>
        </div>
    );
}

function StatusBadge({
    active,
}: {
    active: boolean;
}) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${active
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
                }`}
        >
            {active
                ? 'Active'
                : 'Inactive'}
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
    const detailItems = [
        {
            label: 'Item Code',
            value: item.item_code,
        },
        {
            label: 'Part Number',
            value:
                item.part_number ?? '-',
        },
        {
            label: 'Part Description',
            value:
                item.item_description ??
                '-',
        },
        {
            label: 'UOM',
            value:
                item.unit_name ?? '-',
        },
        {
            label: 'Accurate ID',
            value:
                item.accurate_id,
        },
        {
            label: 'Status',
            value: item.is_active
                ? 'Active'
                : 'Inactive',
        },
        {
            label: 'Last Sync',
            value: formatDateTime(
                item.last_sync_at,
            ),
        },
        {
            label: 'Sync Error',
            value:
                item.sync_error ?? '-',
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
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Item Master Detail
                        </h2>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Informasi item hasil
                            sinkronisasi Accurate.
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

                <div className="overflow-hidden rounded-xl border border-gray-200">
                    {detailItems.map(
                        (
                            detail,
                            index,
                        ) => (
                            <div
                                key={
                                    detail.label
                                }
                                className={`grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[190px_1fr] sm:gap-4 ${index <
                                    detailItems.length -
                                    1
                                    ? 'border-b border-gray-100'
                                    : ''
                                    }`}
                            >
                                <div className="text-sm font-semibold text-gray-500">
                                    {
                                        detail.label
                                    }
                                </div>

                                <div className="break-words text-sm font-medium text-gray-900">
                                    {
                                        detail.value
                                    }
                                </div>
                            </div>
                        ),
                    )}
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
