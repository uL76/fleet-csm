import AppLayout from '@/layouts/tailadmin/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from 'react';

type Warehouse = {
    id: number;
    accurate_id: string;
    accurate_location_id: string | null;
    warehouse_name: string;
    description: string | null;
    street: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    zipcode: string | null;
    pic: string | null;
    is_damage_warehouse: boolean;
    is_active: boolean;
    accurate_raw: Record<string, unknown> | null;
    last_sync_at: string | null;
    created_at: string;
    updated_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedWarehouses = {
    data: Warehouse[];
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
    damage: number;
    normal: number;
};

type Filters = {
    search?: string;
    status?: string;
    type?: string;
    per_page?: number;
};

type SyncResult = {
    total_accurate: number;
    inserted: number;
    updated: number;
    skipped: number;
    inactivated: number;
    synced_at: string;
};

type Flash = {
    success?: string;
    error?: string;
    sync_result?: SyncResult;
};

type PageProps = {
    warehouses: PaginatedWarehouses;
    summary: Summary;
    filters: Filters;
    lastSyncAt: string | null;
    flash?: Flash;
};

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

function buildAddress(warehouse: Warehouse): string {
    return [
        warehouse.street,
        warehouse.city,
        warehouse.province,
        warehouse.country,
        warehouse.zipcode,
    ]
        .filter((value): value is string => Boolean(value))
        .join(', ');
}

export default function WarehouseIndex() {
    const {
        warehouses,
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

    const [type, setType] = useState(
        filters.type ?? '',
    );

    const [perPage, setPerPage] = useState(
        String(filters.per_page ?? 10),
    );

    const [syncing, setSyncing] = useState(false);

    const [
        selectedWarehouse,
        setSelectedWarehouse,
    ] = useState<Warehouse | null>(null);

    const summaryCards = useMemo(
        () => [
            {
                label: 'Total Warehouse',
                value: summary.total,
                description: 'Seluruh warehouse lokal',
                accentClass:
                    'bg-brand-50 text-brand-600',
            },
            {
                label: 'Active',
                value: summary.active,
                description: 'Warehouse aktif',
                accentClass:
                    'bg-green-50 text-green-600',
            },
            {
                label: 'Inactive',
                value: summary.inactive,
                description: 'Warehouse tidak aktif',
                accentClass:
                    'bg-red-50 text-red-600',
            },
            {
                label: 'Damage',
                value: summary.damage,
                description: 'Damage warehouse',
                accentClass:
                    'bg-amber-50 text-amber-600',
            },
            {
                label: 'Normal',
                value: summary.normal,
                description: 'Warehouse normal',
                accentClass:
                    'bg-blue-50 text-blue-600',
            },
        ],
        [summary],
    );

    useEffect(() => {
        setSearch(filters.search ?? '');
        setStatus(filters.status ?? '');
        setType(filters.type ?? '');
        setPerPage(
            String(filters.per_page ?? 10),
        );
    }, [filters]);

    const handleSearch = (
        event: FormEvent,
    ) => {
        event.preventDefault();

        router.get(
            '/warehouse/warehouses',
            {
                search,
                status,
                type,
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
        setType('');
        setPerPage('10');

        router.get(
            '/warehouse/warehouses',
            {},
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSyncWarehouse = () => {
        if (syncing) {
            return;
        }

        const confirmed = window.confirm(
            'Sinkronkan seluruh data warehouse dari Accurate?',
        );

        if (!confirmed) {
            return;
        }

        router.post(
            '/warehouse/warehouses/sync',
            {},
            {
                preserveScroll: true,
                onStart: () => {
                    setSyncing(true);
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
            '/warehouse/warehouses',
            {
                search,
                status,
                type,
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
            <Head title="Warehouse Accurate" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Warehouse Accurate
                        </h1>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Master warehouse yang
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
                        onClick={handleSyncWarehouse}
                        disabled={syncing}
                        className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {syncing
                            ? 'Syncing Warehouse...'
                            : 'Sync Warehouse'}
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
                                    Data Accurate berhasil
                                    diproses pada{' '}
                                    {
                                        flash.sync_result
                                            .synced_at
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                            <SyncResultItem
                                label="Total Accurate"
                                value={
                                    flash.sync_result
                                        .total_accurate
                                }
                            />

                            <SyncResultItem
                                label="Inserted"
                                value={
                                    flash.sync_result
                                        .inserted
                                }
                            />

                            <SyncResultItem
                                label="Updated"
                                value={
                                    flash.sync_result
                                        .updated
                                }
                            />

                            <SyncResultItem
                                label="Skipped"
                                value={
                                    flash.sync_result
                                        .skipped
                                }
                            />

                            <SyncResultItem
                                label="Inactivated"
                                value={
                                    flash.sync_result
                                        .inactivated
                                }
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {summaryCards.map((card) => (
                        <MetricCard
                            key={card.label}
                            label={card.label}
                            value={card.value}
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
                        onSubmit={handleSearch}
                        className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-12"
                    >
                        <div className="lg:col-span-4">
                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target
                                            .value,
                                    )
                                }
                                placeholder="Search warehouse, Accurate ID, city, province, PIC..."
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>

                        <div className="lg:col-span-2">
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
                                value={type}
                                onChange={(event) =>
                                    setType(
                                        event.target
                                            .value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="">
                                    All Type
                                </option>
                                <option value="normal">
                                    Normal
                                </option>
                                <option value="damage">
                                    Damage
                                </option>
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <select
                                value={perPage}
                                onChange={(event) =>
                                    handlePerPageChange(
                                        event.target
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
                        <table className="w-full min-w-[1250px] table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        No
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Warehouse
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Accurate ID
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Location ID
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        City
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Province
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        PIC
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Type
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
                                {warehouses.data.length >
                                    0 ? (
                                    warehouses.data.map(
                                        (
                                            warehouse,
                                            index,
                                        ) => (
                                            <tr
                                                key={
                                                    warehouse.id
                                                }
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="px-5 py-4 text-sm font-medium text-gray-600">
                                                    {(warehouses.current_page -
                                                        1) *
                                                        warehouses.per_page +
                                                        index +
                                                        1}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-semibold text-gray-900">
                                                        {
                                                            warehouse.warehouse_name
                                                        }
                                                    </div>

                                                    <div
                                                        className="mt-1 max-w-[320px] truncate text-xs font-medium text-gray-500"
                                                        title={
                                                            buildAddress(
                                                                warehouse,
                                                            ) ||
                                                            undefined
                                                        }
                                                    >
                                                        {buildAddress(
                                                            warehouse,
                                                        ) ||
                                                            '-'}
                                                    </div>

                                                    {warehouse.description && (
                                                        <div
                                                            className="mt-1 max-w-[320px] truncate text-xs text-gray-400"
                                                            title={
                                                                warehouse.description
                                                            }
                                                        >
                                                            {
                                                                warehouse.description
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {
                                                        warehouse.accurate_id
                                                    }
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {warehouse.accurate_location_id ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-gray-600">
                                                    {warehouse.city ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-gray-600">
                                                    {warehouse.province ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-gray-600">
                                                    {warehouse.pic ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <StatusBadge
                                                        active={
                                                            warehouse.is_active
                                                        }
                                                    />
                                                </td>

                                                <td className="px-5 py-4">
                                                    <TypeBadge
                                                        damage={
                                                            warehouse.is_damage_warehouse
                                                        }
                                                    />
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                    {formatDateTime(
                                                        warehouse.last_sync_at,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedWarehouse(
                                                                    warehouse,
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
                                            colSpan={11}
                                            className="px-5 py-12 text-center text-sm font-medium text-gray-500"
                                        >
                                            Data warehouse
                                            belum tersedia.
                                            Silakan klik
                                            Sync Warehouse.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="text-sm font-medium text-gray-500">
                            Menampilkan{' '}
                            {warehouses.from ?? 0}–
                            {warehouses.to ?? 0} dari{' '}
                            {warehouses.total} data
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {warehouses.links.map(
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

            {selectedWarehouse && (
                <WarehouseDetailModal
                    warehouse={selectedWarehouse}
                    onClose={() =>
                        setSelectedWarehouse(null)
                    }
                />
            )}
        </AppLayout>
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
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${accentClass}`}
                >
                    {value}
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
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function TypeBadge({
    damage,
}: {
    damage: boolean;
}) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${damage
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
        >
            {damage ? 'Damage' : 'Normal'}
        </span>
    );
}

function WarehouseDetailModal({
    warehouse,
    onClose,
}: {
    warehouse: Warehouse;
    onClose: () => void;
}) {
    const detailItems: Array<{
        label: string;
        value: string;
    }> = [
            {
                label: 'Warehouse Name',
                value: warehouse.warehouse_name,
            },
            {
                label: 'Accurate ID',
                value: warehouse.accurate_id,
            },
            {
                label: 'Accurate Location ID',
                value:
                    warehouse.accurate_location_id ??
                    '-',
            },
            {
                label: 'Description',
                value: warehouse.description ?? '-',
            },
            {
                label: 'Street',
                value: warehouse.street ?? '-',
            },
            {
                label: 'City',
                value: warehouse.city ?? '-',
            },
            {
                label: 'Province',
                value: warehouse.province ?? '-',
            },
            {
                label: 'Country',
                value: warehouse.country ?? '-',
            },
            {
                label: 'Zipcode',
                value: warehouse.zipcode ?? '-',
            },
            {
                label: 'PIC',
                value: warehouse.pic ?? '-',
            },
            {
                label: 'Status',
                value: warehouse.is_active
                    ? 'Active'
                    : 'Inactive',
            },
            {
                label: 'Type',
                value:
                    warehouse.is_damage_warehouse
                        ? 'Damage'
                        : 'Normal',
            },
            {
                label: 'Last Sync',
                value: formatDateTime(
                    warehouse.last_sync_at,
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
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Warehouse Detail
                        </h2>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Informasi detail warehouse
                            hasil sinkronisasi Accurate.
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
                        (item, index) => (
                            <div
                                key={item.label}
                                className={`grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[190px_1fr] sm:gap-4 ${index <
                                        detailItems.length -
                                        1
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
