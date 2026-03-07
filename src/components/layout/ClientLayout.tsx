"use client";

import { usePathname } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useGameStore();

    const isHomePage = pathname === "/";
    // 홈 페이지에서 로그인된 경우 Sidebar가 표시되므로 ml-64 적용
    const hasSidebar = !isHomePage || !!user.role;

    // 홈(/) 페이지는 자체 max-width를 사용하므로 wrapper 제거
    if (isHomePage) {
        return (
            <main className={`flex-1 min-h-screen pb-24 md:pb-0 ${hasSidebar ? "md:ml-64" : ""}`}>
                {children}
            </main>
        );
    }

    return (
        <main className="flex-1 flex flex-col md:ml-64 pb-24 md:pb-0">
            <div className="w-full max-w-5xl mx-auto min-h-screen">
                {children}
            </div>
        </main>
    );
}
