"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    GraduationCap,
    Play,
    Upload,
    Star,
    Zap,
    Target,
    ChevronRight,
    Clock,
    Users,
    Lightbulb,
    MessageCircle,
    PenSquare,
} from "lucide-react";
import { CURRICULUM, type Session, type Activity } from "@/lib/curriculum/sessions";

/* ─── 앱 기능 메타데이터 ─── */
type AppFeatureKey =
    | "onboarding" | "feed" | "upload" | "ai_coach" | "learn"
    | "missions" | "insights" | "shop" | "profile" | "session_hub" | "teacher";

const APP_FEATURES: Record<AppFeatureKey, { label: string; color: string; bg: string; emoji: string; page: string }> = {
    onboarding:   { label: "온보딩 셋업",   color: "#FF6B35", bg: "#FFF0EB", emoji: "🚀", page: "/" },
    feed:         { label: "팀 피드",        color: "#4361EE", bg: "#EEF1FD", emoji: "📱", page: "/feed" },
    upload:       { label: "콘텐츠 업로드", color: "#FF6B35", bg: "#FFF0EB", emoji: "📤", page: "/feed" },
    ai_coach:     { label: "AI 코치 피드백", color: "#8B5CF6", bg: "#F3EEFF", emoji: "🤖", page: "/feed" },
    learn:        { label: "학습 자료",       color: "#06D6A0", bg: "#E6FBF5", emoji: "📚", page: "/learn" },
    missions:     { label: "미션 센터",       color: "#D97706", bg: "#FFF8E0", emoji: "🏆", page: "/missions" },
    insights:     { label: "인사이트 패널",  color: "#4361EE", bg: "#EEF1FD", emoji: "📊", page: "/feed" },
    shop:         { label: "셀러샵",          color: "#FF6B35", bg: "#FFF0EB", emoji: "🛍️", page: "/shop" },
    profile:      { label: "프로필 & XP",    color: "#06D6A0", bg: "#E6FBF5", emoji: "⭐", page: "/profile" },
    session_hub:  { label: "오늘의 수업",    color: "#4361EE", bg: "#EEF1FD", emoji: "📅", page: "/session" },
    teacher:      { label: "교사 대시보드",  color: "#7C3AED", bg: "#F3EEFF", emoji: "🎓", page: "/teacher" },
};

/* ─── 활동 타입별 기본 앱 기능 매핑 ─── */
const TYPE_FEATURE_MAP: Record<Activity["type"], AppFeatureKey[]> = {
    warmup:   ["feed", "session_hub"],
    learn:    ["learn", "ai_coach"],
    practice: ["upload", "ai_coach", "feed"],
    present:  ["feed", "insights"],
    wrap:     ["profile", "missions"],
};

/* ─── 키워드 기반 추가 기능 추론 ─── */
function inferFeatures(activity: Activity, session: Session): AppFeatureKey[] {
    const combined = `${activity.title} ${activity.desc} ${session.keywords.join(" ")}`.toLowerCase();
    const extra: AppFeatureKey[] = [];
    if (combined.includes("온보딩") || combined.includes("셋업") || combined.includes("팀 코드")) extra.push("onboarding");
    if (combined.includes("ai") || combined.includes("chatgpt") || combined.includes("claude") || combined.includes("canva")) extra.push("ai_coach", "learn");
    if (combined.includes("업로드") || combined.includes("게시물")) extra.push("upload");
    if (combined.includes("데이터") || combined.includes("인사이트") || combined.includes("roas") || combined.includes("분석")) extra.push("insights");
    if (combined.includes("미션") || combined.includes("xp") || combined.includes("포인트")) extra.push("missions");
    if (combined.includes("상점") || combined.includes("쇼핑") || combined.includes("예산")) extra.push("shop");
    if (combined.includes("프로필") || combined.includes("레벨") || combined.includes("성장")) extra.push("profile");
    if (combined.includes("수업") || combined.includes("커리큘럼")) extra.push("session_hub");
    const base = TYPE_FEATURE_MAP[activity.type];
    return [...new Set([...base, ...extra])].slice(0, 4);
}

