import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import { Link, usePage } from '@inertiajs/react';

import {
    BoxCubeIcon,
    ChevronDownIcon,
    GridIcon,
    HorizontaLDots,
    UserCircleIcon,

    // Icon bawaan TailAdmin yang belum digunakan.
    // CalenderIcon,
    // ListIcon,
    // PageIcon,
    // PieChartIcon,
    // PlugInIcon,
    // TableIcon,
} from '@/icons';

import { useSidebar } from '@/context/SidebarContext';

// Widget promosi bawaan TailAdmin belum diperlukan.
// import SidebarWidget from './SidebarWidget';

type SubNavItem = {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
};

type NavItem = {
    name: string;
    icon: ReactNode;
    path?: string;
    subItems?: SubNavItem[];
};

/*
|--------------------------------------------------------------------------
| MAIN MENU
|--------------------------------------------------------------------------
|
| Menu utama FleetCSM yang saat ini sudah digunakan.
|
*/

const navItems: NavItem[] = [
    {
        icon: <GridIcon />,
        name: 'Dashboard',
        path: '/fleet-dashboard',
    },

    {
        icon: <BoxCubeIcon />,
        name: 'Warehouse',
        path: '/warehouse/warehouses',
    },

    /*
    |--------------------------------------------------------------------------
    | MENU TAILADMIN YANG BELUM DIGUNAKAN
    |--------------------------------------------------------------------------
    */

    /*
    {
        icon: <CalenderIcon />,
        name: 'Calendar',
        path: '/calendar',
    },
    */

    /*
    {
        icon: <UserCircleIcon />,
        name: 'User Profile',
        path: '/profile',
    },
    */

    /*
    {
        name: 'Forms',
        icon: <ListIcon />,
        subItems: [
            {
                name: 'Form Elements',
                path: '/form-elements',
                pro: false,
            },
        ],
    },
    */

    /*
    {
        name: 'Tables',
        icon: <TableIcon />,
        subItems: [
            {
                name: 'Basic Tables',
                path: '/basic-tables',
                pro: false,
            },
        ],
    },
    */

    /*
    {
        name: 'Pages',
        icon: <PageIcon />,
        subItems: [
            {
                name: 'Blank Page',
                path: '/blank',
                pro: false,
            },
            {
                name: '404 Error',
                path: '/error-404',
                pro: false,
            },
        ],
    },
    */
];

/*
|--------------------------------------------------------------------------
| OTHER MENU
|--------------------------------------------------------------------------
|
| Untuk saat ini hanya Administrator yang digunakan.
|
*/

