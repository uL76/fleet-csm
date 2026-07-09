import { Link, usePage } from '@inertiajs/react';
import { useSidebar } from '@/context/SidebarContext';

type MenuItem = {
    title: string;
    href: string;
    icon: string;
};

const menuItems: MenuItem[] = [
    {
        title: 'Dashboard',
        href: '/fleet-dashboard',
        icon: '📊',
    },
    {
        title: 'Material Request',
        href: '/material-request',
        icon: '🧾',
    },
    {
        title: 'Purchase Order',
        href: '/purchase-order',
        icon: '📦',
    },
    {
        title: 'Item Master',
        href: '/item-master',
        icon: '🛠️',
    },
    {
        title: 'Warehouse',
        href: '/warehouse',
        icon: '🏭',
    },
    {
        title: 'Accurate Sync',
        href: '/accurate-sync',
        icon: '🔄',
    },
];

export default function AppSidebar() {
    const {
        isExpanded,
        isMobileOpen,
        isHovered,
        setIsHovered,
        toggleMobileSidebar,
    } = useSidebar();

    const { url } = usePage();

    const isOpen = isExpanded || isHovered || isMobileOpen;

    return (
        <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white transition-all duration-300 ease-in-out
                dark:border-gray-800 dark:bg-gray-900
                ${isOpen ? 'w-[290px]' : 'w-[90px]'}
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}
        >
            <div className="flex h-16 items-center border-b border-gray-200 px-5 dark:border-gray-800">
                <Link
                    href="/fleet-dashboard"
                    className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                        FC
                    </span>

                    {isOpen && <span>Fleet CSM</span>}
                </Link>
            </div>

            <div className="flex h-[calc(100vh-64px)] flex-col overflow-y-auto px-3 py-4">
                <div className="mb-4 px-3">
                    {isOpen && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Main Menu
                        </p>
                    )}
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const active = url === item.href || url.startsWith(`${item.href}/`);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    if (window.innerWidth < 1024) {
                                        toggleMobileSidebar();
                                    }
                                }}
                                className={`
                                    flex items-center rounded-xl px-4 py-3 text-sm font-medium transition
                                    ${
                                        active
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                    }
                                `}
                            >
                                <span className="mr-3 flex h-6 w-6 items-center justify-center text-base">
                                    {item.icon}
                                </span>

                                {isOpen && <span>{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                    {isOpen ? (
                        <>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                Fleet CSM
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Laravel 12 + React + TailAdmin
                            </p>
                        </>
                    ) : (
                        <p className="text-center text-xs font-semibold text-gray-500">
                            CSM
                        </p>
                    )}
                </div>
            </div>
        </aside>
    );
}
