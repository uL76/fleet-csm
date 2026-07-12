import AppLayout from '@/layouts/tailadmin/AppLayout';
import { router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useMemo } from 'react';

type UserLevel = {
    id: number;
    level_code: string;
    level_name: string;
    level_order: number;
};

type PermissionRow = {
    menu_id: number;
    menu_code: string;
    menu_name: string;
    menu_group: string | null;
    route_name: string | null;
    url: string | null;
    icon: string | null;
    sort_order: number;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_review: boolean;
    can_approve: boolean;
    can_export: boolean;
};

type PageProps = {
    userLevels: UserLevel[];
    selectedLevelId: number | null;
    permissionRows: PermissionRow[];
    flash?: {
        success?: string;
    };
};

type PermissionForm = {
    user_level_id: string;
    permissions: PermissionRow[];
};

const permissionColumns = [
    {
        key: 'can_view',
        label: 'View',
    },
    {
        key: 'can_create',
        label: 'Create',
    },
    {
        key: 'can_edit',
        label: 'Edit',
    },
    {
        key: 'can_delete',
        label: 'Delete',
    },
    {
        key: 'can_review',
        label: 'Review',
    },
    {
        key: 'can_approve',
        label: 'Approve',
    },
    {
        key: 'can_export',
        label: 'Export',
    },
] as const;

type PermissionKey = (typeof permissionColumns)[number]['key'];

export default function UserConfigIndex() {
    const pageProps = usePage().props as unknown as Partial<PageProps>;

    const userLevels = Array.isArray(pageProps.userLevels)
        ? pageProps.userLevels
        : [];

    const selectedLevelId = pageProps.selectedLevelId ?? null;

    const permissionRows = Array.isArray(pageProps.permissionRows)
        ? pageProps.permissionRows
        : [];

    const flash = pageProps.flash;

    const { data, setData, put, processing, errors } = useForm<PermissionForm>({
        user_level_id: selectedLevelId ? String(selectedLevelId) : '',
        permissions: permissionRows,
    });

    const groupedPermissions = useMemo(() => {
        const permissions = Array.isArray(data.permissions)
            ? data.permissions
            : [];

        return permissions.reduce<Record<string, PermissionRow[]>>(
            (groups, permission) => {
                const groupName = permission.menu_group || 'Other';

                if (!groups[groupName]) {
                    groups[groupName] = [];
                }

                groups[groupName].push(permission);

                return groups;
            },
            {},
        );
    }, [data.permissions]);

    const handleChangeLevel = (userLevelId: string) => {
        router.get(
            '/administrator/user-config',
            {
                user_level_id: userLevelId,
            },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const updatePermission = (
        menuId: number,
        key: PermissionKey,
        value: boolean,
    ) => {
        setData(
            'permissions',
            data.permissions.map((permission) => {
                if (permission.menu_id !== menuId) {
                    return permission;
                }

                return {
                    ...permission,
                    [key]: value,
                };
            }),
        );
    };

    const toggleAllByColumn = (key: PermissionKey, value: boolean) => {
        setData(
            'permissions',
            data.permissions.map((permission) => ({
                ...permission,
                [key]: value,
            })),
        );
    };

    const toggleAllByRow = (menuId: number, value: boolean) => {
        setData(
            'permissions',
            data.permissions.map((permission) => {
                if (permission.menu_id !== menuId) {
                    return permission;
                }

                return {
                    ...permission,
                    can_view: value,
                    can_create: value,
                    can_edit: value,
                    can_delete: value,
                    can_review: value,
                    can_approve: value,
                    can_export: value,
                };
            }),
        );
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        put('/administrator/user-config', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            User Config / Permission Access
                        </h1>

                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Atur akses menu dan action berdasarkan user level.
                            Permission Review digunakan sebelum Approve.
                        </p>
                    </div>

                    <div className="w-full lg:w-80">
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            User Level
                        </label>

                        <select
                            value={data.user_level_id}
                            onChange={(event) =>
                                handleChangeLevel(event.target.value)
                            }
                            className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                        >
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

                {flash?.success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Permission Matrix
                                </h2>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    Checklist permission untuk level yang dipilih.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Permission'}
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full min-w-[1100px] table-auto">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Menu
                                        </th>

                                        {permissionColumns.map((column) => (
                                            <th
                                                key={column.key}
                                                className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-600"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <span>{column.label}</span>

                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleAllByColumn(
                                                                    column.key,
                                                                    true,
                                                                )
                                                            }
                                                            className="rounded-md border border-gray-300 px-2 py-1 text-[10px] font-bold text-gray-600 transition hover:bg-gray-100"
                                                        >
                                                            All
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleAllByColumn(
                                                                    column.key,
                                                                    false,
                                                                )
                                                            }
                                                            className="rounded-md border border-gray-300 px-2 py-1 text-[10px] font-bold text-gray-600 transition hover:bg-gray-100"
                                                        >
                                                            Off
                                                        </button>
                                                    </div>
                                                </div>
                                            </th>
                                        ))}

                                        <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                                            Row
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {Object.entries(groupedPermissions).map(
                                        ([groupName, permissions]) => (
                                            <>
                                                <tr key={`${groupName}-header`}>
                                                    <td
                                                        colSpan={9}
                                                        className="bg-gray-100 px-5 py-3 text-sm font-bold uppercase tracking-wide text-gray-700"
                                                    >
                                                        {groupName}
                                                    </td>
                                                </tr>

                                                {permissions.map((permission) => (
                                                    <tr
                                                        key={permission.menu_id}
                                                        className="transition hover:bg-gray-50"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    {permission.menu_name}
                                                                </p>
                                                                <p className="text-xs font-medium text-gray-500">
                                                                    {permission.url || '-'}
                                                                </p>
                                                            </div>
                                                        </td>

                                                        {permissionColumns.map((column) => (
                                                            <td
                                                                key={column.key}
                                                                className="px-4 py-4 text-center"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        permission[column.key]
                                                                    }
                                                                    onChange={(event) =>
                                                                        updatePermission(
                                                                            permission.menu_id,
                                                                            column.key,
                                                                            event.target.checked,
                                                                        )
                                                                    }
                                                                    className="h-5 w-5 rounded border-gray-300"
                                                                />
                                                            </td>
                                                        ))}

                                                        <td className="px-4 py-4 text-center">
                                                            <div className="flex justify-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        toggleAllByRow(
                                                                            permission.menu_id,
                                                                            true,
                                                                        )
                                                                    }
                                                                    className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                                                >
                                                                    All
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        toggleAllByRow(
                                                                            permission.menu_id,
                                                                            false,
                                                                        )
                                                                    }
                                                                    className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                                                >
                                                                    Off
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        ),
                                    )}

                                    {(!Array.isArray(data.permissions) || data.permissions.length === 0) && (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="px-5 py-10 text-center text-sm font-medium text-gray-500"
                                            >
                                                Data menu belum tersedia.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