const othersItems: NavItem[] = [
    {
        icon: <UserCircleIcon />,
        name: 'Administrator',
        subItems: [
            {
                name: 'Users',
                path: '/administrator/users',
                pro: false,
            },
            {
                name: 'User Level',
                path: '/administrator/user-levels',
                pro: false,
            },
            {
                name: 'Position',
                path: '/administrator/positions',
                pro: false,
            },
            {
                name: 'Department',
                path: '/administrator/departments',
                pro: false,
            },
            {
                name: 'Company',
                path: '/administrator/companies',
                pro: false,
            },
            {
                name: 'User Config',
                path: '/administrator/user-config',
                pro: false,
            },

            /*
             * Aktifkan kembali jika route dan halaman Timezone sudah dibuat.
             *
            {
                name: 'Timezone',
                path: '/administrator/timezone',
                pro: false,
            },
            */
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | MENU DEMO TAILADMIN YANG BELUM DIGUNAKAN
    |--------------------------------------------------------------------------
    */

    /*
    {
        icon: <PieChartIcon />,
        name: 'Charts',
        subItems: [
            {
                name: 'Line Chart',
                path: '/line-chart',
                pro: false,
            },
            {
                name: 'Bar Chart',
                path: '/bar-chart',
                pro: false,
            },
        ],
    },
    */

    /*
    {
        icon: <BoxCubeIcon />,
        name: 'UI Elements',
        subItems: [
            {
                name: 'Alerts',
                path: '/alerts',
                pro: false,
            },
            {
                name: 'Avatar',
                path: '/avatars',
                pro: false,
            },
            {
                name: 'Badge',
                path: '/badge',
                pro: false,
            },
            {
                name: 'Buttons',
                path: '/buttons',
                pro: false,
            },
            {
                name: 'Images',
                path: '/images',
                pro: false,
            },
            {
                name: 'Videos',
                path: '/videos',
                pro: false,
            },
        ],
    },
    */

    /*
    {
        icon: <PlugInIcon />,
        name: 'Authentication',
        subItems: [
            {
                name: 'Sign In',
                path: '/login',
                pro: false,
            },
            {
                name: 'Sign Up',
                path: '/register',
                pro: false,
            },
        ],
    },
    */
];

const AppSidebar = () => {
    const {
        isExpanded,
        isMobileOpen,
        isHovered,
        setIsHovered,
    } = useSidebar();

    const { url } = usePage();

    const [openSubmenu, setOpenSubmenu] = useState<{
        type: 'main' | 'others';
        index: number;
    } | null>(null);

    const [subMenuHeight, setSubMenuHeight] = useState<
        Record<string, number>
    >({});

    const subMenuRefs = useRef<
        Record<string, HTMLDivElement | null>
    >({});

    /*
    |--------------------------------------------------------------------------
    | ACTIVE URL CHECK
    |--------------------------------------------------------------------------
    */

    const isActive = useCallback(
        (path: string) => {
            return (
                url === path ||
                url.startsWith(`${path}/`) ||
                url.startsWith(`${path}?`)
            );
        },
        [url],
    );

    /*
    |--------------------------------------------------------------------------
    | AUTO OPEN ACTIVE SUBMENU
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let submenuMatched = false;

        const menuGroups: Array<{
            type: 'main' | 'others';
            items: NavItem[];
        }> = [
                {
                    type: 'main',
                    items: navItems,
                },
                {
                    type: 'others',
                    items: othersItems,
                },
            ];

        menuGroups.forEach(({ type, items }) => {
            items.forEach((nav, index) => {
                if (!nav.subItems) {
                    return;
                }

                const hasActiveSubItem = nav.subItems.some(
                    (subItem) => isActive(subItem.path),
                );

                if (hasActiveSubItem) {
                    setOpenSubmenu({
                        type,
                        index,
                    });

                    submenuMatched = true;
                }
            });
        });

        if (!submenuMatched) {
            setOpenSubmenu(null);
        }
    }, [url, isActive]);

    /*
    |--------------------------------------------------------------------------
    | CALCULATE SUBMENU HEIGHT
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (openSubmenu === null) {
            return;
        }

        const key = `${openSubmenu.type}-${openSubmenu.index}`;
        const submenuElement = subMenuRefs.current[key];

        if (!submenuElement) {
            return;
        }

        setSubMenuHeight((previousHeights) => ({
            ...previousHeights,
            [key]: submenuElement.scrollHeight,
        }));
    }, [openSubmenu]);

    /*
    |--------------------------------------------------------------------------
    | TOGGLE SUBMENU
    |--------------------------------------------------------------------------
    */

    const handleSubmenuToggle = (
        index: number,
        menuType: 'main' | 'others',
    ) => {
        setOpenSubmenu((previousOpenSubmenu) => {
            const isCurrentSubmenuOpen =
                previousOpenSubmenu?.type === menuType &&
                previousOpenSubmenu?.index === index;

            if (isCurrentSubmenuOpen) {
                return null;
            }

            return {
                type: menuType,
                index,
            };
        });
    };

    /*
    |--------------------------------------------------------------------------
    | RENDER MENU ITEMS
    |--------------------------------------------------------------------------
    */

    const renderMenuItems = (
        items: NavItem[],
        menuType: 'main' | 'others',
    ) => {
        return (
            <ul className="flex flex-col gap-4">
                {items.map((nav, index) => {
                    const submenuKey = `${menuType}-${index}`;

                    const isSubmenuOpen =
                        openSubmenu?.type === menuType &&
                        openSubmenu?.index === index;

                    const hasActiveSubItem =
                        nav.subItems?.some((subItem) =>
                            isActive(subItem.path),
                        ) ?? false;

                    const isMenuActive = nav.path
                        ? isActive(nav.path)
                        : hasActiveSubItem;

                    return (
                        <li key={`${menuType}-${nav.name}`}>
                            {nav.subItems ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleSubmenuToggle(
                                            index,
                                            menuType,
                                        )
                                    }
                                    className={[
                                        'menu-item group cursor-pointer',
                                        isMenuActive || isSubmenuOpen
                                            ? 'menu-item-active'
                                            : 'menu-item-inactive',
                                        !isExpanded && !isHovered
                                            ? 'lg:justify-center'
                                            : 'lg:justify-start',
                                    ].join(' ')}
                                >
                                    <span
                                        className={[
                                            'menu-item-icon-size',
                                            isMenuActive ||
                                                isSubmenuOpen
                                                ? 'menu-item-icon-active'
                                                : 'menu-item-icon-inactive',
                                        ].join(' ')}
                                    >
                                        {nav.icon}
                                    </span>

                                    {(isExpanded ||
                                        isHovered ||
                                        isMobileOpen) && (
                                            <span className="menu-item-text">
                                                {nav.name}
                                            </span>
                                        )}

                                    {(isExpanded ||
                                        isHovered ||
                                        isMobileOpen) && (
                                            <ChevronDownIcon
                                                className={[
                                                    'ml-auto h-5 w-5 transition-transform duration-200',
                                                    isSubmenuOpen
                                                        ? 'rotate-180 text-brand-500'
                                                        : '',
                                                ].join(' ')}
                                            />
                                        )}
                                </button>
                            ) : (
                                nav.path && (
                                    <Link
                                        href={nav.path}
                                        className={[
                                            'menu-item group',
                                            isActive(nav.path)
                                                ? 'menu-item-active'
                                                : 'menu-item-inactive',
                                        ].join(' ')}
                                    >
                                        <span
                                            className={[
                                                'menu-item-icon-size',
                                                isActive(nav.path)
                                                    ? 'menu-item-icon-active'
                                                    : 'menu-item-icon-inactive',
                                            ].join(' ')}
                                        >
                                            {nav.icon}
                                        </span>

                                        {(isExpanded ||
                                            isHovered ||
                                            isMobileOpen) && (
                                                <span className="menu-item-text">
                                                    {nav.name}
                                                </span>
                                            )}
                                    </Link>
                                )
                            )}

                            {nav.subItems &&
                                (isExpanded ||
                                    isHovered ||
                                    isMobileOpen) && (
                                    <div
                                        ref={(element) => {
                                            subMenuRefs.current[
                                                submenuKey
                                            ] = element;
                                        }}
                                        className="overflow-hidden transition-all duration-300"
                                        style={{
                                            height: isSubmenuOpen
                                                ? `${subMenuHeight[submenuKey] ?? 0}px`
                                                : '0px',
                                        }}
                                    >
                                        <ul className="ml-9 mt-2 space-y-1">
                                            {nav.subItems.map(
                                                (subItem) => (
                                                    <li
                                                        key={
                                                            subItem.path
                                                        }
                                                    >
                                                        <Link
                                                            href={
                                                                subItem.path
                                                            }
                                                            className={[
                                                                'menu-dropdown-item',
                                                                isActive(
                                                                    subItem.path,
                                                                )
                                                                    ? 'menu-dropdown-item-active'
                                                                    : 'menu-dropdown-item-inactive',
                                                            ].join(
                                                                ' ',
                                                            )}
                                                        >
                                                            {
                                                                subItem.name
                                                            }

                                                            <span className="ml-auto flex items-center gap-1">
                                                                {subItem.new && (
                                                                    <span
                                                                        className={[
                                                                            'menu-dropdown-badge',
                                                                            isActive(
                                                                                subItem.path,
                                                                            )
                                                                                ? 'menu-dropdown-badge-active'
                                                                                : 'menu-dropdown-badge-inactive',
                                                                        ].join(
                                                                            ' ',
                                                                        )}
                                                                    >
                                                                        new
                                                                    </span>
                                                                )}

                                                                {subItem.pro && (
                                                                    <span
                                                                        className={[
                                                                            'menu-dropdown-badge',
                                                                            isActive(
                                                                                subItem.path,
                                                                            )
                                                                                ? 'menu-dropdown-badge-active'
                                                                                : 'menu-dropdown-badge-inactive',
                                                                        ].join(
                                                                            ' ',
                                                                        )}
                                                                    >
                                                                        pro
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </Link>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                )}
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <aside
            className={[
                'fixed left-0 top-0 z-50 flex h-screen flex-col',
                'border-r border-gray-200 bg-white px-5 text-gray-900',
                'transition-all duration-300 ease-in-out',
                'dark:border-gray-800 dark:bg-gray-900',
                'lg:mt-0',
                isExpanded || isMobileOpen || isHovered
                    ? 'w-[290px]'
                    : 'w-[90px]',
                isMobileOpen
                    ? 'translate-x-0'
                    : '-translate-x-full',
                'lg:translate-x-0',
            ].join(' ')}
            onMouseEnter={() => {
                if (!isExpanded) {
                    setIsHovered(true);
                }
            }}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={[
                    'flex py-7',
                    !isExpanded && !isHovered
                        ? 'lg:justify-center'
                        : 'justify-start',
                ].join(' ')}
            >
                <Link
                    href="/fleet-dashboard"
                    className="flex min-w-0 items-center gap-3"
                >
                    <img
                        src="/images/logo/csm-icon.svg"
                        alt="CSM Logo"
                        className="h-10 w-10 shrink-0 object-contain"
                    />

                    {(isExpanded || isHovered || isMobileOpen) && (
                        <div className="min-w-0">
                            <div className="truncate text-xl font-bold text-white">
                                Fleet CSM
                            </div>

                            <div className="text-xs font-medium text-gray-400">
                                Control Tower
                            </div>
                        </div>
                    )}
                </Link>
            </div>

            <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
                <nav className="mb-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2
                                className={[
                                    'mb-4 flex text-xs uppercase leading-[20px] text-gray-400',
                                    !isExpanded && !isHovered
                                        ? 'lg:justify-center'
                                        : 'justify-start',
                                ].join(' ')}
                            >
                                {isExpanded ||
                                    isHovered ||
                                    isMobileOpen ? (
                                    'Menu'
                                ) : (
                                    <HorizontaLDots className="size-6" />
                                )}
                            </h2>

                            {renderMenuItems(
                                navItems,
                                'main',
                            )}
                        </div>

                        <div>
                            <h2
                                className={[
                                    'mb-4 flex text-xs uppercase leading-[20px] text-gray-400',
                                    !isExpanded && !isHovered
                                        ? 'lg:justify-center'
                                        : 'justify-start',
                                ].join(' ')}
                            >
                                {isExpanded ||
                                    isHovered ||
                                    isMobileOpen ? (
                                    'System'
                                ) : (
                                    <HorizontaLDots className="size-6" />
                                )}
                            </h2>

                            {renderMenuItems(
                                othersItems,
                                'others',
                            )}
                        </div>
                    </div>
                </nav>

                {/*
                 * Widget promosi bawaan TailAdmin belum diperlukan.
                 *
                {(isExpanded || isHovered || isMobileOpen) && (
                    <SidebarWidget />
                )}
                */}
            </div>
        </aside>
    );
};

export default AppSidebar;
