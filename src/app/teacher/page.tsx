"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    RotateCcw,
    Trophy,
    Users,
    BarChart2,
    Eye,
    EyeOff,
    Megaphone,
    CheckCircle2,
    XCircle,
    Sparkles,
    Clock,
    TrendingUp,
    Zap,
    ArrowLeft,
    Shield,
    ToggleLeft,
    ToggleRight,
    MessageSquare,
    Plus,
    Trash2,
    X,
    Loader2,
    ChevronUp,
    ChevronDown,
    Pencil,
    Image as ImageIcon,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { getSessionByWeek, THEME_COLORS } from "@/lib/curriculum/sessions";
import { supabase, DbPost, DbProfile, DbMission } from "@/lib/supabase/client";


const TEAM_META: Record<string, { emoji: string; color: string }> = {
    "A팀": { emoji: "🔥", color: "#FF6B35" },
    "B팀": { emoji: "⚡", color: "#4361EE" },
    "C팀": { emoji: "🌊", color: "#06D6A0" },
    "D팀": { emoji: "🌿", color: "#8B5CF6" },
    "E팀": { emoji: "🦁", color: "#FFC233" },
    "F팀": { emoji: "🚀", color: "#EF4444" },
};

interface TeamStat {
    id: string;
    name: string;
    emoji: string;
    color: string;
    members: number;
    posts: number;
    score: number;
}

interface StudentProfile {
    id: string;
    name: string;
    handle: string;
    team: string | null;
    points: number;
    avatar_type?: string;
}

type Tab = "class" | "feed" | "mission" | "shop";

/* ─────────────────── PIN 화면 ─────────────────── */
function PinScreen({ onAuth }: { onAuth: () => void }) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);

    const handleDigit = (d: string) => {
        if (pin.length >= 4) return;
        const next = pin + d;
        setPin(next);
        setError(false);
        if (next.length === 4) {
            setTimeout(async () => {
                const res = await fetch("/api/auth/verify-teacher-pin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pin: next }),
                });
                if (res.ok) {
                    localStorage.setItem("sellstagram_teacher_auth", "true");
                    onAuth();
                } else {
                    setError(true);
                    setShake(true);
                    setTimeout(() => { setPin(""); setShake(false); }, 600);
                }
            }, 200);
        }
    };

    const handleDelete = () => setPin((p) => p.slice(0, -1));

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: "var(--background)" }}>
            <div className="w-full max-w-xs flex flex-col items-center gap-8">
                {/* 로고 */}
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, var(--secondary), #6B5CE7)" }}>
                        <Shield size={32} className="text-white" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-black font-outfit" style={{ color: "var(--foreground)" }}>
                            교사 대시보드
                        </h1>
                        <p className="text-sm mt-1" style={{ color: "var(--foreground-soft)" }}>
                            PIN 번호를 입력하세요
                        </p>
                    </div>
                </div>

                {/* PIN 표시 */}
                <div
                    className={`flex gap-4 transition-all ${shake ? "animate-bounce" : ""}`}
                >
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i}
                            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                            style={{
                                background: pin.length > i
                                    ? (error ? "#FEF2F2" : "var(--secondary-light)")
                                    : "var(--surface-2)",
                                border: pin.length > i
                                    ? `2px solid ${error ? "#EF4444" : "var(--secondary)"}`
                                    : "2px solid var(--border)",
                            }}
                        >
                            {pin.length > i && (
                                <div className="w-3 h-3 rounded-full"
                                    style={{ background: error ? "#EF4444" : "var(--secondary)" }} />
                            )}
                        </div>
                    ))}
                </div>

                {error && (
                    <p className="text-sm font-bold" style={{ color: "#EF4444" }}>
                        PIN이 틀렸어요. 다시 시도하세요.
                    </p>
                )}

                {/* 숫자 키패드 */}
                <div className="grid grid-cols-3 gap-3 w-full">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((d, i) => (
                        <button
                            key={i}
                            onClick={() => d === "⌫" ? handleDelete() : d && handleDigit(d)}
                            disabled={!d && d !== "0"}
                            className="h-16 rounded-2xl font-bold text-xl transition-all hover:scale-105 active:scale-95 disabled:invisible"
                            style={{
                                background: d === "⌫" ? "var(--surface-2)" : "var(--surface)",
                                color: "var(--foreground)",
                                border: "1px solid var(--border)",
                                boxShadow: "var(--shadow-sm)",
                            }}
                        >
                            {d}
                        </button>
                    ))}
                </div>

                <p className="text-xs text-center" style={{ color: "var(--foreground-muted)" }}>
                    PIN 번호를 잊으셨나요? 관리자에게 문의하세요
                </p>

                <Link href="/" className="text-sm font-semibold flex items-center gap-1"
                    style={{ color: "var(--foreground-muted)" }}>
                    <ArrowLeft size={14} /> 학생 화면으로 돌아가기
                </Link>
            </div>
        </div>
    );
}

