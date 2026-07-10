import AppLayout from '@/layouts/tailadmin/AppLayout';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

type Company = {
    id: number;
    company_code: string;
    company_name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    is_active: boolean;
};

type PageProps = {
    company: Company;
};

export default function CompanyEdit() {
    const { company } = usePage<PageProps>().props;

    const { data, setData, put, processing, errors } = useForm({
        company_code: company.company_code || '',
        company_name: company.company_name || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        is_active: company.is_active,
    });

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        put(`/administrator/companies/${company.id}`);
    };

    return (
        <AppLayout>
            <div className="mx-auto max-w-3xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Edit Company
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Perbarui master data company.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                    <div className="grid gap-5">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Company Code
                            </label>
                            <input
                                type="text"
                                value={data.company_code}
                                onChange={(event) => setData('company_code', event.target.value)}
                                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                            {errors.company_code && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.company_code}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={data.company_name}
                                onChange={(event) => setData('company_name', event.target.value)}
                                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                            {errors.company_name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.company_name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(event) => setData('email', event.target.value)}
                                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(event) => setData('phone', event.target.value)}
                                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Address
                            </label>
                            <textarea
                                value={data.address}
                                onChange={(event) => setData('address', event.target.value)}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                            {errors.address && (
                                <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                            )}
                        </div>

                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(event) => setData('is_active', event.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Active
                            </span>
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Link
                            href="/administrator/companies"
                            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
