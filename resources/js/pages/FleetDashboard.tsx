import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    ClipboardList,
    Clock3,
    FileCheck2,
    FileText,
    PackageCheck,
    RefreshCcw,
    ShoppingCart,
    TrendingUp,
    Users,
    WalletCards,
    XCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

type StatusItem = {
    status: string;
    total: number;
};

type RecentDocument = {
    id: number;
    type: 'MR' | 'PR' | 'PO';
    number: string;
    date: string | null;
    status: string;
    subject: string | null;
    department?: string | null;
    vendor?: string | null;
    amount?: number | string | null;
    href: string;
};

type DashboardProps = {
    summary?: {
        material_request?: {
            total: number;
            draft: number;
            submitted: number;
            reviewed: number;
            approved: number;
            revision: number;
            rejected: number;
            closed: number;
            estimated_value: number | string;
        };
        purchase_requisition?: {
            total: number;
            open: number;
            closed: number;
            synced_today: number;
        };
        purchase_order?: {
            total: number;
            open: number;
            closed: number;
            total_amount: number | string;
            synced_today: number;
        };
        vendor?: {
            total: number;
        };
    };
    funnel?: {
        mr_approved: number;
        mr_with_pr: number;
        mr_with_po: number;
        pr_total: number;
        pr_with_po: number;
    };
    status_distribution?: {
        material_request: StatusItem[];
        purchase_requisition: StatusItem[];
        purchase_order: StatusItem[];
    };
    recent_documents?: RecentDocument[];
    last_sync?: {
        purchase_requisition: string | null;
        purchase_order: string | null;
    };
};

type StatCardProps = {
    title: string;
    value: string | number;
    description: string;
    icon: ReactNode;
    iconClassName: string;
    href?: string;
    trend?: string;
};

type ProgressItemProps = {
    label: string;
    value: number;
    total: number;
    className: string;
};

const numberFormatter = new Intl.NumberFormat('id-ID');

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

