"use client";

import { usePathname } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, sidebarExpanded } = useGameStore();

    const isFullWidthPage = pathname === "/" || pathname === "/feed";
    const hasSidebar = !!user.role;
    const sidebarW = hasSidebar ? (sidebarExpanded ? 240 : 72) : 0;

    if (isFullWidthPage) {
        return (
            <main
                className="flex-1 min-h-screen pb-24 md:pb-20 hidden-md-ml w-full overflow-x-hidden"
                style={{ "--sidebar-w": `${sidebarW}px` } as React.CSSProperties}
            >
                {children}
            </main>
        );
    }

    return (
        <main
            className="flex-1 flex flex-col pb-24 md:pb-20 hidden-md-ml w-full overflow-x-hidden"
            style={{ "--sidebar-w": `${sidebarW}px` } as React.CSSProperties}
        >
            <div className="w-full max-w-5xl mx-auto min-h-screen">
                {children}
            </div>
        </main>
    );
}
