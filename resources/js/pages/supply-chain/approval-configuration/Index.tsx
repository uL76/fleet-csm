import AppLayout from '@/layouts/tailadmin/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';

type UserOption = {
    id: number;
    name: string;
    email: string;
};

type StepUser = {
    route_id: number;
    user_id: number;
    name: string | null;
    email: string | null;
};

type ApprovalStep = {
    sequence: number;
    action_type: 'REVIEW' | 'APPROVE';
    is_required: boolean;
    is_active: boolean;
    users: StepUser[];
};

type DepartmentCard = {
    department_id: number;
    department_name: string;
    steps: ApprovalStep[];
};

type DocumentTypeOption = {
    value: string;
    label: string;
};

type Props = {
    documentType: string;
    search: string;
    cards: DepartmentCard[];
    users: UserOption[];
    documentTypes: DocumentTypeOption[];
    flash?: {
        success?: string;
        error?: string;
    };
};

type EditableStep = {
    sequence: number;
    action_type: 'REVIEW' | 'APPROVE';
    is_required: boolean;
    is_active: boolean;
    user_ids: number[];
};

type EditableCard = DepartmentCard & {
    steps: EditableStep[];
};

function toEditableCard(card: DepartmentCard): EditableCard {
    return {
        ...card,
        steps: card.steps.map((step) => ({
            sequence: step.sequence,
            action_type: step.action_type,
            is_required: step.is_required,
            is_active: step.is_active,
            user_ids: step.users.map((user) => user.user_id),
        })),
    };
}