function toNumber(value: number | string | null | undefined): number {
    const parsed = Number(value ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number | string | null | undefined): string {
    return numberFormatter.format(toNumber(value));
}

function formatCurrency(value: number | string | null | undefined): string {
    return currencyFormatter.format(toNumber(value));
}

function formatDate(value: string | null | undefined): string {
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

function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return 'Belum pernah sinkron';
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

function calculatePercentage(value: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

function getStatusLabel(status: string): string {
    return status
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusBadgeClass(status: string): string {
    const normalizedStatus = status.toUpperCase();

    if (
        normalizedStatus.includes('APPROVED') ||
        normalizedStatus.includes('REVIEWED') ||
        normalizedStatus.includes('CLOSED') ||
        normalizedStatus.includes('COMPLETE')
    ) {
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400';
    }

    if (
        normalizedStatus.includes('DRAFT') ||
        normalizedStatus.includes('OPEN') ||
        normalizedStatus.includes('WAIT') ||
        normalizedStatus.includes('PENDING') ||
        normalizedStatus.includes('SUBMITTED') ||
        normalizedStatus.includes('IN_REVIEW')
    ) {
        return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400';
    }

    if (
        normalizedStatus.includes('REJECTED') ||
        normalizedStatus.includes('CANCELLED') ||
        normalizedStatus.includes('REVISION')
    ) {
        return 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400';
    }

    return 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-300';
}

function getDocumentTypeClass(type: RecentDocument['type']): string {
    switch (type) {
        case 'MR':
            return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';

        case 'PR':
            return 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400';

        case 'PO':
            return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';

        default:
            return 'bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300';
    }
}

function StatCard({
    title,
    value,
    description,
    icon,
    iconClassName,
    href,
    trend,
}: StatCardProps) {
    const content = (
        <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {title}
                    </p>

                    <p className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
                >
                    {icon}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
                <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                    {description}
                </p>

                {trend && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="size-3.5" />
                        {trend}
                    </span>
                )}
            </div>

            {href && (
                <div className="pointer-events-none absolute right-4 bottom-4 opacity-0 transition group-hover:opacity-100">
                    <ArrowRight className="size-4 text-slate-400" />
                </div>
            )}
        </div>
    );

    if (!href) {
        return content;
    }

    return (
        <Link href={href} className="block h-full">
            {content}
        </Link>
    );
}

function ProgressItem({
    label,
    value,
    total,
    className,
}: ProgressItemProps) {
    const percentage = calculatePercentage(value, total);

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-4">
                <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                </span>

                <span className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {formatNumber(value)} · {percentage}%
                </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${className}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function EmptyState({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {icon}
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {title}
            </p>

            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                {description}
            </p>
        </div>
    );
}

export default function Dashboard({
    summary,
    funnel,
    status_distribution,
    recent_documents = [],
    last_sync,
}: DashboardProps) {
    const materialRequest = {
        total: summary?.material_request?.total ?? 0,
        draft: summary?.material_request?.draft ?? 0,
        submitted: summary?.material_request?.submitted ?? 0,
        reviewed: summary?.material_request?.reviewed ?? 0,
        approved: summary?.material_request?.approved ?? 0,
        revision: summary?.material_request?.revision ?? 0,
        rejected: summary?.material_request?.rejected ?? 0,
        closed: summary?.material_request?.closed ?? 0,
        estimated_value: summary?.material_request?.estimated_value ?? 0,
    };

    const purchaseRequisition = {
        total: summary?.purchase_requisition?.total ?? 0,
        open: summary?.purchase_requisition?.open ?? 0,
        closed: summary?.purchase_requisition?.closed ?? 0,
        synced_today: summary?.purchase_requisition?.synced_today ?? 0,
    };

    const purchaseOrder = {
        total: summary?.purchase_order?.total ?? 0,
        open: summary?.purchase_order?.open ?? 0,
        closed: summary?.purchase_order?.closed ?? 0,
        total_amount: summary?.purchase_order?.total_amount ?? 0,
        synced_today: summary?.purchase_order?.synced_today ?? 0,
    };

    const procurementFunnel = {
        mr_approved: funnel?.mr_approved ?? 0,
        mr_with_pr: funnel?.mr_with_pr ?? 0,
        mr_with_po: funnel?.mr_with_po ?? 0,
        pr_total: funnel?.pr_total ?? 0,
        pr_with_po: funnel?.pr_with_po ?? 0,
    };

    const mrToPrPercentage = calculatePercentage(
        procurementFunnel.mr_with_pr,
        procurementFunnel.mr_approved,
    );

    const prToPoPercentage = calculatePercentage(
        procurementFunnel.pr_with_po,
        procurementFunnel.pr_total,
    );

    const overallConversionPercentage = calculatePercentage(
        procurementFunnel.mr_with_po,
        procurementFunnel.mr_approved,
    );

    const mrStatuses =
        status_distribution?.material_request?.length
            ? status_distribution.material_request
            : [
                { status: 'DRAFT', total: materialRequest.draft },
                { status: 'SUBMITTED', total: materialRequest.submitted },
                { status: 'REVIEWED', total: materialRequest.reviewed },
                { status: 'APPROVED', total: materialRequest.approved },
                { status: 'REVISION', total: materialRequest.revision },
                { status: 'REJECTED', total: materialRequest.rejected },
            ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Procurement" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-sm dark:border-slate-800">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 backdrop-blur">
                                <ClipboardList className="size-3.5" />
                                Procurement Control Center
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Dashboard MR, PR & PO
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                                Pantau perjalanan pengadaan mulai dari Material
                                Request, Purchase Requisition, sampai Purchase
                                Order dalam satu tampilan terintegrasi.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                                <p className="text-xs text-slate-300">
                                    MR → PR
                                </p>
                                <p className="mt-1 text-xl font-bold">
                                    {mrToPrPercentage}%
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                                <p className="text-xs text-slate-300">
                                    PR → PO
                                </p>
                                <p className="mt-1 text-xl font-bold">
                                    {prToPoPercentage}%
                                </p>
                            </div>

                            <div className="col-span-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur sm:col-span-1">
                                <p className="text-xs text-slate-300">
                                    Overall
                                </p>
                                <p className="mt-1 text-xl font-bold">
                                    {overallConversionPercentage}%
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Total Material Request"
                        value={formatNumber(materialRequest.total)}
                        description={`${formatNumber(materialRequest.approved)} MR sudah approved`}
                        href="/supply-chain/material-requests"
                        icon={<FileText className="size-5" />}
                        iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    />

                    <StatCard
                        title="Total Purchase Requisition"
                        value={formatNumber(purchaseRequisition.total)}
                        description={`${formatNumber(purchaseRequisition.open)} PR masih terbuka`}
                        href="/purchasing/purchase-requisition"
                        icon={<ClipboardList className="size-5" />}
                        iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
                    />

                    <StatCard
                        title="Total Purchase Order"
                        value={formatNumber(purchaseOrder.total)}
                        description={`${formatNumber(purchaseOrder.open)} PO masih terbuka`}
                        href="/purchasing/purchase-order"
                        icon={<ShoppingCart className="size-5" />}
                        iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    />

                    <StatCard
                        title="Total Nilai PO"
                        value={formatCurrency(purchaseOrder.total_amount)}
                        description="Akumulasi nilai seluruh Purchase Order"
                        href="/purchasing/purchase-order"
                        icon={<WalletCards className="size-5" />}
                        iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    />
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="MR Menunggu Proses"
                        value={formatNumber(
                            materialRequest.draft +
                            materialRequest.submitted +
                            materialRequest.revision,
                        )}
                        description="Draft, submitted, atau revision"
                        icon={<Clock3 className="size-5" />}
                        iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    />

                    <StatCard
                        title="MR Approved"
                        value={formatNumber(materialRequest.approved)}
                        description="Siap dilanjutkan ke proses PR"
                        icon={<CheckCircle2 className="size-5" />}
                        iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    />

                    <StatCard
                        title="PR Sinkron Hari Ini"
                        value={formatNumber(purchaseRequisition.synced_today)}
                        description="Data PR dari Accurate hari ini"
                        icon={<RefreshCcw className="size-5" />}
                        iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
                    />

                    <StatCard
                        title="PO Sinkron Hari Ini"
                        value={formatNumber(purchaseOrder.synced_today)}
                        description="Data PO dari Accurate hari ini"
                        icon={<PackageCheck className="size-5" />}
                        iconClassName="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400"
                    />
                </section>

                <section className="grid gap-6 xl:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
                        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    Procurement Funnel
                                </h2>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Konversi dokumen dari MR approved menjadi PR
                                    dan PO
                                </p>
                            </div>

                            <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                {overallConversionPercentage}% selesai sampai PO
                            </span>
                        </div>

                        <div className="grid gap-6 p-5 lg:grid-cols-3">
                            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                                        <FileCheck2 className="size-5" />
                                    </div>

                                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                                        Tahap 1
                                    </span>
                                </div>

                                <p className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
                                    {formatNumber(
                                        procurementFunnel.mr_approved,
                                    )}
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    MR Approved
                                </p>

                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    Material Request yang siap diproses oleh
                                    Purchasing.
                                </p>
                            </div>

                            <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-5 dark:border-violet-500/20 dark:bg-violet-500/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-violet-600 text-white">
                                        <ClipboardList className="size-5" />
                                    </div>

                                    <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                                        {mrToPrPercentage}% dari MR
                                    </span>
                                </div>

                                <p className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
                                    {formatNumber(
                                        procurementFunnel.mr_with_pr,
                                    )}
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Sudah Menjadi PR
                                </p>

                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    MR approved yang sudah ditemukan pada data
                                    Purchase Requisition.
                                </p>
                            </div>

                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                        <ShoppingCart className="size-5" />
                                    </div>

                                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                        {overallConversionPercentage}% dari MR
                                    </span>
                                </div>

                                <p className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
                                    {formatNumber(
                                        procurementFunnel.mr_with_po,
                                    )}
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Sudah Menjadi PO
                                </p>

                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    MR approved yang telah memiliki Purchase
                                    Order.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                            <h2 className="font-semibold text-slate-900 dark:text-white">
                                Status Material Request
                            </h2>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Distribusi status workflow MR
                            </p>
                        </div>

                        <div className="space-y-5 p-5">
                            {mrStatuses.map((item, index) => {
                                const progressClasses = [
                                    'bg-blue-500',
                                    'bg-amber-500',
                                    'bg-violet-500',
                                    'bg-emerald-500',
                                    'bg-orange-500',
                                    'bg-rose-500',
                                    'bg-slate-500',
                                ];

                                return (
                                    <ProgressItem
                                        key={item.status}
                                        label={getStatusLabel(item.status)}
                                        value={item.total}
                                        total={materialRequest.total}
                                        className={
                                            progressClasses[
                                            index % progressClasses.length
                                            ]
                                        }
                                    />
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    Dokumen Terbaru
                                </h2>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Aktivitas terbaru Material Request,
                                    Purchase Requisition, dan Purchase Order
                                </p>
                            </div>
                        </div>

                        {recent_documents.length === 0 ? (
                            <EmptyState
                                icon={<FileText className="size-5" />}
                                title="Belum ada dokumen"
                                description="Dokumen terbaru akan tampil setelah data MR dibuat atau data PR dan PO disinkronkan."
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                    <thead className="bg-slate-50/80 dark:bg-slate-950/40">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                                Dokumen
                                            </th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                                Keterangan
                                            </th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                                Tanggal
                                            </th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                                Status
                                            </th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                                Nilai
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {recent_documents.map((document) => (
                                            <tr
                                                key={`${document.type}-${document.id}`}
                                                className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${getDocumentTypeClass(document.type)}`}
                                                        >
                                                            {document.type}
                                                        </span>

                                                        <div className="min-w-0">
                                                            <Link
                                                                href={
                                                                    document.href
                                                                }
                                                                className="block truncate text-sm font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                                                            >
                                                                {
                                                                    document.number
                                                                }
                                                            </Link>

                                                            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                                                {document.department ??
                                                                    document.vendor ??
                                                                    '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="max-w-xs px-5 py-4">
                                                    <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                                                        {document.subject ??
                                                            '-'}
                                                    </p>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                    {formatDate(document.date)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusBadgeClass(document.status)}`}
                                                    >
                                                        {getStatusLabel(
                                                            document.status,
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    {document.type === 'PO'
                                                        ? formatCurrency(
                                                            document.amount,
                                                        )
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    Integrasi Accurate
                                </h2>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Status sinkronisasi terakhir
                                </p>
                            </div>

                            <div className="space-y-4 p-5">
                                <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 dark:border-violet-500/20 dark:bg-violet-500/5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
                                            <ClipboardList className="size-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Purchase Requisition
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                {formatDateTime(
                                                    last_sync?.purchase_requisition,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                                            <ShoppingCart className="size-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Purchase Order
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                {formatDateTime(
                                                    last_sync?.purchase_order,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    Akses Cepat
                                </h2>
                            </div>

                            <div className="space-y-2 p-3">
                                <Link
                                    href="/supply-chain/material-requests"
                                    className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                            <FileText className="size-4" />
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                Material Request
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Kelola pengajuan material
                                            </p>
                                        </div>
                                    </div>

                                    <ArrowRight className="size-4 text-slate-400" />
                                </Link>

                                <Link
                                    href="/purchasing/purchase-requisition"
                                    className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-violet-50 dark:hover:bg-violet-500/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                                            <ClipboardList className="size-4" />
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                Purchase Requisition
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Data permintaan pembelian
                                            </p>
                                        </div>
                                    </div>

                                    <ArrowRight className="size-4 text-slate-400" />
                                </Link>

                                <Link
                                    href="/purchasing/purchase-order"
                                    className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                            <ShoppingCart className="size-4" />
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                Purchase Order
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Pantau pesanan pembelian
                                            </p>
                                        </div>
                                    </div>

                                    <ArrowRight className="size-4 text-slate-400" />
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                    <XCircle className="size-4" />
                                    <span className="text-xs font-semibold">
                                        Rejected
                                    </span>
                                </div>

                                <p className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                                    {formatNumber(materialRequest.rejected)}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                    <AlertCircle className="size-4" />
                                    <span className="text-xs font-semibold">
                                        Revision
                                    </span>
                                </div>

                                <p className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                                    {formatNumber(materialRequest.revision)}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                                    <Users className="size-4" />
                                    <span className="text-xs font-semibold">
                                        Vendor
                                    </span>
                                </div>

                                <p className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                                    {formatNumber(summary?.vendor?.total)}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-4" />
                                    <span className="text-xs font-semibold">
                                        PO Closed
                                    </span>
                                </div>

                                <p className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                                    {formatNumber(purchaseOrder.closed)}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
