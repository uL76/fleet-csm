import AppLayout from '@/layouts/tailadmin/AppLayout';
import { router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type UserLevel = {
    id: number;
    level_code: string;
    level_name: string;
    level_order: number;
    description: string | null;
    is_active: boolean;
};

type PaginatedUserLevels = {
    data: UserLevel[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type PageProps = {
    userLevels: PaginatedUserLevels;
    filters: {
        search?: string;
    };
    flash?: {
        success?: string;
    };
};

type ModalMode = 'create' | 'edit';

type UserLevelForm = {
    level_code: string;
    level_name: string;
    level_order: number;
    description: string;
    is_active: boolean;
};

export default function UserLevelIndex() {
    const { userLevels, filters, flash } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('create');
    const [selectedUserLevel, setSelectedUserLevel] = useState<UserLevel | null>(null);

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm<UserLevelForm>({
        level_code: '',
        level_name: '',
        level_order: 0,
        description: '',
        is_active: true,
    });

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            '/administrator/user-levels',
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
        setSelectedUserLevel(null);
        clearErrors();

        setData({
            level_code: '',
            level_name: '',
            level_order: 0,
            description: '',
            is_active: true,
        });

        setIsModalOpen(true);
    };

    const openEditModal = (userLevel: UserLevel) => {
        setModalMode('edit');
        setSelectedUserLevel(userLevel);
        clearErrors();

        setData({
            level_code: userLevel.level_code || '',
            level_name: userLevel.level_name || '',
            level_order: userLevel.level_order || 0,
            description: userLevel.description || '',
            is_active: userLevel.is_active,
        });

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUserLevel(null);
        clearErrors();
        reset();
    };

    const handleSubmitUserLevel = (event: FormEvent) => {
        event.preventDefault();

        if (modalMode === 'create') {
            post('/administrator/user-levels', {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });

            return;
        }

        if (selectedUserLevel) {
            put(`/administrator/user-levels/${selectedUserLevel.id}`, {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (!confirm('Yakin ingin menghapus user level ini?')) {
            return;
        }

        router.delete(`/administrator/user-levels/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            User Levels
                        </h1>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Master data level akses user Fleet CSM.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                    >
                        Add User Level
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
                            placeholder="Search user level..."
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
                        <table className="w-full min-w-[900px] table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Code
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Level Name
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Order
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
                                {userLevels.data.length > 0 ? (
                                    userLevels.data.map((userLevel) => (
                                        <tr
                                            key={userLevel.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                {userLevel.level_code}
                                            </td>

                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                                {userLevel.level_name}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {userLevel.level_order}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {userLevel.description || '-'}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${userLevel.is_active
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {userLevel.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(userLevel)}
                                                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(userLevel.id)}
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
                                            Data user level belum tersedia.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {userLevels.links.map((link, index) => (
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
                                        ? 'Add User Level'
                                        : 'Edit User Level'}
                                </h2>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    {modalMode === 'create'
                                        ? 'Tambahkan master data user level baru.'
                                        : 'Perbarui master data user level.'}
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

                        <form onSubmit={handleSubmitUserLevel} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Level Code
                                </label>

                                <input
                                    type="text"
                                    value={data.level_code}
                                    onChange={(event) =>
                                        setData('level_code', event.target.value)
                                    }
                                    placeholder="super-admin"
                                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />

                                {errors.level_code && (
                                    <p className="mt-1 text-sm font-medium text-red-500">
                                        {errors.level_code}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Level Name
                                </label>

                                <input
                                    type="text"
                                    value={data.level_name}
                                    onChange={(event) =>
                                        setData('level_name', event.target.value)
                                    }
                                    placeholder="Super Admin"
                                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />

                                {errors.level_name && (
                                    <p className="mt-1 text-sm font-medium text-red-500">
                                        {errors.level_name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Level Order
                                </label>

                                <input
                                    type="number"
                                    min={0}
                                    value={data.level_order}
                                    onChange={(event) =>
                                        setData('level_order', Number(event.target.value))
                                    }
                                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />

                                {errors.level_order && (
                                    <p className="mt-1 text-sm font-medium text-red-500">
                                        {errors.level_order}
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
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
