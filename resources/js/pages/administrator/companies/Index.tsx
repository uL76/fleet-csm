import AppLayout from '@/layouts/tailadmin/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type Company = {
    id: number;
    company_code: string;
    company_name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    is_active: boolean;
};

type PaginatedCompanies = {
    data: Company[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type PageProps = {
    companies: PaginatedCompanies;
    filters: {
        search?: string;
    };
    flash?: {
        success?: string;
    };
};

export default function CompanyIndex() {
    const { companies, filters, flash } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            '/administrator/companies',
            { search },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = (id: number) => {
        if (!confirm('Yakin ingin menghapus company ini?')) return;
        router.delete(`/administrator/companies/${id}`);
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Companies
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Master data company untuk Fleet CSM.
                        </p>
                    </div>

                    <Link
                        href="/administrator/companies/create"
                        className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                    >
                        Add Company
                    </Link>
                </div>

                {flash?.success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-3 sm:flex-row">
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search company..."
                            className="h-12 flex-1 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                        />

                        <button
                            type="submit"
                            className="h-12 rounded-xl bg-gray-900 px-6 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                        >
                            Search
                        </button>
                    </form>

                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                        <table className="w-full min-w-[900px] table-auto">
                            <thead className="bg-gray-50 dark:bg-gray-800/80">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                        Code
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                        Company
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                        Email
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                        Phone
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                        Status
                                    </th>
                                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                                {companies.data.length > 0 ? (
                                    companies.data.map((company) => (
                                        <tr
                                            key={company.id}
                                            className="transition hover:bg-gray-50 dark:hover:bg-gray-800/60"
                                        >
                                            <td className="px-5 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {company.company_code}
                                            </td>
                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                                {company.company_name}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {company.email || '-'}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {company.phone || '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        company.is_active
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                                                    }`}
                                                >
                                                    {company.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/administrator/companies/${company.id}/edit`}
                                                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                                    >
                                                        Edit
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(company.id)}
                                                        className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
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
                                            className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            Data company belum tersedia.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {companies.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                    link.active
                                        ? 'bg-brand-500 text-white'
                                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
