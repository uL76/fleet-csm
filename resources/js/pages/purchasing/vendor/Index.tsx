import AppLayout from '@/layouts/tailadmin/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from 'react';

type Vendor = {
    id: number;
    accurate_id: string;
    vendor_no: string | null;
    vendor_name: string;
    category_name: string | null;
    email: string | null;
    phone: string | null;
    mobile_phone: string | null;
    fax: string | null;
    website: string | null;
    npwp_no: string | null;
    contact_name: string | null;
    address: string | null;
    street: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    zipcode: string | null;
    notes: string | null;
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

type PaginatedVendors = {
    data: Vendor[];
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
    with_email: number;
    with_phone: number;
};

type Filters = {
    search?: string;
    status?: string;
    contact?: string;
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
    vendors: PaginatedVendors;
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

function buildAddress(vendor: Vendor): string {
    return [
        vendor.address,
        vendor.street,
        vendor.city,
        vendor.province,
        vendor.country,
        vendor.zipcode,
    ]
        .filter(
            (value): value is string =>
                Boolean(value),
        )
        .join(', ');
}

function getPhone(vendor: Vendor): string {
    return (
        vendor.phone ??
        vendor.mobile_phone ??
        '-'
    );
}

export default function VendorIndex() {
    const {
        vendors,
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

    const [contact, setContact] = useState(
        filters.contact ?? '',
    );

    const [perPage, setPerPage] = useState(
        String(filters.per_page ?? 10),
    );

    const [syncing, setSyncing] =
        useState(false);

    const [
        selectedVendor,
        setSelectedVendor,
    ] = useState<Vendor | null>(null);

    const summaryCards = useMemo(
        () => [
            {
                label: 'Total Vendor',
                value: summary.total,
                description:
                    'Seluruh vendor lokal',
                accentClass:
                    'bg-brand-50 text-brand-600',
            },
            {
                label: 'Active',
                value: summary.active,
                description: 'Vendor aktif',
                accentClass:
                    'bg-green-50 text-green-600',
            },
            {
                label: 'Inactive',
                value: summary.inactive,
                description:
                    'Vendor tidak aktif',
                accentClass:
                    'bg-red-50 text-red-600',
            },
            {
                label: 'With Email',
                value: summary.with_email,
                description:
                    'Vendor memiliki email',
                accentClass:
                    'bg-blue-50 text-blue-600',
            },
            {
                label: 'With Phone',
                value: summary.with_phone,
                description:
                    'Vendor memiliki telepon',
                accentClass:
                    'bg-amber-50 text-amber-600',
            },
        ],
        [summary],
    );

    useEffect(() => {
        setSearch(filters.search ?? '');
        setStatus(filters.status ?? '');
        setContact(filters.contact ?? '');
        setPerPage(
            String(filters.per_page ?? 10),
        );
    }, [filters]);

    const handleSearch = (
        event: FormEvent,
    ) => {
        event.preventDefault();

        router.get(
            '/purchasing/vendor',
            {
                search,
                status,
                contact,
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
        setContact('');
        setPerPage('10');

        router.get(
            '/purchasing/vendor',
            {},
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSyncVendor = () => {
        if (syncing) {
            return;
        }

        const confirmed = window.confirm(
            'Sinkronkan seluruh data vendor dari Accurate?',
        );

        if (!confirmed) {
            return;
        }

        router.post(
            '/purchasing/vendor/sync',
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
            '/purchasing/vendor',
            {
                search,
                status,
                contact,
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
            <Head title="Vendor" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Vendor
                        </h1>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Master vendor yang
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
                        onClick={handleSyncVendor}
                        disabled={syncing}
                        className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {syncing
                            ? 'Syncing Vendor...'
                            : 'Sync Vendor'}
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
                                placeholder="Search vendor, Accurate ID, email, phone, NPWP..."
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
                                value={contact}
                                onChange={(event) =>
                                    setContact(
                                        event.target
                                            .value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="">
                                    All Contact
                                </option>

                                <option value="email">
                                    With Email
                                </option>

                                <option value="phone">
                                    With Phone
                                </option>

                                <option value="no_contact">
                                    No Contact
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
                        <table className="w-full min-w-[1500px] table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        No
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Vendor
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Accurate ID
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Vendor No
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Category
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Email
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Phone
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        NPWP
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        City
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Province
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Status
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
                                {vendors.data.length >
                                    0 ? (
                                    vendors.data.map(
                                        (
                                            vendor,
                                            index,
                                        ) => (
                                            <tr
                                                key={
                                                    vendor.id
                                                }
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="px-5 py-4 text-sm font-medium text-gray-600">
                                                    {(vendors.current_page -
                                                        1) *
                                                        vendors.per_page +
                                                        index +
                                                        1}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-semibold text-gray-900">
                                                        {
                                                            vendor.vendor_name
                                                        }
                                                    </div>

                                                    <div
                                                        className="mt-1 max-w-[340px] truncate text-xs font-medium text-gray-500"
                                                        title={
                                                            buildAddress(
                                                                vendor,
                                                            ) ||
                                                            undefined
                                                        }
                                                    >
                                                        {buildAddress(
                                                            vendor,
                                                        ) ||
                                                            '-'}
                                                    </div>

                                                    {vendor.contact_name && (
                                                        <div className="mt-1 text-xs text-gray-400">
                                                            Contact:{' '}
                                                            {
                                                                vendor.contact_name
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {
                                                        vendor.accurate_id
                                                    }
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                    {vendor.vendor_no ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-gray-600">
                                                    {vendor.category_name ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-gray-600">
                                                    {vendor.email ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-gray-600">
                                                    {getPhone(
                                                        vendor,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-gray-600">
                                                    {vendor.npwp_no ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-gray-600">
                                                    {vendor.city ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-gray-600">
                                                    {vendor.province ??
                                                        '-'}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <StatusBadge
                                                        active={
                                                            vendor.is_active
                                                        }
                                                    />
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                    {formatDateTime(
                                                        vendor.last_sync_at,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedVendor(
                                                                    vendor,
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
                                            Data vendor belum
                                            tersedia. Silakan
                                            klik Sync Vendor.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="text-sm font-medium text-gray-500">
                            Menampilkan{' '}
                            {vendors.from ?? 0}–
                            {vendors.to ?? 0} dari{' '}
                            {vendors.total} data
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {vendors.links.map(
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

            {selectedVendor && (
                <VendorDetailModal
                    vendor={selectedVendor}
                    onClose={() =>
                        setSelectedVendor(null)
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

function VendorDetailModal({
    vendor,
    onClose,
}: {
    vendor: Vendor;
    onClose: () => void;
}) {
    const detailItems: Array<{
        label: string;
        value: string;
    }> = [
            {
                label: 'Vendor Name',
                value: vendor.vendor_name,
            },
            {
                label: 'Accurate ID',
                value: vendor.accurate_id,
            },
            {
                label: 'Vendor No',
                value: vendor.vendor_no ?? '-',
            },
            {
                label: 'Category',
                value: vendor.category_name ?? '-',
            },
            {
                label: 'Contact Name',
                value: vendor.contact_name ?? '-',
            },
            {
                label: 'Email',
                value: vendor.email ?? '-',
            },
            {
                label: 'Phone',
                value: vendor.phone ?? '-',
            },
            {
                label: 'Mobile Phone',
                value: vendor.mobile_phone ?? '-',
            },
            {
                label: 'Fax',
                value: vendor.fax ?? '-',
            },
            {
                label: 'Website',
                value: vendor.website ?? '-',
            },
            {
                label: 'NPWP',
                value: vendor.npwp_no ?? '-',
            },
            {
                label: 'Address',
                value: vendor.address ?? '-',
            },
            {
                label: 'Street',
                value: vendor.street ?? '-',
            },
            {
                label: 'City',
                value: vendor.city ?? '-',
            },
            {
                label: 'Province',
                value: vendor.province ?? '-',
            },
            {
                label: 'Country',
                value: vendor.country ?? '-',
            },
            {
                label: 'Zipcode',
                value: vendor.zipcode ?? '-',
            },
            {
                label: 'Notes',
                value: vendor.notes ?? '-',
            },
            {
                label: 'Status',
                value: vendor.is_active
                    ? 'Active'
                    : 'Inactive',
            },
            {
                label: 'Last Sync',
                value: formatDateTime(
                    vendor.last_sync_at,
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
                            Vendor Detail
                        </h2>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Informasi detail vendor hasil
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
