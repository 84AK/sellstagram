"use client";

import React, { useEffect, useState } from "react";
import {
    BarChart3,
    TrendingUp,
    Users,
    Zap,
    ArrowUpRight,
    Target,
    Sparkles,
    BookOpen,
    Trophy,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { supabase } from "@/lib/supabase/client";

interface TeamRank {
    name: string;
    emoji: string;
    color: string;
    score: number;
}

export default function Insights() {
    const { campaigns, balance, insights, posts, missions, user, setAIReportModal } = useGameStore();
    const [teamRankings, setTeamRankings] = useState<TeamRank[]>([]);

    const totalRevenue = campaigns.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalSpent = campaigns.reduce((acc, curr) => acc + (curr.spent || 0), 0);
    const roas = campaigns.length > 0
        ? totalSpent > 0
            ? (totalRevenue / totalSpent).toFixed(1)
            : (campaigns.reduce((acc, curr) => acc + curr.engagement, 0) / campaigns.length).toFixed(1)
        : "0";

    const totalReach = campaigns.length > 0
        ? campaigns.reduce((acc, curr) => acc + (curr.revenue > 0 ? Math.round(curr.revenue / 0.05) : 500), 0)
        : posts.length * 500;
    const reachDisplay = totalReach >= 1000
        ? (totalReach / 1000).toFixed(1) + "k"
        : String(totalReach);

    const activeMission = missions.find(m => m.isActive && !m.isCompleted) ?? null;

    const loadTeamRankings = async () => {
        const [{ data: profilesData }, { data: teamsData }] = await Promise.all([
            supabase.from("profiles").select("team, points"),
            supabase.from("teams").select("name, emoji, color"),
        ]);

        if (!profilesData) return;

        const teamMeta: Record<string, { emoji: string; color: string }> = {};
        (teamsData ?? []).forEach((t: { name: string; emoji: string; color: string }) => {
            teamMeta[t.name] = { emoji: t.emoji, color: t.color };
        });

        const totals: Record<string, number> = {};
        profilesData.forEach((p: { team: string | null; points: number }) => {
            const t = p.team;
            if (!t) return;
            totals[t] = (totals[t] ?? 0) + (p.points ?? 0);
        });

        const sorted: TeamRank[] = Object.entries(totals)
            .sort((a, b) => b[1] - a[1])
            .map(([name, score]) => ({
                name,
                score,
                emoji: teamMeta[name]?.emoji ?? "🏆",
                color: teamMeta[name]?.color ?? "#FF6B35",
            }));

        setTeamRankings(sorted);
    };

    useEffect(() => {
        loadTeamRankings();

        const ch = supabase
            .channel("insights-profiles")
            .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
                loadTeamRankings();
            })
            .subscribe();

        return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const maxScore = teamRankings[0]?.score ?? 1;

    return (
        <div className="flex flex-col gap-4">

            {/* 마케팅 잔고 카드 */}
            <div
                className="rounded-2xl p-5"
                style={{
                    background: "linear-gradient(135deg, var(--secondary) 0%, #6B5CE7 100%)",
                    boxShadow: "0 6px 20px rgba(67,97,238,0.3)",
                }}
            >
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">
                            마케팅 잔고
                        </p>
                        <h3 className="text-2xl font-black text-white">
                            ₩{balance.toLocaleString()}
                        </h3>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <BarChart3 size={18} className="text-white" />
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-green-300">
                    <TrendingUp size={12} />
                    <span className="text-[10px] font-bold">게시물 {posts.length}개 · 좋아요 {reachDisplay}</span>
                </div>
            </div>

            {/* 캠페인 성과 그리드 */}
            <div className="grid grid-cols-2 gap-3">
                <div
                    className="rounded-2xl p-4 flex flex-col gap-1.5"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <Users size={13} style={{ color: "var(--accent)" }} />
                        <span className="text-[10px] font-bold uppercase" style={{ color: "var(--foreground-muted)" }}>
                            총 도달
                        </span>
                    </div>
                    <span className="text-xl font-black" style={{ color: "var(--foreground)" }}>{reachDisplay || "0"}</span>
                </div>
                <div
                    className="rounded-2xl p-4 flex flex-col gap-1.5"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <Zap size={13} style={{ color: "var(--primary)" }} />
                        <span className="text-[10px] font-bold uppercase" style={{ color: "var(--foreground-muted)" }}>
                            ROAS
                        </span>
                    </div>
                    <span className="text-xl font-black" style={{ color: "var(--primary)" }}>
                        {roas}x
                    </span>
                </div>
            </div>

            {/* 실시간 팀 랭킹 */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <div className="flex items-center gap-2">
                        <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(255,194,51,0.15)" }}
                        >
                            <Trophy size={13} style={{ color: "#D97706" }} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--foreground-soft)" }}>
                            실시간 팀 랭킹
                        </span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "var(--accent)" }}>
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                        LIVE
                    </span>
                </div>

                {teamRankings.length === 0 ? (
                    <div className="py-5 text-center">
                        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                            수업이 시작되면 순위가 표시됩니다
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
                        {teamRankings.map((team, idx) => {
                            const isMyTeam = team.name === user.team;
                            const pct = maxScore > 0 ? Math.round((team.score / maxScore) * 100) : 0;
                            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;

                            return (
                                <div
                                    key={team.name}
                                    className="flex items-center gap-3 px-4 py-2.5 transition-all"
                                    style={{
                                        background: isMyTeam ? `${team.color}0d` : "transparent",
                                    }}
                                >
                                    {/* 순위 */}
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-black"
                                        style={{
                                            background: isMyTeam ? `${team.color}20` : "var(--surface-2)",
                                            color: isMyTeam ? team.color : "var(--foreground-muted)",
                                        }}
                                    >
                                        {medal ?? (idx + 1)}
                                    </div>

                                    {/* 팀 정보 + 점수바 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className="text-xs font-black flex items-center gap-1"
                                                style={{ color: isMyTeam ? team.color : "var(--foreground)" }}
                                            >
                                                <span>{team.emoji}</span>
                                                {team.name}
                                                {isMyTeam && (
                                                    <span
                                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                                        style={{ background: `${team.color}20`, color: team.color }}
                                                    >
                                                        내 팀
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-[10px] font-black shrink-0" style={{ color: team.color }}>
                                                {team.score.toLocaleString()}pt
                                            </span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${pct}%`, background: team.color }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* AI 인사이트 기록 */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                    <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--primary-light)" }}
                    >
                        <Sparkles size={12} style={{ color: "var(--primary)" }} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--foreground-soft)" }}>
                        AI 코칭 기록
                    </h3>
                </div>

                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                    {insights.length === 0 ? (
                        <div
                            className="p-4 rounded-2xl text-center"
                            style={{ background: "var(--surface-2)", border: "1px dashed var(--border)" }}
                        >
                            <p className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                아직 분석 기록이 없어요.
                                <br />첫 콘텐츠를 업로드해보세요!
                            </p>
                        </div>
                    ) : (
                        insights.slice(0, 3).map((insight) => (
                            <button
                                key={insight.id}
                                onClick={() => setAIReportModal(true, insight)}
                                className="group w-full flex flex-col p-3.5 rounded-xl text-left transition-all hover:scale-[1.01]"
                                style={{
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
                                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px var(--primary-light)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                                }}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <span className="text-[11px] font-bold line-clamp-1" style={{ color: "var(--foreground)" }}>
                                        {insight.title}
                                    </span>
                                    <span className="text-[9px] font-semibold shrink-0 ml-2" style={{ color: "var(--foreground-muted)" }}>
                                        {insight.date}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <BookOpen size={10} style={{ color: "var(--accent)" }} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>
                                        리포트 보기
                                    </span>
                                    <ArrowUpRight size={9} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--primary)" }} />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* 미션 진행률 */}
            <div
                className="rounded-2xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                <div className="flex items-center gap-2 mb-3">
                    <Target size={15} style={{ color: "var(--accent)" }} />
                    <span className="text-xs font-black uppercase tracking-wider font-outfit" style={{ color: "var(--foreground-soft)" }}>
                        이번 주 목표
                    </span>
                </div>
                {activeMission ? (
                    <>
                        <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                            {activeMission.title}
                        </p>
                        <p className="text-[10px] mb-2" style={{ color: "var(--foreground-muted)" }}>
                            {activeMission.description}
                        </p>
                        {activeMission.type === "revenue" && (
                            <>
                                <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                    <span style={{ color: "var(--foreground-muted)" }}>₩{totalRevenue.toLocaleString()}</span>
                                    <span style={{ color: "var(--accent)" }}>
                                        {Math.min(100, Math.floor((totalRevenue / activeMission.targetRevenue) * 100))}%
                                    </span>
                                </div>
                                <div className="progress-track">
                                    <div
                                        className="progress-fill progress-orange"
                                        style={{ width: `${Math.min(100, (totalRevenue / activeMission.targetRevenue) * 100)}%` }}
                                    />
                                </div>
                            </>
                        )}
                        {activeMission.type === "posts" && (
                            <>
                                <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                    <span style={{ color: "var(--foreground-muted)" }}>{posts.length}개 업로드</span>
                                    <span style={{ color: "var(--accent)" }}>
                                        {Math.min(100, Math.floor((posts.length / (activeMission.targetCount ?? 1)) * 100))}%
                                    </span>
                                </div>
                                <div className="progress-track">
                                    <div
                                        className="progress-fill progress-orange"
                                        style={{ width: `${Math.min(100, (posts.length / (activeMission.targetCount ?? 1)) * 100)}%` }}
                                    />
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                        {missions.length === 0 ? "선생님이 미션을 등록하면 여기에 표시돼요." : "모든 미션을 완료했어요! 🎉"}
                    </p>
                )}
            </div>
        </div>
    );
}
