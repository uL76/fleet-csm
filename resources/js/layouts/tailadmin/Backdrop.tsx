import { useSidebar } from '@/context/SidebarContext';

export default function Backdrop() {
    const { isMobileOpen, toggleMobileSidebar } = useSidebar();

    if (!isMobileOpen) {
        return null;
    }

    return (
        <button
            type="button"
            aria-label="Close sidebar"
            onClick={toggleMobileSidebar}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
    );
}
