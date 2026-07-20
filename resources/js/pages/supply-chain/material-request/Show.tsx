import AppLayout from '@/layouts/tailadmin/AppLayout';
import {
    Head,
    router,
    usePage,
} from '@inertiajs/react';
import Swal from 'sweetalert2';

import PriorityBadge from './components/PriorityBadge';
import StatusBadge from './components/StatusBadge';

import type {
    MaterialRequestDetail,
} from './types';

type Props = {
    materialRequest: MaterialRequestDetail;
    permissions: {
        can_edit: boolean;
        can_delete: boolean;
        can_submit: boolean;
        can_review: boolean;
        can_approve: boolean;
        can_revision: boolean;
        can_reject: boolean;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};

function formatDate(value: string | null): string {
    if (!value) return '-';

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
    if (!value) return '-';

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

function formatMoney(value: string | number | null): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
}

export default function Show({
    materialRequest,
    permissions,
}: Props) {
    const { flash } = usePage<Props>().props;

    const postWorkflow = (
        action:
            | 'submit'
            | 'review'
            | 'approve'
            | 'revision'
            | 'reject',
        comments?: string,
    ) => {
        router.post(
            `/supply-chain/material-requests/${materialRequest.id}/${action}`,
            {
                comments: comments ?? null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({
                        only: [
                            'materialRequest',
                            'permissions',
                            'flash',
                        ],
                    });
                },
            },
        );
    };

    const handleSubmit = async () => {
        const result = await Swal.fire({
            title: 'Submit Material Request?',
            text: 'MR akan dikirim ke reviewer dan tidak dapat diedit selama proses approval.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Submit MR',
            cancelButtonText: 'Batal',
        });

        if (result.isConfirmed) {
            postWorkflow('submit');
        }
    };

    const handleReview = async () => {
        const result = await Swal.fire({
            title: 'Review Material Request?',
            input: 'textarea',
            inputLabel: 'Komentar review (opsional)',
            inputPlaceholder: 'Tuliskan komentar review...',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Review',
            cancelButtonText: 'Batal',
        });

        if (result.isConfirmed) {
            postWorkflow(
                'review',
                String(result.value ?? ''),
            );
        }
    };

    const handleApprove = async () => {
        const result = await Swal.fire({
            title: 'Approve Material Request?',
            input: 'textarea',
            inputLabel: 'Komentar approval (opsional)',
            inputPlaceholder: 'Tuliskan komentar approval...',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Approve',
            cancelButtonText: 'Batal',
        });

        if (result.isConfirmed) {
            postWorkflow(
                'approve',
                String(result.value ?? ''),
            );
        }
    };

    const handleRevision = async () => {
        const result = await Swal.fire({
            title: 'Kembalikan untuk revisi?',
            input: 'textarea',
            inputLabel: 'Catatan revisi',
            inputPlaceholder: 'Jelaskan bagian yang harus diperbaiki...',
            inputValidator: (value) =>
                !String(value ?? '').trim()
                    ? 'Catatan revisi wajib diisi.'
                    : undefined,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Request Revision',
            cancelButtonText: 'Batal',
        });

        if (result.isConfirmed) {
            postWorkflow(
                'revision',
                String(result.value),
            );
        }
    };

    const handleReject = async () => {
        const result = await Swal.fire({
            title: 'Reject Material Request?',
            input: 'textarea',
            inputLabel: 'Alasan reject',
            inputPlaceholder: 'Tuliskan alasan penolakan...',
            inputValidator: (value) =>
                !String(value ?? '').trim()
                    ? 'Alasan reject wajib diisi.'
                    : undefined,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Reject',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });

        if (result.isConfirmed) {
            postWorkflow(
                'reject',
                String(result.value),
            );
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Hapus Material Request?',
            text: `${materialRequest.mr_number} akan dihapus.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });

        if (result.isConfirmed) {
            router.delete(
                `/supply-chain/material-requests/${materialRequest.id}`,
            );
        }
    };

    const totalEstimatedValue =
        materialRequest.items.reduce(
            (total, item) =>
                total
                + Number(item.quantity)
                * Number(item.estimated_price ?? 0),
            0,
        );

    return (
        <AppLayout>
            <Head title={materialRequest.mr_number} />

            <div className="space-y-5">
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

                <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {materialRequest.mr_number}
                                </h1>

                                <StatusBadge
                                    status={materialRequest.status}
                                />

                                <PriorityBadge
                                    priority={materialRequest.priority}
                                />
                            </div>

                            <p className="mt-2 text-sm font-medium text-gray-600">
                                {materialRequest.subject}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    router.visit(
                                        '/supply-chain/material-requests',
                                    )
                                }
                                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                            >
                                Back
                            </button>

                            {permissions.can_edit && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.visit(
                                            `/supply-chain/material-requests/${materialRequest.id}/edit`,
                                        )
                                    }
                                    className="rounded-xl border border-brand-500 bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
                                >
                                    Edit
                                </button>
                            )}

                            {permissions.can_submit && (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                                >
                                    Submit MR
                                </button>
                            )}

                            {permissions.can_review && (
                                <button
                                    type="button"
                                    onClick={handleReview}
                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    Review
                                </button>
                            )}

                            {permissions.can_approve && (
                                <button
                                    type="button"
                                    onClick={handleApprove}
                                    className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                                >
                                    Approve
                                </button>
                            )}

                            {permissions.can_revision && (
                                <button
                                    type="button"
                                    onClick={handleRevision}
                                    className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                                >
                                    Revision
                                </button>
                            )}

                            {permissions.can_reject && (
                                <button
                                    type="button"
                                    onClick={handleReject}
                                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    Reject
                                </button>
                            )}

                            {permissions.can_delete && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
                        <h2 className="mb-5 text-lg font-bold text-gray-900">
                            Request Information
                        </h2>

                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                            <DetailItem
                                label="MR Date"
                                value={formatDate(materialRequest.mr_date)}
                            />
                            <DetailItem
                                label="Required Date"
                                value={formatDate(materialRequest.required_date)}
                            />
                            <DetailItem
                                label="Requester"
                                value={materialRequest.requester.name}
                            />
                            <DetailItem
                                label="Department"
                                value={
                                    materialRequest.department
                                        .department_name
                                }
                            />
                            <DetailItem
                                label="Company"
                                value={
                                    materialRequest.company
                                        ?.company_name ?? '-'
                                }
                            />
                            <DetailItem
                                label="Branch"
                                value={materialRequest.branch ?? '-'}
                            />
                            <DetailItem
                                label="Customer"
                                value={
                                    materialRequest.customer_name ?? '-'
                                }
                            />
                            <DetailItem
                                label="Reference RFQ"
                                value={
                                    materialRequest.reference_rfq ?? '-'
                                }
                            />
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-lg font-bold text-gray-900">
                            Workflow
                        </h2>

                        <div className="space-y-4">
                            <DetailItem
                                label="Current Sequence"
                                value={
                                    materialRequest.current_approval_sequence
                                        ? String(
                                              materialRequest.current_approval_sequence,
                                          )
                                        : '-'
                                }
                            />
                            <DetailItem
                                label="Submitted At"
                                value={formatDateTime(
                                    materialRequest.submitted_at,
                                )}
                            />
                            <DetailItem
                                label="Reviewed At"
                                value={formatDateTime(
                                    materialRequest.reviewed_at,
                                )}
                            />
                            <DetailItem
                                label="Approved At"
                                value={formatDateTime(
                                    materialRequest.approved_at,
                                )}
                            />
                        </div>
                    </section>
                </div>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Material Request Items
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">
                                {materialRequest.items.length} item line
                            </p>
                        </div>

                        <div className="text-right">
                            <div className="text-xs font-semibold uppercase text-gray-500">
                                Total Estimated Value
                            </div>
                            <div className="mt-1 text-lg font-bold text-gray-900">
                                {formatMoney(totalEstimatedValue)}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full min-w-[1100px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[
                                        'No',
                                        'Item Code',
                                        'Description',
                                        'UOM',
                                        'Qty',
                                        'Required Date',
                                        'Estimated Price',
                                        'Status',
                                    ].map((label) => (
                                        <th
                                            key={label}
                                            className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {materialRequest.items.map(
                                    (item, index) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-4 text-sm">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-semibold">
                                                {item.item_code}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                {item.description}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                {item.uom ?? '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                {formatDate(
                                                    item.required_date,
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                {formatMoney(
                                                    item.estimated_price,
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                {item.process_status}
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-lg font-bold text-gray-900">
                        Approval Timeline
                    </h2>

                    <div className="space-y-3">
                        {materialRequest.approvals.length > 0 ? (
                            materialRequest.approvals.map(
                                (approval) => (
                                    <div
                                        key={approval.id}
                                        className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 px-4 py-4 sm:flex-row sm:items-center"
                                    >
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">
                                                Sequence {approval.sequence}
                                                {' — '}
                                                {approval.action_type}
                                            </div>
                                            <div className="mt-1 text-sm text-gray-600">
                                                Assigned to:{' '}
                                                {
                                                    approval.assigned_user
                                                        .name
                                                }
                                            </div>
                                            {approval.comments && (
                                                <div className="mt-2 text-sm text-gray-600">
                                                    {approval.comments}
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <div className="text-sm font-semibold">
                                                {approval.status}
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500">
                                                {formatDateTime(
                                                    approval.acted_at,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
                                Approval belum dibuat.
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-lg font-bold text-gray-900">
                        Audit History
                    </h2>

                    <div className="space-y-3">
                        {materialRequest.logs.map((log) => (
                            <div
                                key={log.id}
                                className="rounded-xl border border-gray-200 px-4 py-4"
                            >
                                <div className="flex justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-bold">
                                            {log.action}
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                            Oleh{' '}
                                            {log.user?.name ?? 'System'}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatDateTime(log.created_at)}
                                    </div>
                                </div>

                                {log.comments && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        {log.comments}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <div className="text-xs font-semibold uppercase text-gray-500">
                {label}
            </div>
            <div className="mt-1 text-sm font-medium text-gray-900">
                {value}
            </div>
        </div>
    );
}
