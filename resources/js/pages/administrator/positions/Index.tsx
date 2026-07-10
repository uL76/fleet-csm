import AppLayout from '@/layouts/tailadmin/AppLayout';
import { router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

type Company = {
    id: number;
    company_code: string;
    company_name: string;
};

type Department = {
    id: number;
    company_id: number | null;
    department_code: string;
    department_name: string;
};

type Position = {
    id: number;
    company_id: number | null;
    department_id: number | null;
    position_code: string;
    position_name: string;
    description: string | null;
    is_active: boolean;
    company?: Company | null;
    department?: Department | null;
};

type PaginatedPositions = {
    data: Position[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type PageProps = {
    positions: PaginatedPositions;
    companies: Company[];
    departments: Department[];
    filters: {
        search?: string;
    };
    flash?: {
        success?: string;
    };
};

type ModalMode = 'create' | 'edit';

type PositionForm = {
    company_id: string;
    department_id: string;
    position_code: string;
    position_name: string;
    description: string;
    is_active: boolean;
};

export default function PositionIndex() {
    const { positions, companies, departments, filters, flash } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('create');
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm<PositionForm>({
        company_id: '',
        department_id: '',
        position_code: '',
        position_name: '',
        description: '',
        is_active: true,
    });

    const filteredDepartments = useMemo(() => {
        if (!data.company_id) {
            return departments;
        }

        return departments.filter(
            (department) => String(department.company_id) === data.company_id,
        );
    }, [departments, data.company_id]);

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            '/administrator/positions',
            { search },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const openCreateModal = () => {
        setModalMode('create');
        setSelectedPosition(null);
        clearErrors();

        setData({
            company_id: '',
            department_id: '',
            position_code: '',
            position_name: '',
            description: '',
            is_active: true,
        });

        setIsModalOpen(true);
    };

    const openEditModal = (position: Position) => {
        setModalMode('edit');
        setSelectedPosition(position);
        clearErrors();

        setData({
            company_id: position.company_id ? String(position.company_id) : '',
            department_id: position.department_id ? String(position.department_id) : '',
            position_code: position.position_code || '',
            position_name: position.position_name || '',
            description: position.description || '',
            is_active: position.is_active,
        });

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPosition(null);
        clearErrors();
        reset();
    };

    const handleSubmitPosition = (event: FormEvent) => {
        event.preventDefault();

        if (modalMode === 'create') {
            post('/administrator/positions', {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });

            return;
        }

        if (selectedPosition) {
            put(`/administrator/positions/${selectedPosition.id}`, {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (!confirm('Yakin ingin menghapus position ini?')) {
            return;
        }

        router.delete(`/administrator/positions/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Positions
                        </h1>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Master data position berdasarkan company dan department.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                    >
                        Add Position
                    </button>
                </div>

                {flash?.success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {flash.success}
                    </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <form
                        onSubmit={handleSearch}
                        className="mb-6 flex flex-col gap-3 sm:flex-row"
                    >
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search position..."
                            className="h-12 flex-1 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                        />

                        <button
                            type="submit"
                            className="h-12 rounded-xl bg-gray-900 px-6 text-sm font-semibold text-white transition hover:bg-gray-800"
                        >
                            Search
                        </button>
                    </form>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full min-w-[1000px] table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Company
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Department
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Code
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Position
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Description
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Status
                                    </th>
                                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white">
                                {positions.data.length > 0 ? (
                                    positions.data.map((position) => (
                                        <tr
                                            key={position.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                                {position.company?.company_name || '-'}
                                            </td>

                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                                {position.department?.department_name || '-'}
                                            </td>

                                            <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                {position.position_code}
                                            </td>

                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                                {position.position_name}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {position.description || '-'}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${position.is_active
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {position.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(position)}
                                                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(position.id)}
                                                        className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-10 text-center text-sm font-medium text-gray-500"
                                        >
                                            Data position belum tersedia.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {positions.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${link.active
                                        ? 'bg-brand-500 text-white'
                                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 px-4 py-6">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {modalMode === 'create'
                                        ? 'Add Position'
                                        : 'Edit Position'}
                                </h2>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    {modalMode === 'create'
                                        ? 'Tambahkan master data position baru.'
                                        : 'Perbarui master data position.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmitPosition} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Company
                                </label>

                                <select
                                    value={data.company_id}
                                    onChange={(event) => {
                                        setData({
                                            ...data,
                                            company_id: event.target.value,
                                            department_id: '',
                                        });
                                    }}
                                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                >
                                    <option value="">Select Company</option>
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>
                                            {company.company_name}
                                        </option>
                                    ))}
                                </select>

                                {errors.company_id && (
                                    <p className="mt-1 text-sm font-medium text-red-500">
                                        {errors.company_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Department
                                </label>

                                <select
                                    value={data.department_id}
                                    onChange={(event) =>
                                        setData('department_id', event.target.value)
                                    }
                                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                >
                                    <option value="">Select Department</option>
                                    {filteredDepartments.map((department) => (
                                        <option key={department.id} value={department.id}>
                                            {department.department_name}
                                        </option>
                                    ))}
                                </select>

                                {errors.department_id && (
                                    <p className="mt-1 text-sm font-medium text-red-500">
                                        {errors.department_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Position Code
                                </label>

                                <input
                                    type="text"
                                    value={data.position_code}
                                    onChange={(event) =>
                                        setData('position_code', event.target.value)
                                    }
                                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />

                                {errors.position_code && (
                                    <p className="mt-1 text-sm font-medium text-red-500">
                                        {errors.position_code}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Position Name
                                </label>

                                <input
                                    type="text"
                                    value={data.position_name}
                                    onChange={(event) =>
                                        setData('position_name', event.target.value)
                                    }
                                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />

                                {errors.position_name && (
                                    <p className="mt-1 text-sm font-medium text-red-500">
                                        {errors.position_name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Description
                                </label>

                                <textarea
                                    value={data.description}
                                    onChange={(event) =>
                                        setData('description', event.target.value)
                                    }
                                    rows={4}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />

                                {errors.description && (
                                    <p className="mt-1 text-sm font-medium text-red-500">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(event) =>
                                        setData('is_active', event.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />

                                <span className="text-sm font-semibold text-gray-700">
                                    Active
                                </span>
                            </label>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing
                                        ? 'Saving...'
                                        : modalMode === 'create'
                                            ? 'Save'
                                            : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
