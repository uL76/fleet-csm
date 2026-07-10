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
};

type UserLevel = {
    id: number;
    level_code: string;
    level_name: string;
    level_order: number;
};

type User = {
    id: number;
    company_id: number | null;
    department_id: number | null;
    position_id: number | null;
    user_level_id: number | null;
    employee_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    status: 'active' | 'inactive';
    company?: Company | null;
    department?: Department | null;
    position?: Position | null;
    user_level?: UserLevel | null;
    userLevel?: UserLevel | null;
};

type PaginatedUsers = {
    data: User[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type PageProps = {
    users: PaginatedUsers;
    companies: Company[];
    departments: Department[];
    positions: Position[];
    userLevels: UserLevel[];
    filters: {
        search?: string;
    };
    flash?: {
        success?: string;
    };
};

type ModalMode = 'create' | 'edit';

type UserForm = {
    company_id: string;
    department_id: string;
    position_id: string;
    user_level_id: string;
    employee_id: string;
    name: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive';
    password: string;
    password_confirmation: string;
};

export default function UsersIndex() {
    const {
        users,
        companies,
        departments,
        positions,
        userLevels,
        filters,
        flash,
    } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('create');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm<UserForm>({
        company_id: '',
        department_id: '',
        position_id: '',
        user_level_id: '',
        employee_id: '',
        name: '',
        email: '',
        phone: '',
        status: 'active',
        password: '',
        password_confirmation: '',
    });

    const filteredDepartments = useMemo(() => {
        if (!data.company_id) {
            return departments;
        }

        return departments.filter(
            (department) => String(department.company_id) === data.company_id,
        );
    }, [departments, data.company_id]);

    const filteredPositions = useMemo(() => {
        if (!data.department_id) {
            return positions;
        }

        return positions.filter(
            (position) => String(position.department_id) === data.department_id,
        );
    }, [positions, data.department_id]);

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            '/administrator/users',
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
        setSelectedUser(null);
        clearErrors();

        setData({
            company_id: '',
            department_id: '',
            position_id: '',
            user_level_id: '',
            employee_id: '',
            name: '',
            email: '',
            phone: '',
            status: 'active',
            password: '',
            password_confirmation: '',
        });

        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setModalMode('edit');
        setSelectedUser(user);
        clearErrors();

        setData({
            company_id: user.company_id ? String(user.company_id) : '',
            department_id: user.department_id ? String(user.department_id) : '',
            position_id: user.position_id ? String(user.position_id) : '',
            user_level_id: user.user_level_id ? String(user.user_level_id) : '',
            employee_id: user.employee_id || '',
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            status: user.status || 'active',
            password: '',
            password_confirmation: '',
        });

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        clearErrors();
        reset();
    };

    const handleSubmitUser = (event: FormEvent) => {
        event.preventDefault();

        if (modalMode === 'create') {
            post('/administrator/users', {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });

            return;
        }

        if (selectedUser) {
            put(`/administrator/users/${selectedUser.id}`, {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (!confirm('Yakin ingin menghapus user ini?')) {
            return;
        }

        router.delete(`/administrator/users/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Users
                        </h1>
                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Pengelolaan user, role, company, department, dan position.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                    >
                        Add User
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
                            placeholder="Search user..."
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
                        <table className="w-full min-w-[1200px] table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Name
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Email
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Company
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Department
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Position
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Level
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
                                {users.data.length > 0 ? (
                                    users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {user.employee_id || '-'}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {user.email}
                                            </td>

                                            <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                {user.company?.company_name || '-'}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {user.department?.department_name || '-'}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {user.position?.position_name || '-'}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {user.userLevel?.level_name ||
                                                    user.user_level?.level_name ||
                                                    '-'}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.status === 'active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {user.status === 'active'
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(user)}
                                                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(user.id)}
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
                                            colSpan={8}
                                            className="px-5 py-10 text-center text-sm font-medium text-gray-500"
                                        >
                                            Data user belum tersedia.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {users.links.map((link, index) => (
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
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {modalMode === 'create' ? 'Add User' : 'Edit User'}
                                </h2>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    {modalMode === 'create'
                                        ? 'Tambahkan user baru.'
                                        : 'Perbarui data user.'}
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

                        <form onSubmit={handleSubmitUser} className="space-y-5">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Employee ID
                                    </label>
                                    <input
                                        type="text"
                                        value={data.employee_id}
                                        onChange={(event) =>
                                            setData('employee_id', event.target.value)
                                        }
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                    />
                                    {errors.employee_id && (
                                        <p className="mt-1 text-sm font-medium text-red-500">
                                            {errors.employee_id}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm font-medium text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(event) =>
                                            setData('email', event.target.value)
                                        }
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm font-medium text-red-500">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(event) =>
                                            setData('phone', event.target.value)
                                        }
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                    />
                                    {errors.phone && (
                                        <p className="mt-1 text-sm font-medium text-red-500">
                                            {errors.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
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
                                                position_id: '',
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
                                        onChange={(event) => {
                                            setData({
                                                ...data,
                                                department_id: event.target.value,
                                                position_id: '',
                                            });
                                        }}
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
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Position
                                    </label>
                                    <select
                                        value={data.position_id}
                                        onChange={(event) =>
                                            setData('position_id', event.target.value)
                                        }
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                    >
                                        <option value="">Select Position</option>
                                        {filteredPositions.map((position) => (
                                            <option key={position.id} value={position.id}>
                                                {position.position_name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.position_id && (
                                        <p className="mt-1 text-sm font-medium text-red-500">
                                            {errors.position_id}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        User Level
                                    </label>
                                    <select
                                        value={data.user_level_id}
                                        onChange={(event) =>
                                            setData('user_level_id', event.target.value)
                                        }
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                    >
                                        <option value="">Select User Level</option>
                                        {userLevels.map((level) => (
                                            <option key={level.id} value={level.id}>
                                                {level.level_name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.user_level_id && (
                                        <p className="mt-1 text-sm font-medium text-red-500">
                                            {errors.user_level_id}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Status
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(event) =>
                                        setData('status', event.target.value as 'active' | 'inactive')
                                    }
                                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {errors.status && (
                                    <p className="mt-1 text-sm font-medium text-red-500">
                                        {errors.status}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Password {modalMode === 'edit' && '(optional)'}
                                    </label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(event) =>
                                            setData('password', event.target.value)
                                        }
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-sm font-medium text-red-500">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(event) =>
                                            setData('password_confirmation', event.target.value)
                                        }
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>
                            </div>

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