/* ─── 테마 스타일 ─── */
const THEME_META: Record<Session["theme"], { label: string; color: string; bg: string }> = {
    intro:    { label: "입문",     color: "#FF6B35", bg: "#FFF0EB" },
    concept:  { label: "개념",     color: "#4361EE", bg: "#EEF1FD" },
    skill:    { label: "스킬",     color: "#8B5CF6", bg: "#F3EEFF" },
    campaign: { label: "캠페인",   color: "#D97706", bg: "#FFF8E0" },
    review:   { label: "리뷰",     color: "#06D6A0", bg: "#E6FBF5" },
    advanced: { label: "심화",     color: "#EF4444", bg: "#FEF2F2" },
    project:  { label: "프로젝트", color: "#0EA5E9", bg: "#E0F2FE" },
};

const ACTIVITY_TYPE_META: Record<Activity["type"], { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }> }> = {
    warmup:   { label: "도입",  color: "#FF6B35", icon: Zap },
    learn:    { label: "학습",  color: "#4361EE", icon: BookOpen },
    practice: { label: "실습",  color: "#8B5CF6", icon: PenSquare },
    present:  { label: "발표",  color: "#D97706", icon: Users },
    wrap:     { label: "마무리", color: "#06D6A0", icon: Star },
};

function AppFeatureBadge({ featureKey }: { featureKey: AppFeatureKey }) {
    const f = APP_FEATURES[featureKey];
    return (
        <Link
            href={f.page}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80"
            style={{ background: f.bg, color: f.color }}
        >
            <span>{f.emoji}</span>
            <span>{f.label}</span>
        </Link>
    );
}

