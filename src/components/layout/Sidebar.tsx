"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    BookOpen,
    Trophy,
    GraduationCap,
    ShoppingBag,
    User,
    Plus,
    Star,
    Zap,
    Shield,
    LogOut,
    Globe,
    PlayCircle,
    Gift,
    HelpCircle,
} from "lucide-react";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useGameStore } from "@/store/useGameStore";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const navItems = [
    {
        name: "홈",
        href: "/",
        icon: Globe,
        activeColor: "#FF6B35",
        activeBg: "var(--primary-light)",
    },
    {
        name: "홈 피드",
        href: "/feed",
        icon: Home,
        activeColor: "#FF6B35",
        activeBg: "var(--primary-light)",
    },
    {
        name: "오늘의 수업",
        href: "/session",
        icon: GraduationCap,
        activeColor: "#4361EE",
        activeBg: "var(--secondary-light)",
        badge: "NEW",
    },
    {
        name: "미션 센터",
        href: "/missions",
        icon: Trophy,
        activeColor: "#D97706",
        activeBg: "var(--highlight-light)",
    },
    {
        name: "학습 자료",
        href: "/learn",
        icon: BookOpen,
        activeColor: "#06D6A0",
        activeBg: "var(--accent-light)",
        badge: "NEW",
    },
    {
        name: "셀러샵",
        href: "/shop",
        icon: ShoppingBag,
        activeColor: "#FF6B35",
        activeBg: "var(--primary-light)",
    },
    {
        name: "마켓 시뮬레이션",
        href: "/simulate",
        icon: PlayCircle,
        activeColor: "#06D6A0",
        activeBg: "var(--accent-light)",
    },
    {
        name: "리워드 마켓",
        href: "/rewards",
        icon: Gift,
        activeColor: "#FFC233",
        activeBg: "rgba(255,194,51,0.12)",
        badge: "NEW",
    },
    {
        name: "사용 가이드",
        href: "/guide",
        icon: HelpCircle,
        activeColor: "#4361EE",
        activeBg: "var(--secondary-light)",
    },
    {
        name: "프로필",
        href: "/profile",
        icon: User,
        activeColor: "var(--foreground-soft)",
        activeBg: "var(--surface-2)",
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { setUploadModalOpen, user, week } = useGameStore();
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminChecked, setAdminChecked] = useState(false);

    useEffect(() => {
        fetch("/api/auth/admin-check")
            .then(r => r.json())
            .then(({ isAdmin }) => { setIsAdmin(isAdmin); setAdminChecked(true); })
            .catch(() => setAdminChecked(true));
    }, []);

    const handleAdminLogout = async () => {
        await fetch("/api/auth/admin-logout", { method: "POST" });
        router.push("/admin");
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // OnboardingGate의 SIGNED_OUT 이벤트가 /login으로 리다이렉트 처리
    };

    // 비로그인 상태에서 홈(/)은 Sidebar 숨김
    if (pathname === "/" && !user.role) return null;

    const level = Math.floor(user.points / 100) + 1;
    const xpProgress = user.points % 100;

    return (
        <>
            {/* ── 모바일 하단 네비 ── */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-3 pt-3 pb-6 md:hidden"
                style={{
                    background: "var(--glass)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderTop: "1px solid var(--glass-border)",
                    boxShadow: "0 -2px 20px rgba(0,0,0,0.06)",
                }}
            >
                <Link
                    href="/"
                    className="flex flex-col items-center gap-0.5 transition-all duration-200"
                    style={{ color: pathname === "/" ? "var(--primary)" : "var(--foreground-muted)" }}
                >
                    <Home size={22} />
                    <span className="text-[9px] font-bold">홈</span>
                </Link>

                <Link
                    href="/session"
                    className="flex flex-col items-center gap-0.5 transition-all duration-200"
                    style={{ color: pathname === "/session" ? "var(--secondary)" : "var(--foreground-muted)" }}
                >
                    <GraduationCap size={22} />
                    <span className="text-[9px] font-bold">수업</span>
                </Link>

                {/* 업로드 버튼 (중앙 강조) */}
                <button
                    onClick={() => setUploadModalOpen(true)}
                    className="w-13 h-13 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 -mt-5"
                    style={{
                        background: "linear-gradient(135deg, var(--primary), #FF9A72)",
                        boxShadow: "0 4px 16px var(--primary-glow)",
                        width: "52px",
                        height: "52px",
                    }}
                >
                    <Plus size={24} className="text-white" />
                </button>

                <Link
                    href="/simulate"
                    className="flex flex-col items-center gap-0.5 transition-all duration-200"
                    style={{ color: pathname === "/simulate" ? "var(--accent)" : "var(--foreground-muted)" }}
                >
                    <PlayCircle size={22} />
                    <span className="text-[9px] font-bold">시뮬</span>
                </Link>

                <Link
                    href="/profile"
                    className="flex flex-col items-center gap-0.5 transition-all duration-200"
                    style={{ color: pathname === "/profile" ? "var(--primary)" : "var(--foreground-muted)" }}
                >
                    {user.name ? (
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                            style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}>
                            {user.name[0].toUpperCase()}
                        </div>
                    ) : (
                        <User size={22} />
                    )}
                    <span className="text-[9px] font-bold">나</span>
                </Link>
            </nav>

            {/* ── 데스크탑 사이드바 ── */}
            <aside
                className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-50"
                style={{
                    background: "var(--surface)",
                    borderRight: "1px solid var(--border)",
                }}
            >
                {/* 로고 + 세션 뱃지 */}
                <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}
                            >
                                <Zap size={18} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-base font-black tracking-tight font-outfit leading-none" style={{ color: "var(--foreground)" }}>
                                    Sellstagram
                                </h1>
                                <p className="text-[10px] font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                    마케팅 실습 플랫폼
                                </p>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>

                    {/* 현재 수업 정보 */}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-secondary">{week}회차 수업</span>
                        {isAdmin ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                                style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>
                                관리자
                            </span>
                        ) : (
                            <span className="badge badge-primary">{user.team}</span>
                        )}
                    </div>
                </div>

                {/* 네비게이션 */}
                <nav className="flex-1 flex flex-col gap-0.5 p-3 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative"
                                style={{
                                    background: isActive ? item.activeBg : "transparent",
                                    color: isActive ? item.activeColor : "var(--foreground-soft)",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                                        (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.background = "transparent";
                                        (e.currentTarget as HTMLElement).style.color = "var(--foreground-soft)";
                                    }
                                }}
                            >
                                <Icon
                                    size={18}
                                    className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                                />
                                <span className="font-semibold">{item.name}</span>
                                {item.badge && (
                                    <span
                                        className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                        style={{
                                            background: "var(--accent-light)",
                                            color: "var(--accent)",
                                        }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                                {isActive && (
                                    <div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                                        style={{ background: item.activeColor }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* 관리자 / 선생님 전용 메뉴 */}
                {(isAdmin || user.role === "teacher") && (
                    <div className="px-3 pb-1 flex flex-col gap-1">
                        <Link
                            href="/teacher"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: pathname === "/teacher" ? "rgba(124,58,237,0.12)" : "transparent",
                                color: pathname === "/teacher" ? "#7C3AED" : "var(--foreground-soft)",
                            }}
                        >
                            <Shield size={18} className="shrink-0" />
                            <span>교사 대시보드</span>
                        </Link>
                        <Link
                            href="/class-guide"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: pathname === "/class-guide" ? "rgba(67,97,238,0.12)" : "transparent",
                                color: pathname === "/class-guide" ? "#4361EE" : "var(--foreground-soft)",
                            }}
                        >
                            <PlayCircle size={18} className="shrink-0" />
                            <span>수업 시뮬레이션</span>
                        </Link>
                        {isAdmin && (
                            <Link
                                href="/admin/dashboard"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                style={{
                                    background: pathname === "/admin/dashboard" ? "rgba(124,58,237,0.18)" : "transparent",
                                    color: pathname === "/admin/dashboard" ? "#7C3AED" : "var(--foreground-soft)",
                                }}
                            >
                                <Shield size={18} className="shrink-0" style={{ color: "#7C3AED" }} />
                                <span>관리자 대시보드</span>
                            </Link>
                        )}
                    </div>
                )}

                {/* 업로드 버튼 */}
                <div className="px-4 pb-3">
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{
                            background: "linear-gradient(135deg, var(--primary), #FF9A72)",
                            boxShadow: "0 4px 12px var(--primary-glow)",
                        }}
                    >
                        <Plus size={16} />
                        콘텐츠 업로드
                    </button>
                </div>

                {/* 사용자 정보 + XP 바 — 로그인 시에만 표시 */}
                {(isAdmin || user.name) && (
                <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
                    {!adminChecked ? (
                        <div className="h-9 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
                    ) : isAdmin ? (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>
                                <Shield size={16} className="text-white" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-black" style={{ color: "#7C3AED" }}>관리자</span>
                                <span className="text-[10px] font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                    전체 접근 모드
                                </span>
                            </div>
                            <button onClick={handleAdminLogout}
                                className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                                style={{ color: "var(--foreground-muted)" }}
                                title="관리자 로그아웃">
                                <LogOut size={15} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                                    style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}
                                >
                                    {user.name ? user.name[0].toUpperCase() : "?"}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                                        {user.name || "로딩 중..."}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Star size={10} style={{ color: "var(--highlight)" }} fill="var(--highlight)" />
                                        <span className="text-[10px] font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                            Lv.{level} · {user.rank}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-red-50 shrink-0"
                                    style={{ color: "var(--foreground-muted)" }}
                                    title="로그아웃"
                                >
                                    <LogOut size={15} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold" style={{ color: "var(--foreground-muted)" }}>
                                    경험치 (XP)
                                </span>
                                <span className="text-[10px] font-bold" style={{ color: "var(--secondary)" }}>
                                    {xpProgress} / 100
                                </span>
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill progress-xp" style={{ width: `${xpProgress}%` }} />
                            </div>
                        </>
                    )}
                </div>
                )}
            </aside>
        </>
    );
}
