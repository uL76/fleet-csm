import AppLayout from '@/layouts/tailadmin/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

type Tone =
    | 'gray'
    | 'blue'
    | 'indigo'
    | 'purple'
    | 'amber'
    | 'green'
    | 'red';

type TrendDirection =
    | 'up'
    | 'down'
    | 'neutral';

type Summary = {
    total_mr: number;
    pending_mr: number;
    approved_mr: number;
    rejected_mr: number;
    total_pr: number;
    open_pr: number;
    closed_pr: number;
    total_po: number;
    open_po: number;
    closed_po: number;
    total_po_amount: number;
    total_vendor: number;
};

type Workflow = {
    mr_without_pr: number;
    mr_with_pr: number;
    pr_without_po: number;
    pr_with_po: number;
    mr_to_pr_percentage: number;
    pr_to_po_percentage: number;
    overall_conversion_percentage: number;
};

type StatusItem = {
    label: string;
    value: number;
    tone: Tone;
};

type Trend = {
    value: number;
    direction: TrendDirection;
    label: string;
};

type RecentActivity = {
    id: string;
    type: 'MR' | 'PR' | 'PO';
    document_number: string;
    title: string;
    status: string;
    status_tone: Tone;
    date: string | null;
    url: string | null;
};

type MonthlyProcurement = {
    month: string;
    mr: number;
    pr: number;
    po: number;
};

type PageProps = {
    summary: Summary;
    workflow: Workflow;
    mr_statuses: StatusItem[];
    pr_statuses: StatusItem[];
    po_statuses: StatusItem[];
    recent_activities: RecentActivity[];
    monthly_procurement: MonthlyProcurement[];
    trends: {
        mr: Trend;
        pr: Trend;
        po: Trend;
        po_amount: Trend;
    };
    last_updated_at: string | null;
};

const toneClasses: Record<
    Tone,
    {
        badge: string;
        icon: string;
        progress: string;
        dot: string;
    }
> = {
    gray: {
        badge: 'bg-gray-100 text-gray-700',
        icon: 'bg-gray-100 text-gray-600',
        progress: 'bg-gray-500',
        dot: 'bg-gray-500',
    },
    blue: {
        badge: 'bg-blue-100 text-blue-700',
        icon: 'bg-blue-100 text-blue-600',
        progress: 'bg-blue-500',
        dot: 'bg-blue-500',
    },
    indigo: {
        badge: 'bg-indigo-100 text-indigo-700',
        icon: 'bg-indigo-100 text-indigo-600',
        progress: 'bg-indigo-500',
        dot: 'bg-indigo-500',
    },
    purple: {
        badge: 'bg-purple-100 text-purple-700',
        icon: 'bg-purple-100 text-purple-600',
        progress: 'bg-purple-500',
        dot: 'bg-purple-500',
    },
    amber: {
        badge: 'bg-amber-100 text-amber-700',
        icon: 'bg-amber-100 text-amber-600',
        progress: 'bg-amber-500',
        dot: 'bg-amber-500',
    },
    green: {
        badge: 'bg-green-100 text-green-700',
        icon: 'bg-green-100 text-green-600',
        progress: 'bg-green-500',
        dot: 'bg-green-500',
    },
    red: {
        badge: 'bg-red-100 text-red-700',
        icon: 'bg-red-100 text-red-600',
        progress: 'bg-red-500',
        dot: 'bg-red-500',
    },
};

function formatNumber(
    value: number,
): string {
    return new Intl.NumberFormat(
        'id-ID',
    ).format(Number(value || 0));
}

function formatCurrency(
    value: number,
): string {
    return new Intl.NumberFormat(
        'id-ID',
        {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        },
    ).format(Number(value || 0));
}

function formatCompactCurrency(
    value: number,
): string {
    const amount = Number(value || 0);

    if (amount >= 1_000_000_000_000) {
        return `Rp ${(
            amount / 1_000_000_000_000
        ).toFixed(1)} T`;
    }

    if (amount >= 1_000_000_000) {
        return `Rp ${(
            amount / 1_000_000_000
        ).toFixed(1)} M`;
    }

    if (amount >= 1_000_000) {
        return `Rp ${(
            amount / 1_000_000
        ).toFixed(1)} Jt`;
    }

    return formatCurrency(amount);
}

