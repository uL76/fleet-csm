import AppLayout from '@/layouts/tailadmin/AppLayout';
import {
    Head,
    router,
    usePage,
} from '@inertiajs/react';
import {
    FormEvent,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react';

type UserSummary = {
    id: number;
    name: string;
    email: string;
};

type DepartmentSummary = {
    id: number;
    department_code: string;
    department_name: string;
};

type CompanySummary = {
    id: number;
    company_code: string;
    company_name: string;
};

type MaterialRequestStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'IN_REVIEW'
    | 'REVIEWED'
    | 'APPROVED'
    | 'REVISION'
    | 'REJECTED'
    | 'CANCELLED'
    | 'CLOSED';

type MaterialRequestPriority =
    | 'EMERGENCY'
    | 'HIGH'
    | 'MEDIUM'
    | 'LOW';

type MaterialRequestType =
    | 'STOCK_REPLENISHMENT'
    | 'CUSTOMER_ORDER'
    | 'OFFICE_SUPPLY'
    | 'OTHER';

type MaterialRequest = {
    id: number;
    mr_number: string;
    mr_date: string;
    requested_by: number;
    department_id: number;
    company_id: number | null;
    branch: string | null;
    priority: MaterialRequestPriority;
    required_date: string | null;
    request_type: MaterialRequestType;
    customer_name: string | null;
    sales_order_no: string | null;
    reference_rfq: string | null;
    subject: string;
    remarks: string | null;
    status: MaterialRequestStatus;
    current_approval_sequence: number | null;
    submitted_at: string | null;
    reviewed_at: string | null;
    approved_at: string | null;
    rejected_at: string | null;
    closed_at: string | null;
    created_at: string;
    updated_at: string;
    items_count: number;
    requester: UserSummary;
    department: DepartmentSummary;
    company: CompanySummary | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedMaterialRequests = {
    data: MaterialRequest[];
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
    draft: number;
    submitted: number;
    reviewed: number;
    approved: number;
    revision: number;
    rejected: number;
};

type Filters = {
    search?: string;
    department_id?: number | string | null;
    status?: string;
    priority?: string;
    date_from?: string | null;
    date_to?: string | null;
    per_page?: number;
};

type Permissions = {
    can_create: boolean;
};

type Flash = {
    success?: string;
    error?: string;
};

type PageProps = {
    materialRequests: PaginatedMaterialRequests;
    summary: Summary;
    departments: DepartmentSummary[];
    filters: Filters;
    permissions: Permissions;
    flash?: Flash;
};

const HEADER_COLLAPSE_STORAGE_KEY =
    'fleet-csm-material-request-header-collapsed';

function formatDate(value: string | null): string {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

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

function formatRequestType(
    value: MaterialRequestType,
): string {
    const labels: Record<
        MaterialRequestType,
        string
    > = {
        STOCK_REPLENISHMENT:
            'Stock Replenishment',
        CUSTOMER_ORDER:
            'Customer Order',
        OFFICE_SUPPLY:
            'Office Supply',
        OTHER:
            'Other',
    };

    return labels[value];
}

function formatStatus(
    value: MaterialRequestStatus,
): string {
    const labels: Record<
        MaterialRequestStatus,
        string
    > = {
        DRAFT: 'Draft',
        SUBMITTED: 'Submitted',
        IN_REVIEW: 'In Review',
        REVIEWED: 'Reviewed',
        APPROVED: 'Approved',
        REVISION: 'Revision',
        REJECTED: 'Rejected',
        CANCELLED: 'Cancelled',
        CLOSED: 'Closed',
    };

    return labels[value];
}

function readInitialHeaderCollapsed(): boolean {
    if (typeof window === 'undefined') return false;

    return (
        window.localStorage.getItem(
            HEADER_COLLAPSE_STORAGE_KEY,
        ) === '1'
    );
}

export default function MaterialRequestIndex() {
    const {
        materialRequests,
        summary,
        departments,
        filters,
        permissions,
        flash,
    } = usePage<PageProps>().props;

    const [search, setSearch] = useState(
        filters.search ?? '',
    );

    const [
        departmentId,
        setDepartmentId,
    ] = useState(
        String(filters.department_id ?? ''),
    );

    const [status, setStatus] = useState(
        filters.status ?? '',
    );

    const [priority, setPriority] =
        useState(
            filters.priority ?? '',
        );

    const [dateFrom, setDateFrom] =
        useState(
            filters.date_from ?? '',
        );

    const [dateTo, setDateTo] =
        useState(
            filters.date_to ?? '',
        );

    const [perPage, setPerPage] =
        useState(
            String(filters.per_page ?? 10),
        );

    const [headerCollapsed, setHeaderCollapsed] =
        useState(
            readInitialHeaderCollapsed,
        );

    const [
        selectedMaterialRequest,
        setSelectedMaterialRequest,
    ] = useState<MaterialRequest | null>(
        null,
    );

    const summaryCards = useMemo(
        () => [
            {
                label: 'Total MR',
                value: summary.total,
                description:
                    'Seluruh Material Request',
                accentClass:
                    'bg-brand-50 text-brand-600',
            },
            {
                label: 'Draft',
                value: summary.draft,
                description:
                    'Belum dikirim untuk review',
                accentClass:
                    'bg-gray-100 text-gray-600',
            },
            {
                label: 'Waiting Review',
                value: summary.submitted,
                description:
                    'Menunggu proses review',
                accentClass:
                    'bg-amber-50 text-amber-600',
            },
            {
                label: 'Reviewed',
                value: summary.reviewed,
                description:
                    'Menunggu proses approval',
                accentClass:
                    'bg-blue-50 text-blue-600',
            },
            {
                label: 'Approved',
                value: summary.approved,
                description:
                    'MR sudah disetujui',
                accentClass:
                    'bg-green-50 text-green-600',
            },
            {
                label: 'Revision',
                value: summary.revision,
                description:
                    'MR membutuhkan revisi',
                accentClass:
                    'bg-orange-50 text-orange-600',
            },
            {
                label: 'Rejected',
                value: summary.rejected,
                description:
                    'MR telah ditolak',
                accentClass:
                    'bg-red-50 text-red-600',
            },
        ],
        [summary],
    );

    useEffect(() => {
        setSearch(filters.search ?? '');
        setDepartmentId(
            String(
                filters.department_id ?? '',
            ),
        );
        setStatus(filters.status ?? '');
        setPriority(filters.priority ?? '');
        setDateFrom(filters.date_from ?? '');
        setDateTo(filters.date_to ?? '');
        setPerPage(
            String(filters.per_page ?? 10),
        );
    }, [filters]);

    useEffect(() => {
        window.localStorage.setItem(
            HEADER_COLLAPSE_STORAGE_KEY,
            headerCollapsed ? '1' : '0',
        );
    }, [headerCollapsed]);

    const handleSearch = (
        event: FormEvent,
    ) => {
        event.preventDefault();

        router.get(
            '/supply-chain/material-requests',
            {
                search,
                department_id:
                    departmentId,
                status,
                priority,
                date_from: dateFrom,
                date_to: dateTo,
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
        setDepartmentId('');
        setStatus('');
        setPriority('');
        setDateFrom('');
        setDateTo('');
        setPerPage('10');

        router.get(
            '/supply-chain/material-requests',
            {},
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
            '/supply-chain/material-requests',
            {
                search,
                department_id:
                    departmentId,
                status,
                priority,
                date_from: dateFrom,
                date_to: dateTo,
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
            <Head title="Material Request" />

            <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div
                        className={`flex flex-col justify-between gap-4 sm:flex-row sm:items-center ${headerCollapsed
                                ? 'px-4 py-3'
                                : 'px-6 py-5'
                            }`}
                    >
                        <div className="min-w-0">
                            <h1
                                className={
                                    headerCollapsed
                                        ? 'text-lg font-bold text-gray-900'
                                        : 'text-2xl font-bold text-gray-900'
                                }
                            >
                                Material Request
                            </h1>

                            {!headerCollapsed && (
                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    Kelola permintaan barang dan proses persetujuan berdasarkan department.
                                </p>
                            )}

                            <div
                                className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-gray-500 ${headerCollapsed
                                        ? 'mt-1'
                                        : 'mt-2'
                                    }`}
                            >
                                {headerCollapsed && (
                                    <>
                                        <CompactStat
                                            label="Total"
                                            value={
                                                summary.total
                                            }
                                        />
                                        <CompactStat
                                            label="Draft"
                                            value={
                                                summary.draft
                                            }
                                        />
                                        <CompactStat
                                            label="Waiting Review"
                                            value={
                                                summary.submitted
                                            }
                                        />
                                        <CompactStat
                                            label="Approved"
                                            value={
                                                summary.approved
                                            }
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setHeaderCollapsed(
                                        (current) =>
                                            !current,
                                    )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                <ChevronIcon
                                    collapsed={
                                        headerCollapsed
                                    }
                                />

                                {headerCollapsed
                                    ? 'Expand Header'
                                    : 'Collapse Header'}
                            </button>

                            {permissions.can_create && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.visit(
                                            '/supply-chain/material-requests/create',
                                        )
                                    }
                                    className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                                >
                                    Create Material Request
                                </button>
                            )}
                        </div>
                    </div>
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

                {!headerCollapsed && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
                        {summaryCards.map(
                            (card) => (
                                <MetricCard
                                    key={card.label}
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
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <form
                        onSubmit={handleSearch}
                        className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-12"
                    >
                        <div className="lg:col-span-4">
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
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
                                placeholder="MR number, subject, requester, customer..."
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                                Department
                            </label>

                            <select
                                value={
                                    departmentId
                                }
                                onChange={(event) =>
                                    setDepartmentId(
                                        event.target
                                            .value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="">
                                    All Departments
                                </option>

                                {departments.map(
                                    (
                                        department,
                                    ) => (
                                        <option
                                            key={
                                                department.id
                                            }
                                            value={
                                                department.id
                                            }
                                        >
                                            {
                                                department.department_name
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
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
                                <option value="DRAFT">
                                    Draft
                                </option>
                                <option value="SUBMITTED">
                                    Submitted
                                </option>
                                <option value="IN_REVIEW">
                                    In Review
                                </option>
                                <option value="REVIEWED">
                                    Reviewed
                                </option>
                                <option value="APPROVED">
                                    Approved
                                </option>
                                <option value="REVISION">
                                    Revision
                                </option>
                                <option value="REJECTED">
                                    Rejected
                                </option>
                                <option value="CANCELLED">
                                    Cancelled
                                </option>
                                <option value="CLOSED">
                                    Closed
                                </option>
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                                Priority
                            </label>

                            <select
                                value={priority}
                                onChange={(event) =>
                                    setPriority(
                                        event.target
                                            .value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="">
                                    All Priority
                                </option>
                                <option value="EMERGENCY">
                                    Emergency
                                </option>
                                <option value="HIGH">
                                    High
                                </option>
                                <option value="MEDIUM">
                                    Medium
                                </option>
                                <option value="LOW">
                                    Low
                                </option>
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
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

                        <div className="lg:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                                MR Date From
                            </label>

                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(event) =>
                                    setDateFrom(
                                        event.target
                                            .value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                                MR Date To
                            </label>

                            <input
                                type="date"
                                value={dateTo}
                                onChange={(event) =>
                                    setDateTo(
                                        event.target
                                            .value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>

                        <div className="flex items-end gap-2 lg:col-span-4">
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
                                    <TableHeader>
                                        No
                                    </TableHeader>
                                    <TableHeader>
                                        MR Number
                                    </TableHeader>
                                    <TableHeader>
                                        Date
                                    </TableHeader>
                                    <TableHeader>
                                        Requester
                                    </TableHeader>
                                    <TableHeader>
                                        Department
                                    </TableHeader>
                                    <TableHeader>
                                        Subject
                                    </TableHeader>
                                    <TableHeader>
                                        Priority
                                    </TableHeader>
                                    <TableHeader>
                                        Required Date
                                    </TableHeader>
                                    <TableHeader>
                                        Items
                                    </TableHeader>
                                    <TableHeader>
                                        Status
                                    </TableHeader>
                                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white">
                                {materialRequests
                                    .data.length >
                                    0 ? (
                                    materialRequests.data.map(
                                        (
                                            materialRequest,
                                            index,
                                        ) => (
                                            <tr
                                                key={
                                                    materialRequest.id
                                                }
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="px-5 py-4 text-sm text-gray-600">
                                                    {(materialRequests.current_page -
                                                        1) *
                                                        materialRequests.per_page +
                                                        index +
                                                        1}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedMaterialRequest(
                                                                materialRequest,
                                                            )
                                                        }
                                                        className="text-sm font-semibold text-brand-500 hover:text-brand-600"
                                                    >
                                                        {
                                                            materialRequest.mr_number
                                                        }
                                                    </button>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                    {formatDate(
                                                        materialRequest.mr_date,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-semibold text-gray-900">
                                                        {
                                                            materialRequest.requester
                                                                .name
                                                        }
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {
                                                            materialRequest.requester
                                                                .email
                                                        }
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-sm text-gray-700">
                                                    {
                                                        materialRequest.department
                                                            .department_name
                                                    }
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div
                                                        className="max-w-[320px] truncate text-sm font-medium text-gray-900"
                                                        title={
                                                            materialRequest.subject
                                                        }
                                                    >
                                                        {
                                                            materialRequest.subject
                                                        }
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <PriorityBadge
                                                        priority={
                                                            materialRequest.priority
                                                        }
                                                    />
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                    {formatDate(
                                                        materialRequest.required_date,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-semibold text-gray-700">
                                                    {
                                                        materialRequest.items_count
                                                    }
                                                </td>

                                                <td className="px-5 py-4">
                                                    <StatusBadge
                                                        status={
                                                            materialRequest.status
                                                        }
                                                    />
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedMaterialRequest(
                                                                    materialRequest,
                                                                )
                                                            }
                                                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                                        >
                                                            Detail
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.visit(
                                                                    `/supply-chain/material-requests/${materialRequest.id}`,
                                                                )
                                                            }
                                                            className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
                                                        >
                                                            Open
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
                                            className="px-5 py-12 text-center text-sm text-gray-500"
                                        >
                                            Data Material Request belum tersedia.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="text-sm text-gray-500">
                            Menampilkan{' '}
                            {materialRequests.from ??
                                0}
                            –
                            {materialRequests.to ??
                                0}{' '}
                            dari{' '}
                            {
                                materialRequests.total
                            }{' '}
                            data
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {materialRequests.links.map(
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

            {selectedMaterialRequest && (
                <MaterialRequestDetailModal
                    materialRequest={
                        selectedMaterialRequest
                    }
                    onClose={() =>
                        setSelectedMaterialRequest(
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

                    <p className="mt-2 text-xs text-gray-500">
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
                {value.toLocaleString(
                    'id-ID',
                )}
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
            className={`h-4 w-4 transition-transform ${collapsed
                    ? 'rotate-180'
                    : ''
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

function TableHeader({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            {children}
        </th>
    );
}

function StatusBadge({
    status,
}: {
    status: MaterialRequestStatus;
}) {
    const statusClass: Record<
        MaterialRequestStatus,
        string
    > = {
        DRAFT:
            'bg-gray-100 text-gray-700',
        SUBMITTED:
            'bg-amber-100 text-amber-700',
        IN_REVIEW:
            'bg-yellow-100 text-yellow-700',
        REVIEWED:
            'bg-blue-100 text-blue-700',
        APPROVED:
            'bg-green-100 text-green-700',
        REVISION:
            'bg-orange-100 text-orange-700',
        REJECTED:
            'bg-red-100 text-red-700',
        CANCELLED:
            'bg-gray-200 text-gray-700',
        CLOSED:
            'bg-purple-100 text-purple-700',
    };

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass[status]}`}
        >
            {formatStatus(status)}
        </span>
    );
}

function PriorityBadge({
    priority,
}: {
    priority: MaterialRequestPriority;
}) {
    const priorityClass: Record<
        MaterialRequestPriority,
        string
    > = {
        EMERGENCY:
            'bg-red-100 text-red-700',
        HIGH:
            'bg-amber-100 text-amber-700',
        MEDIUM:
            'bg-blue-100 text-blue-700',
        LOW:
            'bg-green-100 text-green-700',
    };

    const labels: Record<
        MaterialRequestPriority,
        string
    > = {
        EMERGENCY: 'Emergency',
        HIGH: 'High',
        MEDIUM: 'Medium',
        LOW: 'Low',
    };

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityClass[priority]}`}
        >
            {labels[priority]}
        </span>
    );
}

function MaterialRequestDetailModal({
    materialRequest,
    onClose,
}: {
    materialRequest: MaterialRequest;
    onClose: () => void;
}) {
    const sections: Array<{
        title: string;
        items: Array<[string, string]>;
    }> = [
            {
                title: 'Request Information',
                items: [
                    [
                        'MR Number',
                        materialRequest.mr_number,
                    ],
                    [
                        'MR Date',
                        formatDate(
                            materialRequest.mr_date,
                        ),
                    ],
                    [
                        'Requester',
                        materialRequest.requester.name,
                    ],
                    [
                        'Requester Email',
                        materialRequest.requester.email,
                    ],
                    [
                        'Department',
                        materialRequest.department
                            .department_name,
                    ],
                    [
                        'Company',
                        materialRequest.company
                            ?.company_name ?? '-',
                    ],
                    [
                        'Branch',
                        materialRequest.branch ?? '-',
                    ],
                    [
                        'Subject',
                        materialRequest.subject,
                    ],
                    [
                        'Request Type',
                        formatRequestType(
                            materialRequest.request_type,
                        ),
                    ],
                    [
                        'Priority',
                        materialRequest.priority,
                    ],
                    [
                        'Required Date',
                        formatDate(
                            materialRequest.required_date,
                        ),
                    ],
                    [
                        'Total Items',
                        String(
                            materialRequest.items_count,
                        ),
                    ],
                ],
            },
            {
                title: 'Reference Information',
                items: [
                    [
                        'Customer Name',
                        materialRequest.customer_name ??
                        '-',
                    ],
                    [
                        'Sales Order No',
                        materialRequest.sales_order_no ??
                        '-',
                    ],
                    [
                        'Reference RFQ',
                        materialRequest.reference_rfq ??
                        '-',
                    ],
                    [
                        'Remarks',
                        materialRequest.remarks ?? '-',
                    ],
                ],
            },
            {
                title: 'Workflow Information',
                items: [
                    [
                        'Status',
                        formatStatus(
                            materialRequest.status,
                        ),
                    ],
                    [
                        'Current Approval Sequence',
                        materialRequest.current_approval_sequence
                            ? String(
                                materialRequest.current_approval_sequence,
                            )
                            : '-',
                    ],
                    [
                        'Submitted At',
                        formatDateTime(
                            materialRequest.submitted_at,
                        ),
                    ],
                    [
                        'Reviewed At',
                        formatDateTime(
                            materialRequest.reviewed_at,
                        ),
                    ],
                    [
                        'Approved At',
                        formatDateTime(
                            materialRequest.approved_at,
                        ),
                    ],
                    [
                        'Rejected At',
                        formatDateTime(
                            materialRequest.rejected_at,
                        ),
                    ],
                    [
                        'Closed At',
                        formatDateTime(
                            materialRequest.closed_at,
                        ),
                    ],
                    [
                        'Created At',
                        formatDateTime(
                            materialRequest.created_at,
                        ),
                    ],
                    [
                        'Updated At',
                        formatDateTime(
                            materialRequest.updated_at,
                        ),
                    ],
                ],
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
            <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Material Request Detail
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                            Informasi ringkas Material Request dan status workflow.
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

                <div className="mb-5 flex flex-wrap gap-2">
                    <StatusBadge
                        status={
                            materialRequest.status
                        }
                    />

                    <PriorityBadge
                        priority={
                            materialRequest.priority
                        }
                    />
                </div>

                <div className="space-y-5">
                    {sections.map(
                        (section) => (
                            <section
                                key={
                                    section.title
                                }
                                className="overflow-hidden rounded-xl border border-gray-200"
                            >
                                <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
                                    <h3 className="text-sm font-bold text-gray-800">
                                        {
                                            section.title
                                        }
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2">
                                    {section.items.map(
                                        ([
                                            label,
                                            value,
                                        ]) => (
                                            <div
                                                key={
                                                    label
                                                }
                                                className="border-b border-gray-100 px-5 py-4 md:border-r"
                                            >
                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    {
                                                        label
                                                    }
                                                </div>

                                                <div className="mt-1 break-words text-sm font-medium text-gray-900">
                                                    {
                                                        value
                                                    }
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </section>
                        ),
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            router.visit(
                                `/supply-chain/material-requests/${materialRequest.id}`,
                            )
                        }
                        className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                        Open Full Detail
                    </button>
                </div>
            </div>
        </div>
    );
}