function ActivityCard({ activity, session, index, total }: {
    activity: Activity;
    session: Session;
    index: number;
    total: number;
}) {
    const typeMeta = ACTIVITY_TYPE_META[activity.type];
    const TypeIcon = typeMeta.icon;
    const features = inferFeatures(activity, session);

    return (
        <div className="relative pl-10">
            {/* 타임라인 선 */}
            {index < total - 1 && (
                <div
                    className="absolute left-4 top-10 bottom-0 w-px"
                    style={{ background: "var(--border)" }}
                />
            )}
            {/* 타임라인 아이콘 */}
            <div
                className="absolute left-0 top-4 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: typeMeta.color + "22", border: `2px solid ${typeMeta.color}` }}
            >
                <TypeIcon size={14} style={{ color: typeMeta.color }} />
            </div>

            <div
                className="mb-4 p-4 rounded-2xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                {/* 헤더 */}
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: typeMeta.color + "20", color: typeMeta.color }}
                            >
                                {typeMeta.label}
                            </span>
                            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--foreground-muted)" }}>
                                <Clock size={11} />
                                <span>{activity.time}</span>
                            </div>
                        </div>
                        <h3 className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                            {activity.title}
                        </h3>
                    </div>
                </div>

                {/* 설명 */}
                <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--foreground-soft)" }}>
                    {activity.desc}
                </p>

                {/* 앱 기능 배지 */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className="text-[10px] font-bold" style={{ color: "var(--foreground-muted)" }}>앱 활용:</span>
                    {features.map((k) => <AppFeatureBadge key={k} featureKey={k} />)}
                </div>

                {/* 선생님 팁 */}
                {activity.tip && (
                    <div
                        className="flex items-start gap-2 mt-2 p-2.5 rounded-xl"
                        style={{ background: "var(--highlight-light)" }}
                    >
                        <Lightbulb size={12} style={{ color: "#D97706" }} className="shrink-0 mt-0.5" />
                        <p className="text-xs leading-relaxed" style={{ color: "#92400E" }}>
                            <strong>선생님 팁:</strong> {activity.tip}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function SessionDetail({ session }: { session: Session }) {
    const theme = THEME_META[session.theme];
    const difficulty = ["", "★☆☆ 쉬움", "★★☆ 보통", "★★★ 어려움"][session.difficultyLevel];

    /* 이 회차에서 사용하는 앱 기능 전체 추출 */
    const allFeatures = [...new Set(
        session.activities.flatMap((a) => inferFeatures(a, session))
    )];

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
            {/* 세션 헤더 */}
            <div
                className="px-5 py-4"
                style={{ background: theme.bg, borderBottom: `2px solid ${theme.color}33` }}
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                                className="text-xs font-black px-2.5 py-1 rounded-full"
                                style={{ background: theme.color, color: "white" }}
                            >
                                {session.week}회차
                            </span>
                            <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: theme.color + "22", color: theme.color }}
                            >
                                {theme.label}
                            </span>
                            <span className="text-xs" style={{ color: theme.color + "CC" }}>
                                {difficulty}
                            </span>
                            {session.aiTool && (
                                <span
                                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: "#F3EEFF", color: "#7C3AED" }}
                                >
                                    🤖 {session.aiTool}
                                </span>
                            )}
                        </div>
                        <h2 className="text-lg font-black mb-0.5" style={{ color: "var(--foreground)" }}>
                            {session.title}
                        </h2>
                        <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>
                            {session.subtitle}
                        </p>
                    </div>
                </div>

                {/* 목표 */}
                <div className="mt-3 flex flex-col gap-1">
                    {session.goals.map((g, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <Target size={12} className="shrink-0 mt-0.5" style={{ color: theme.color }} />
                            <span className="text-xs leading-relaxed" style={{ color: "var(--foreground-soft)" }}>{g}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 이 회차 사용 앱 기능 요약 */}
            <div
                className="px-5 py-3 flex items-center gap-2 flex-wrap"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}
            >
                <span className="text-xs font-black" style={{ color: "var(--foreground-muted)" }}>
                    이번 수업 앱 화면:
                </span>
                {allFeatures.map((k) => <AppFeatureBadge key={k} featureKey={k} />)}
            </div>

            {/* 활동 타임라인 */}
            <div className="px-5 py-5">
                <p className="text-xs font-black mb-4" style={{ color: "var(--foreground-muted)" }}>
                    수업 흐름 및 앱 활용 가이드
                </p>
                {session.activities.map((activity, i) => (
                    <ActivityCard
                        key={i}
                        activity={activity}
                        session={session}
                        index={i}
                        total={session.activities.length}
                    />
                ))}
            </div>

            {/* 키워드 */}
            <div className="px-5 pb-5 flex flex-wrap gap-2">
                {session.keywords.map((kw) => (
                    <span
                        key={kw}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}
                    >
                        #{kw}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ── 세션 선택 카드 (소형) ── */
function SessionPickerCard({
    session,
    isSelected,
    onClick,
}: {
    session: Session;
    isSelected: boolean;
    onClick: () => void;
}) {
    const theme = THEME_META[session.theme];
    return (
        <button
            onClick={onClick}
            className="w-full text-left p-3 rounded-xl transition-all"
            style={{
                background: isSelected ? theme.bg : "var(--surface)",
                border: isSelected ? `2px solid ${theme.color}` : "1px solid var(--border)",
            }}
        >
            <div className="flex items-center gap-2 mb-1">
                <span
                    className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
                    style={{ background: theme.color, color: "white" }}
                >
                    {session.week}회
                </span>
                <span
                    className="text-[10px] font-bold"
                    style={{ color: theme.color }}
                >
                    {theme.label}
                </span>
            </div>
            <p className="text-xs font-bold leading-snug" style={{ color: "var(--foreground)" }}>
                {session.title}
            </p>
            {session.aiTool && (
                <p className="text-[10px] mt-1" style={{ color: "#7C3AED" }}>🤖 {session.aiTool.split("/")[0].trim()}</p>
            )}
        </button>
    );
}


/* ── 메인 페이지 ── */
export default function ClassGuidePage() {
    const router = useRouter();
    const [selectedWeek, setSelectedWeek] = useState<number>(1);
    const [activeSemester, setActiveSemester] = useState<1 | 2>(1);
    const [authorized, setAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        // 관리자 쿠키 확인
        fetch("/api/auth/admin-check")
            .then((r) => r.json())
            .then(({ isAdmin }) => {
                if (isAdmin) { setAuthorized(true); return; }
                // 교사 role 확인
                const { useGameStore } = require("@/store/useGameStore");
                const role = useGameStore.getState().user.role;
                if (role === "teacher") { setAuthorized(true); return; }
                router.replace("/feed");
            })
            .catch(() => router.replace("/feed"));
    }, [router]);

    if (authorized === null) return null;

    const semester1 = CURRICULUM.filter((s) => s.semester === 1);
    const semester2 = CURRICULUM.filter((s) => s.semester === 2);
    const currentList = activeSemester === 1 ? semester1 : semester2;
    const selectedSession = CURRICULUM.find((s) => s.week === selectedWeek)!;

    return (
        <div className="px-4 pt-6 pb-24 max-w-6xl mx-auto">
            {/* ── 헤더 ── */}
            <div className="flex items-center gap-3 mb-6">
                <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--secondary-light)" }}
                >
                    <GraduationCap size={22} style={{ color: "var(--secondary)" }} />
                </div>
                <div>
                    <h1 className="text-2xl font-black font-outfit" style={{ color: "var(--foreground)" }}>
                        수업 시뮬레이션 가이드
                    </h1>
                    <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>
                        29회차 수업에서 셀스타그램을 어떻게 활용하는지 차시별로 확인하세요
                    </p>
                </div>
            </div>

            {/* ── 통계 카드 ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { icon: GraduationCap, label: "총 수업 회차", value: "29회", color: "var(--secondary)" },
                    { icon: Clock,         label: "총 수업 시간", value: "58시간", color: "var(--primary)" },
                    { icon: Upload,        label: "예상 업로드", value: "29회+", color: "#8B5CF6" },
                    { icon: Star,          label: "최대 XP", value: "1,000+", color: "var(--highlight)" },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div
                        key={label}
                        className="p-4 rounded-2xl"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        <Icon size={18} style={{ color }} className="mb-2" />
                        <p className="text-xl font-black" style={{ color: "var(--foreground)" }}>{value}</p>
                        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{label}</p>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* ── 왼쪽: 세션 선택 ── */}
                <div className="md:col-span-1">
                    {/* 학기 탭 */}
                    <div
                        className="flex gap-1 p-1 rounded-xl mb-3"
                        style={{ background: "var(--surface-2)" }}
                    >
                        {([1, 2] as const).map((sem) => (
                            <button
                                key={sem}
                                onClick={() => {
                                    setActiveSemester(sem);
                                    const first = CURRICULUM.find((s) => s.semester === sem);
                                    if (first) setSelectedWeek(first.week);
                                }}
                                className="flex-1 py-2 rounded-lg font-bold text-xs transition-all"
                                style={{
                                    background: activeSemester === sem ? "var(--surface)" : "transparent",
                                    color: activeSemester === sem ? "var(--foreground)" : "var(--foreground-muted)",
                                }}
                            >
                                {sem}학기 ({sem === 1 ? "15" : "14"}회차)
                            </button>
                        ))}
                    </div>

                    {/* 세션 카드 목록 */}
                    <div className="flex flex-col gap-2" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                        {currentList.map((session) => (
                            <SessionPickerCard
                                key={session.week}
                                session={session}
                                isSelected={selectedWeek === session.week}
                                onClick={() => setSelectedWeek(session.week)}
                            />
                        ))}
                    </div>
                </div>

                {/* ── 오른쪽: 세션 상세 + 앱 기능 맵 ── */}
                <div className="md:col-span-2 flex flex-col gap-5">
                    <SessionDetail session={selectedSession} />

                    {/* 실제 수업 바로가기 */}
                    <div
                        className="p-5 rounded-2xl"
                        style={{ background: "linear-gradient(135deg, var(--secondary), #4F46E5)" }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Play size={18} className="text-white" />
                            <p className="font-black text-base text-white">지금 바로 수업 시작하기</p>
                        </div>
                        <p className="text-sm text-white/80 mb-4">
                            {selectedSession.week}회차 수업 준비가 됐나요? 셀스타그램에서 바로 시작해보세요!
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            <Link
                                href="/session"
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-xl font-bold text-sm transition-all hover:bg-white/90"
                                style={{ color: "var(--secondary)" }}
                            >
                                <GraduationCap size={14} />
                                오늘의 수업 확인
                            </Link>
                            <Link
                                href="/learn"
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 rounded-xl font-bold text-sm text-white transition-all hover:bg-white/30"
                            >
                                <BookOpen size={14} />
                                학습 자료 열기
                            </Link>
                            <Link
                                href="/feed"
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 rounded-xl font-bold text-sm text-white transition-all hover:bg-white/30"
                            >
                                <MessageCircle size={14} />
                                팀 피드 가기
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
