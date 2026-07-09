import { ReactNode } from 'react';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import AppHeader from './AppHeader';
import Backdrop from './Backdrop';
import AppSidebar from './AppSidebar';

type AppLayoutProps = {
    children: ReactNode;
};

function LayoutContent({ children }: AppLayoutProps) {
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();

    return (
        <div className="min-h-screen xl:flex">
            <div>
                <AppSidebar />
                <Backdrop />
            </div>

            <div
                className={`flex-1 transition-all duration-300 ease-in-out ${
                    isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]'
                } ${isMobileOpen ? 'ml-0' : ''}`}
            >
                <AppHeader />

                <div className="mx-auto max-w-screen-2xl p-4 md:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <SidebarProvider>
            <LayoutContent>{children}</LayoutContent>
        </SidebarProvider>
    );
}