/* ─────────────────── 메인 대시보드 ─────────────────── */
function Dashboard({ onLogout }: { onLogout: () => void }) {
    const {
        week, posts, missions, campaigns,
        nextWeek, prevWeek, setWeek,
        toggleMissionActive, resetPosts,
        addMission, deleteMission, setMissions,
    } = useGameStore();

    const [activeTab, setActiveTab] = useState<Tab>("class");
    const [classActive, setClassActive] = useState(false);
    const [classActiveLoading, setClassActiveLoading] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [initialBalance, setInitialBalance] = useState(1000000);
    const [balanceInput, setBalanceInput] = useState("1000000");
    const [isSavingBalance, setIsSavingBalance] = useState(false);
    const [balanceSaved, setBalanceSaved] = useState(false);
    const [highlightedPost, setHighlightedPost] = useState<string | null>(null);
    const [teamStats, setTeamStats] = useState<TeamStat[]>([]);
    const [isLoadingTeams, setIsLoadingTeams] = useState(true);

    // 미션 CRUD 상태
    const [showCreateMission, setShowCreateMission] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newReward, setNewReward] = useState(10);
    const [newType, setNewType] = useState<"posts" | "revenue" | "engagement" | "likes">("posts");
    const [newTarget, setNewTarget] = useState(1);
    const [isSavingMission, setIsSavingMission] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // 학생 팀 배정 상태
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);
    const [updatingTeamId, setUpdatingTeamId] = useState<string | null>(null);

    // Supabase: 팀 현황 로드 (profiles + posts)
    const loadTeamStats = async () => {
        setIsLoadingTeams(true);
        const { data: profiles } = await supabase.from("profiles").select("team, points");
        const { data: dbPosts } = await supabase.from("posts").select("user_handle, user_name");

        if (profiles) {
            const teamMap: Record<string, TeamStat> = {};
            profiles.forEach((p: Pick<DbProfile, "team" | "points">) => {
                const team = p.team || "A팀";
                if (!teamMap[team]) {
                    const meta = TEAM_META[team] ?? { emoji: "👥", color: "#9CA3AF" };
                    teamMap[team] = { id: team, name: team, emoji: meta.emoji, color: meta.color, members: 0, posts: 0, score: 0 };
                }
                teamMap[team].members += 1;
                teamMap[team].score += p.points ?? 0;
            });

            if (dbPosts) {
                // 팀별 게시물 수를 profiles 테이블과 조인으로 계산
                const handleToTeam: Record<string, string> = {};
                profiles.forEach((p: any) => { if (p.handle) handleToTeam[p.handle] = p.team; });
                dbPosts.forEach((post: Pick<DbPost, "user_handle" | "user_name">) => {
                    const team = handleToTeam[post.user_handle] || "A팀";
                    if (teamMap[team]) teamMap[team].posts += 1;
                });
            }

            setTeamStats(Object.values(teamMap));
        }
        setIsLoadingTeams(false);
    };

    // Supabase: 미션 목록 로드
    const loadMissionsFromDB = async () => {
        const { data } = await supabase.from("missions").select("*").order("created_at", { ascending: true });
        if (data && data.length > 0) {
            setMissions(data.map((m: DbMission) => ({
                id: m.id,
                title: m.title,
                description: m.description,
                type: ((m as any).mission_type ?? "revenue") as "revenue" | "posts" | "engagement" | "likes",
                targetRevenue: m.target_revenue,
                targetCount: (m as any).target_count ?? undefined,
                reward: m.reward,
                isCompleted: false,
                isActive: m.is_active,
            })));
        }
    };

    // 미션 생성
    const handleCreateMission = async () => {
        if (!newTitle.trim()) return;
        setIsSavingMission(true);
        const { data, error } = await supabase.from("missions").insert({
            title: newTitle.trim(),
            description: newDesc.trim(),
            target_revenue: newType === "revenue" || newType === "likes" ? newTarget : 0,
            target_count: newType === "posts" || newType === "engagement" ? newTarget : null,
            mission_type: newType,
            reward: newReward,
            is_active: true,
        }).select().single();

        if (!error && data) {
            addMission({
                id: data.id,
                title: data.title,
                description: data.description,
                type: (data.mission_type ?? "revenue") as "revenue" | "posts" | "engagement" | "likes",
                targetRevenue: data.target_revenue,
                targetCount: data.target_count ?? undefined,
                reward: data.reward,
                isCompleted: false,
                isActive: data.is_active,
            });
        }
        setNewTitle(""); setNewDesc(""); setNewReward(10);
        setShowCreateMission(false);
        setIsSavingMission(false);
    };

    // 미션 삭제
    const handleDeleteMission = async (missionId: string) => {
        setDeletingId(missionId);
        await supabase.from("missions").delete().eq("id", missionId);
        deleteMission(missionId);
        setDeletingId(null);
    };

    // Supabase: 학생 목록 로드
    const loadStudents = async () => {
        setIsLoadingStudents(true);
        const { data } = await supabase
            .from("profiles")
            .select("id, name, handle, team, points, avatar_type")
            .order("name");
        if (data) setStudents(data);
        setIsLoadingStudents(false);
    };

    // Supabase: 팀 배정 업데이트
    const handleUpdateTeam = async (studentId: string, newTeam: string) => {
        setUpdatingTeamId(studentId);
        await supabase.from("profiles").update({ team: newTeam }).eq("id", studentId);
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, team: newTeam } : s));
        setUpdatingTeamId(null);
        loadTeamStats();
    };

    // Supabase: 주차 변경 동기화
    const syncWeek = async (newWeek: number) => {
        await supabase.from("game_state").update({ week: newWeek, updated_at: new Date().toISOString() }).eq("id", 1);
    };

    const handlePrevWeek = () => { prevWeek(); syncWeek(Math.max(1, week - 1)); };
    const handleNextWeek = () => { nextWeek(); syncWeek(Math.min(29, week + 1)); };
    const handleSetWeek = (w: number) => { setWeek(w); syncWeek(w); };

    // Supabase: 미션 토글 동기화
    const handleToggleMission = async (missionId: string) => {
        const mission = missions.find(m => m.id === missionId);
        if (!mission) return;
        toggleMissionActive(missionId);
        await supabase.from("missions").update({ is_active: !mission.isActive }).eq("id", missionId);
    };

    // Supabase: 게시물 강조 동기화
    const handleHighlight = async (postId: string, highlighted: boolean) => {
        setHighlightedPost(highlighted ? postId : null);
        await supabase.from("posts").update({ highlighted }).eq("id", postId);
    };

    // Supabase: 피드 초기화
    const handleResetPosts = async () => {
        resetPosts();
        await supabase.from("posts").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // 전체 삭제
        setShowResetConfirm(false);
    };

    // 초기 잔액 저장 + 전체 학생 잔액 일괄 업데이트
    const handleSaveBalance = async () => {
        const parsed = parseInt(balanceInput.replace(/,/g, ""), 10);
        if (isNaN(parsed) || parsed < 0) return;
        setIsSavingBalance(true);
        // game_state에 initial_balance 저장
        await supabase.from("game_state").update({ initial_balance: parsed }).eq("id", 1);
        // 모든 학생 profiles의 balance를 새 금액으로 리셋
        await supabase.from("profiles").update({ balance: parsed }).neq("id", "00000000-0000-0000-0000-000000000000");
        setInitialBalance(parsed);
        setIsSavingBalance(false);
        setBalanceSaved(true);
        setTimeout(() => setBalanceSaved(false), 2500);
    };

    // 수업 상태 토글 (Supabase 저장)
    const handleClassToggle = async () => {
        setClassActiveLoading(true);
        const next = !classActive;
        const { error } = await supabase
            .from("app_settings")
            .update({ class_active: next, updated_at: new Date().toISOString() })
            .eq("id", 1);
        if (!error) setClassActive(next);
        setClassActiveLoading(false);
    };

    useEffect(() => {
        loadTeamStats();
        loadStudents();
        loadMissionsFromDB();

        // 수업 상태 로드
        supabase.from("app_settings").select("class_active").eq("id", 1).single()
            .then(({ data }) => { if (data) setClassActive(data.class_active); });

        // 초기 잔액 로드
        supabase.from("game_state").select("initial_balance").eq("id", 1).single()
            .then(({ data }) => {
                if (data?.initial_balance != null) {
                    setInitialBalance(data.initial_balance);
                    setBalanceInput(String(data.initial_balance));
                }
            });

        // 새 게시물이 업로드되면 팀 통계 갱신
        const ch = supabase.channel("teacher-posts")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => loadTeamStats())
            .subscribe();

        return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const session = getSessionByWeek(week);
    const themeStyle = session ? THEME_COLORS[session.theme] : THEME_COLORS.intro;

    const totalRevenue = campaigns.reduce((acc, c) => acc + c.revenue, 0);
    const totalPosts = posts.length;
    const activeMissions = missions.filter((m) => m.isActive).length;
    const completedMissions = missions.filter((m) => m.isCompleted).length;

    const tabs: { id: Tab; label: string; emoji: string }[] = [
        { id: "class", label: "수업 현황", emoji: "🎓" },
        { id: "feed", label: "피드 모니터링", emoji: "📱" },
        { id: "mission", label: "미션 관리", emoji: "🏆" },
        { id: "shop", label: "상품 관리", emoji: "🛍️" },
    ];

    return (
        <div className="min-h-screen" style={{ background: "var(--background)" }}>

            {/* ── 상단 헤더 ── */}
            <header
                className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
                style={{
                    background: "var(--surface)",
                    borderBottom: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, var(--secondary), #6B5CE7)" }}>
                        <Shield size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-black" style={{ color: "var(--foreground)" }}>
                            교사 대시보드
                        </h1>
                        <p className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                            Sellstagram · 교사 전용
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* 수업 상태 */}
                    <button
                        onClick={handleClassToggle}
                        disabled={classActiveLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                        style={{
                            background: classActive ? "var(--accent-light)" : "var(--surface-2)",
                            color: classActive ? "var(--accent)" : "var(--foreground-muted)",
                            border: classActive ? "1.5px solid var(--accent)" : "1.5px solid transparent",
                        }}
                    >
                        {classActive ? <Play size={14} /> : <Pause size={14} />}
                        {classActiveLoading ? "저장 중..." : classActive ? "수업 중" : "수업 종료"}
                    </button>

                    <button
                        onClick={onLogout}
                        className="text-sm font-bold px-3 py-2 rounded-xl transition-all hover:opacity-80"
                        style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}
                    >
                        로그아웃
                    </button>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">

                {/* ── 수업 회차 컨트롤 (항상 보임) ── */}
                <div
                    className="rounded-2xl p-5"
                    style={{
                        background: `linear-gradient(135deg, ${themeStyle.color}18, ${themeStyle.color}08)`,
                        border: `1.5px solid ${themeStyle.color}44`,
                    }}
                >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        {/* 회차 정보 */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                    style={{ background: themeStyle.bg, color: themeStyle.color }}>
                                    {session?.semester}학기
                                </span>
                                {classActive && (
                                    <span className="flex items-center gap-1 text-xs font-bold"
                                        style={{ color: "var(--accent)" }}>
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
                                        수업 진행 중
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-black font-outfit" style={{ color: "var(--foreground)" }}>
                                {week}회차 · {session?.title}
                            </h2>
                            <p className="text-sm mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                                {session?.subtitle}
                            </p>
                        </div>

                        {/* 회차 조절 */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevWeek}
                                disabled={week <= 1}
                                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                            >
                                <ChevronLeft size={20} style={{ color: "var(--foreground)" }} />
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(29, 29) }, (_, i) => i + 1)
                                    .filter((w) => Math.abs(w - week) <= 2)
                                    .map((w) => (
                                        <button
                                            key={w}
                                            onClick={() => handleSetWeek(w)}
                                            className="w-10 h-11 rounded-xl font-bold text-sm transition-all"
                                            style={{
                                                background: w === week ? themeStyle.color : "var(--surface)",
                                                color: w === week ? "white" : "var(--foreground-soft)",
                                                border: w === week ? "none" : "1px solid var(--border)",
                                            }}
                                        >
                                            {w}
                                        </button>
                                    ))}
                            </div>

                            <button
                                onClick={handleNextWeek}
                                disabled={week >= 29}
                                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                            >
                                <ChevronRight size={20} style={{ color: "var(--foreground)" }} />
                            </button>
                        </div>
                    </div>

                    {/* 오늘 수업 활동 미리보기 */}
                    {session && (
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                            {session.activities.map((act, i) => (
                                <div key={i}
                                    className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                    <span className="text-base">
                                        {act.type === "warmup" ? "🔥" :
                                         act.type === "learn" ? "📖" :
                                         act.type === "practice" ? "✏️" :
                                         act.type === "present" ? "🎤" : "✅"}
                                    </span>
                                    <div>
                                        <p className="font-bold text-xs" style={{ color: "var(--foreground)" }}>{act.time}</p>
                                        <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>{act.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── 요약 스탯 카드 ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "전체 게시물", value: totalPosts, icon: <Megaphone size={18} />, color: "var(--primary)", bg: "var(--primary-light)" },
                        { label: "활성 팀", value: `${teamStats.filter(t => t.posts > 0).length}팀`, icon: <Users size={18} />, color: "var(--secondary)", bg: "var(--secondary-light)" },
                        { label: "미션 완료", value: `${completedMissions}/${missions.length}`, icon: <Trophy size={18} />, color: "var(--accent)", bg: "var(--accent-light)" },
                        { label: "총 시뮬 매출", value: `₩${(totalRevenue / 10000).toFixed(0)}만`, icon: <TrendingUp size={18} />, color: "#D97706", bg: "var(--highlight-light)" },
                    ].map((stat) => (
                        <div key={stat.label}
                            className="rounded-2xl p-4 flex flex-col gap-2"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: stat.bg, color: stat.color }}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-2xl font-black" style={{ color: "var(--foreground)" }}>
                                    {stat.value}
                                </p>
                                <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── 탭 ── */}
                <div className="flex gap-2 p-1.5 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                            style={{
                                background: activeTab === tab.id ? "var(--surface)" : "transparent",
                                color: activeTab === tab.id ? "var(--foreground)" : "var(--foreground-muted)",
                                boxShadow: activeTab === tab.id ? "var(--shadow-sm)" : "none",
                            }}>
                            <span className="text-base">{tab.emoji}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* ══════════ TAB 1: 수업 현황 ══════════ */}
                {activeTab === "class" && (
                    <div className="flex flex-col gap-4">

                        {/* 초기 잔액 설정 */}
                        <div className="rounded-2xl p-5"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="text-base font-black" style={{ color: "var(--foreground)" }}>
                                        학생 초기 잔액 설정
                                    </h3>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                        현재 설정: ₩{initialBalance.toLocaleString()} · 저장 시 전체 학생 잔액이 이 금액으로 리셋됩니다
                                    </p>
                                </div>
                                {balanceSaved && (
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                                        ✓ 저장됨
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                                        style={{ color: "var(--foreground-muted)" }}>₩</span>
                                    <input
                                        type="number"
                                        value={balanceInput}
                                        onChange={(e) => setBalanceInput(e.target.value)}
                                        min={0}
                                        step={100000}
                                        className="w-full pl-7 pr-4 py-2.5 rounded-xl text-sm font-bold outline-none"
                                        style={{
                                            background: "var(--surface-2)",
                                            border: "1px solid var(--border)",
                                            color: "var(--foreground)",
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={handleSaveBalance}
                                    disabled={isSavingBalance}
                                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
                                    style={{ background: "var(--secondary)" }}
                                >
                                    {isSavingBalance ? "저장 중..." : "전체 적용"}
                                </button>
                            </div>
                        </div>

                        {/* 팀 리더보드 */}
                        <div className="rounded-2xl overflow-hidden"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <div className="px-5 py-4 flex items-center justify-between"
                                style={{ borderBottom: "1px solid var(--border)" }}>
                                <h3 className="text-base font-black" style={{ color: "var(--foreground)" }}>
                                    팀 순위 현황
                                </h3>
                                <span className="flex items-center gap-1.5 text-xs font-bold"
                                    style={{ color: "var(--accent)" }}>
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                                    실시간
                                </span>
                            </div>

                            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                                {isLoadingTeams ? (
                                    <div className="py-8 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
                                        팀 데이터 불러오는 중...
                                    </div>
                                ) : teamStats.length === 0 ? (
                                    <div className="py-8 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
                                        아직 참여한 학생이 없어요
                                    </div>
                                ) : null}
                                {[...teamStats]
                                    .sort((a, b) => b.score - a.score)
                                    .map((team, rank) => (
                                        <div key={team.id}
                                            className="flex items-center gap-4 px-5 py-4">
                                            {/* 순위 */}
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                                                style={{
                                                    background: rank === 0 ? "#FFF8E0" : rank === 1 ? "#F3F4F6" : rank === 2 ? "#FFF0EB" : "var(--surface-2)",
                                                    color: rank === 0 ? "#D97706" : rank === 1 ? "#6B7280" : rank === 2 ? "#9A3412" : "var(--foreground-muted)",
                                                }}
                                            >
                                                {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : rank + 1}
                                            </div>

                                            {/* 팀 이름 */}
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-xl">{team.emoji}</span>
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                                                        {team.name}
                                                    </p>
                                                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                                        {team.members}명 · 게시물 {team.posts}개
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 점수 */}
                                            <div className="text-right">
                                                <p className="font-black text-base" style={{ color: team.color }}>
                                                    {team.score.toLocaleString()}
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>점</p>
                                            </div>

                                            {/* 게시물 수 */}
                                            <div
                                                className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                                                style={{
                                                    background: team.posts > 0 ? "var(--accent-light)" : "var(--surface-2)",
                                                    color: team.posts > 0 ? "var(--accent)" : "var(--foreground-muted)",
                                                }}
                                            >
                                                {team.posts}개 게시물
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* 학생 팀 배정 */}
                        <div className="rounded-2xl overflow-hidden"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <div className="px-5 py-4 flex items-center justify-between"
                                style={{ borderBottom: "1px solid var(--border)" }}>
                                <div>
                                    <h3 className="text-base font-black" style={{ color: "var(--foreground)" }}>
                                        학생 팀 배정
                                    </h3>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                        {students.length}명 · 드롭다운으로 즉시 변경됩니다
                                    </p>
                                </div>
                                <button
                                    onClick={loadStudents}
                                    className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                                    style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}>
                                    새로고침
                                </button>
                            </div>

                            {isLoadingStudents ? (
                                <div className="py-8 text-center text-sm flex items-center justify-center gap-2"
                                    style={{ color: "var(--foreground-muted)" }}>
                                    <Loader2 size={16} className="animate-spin" /> 학생 목록 불러오는 중...
                                </div>
                            ) : students.length === 0 ? (
                                <div className="py-8 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
                                    등록된 학생이 없어요
                                </div>
                            ) : (
                                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                                    {students.map((student) => {
                                        const teamMeta = student.team ? TEAM_META[student.team] : null;
                                        const isUpdating = updatingTeamId === student.id;
                                        return (
                                            <div key={student.id}
                                                className="flex items-center gap-3 px-5 py-3">
                                                {/* 아바타 */}
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shrink-0"
                                                    style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}>
                                                    {student.name?.[0] ?? "?"}
                                                </div>

                                                {/* 이름 + 핸들 */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>
                                                        {student.name}
                                                    </p>
                                                    <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>
                                                        @{student.handle}
                                                    </p>
                                                </div>

                                                {/* 현재 팀 배지 */}
                                                {teamMeta && (
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                                                        style={{
                                                            background: `${teamMeta.color}18`,
                                                            color: teamMeta.color,
                                                        }}>
                                                        {teamMeta.emoji} {student.team}
                                                    </span>
                                                )}

                                                {/* 팀 드롭다운 */}
                                                <div className="relative shrink-0">
                                                    {isUpdating ? (
                                                        <div className="w-28 h-9 rounded-xl flex items-center justify-center"
                                                            style={{ background: "var(--surface-2)" }}>
                                                            <Loader2 size={14} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                                                        </div>
                                                    ) : (
                                                        <select
                                                            value={student.team ?? "미배정"}
                                                            onChange={e => handleUpdateTeam(student.id, e.target.value)}
                                                            className="w-28 px-3 py-2 rounded-xl text-xs font-bold outline-none appearance-none cursor-pointer transition-all"
                                                            style={{
                                                                background: "var(--surface-2)",
                                                                border: "1.5px solid var(--border)",
                                                                color: "var(--foreground)",
                                                            }}>
                                                            <option value="미배정">미배정</option>
                                                            {Object.keys(TEAM_META).map(t => (
                                                                <option key={t} value={t}>{t}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 참여 현황 */}
                        <div className="rounded-2xl p-5"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <h3 className="text-base font-black mb-4" style={{ color: "var(--foreground)" }}>
                                팀별 참여 현황
                            </h3>
                            <div className="flex flex-col gap-3">
                                {teamStats.length === 0 ? (
                                    <p className="text-sm text-center py-4" style={{ color: "var(--foreground-muted)" }}>
                                        학생 참여 데이터 없음
                                    </p>
                                ) : null}
                                {teamStats.map((team) => {
                                    const maxPosts = Math.max(...teamStats.map(t => t.posts), 1);
                                    const pct = Math.min(100, Math.round((team.posts / maxPosts) * 100));
                                    return (
                                        <div key={team.id} className="flex items-center gap-3">
                                            <span className="text-base w-6 text-center">{team.emoji}</span>
                                            <span className="text-sm font-bold w-12" style={{ color: "var(--foreground)" }}>
                                                {team.name}
                                            </span>
                                            <div className="flex-1 progress-track h-2.5">
                                                <div className="progress-fill h-full rounded-full transition-all"
                                                    style={{ width: `${pct}%`, background: team.color }} />
                                            </div>
                                            <span className="text-sm font-bold w-12 text-right"
                                                style={{ color: team.color }}>
                                                {team.posts}개
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 수업 도구 */}
                        <div className="rounded-2xl p-5"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <h3 className="text-base font-black mb-4" style={{ color: "var(--foreground)" }}>
                                수업 도구
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/session"
                                    className="flex flex-col gap-2 p-4 rounded-xl transition-all hover:scale-[1.02]"
                                    style={{ background: "var(--secondary-light)", border: "1px solid rgba(67,97,238,0.2)" }}>
                                    <GraduationCap size={20} style={{ color: "var(--secondary)" }} />
                                    <p className="font-bold text-sm" style={{ color: "var(--secondary)" }}>수업 내용 보기</p>
                                    <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>오늘 수업 활동 플랜</p>
                                </Link>

                                <Link href="/learn"
                                    className="flex flex-col gap-2 p-4 rounded-xl transition-all hover:scale-[1.02]"
                                    style={{ background: "var(--accent-light)", border: "1px solid rgba(6,214,160,0.2)" }}>
                                    <Sparkles size={20} style={{ color: "var(--accent)" }} />
                                    <p className="font-bold text-sm" style={{ color: "var(--accent)" }}>학습 자료 허브</p>
                                    <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>학생들에게 자료 공유</p>
                                </Link>

                                <button
                                    onClick={() => setShowResetConfirm(true)}
                                    className="flex flex-col gap-2 p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                    <RotateCcw size={20} style={{ color: "var(--foreground-soft)" }} />
                                    <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>피드 초기화</p>
                                    <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>데모 재시작 시 사용</p>
                                </button>

                                <Link href="/"
                                    className="flex flex-col gap-2 p-4 rounded-xl transition-all hover:scale-[1.02]"
                                    style={{ background: "var(--primary-light)", border: "1px solid rgba(255,107,53,0.2)" }}>
                                    <Eye size={20} style={{ color: "var(--primary)" }} />
                                    <p className="font-bold text-sm" style={{ color: "var(--primary)" }}>학생 화면 보기</p>
                                    <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>학생 뷰로 전환</p>
                                </Link>
                            </div>
                        </div>

                        {/* 피드 초기화 확인 모달 */}
                        {showResetConfirm && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                                <div className="w-full max-w-sm rounded-2xl p-6"
                                    style={{ background: "var(--surface)" }}>
                                    <h3 className="text-lg font-black mb-2" style={{ color: "var(--foreground)" }}>
                                        피드를 초기화할까요?
                                    </h3>
                                    <p className="text-sm mb-6" style={{ color: "var(--foreground-soft)" }}>
                                        모든 게시물이 삭제돼요. 이 작업은 되돌릴 수 없어요.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowResetConfirm(false)}
                                            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                                            style={{ background: "var(--surface-2)", color: "var(--foreground)" }}>
                                            취소
                                        </button>
                                        <button
                                            onClick={handleResetPosts}
                                            className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all"
                                            style={{ background: "#EF4444" }}>
                                            초기화
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════ TAB 2: 피드 모니터링 ══════════ */}
                {activeTab === "feed" && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                            <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                                전체 게시물 <span style={{ color: "var(--primary)" }}>{totalPosts}개</span>
                            </p>
                            <span className="flex items-center gap-1.5 text-sm font-bold"
                                style={{ color: "var(--accent)" }}>
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
                                실시간 업데이트
                            </span>
                        </div>

                        {posts.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3"
                                style={{ color: "var(--foreground-muted)" }}>
                                <Megaphone size={40} style={{ opacity: 0.3 }} />
                                <p className="text-base font-semibold">아직 게시물이 없어요</p>
                                <p className="text-sm">학생들이 셀스타그램에 콘텐츠를 올리면 여기에 표시돼요</p>
                            </div>
                        ) : (
                            posts.map((post) => {
                                const isHighlighted = highlightedPost === post.id;
                                return (
                                    <div key={post.id}
                                        className="rounded-2xl p-5 transition-all"
                                        style={{
                                            background: "var(--surface)",
                                            border: isHighlighted
                                                ? "2px solid var(--primary)"
                                                : "1px solid var(--border)",
                                            boxShadow: isHighlighted ? "0 0 0 4px var(--primary-light)" : "none",
                                        }}>
                                        {/* 포스트 헤더 */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base"
                                                    style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}>
                                                    {post.user.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                                                        {post.user.name}
                                                    </p>
                                                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                                        @{post.user.handle} · {post.timeAgo}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                                    style={{
                                                        background: post.type === "video" ? "var(--secondary-light)" : "var(--primary-light)",
                                                        color: post.type === "video" ? "var(--secondary)" : "var(--primary)",
                                                    }}>
                                                    {post.type === "video" ? "📹 영상" : "📸 사진"}
                                                </span>
                                                <button
                                                    onClick={() => handleHighlight(post.id, !isHighlighted)}
                                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                                                    style={{
                                                        background: isHighlighted ? "var(--primary)" : "var(--surface-2)",
                                                        color: isHighlighted ? "white" : "var(--foreground-soft)",
                                                    }}>
                                                    {isHighlighted ? <><Eye size={12} /> 강조 중</> : <><EyeOff size={12} /> 강조</>}
                                                </button>
                                            </div>
                                        </div>

                                        {/* 캡션 */}
                                        {post.content && (
                                            <p className="text-sm leading-relaxed mb-4"
                                                style={{ color: "var(--foreground-soft)" }}>
                                                {post.content.caption}
                                            </p>
                                        )}
                                        {post.description && (
                                            <p className="text-sm leading-relaxed mb-4"
                                                style={{ color: "var(--foreground-soft)" }}>
                                                {post.description}
                                            </p>
                                        )}

                                        {/* 해시태그 */}
                                        {post.content?.tags && (
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {post.content.tags.map((tag) => (
                                                    <span key={tag} className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                        style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}>
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* 성과 지표 */}
                                        <div className="flex items-center gap-4 pt-3"
                                            style={{ borderTop: "1px solid var(--border)" }}>
                                            <div className="flex items-center gap-1.5">
                                                <BarChart2 size={14} style={{ color: "var(--primary)" }} />
                                                <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                                    {post.stats.likes} 좋아요
                                                </span>
                                            </div>
                                            {post.stats.engagement && (
                                                <div className="flex items-center gap-1.5">
                                                    <TrendingUp size={14} style={{ color: "var(--accent)" }} />
                                                    <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                                        참여율 {post.stats.engagement}
                                                    </span>
                                                </div>
                                            )}
                                            {post.stats.sales && (
                                                <div className="flex items-center gap-1.5">
                                                    <Zap size={14} style={{ color: "#D97706" }} />
                                                    <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                                        {post.stats.sales}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* 강조 중 배너 */}
                                        {isHighlighted && (
                                            <div className="mt-3 p-3 rounded-xl flex items-center gap-2"
                                                style={{ background: "var(--primary-light)" }}>
                                                <Eye size={14} style={{ color: "var(--primary)" }} />
                                                <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                                                    지금 수업 화면에 강조 표시 중 — 학생들에게 이 게시물을 설명해보세요
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ══════════ TAB 3: 미션 관리 ══════════ */}
                {activeTab === "mission" && (
                    <div className="flex flex-col gap-4">
                        {/* 헤더 + 미션 생성 버튼 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3 flex-1 p-4 rounded-2xl"
                                style={{ background: "var(--secondary-light)" }}>
                                <MessageSquare size={18} style={{ color: "var(--secondary)" }} className="shrink-0 mt-0.5" />
                                <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>
                                    <strong style={{ color: "var(--secondary)" }}>미션 ON/OFF</strong>를 조절해서
                                    학생들에게 어떤 미션을 보여줄지 실시간으로 제어할 수 있어요.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateMission(true)}
                                className="ml-3 shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                                style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}>
                                <Plus size={16} /> 미션 추가
                            </button>
                        </div>

                        {/* 미션 목록 */}
                        <div className="flex flex-col gap-3">
                            {missions.length === 0 && (
                                <div className="py-12 flex flex-col items-center gap-3"
                                    style={{ color: "var(--foreground-muted)" }}>
                                    <Trophy size={36} style={{ opacity: 0.3 }} />
                                    <p className="text-sm font-semibold">미션이 없어요</p>
                                    <p className="text-xs">+ 미션 추가로 새 미션을 만들어보세요!</p>
                                </div>
                            )}
                            {missions.map((mission) => (
                                <div key={mission.id}
                                    className="rounded-2xl p-5 transition-all"
                                    style={{
                                        background: "var(--surface)",
                                        border: mission.isActive
                                            ? "1.5px solid var(--accent)"
                                            : "1px solid var(--border)",
                                        opacity: mission.isActive ? 1 : 0.6,
                                    }}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                                style={{
                                                    background: mission.isCompleted
                                                        ? "var(--accent-light)"
                                                        : mission.isActive
                                                        ? "var(--primary-light)"
                                                        : "var(--surface-2)",
                                                }}>
                                                {mission.isCompleted
                                                    ? <CheckCircle2 size={20} style={{ color: "var(--accent)" }} />
                                                    : mission.isActive
                                                    ? <Trophy size={20} style={{ color: "var(--primary)" }} />
                                                    : <XCircle size={20} style={{ color: "var(--foreground-muted)" }} />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <p className="font-black text-base" style={{ color: "var(--foreground)" }}>
                                                        {mission.title}
                                                    </p>
                                                    {mission.isCompleted && (
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                            style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                                                            완료!
                                                        </span>
                                                    )}
                                                    {!mission.isActive && (
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                            style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
                                                            숨김
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>
                                                    {mission.description}
                                                </p>
                                                {mission.reward > 0 && (
                                                    <p className="text-xs font-bold mt-1" style={{ color: "#D97706" }}>
                                                        🏅 완료 보상: +{mission.reward} XP
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* 토글 + 삭제 */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleToggleMission(mission.id)}
                                                className="transition-all hover:scale-110"
                                            >
                                                {mission.isActive
                                                    ? <ToggleRight size={36} style={{ color: "var(--accent)" }} />
                                                    : <ToggleLeft size={36} style={{ color: "var(--foreground-muted)" }} />
                                                }
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMission(mission.id)}
                                                disabled={deletingId === mission.id}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40"
                                                style={{ background: "#FEF2F2", color: "#EF4444" }}
                                            >
                                                {deletingId === mission.id
                                                    ? <Loader2 size={14} className="animate-spin" />
                                                    : <Trash2 size={14} />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 미션 상태 요약 */}
                        <div className="rounded-2xl p-5"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <h3 className="text-base font-black mb-4" style={{ color: "var(--foreground)" }}>
                                미션 참여 현황
                            </h3>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                {[
                                    { label: "활성 미션", value: activeMissions, color: "var(--accent)" },
                                    { label: "완료", value: completedMissions, color: "var(--secondary)" },
                                    { label: "진행 중", value: activeMissions - completedMissions, color: "var(--primary)" },
                                ].map((s) => (
                                    <div key={s.label} className="rounded-xl p-3"
                                        style={{ background: "var(--surface-2)" }}>
                                        <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                                        <p className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                            {s.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 미션 생성 모달 */}
                        {showCreateMission && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                                <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
                                    style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black" style={{ color: "var(--foreground)" }}>
                                            새 미션 만들기
                                        </h3>
                                        <button onClick={() => setShowCreateMission(false)}
                                            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                                            style={{ color: "var(--foreground-muted)" }}>
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>
                                                미션 제목 *
                                            </label>
                                            <input
                                                type="text"
                                                value={newTitle}
                                                onChange={e => setNewTitle(e.target.value)}
                                                placeholder="예: 첫 번째 콘텐츠 업로드"
                                                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                                style={{
                                                    background: "var(--surface-2)",
                                                    border: newTitle ? "2px solid var(--primary)" : "2px solid transparent",
                                                    color: "var(--foreground)",
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>
                                                설명
                                            </label>
                                            <textarea
                                                value={newDesc}
                                                onChange={e => setNewDesc(e.target.value)}
                                                placeholder="예: 마케팅 콘텐츠를 하나 이상 피드에 올려보세요"
                                                rows={3}
                                                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                                                style={{
                                                    background: "var(--surface-2)",
                                                    border: "2px solid transparent",
                                                    color: "var(--foreground)",
                                                }}
                                            />
                                        </div>
                                        {/* 미션 타입 */}
                                        <div>
                                            <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>
                                                미션 타입 *
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {([
                                                    { key: "posts", label: "게시물 수", desc: "N개 업로드" },
                                                    { key: "likes", label: "좋아요 수", desc: "총 N개 달성" },
                                                    { key: "engagement", label: "인게이지먼트", desc: "N% 이상 게시물" },
                                                    { key: "revenue", label: "매출", desc: "₩N 이상 달성" },
                                                ] as const).map(({ key, label, desc }) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => { setNewType(key); setNewTarget(key === "revenue" ? 100000 : 1); }}
                                                        className="flex flex-col items-start px-3 py-2.5 rounded-xl text-left transition-all"
                                                        style={{
                                                            background: newType === key ? "var(--primary-light)" : "var(--surface-2)",
                                                            border: `2px solid ${newType === key ? "var(--primary)" : "transparent"}`,
                                                        }}
                                                    >
                                                        <span className="text-xs font-bold" style={{ color: newType === key ? "var(--primary)" : "var(--foreground)" }}>{label}</span>
                                                        <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 목표값 */}
                                        <div>
                                            <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>
                                                {newType === "posts" ? "목표 게시물 수" :
                                                 newType === "likes" ? "목표 좋아요 수" :
                                                 newType === "engagement" ? "조건 충족 게시물 수 (인게이지먼트 10% 이상)" :
                                                 "목표 매출 (₩)"}
                                            </label>
                                            <input
                                                type="number"
                                                value={newTarget}
                                                onChange={e => setNewTarget(Number(e.target.value))}
                                                min={1}
                                                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                                style={{ background: "var(--surface-2)", border: "2px solid transparent", color: "var(--foreground)" }}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>
                                                완료 보상 (XP)
                                            </label>
                                            <input
                                                type="number"
                                                value={newReward}
                                                onChange={e => setNewReward(Number(e.target.value))}
                                                min={0}
                                                max={500}
                                                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                                style={{
                                                    background: "var(--surface-2)",
                                                    border: "2px solid transparent",
                                                    color: "var(--foreground)",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowCreateMission(false)}
                                            className="flex-1 py-3 rounded-xl font-bold text-sm"
                                            style={{ background: "var(--surface-2)", color: "var(--foreground)" }}>
                                            취소
                                        </button>
                                        <button
                                            onClick={handleCreateMission}
                                            disabled={!newTitle.trim() || isSavingMission}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40"
                                            style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}>
                                            {isSavingMission ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                            {isSavingMission ? "저장 중..." : "미션 생성"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════ TAB 4: 상품 관리 ══════════ */}
                {activeTab === "shop" && (
                    <ShopManageTab />
                )}

            </div>
        </div>
    );
}

/* ─────────────────── 상품 관리 탭 컴포넌트 ─────────────────── */
interface DbProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    cost: number;
    category: string;
    xp_bonus: number;
    is_active: boolean;
    image_url: string | null;
    sort_order: number | null;
}

type ProductForm = {
    name: string;
    description: string;
    price: number;
    cost: number;
    category: string;
    xp_bonus: number;
    image_url: string;
};

const EMPTY_PRODUCT_FORM: ProductForm = {
    name: "", description: "", price: 50000, cost: 20000, category: "General", xp_bonus: 10, image_url: "",
};

const PRODUCT_INPUT_STYLE = { background: "var(--surface-2)", border: "2px solid transparent", color: "var(--foreground)" };

function ProductFormFields({ f, onChange }: {
    f: ProductForm;
    onChange: (key: keyof ProductForm, value: string | number) => void;
}) {
    return (
        <>
            <input placeholder="상품명 *" value={f.name} onChange={e => onChange("name", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={PRODUCT_INPUT_STYLE} />
            <textarea placeholder="상품 설명" value={f.description} onChange={e => onChange("description", e.target.value)}
                rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={PRODUCT_INPUT_STYLE} />
            <div className="flex items-center gap-2">
                <ImageIcon size={14} style={{ color: "var(--foreground-muted)", flexShrink: 0 }} />
                <input placeholder="이미지 URL (선택)" value={f.image_url} onChange={e => onChange("image_url", e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={PRODUCT_INPUT_STYLE} />
            </div>
            {f.image_url && (
                <img src={f.image_url} alt="미리보기" className="w-full h-28 object-cover rounded-xl"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            )}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] font-bold mb-1 block" style={{ color: "var(--foreground-muted)" }}>판매가 (₩)</label>
                    <input type="number" value={f.price} onChange={e => onChange("price", Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={PRODUCT_INPUT_STYLE} />
                </div>
                <div>
                    <label className="text-[10px] font-bold mb-1 block" style={{ color: "var(--foreground-muted)" }}>원가 (₩)</label>
                    <input type="number" value={f.cost} onChange={e => onChange("cost", Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={PRODUCT_INPUT_STYLE} />
                </div>
                <div>
                    <label className="text-[10px] font-bold mb-1 block" style={{ color: "var(--foreground-muted)" }}>카테고리</label>
                    <input value={f.category} onChange={e => onChange("category", e.target.value)}
                        placeholder="예: Gadget, Fashion" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={PRODUCT_INPUT_STYLE} />
                </div>
                <div>
                    <label className="text-[10px] font-bold mb-1 block" style={{ color: "var(--foreground-muted)" }}>XP 보너스</label>
                    <input type="number" value={f.xp_bonus} onChange={e => onChange("xp_bonus", Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={PRODUCT_INPUT_STYLE} />
                </div>
            </div>
        </>
    );
}

function ShopManageTab() {
    const [products, setProducts] = useState<DbProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);

    useEffect(() => {
        supabase.from("products")
            .select("id,name,description,price,cost,category,xp_bonus,is_active,image_url,sort_order")
            .order("sort_order", { ascending: true, nullsFirst: false })
            .order("created_at")
            .then(({ data }) => { setProducts(data ?? []); setLoading(false); });
    }, []);

    const handleCreate = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        const maxOrder = products.reduce((max, p) => Math.max(max, p.sort_order ?? 0), 0);
        const { data } = await supabase.from("products").insert({
            ...form,
            image_url: form.image_url || null,
            stock: 100,
            is_active: true,
            sort_order: maxOrder + 1,
        }).select().single();
        if (data) setProducts(prev => [...prev, data]);
        setShowForm(false);
        setForm(EMPTY_PRODUCT_FORM);
        setSaving(false);
    };

    const handleToggle = async (id: string, current: boolean) => {
        await supabase.from("products").update({ is_active: !current }).eq("id", id);
        setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
    };

    const handleDelete = async (id: string) => {
        if (!confirm("이 상품을 삭제할까요?")) return;
        await supabase.from("products").delete().eq("id", id);
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    const handleEditStart = (p: DbProduct) => {
        setEditingId(p.id);
        setEditForm({
            name: p.name,
            description: p.description,
            price: p.price,
            cost: p.cost,
            category: p.category,
            xp_bonus: p.xp_bonus,
            image_url: p.image_url ?? "",
        });
    };

    const handleEditSave = async (id: string) => {
        setSaving(true);
        await supabase.from("products").update({
            ...editForm,
            image_url: editForm.image_url || null,
        }).eq("id", id);
        setProducts(prev => prev.map(p => p.id === id
            ? { ...p, ...editForm, image_url: editForm.image_url || null }
            : p
        ));
        setEditingId(null);
        setSaving(false);
    };

    const handleMove = async (index: number, dir: -1 | 1) => {
        const target = index + dir;
        if (target < 0 || target >= products.length) return;
        const next = [...products];
        const a = next[index];
        const b = next[target];
        next[index] = b;
        next[target] = a;
        setProducts(next);
        await Promise.all([
            supabase.from("products").update({ sort_order: target }).eq("id", a.id),
            supabase.from("products").update({ sort_order: index }).eq("id", b.id),
        ]);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>등록된 상품 {products.length}개</p>
                <button onClick={() => { setShowForm(v => !v); setEditingId(null); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}>
                    <Plus size={14} /> 상품 추가
                </button>
            </div>

            {/* 새 상품 등록 폼 */}
            {showForm && (
                <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>새 상품 등록</p>
                    <ProductFormFields
                        f={form}
                        onChange={(key, val) => setForm(prev => ({ ...prev, [key]: val }))}
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                            style={{ background: "var(--surface-2)", color: "var(--foreground)" }}>취소</button>
                        <button onClick={handleCreate} disabled={!form.name.trim() || saving}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-40"
                            style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}>
                            {saving ? <><Loader2 size={14} className="animate-spin" /> 저장 중...</> : "등록"}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin" style={{ color: "var(--primary)" }} /></div>
            ) : products.length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: "var(--foreground-muted)" }}>등록된 상품이 없어요</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {products.map((p, idx) => (
                        <div key={p.id} className="flex flex-col rounded-xl overflow-hidden transition-opacity"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)", opacity: p.is_active ? 1 : 0.6 }}>

                            {/* 상품 요약 행 */}
                            <div className="flex items-center gap-2 p-3.5">
                                {/* 순서 조정 버튼 */}
                                <div className="flex flex-col gap-0.5 shrink-0">
                                    <button onClick={() => handleMove(idx, -1)} disabled={idx === 0}
                                        className="p-0.5 rounded disabled:opacity-20 hover:bg-[var(--surface-2)] transition-colors">
                                        <ChevronUp size={13} style={{ color: "var(--foreground-muted)" }} />
                                    </button>
                                    <button onClick={() => handleMove(idx, 1)} disabled={idx === products.length - 1}
                                        className="p-0.5 rounded disabled:opacity-20 hover:bg-[var(--surface-2)] transition-colors">
                                        <ChevronDown size={13} style={{ color: "var(--foreground-muted)" }} />
                                    </button>
                                </div>

                                {/* 썸네일 */}
                                {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ background: "var(--surface-2)" }}>
                                        <ImageIcon size={16} style={{ color: "var(--foreground-muted)" }} />
                                    </div>
                                )}

                                {/* 상품 정보 */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>{p.name}</p>
                                    <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                                        ₩{p.price.toLocaleString()} · {p.category} · +{p.xp_bonus}XP
                                    </p>
                                </div>

                                {/* 액션 버튼 */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={() => handleToggle(p.id, p.is_active)}
                                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                        style={{
                                            background: p.is_active ? "var(--accent-light)" : "var(--surface-2)",
                                            color: p.is_active ? "var(--accent)" : "var(--foreground-muted)",
                                        }}>
                                        {p.is_active ? "활성" : "비활성"}
                                    </button>
                                    <button
                                        onClick={() => editingId === p.id ? setEditingId(null) : handleEditStart(p)}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{
                                            background: editingId === p.id ? "var(--secondary-light)" : "transparent",
                                            color: "var(--secondary)",
                                        }}>
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* 인라인 편집 폼 */}
                            {editingId === p.id && (
                                <div className="flex flex-col gap-3 px-4 pb-4 pt-3"
                                    style={{ borderTop: "1px solid var(--border)" }}>
                                    <p className="text-xs font-bold" style={{ color: "var(--foreground-muted)" }}>상품 수정</p>
                                    <ProductFormFields
                                        f={editForm}
                                        onChange={(key, val) => setEditForm(prev => ({ ...prev, [key]: val }))}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                                            style={{ background: "var(--surface-2)", color: "var(--foreground)" }}>취소</button>
                                        <button onClick={() => handleEditSave(p.id)} disabled={!editForm.name.trim() || saving}
                                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-40"
                                            style={{ background: "linear-gradient(135deg, var(--secondary), #6B8EFF)" }}>
                                            {saving ? <><Loader2 size={14} className="animate-spin" /> 저장 중...</> : "저장"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─────────────────── 최상위 페이지 ─────────────────── */
export default function TeacherPage() {
    const [status, setStatus] = useState<"loading" | "no-auth" | "not-teacher" | "ready">("loading");
    const router = useRouter();

    useEffect(() => {
        const check = async () => {
            // 관리자는 role/PIN 체크 없이 바로 접근 허용
            const adminRes = await fetch("/api/auth/admin-check");
            const { isAdmin } = await adminRes.json();
            if (isAdmin) { setStatus("ready"); return; }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/login"); return; }

            const { data: profile } = await supabase
                .from("profiles").select("role").eq("id", session.user.id).single();

            if (!profile) { router.push("/"); return; }
            if (profile.role !== "teacher") { setStatus("not-teacher"); return; }

            setStatus("ready");
        };
        check();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
                <div className="animate-spin rounded-full w-8 h-8 border-2 border-t-transparent" style={{ borderColor: "var(--secondary)" }} />
            </div>
        );
    }

    if (status === "not-teacher") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4" style={{ background: "var(--background)" }}>
                <Shield size={48} style={{ color: "var(--secondary)", opacity: 0.4 }} />
                <h2 className="text-xl font-black" style={{ color: "var(--foreground)" }}>교사 전용 페이지입니다</h2>
                <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>교사 계정으로 로그인해야 접근할 수 있어요.</p>
                <button onClick={() => router.push("/")}
                    className="px-6 py-3 rounded-xl font-bold text-sm text-white"
                    style={{ background: "var(--primary)" }}>
                    학생 화면으로 돌아가기
                </button>
            </div>
        );
    }

    return <Dashboard onLogout={handleLogout} />;
}
