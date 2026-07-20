import {
    FormEvent,
    useMemo,
    useState,
} from 'react';

import {
    Link,
    useForm,
} from '@inertiajs/react';
import Swal from 'sweetalert2';

import ItemMasterPickerModal from './ItemMasterPickerModal';
import MaterialRequestItemsTable from './MaterialRequestItemsTable';

import type {
    CompanyOption,
    DepartmentOption,
    ItemMasterOption,
    MaterialRequestFormData,
    MaterialRequestItemForm,
    RequesterOption,
    SelectOption,
} from '../types';

type Props = {
    mode: 'create' | 'edit';
    departments: DepartmentOption[];
    companies: CompanyOption[];
    requester: RequesterOption;
    priorityOptions: SelectOption[];
    requestTypeOptions: SelectOption[];
    initialData?: Partial<MaterialRequestFormData>;
    materialRequestId?: number;
};

function createRowId(): string {
    return `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
}

function today(): string {
    const date = new Date();
    const timezoneOffset =
        date.getTimezoneOffset() * 60000;

    return new Date(
        date.getTime() - timezoneOffset,
    )
        .toISOString()
        .slice(0, 10);
}

export default function MaterialRequestForm({
    mode,
    departments,
    companies,
    requester,
    priorityOptions,
    requestTypeOptions,
    initialData,
    materialRequestId,
}: Props) {
    const [pickerOpen, setPickerOpen] =
        useState(false);

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
    } = useForm<MaterialRequestFormData>({
        mr_date:
            initialData?.mr_date ??
            today(),

        department_id:
            initialData?.department_id ??
            String(
                requester.department_id ??
                '',
            ),

        company_id:
            initialData?.company_id ??
            String(
                requester.company_id ??
                '',
            ),

        branch:
            initialData?.branch ?? '',

        priority:
            initialData?.priority ??
            'MEDIUM',

        required_date:
            initialData?.required_date ??
            '',

        request_type:
            initialData?.request_type ??
            'STOCK_REPLENISHMENT',

        customer_name:
            initialData?.customer_name ??
            '',

        sales_order_no:
            initialData?.sales_order_no ??
            '',

        reference_rfq:
            initialData?.reference_rfq ??
            '',

        subject:
            initialData?.subject ?? '',

        remarks:
            initialData?.remarks ?? '',

        items:
            initialData?.items ?? [],
    });

    const totalEstimatedPrice =
        useMemo(() => {
            return data.items.reduce(
                (total, item) => {
                    const quantity =
                        Number(
                            item.quantity,
                        ) || 0;

                    const price =
                        Number(
                            item.estimated_price,
                        ) || 0;

                    return (
                        total +
                        quantity * price
                    );
                },
                0,
            );
        }, [data.items]);

    const handleSelectItem = async (
        item: ItemMasterOption,
    ) => {
        const duplicate =
            data.items.some(
                (currentItem) =>
                    currentItem.item_master_id ===
                    item.id,
            );

        if (duplicate) {
            await Swal.fire({
                title: 'Item sudah dipilih',
                text: `${item.item_code} sudah ada di daftar Material Request.`,
                icon: 'warning',
            });

            return;
        }

        const newItem: MaterialRequestItemForm =
        {
            row_id:
                createRowId(),
            item_master_id:
                item.id,
            item_code:
                item.item_code,
            part_number:
                item.part_number ??
                '',
            description:
                item.item_description ??
                item.item_code,
            brand:
                item.brand_name ?? '',
            uom:
                item.unit_name ?? '',
            quantity: '1',
            available_stock:
                String(
                    item.total_stock ??
                    0,
                ),
            required_date:
                data.required_date ??
                '',
            suggested_vendor:
                item.preferred_vendor ??
                '',
            estimated_price: '',
            lead_time_days: '',
            remarks: '',
            process_status:
                'PENDING',
        };

        setData('items', [
            ...data.items,
            newItem,
        ]);

        setPickerOpen(false);
    };

    const validateBeforeSubmit =
        async (): Promise<boolean> => {
            if (!data.department_id) {
                await Swal.fire({
                    title: 'Department wajib dipilih',
                    icon: 'warning',
                });

                return false;
            }

            if (
                data.subject.trim() === ''
            ) {
                await Swal.fire({
                    title: 'Subject wajib diisi',
                    icon: 'warning',
                });

                return false;
            }

            if (data.items.length === 0) {
                await Swal.fire({
                    title: 'Item belum tersedia',
                    text: 'Material Request harus memiliki minimal satu item.',
                    icon: 'warning',
                });

                return false;
            }

            const invalidItem =
                data.items.find(
                    (item) =>
                        Number(
                            item.quantity,
                        ) <= 0,
                );

            if (invalidItem) {
                await Swal.fire({
                    title: 'Quantity tidak valid',
                    text: `Quantity ${invalidItem.item_code} harus lebih besar dari 0.`,
                    icon: 'warning',
                });

                return false;
            }

            return true;
        };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        const valid =
            await validateBeforeSubmit();

        if (!valid) return;

        const confirmation =
            await Swal.fire({
                title:
                    mode === 'create'
                        ? 'Simpan Material Request?'
                        : 'Perbarui Material Request?',
                text:
                    mode === 'create'
                        ? 'Material Request akan disimpan sebagai Draft.'
                        : 'Perubahan Draft akan disimpan.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText:
                    mode === 'create'
                        ? 'Save Draft'
                        : 'Update Draft',
                cancelButtonText:
                    'Batal',
            });

        if (!confirmation.isConfirmed) {
            return;
        }

        if (mode === 'create') {
            post(
                '/supply-chain/material-requests',
                {
                    preserveScroll: true,
                },
            );

            return;
        }

        if (!materialRequestId) {
            await Swal.fire({
                title: 'Material Request ID tidak tersedia',
                icon: 'error',
            });

            return;
        }

        put(
            `/supply-chain/material-requests/${materialRequestId}`,
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className="space-y-4"
            >
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Material Request Information
                            </h2>

                            <p className="mt-1 text-sm text-gray-600">
                                Lengkapi informasi utama, referensi, dan kebutuhan Material Request.
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500">
                            Fields dengan tanda
                            <span className="mx-1 text-red-500">
                                *
                            </span>
                            wajib diisi
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Field label="MR Date" required error={errors.mr_date}>
                            <input
                                type="date"
                                value={data.mr_date}
                                onChange={(event) =>
                                    setData('mr_date', event.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Requested By">
                            <input
                                type="text"
                                value={requester.name}
                                disabled
                                className={`${inputClass} cursor-not-allowed bg-gray-100`}
                            />
                        </Field>

                        <Field label="Department" required error={errors.department_id}>
                            <select
                                value={data.department_id}
                                onChange={(event) =>
                                    setData('department_id', event.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="">Select Department</option>
                                {departments.map((department) => (
                                    <option key={department.id} value={department.id}>
                                        {department.department_name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Company" error={errors.company_id}>
                            <select
                                value={data.company_id}
                                onChange={(event) =>
                                    setData('company_id', event.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="">Select Company</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.company_name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Branch" error={errors.branch}>
                            <input
                                type="text"
                                value={data.branch}
                                onChange={(event) =>
                                    setData('branch', event.target.value)
                                }
                                placeholder="Branch"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Priority" required error={errors.priority}>
                            <select
                                value={data.priority}
                                onChange={(event) =>
                                    setData(
                                        'priority',
                                        event.target.value as MaterialRequestFormData['priority'],
                                    )
                                }
                                className={inputClass}
                            >
                                {priorityOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Required Date" error={errors.required_date}>
                            <input
                                type="date"
                                value={data.required_date}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setData('required_date', value);
                                    setData(
                                        'items',
                                        data.items.map((item) => ({
                                            ...item,
                                            required_date:
                                                item.required_date || value,
                                        })),
                                    );
                                }}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Request Type" required error={errors.request_type}>
                            <select
                                value={data.request_type}
                                onChange={(event) =>
                                    setData(
                                        'request_type',
                                        event.target.value as MaterialRequestFormData['request_type'],
                                    )
                                }
                                className={inputClass}
                            >
                                {requestTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <div className="md:col-span-2 xl:col-span-2">
                            <Field label="Subject" required error={errors.subject}>
                                <input
                                    type="text"
                                    value={data.subject}
                                    onChange={(event) =>
                                        setData('subject', event.target.value)
                                    }
                                    placeholder="Material Request subject"
                                    className={inputClass}
                                />
                            </Field>
                        </div>

                        <Field label="Customer Name" error={errors.customer_name}>
                            <input
                                type="text"
                                value={data.customer_name}
                                onChange={(event) =>
                                    setData('customer_name', event.target.value)
                                }
                                placeholder="Customer name"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Sales Order No" error={errors.sales_order_no}>
                            <input
                                type="text"
                                value={data.sales_order_no}
                                onChange={(event) =>
                                    setData('sales_order_no', event.target.value)
                                }
                                placeholder="Sales order number"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Reference RFQ" error={errors.reference_rfq}>
                            <input
                                type="text"
                                value={data.reference_rfq}
                                onChange={(event) =>
                                    setData('reference_rfq', event.target.value)
                                }
                                placeholder="Reference RFQ"
                                className={inputClass}
                            />
                        </Field>

                        <div className="md:col-span-2 xl:col-span-4">
                            <Field label="Remarks" error={errors.remarks}>
                                <textarea
                                    value={data.remarks}
                                    onChange={(event) =>
                                        setData('remarks', event.target.value)
                                    }
                                    placeholder="Additional remarks"
                                    className={`${inputClass} min-h-20 resize-y py-3`}
                                />
                            </Field>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Material Request Items
                            </h2>

                            <p className="mt-1 text-sm text-gray-600">
                                Tambahkan item dari Item Master dan lengkapi quantity.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setPickerOpen(true)}
                            className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                        >
                            Add Item
                        </button>
                    </div>

                    <MaterialRequestItemsTable
                        items={data.items}
                        onChange={(items) => setData('items', items)}
                    />

                    {errors.items && (
                        <p className="mt-2 text-sm font-medium text-red-600">
                            {errors.items}
                        </p>
                    )}

                    <div className="mt-4 flex justify-end">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-right">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Total Estimated Value
                            </div>

                            <div className="mt-1 text-xl font-bold text-gray-900">
                                {new Intl.NumberFormat(
                                    'id-ID',
                                    {
                                        style: 'currency',
                                        currency: 'IDR',
                                    },
                                ).format(totalEstimatedPrice)}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                    <Link
                        href="/supply-chain/material-requests"
                        className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing
                            ? 'Saving...'
                            : mode === 'create'
                                ? 'Save Draft'
                                : 'Update Draft'}
                    </button>
                </div>
            </form>

            <ItemMasterPickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handleSelectItem}
            />
        </>
    );
}

const inputClass =
    'h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

function Field({
    label,
    required = false,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                {label}

                {required && (
                    <span className="ml-1 text-red-500">
                        *
                    </span>
                )}
            </label>

            {children}

            {error && (
                <p className="mt-1.5 text-sm font-medium text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
