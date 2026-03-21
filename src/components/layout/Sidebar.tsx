"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    BookOpen,
    ShoppingBag,
    User,
    Plus,
    Star,
    Zap,
    Shield,
    LogOut,
    PlayCircle,
    HelpCircle,
    PanelLeftOpen,
    PanelLeftClose,
    Inbox,
    Menu,
    X,
} from "lucide-react";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useGameStore } from "@/store/useGameStore";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const navItems = [
    { name: "피드",            href: "/feed",     icon: Home },
    { name: "학습 허브",       href: "/learn",    icon: BookOpen },
    { name: "스토어",          href: "/shop",     icon: ShoppingBag },
    { name: "마켓 시뮬레이션", href: "/simulate", icon: PlayCircle },
    { name: "메시지",          href: "/messages", icon: Inbox },
    { name: "사용 가이드",     href: "/guide",    icon: HelpCircle },
    { name: "프로필",          href: "/profile",  icon: User },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const user = useGameStore(s => s.user);
    const week = useGameStore(s => s.week);
    const sidebarExpanded = useGameStore(s => s.sidebarExpanded);
    const setUploadModalOpen = useGameStore(s => s.setUploadModalOpen);
    const setWeek = useGameStore(s => s.setWeek);
    const setSidebarExpanded = useGameStore(s => s.setSidebarExpanded);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminChecked, setAdminChecked] = useState(false);
    const unreadMessages = useGameStore(s => s.unreadCount);
    const setUnreadMessages = useGameStore(s => s.setUnreadCount);

    // 읽지 않은 메시지 수 로드 + 실시간 구독 (새 메시지 알림용)
    useEffect(() => {
        const load = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            const { count } = await supabase
                .from("messages")
                .select("id", { count: "exact", head: true })
                .eq("receiver_id", authUser.id)
                .eq("read", false);

            setUnreadMessages(count ?? 0);

            const ch = supabase
                .channel("sidebar-unread-messages")
                .on(
                    "postgres_changes",
                    { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${authUser.id}` },
                    async () => {
                        const { count: newCount } = await supabase
                            .from("messages")
                            .select("id", { count: "exact", head: true })
                            .eq("receiver_id", authUser.id)
                            .eq("read", false);
                        setUnreadMessages(newCount ?? 0);
                    }
                )
                .subscribe();

            return ch;
        };

        let channel: ReturnType<typeof supabase.channel> | null = null;
        load().then(ch => { if (ch) channel = ch; });

        return () => { if (channel) supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetch("/api/auth/admin-check")
            .then(r => r.json())
            .then(({ isAdmin }) => { setIsAdmin(isAdmin); setAdminChecked(true); })
            .catch(() => setAdminChecked(true));
    }, []);

    useEffect(() => {
        supabase
            .from("game_state")
            .select("week")
            .eq("id", 1)
            .single()
            .then(({ data }) => { if (data?.week) setWeek(data.week); });

        const channel = supabase
            .channel("sidebar-week")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "game_state", filter: "id=eq.1" },
                (payload) => {
                    const newWeek = (payload.new as { week?: number }).week;
                    if (newWeek !== undefined) setWeek(newWeek);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAdminLogout = async () => {
        await fetch("/api/auth/admin-logout", { method: "POST" });
        router.push("/admin");
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!user.role && !isAdmin) return null;

    const level = Math.floor(user.points / 100) + 1;
    const xpProgress = user.points % 100;

    const W = sidebarExpanded ? 240 : 72;

    // 드로어 열릴 때 body 스크롤 방지
    const closeMobileMenu = () => setMobileMenuOpen(false);

    const mobileExtraNavItems = [
        { href: "/shop",     icon: ShoppingBag, label: "스토어" },
        { href: "/simulate", icon: PlayCircle,  label: "마켓 시뮬레이션" },
        { href: "/messages", icon: Inbox,       label: "메시지" },
        { href: "/guide",    icon: HelpCircle,  label: "사용 가이드" },
    ];

    const mobileAdminItems = [
        { href: "/teacher",     icon: Shield,     label: "교사 대시보드" },
        { href: "/class-guide", icon: PlayCircle, label: "수업 시뮬레이션" },
        { href: isAdmin ? "/admin/dashboard" : "/admin", icon: Shield, label: "관리자 대시보드" },
    ];

    return (
        <>
            {/* ── 모바일 하단 네비 ── */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 pt-2 pb-6 md:hidden"
                style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
            >
                {[
                    { href: "/feed",    icon: Home,     label: "홈" },
                    { href: "/learn",   icon: BookOpen, label: "학습" },
                    { href: "/profile", icon: User,     label: "나" },
                ].map(item => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-0.5 min-w-[44px]"
                            style={{ color: isActive ? "var(--foreground)" : "var(--foreground-muted)" }}
                        >
                            <div className="relative">
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
                            </div>
                            <span className="text-[9px] font-semibold">{item.label}</span>
                        </Link>
                    );
                })}

                {/* 메시지 — 뱃지 포함 */}
                <Link
                    href="/messages"
                    className="flex flex-col items-center gap-0.5 min-w-[44px]"
                    style={{ color: pathname === "/messages" ? "var(--foreground)" : "var(--foreground-muted)" }}
                >
                    <div className="relative">
                        <Inbox size={24} strokeWidth={pathname === "/messages" ? 2.5 : 1.8} />
                        {unreadMessages > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-black text-white px-[3px]"
                                style={{ background: "var(--secondary)" }}>
                                {unreadMessages > 9 ? "9+" : unreadMessages}
                            </span>
                        )}
                    </div>
                    <span className="text-[9px] font-semibold">메시지</span>
                </Link>

                {/* 햄버거 메뉴 버튼 */}
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex flex-col items-center gap-0.5 min-w-[44px]"
                    style={{ color: mobileMenuOpen ? "var(--foreground)" : "var(--foreground-muted)" }}
                >
                    <Menu size={24} strokeWidth={1.8} />
                    <span className="text-[9px] font-semibold">더보기</span>
                </button>
            </nav>

            {/* ── 모바일 드로어 (슬라이드업) ── */}
            {mobileMenuOpen && (
                <>
                    {/* 배경 오버레이 */}
                    <div
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
                        onClick={closeMobileMenu}
                    />
                    {/* 드로어 본체 */}
                    <div
                        className="fixed bottom-0 left-0 right-0 z-[70] md:hidden rounded-t-3xl overflow-hidden"
                        style={{
                            background: "var(--surface)",
                            boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
                            paddingBottom: "env(safe-area-inset-bottom, 16px)",
                        }}
                    >
                        {/* 핸들바 */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
                        </div>

                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-5 py-3"
                            style={{ borderBottom: "1px solid var(--border)" }}>
                            <span className="text-sm font-black" style={{ color: "var(--foreground)" }}>메뉴</span>
                            <button
                                onClick={closeMobileMenu}
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* 만들기 버튼 */}
                        <div className="px-4 pt-4 pb-2">
                            <button
                                onClick={() => { setUploadModalOpen(true); closeMobileMenu(); }}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm text-white"
                                style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}
                            >
                                <Plus size={18} />
                                콘텐츠 만들기
                            </button>
                        </div>

                        {/* 일반 메뉴 */}
                        <div className="px-4 py-2 flex flex-col gap-0.5">
                            {mobileExtraNavItems.map(item => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={closeMobileMenu}
                                        className="flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-colors"
                                        style={{
                                            background: isActive ? "var(--surface-2)" : "transparent",
                                            color: isActive ? "var(--foreground)" : "var(--foreground-soft)",
                                            fontWeight: isActive ? 700 : 500,
                                        }}
                                    >
                                        <div className="relative">
                                            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                                            {item.href === "/messages" && unreadMessages > 0 && (
                                                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-black text-white px-[3px]"
                                                    style={{ background: "var(--secondary)" }}>
                                                    {unreadMessages > 9 ? "9+" : unreadMessages}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[15px]">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* 관리자/선생님 메뉴 */}
                        {(isAdmin || user.role === "teacher") && (
                            <div className="px-4 pb-4">
                                <div className="px-4 py-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider"
                                        style={{ color: "var(--foreground-muted)" }}>관리</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    {mobileAdminItems.map(item => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href || (item.href.startsWith("/admin") && pathname.startsWith("/admin"));
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={closeMobileMenu}
                                                className="flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-colors"
                                                style={{
                                                    background: isActive ? "var(--surface-2)" : "transparent",
                                                    color: isActive ? "var(--foreground)" : "var(--foreground-soft)",
                                                    fontWeight: isActive ? 700 : 500,
                                                }}
                                            >
                                                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                                                <span className="text-[15px]">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 하단 여백 (홈 인디케이터) */}
                        <div className="h-6" />
                    </div>
                </>
            )}

            {/* ── 데스크탑 사이드바 ── */}
            <aside
                className="hidden md:flex fixed left-0 top-0 bottom-0 flex-col z-50 overflow-hidden"
                style={{
                    width: W,
                    transition: "width 220ms cubic-bezier(0.4,0,0.2,1)",
                    background: "var(--surface)",
                    borderRight: "1px solid var(--border)",
                }}
            >
                {/* 로고 영역 */}
                <div
                    className="flex items-center shrink-0"
                    style={{
                        borderBottom: "1px solid var(--border)",
                        padding: sidebarExpanded ? "16px 12px" : "16px 0",
                        justifyContent: sidebarExpanded ? "space-between" : "center",
                        minHeight: 64,
                    }}
                >
                    {sidebarExpanded ? (
                        <Link href="/feed" className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}>
                                <Zap size={16} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-[14px] font-black tracking-tight font-outfit leading-none truncate" style={{ color: "var(--foreground)" }}>
                                    Sellstagram
                                </h1>
                                <p className="text-[9px] font-medium mt-0.5 truncate" style={{ color: "var(--foreground-muted)" }}>
                                    마케팅 실습 플랫폼
                                </p>
                            </div>
                        </Link>
                    ) : (
                        <Link href="/feed">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}>
                                <Zap size={16} className="text-white" />
                            </div>
                        </Link>
                    )}
                    {sidebarExpanded && <ThemeToggle />}
                </div>

                {/* 토글 버튼 — 로고 바로 아래 항상 노출 */}
                <button
                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                    title={sidebarExpanded ? "메뉴 접기" : "메뉴 펼치기"}
                    className="shrink-0 flex items-center transition-all"
                    style={{
                        height: 40,
                        padding: sidebarExpanded ? "0 12px" : "0",
                        justifyContent: sidebarExpanded ? "flex-end" : "center",
                        color: "var(--foreground-muted)",
                        borderBottom: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                    {sidebarExpanded ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold" style={{ color: "var(--foreground-muted)" }}>접기</span>
                            <PanelLeftClose size={16} strokeWidth={1.8} />
                        </div>
                    ) : (
                        <PanelLeftOpen size={18} strokeWidth={1.8} />
                    )}
                </button>

                {/* 수업 회차 배지 (펼쳐졌을 때만) */}
                {sidebarExpanded && (
                    <div className="flex items-center gap-2 px-4 py-2.5 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                            style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}>
                            {week}회차 수업
                        </span>
                        {isAdmin ? (
                            <span className="text-[10px] font-black px-2 py-1 rounded-full text-white"
                                style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>관리자</span>
                        ) : user.team ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                                style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                                {user.team}
                            </span>
                        ) : null}
                    </div>
                )}

                {/* 네비게이션 */}
                <nav className="flex-1 flex flex-col gap-0.5 py-2 overflow-y-auto overflow-x-hidden"
                    style={{ padding: sidebarExpanded ? "8px 12px" : "8px 0", alignItems: sidebarExpanded ? "stretch" : "center" }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href
                            || (item.href === "/learn" && ["/session", "/missions"].includes(pathname))
                            || (item.href === "/shop" && ["/rewards"].includes(pathname));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={!sidebarExpanded ? item.name : undefined}
                                className="flex items-center transition-all duration-150 rounded-xl"
                                style={{
                                    gap: sidebarExpanded ? 14 : 0,
                                    padding: sidebarExpanded ? "10px 12px" : "10px",
                                    width: sidebarExpanded ? "100%" : 44,
                                    height: 44,
                                    justifyContent: sidebarExpanded ? "flex-start" : "center",
                                    background: isActive ? "var(--surface-2)" : "transparent",
                                    color: isActive ? "var(--foreground)" : "var(--foreground-soft)",
                                    fontWeight: isActive ? 700 : 500,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                                }}
                            >
                                <div className="relative shrink-0">
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                                    {item.href === "/messages" && unreadMessages > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-black text-white px-[3px]"
                                            style={{ background: "var(--secondary)" }}>
                                            {unreadMessages > 9 ? "9+" : unreadMessages}
                                        </span>
                                    )}
                                </div>
                                {sidebarExpanded && (
                                    <span className="text-[14px] whitespace-nowrap overflow-hidden"
                                        style={{ opacity: sidebarExpanded ? 1 : 0, transition: "opacity 150ms" }}>
                                        {item.name}
                                    </span>
                                )}
                                {sidebarExpanded && item.href === "/messages" && unreadMessages > 0 && (
                                    <span className="ml-auto min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black text-white px-[4px] shrink-0"
                                        style={{ background: "var(--secondary)" }}>
                                        {unreadMessages > 9 ? "9+" : unreadMessages}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* 관리자 / 선생님 전용 메뉴 */}
                {(isAdmin || user.role === "teacher") && (
                    <div className="flex flex-col gap-0.5 shrink-0"
                        style={{ padding: sidebarExpanded ? "0 12px 8px" : "0 0 8px", alignItems: sidebarExpanded ? "stretch" : "center" }}>
                        {sidebarExpanded && (
                            <div className="px-3 py-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>관리</span>
                            </div>
                        )}
                        {[
                            { href: "/teacher",     icon: Shield,     label: "교사 대시보드" },
                            { href: "/class-guide", icon: PlayCircle, label: "수업 시뮬레이션" },
                            { href: isAdmin ? "/admin/dashboard" : "/admin", icon: Shield, label: "관리자 대시보드" },
                        ].map(item => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || (item.href.startsWith("/admin") && pathname.startsWith("/admin"));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={!sidebarExpanded ? item.label : undefined}
                                    className="flex items-center transition-all duration-150 rounded-xl"
                                    style={{
                                        gap: sidebarExpanded ? 14 : 0,
                                        padding: sidebarExpanded ? "10px 12px" : "10px",
                                        width: sidebarExpanded ? "100%" : 44,
                                        height: 44,
                                        justifyContent: sidebarExpanded ? "flex-start" : "center",
                                        background: isActive ? "var(--surface-2)" : "transparent",
                                        color: isActive ? "var(--foreground)" : "var(--foreground-soft)",
                                        fontWeight: isActive ? 700 : 500,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                                    }}
                                >
                                    <Icon size={22} className="shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
                                    {sidebarExpanded && (
                                        <span className="text-[14px] whitespace-nowrap">{item.label}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* 만들기 버튼 */}
                <div className="shrink-0" style={{ padding: sidebarExpanded ? "0 12px 8px" : "0 0 8px", display: "flex", justifyContent: sidebarExpanded ? "stretch" : "center" }}>
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        title={!sidebarExpanded ? "만들기" : undefined}
                        className="flex items-center transition-all duration-150 rounded-xl"
                        style={{
                            gap: sidebarExpanded ? 14 : 0,
                            padding: sidebarExpanded ? "10px 12px" : "10px",
                            width: sidebarExpanded ? "100%" : 44,
                            height: 44,
                            justifyContent: sidebarExpanded ? "flex-start" : "center",
                            color: "var(--foreground-soft)",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                        <div className="w-[26px] h-[26px] rounded-lg flex items-center justify-center shrink-0"
                            style={{ border: "1.5px solid var(--foreground-soft)" }}>
                            <Plus size={16} strokeWidth={2} />
                        </div>
                        {sidebarExpanded && <span className="text-[14px] whitespace-nowrap font-semibold">만들기</span>}
                    </button>
                </div>

                {/* 세션 초기화 */}
                {adminChecked && !isAdmin && !user.name && (
                    <div className="shrink-0" style={{ padding: sidebarExpanded ? "0 12px 8px" : "0 0 8px", display: "flex", justifyContent: sidebarExpanded ? "stretch" : "center" }}>
                        <button
                            onClick={handleLogout}
                            title={!sidebarExpanded ? "재로그인" : undefined}
                            className="flex items-center transition-all rounded-xl"
                            style={{
                                gap: sidebarExpanded ? 14 : 0,
                                padding: sidebarExpanded ? "10px 12px" : "10px",
                                width: sidebarExpanded ? "100%" : 44,
                                height: 44,
                                justifyContent: sidebarExpanded ? "flex-start" : "center",
                                color: "var(--foreground-muted)",
                            }}
                        >
                            <LogOut size={18} strokeWidth={1.8} className="shrink-0" />
                            {sidebarExpanded && <span className="text-[13px]">세션 초기화 / 재로그인</span>}
                        </button>
                    </div>
                )}

                {/* 사용자 정보 */}
                {(isAdmin || user.name) && (
                    <div className="shrink-0" style={{ borderTop: "1px solid var(--border)", padding: sidebarExpanded ? "12px 16px" : "12px 0", display: "flex", justifyContent: sidebarExpanded ? "stretch" : "center" }}>
                        {!adminChecked ? (
                            <div className="h-9 rounded-xl animate-pulse" style={{ background: "var(--surface-2)", width: sidebarExpanded ? "100%" : 36 }} />
                        ) : isAdmin ? (
                            <div className="flex items-center" style={{ gap: sidebarExpanded ? 12 : 0, width: sidebarExpanded ? "100%" : "auto" }}>
                                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>
                                    <Shield size={16} className="text-white" />
                                </div>
                                {sidebarExpanded && (
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[13px] font-bold" style={{ color: "#7C3AED" }}>관리자</span>
                                        <span className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>전체 접근 모드</span>
                                    </div>
                                )}
                                {sidebarExpanded && (
                                    <button onClick={handleAdminLogout}
                                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                        style={{ color: "var(--foreground-muted)" }}>
                                        <LogOut size={15} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{ width: sidebarExpanded ? "100%" : "auto" }}>
                                <div className="flex items-center" style={{ gap: sidebarExpanded ? 12 : 0, marginBottom: sidebarExpanded ? 10 : 0 }}>
                                    <div className="w-9 h-9 rounded-full p-[2px] shrink-0"
                                        style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}>
                                        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-[12px] font-bold text-white"
                                            style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}>
                                            {user.avatar?.startsWith("http") ? (
                                                <img src={user.avatar} alt={user.name} className="w-full h-full object-contain rounded-full" />
                                            ) : user.avatar ? (
                                                <span className="text-base leading-none">{user.avatar}</span>
                                            ) : (
                                                <span>{user.name ? user.name[0].toUpperCase() : "?"}</span>
                                            )}
                                        </div>
                                    </div>
                                    {sidebarExpanded && (
                                        <>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                                                    {user.name || "로딩 중..."}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <Star size={9} style={{ color: "var(--highlight)" }} fill="var(--highlight)" />
                                                    <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                                        Lv.{level} · {user.rank}
                                                    </span>
                                                </div>
                                            </div>
                                            <button onClick={handleLogout}
                                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                                                style={{ color: "var(--foreground-muted)" }}>
                                                <LogOut size={15} />
                                            </button>
                                        </>
                                    )}
                                </div>
                                {sidebarExpanded && (
                                    <>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>경험치 (XP)</span>
                                            <span className="text-[10px] font-bold" style={{ color: "var(--secondary)" }}>{xpProgress} / 100</span>
                                        </div>
                                        <div className="progress-track">
                                            <div className="progress-fill progress-xp" style={{ width: `${xpProgress}%` }} />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

            </aside>
        </>
    );
}