export default function Index({
    documentType,
    search,
    cards,
    users,
    documentTypes,
}: Props) {
    const { flash } = usePage<Props>().props;
    const [searchValue, setSearchValue] = useState(search);
    const [editableCards, setEditableCards] = useState<EditableCard[]>(
        cards.map(toEditableCard),
    );
    const [savingDepartmentId, setSavingDepartmentId] = useState<number | null>(null);
    const [copySourceByDepartment, setCopySourceByDepartment] = useState<Record<number, string>>({});

    const departmentsForCopy = useMemo(
        () =>
            cards.map((card) => ({
                id: card.department_id,
                name: card.department_name,
                hasSteps: card.steps.length > 0,
            })),
        [cards],
    );

    const updateCard = (
        departmentId: number,
        callback: (card: EditableCard) => EditableCard,
    ) => {
        setEditableCards((current) =>
            current.map((card) =>
                card.department_id === departmentId ? callback(card) : card,
            ),
        );
    };

    const addStep = (departmentId: number) => {
        updateCard(departmentId, (card) => {
            const nextSequence = card.steps.length
                ? Math.max(...card.steps.map((step) => step.sequence)) + 1
                : 1;

            return {
                ...card,
                steps: [
                    ...card.steps,
                    {
                        sequence: nextSequence,
                        action_type: nextSequence === 1 ? 'REVIEW' : 'APPROVE',
                        is_required: true,
                        is_active: true,
                        user_ids: [],
                    },
                ],
            };
        });
    };

    const removeStep = async (departmentId: number, stepIndex: number) => {
        const result = await Swal.fire({
            title: 'Hapus approval step?',
            text: 'Seluruh user pada step ini akan ikut dihapus saat matrix disimpan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus Step',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });

        if (!result.isConfirmed) return;

        updateCard(departmentId, (card) => ({
            ...card,
            steps: card.steps
                .filter((_, index) => index !== stepIndex)
                .map((step, index) => ({
                    ...step,
                    sequence: index + 1,
                })),
        }));
    };

    const updateStep = (
        departmentId: number,
        stepIndex: number,
        patch: Partial<EditableStep>,
    ) => {
        updateCard(departmentId, (card) => ({
            ...card,
            steps: card.steps.map((step, index) =>
                index === stepIndex ? { ...step, ...patch } : step,
            ),
        }));
    };

    const addUserToStep = (departmentId: number, stepIndex: number, userId: number) => {
        if (!userId) return;

        updateCard(departmentId, (card) => ({
            ...card,
            steps: card.steps.map((step, index) => {
                if (index !== stepIndex || step.user_ids.includes(userId)) {
                    return step;
                }

                return {
                    ...step,
                    user_ids: [...step.user_ids, userId],
                };
            }),
        }));
    };

    const removeUserFromStep = (
        departmentId: number,
        stepIndex: number,
        userId: number,
    ) => {
        updateCard(departmentId, (card) => ({
            ...card,
            steps: card.steps.map((step, index) =>
                index === stepIndex
                    ? {
                          ...step,
                          user_ids: step.user_ids.filter((id) => id !== userId),
                      }
                    : step,
            ),
        }));
    };

    const saveCard = async (card: EditableCard) => {
        const activeSteps = card.steps.filter((step) => step.is_active);

        if (activeSteps.length === 0) {
            await Swal.fire({
                title: 'Matrix belum lengkap',
                text: 'Minimal harus ada satu approval step aktif.',
                icon: 'warning',
            });
            return;
        }

        if (activeSteps[0].action_type !== 'REVIEW') {
            await Swal.fire({
                title: 'Urutan tidak valid',
                text: 'Approval step aktif pertama untuk Material Request harus REVIEW.',
                icon: 'warning',
            });
            return;
        }

        if (card.steps.some((step) => step.user_ids.length === 0)) {
            await Swal.fire({
                title: 'User belum dipilih',
                text: 'Setiap approval step wajib memiliki minimal satu user.',
                icon: 'warning',
            });
            return;
        }

        const result = await Swal.fire({
            title: `Simpan matrix ${card.department_name}?`,
            text: 'Konfigurasi ini akan digunakan untuk MR baru yang disubmit setelah perubahan.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Simpan Matrix',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;

        setSavingDepartmentId(card.department_id);

        router.put(
            `/supply-chain/approval-configuration/${card.department_id}/matrix`,
            {
                document_type: documentType,
                steps: card.steps,
            },
            {
                preserveScroll: true,
                onFinish: () => setSavingDepartmentId(null),
            },
        );
    };

    const copyFromDepartment = async (target: EditableCard) => {
        const sourceId = Number(copySourceByDepartment[target.department_id] ?? 0);

        if (!sourceId) {
            await Swal.fire({
                title: 'Pilih department sumber',
                icon: 'info',
            });
            return;
        }

        const source = departmentsForCopy.find((department) => department.id === sourceId);
        const result = await Swal.fire({
            title: `Copy matrix dari ${source?.name ?? 'department sumber'}?`,
            text: `Matrix ${target.department_name} saat ini akan diganti.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Copy Matrix',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;

        router.post(
            `/supply-chain/approval-configuration/${target.department_id}/copy`,
            {
                document_type: documentType,
                source_department_id: sourceId,
            },
            { preserveScroll: true },
        );
    };

    const applySearch = () => {
        router.get(
            '/supply-chain/approval-configuration',
            {
                document_type: documentType,
                search: searchValue,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const changeDocumentType = (value: string) => {
        router.get(
            '/supply-chain/approval-configuration',
            {
                document_type: value,
                search: searchValue,
            },
            {
                preserveState: false,
                replace: true,
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Approval Configuration" />

            <div className="space-y-5">
                <section className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Approval Configuration
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Satu step dapat memiliki beberapa user. Salah satu user cukup menyelesaikan step.
                            </p>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[250px_1fr_auto] lg:max-w-3xl">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                    Document Type
                                </label>
                                <select
                                    value={documentType}
                                    onChange={(event) => changeDocumentType(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-brand-500"
                                >
                                    {documentTypes.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                    Search Department
                                </label>
                                <input
                                    value={searchValue}
                                    onChange={(event) => setSearchValue(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') applySearch();
                                    }}
                                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-brand-500"
                                    placeholder="Finance, ICT, Operation..."
                                />
                            </div>

                            <button
                                type="button"
                                onClick={applySearch}
                                className="h-11 self-end rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </section>

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

                <div className="space-y-5">
                    {editableCards.map((card) => (
                        <section
                            key={card.department_id}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                        >
                            <div className="flex flex-col justify-between gap-3 border-b border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        {card.department_name}
                                    </h2>
                                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        {documentType} Workflow • {card.steps.length} Step
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        value={copySourceByDepartment[card.department_id] ?? ''}
                                        onChange={(event) =>
                                            setCopySourceByDepartment((current) => ({
                                                ...current,
                                                [card.department_id]: event.target.value,
                                            }))
                                        }
                                        className="h-10 rounded-xl border border-gray-300 px-3 text-sm"
                                    >
                                        <option value="">Copy from department...</option>
                                        {departmentsForCopy
                                            .filter(
                                                (department) =>
                                                    department.id !== card.department_id && department.hasSteps,
                                            )
                                            .map((department) => (
                                                <option key={department.id} value={department.id}>
                                                    {department.name}
                                                </option>
                                            ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => copyFromDepartment(card)}
                                        className="h-10 rounded-xl border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 p-5">
                                {card.steps.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center">
                                        <p className="text-sm font-semibold text-gray-700">
                                            Belum ada approval matrix untuk department ini.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => addStep(card.department_id)}
                                            className="mt-4 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                                        >
                                            Create First Step
                                        </button>
                                    </div>
                                )}

                                {card.steps.map((step, stepIndex) => (
                                    <div
                                        key={`${card.department_id}-${stepIndex}`}
                                        className="rounded-2xl border border-gray-200 bg-white p-5"
                                    >
                                        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                                            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                                                <Field label="Sequence">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={step.sequence}
                                                        onChange={(event) =>
                                                            updateStep(card.department_id, stepIndex, {
                                                                sequence: Number(event.target.value),
                                                            })
                                                        }
                                                        className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm"
                                                    />
                                                </Field>

                                                <Field label="Action">
                                                    <select
                                                        value={step.action_type}
                                                        onChange={(event) =>
                                                            updateStep(card.department_id, stepIndex, {
                                                                action_type: event.target.value as 'REVIEW' | 'APPROVE',
                                                            })
                                                        }
                                                        className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm"
                                                    >
                                                        <option value="REVIEW">Review</option>
                                                        <option value="APPROVE">Approve</option>
                                                    </select>
                                                </Field>

                                                <Field label="Completion Rule">
                                                    <div className="flex h-10 items-center rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-700">
                                                        ANY ONE USER
                                                    </div>
                                                </Field>

                                                <Toggle
                                                    label="Required"
                                                    checked={step.is_required}
                                                    onChange={(checked) =>
                                                        updateStep(card.department_id, stepIndex, {
                                                            is_required: checked,
                                                        })
                                                    }
                                                />

                                                <Toggle
                                                    label="Active"
                                                    checked={step.is_active}
                                                    onChange={(checked) =>
                                                        updateStep(card.department_id, stepIndex, {
                                                            is_active: checked,
                                                        })
                                                    }
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeStep(card.department_id, stepIndex)}
                                                className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                            >
                                                Remove Step
                                            </button>
                                        </div>

                                        <div className="mt-5 border-t border-gray-200 pt-5">
                                            <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-900">
                                                        Assigned Users
                                                    </h3>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Salah satu user cukup melakukan {step.action_type.toLowerCase()}.
                                                    </p>
                                                </div>

                                                <select
                                                    defaultValue=""
                                                    onChange={(event) => {
                                                        addUserToStep(
                                                            card.department_id,
                                                            stepIndex,
                                                            Number(event.target.value),
                                                        );
                                                        event.currentTarget.value = '';
                                                    }}
                                                    className="h-10 rounded-xl border border-gray-300 px-3 text-sm"
                                                >
                                                    <option value="">+ Add User</option>
                                                    {users
                                                        .filter((user) => !step.user_ids.includes(user.id))
                                                        .map((user) => (
                                                            <option key={user.id} value={user.id}>
                                                                {user.name} — {user.email}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                {step.user_ids.map((userId) => {
                                                    const user = users.find((item) => item.id === userId);
                                                    return (
                                                        <div
                                                            key={userId}
                                                            className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3"
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-semibold text-gray-900">
                                                                    {user?.name ?? `User #${userId}`}
                                                                </div>
                                                                <div className="truncate text-xs text-gray-500">
                                                                    {user?.email ?? '-'}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeUserFromStep(
                                                                        card.department_id,
                                                                        stepIndex,
                                                                        userId,
                                                                    )
                                                                }
                                                                className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    );
                                                })}

                                                {step.user_ids.length === 0 && (
                                                    <div className="rounded-xl border border-dashed border-gray-300 px-4 py-5 text-center text-sm text-gray-500">
                                                        Belum ada user pada step ini.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {card.steps.length > 0 && (
                                    <div className="flex flex-col justify-between gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center">
                                        <button
                                            type="button"
                                            onClick={() => addStep(card.department_id)}
                                            className="rounded-xl border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
                                        >
                                            + Add New Step
                                        </button>

                                        <button
                                            type="button"
                                            disabled={savingDepartmentId === card.department_id}
                                            onClick={() => saveCard(card)}
                                            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                                        >
                                            {savingDepartmentId === card.department_id
                                                ? 'Saving...'
                                                : `Save ${card.department_name} Matrix`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>
                    ))}

                    {editableCards.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-16 text-center text-sm text-gray-500">
                            Department tidak ditemukan.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">
                {label}
            </label>
            {children}
        </div>
    );
}

function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex h-[66px] cursor-pointer items-end gap-3 rounded-xl border border-gray-200 px-4 pb-3">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="size-4"
            />
            <span className="text-sm font-semibold text-gray-700">{label}</span>
        </label>
    );
}
