import AppLayout from '@/layouts/tailadmin/AppLayout';
import {
    Head,
    router,
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
    };
};

function formatDate(
    value: string | null,
): string {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(
        'id-ID',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        },
    ).format(date);
}

function formatDateTime(
    value: string | null,
): string {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(
        'id-ID',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        },
    ).format(date);
}

function formatMoney(
    value: string | number | null,
): string {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat(
        'id-ID',
        {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 2,
        },
    ).format(amount);
}

export default function Show({
    materialRequest,
    permissions,
}: Props) {
    const handleDelete = async () => {
        const confirmation =
            await Swal.fire({
                title: 'Hapus Material Request?',
                text: `${materialRequest.mr_number} akan dihapus. Aksi ini hanya tersedia untuk Draft.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText:
                    'Ya, Hapus',
                cancelButtonText:
                    'Batal',
                confirmButtonColor:
                    '#dc2626',
            });

        if (!confirmation.isConfirmed) {
            return;
        }

        router.delete(
            `/supply-chain/material-requests/${materialRequest.id}`,
            {
                preserveScroll: true,
            },
        );
    };

    const handleSubmit = async () => {
        await Swal.fire({
            title: 'Submit workflow belum diaktifkan',
            text: 'CRUD Draft sudah siap. Workflow Submit akan dibuat pada tahap berikutnya.',
            icon: 'info',
        });
    };

    const totalEstimatedValue =
        materialRequest.items.reduce(
            (total, item) =>
                total +
                Number(item.quantity) *
                    Number(
                        item.estimated_price ??
                            0,
                    ),
            0,
        );

    return (
        <AppLayout>
            <Head
                title={
                    materialRequest.mr_number
                }
            />

            <div className="space-y-5">
                <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {
                                        materialRequest.mr_number
                                    }
                                </h1>

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

                            <p className="mt-2 text-sm font-medium text-gray-600">
                                {
                                    materialRequest.subject
                                }
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
                                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
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
                                    className="rounded-xl border border-brand-500 bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
                                >
                                    Edit Draft
                                </button>
                            )}

                            {permissions.can_submit && (
                                <button
                                    type="button"
                                    onClick={
                                        handleSubmit
                                    }
                                    className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
                                >
                                    Submit MR
                                </button>
                            )}

                            {permissions.can_delete && (
                                <button
                                    type="button"
                                    onClick={
                                        handleDelete
                                    }
                                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
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
                                value={formatDate(
                                    materialRequest.mr_date,
                                )}
                            />
                            <DetailItem
                                label="Required Date"
                                value={formatDate(
                                    materialRequest.required_date,
                                )}
                            />
                            <DetailItem
                                label="Requester"
                                value={
                                    materialRequest.requester.name
                                }
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
                                        ?.company_name ??
                                    '-'
                                }
                            />
                            <DetailItem
                                label="Branch"
                                value={
                                    materialRequest.branch ??
                                    '-'
                                }
                            />
                            <DetailItem
                                label="Request Type"
                                value={
                                    materialRequest.request_type
                                }
                            />
                            <DetailItem
                                label="Customer Name"
                                value={
                                    materialRequest.customer_name ??
                                    '-'
                                }
                            />
                            <DetailItem
                                label="Sales Order No"
                                value={
                                    materialRequest.sales_order_no ??
                                    '-'
                                }
                            />
                            <DetailItem
                                label="Reference RFQ"
                                value={
                                    materialRequest.reference_rfq ??
                                    '-'
                                }
                            />
                            <div className="md:col-span-2">
                                <DetailItem
                                    label="Remarks"
                                    value={
                                        materialRequest.remarks ??
                                        '-'
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-lg font-bold text-gray-900">
                            Workflow Information
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
                            <DetailItem
                                label="Rejected At"
                                value={formatDateTime(
                                    materialRequest.rejected_at,
                                )}
                            />
                        </div>
                    </section>
                </div>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Material Request Items
                            </h2>

                            <p className="mt-1 text-sm text-gray-600">
                                {materialRequest.items.length.toLocaleString(
                                    'id-ID',
                                )}{' '}
                                item line.
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Total Estimated Value
                            </div>

                            <div className="mt-1 text-lg font-bold text-gray-900">
                                {formatMoney(
                                    totalEstimatedValue,
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full min-w-[1400px] table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[
                                        'No',
                                        'Item Code',
                                        'Part Number',
                                        'Description',
                                        'Brand',
                                        'UOM',
                                        'Stock',
                                        'Qty',
                                        'Required Date',
                                        'Vendor',
                                        'Estimated Price',
                                        'Lead Time',
                                        'Status',
                                        'Remarks',
                                    ].map((label) => (
                                        <th
                                            key={label}
                                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white">
                                {materialRequest.items.map(
                                    (item, index) => (
                                        <tr
                                            key={
                                                item.id
                                            }
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-4 text-sm text-gray-600">
                                                {index +
                                                    1}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                                                {
                                                    item.item_code
                                                }
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item.part_number ??
                                                    '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {
                                                    item.description
                                                }
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item.brand ??
                                                    '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item.uom ??
                                                    '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {
                                                    item.available_stock
                                                }
                                            </td>
                                            <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                                                {
                                                    item.quantity
                                                }
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {formatDate(
                                                    item.required_date,
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item.suggested_vendor ??
                                                    '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {formatMoney(
                                                    item.estimated_price,
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item.lead_time_days ??
                                                    '-'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                                    {
                                                        item.process_status
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item.remarks ??
                                                    '-'}
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

                    {materialRequest.approvals.length >
                    0 ? (
                        <div className="space-y-3">
                            {materialRequest.approvals.map(
                                (approval) => (
                                    <div
                                        key={
                                            approval.id
                                        }
                                        className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 px-4 py-4 sm:flex-row sm:items-center"
                                    >
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">
                                                Sequence{' '}
                                                {
                                                    approval.sequence
                                                }{' '}
                                                —{' '}
                                                {
                                                    approval.action_type
                                                }
                                            </div>

                                            <div className="mt-1 text-sm text-gray-600">
                                                Assigned to:{' '}
                                                {
                                                    approval.assigned_user
                                                        .name
                                                }
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-sm font-semibold text-gray-800">
                                                {
                                                    approval.status
                                                }
                                            </div>

                                            <div className="mt-1 text-xs text-gray-500">
                                                {formatDateTime(
                                                    approval.acted_at,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
                            Approval belum dibuat. Submit MR untuk memulai workflow.
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-lg font-bold text-gray-900">
                        Audit History
                    </h2>

                    {materialRequest.logs.length >
                    0 ? (
                        <div className="space-y-3">
                            {materialRequest.logs.map(
                                (log) => (
                                    <div
                                        key={log.id}
                                        className="rounded-xl border border-gray-200 px-4 py-4"
                                    >
                                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">
                                                    {
                                                        log.action
                                                    }
                                                </div>

                                                <div className="mt-1 text-xs text-gray-500">
                                                    Oleh{' '}
                                                    {log.user
                                                        ?.name ??
                                                        'System'}
                                                </div>
                                            </div>

                                            <div className="text-xs font-medium text-gray-500">
                                                {formatDateTime(
                                                    log.created_at,
                                                )}
                                            </div>
                                        </div>

                                        {(log.from_status ||
                                            log.to_status) && (
                                            <div className="mt-3 text-sm text-gray-600">
                                                {log.from_status ??
                                                    '-'}{' '}
                                                →{' '}
                                                {log.to_status ??
                                                    '-'}
                                            </div>
                                        )}

                                        {log.comments && (
                                            <div className="mt-2 text-sm text-gray-600">
                                                {
                                                    log.comments
                                                }
                                            </div>
                                        )}
                                    </div>
                                ),
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
                            Belum ada audit history.
                        </div>
                    )}
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
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
            </div>

            <div className="mt-1 break-words text-sm font-medium text-gray-900">
                {value}
            </div>
        </div>
    );
}
