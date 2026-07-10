import AppLayout from '@/layouts/tailadmin/AppLayout';

export default function DashboardIndex() {
    return (
        <AppLayout>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Fleet Dashboard
                </h1>

                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Laravel 12 + React + TailAdmin berhasil berjalan.
                </p>
            </div>
        </AppLayout>
    );
}