function formatPercentage(
    value: number,
): string {
    return `${Number(value || 0).toFixed(1)}%`;
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

    return new Intl.DateTimeFormat(
        'id-ID',
        {
            dateStyle: 'medium',
            timeStyle: 'short',
        },
    ).format(date);
}

function calculatePercentage(
    value: number,
    total: number,
): number {
    if (total <= 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(
            0,
            (value / total) * 100,
        ),
    );
}

function FileIcon() {
    return (
        <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M7 3H15L20 8V19C20 20.1046 19.1046 21 18 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
            <path
                d="M15 3V8H20M8 12H16M8 16H13"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function MoneyIcon() {
    return (
        <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M12 2V22M17 6H9.5C7.567 6 6 7.343 6 9C6 10.657 7.567 12 9.5 12H14.5C16.433 12 18 13.343 18 15C18 16.657 16.433 18 14.5 18H6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M7 5L12 10L7 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function StatusBadge({
    label,
    tone,
}: {
    label: string;
    tone: Tone;
}) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone].badge
                }`}
        >
            {label}
        </span>
    );
}

function TrendDisplay({
    trend,
}: {
    trend: Trend;
}) {
    const directionClass =
        trend.direction === 'up'
            ? 'text-green-600'
            : trend.direction === 'down'
                ? 'text-red-600'
                : 'text-gray-500';

    const symbol =
        trend.direction === 'up'
            ? '↑'
            : trend.direction === 'down'
                ? '↓'
                : '−';

    return (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span
                className={`font-semibold ${directionClass}`}
            >
                {symbol} {formatPercentage(trend.value)}
            </span>

            <span className="text-gray-500">
                {trend.label}
            </span>
        </div>
    );
}

function SummaryCard({
    title,
    value,
    description,
    href,
    tone,
    trend,
    icon,
}: {
    title: string;
    value: string;
    description: string;
    href: string;
    tone: Tone;
    trend: Trend;
    icon: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-600">
                        {title}
                    </p>

                    <p className="mt-2 truncate text-2xl font-bold text-gray-900">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone].icon
                        }`}
                >
                    {icon}
                </div>
            </div>

            <p className="mt-3 text-sm font-medium text-gray-500">
                {description}
            </p>

            <TrendDisplay trend={trend} />
        </Link>
    );
}

function WorkflowCard({
    title,
    code,
    value,
    description,
    detail,
    tone,
}: {
    title: string;
    code: string;
    value: number;
    description: string;
    detail: string;
    tone: Tone;
}) {
    const backgroundClass =
        tone === 'blue'
            ? 'border-blue-200 bg-blue-50'
            : tone === 'purple'
                ? 'border-purple-200 bg-purple-50'
                : 'border-green-200 bg-green-50';

    return (
        <div
            className={`rounded-xl border p-5 ${backgroundClass}`}
        >
            <div className="flex items-center justify-between gap-3">
                <p
                    className={`text-sm font-semibold ${toneClasses[tone].icon
                            .split(' ')
                            .find((className) =>
                                className.startsWith(
                                    'text-',
                                ),
                            ) ?? 'text-gray-700'
                        }`}
                >
                    {title}
                </p>

                <StatusBadge
                    label={code}
                    tone={tone}
                />
            </div>

            <p className="mt-5 text-3xl font-bold text-gray-900">
                {formatNumber(value)}
            </p>

            <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-gray-500">
                    {description}
                </span>

                <span className="font-semibold text-gray-800">
                    {detail}
                </span>
            </div>
        </div>
    );
}

