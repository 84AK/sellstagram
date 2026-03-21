"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageTransitionLoader() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const prevPath = useRef(pathname);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (prevPath.current === pathname) return;
        prevPath.current = pathname;

        // 이전 타이머 클리어
        if (timerRef.current) clearTimeout(timerRef.current);

        // 로딩 오버레이 표시
        setFadeOut(false);
        setVisible(true);

        // 400ms 후 페이드 아웃
        timerRef.current = setTimeout(() => {
            setFadeOut(true);
            timerRef.current = setTimeout(() => setVisible(false), 300);
        }, 400);

        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [pathname]);

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-4"
            style={{
                background: "var(--background)",
                opacity: fadeOut ? 0 : 1,
                transition: "opacity 0.3s ease",
            }}
        >
            {/* 로고 + 튀는 애니메이션 */}
            <div style={{ animation: "ssg-bounce 0.6s ease-in-out infinite alternate" }}>
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                        background: "linear-gradient(135deg, #FF6B35, #FF9A72)",
                        boxShadow: "0 8px 32px rgba(255,107,53,0.35)",
                    }}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                </div>
            </div>

            {/* 점 세 개 로딩 인디케이터 */}
            <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                            background: "#FF6B35",
                            animation: `ssg-dot 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes ssg-bounce {
                    from { transform: translateY(0px); }
                    to   { transform: translateY(-10px); }
                }
                @keyframes ssg-dot {
                    from { opacity: 0.25; transform: scale(0.8); }
                    to   { opacity: 1;    transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}
