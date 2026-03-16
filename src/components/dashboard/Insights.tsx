"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
    X,
    ShoppingCart,
    Heart,
    MessageCircle,
    Share2,
    Wallet,
    FileText,
    Megaphone,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { supabase } from "@/lib/supabase/client";
import TermTooltip from "@/components/common/TermTooltip";

const AD_PLANS = [
    { dailyBudget: 3000,  label: "스타터",   mult: 1.3, emoji: "🌱", dailyReach: 300 },
    { dailyBudget: 10000, label: "부스트",   mult: 2.0, emoji: "🚀", dailyReach: 1000 },
    { dailyBudget: 30000, label: "프리미엄", mult: 3.5, emoji: "💎", dailyReach: 3500 },
];

interface ActiveAd {
    id: string;
    post_id: string;
    total_budget: number;
    daily_budget: number;
    duration_days: number;
    mult: number;
    start_date: string;
    end_date: string;
    impressions: number;
    landing_visits: number;
    simulated_purchases: number;
    simulated_revenue: number;
    last_simulated_at: string | null;
    post_caption: string | null;
    post_image: string | null;
    post_selling_price: number | null;
    post_seller_user_id: string | null;
}

interface TeamRank {
    name: string;
    emoji: string;
    color: string;
    score: number;
}

interface SimResult {
    id: string;
    post_caption: string;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    total_purchases: number;
    total_revenue: number;
    duration_minutes: number;
    session_started_at: string;
}