function ProgressItem({
    item,
    total,
}: {
    item: StatusItem;
    total: number;
}) {
    const percentage =
        calculatePercentage(
            item.value,
            total,
        );

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${toneClasses[item.tone].dot
                            }`}
                    />

                    <span className="truncate text-sm font-semibold text-gray-700">
                        {item.label}
                    </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                        {formatNumber(item.value)}
                    </span>

                    <span className="text-xs text-gray-400">
                        {percentage.toFixed(0)}%
                    </span>
                </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                    className={`h-full rounded-full ${toneClasses[item.tone]
                            .progress
                        }`}
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>
        </div>
    );
}

function StatusPanel({
    title,
    description,
    items,
}: {
    title: string;
    description: string;
    items: StatusItem[];
}) {
    const total = items.reduce(
        (result, item) =>
            result + Number(item.value || 0),
        0,
    );

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">
                        {title}
                    </h2>

                    <p className="mt-1 text-sm font-medium text-gray-500">
                        {description}
                    </p>
                </div>

                <span className="text-lg font-bold text-gray-900">
                    {formatNumber(total)}
                </span>
            </div>

            <div className="mt-6 space-y-5">
                {items.length > 0 ? (
                    items.map((item) => (
                        <ProgressItem
                            key={item.label}
                            item={item}
                            total={total}
                        />
                    ))
                ) : (
                    <p className="py-8 text-center text-sm font-medium text-gray-500">
                        Belum ada data status.
                    </p>
                )}
            </div>
        </div>
    );
}

function QuickAccess({
    title,
    description,
    value,
    href,
    tone,
}: {
    title: string;
    description: string;
    value: number;
    href: string;
    tone: Tone;
}) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-500 hover:shadow-sm"
        >
            <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone].icon
                    }`}
            >
                <FileIcon />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-bold text-gray-900">
                        {title}
                    </p>

                    <span className="text-sm font-bold text-gray-900">
                        {formatNumber(value)}
                    </span>
                </div>

                <p className="mt-1 truncate text-xs font-medium text-gray-500">
                    {description}
                </p>
            </div>

            <div className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-brand-500">
                <ArrowIcon />
            </div>
        </Link>
    );
}

