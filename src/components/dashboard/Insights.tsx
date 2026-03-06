"use client";

import React from "react";
import GlassCard from "@/components/common/GlassCard";
import {
    BarChart3,
    TrendingUp,
    Users,
    Zap,
    ArrowUpRight,
    Target,
    Sparkles,
    BookOpen,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";

export default function Insights() {
    const { campaigns, balance, insights, posts, missions, setAIReportModal } = useGameStore();

    const totalRevenue = campaigns.reduce((acc, curr) => acc + curr.revenue, 0);
    const avgEfficiency =
        campaigns.length > 0
            ? (campaigns.reduce((acc, curr) => acc + curr.efficiency, 0) / campaigns.length).toFixed(1)
            : "0";

    // 실제 게시물 좋아요 합산 → 총 도달
    const totalReach = posts.reduce((sum, p) => {
        const l = typeof p.stats.likes === "number"
            ? p.stats.likes
            : parseFloat(String(p.stats.likes).replace(/k/i, "000") || "0");
        return sum + l;
    }, 0);
    const reachDisplay = totalReach >= 1000
        ? (totalReach / 1000).toFixed(1) + "k"
        : String(totalReach);

    // 첫 번째 활성 미션을 이번 주 목표로 표시
    const activeMission = missions.find(m => m.isActive && !m.isCompleted) ?? null;

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
                        {avgEfficiency}x
                    </span>
                </div>
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

                <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
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
                        insights.map((insight) => (
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
