import AppLayout from '@/layouts/tailadmin/AppLayout';
import { router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

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
    description: string | null;
    is_active: boolean;
    company?: Company | null;
};

type PaginatedDepartments = {
    data: Department[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type PageProps = {
    departments: PaginatedDepartments;
    companies: Company[];
    filters: {
        search?: string;
    };
    flash?: {
        success?: string;
    };
};

type ModalMode = 'create' | 'edit';

type DepartmentForm = {
    company_id: string;
    department_code: string;
    department_name: string;
    description: string;
    is_active: boolean;
};

export default function DepartmentIndex() {
    const { departments, companies, filters, flash } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('create');
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm<DepartmentForm>({
        company_id: '',
        department_code: '',
        department_name: '',
        description: '',
        is_active: true,
    });

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            '/administrator/departments',
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
        setSelectedDepartment(null);
        clearErrors();

        setData({
            company_id: '',
            department_code: '',
            department_name: '',
            description: '',
            is_active: true,
        });

        setIsModalOpen(true);
    };

    const openEditModal = (department: Department) => {
        setModalMode('edit');
        setSelectedDepartment(department);
        clearErrors();

        setData({
            company_id: department.company_id ? String(department.company_id) : '',
            department_code: department.department_code || '',
            department_name: department.department_name || '',
            description: department.description || '',
            is_active: department.is_active,
        });

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedDepartment(null);
        clearErrors();
        reset();
    };

    const handleSubmitDepartment = (event: FormEvent) => {
        event.preventDefault();

        if (modalMode === 'create') {
            post('/administrator/departments', {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });

            return;
        }

        if (selectedDepartment) {
            put(`/administrator/departments/${selectedDepartment.id}`, {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (!confirm('Yakin ingin menghapus department ini?')) {
            return;
        }

        router.delete(`/administrator/departments/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Departments
                        </h1>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Master data department berdasarkan company.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                    >
                        Add Department
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
                            placeholder="Search department..."
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
                        <table className="w-full min-w-[950px] table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Company
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Code
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Department
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
                                {departments.data.length > 0 ? (
                                    departments.data.map((department) => (
                                        <tr
                                            key={department.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                                {department.company?.company_name || '-'}
                                            </td>

                                            <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                {department.department_code}
                                            </td>

                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                                {department.department_name}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {department.description || '-'}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        department.is_active
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {department.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(department)}
                                                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(department.id)}
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
                                            colSpan={6}
                                            className="px-5 py-10 text-center text-sm font-medium text-gray-500"
                                        >
                                            Data department belum tersedia.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {departments.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                    link.active
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
                                        ? 'Add Department'
                                        : 'Edit Department'}
                                </h2>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    {modalMode === 'create'
                                        ? 'Tambahkan master data department baru.'
                                        : 'Perbarui master data department.'}
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

                        <form onSubmit={handleSubmitDepartment} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Company
                                </label>

                                <select
                                    value={data.company_id}
                                    onChange={(event) =>
                                        setData('company_id', event.target.value)
                                    }
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
                                    Department Code
                                </label>

                                <input
                                    type="text"
                                    value={data.department_code}
                                    onChange={(event) =>
                                        setData('department_code', event.target.value)
                                    }
                                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />

                                {errors.department_code && (
                                    <p className="mt-1 text-sm font-medium text-red-500">
                                        {errors.department_code}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Department Name
                                </label>

                                <input
                                    type="text"
                                    value={data.department_name}
                                    onChange={(event) =>
                                        setData('department_name', event.target.value)
                                    }
                                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />

                                {errors.department_name && (
                                    <p className="mt-1 text-sm font-medium text-red-500">
                                        {errors.department_name}
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