export default function DashboardIndex() {
    const {
        summary,
        workflow,
        mr_statuses,
        pr_statuses,
        po_statuses,
        recent_activities,
        monthly_procurement,
        trends,
        last_updated_at,
    } = usePage<PageProps>().props;

    const maxMonthlyValue = Math.max(
        1,
        ...monthly_procurement.flatMap(
            (item) => [
                item.mr,
                item.pr,
                item.po,
            ],
        ),
    );

    return (
        <AppLayout>
            <Head title="Procurement Dashboard" />

            <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                Supply Chain Dashboard
                            </span>

                            <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
                                Procurement Control Center
                            </h1>

                            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-gray-600">
                                Pantau perjalanan dokumen mulai
                                dari Material Request, Purchase
                                Requisition, hingga Purchase Order
                                dalam satu dashboard terintegrasi.
                            </p>

                            {last_updated_at && (
                                <p className="mt-3 text-xs font-medium text-gray-400">
                                    Terakhir diperbarui:{' '}
                                    {formatDateTime(
                                        last_updated_at,
                                    )}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/supply-chain/material-requests/create"
                                className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                            >
                                + Buat Material Request
                            </Link>

                            <Link
                                href="/purchasing/purchase-order"
                                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                            >
                                Lihat Purchase Order
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="Material Request"
                        value={formatNumber(
                            summary.total_mr,
                        )}
                        description={`${formatNumber(
                            summary.pending_mr,
                        )} menunggu proses`}
                        href="/supply-chain/material-requests"
                        tone="blue"
                        trend={trends.mr}
                        icon={<FileIcon />}
                    />

                    <SummaryCard
                        title="Purchase Requisition"
                        value={formatNumber(
                            summary.total_pr,
                        )}
                        description={`${formatNumber(
                            summary.open_pr,
                        )} PR masih terbuka`}
                        href="/purchasing/purchase-requisition"
                        tone="purple"
                        trend={trends.pr}
                        icon={<FileIcon />}
                    />

                    <SummaryCard
                        title="Purchase Order"
                        value={formatNumber(
                            summary.total_po,
                        )}
                        description={`${formatNumber(
                            summary.open_po,
                        )} PO masih terbuka`}
                        href="/purchasing/purchase-order"
                        tone="green"
                        trend={trends.po}
                        icon={<FileIcon />}
                    />

                    <SummaryCard
                        title="Total Nilai PO"
                        value={formatCompactCurrency(
                            summary.total_po_amount,
                        )}
                        description={`${formatNumber(
                            summary.total_vendor,
                        )} vendor terlibat`}
                        href="/purchasing/purchase-order"
                        tone="amber"
                        trend={trends.po_amount}
                        icon={<MoneyIcon />}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Procurement Workflow
                                </h2>

                                <p className="mt-1 text-sm font-medium text-gray-500">
                                    Tingkat konversi dokumen dari
                                    kebutuhan sampai menjadi pesanan
                                    pembelian.
                                </p>
                            </div>

                            <StatusBadge
                                label={`${formatPercentage(
                                    workflow
                                        .overall_conversion_percentage,
                                )} overall conversion`}
                                tone="green"
                            />
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <WorkflowCard
                                title="Material Request"
                                code="MR"
                                value={summary.total_mr}
                                description="Belum menjadi PR"
                                detail={formatNumber(
                                    workflow.mr_without_pr,
                                )}
                                tone="blue"
                            />

                            <WorkflowCard
                                title="Purchase Requisition"
                                code="PR"
                                value={summary.total_pr}
                                description="Konversi dari MR"
                                detail={formatPercentage(
                                    workflow
                                        .mr_to_pr_percentage,
                                )}
                                tone="purple"
                            />

                            <WorkflowCard
                                title="Purchase Order"
                                code="PO"
                                value={summary.total_po}
                                description="Konversi dari PR"
                                detail={formatPercentage(
                                    workflow
                                        .pr_to_po_percentage,
                                )}
                                tone="green"
                            />
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-600">
                                            MR sudah memiliki PR
                                        </p>

                                        <p className="mt-1 text-xl font-bold text-gray-900">
                                            {formatNumber(
                                                workflow
                                                    .mr_with_pr,
                                            )}
                                        </p>
                                    </div>

                                    <StatusBadge
                                        label={formatPercentage(
                                            workflow
                                                .mr_to_pr_percentage,
                                        )}
                                        tone="purple"
                                    />
                                </div>

                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-full rounded-full bg-purple-500"
                                        style={{
                                            width: `${workflow.mr_to_pr_percentage}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-600">
                                            PR sudah memiliki PO
                                        </p>

                                        <p className="mt-1 text-xl font-bold text-gray-900">
                                            {formatNumber(
                                                workflow
                                                    .pr_with_po,
                                            )}
                                        </p>
                                    </div>

                                    <StatusBadge
                                        label={formatPercentage(
                                            workflow
                                                .pr_to_po_percentage,
                                        )}
                                        tone="green"
                                    />
                                </div>

                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-full rounded-full bg-green-500"
                                        style={{
                                            width: `${workflow.pr_to_po_percentage}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900">
                            Quick Access
                        </h2>

                        <p className="mt-1 text-sm font-medium text-gray-500">
                            Akses cepat ke modul procurement
                            utama.
                        </p>

                        <div className="mt-5 space-y-3">
                            <QuickAccess
                                title="Material Request"
                                description="Buat dan monitor kebutuhan barang."
                                value={summary.total_mr}
                                href="/supply-chain/material-requests"
                                tone="blue"
                            />

                            <QuickAccess
                                title="Purchase Requisition"
                                description="Pantau permintaan pembelian Accurate."
                                value={summary.total_pr}
                                href="/purchasing/purchase-requisition"
                                tone="purple"
                            />

                            <QuickAccess
                                title="Purchase Order"
                                description="Monitor PO, vendor, dan nilai pembelian."
                                value={summary.total_po}
                                href="/purchasing/purchase-order"
                                tone="green"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <StatusPanel
                        title="Status Material Request"
                        description="Distribusi status workflow MR."
                        items={mr_statuses}
                    />

                    <StatusPanel
                        title="Status Purchase Requisition"
                        description="Status PR hasil sinkronisasi Accurate."
                        items={pr_statuses}
                    />

                    <StatusPanel
                        title="Status Purchase Order"
                        description="Status PO dan penyelesaian pembelian."
                        items={po_statuses}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-3">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Tren Dokumen Bulanan
                            </h2>

                            <p className="mt-1 text-sm font-medium text-gray-500">
                                Perbandingan jumlah MR, PR, dan PO
                                selama enam bulan terakhir.
                            </p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-gray-600">
                            <span className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                Material Request
                            </span>

                            <span className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                                Purchase Requisition
                            </span>

                            <span className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                Purchase Order
                            </span>
                        </div>

                        <div className="mt-7 overflow-x-auto">
                            <div className="flex min-w-[650px] items-end gap-4">
                                {monthly_procurement.map(
                                    (item) => (
                                        <div
                                            key={item.month}
                                            className="flex min-w-20 flex-1 flex-col items-center"
                                        >
                                            <div className="flex h-56 w-full items-end justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 pt-4">
                                                <div
                                                    className="w-4 rounded-t bg-blue-500"
                                                    title={`MR: ${item.mr}`}
                                                    style={{
                                                        height: `${Math.max(
                                                            3,
                                                            (item.mr /
                                                                maxMonthlyValue) *
                                                            100,
                                                        )}%`,
                                                    }}
                                                />

                                                <div
                                                    className="w-4 rounded-t bg-purple-500"
                                                    title={`PR: ${item.pr}`}
                                                    style={{
                                                        height: `${Math.max(
                                                            3,
                                                            (item.pr /
                                                                maxMonthlyValue) *
                                                            100,
                                                        )}%`,
                                                    }}
                                                />

                                                <div
                                                    className="w-4 rounded-t bg-green-500"
                                                    title={`PO: ${item.po}`}
                                                    style={{
                                                        height: `${Math.max(
                                                            3,
                                                            (item.po /
                                                                maxMonthlyValue) *
                                                            100,
                                                        )}%`,
                                                    }}
                                                />
                                            </div>

                                            <p className="mt-3 text-center text-xs font-semibold text-gray-600">
                                                {item.month}
                                            </p>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
                        <h2 className="text-lg font-bold text-gray-900">
                            Aktivitas Terbaru
                        </h2>

                        <p className="mt-1 text-sm font-medium text-gray-500">
                            Pembaruan dokumen procurement terbaru.
                        </p>

                        <div className="mt-5 divide-y divide-gray-100">
                            {recent_activities.length > 0 ? (
                                recent_activities.map(
                                    (activity) => (
                                        <Link
                                            key={activity.id}
                                            href={
                                                activity.url ||
                                                '#'
                                            }
                                            className="flex gap-3 py-4 first:pt-0 last:pb-0"
                                        >
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${activity.type ===
                                                        'MR'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : activity.type ===
                                                            'PR'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-green-100 text-green-700'
                                                    }`}
                                            >
                                                {activity.type}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-gray-900">
                                                            {
                                                                activity.document_number
                                                            }
                                                        </p>

                                                        <p className="mt-1 truncate text-xs font-medium text-gray-500">
                                                            {
                                                                activity.title
                                                            }
                                                        </p>
                                                    </div>

                                                    <StatusBadge
                                                        label={
                                                            activity.status
                                                        }
                                                        tone={
                                                            activity.status_tone
                                                        }
                                                    />
                                                </div>

                                                <p className="mt-2 text-xs font-medium text-gray-400">
                                                    {formatDateTime(
                                                        activity.date,
                                                    )}
                                                </p>
                                            </div>
                                        </Link>
                                    ),
                                )
                            ) : (
                                <p className="py-10 text-center text-sm font-medium text-gray-500">
                                    Belum ada aktivitas terbaru.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
