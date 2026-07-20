import { useSidebar } from '@/context/SidebarContext';
import { usePage } from '@inertiajs/react';

type AuthUser = {
    id: number;
    name: string;
    email: string;
    employee_id?: string | null;
    status?: string | null;
};

type PageProps = {
    auth?: {
        user?: AuthUser | null;
    };
};

export default function AppHeader() {
    const { toggleSidebar, toggleMobileSidebar } = useSidebar();

    const pageProps = usePage().props as unknown as PageProps;
    const user = pageProps.auth?.user;

    const userName = user?.name || 'Guest';
    const userEmail = user?.email || '-';

    const initial = userName
        .trim()
        .charAt(0)
        .toUpperCase() || 'G';

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:px-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => {
                        if (window.innerWidth >= 1024) {
                            toggleSidebar();
                        } else {
                            toggleMobileSidebar();
                        }
                    }}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                    Menu
                </button>

                <div>
                    <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                        Fleet CSM
                    </h1>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Control Tower
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden max-w-[220px] text-right sm:block">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {userName}
                    </p>

                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {userEmail}
                    </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                    {initial}
                </div>
            </div>
        </header>
    );
}
