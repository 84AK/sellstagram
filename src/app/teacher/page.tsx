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
}

type Tab = "class" | "feed" | "mission" | "shop" | "reward" | "weekly" | "teams" | "simulation";

interface SimResult {
    id: string;
    user_name: string;
    user_handle: string;
    post_caption: string | null;
    post_image: string | null;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    total_purchases: number;
    total_revenue: number;
    duration_minutes: number;
    session_started_at: string;
    created_at: string;
}

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
    const [simActive, setSimActive] = useState(false);
    const [simLoading, setSimLoading] = useState(false);
    const [simDuration, setSimDuration] = useState(10);
    const [simStartedAt, setSimStartedAt] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
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


    // 피드 모니터링용 Supabase 게시물
    const [dbPosts, setDbPosts] = useState<DbPost[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);

    // 시뮬레이션 결과 모니터링
    const [simResults, setSimResults] = useState<SimResult[]>([]);
    const [isLoadingSimResults, setIsLoadingSimResults] = useState(false);
    const [newResultAlert, setNewResultAlert] = useState<string | null>(null);
    // handle → team 매핑 (팀별 집계용)
    const [handleToTeam, setHandleToTeam] = useState<Record<string, string>>({});

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

    // 미션 삭제 (admin API 경유 — RLS 우회)
    const handleDeleteMission = async (missionId: string) => {
        setDeletingId(missionId);
        const res = await fetch("/api/missions/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: missionId }),
        });
        if (res.ok) {
            deleteMission(missionId);
        } else {
            const { error } = await res.json();
            console.error("미션 삭제 실패:", error);
            alert("미션 삭제에 실패했습니다: " + error);
        }
        setDeletingId(null);
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

    // 마켓 시뮬레이션 토글
    const handleSimToggle = async () => {
        setSimLoading(true);
        const next = !simActive;
        const updatePayload = next
            ? {
                sim_active: true,
                sim_started_at: new Date().toISOString(),
                sim_duration_minutes: simDuration,
              }
            : {
                sim_active: false,
                sim_started_at: null,
              };
        const { error } = await supabase
            .from("app_settings")
            .update(updatePayload)
            .eq("id", 1);
        if (!error) {
            setSimActive(next);
            setSimStartedAt(next ? new Date().toISOString() : null);
        }
        setSimLoading(false);
    };

    // 회차 잠금/열기 토글
    useEffect(() => {
        loadTeamStats();
        loadMissionsFromDB();

        // 수업 상태 로드
        supabase.from("app_settings").select("class_active, sim_active, sim_duration_minutes, sim_started_at").eq("id", 1).single()
            .then(({ data }) => {
                if (data) {
                    setClassActive(data.class_active);
                    setSimActive(data.sim_active ?? false);
                    setSimDuration(data.sim_duration_minutes ?? 10);
                    setSimStartedAt(data.sim_started_at ?? null);
                }
            });

        // 피드 모니터링: Supabase에서 전체 게시물 로드
        const loadDbPosts = async () => {
            setIsLoadingPosts(true);
            const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
            setDbPosts(data ?? []);
            setIsLoadingPosts(false);
        };
        loadDbPosts();

        // 새 게시물이 업로드되면 팀 통계 + 피드 갱신
        const ch = supabase.channel("teacher-posts")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
                loadTeamStats();
                setDbPosts(prev => [payload.new as DbPost, ...prev]);
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "posts" }, (payload) => {
                setDbPosts(prev => prev.map(p => p.id === (payload.new as DbPost).id ? payload.new as DbPost : p));
            })
            .subscribe();

        // ── 시뮬레이션 결과 모니터링 ──
        // handle → team 매핑 로드
        supabase.from("profiles").select("handle, team").then(({ data }) => {
            if (data) {
                const map: Record<string, string> = {};
                data.forEach((p: { handle: string; team: string | null }) => {
                    if (p.handle) map[p.handle] = p.team ?? "미배정";
                });
                setHandleToTeam(map);
            }
        });

        // 기존 시뮬레이션 결과 로드
        setIsLoadingSimResults(true);
        supabase.from("simulation_results")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50)
            .then(({ data }) => {
                setSimResults(data ?? []);
                setIsLoadingSimResults(false);
            });

        // 새 시뮬레이션 결과 실시간 구독
        const simCh = supabase.channel("teacher-sim-results")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "simulation_results" },
                (payload) => {
                    const newResult = payload.new as SimResult;
                    setSimResults(prev => [newResult, ...prev]);
                    setNewResultAlert(
                        `${newResult.user_name}님이 결과 저장! 매출 ₩${newResult.total_revenue.toLocaleString()}`
                    );
                    setTimeout(() => setNewResultAlert(null), 4000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(ch);
            supabase.removeChannel(simCh);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const session = getSessionByWeek(week);
    const themeStyle = session ? THEME_COLORS[session.theme] : THEME_COLORS.intro;

    const totalRevenue = campaigns.reduce((acc, c) => acc + c.revenue, 0);
    const totalPosts = dbPosts.length;
    const activeMissions = missions.filter((m) => m.isActive).length;
    const completedMissions = missions.filter((m) => m.isCompleted).length;

    // 팀별 시뮬레이션 매출 집계
    const teamSimRevenue = simResults.reduce((acc, r) => {
        const team = handleToTeam[r.user_handle] ?? "미배정";
        acc[team] = (acc[team] ?? 0) + r.total_revenue;
        return acc;
    }, {} as Record<string, number>);
    const teamSimRanking = Object.entries(teamSimRevenue)
        .sort(([, a], [, b]) => b - a);

    const tabs: { id: Tab; label: string; emoji: string }[] = [
        { id: "class", label: "수업 현황", emoji: "🎓" },
        { id: "teams", label: "팀 관리", emoji: "👥" },
        { id: "weekly", label: "주차별 결과", emoji: "📊" },
        { id: "feed", label: "피드 모니터링", emoji: "📱" },
        { id: "mission", label: "미션 관리", emoji: "🏆" },
        { id: "shop", label: "상품 관리", emoji: "🛍️" },
        { id: "reward", label: "리워드 관리", emoji: "🎁" },
        { id: "simulation", label: "시뮬레이션 결과", emoji: "📈" },
    ];

    return (
        <div className="min-h-screen" style={{ background: "var(--background)" }}>

            {/* ── 시뮬레이션 결과 토스트 알림 ── */}
            {newResultAlert && (
                <div className="fixed top-5 right-5 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-2 duration-300"
                    style={{ background: "var(--secondary)", color: "white", maxWidth: "320px" }}>
                    <TrendingUp size={16} className="shrink-0" />
                    <p className="text-sm font-bold">{newResultAlert}</p>
                </div>
            )}

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

                        {/* 마켓 시뮬레이션 컨트롤 */}
                        <div className="rounded-2xl p-5"
                            style={{
                                background: simActive
                                    ? "linear-gradient(135deg, rgba(6,214,160,0.08), rgba(67,97,238,0.06))"
                                    : "var(--surface)",
                                border: simActive ? "1.5px solid rgba(6,214,160,0.4)" : "1px solid var(--border)",
                            }}>
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-base font-black" style={{ color: "var(--foreground)" }}>
                                            마켓 시뮬레이션
                                        </h3>
                                        {simActive && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: "rgba(6,214,160,0.15)", color: "var(--accent)" }}>
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                                                진행 중
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                        학생들이 가상 구매자 반응을 실시간으로 확인합니다 · 1분 = 1시간
                                    </p>
                                </div>
                            </div>

                            {/* 시간 선택 (비활성 시에만) */}
                            {!simActive && (
                                <div className="flex gap-2 mb-4 flex-wrap">
                                    {[5, 10, 15, 20, 30].map(min => (
                                        <button
                                            key={min}
                                            onClick={() => setSimDuration(min)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                                            style={{
                                                background: simDuration === min ? "var(--accent)" : "var(--surface-2)",
                                                color: simDuration === min ? "white" : "var(--foreground-soft)",
                                            }}
                                        >
                                            {min}분
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleSimToggle}
                                disabled={simLoading}
                                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                style={{
                                    background: simActive
                                        ? "rgba(239,68,68,0.1)"
                                        : "linear-gradient(135deg, var(--accent), #4361EE)",
                                    color: simActive ? "#EF4444" : "white",
                                    border: simActive ? "1.5px solid rgba(239,68,68,0.3)" : "none",
                                    boxShadow: simActive ? "none" : "0 4px 12px rgba(6,214,160,0.3)",
                                }}
                            >
                                {simLoading ? (
                                    "처리 중..."
                                ) : simActive ? (
                                    <><Pause size={15} /> 마켓 닫기</>
                                ) : (
                                    <><Play size={15} /> 마켓 열기 ({simDuration}분)</>
                                )}
                            </button>
                        </div>

                        {/* 교사용 시뮬레이션 모니터 */}
                        {simActive && simStartedAt && (
                            <TeacherSimMonitor
                                startedAt={simStartedAt}
                                durationMinutes={simDuration}
                                dbPosts={dbPosts}
                            />
                        )}

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

                        {/* 팀 관리 바로가기 */}
                        <button
                            onClick={() => setActiveTab("teams")}
                            className="flex items-center justify-between px-5 py-4 rounded-2xl w-full transition-all hover:opacity-90"
                            style={{ background: "var(--secondary-light)", border: "1.5px solid rgba(67,97,238,0.25)" }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--secondary)" }}>
                                    <Users size={18} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-sm" style={{ color: "var(--secondary)" }}>팀 관리 · 학생 배정</p>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>팀 생성, 삭제, 학생 팀 배정은 팀 관리 탭에서</p>
                                </div>
                            </div>
                            <ChevronRight size={18} style={{ color: "var(--secondary)" }} />
                        </button>

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

                {/* ══════════ TAB: 팀 관리 ══════════ */}
                {activeTab === "teams" && <TeamsTab />}

                {/* ══════════ TAB: 주차별 결과 ══════════ */}
                {activeTab === "weekly" && (
                    <WeeklyResultsTab />
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

                        {isLoadingPosts ? (
                            <div className="flex justify-center py-16">
                                <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
                            </div>
                        ) : dbPosts.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3"
                                style={{ color: "var(--foreground-muted)" }}>
                                <Megaphone size={40} style={{ opacity: 0.3 }} />
                                <p className="text-base font-semibold">아직 게시물이 없어요</p>
                                <p className="text-sm">학생들이 셀스타그램에 콘텐츠를 올리면 여기에 표시돼요</p>
                            </div>
                        ) : (
                            dbPosts.map((post) => {
                                const isHighlighted = highlightedPost === post.id || post.highlighted;
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
                                                    {post.user_name?.[0] ?? "?"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                                                        {post.user_name}
                                                    </p>
                                                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                                        @{post.user_handle} · {new Date(post.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                        {post.week && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>{post.week}주차</span>}
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

                                        {/* 이미지 */}
                                        {post.image_url && (
                                            <img src={post.image_url} alt="" className="w-full rounded-xl object-cover max-h-[240px] mb-4" />
                                        )}

                                        {/* 캡션 */}
                                        {post.caption && (
                                            <p className="text-sm leading-relaxed mb-4"
                                                style={{ color: "var(--foreground-soft)" }}>
                                                {post.caption}
                                            </p>
                                        )}
                                        {post.description && (
                                            <p className="text-sm leading-relaxed mb-4"
                                                style={{ color: "var(--foreground-soft)" }}>
                                                {post.description}
                                            </p>
                                        )}

                                        {/* 해시태그 */}
                                        {post.tags && post.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {post.tags.map((tag: string) => (
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
                                                    {post.likes} 좋아요
                                                </span>
                                            </div>
                                            {post.engagement_rate && (
                                                <div className="flex items-center gap-1.5">
                                                    <TrendingUp size={14} style={{ color: "var(--accent)" }} />
                                                    <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                                        참여율 {post.engagement_rate}
                                                    </span>
                                                </div>
                                            )}
                                            {post.sales && post.sales !== "₩0" && (
                                                <div className="flex items-center gap-1.5">
                                                    <Zap size={14} style={{ color: "#D97706" }} />
                                                    <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                                        {post.sales}
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

                {/* ══════════ TAB 5: 리워드 관리 ══════════ */}
                {activeTab === "reward" && (
                    <RewardManageTab />
                )}

                {/* ══════════ TAB: 시뮬레이션 결과 모니터링 ══════════ */}
                {activeTab === "simulation" && (
                    <div className="flex flex-col gap-4">

                        {/* 헤더 요약 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                    총 {simResults.length}개 결과
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                    학생이 "결과 저장" 클릭 시 실시간으로 표시됩니다
                                </p>
                            </div>
                            {isLoadingSimResults && (
                                <Loader2 size={16} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                            )}
                        </div>

                        {/* 팀별 매출 리더보드 */}
                        {teamSimRanking.length > 0 && (
                            <div className="rounded-2xl p-5"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Trophy size={15} style={{ color: "var(--highlight)" }} />
                                    <h3 className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                        팀별 총 매출 순위
                                    </h3>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    {teamSimRanking.map(([team, revenue], idx) => {
                                        const meta = TEAM_META[team] ?? { emoji: "👥", color: "#9CA3AF" };
                                        const maxRev = teamSimRanking[0]?.[1] ?? 1;
                                        const pct = Math.round((revenue / maxRev) * 100);
                                        return (
                                            <div key={team} className="flex items-center gap-3">
                                                <span className="w-5 text-xs font-black text-center"
                                                    style={{ color: idx === 0 ? "#D97706" : "var(--foreground-muted)" }}>
                                                    {idx + 1}
                                                </span>
                                                <span className="text-base w-6 text-center">{meta.emoji}</span>
                                                <span className="text-sm font-bold w-12" style={{ color: "var(--foreground)" }}>
                                                    {team}
                                                </span>
                                                <div className="flex-1 h-2 rounded-full overflow-hidden"
                                                    style={{ background: "var(--surface-2)" }}>
                                                    <div className="h-full rounded-full transition-all duration-700"
                                                        style={{ width: `${pct}%`, background: meta.color }} />
                                                </div>
                                                <span className="text-xs font-black w-24 text-right"
                                                    style={{ color: meta.color }}>
                                                    ₩{revenue.toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 개별 결과 카드 (최신순) */}
                        {simResults.length === 0 && !isLoadingSimResults ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <TrendingUp size={32} style={{ color: "var(--foreground-muted)", opacity: 0.3 }} />
                                <p className="text-sm font-bold" style={{ color: "var(--foreground-muted)" }}>
                                    아직 저장된 결과가 없습니다
                                </p>
                                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                    학생들이 시뮬레이션을 완료하면 여기에 표시됩니다
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {simResults.map((r) => {
                                    const team = handleToTeam[r.user_handle] ?? "미배정";
                                    const meta = TEAM_META[team] ?? { emoji: "👥", color: "#9CA3AF" };
                                    const timeAgo = (() => {
                                        const diff = Date.now() - new Date(r.created_at).getTime();
                                        const m = Math.floor(diff / 60000);
                                        if (m < 1) return "방금 전";
                                        if (m < 60) return `${m}분 전`;
                                        return `${Math.floor(m / 60)}시간 전`;
                                    })();
                                    return (
                                        <div key={r.id} className="rounded-2xl overflow-hidden"
                                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                            {/* 카드 헤더 */}
                                            <div className="flex items-center justify-between px-4 py-3"
                                                style={{ borderBottom: "1px solid var(--border)" }}>
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-xl">{meta.emoji}</span>
                                                    <div>
                                                        <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                                            {r.user_name}
                                                        </p>
                                                        <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                                            @{r.user_handle} · {team}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {r.total_revenue > 0 && (
                                                        <span className="text-xs font-black px-2.5 py-1 rounded-full"
                                                            style={{ background: "rgba(255,194,51,0.15)", color: "#D97706" }}>
                                                            ₩{r.total_revenue.toLocaleString()}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                                        {timeAgo}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* 게시물 캡션 */}
                                            {r.post_caption && (
                                                <div className="px-4 py-2">
                                                    <p className="text-xs italic line-clamp-2"
                                                        style={{ color: "var(--foreground-muted)" }}>
                                                        "{r.post_caption}"
                                                    </p>
                                                </div>
                                            )}
                                            {/* 결과 지표 */}
                                            <div className="grid grid-cols-4 divide-x px-0 py-3"
                                                style={{ borderTop: "1px solid var(--border)", "--divide-x-color": "var(--border)" } as React.CSSProperties}>
                                                {[
                                                    { emoji: "❤️", label: "좋아요", value: r.total_likes },
                                                    { emoji: "💬", label: "댓글", value: r.total_comments },
                                                    { emoji: "🔗", label: "공유", value: r.total_shares },
                                                    { emoji: "🛍️", label: "구매", value: r.total_purchases },
                                                ].map(({ emoji, label, value }) => (
                                                    <div key={label} className="flex flex-col items-center gap-0.5 py-1">
                                                        <span className="text-base">{emoji}</span>
                                                        <span className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                                            {value}
                                                        </span>
                                                        <span className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>
                                                            {label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
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

/* ─────────────────── 리워드 관리 탭 컴포넌트 ─────────────────── */
interface RewardItem {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: string;
    cost_points: number;
    quantity_limit: number | null;
    quantity_used: number;
    is_active: boolean;
}

interface RewardPurchase {
    id: string;
    user_name: string;
    item_name: string;
    purchased_at: string;
}

const REWARD_TYPES = [
    { value: "virtual", label: "🌟 가상 아이템" },
    { value: "frame",   label: "👑 프로필 프레임" },
    { value: "boost",   label: "⚡ 피드 부스트" },
    { value: "real",    label: "🎫 실물 보상 (선생님 설정)" },
];

const EMPTY_REWARD_FORM = {
    name: "", description: "", icon: "🎁", type: "real",
    cost_points: 500, quantity_limit: "" as string | number,
};

function RewardManageTab() {
    const [items, setItems] = useState<RewardItem[]>([]);
    const [purchases, setPurchases] = useState<RewardPurchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_REWARD_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<"items" | "history">("items");

    useEffect(() => {
        const load = async () => {
            const [{ data: rewardItems }, { data: purchaseHistory }] = await Promise.all([
                supabase.from("reward_items").select("*").order("cost_points"),
                supabase.from("reward_purchases").select("*").order("purchased_at", { ascending: false }).limit(50),
            ]);
            setItems(rewardItems ?? []);
            setPurchases(purchaseHistory ?? []);
            setLoading(false);
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        const payload = {
            name: form.name,
            description: form.description,
            icon: form.icon || "🎁",
            type: form.type,
            cost_points: Number(form.cost_points) || 500,
            quantity_limit: form.quantity_limit === "" ? null : Number(form.quantity_limit),
        };

        if (editingId) {
            const { data, error } = await supabase.from("reward_items").update(payload).eq("id", editingId).select().single();
            if (!error && data) {
                setItems(prev => prev.map(i => i.id === editingId ? data : i));
                setForm(EMPTY_REWARD_FORM);
                setEditingId(null);
                setShowForm(false);
            }
        } else {
            const { data, error } = await supabase.from("reward_items").insert({ ...payload, quantity_used: 0, is_active: true }).select().single();
            if (!error && data) {
                setItems(prev => [...prev, data]);
                setForm(EMPTY_REWARD_FORM);
                setShowForm(false);
            }
        }
        setSaving(false);
    };

    const handleEdit = (item: RewardItem) => {
        setForm({
            name: item.name,
            description: item.description,
            icon: item.icon,
            type: item.type,
            cost_points: item.cost_points,
            quantity_limit: item.quantity_limit ?? "",
        });
        setEditingId(item.id);
        setShowForm(true);
    };

    const handleToggle = async (item: RewardItem) => {
        await supabase.from("reward_items").update({ is_active: !item.is_active }).eq("id", item.id);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    };

    const handleDelete = async (id: string) => {
        if (!confirm("이 리워드 아이템을 삭제할까요?")) return;
        await supabase.from("reward_items").delete().eq("id", id);
        setItems(prev => prev.filter(i => i.id !== id));
    };

    return (
        <div className="flex flex-col gap-5">
            {/* 섹션 토글 */}
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--surface-2)" }}>
                {([["items", "🎁 아이템 관리"], ["history", "📋 구매 내역"]] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setActiveSection(key)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{
                            background: activeSection === key ? "var(--background)" : "transparent",
                            color: activeSection === key ? "var(--foreground)" : "var(--foreground-muted)",
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* 아이템 관리 */}
            {activeSection === "items" && (
                <div className="flex flex-col gap-4">
                    {/* 추가 버튼 */}
                    <button
                        onClick={() => {
                            setForm(EMPTY_REWARD_FORM);
                            setEditingId(null);
                            setShowForm(v => !v);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm w-fit"
                        style={{ background: "var(--primary)", color: "white" }}
                    >
                        <Plus size={16} /> 새 리워드 아이템 추가
                    </button>

                    {/* 추가/수정 폼 */}
                    {showForm && (
                        <div className="p-5 rounded-2xl flex flex-col gap-4"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                            <h3 className="text-sm font-black">{editingId ? "리워드 아이템 수정" : "새 리워드 아이템"}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>아이콘 (이모지)</label>
                                    <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                                        className="p-2.5 rounded-xl text-sm outline-none text-center text-2xl"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }} maxLength={4} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>타입</label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                        className="p-2.5 rounded-xl text-sm outline-none"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                                        {REWARD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>아이템 이름</label>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="예) 발표 면제권, 골드 프레임..."
                                    className="p-2.5 rounded-xl text-sm outline-none"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>설명</label>
                                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="이 리워드로 무엇을 얻을 수 있는지 설명해주세요"
                                    rows={2} className="p-2.5 rounded-xl text-sm outline-none resize-none"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>필요 포인트</label>
                                    <input type="number" value={form.cost_points} onChange={e => setForm(p => ({ ...p, cost_points: Number(e.target.value) }))}
                                        className="p-2.5 rounded-xl text-sm outline-none"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>수량 제한 (없으면 빈칸)</label>
                                    <input type="number" value={form.quantity_limit}
                                        onChange={e => setForm(p => ({ ...p, quantity_limit: e.target.value }))}
                                        placeholder="무제한"
                                        className="p-2.5 rounded-xl text-sm outline-none"
                                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSave} disabled={saving || !form.name.trim()}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                                    style={{ background: "var(--primary)" }}>
                                    {saving ? "저장 중..." : "저장"}
                                </button>
                                <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_REWARD_FORM); }}
                                    className="px-4 py-2.5 rounded-xl text-sm font-bold"
                                    style={{ background: "var(--surface)", color: "var(--foreground-muted)" }}>
                                    취소
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 아이템 목록 */}
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} /></div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>등록된 리워드 아이템이 없어요</p>
                            <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>위 버튼으로 첫 번째 아이템을 추가해보세요</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {items.map(item => (
                                <div key={item.id} className="flex items-center gap-3 p-4 rounded-xl"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)", opacity: item.is_active ? 1 : 0.5 }}>
                                    <span className="text-2xl shrink-0">{item.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black truncate" style={{ color: "var(--foreground)" }}>{item.name}</span>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                                style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
                                                {REWARD_TYPES.find(t => t.value === item.type)?.label ?? item.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[10px] font-bold" style={{ color: "var(--highlight)" }}>{item.cost_points.toLocaleString()}P</span>
                                            {item.quantity_limit !== null && (
                                                <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                                    {item.quantity_used}/{item.quantity_limit}개 판매됨
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button onClick={() => handleToggle(item)}
                                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                            style={{
                                                background: item.is_active ? "rgba(6,214,160,0.12)" : "var(--surface-2)",
                                                color: item.is_active ? "var(--accent)" : "var(--foreground-muted)",
                                            }}>
                                            {item.is_active ? "활성" : "비활성"}
                                        </button>
                                        <button onClick={() => handleEdit(item)}
                                            className="p-1.5 rounded-lg transition-colors hover:bg-blue-50"
                                            style={{ color: "var(--secondary)" }}>
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)}
                                            className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                                            style={{ color: "var(--foreground-muted)" }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 구매 내역 */}
            {activeSection === "history" && (
                <div className="flex flex-col gap-3">
                    <p className="text-xs font-semibold px-1" style={{ color: "var(--foreground-muted)" }}>
                        학생들이 구매한 리워드 내역입니다. 실물 보상은 직접 확인 후 지급해주세요.
                    </p>
                    {purchases.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>아직 구매 내역이 없어요</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {purchases.map(p => (
                                <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                    <div>
                                        <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{p.user_name}</span>
                                        <span className="text-xs mx-2" style={{ color: "var(--foreground-muted)" }}>→</span>
                                        <span className="text-sm font-semibold" style={{ color: "var(--secondary)" }}>{p.item_name}</span>
                                    </div>
                                    <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                        {new Date(p.purchased_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─────────────────── 팀 코드 공개 팝업 ─────────────────── */
function TeamCodePopup({ team, onClose }: { team: DbTeam; onClose: () => void }) {
    const code = team.join_code ?? "------";
    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
            style={{ background: team.color ?? "#1a1a2e" }}
            onClick={onClose}
        >
            {/* 닫기 힌트 */}
            <p className="absolute top-6 right-8 text-white/50 text-sm font-bold select-none">
                화면을 클릭하면 닫혀요
            </p>

            {/* 팀 이모지 + 이름 */}
            <div className="flex flex-col items-center gap-6 select-none">
                <div
                    className="text-[120px] leading-none"
                    style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.4))" }}
                >
                    {team.emoji}
                </div>
                <h1
                    className="font-black tracking-tight text-center"
                    style={{ fontSize: "clamp(3rem, 10vw, 7rem)", color: "white", textShadow: "0 4px 24px rgba(0,0,0,0.3)", lineHeight: 1.1 }}
                >
                    {team.name}
                </h1>

                {/* 코드 */}
                <div className="flex flex-col items-center gap-3 mt-4">
                    <p className="text-white/70 font-bold text-lg tracking-widest uppercase">입장 코드</p>
                    <div
                        className="flex gap-3"
                        onClick={e => e.stopPropagation()}
                    >
                        {code.split("").map((ch, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-center font-black"
                                style={{
                                    width: "clamp(56px, 10vw, 88px)",
                                    height: "clamp(72px, 14vw, 112px)",
                                    fontSize: "clamp(2rem, 6vw, 4rem)",
                                    background: "rgba(255,255,255,0.2)",
                                    borderRadius: 20,
                                    color: "white",
                                    border: "2px solid rgba(255,255,255,0.4)",
                                    backdropFilter: "blur(8px)",
                                    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                    letterSpacing: 0,
                                }}
                            >
                                {ch}
                            </div>
                        ))}
                    </div>
                    <p className="text-white/60 text-sm font-semibold mt-2">
                        셀스타그램 가입 화면에서 이 코드를 입력하세요
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────── 팀 관리 탭 ─────────────────── */
interface DbTeam {
    id: string;
    name: string;
    emoji: string;
    color: string;
    join_code?: string;
    created_at: string;
}

const EMOJI_PRESETS = ["🔥", "⚡", "🌊", "🌿", "🦁", "🚀", "🌈", "💎", "🎯", "🏅"];
const COLOR_PRESETS = ["#FF6B35", "#4361EE", "#06D6A0", "#8B5CF6", "#FFC233", "#EF4444", "#EC4899", "#14B8A6"];

function TeamsTab() {
    const [teams, setTeams] = useState<DbTeam[]>([]);
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmoji, setNewEmoji] = useState("🔥");
    const [newColor, setNewColor] = useState("#FF6B35");
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [updatingTeamId, setUpdatingTeamId] = useState<string | null>(null);
    const [msg, setMsg] = useState("");
    const [codePopupTeam, setCodePopupTeam] = useState<DbTeam | null>(null);
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

    // 팀 이름/이모지/색상 편집 상태
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmoji, setEditEmoji] = useState("");
    const [editColor, setEditColor] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    const [editMsg, setEditMsg] = useState("");

    const loadTeams = async () => {
        setLoading(true);
        const { data } = await supabase.from("teams").select("*").order("created_at", { ascending: true });
        setTeams(data ?? []);
        setLoading(false);
    };

    const loadStudents = async () => {
        setLoadingStudents(true);
        const { data } = await supabase.from("profiles").select("id, name, handle, team, points").order("name");
        setStudents(data ?? []);
        setLoadingStudents(false);
    };

    useEffect(() => {
        loadTeams();
        loadStudents();
    }, []);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        setMsg("");
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch("/api/teacher/teams", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ name: newName.trim(), emoji: newEmoji, color: newColor }),
        });
        const json = await res.json();
        if (!res.ok) {
            setMsg(json.error ?? "오류가 발생했어요");
        } else {
            setTeams(prev => [...prev, json.team]);
            setNewName("");
            setNewEmoji("🔥");
            setNewColor("#FF6B35");
            setShowForm(false);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch("/api/teacher/teams", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ id }),
        });
        if (res.ok) {
            setTeams(prev => prev.filter(t => t.id !== id));
            setStudents(prev => prev.map(s => s.team === teams.find(t => t.id === id)?.name ? { ...s, team: null } : s));
        }
        setDeletingId(null);
    };

    const handleUpdateTeam = async (studentId: string, newTeam: string) => {
        setUpdatingTeamId(studentId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const res = await fetch("/api/teacher/update-team", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ studentId, team: newTeam }),
            });
            if (res.ok) {
                setStudents(prev => prev.map(s => s.id === studentId ? { ...s, team: newTeam } : s));
            }
        } catch (err) {
            console.error("팀 배정 오류:", err);
        }
        setUpdatingTeamId(null);
    };

    const handleRegenerateCode = async (team: DbTeam) => {
        setRegeneratingId(team.id);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch("/api/teacher/teams", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
            body: JSON.stringify({ id: team.id }),
        });
        if (res.ok) {
            const json = await res.json();
            setTeams(prev => prev.map(t => t.id === team.id ? json.team : t));
            // 팝업이 열려있으면 업데이트
            setCodePopupTeam(prev => prev?.id === team.id ? json.team : prev);
        }
        setRegeneratingId(null);
    };

    const startEdit = (team: DbTeam) => {
        setEditingId(team.id);
        setEditName(team.name);
        setEditEmoji(team.emoji ?? "🔥");
        setEditColor(team.color ?? "#FF6B35");
        setEditMsg("");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditMsg("");
    };

    const handleEditSave = async () => {
        if (!editingId || !editName.trim()) return;
        setEditSaving(true);
        setEditMsg("");
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch("/api/teacher/teams", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ id: editingId, name: editName.trim(), emoji: editEmoji, color: editColor }),
        });
        const json = await res.json();
        if (!res.ok) {
            setEditMsg(json.error ?? "오류가 발생했어요");
        } else {
            setTeams(prev => prev.map(t => t.id === editingId ? json.team : t));
            // 학생 목록의 team 이름도 동기화
            const oldTeam = teams.find(t => t.id === editingId);
            if (oldTeam && oldTeam.name !== json.team.name) {
                setStudents(prev => prev.map(s => s.team === oldTeam.name ? { ...s, team: json.team.name } : s));
            }
            setEditingId(null);
        }
        setEditSaving(false);
    };

    const memberCount = (teamName: string) => students.filter(s => s.team === teamName).length;

    return (
        <div className="flex flex-col gap-4">
            {/* 안내 + 팀 추가 버튼 */}
            <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1 p-4 rounded-2xl" style={{ background: "var(--secondary-light)" }}>
                    <Users size={18} style={{ color: "var(--secondary)" }} className="shrink-0 mt-0.5" />
                    <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>
                        <strong style={{ color: "var(--secondary)" }}>팀을 자유롭게 만들어보세요.</strong> 팀 이름과 이모지를 직접 설정하고 학생들을 배정할 수 있어요.
                    </p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setMsg(""); }}
                    className="ml-3 shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, var(--secondary), #6B5CE7)" }}
                >
                    <Plus size={16} /> 팀 추가
                </button>
            </div>

            {/* 팀 생성 폼 */}
            {showForm && (
                <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--surface)", border: "1.5px solid var(--secondary)" }}>
                    <h3 className="text-base font-black" style={{ color: "var(--foreground)" }}>새 팀 만들기</h3>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>팀 이름</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="예: 별빛팀, 혜성팀, 마케팅팀..."
                            maxLength={12}
                            className="px-4 py-2.5 rounded-xl text-sm font-bold outline-none"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>이모지</label>
                        <div className="flex flex-wrap gap-2">
                            {EMOJI_PRESETS.map(e => (
                                <button
                                    key={e}
                                    onClick={() => setNewEmoji(e)}
                                    className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110"
                                    style={{
                                        background: newEmoji === e ? "var(--secondary-light)" : "var(--surface-2)",
                                        border: newEmoji === e ? "2px solid var(--secondary)" : "2px solid transparent",
                                    }}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>색상</label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_PRESETS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setNewColor(c)}
                                    className="w-8 h-8 rounded-full transition-all hover:scale-110"
                                    style={{
                                        background: c,
                                        border: newColor === c ? "3px solid var(--foreground)" : "3px solid transparent",
                                        outline: newColor === c ? `2px solid ${c}` : "none",
                                        outlineOffset: "2px",
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 미리보기 */}
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl self-start" style={{ background: `${newColor}18`, border: `1.5px solid ${newColor}40` }}>
                        <span className="text-xl">{newEmoji}</span>
                        <span className="font-black text-sm" style={{ color: newColor }}>{newName || "팀 이름"}</span>
                    </div>

                    {msg && <p className="text-xs font-bold" style={{ color: "#EF4444" }}>{msg}</p>}

                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            disabled={saving || !newName.trim()}
                            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
                            style={{ background: "var(--secondary)" }}
                        >
                            {saving ? "저장 중..." : "팀 만들기"}
                        </button>
                        <button
                            onClick={() => { setShowForm(false); setMsg(""); }}
                            className="px-5 py-2.5 rounded-xl font-bold text-sm"
                            style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}

            {/* 팀 목록 */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h3 className="text-base font-black" style={{ color: "var(--foreground)" }}>등록된 팀</h3>
                </div>
                {loading ? (
                    <div className="py-8 flex justify-center">
                        <Loader2 size={20} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                    </div>
                ) : teams.length === 0 ? (
                    <div className="py-10 text-center">
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>등록된 팀이 없어요</p>
                        <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>위 버튼으로 첫 번째 팀을 만들어보세요!</p>
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                        {teams.map(team => (
                            <div key={team.id}>
                                {/* 일반 행 */}
                                <div className="flex items-center gap-3 px-5 py-4">
                                    <div
                                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                                        style={{ background: `${team.color}18` }}
                                    >
                                        {team.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-base" style={{ color: team.color }}>{team.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                                {memberCount(team.name)}명 배정됨
                                            </span>
                                            {team.join_code ? (
                                                <span
                                                    className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-lg"
                                                    style={{ background: `${team.color}18`, color: team.color, letterSpacing: "0.12em" }}
                                                >
                                                    {team.join_code}
                                                </span>
                                            ) : (
                                                <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>코드 없음</span>
                                            )}
                                        </div>
                                    </div>
                                    {/* 편집 버튼 */}
                                    <button
                                        onClick={() => editingId === team.id ? cancelEdit() : startEdit(team)}
                                        className="p-2 rounded-xl transition-all hover:opacity-80"
                                        title="팀 이름/이모지/색상 수정"
                                        style={{ background: editingId === team.id ? `${team.color}20` : "var(--surface-2)" }}
                                    >
                                        <Pencil size={14} style={{ color: editingId === team.id ? team.color : "var(--foreground-muted)" }} />
                                    </button>
                                    {/* 코드 공개 버튼 */}
                                    <button
                                        onClick={() => setCodePopupTeam(team)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                                        style={{ background: team.color }}
                                        title="팀 코드 공개"
                                    >
                                        <Megaphone size={13} />
                                        코드 공개
                                    </button>
                                    {/* 코드 재생성 */}
                                    <button
                                        onClick={() => handleRegenerateCode(team)}
                                        disabled={regeneratingId === team.id}
                                        className="p-2 rounded-xl transition-all hover:opacity-80 disabled:opacity-50"
                                        title="입장 코드 재생성"
                                        style={{ background: "var(--surface-2)" }}
                                    >
                                        {regeneratingId === team.id
                                            ? <Loader2 size={14} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                                            : <RotateCcw size={14} style={{ color: "var(--foreground-muted)" }} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(team.id)}
                                        disabled={deletingId === team.id}
                                        className="p-2 rounded-xl transition-all hover:bg-red-50 disabled:opacity-50"
                                        title="팀 삭제"
                                    >
                                        {deletingId === team.id
                                            ? <Loader2 size={16} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                                            : <Trash2 size={16} style={{ color: "#EF4444" }} />}
                                    </button>
                                </div>

                                {/* 인라인 편집 폼 */}
                                {editingId === team.id && (
                                    <div className="mx-4 mb-4 rounded-2xl p-4 flex flex-col gap-3" style={{ background: "var(--surface-2)", border: `1.5px solid ${team.color}40` }}>
                                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>팀 정보 수정</p>

                                        {/* 이름 */}
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            placeholder="팀 이름"
                                            maxLength={12}
                                            className="px-3 py-2 rounded-xl text-sm font-bold outline-none"
                                            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                        />

                                        {/* 이모지 */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {EMOJI_PRESETS.map(e => (
                                                <button
                                                    key={e}
                                                    onClick={() => setEditEmoji(e)}
                                                    className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all hover:scale-110"
                                                    style={{
                                                        background: editEmoji === e ? `${editColor}20` : "var(--surface)",
                                                        border: editEmoji === e ? `2px solid ${editColor}` : "2px solid transparent",
                                                    }}
                                                >
                                                    {e}
                                                </button>
                                            ))}
                                        </div>

                                        {/* 색상 */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {COLOR_PRESETS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setEditColor(c)}
                                                    className="w-7 h-7 rounded-full transition-all hover:scale-110"
                                                    style={{
                                                        background: c,
                                                        border: editColor === c ? "3px solid var(--foreground)" : "3px solid transparent",
                                                        outline: editColor === c ? `2px solid ${c}` : "none",
                                                        outlineOffset: "2px",
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {/* 미리보기 */}
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl self-start" style={{ background: `${editColor}18`, border: `1px solid ${editColor}40` }}>
                                            <span className="text-lg">{editEmoji}</span>
                                            <span className="font-black text-sm" style={{ color: editColor }}>{editName || "팀 이름"}</span>
                                        </div>

                                        {editMsg && <p className="text-xs font-bold" style={{ color: "#EF4444" }}>{editMsg}</p>}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleEditSave}
                                                disabled={editSaving || !editName.trim()}
                                                className="flex-1 py-2 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
                                                style={{ background: editColor }}
                                            >
                                                {editSaving ? "저장 중..." : "저장"}
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="px-4 py-2 rounded-xl font-bold text-sm"
                                                style={{ background: "var(--surface)", color: "var(--foreground-muted)" }}
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 학생 팀 배정 */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div>
                        <h3 className="text-base font-black" style={{ color: "var(--foreground)" }}>학생 팀 배정</h3>
                        <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                            {students.length}명 · 드롭다운으로 즉시 변경됩니다
                        </p>
                    </div>
                    <button
                        onClick={loadStudents}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                        style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}
                    >
                        새로고침
                    </button>
                </div>

                {loadingStudents ? (
                    <div className="py-8 flex justify-center">
                        <Loader2 size={16} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                    </div>
                ) : students.length === 0 ? (
                    <div className="py-8 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
                        등록된 학생이 없어요
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                        {students.map(student => {
                            const teamMeta = student.team ? teams.find(t => t.name === student.team) ?? null : null;
                            const isUpdating = updatingTeamId === student.id;
                            return (
                                <div key={student.id} className="flex items-center gap-3 px-5 py-3">
                                    <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shrink-0"
                                        style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}
                                    >
                                        {student.name?.[0] ?? "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>{student.name}</p>
                                        <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>@{student.handle}</p>
                                    </div>
                                    {teamMeta && (
                                        <span
                                            className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                                            style={{ background: `${teamMeta.color}18`, color: teamMeta.color }}
                                        >
                                            {teamMeta.emoji} {student.team}
                                        </span>
                                    )}
                                    <div className="relative shrink-0">
                                        {isUpdating ? (
                                            <div className="w-32 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                                                <Loader2 size={14} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                                            </div>
                                        ) : (
                                            <select
                                                value={student.team ?? "미배정"}
                                                onChange={e => handleUpdateTeam(student.id, e.target.value)}
                                                className="w-32 px-3 py-2 rounded-xl text-xs font-bold outline-none appearance-none cursor-pointer transition-all"
                                                style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                                            >
                                                <option value="미배정">미배정</option>
                                                {teams.map(t => (
                                                    <option key={t.id} value={t.name}>{t.emoji} {t.name}</option>
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

            {/* 팀 코드 공개 팝업 */}
            {codePopupTeam && (
                <TeamCodePopup team={codePopupTeam} onClose={() => setCodePopupTeam(null)} />
            )}
        </div>
    );
}

/* ─────────────────── 주차별 결과 탭 ─────────────────── */
interface WeekPost {
    id: string;
    user_name: string;
    caption: string | null;
    description: string | null;
    image_url: string | null;
    likes: number;
    engagement_rate: string;
    sales: string | null;
    created_at: string;
    week: number | null;
}

function WeeklyResultsTab() {
    const [currentWeek, setCurrentWeekState] = useState<number>(1);
    const [viewWeek, setViewWeek] = useState<number>(1);
    const [posts, setPosts] = useState<WeekPost[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        supabase.from("app_settings").select("current_week").eq("id", 1).single()
            .then(({ data }) => {
                if (data?.current_week) {
                    setCurrentWeekState(data.current_week);
                    setViewWeek(data.current_week);
                }
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        setPostsLoading(true);
        supabase.from("posts").select("*").eq("week", viewWeek).order("created_at", { ascending: false })
            .then(({ data }) => { setPosts(data ?? []); setPostsLoading(false); });
    }, [viewWeek]);

    const handleSetCurrentWeek = async (w: number) => {
        setSaving(true);
        await supabase.from("app_settings").update({ current_week: w }).eq("id", 1);
        setCurrentWeekState(w);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
        </div>
    );

    const windowStart = Math.max(1, currentWeek - 2);

    return (
        <div className="flex flex-col gap-6">
            {/* 현재 주차 제어 */}
            <div className="p-5 rounded-2xl flex flex-col gap-4"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>현재 수업 주차</p>
                        <p className="text-3xl font-black mt-1" style={{ color: "var(--primary)" }}>{currentWeek}주차</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>학생 업로드 시 이 주차가 자동 태그됩니다</p>
                    </div>
                    {saved && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                            style={{ background: "var(--accent)" }}>
                            <CheckCircle2 size={13} /> 저장됨
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleSetCurrentWeek(Math.max(1, currentWeek - 1))}
                        disabled={saving || currentWeek <= 1}
                        className="p-2 rounded-xl disabled:opacity-30"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex-1 flex gap-1.5">
                        {Array.from({ length: 5 }, (_, i) => windowStart + i).filter(w => w <= 29).map(w => (
                            <button key={w} onClick={() => handleSetCurrentWeek(w)} disabled={saving}
                                className="flex-1 py-2 rounded-xl text-sm font-black transition-all"
                                style={{
                                    background: w === currentWeek ? "var(--primary)" : "var(--surface)",
                                    color: w === currentWeek ? "white" : "var(--foreground-muted)",
                                    border: "1px solid var(--border)",
                                }}>
                                {w}주
                            </button>
                        ))}
                    </div>
                    <button onClick={() => handleSetCurrentWeek(Math.min(29, currentWeek + 1))}
                        disabled={saving || currentWeek >= 29}
                        className="p-2 rounded-xl disabled:opacity-30"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* 주차별 결과 조회 */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                        {viewWeek}주차 업로드 결과
                        <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
                            총 {posts.length}개
                        </span>
                    </p>
                    <div className="flex gap-1">
                        {Array.from({ length: 5 }, (_, i) => windowStart + i).filter(w => w <= 29).map(w => (
                            <button key={w} onClick={() => setViewWeek(w)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                                style={{
                                    background: w === viewWeek ? "var(--secondary)" : "var(--surface-2)",
                                    color: w === viewWeek ? "white" : "var(--foreground-muted)",
                                }}>
                                {w}주
                            </button>
                        ))}
                    </div>
                </div>

                {postsLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 size={20} className="animate-spin" style={{ color: "var(--primary)" }} />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center gap-3">
                        <BarChart2 size={36} style={{ color: "var(--foreground-muted)" }} />
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
                            {viewWeek}주차에 업로드된 게시물이 없어요
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {posts.map(post => (
                            <div key={post.id} className="flex items-start gap-3 p-4 rounded-xl"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                {post.image_url && (
                                    <img src={post.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black mb-0.5" style={{ color: "var(--foreground-muted)" }}>{post.user_name}</p>
                                    <p className="text-xs font-bold line-clamp-2" style={{ color: "var(--foreground)" }}>
                                        {post.caption ?? post.description ?? "—"}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[10px] font-bold" style={{ color: "var(--primary)" }}>❤️ {post.likes}</span>
                                        <span className="text-[10px] font-bold" style={{ color: "var(--secondary)" }}>📈 {post.engagement_rate}</span>
                                        {post.sales && post.sales !== "₩0" && (
                                            <span className="text-[10px] font-bold" style={{ color: "var(--accent)" }}>💰 {post.sales}</span>
                                        )}
                                        <span className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>
                                            {new Date(post.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── 교사용 시뮬레이션 모니터 컴포넌트 ──────────────────────
import { generateSimEvents, SimEvent } from "@/lib/simulation/events";

interface TeacherEventExtended extends SimEvent {
    studentName: string;
    postCaption: string;
}

const T_EVENT_META = {
    like:     { color: "#FF6B35", bg: "rgba(255,107,53,0.08)", label: "좋아요", emoji: "❤️" },
    comment:  { color: "#4361EE", bg: "rgba(67,97,238,0.08)",  label: "댓글",   emoji: "💬" },
    share:    { color: "#06D6A0", bg: "rgba(6,214,160,0.08)",  label: "공유",   emoji: "🔗" },
    purchase: { color: "#D97706", bg: "rgba(255,194,51,0.12)", label: "구매",   emoji: "🛍️" },
};

function TeacherEventRow({ event, isNew }: { event: TeacherEventExtended; isNew: boolean }) {
    const [visible, setVisible] = React.useState(!isNew);
    const meta = T_EVENT_META[event.type];

    React.useEffect(() => {
        if (isNew) {
            const raf1 = requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true));
            });
            return () => cancelAnimationFrame(raf1);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            className="flex items-start gap-3 px-4 py-3 transition-all duration-400"
            style={{
                borderBottom: "1px solid var(--border)",
                background: meta.bg,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-8px)",
            }}
        >
            <span className="text-base shrink-0">{event.persona.avatar}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-black" style={{ color: "var(--foreground)" }}>
                        {event.persona.name}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                        {event.persona.age}세
                    </span>
                    <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}44` }}
                    >
                        {meta.emoji} {meta.label}
                    </span>
                    <span className="ml-auto text-[10px] font-semibold shrink-0" style={{ color: "var(--foreground-muted)" }}>
                        {event.simHour}시간째
                    </span>
                </div>
                {event.type === "comment" && event.comment && (
                    <p className="text-[12px] mt-0.5 italic" style={{ color: "var(--foreground-soft)" }}>
                        "{event.comment}"
                    </p>
                )}
                {event.type === "purchase" && (
                    <p className="text-[12px] font-bold mt-0.5" style={{ color: "#D97706" }}>
                        ₩{(event.amount ?? 0).toLocaleString()} 결제
                    </p>
                )}
                <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--foreground-muted)" }}>
                    📝 {event.studentName} · {event.postCaption.slice(0, 30)}{event.postCaption.length > 30 ? "..." : ""}
                </p>
            </div>
        </div>
    );
}

function TeacherSimMonitor({
    startedAt,
    durationMinutes,
    dbPosts,
}: {
    startedAt: string;
    durationMinutes: number;
    dbPosts: DbPost[];
}) {
    const [elapsedMs, setElapsedMs] = React.useState(0);
    const [allEvents, setAllEvents] = React.useState<TeacherEventExtended[]>([]);
    const [visibleEvents, setVisibleEvents] = React.useState<TeacherEventExtended[]>([]);
    const [newEventIds, setNewEventIds] = React.useState<Set<string>>(new Set());
    const [finished, setFinished] = React.useState(false);
    const [logTab, setLogTab] = React.useState<"live" | "result">("live");
    const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const feedRef = React.useRef<HTMLDivElement>(null);
    const lastCountRef = React.useRef(0);

    const durationMs = durationMinutes * 60 * 1000;
    const remainingMs = Math.max(0, durationMs - elapsedMs);
    const remainingMin = Math.floor(remainingMs / 60000);
    const remainingSec = Math.floor((remainingMs % 60000) / 1000);
    const progressPct = Math.min(100, (elapsedMs / durationMs) * 100);

    // 모든 게시물에서 이벤트 생성
    React.useEffect(() => {
        if (!startedAt || dbPosts.length === 0) return;
        const postPosts = dbPosts.filter(p => p.type === "post");
        const merged: TeacherEventExtended[] = [];
        postPosts.forEach(post => {
            const engRate = post.engagement_rate ?? "5%";
            const price = post.sales
                ? parseFloat(String(post.sales).replace(/[^0-9.]/g, "")) || 10000
                : 10000;
            const events = generateSimEvents(post.id, engRate, price, durationMinutes, startedAt);
            events.forEach(e => merged.push({
                ...e,
                id: `${post.id}-${e.id}`,
                studentName: post.user_name,
                postCaption: post.caption ?? "",
            }));
        });
        merged.sort((a, b) => a.realMs - b.realMs);
        setAllEvents(merged);
        setVisibleEvents([]);
        lastCountRef.current = 0;
    }, [startedAt, durationMinutes, dbPosts.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // 타이머
    React.useEffect(() => {
        const tick = () => {
            const elapsed = Date.now() - new Date(startedAt).getTime();
            setElapsedMs(elapsed);
            if (elapsed >= durationMs) {
                setFinished(true);
                if (timerRef.current) clearInterval(timerRef.current);
                setLogTab("result");
            }
        };
        tick();
        timerRef.current = setInterval(tick, 500);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [startedAt, durationMs]);

    // 이벤트 순차 표시
    React.useEffect(() => {
        if (allEvents.length === 0) return;
        const shouldShow = allEvents.filter(e => e.realMs <= elapsedMs);
        if (shouldShow.length > lastCountRef.current) {
            const newOnes = shouldShow.slice(lastCountRef.current);
            setNewEventIds(new Set(newOnes.map(e => e.id)));
            setVisibleEvents(shouldShow);
            lastCountRef.current = shouldShow.length;
            setTimeout(() => setNewEventIds(new Set()), 600);
            if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
    }, [elapsedMs, allEvents]);

    const likes     = visibleEvents.filter(e => e.type === "like").length;
    const comments  = visibleEvents.filter(e => e.type === "comment").length;
    const shares    = visibleEvents.filter(e => e.type === "share").length;
    const purchases = visibleEvents.filter(e => e.type === "purchase").length;
    const revenue   = visibleEvents.filter(e => e.type === "purchase").reduce((s, e) => s + (e.amount ?? 0), 0);

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1.5px solid rgba(6,214,160,0.4)", background: "var(--surface)" }}
        >
            {/* 타이머 헤더 */}
            <div
                className="px-5 py-4"
                style={{
                    background: finished
                        ? "linear-gradient(135deg, #06D6A0, #4361EE)"
                        : "linear-gradient(135deg, #FF6B35, #FFC233)",
                }}
            >
                <div className="flex items-center justify-between mb-2">
                    <p className="text-white/80 text-[11px] font-bold uppercase tracking-wider">
                        {finished ? "시뮬레이션 완료" : "마켓 진행 중"}
                    </p>
                    <div className="flex items-center gap-1.5">
                        {!finished && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                        <span className="text-white/80 text-[11px] font-bold">
                            {finished ? "완료 🎉" : "LIVE"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-black text-white font-outfit tabular-nums">
                        {finished ? "완료!" : `${String(remainingMin).padStart(2, "0")}:${String(remainingSec).padStart(2, "0")}`}
                    </span>
                    <div className="flex gap-4 text-white/90 text-sm font-bold">
                        <span>❤️ {likes}</span>
                        <span>💬 {comments}</span>
                        <span>🔗 {shares}</span>
                        <span>🛍️ {purchases}</span>
                    </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-white/20">
                    <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-white/60 text-[10px]">{Math.floor(elapsedMs / 60000)}분 경과 · 전체 {durationMinutes}분</span>
                    <span className="text-white/60 text-[10px]">총 이벤트 {visibleEvents.length}개</span>
                </div>
            </div>

            {/* 탭 */}
            <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
                {(["live", "result"] as const).map(tab => (
                    <button key={tab} onClick={() => setLogTab(tab)}
                        className="flex-1 py-2.5 text-xs font-bold transition-all"
                        style={{
                            color: logTab === tab ? "var(--accent)" : "var(--foreground-muted)",
                            borderBottom: logTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                        }}>
                        {tab === "live" ? "📡 실시간 반응 로그" : "📊 결과 요약"}
                    </button>
                ))}
            </div>

            {/* 실시간 로그 */}
            {logTab === "live" && (
                <div ref={feedRef} className="overflow-y-auto" style={{ maxHeight: "400px" }}>
                    {visibleEvents.length === 0 ? (
                        <div className="py-10 text-center">
                            <div className="text-2xl mb-2 animate-bounce">⏳</div>
                            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>반응 대기 중...</p>
                        </div>
                    ) : (
                        [...visibleEvents].reverse().map(event => (
                            <TeacherEventRow
                                key={event.id}
                                event={event}
                                isNew={newEventIds.has(event.id)}
                            />
                        ))
                    )}
                </div>
            )}

            {/* 결과 요약 */}
            {logTab === "result" && (
                <div className="p-5">
                    {/* 스탯 그리드 */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                        {[
                            { label: "좋아요", value: likes,     emoji: "❤️", color: "#FF6B35" },
                            { label: "댓글",   value: comments,  emoji: "💬", color: "#4361EE" },
                            { label: "공유",   value: shares,    emoji: "🔗", color: "#06D6A0" },
                            { label: "구매",   value: purchases, emoji: "🛍️", color: "#D97706" },
                        ].map(s => (
                            <div key={s.label} className="rounded-xl p-3 text-center"
                                style={{ background: "var(--surface-2)" }}>
                                <div className="text-xl mb-0.5">{s.emoji}</div>
                                <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                                <div className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* 총 매출 */}
                    <div className="p-3 rounded-xl text-center mb-4"
                        style={{ background: "rgba(255,194,51,0.12)", border: "1.5px solid rgba(255,194,51,0.4)" }}>
                        <p className="text-[10px] font-bold mb-0.5" style={{ color: "#D97706" }}>전체 예상 매출</p>
                        <p className="text-2xl font-black" style={{ color: "#D97706" }}>₩{revenue.toLocaleString()}</p>
                    </div>

                    {/* 구매 상세 */}
                    {purchases > 0 && (
                        <div>
                            <p className="text-[11px] font-bold mb-2 px-1" style={{ color: "var(--foreground-muted)" }}>
                                🛍️ 구매 상세
                            </p>
                            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                                {visibleEvents.filter(e => e.type === "purchase").map(e => (
                                    <div key={e.id} className="flex items-center gap-2 p-2.5 rounded-xl"
                                        style={{ background: "rgba(255,194,51,0.10)" }}>
                                        <span className="text-base">{e.persona.avatar}</span>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[12px] font-black" style={{ color: "var(--foreground)" }}>
                                                {e.persona.name}
                                            </span>
                                            <span className="text-[10px] ml-1" style={{ color: "var(--foreground-muted)" }}>
                                                {e.persona.age}세 · {e.studentName}의 게시물
                                            </span>
                                        </div>
                                        <span className="text-[12px] font-black shrink-0" style={{ color: "#D97706" }}>
                                            ₩{(e.amount ?? 0).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 댓글 상세 */}
                    {comments > 0 && (
                        <div className="mt-3">
                            <p className="text-[11px] font-bold mb-2 px-1" style={{ color: "var(--foreground-muted)" }}>
                                💬 주요 댓글
                            </p>
                            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                                {visibleEvents.filter(e => e.type === "comment").slice(0, 8).map(e => (
                                    <div key={e.id} className="flex items-start gap-2 p-2.5 rounded-xl"
                                        style={{ background: "rgba(67,97,238,0.06)" }}>
                                        <span className="text-base shrink-0">{e.persona.avatar}</span>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[11px] font-bold" style={{ color: "var(--foreground)" }}>
                                                {e.persona.name}
                                            </span>
                                            <span className="text-[10px] ml-1" style={{ color: "var(--foreground-muted)" }}>
                                                ({e.persona.age}세)
                                            </span>
                                            {e.comment && (
                                                <p className="text-[12px] mt-0.5 italic" style={{ color: "var(--foreground-soft)" }}>
                                                    "{e.comment}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