export default function Insights() {
    const { campaigns, balance, insights, posts, missions, user, setAIReportModal, addFunds } = useGameStore();
    const [teamRankings, setTeamRankings] = useState<TeamRank[]>([]);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [realStats, setRealStats] = useState({ totalEngagement: 0, avgEngagementRate: 0, postCount: 0 });
    const [activeAds, setActiveAds] = useState<ActiveAd[]>([]);

    const totalRevenue = campaigns.reduce((acc, curr) => acc + curr.revenue, 0);

    const activeMission = missions.find(m => m.isActive && !m.isCompleted) ?? null;

    // 내 게시물만 (미션 진행률 계산용)
    const myPostCount = posts.filter(p => p.user?.handle === user.handle).length;

    const loadActiveAds = async () => {
        if (!user.handle) return;
        const nowIso = new Date().toISOString();

        // 종료된 캠페인 완료 처리
        await supabase.from("ad_campaigns")
            .update({ status: "completed" })
            .eq("user_handle", user.handle)
            .eq("status", "active")
            .lt("end_date", nowIso);

        const { data: campaignsData } = await supabase
            .from("ad_campaigns")
            .select("id,post_id,total_budget,daily_budget,duration_days,mult,start_date,end_date,impressions,landing_visits,simulated_purchases,simulated_revenue,last_simulated_at")
            .eq("user_handle", user.handle)
            .eq("status", "active")
            .order("created_at", { ascending: false });

        if (!campaignsData || campaignsData.length === 0) { setActiveAds([]); return; }

        // post 정보 병합
        const postIds = campaignsData.map(c => c.post_id);
        const { data: postsData } = await supabase
            .from("posts")
            .select("id,caption,image_url,selling_price,seller_user_id")
            .in("id", postIds);
        const postMap: Record<string, { caption: string | null; image_url: string | null; selling_price: number | null; seller_user_id: string | null }> = {};
        (postsData ?? []).forEach(p => { postMap[p.id] = p; });

        const merged: ActiveAd[] = campaignsData.map(c => ({
            ...c,
            post_caption: postMap[c.post_id]?.caption ?? null,
            post_image: postMap[c.post_id]?.image_url ?? null,
            post_selling_price: postMap[c.post_id]?.selling_price ?? null,
            post_seller_user_id: postMap[c.post_id]?.seller_user_id ?? null,
        }));

        // ── AI 시뮬레이션 엔진 ──
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id ?? null;

        for (const ad of merged) {
            const now = new Date();
            const lastSim = ad.last_simulated_at ? new Date(ad.last_simulated_at) : new Date(ad.start_date);
            const elapsedHours = (now.getTime() - lastSim.getTime()) / 3600000;

            // 30분 미만이면 스킵
            if (elapsedHours < 0.5) continue;

            const plan = AD_PLANS.find(p => p.dailyBudget === ad.daily_budget) ?? AD_PLANS[0];
            const hourlyReach = plan.dailyReach / 24;

            // 노출 (±25% 랜덤)
            const randomFactor = 0.75 + Math.random() * 0.5;
            const newImpressions = Math.round(hourlyReach * elapsedHours * randomFactor);

            // 랜딩 방문 CTR: 3~12%
            const ctr = 0.03 + Math.random() * 0.09;
            const newLandingVisits = Math.round(newImpressions * ctr);

            // 구매 전환율 CVR: 1~6%
            const cvr = 0.01 + Math.random() * 0.05;
            const newPurchases = Math.round(newLandingVisits * cvr);

            const sellingPrice = ad.post_selling_price ?? 0;
            const newRevenue = newPurchases * sellingPrice;

            // DB 업데이트
            const updatedImpressions = (ad.impressions ?? 0) + newImpressions;
            const updatedLandingVisits = (ad.landing_visits ?? 0) + newLandingVisits;
            const updatedPurchases = (ad.simulated_purchases ?? 0) + newPurchases;
            const updatedRevenue = (ad.simulated_revenue ?? 0) + newRevenue;

            await supabase.from("ad_campaigns").update({
                impressions: updatedImpressions,
                landing_visits: updatedLandingVisits,
                simulated_purchases: updatedPurchases,
                simulated_revenue: updatedRevenue,
                last_simulated_at: now.toISOString(),
            }).eq("id", ad.id);

            // 구매 발생 시 판매자 잔고 + sold_count 업데이트
            if (newPurchases > 0 && sellingPrice > 0) {
                // sold_count 증가
                const { data: postRow } = await supabase.from("posts").select("sold_count").eq("id", ad.post_id).single();
                await supabase.from("posts").update({ sold_count: (postRow?.sold_count ?? 0) + newPurchases }).eq("id", ad.post_id);

                // 판매자 프로필 잔고 증가
                if (ad.post_seller_user_id) {
                    const { data: sellerProf } = await supabase.from("profiles").select("balance").eq("id", ad.post_seller_user_id).single();
                    await supabase.from("profiles").update({ balance: (sellerProf?.balance ?? 0) + newRevenue }).eq("id", ad.post_seller_user_id);
                    // 현재 유저가 판매자면 Zustand도 업데이트
                    if (userId && userId === ad.post_seller_user_id) {
                        addFunds(newRevenue);
                    }
                }
            }

            // 로컬 상태 반영
            ad.impressions = updatedImpressions;
            ad.landing_visits = updatedLandingVisits;
            ad.simulated_purchases = updatedPurchases;
            ad.simulated_revenue = updatedRevenue;
        }

        setActiveAds(merged);
    };

    const loadRealStats = async () => {
        if (!user.handle) return;
        const { data } = await supabase
            .from("posts")
            .select("likes, comments, shares, engagement_rate")
            .eq("user_handle", user.handle);
        if (!data || data.length === 0) {
            setRealStats({ totalEngagement: 0, avgEngagementRate: 0, postCount: 0 });
            return;
        }

        const totalEng = data.reduce((acc, p) =>
            acc + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0);
        const rates = data
            .map((p: { engagement_rate: string | null }) =>
                parseFloat((p.engagement_rate ?? "0").replace("%", "")))
            .filter((r: number) => !isNaN(r) && r > 0);
        const avgRate = rates.length > 0
            ? rates.reduce((a: number, b: number) => a + b, 0) / rates.length
            : 0;

        setRealStats({ totalEngagement: totalEng, avgEngagementRate: avgRate, postCount: data.length });
    };

    const engDisplay = realStats.totalEngagement >= 1000
        ? (realStats.totalEngagement / 1000).toFixed(1) + "k"
        : String(realStats.totalEngagement);

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
        loadRealStats();
        loadActiveAds();

        const ch = supabase
            .channel("insights-live")
            .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
                loadTeamRankings();
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
                loadRealStats();
                loadActiveAds();
            })
            .subscribe();

        return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.handle]);

    const maxScore = teamRankings[0]?.score ?? 1;

    return (
        <div className="flex flex-col gap-4">

            {/* 활동 통계 모달 */}
            {showStatsModal && typeof window !== "undefined" && createPortal(
                <StatsModal
                    user={user}
                    balance={balance}
                    posts={posts}
                    campaigns={campaigns}
                    onClose={() => setShowStatsModal(false)}
                />,
                document.body
            )}

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
                        <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                                마케팅 잔고
                            </p>
                            <TermTooltip termKey="balance" size={11} className="opacity-70" />
                        </div>
                        <h3 className="text-2xl font-black text-white">
                            ₩{balance.toLocaleString()}
                        </h3>
                    </div>
                    <button
                        onClick={() => setShowStatsModal(true)}
                        className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all active:scale-95"
                        aria-label="활동 통계 보기"
                    >
                        <BarChart3 size={18} className="text-white" />
                    </button>
                </div>
                <div className="flex items-center gap-1.5 text-green-300">
                    <TrendingUp size={12} />
                    <span className="text-[10px] font-bold">게시물 {realStats.postCount}개 · 총 반응 {engDisplay}</span>
                </div>
            </div>

            {/* 실시간 참여 지표 그리드 */}
            <div className="grid grid-cols-2 gap-3">
                <div
                    className="rounded-2xl p-4 flex flex-col gap-1.5"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <Heart size={13} style={{ color: "var(--accent)" }} />
                        <span className="text-[10px] font-bold uppercase" style={{ color: "var(--foreground-muted)" }}>
                            총 인게이지먼트
                        </span>
                    </div>
                    <span className="text-xl font-black" style={{ color: "var(--foreground)" }}>
                        {engDisplay || "0"}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                        좋아요·댓글·공유 합계
                    </span>
                </div>
                <div
                    className="rounded-2xl p-4 flex flex-col gap-1.5"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <Zap size={13} style={{ color: "var(--primary)" }} />
                        <span className="text-[10px] font-bold uppercase" style={{ color: "var(--foreground-muted)" }}>
                            평균 참여율
                        </span>
                        <TermTooltip termKey="engagement" size={12} />
                    </div>
                    <span className="text-xl font-black" style={{ color: "var(--primary)" }}>
                        {realStats.postCount > 0 ? realStats.avgEngagementRate.toFixed(1) : "0"}%
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                        게시물 {realStats.postCount}개 기준
                    </span>
                </div>
            </div>

            {/* 광고 현황 */}
            {activeAds.length > 0 && (
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
                                style={{ background: "rgba(255,107,53,0.15)" }}
                            >
                                <Megaphone size={13} style={{ color: "var(--primary)" }} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--foreground-soft)" }}>
                                진행 중인 광고
                            </span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "var(--primary)" }}>
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse inline-block" />
                            {activeAds.length}개
                        </span>
                    </div>

                    <div className="flex flex-col">
                        {activeAds.map((ad, idx) => {
                            const now = Date.now();
                            const start = new Date(ad.start_date).getTime();
                            const end = new Date(ad.end_date).getTime();
                            const elapsedDays = Math.min((now - start) / 86400000, ad.duration_days);
                            const remainDays = Math.max(0, Math.ceil((end - now) / 86400000));
                            const activePlan = AD_PLANS.find(p => p.dailyBudget === ad.daily_budget) ?? AD_PLANS[0];
                            const simImpressions = Math.round(elapsedDays * activePlan.dailyReach);
                            const progressPct = Math.min(100, (elapsedDays / ad.duration_days) * 100);

                            return (
                                <div key={ad.id} className="px-4 py-3 flex flex-col gap-2.5"
                                    style={{ borderTop: idx === 0 ? "none" : "1px solid var(--border)" }}>
                                    {/* 상단: 썸네일 + 기본 정보 */}
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                            {ad.post_image
                                                ? <img src={ad.post_image} alt="" className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center font-black" style={{ color: "var(--border)" }}>S</div>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold truncate" style={{ color: "var(--foreground)" }}>
                                                {ad.post_caption?.slice(0, 28) || "게시물"}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                                    style={{ background: "rgba(217,119,6,0.12)", color: "#D97706" }}>
                                                    {activePlan.emoji} {activePlan.label} ×{ad.mult}배
                                                </span>
                                                <span className="text-[10px] font-bold" style={{ color: remainDays <= 1 ? "#EF4444" : "var(--foreground-muted)" }}>
                                                    D-{remainDays}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 성과 지표 */}
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            { label: "노출", value: ad.impressions.toLocaleString(), color: "var(--secondary)" },
                                            { label: "랜딩 방문", value: ad.landing_visits.toLocaleString(), color: "var(--accent)" },
                                            { label: "구매 건수", value: `${ad.simulated_purchases}건`, color: "var(--primary)" },
                                            { label: "시뮬 매출", value: `₩${ad.simulated_revenue.toLocaleString()}`, color: "#06D6A0" },
                                        ].map(m => (
                                            <div key={m.label} className="rounded-xl p-2 text-center"
                                                style={{ background: "var(--surface-2)" }}>
                                                <p className="text-[9px] font-bold mb-0.5" style={{ color: "var(--foreground-muted)" }}>{m.label}</p>
                                                <p className="text-[11px] font-black" style={{ color: m.color }}>{m.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 기간 프로그레스 바 */}
                                    <div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                                            <div className="h-full rounded-full"
                                                style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #D97706, #F59E0B)", transition: "width 0.5s" }} />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>
                                                {new Date(ad.start_date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                                            </span>
                                            <span className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>
                                                {new Date(ad.end_date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
                    <div className="flex flex-col">
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
                                        borderTop: idx === 0 ? "none" : "1px solid var(--border)",
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
                                    <span style={{ color: "var(--foreground-muted)" }}>{myPostCount}개 업로드</span>
                                    <span style={{ color: "var(--accent)" }}>
                                        {Math.min(100, Math.floor((myPostCount / (activeMission.targetCount ?? 1)) * 100))}%
                                    </span>
                                </div>
                                <div className="progress-track">
                                    <div
                                        className="progress-fill progress-orange"
                                        style={{ width: `${Math.min(100, (myPostCount / (activeMission.targetCount ?? 1)) * 100)}%` }}
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

/* ── 활동 통계 모달 ── */
interface StatsModalProps {
    user: { name: string; handle: string; team: string; points: number };
    balance: number;
    posts: { id: string; stats: { likes: number | string; engagement?: number | string; sales?: number | string; comments?: string; shares?: string } }[];
    campaigns: { revenue: number; engagement: number; spent?: number }[];
    onClose: () => void;
}

function StatsModal({ user, balance, posts, campaigns, onClose }: StatsModalProps) {
    const [simResults, setSimResults] = useState<SimResult[]>([]);
    const [tab, setTab] = useState<"summary" | "sims" | "posts">("summary");

    // 내 게시물만 필터링
    const myPosts = posts.filter(p => (p as unknown as { user: { handle: string } }).user?.handle === user.handle);

    useEffect(() => {
        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            const { data } = await supabase
                .from("simulation_results")
                .select("id, post_caption, total_likes, total_comments, total_shares, total_purchases, total_revenue, duration_minutes, session_started_at")
                .eq("user_id", session.user.id)
                .order("session_started_at", { ascending: false })
                .limit(20);
            if (data) setSimResults(data as SimResult[]);
        };
        load();
    }, []);

    const totalRevenue = simResults.reduce((s, r) => s + r.total_revenue, 0);
    const totalLikes = simResults.reduce((s, r) => s + r.total_likes, 0);
    const totalComments = simResults.reduce((s, r) => s + r.total_comments, 0);
    const totalShares = simResults.reduce((s, r) => s + r.total_shares, 0);
    const totalPurchases = simResults.reduce((s, r) => s + r.total_purchases, 0);
    const totalSpent = campaigns.reduce((s, c) => s + (c.spent ?? 0), 0);

    const statItems = [
        { icon: <FileText size={18} />, label: "게시물", value: `${myPosts.length}개`, color: "var(--secondary)" },
        { icon: <Heart size={18} />, label: "총 좋아요", value: totalLikes.toLocaleString(), color: "#EF4444" },
        { icon: <MessageCircle size={18} />, label: "총 댓글", value: totalComments.toLocaleString(), color: "var(--accent)" },
        { icon: <Share2 size={18} />, label: "총 공유", value: totalShares.toLocaleString(), color: "#8B5CF6" },
        { icon: <ShoppingCart size={18} />, label: "총 구매", value: `${totalPurchases}건`, color: "var(--primary)" },
        { icon: <Wallet size={18} />, label: "총 매출", value: `₩${totalRevenue.toLocaleString()}`, color: "#06D6A0" },
    ];

    return (
        <>
            {/* 딤 배경 */}
            <div
                className="fixed inset-0 z-[9998]"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                onClick={onClose}
            />

            {/* 모달 */}
            <div
                className="fixed z-[9999] flex flex-col"
                style={{
                    top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(520px, 95vw)",
                    maxHeight: "88vh",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "24px",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
                    overflow: "hidden",
                }}
            >
                {/* 헤더 */}
                <div
                    className="flex items-center justify-between px-6 py-5 shrink-0"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <div>
                        <h2 className="text-lg font-black" style={{ color: "var(--foreground)" }}>
                            📊 나의 활동 통계
                        </h2>
                        <p className="text-sm mt-0.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
                            {user.name} · {user.team} · {user.points.toLocaleString()}pt
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-foreground/5 transition-colors"
                        style={{ color: "var(--foreground-muted)" }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 잔고 배너 */}
                <div
                    className="mx-5 mt-5 rounded-2xl px-5 py-4 flex items-center justify-between shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--secondary) 0%, #6B5CE7 100%)" }}
                >
                    <div>
                        <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">현재 마케팅 잔고</p>
                        <p className="text-2xl font-black text-white">₩{balance.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-white/70 mb-1">시뮬 총 매출</p>
                        <p className="text-xl font-black text-green-300">+₩{totalRevenue.toLocaleString()}</p>
                    </div>
                </div>

                {/* 탭 */}
                <div className="flex gap-2 px-5 pt-4 shrink-0">
                    {(["summary", "sims", "posts"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
                            style={{
                                background: tab === t ? "var(--primary)" : "var(--surface-2)",
                                color: tab === t ? "white" : "var(--foreground-soft)",
                            }}
                        >
                            {t === "summary" ? "요약" : t === "sims" ? "시뮬레이션" : "게시물"}
                        </button>
                    ))}
                </div>

                {/* 탭 내용 */}
                <div className="overflow-y-auto flex-1 px-5 py-4 custom-scrollbar">

                    {/* 요약 탭 */}
                    {tab === "summary" && (
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                {statItems.map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl p-4 flex flex-col gap-2"
                                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                                    >
                                        <div className="flex items-center gap-2" style={{ color: item.color }}>
                                            {item.icon}
                                            <span className="text-xs font-bold" style={{ color: "var(--foreground-muted)" }}>
                                                {item.label}
                                            </span>
                                        </div>
                                        <span className="text-2xl font-black" style={{ color: item.color }}>
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {totalSpent > 0 && (
                                <div
                                    className="rounded-2xl p-4"
                                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                                >
                                    <p className="text-xs font-bold uppercase mb-3" style={{ color: "var(--foreground-muted)" }}>수익 분석</p>
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span style={{ color: "var(--foreground-soft)" }}>총 매출</span>
                                        <span style={{ color: "#06D6A0" }}>+₩{totalRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span style={{ color: "var(--foreground-soft)" }}>총 지출</span>
                                        <span style={{ color: "var(--primary)" }}>-₩{totalSpent.toLocaleString()}</span>
                                    </div>
                                    <div
                                        className="flex justify-between text-sm font-black pt-2"
                                        style={{ borderTop: "1px solid var(--border)" }}
                                    >
                                        <span style={{ color: "var(--foreground)" }}>순이익</span>
                                        <span style={{ color: totalRevenue - totalSpent >= 0 ? "#06D6A0" : "var(--primary)" }}>
                                            {totalRevenue - totalSpent >= 0 ? "+" : ""}₩{(totalRevenue - totalSpent).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 시뮬레이션 내역 탭 */}
                    {tab === "sims" && (
                        <div className="flex flex-col gap-3">
                            {simResults.length === 0 ? (
                                <p className="text-center text-sm py-10" style={{ color: "var(--foreground-muted)" }}>
                                    아직 시뮬레이션 기록이 없어요
                                </p>
                            ) : simResults.map((r) => (
                                <div
                                    key={r.id}
                                    className="rounded-2xl p-4"
                                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <p className="text-sm font-bold line-clamp-2 flex-1 mr-3" style={{ color: "var(--foreground)" }}>
                                            {r.post_caption || "게시물"}
                                        </p>
                                        <span className="text-base shrink-0 font-black" style={{ color: "#06D6A0" }}>
                                            +₩{r.total_revenue.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex gap-3 text-sm font-bold" style={{ color: "var(--foreground-muted)" }}>
                                        <span>❤️ {r.total_likes}</span>
                                        <span>💬 {r.total_comments}</span>
                                        <span>🔗 {r.total_shares}</span>
                                        <span>🛍️ {r.total_purchases}건</span>
                                        <span className="ml-auto text-xs">{r.duration_minutes}분</span>
                                    </div>
                                    <p className="text-xs mt-2" style={{ color: "var(--foreground-muted)" }}>
                                        {new Date(r.session_started_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 게시물 탭 */}
                    {tab === "posts" && (
                        <div className="flex flex-col gap-3">
                            {myPosts.length === 0 ? (
                                <p className="text-center text-sm py-10" style={{ color: "var(--foreground-muted)" }}>
                                    아직 게시물이 없어요
                                </p>
                            ) : myPosts.map((p, i) => {
                                const likes = typeof p.stats.likes === "number" ? p.stats.likes : parseFloat(String(p.stats.likes)) || 0;
                                return (
                                    <div
                                        key={p.id}
                                        className="rounded-2xl p-4 flex items-center gap-4"
                                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base font-black"
                                            style={{ background: "var(--surface)", color: "var(--foreground-muted)" }}
                                        >
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate mb-1" style={{ color: "var(--foreground)" }}>
                                                게시물 #{i + 1}
                                            </p>
                                            <div className="flex gap-3 text-sm font-bold" style={{ color: "var(--foreground-muted)" }}>
                                                <span>❤️ {likes.toLocaleString()}</span>
                                                <span>📊 {parseFloat(String(p.stats.engagement ?? 0)).toFixed(1)}%</span>
                                                {p.stats.sales && <span>🛍️ {p.stats.sales}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
