"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
    Heart,
    MessageCircle,
    Share2,
    ShoppingBag,
    Clock,
    TrendingUp,
    ChevronLeft,
    Copy,
    CheckCircle,
    Zap,
    Play,
    Pause,
    List,
    Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useGameStore } from "@/store/useGameStore";
import { generateSimEvents, SimEvent, AiComment } from "@/lib/simulation/events";
import type { SimAnalysisResult } from "@/app/api/simulate/analyze-post/route";

interface SimState {
    active: boolean;
    startedAt: string | null;
    durationMinutes: number;
}

// 광고 예산별 전환 배율 (FeedCard와 동일)
const AD_PLANS_SIM = [
    { budget: 3000,  mult: 1.3 },
    { budget: 10000, mult: 2.0 },
    { budget: 30000, mult: 3.5 },
];

interface SimPost {
    id: string;
    caption: string;
    imageUrl: string;
    engagementRate: string;
    productPrice: number;
    tags: string[];
    landingImages: string[];
    adBudget?: number;
}

const EVENT_META = {
    like:     { icon: Heart,          color: "#FF6B35", bg: "rgba(255,107,53,0.10)", label: "좋아요",  emoji: "❤️" },
    comment:  { icon: MessageCircle,  color: "#4361EE", bg: "rgba(67,97,238,0.10)",  label: "댓글",    emoji: "💬" },
    share:    { icon: Share2,         color: "#06D6A0", bg: "rgba(6,214,160,0.10)",  label: "공유",    emoji: "🔗" },
    purchase: { icon: ShoppingBag,    color: "#D97706", bg: "rgba(255,194,51,0.14)", label: "구매",    emoji: "🛍️" },
};

// ─── 이벤트 피드 아이템 (로컬 visible 상태로 영구 표시) ─────
function EventItem({ event, isNew }: { event: SimEvent; isNew: boolean }) {
    const [visible, setVisible] = useState(!isNew);
    const meta = EVENT_META[event.type];
    const Icon = meta.icon;

    useEffect(() => {
        if (isNew) {
            // 두 프레임 후 visible → 슬라이드인 애니메이션
            const raf1 = requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true));
            });
            return () => cancelAnimationFrame(raf1);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            className="flex items-start gap-3 p-3 rounded-2xl transition-all duration-400"
            style={{
                background: meta.bg,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(12px)",
            }}
        >
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base font-bold"
                style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontSize: "18px" }}
            >
                {event.persona.avatar}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                        {event.persona.name}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                        ({event.persona.age}세)
                    </span>
                    <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ background: meta.bg, border: `1px solid ${meta.color}33` }}>
                        <Icon size={11} style={{ color: meta.color }} />
                        <span className="text-[10px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
                    </div>
                </div>
                {event.type === "comment" && event.comment && (
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                        "{event.comment}"
                    </p>
                )}
                {event.type === "purchase" && (
                    <p className="text-[13px] font-bold" style={{ color: "#D97706" }}>
                        ₩{(event.amount ?? 0).toLocaleString()} 결제 완료 🎉
                    </p>
                )}
                {event.type === "share" && (
                    <p className="text-[13px]" style={{ color: "var(--foreground-muted)" }}>
                        친구에게 게시물을 공유했어요
                    </p>
                )}
                {event.type === "like" && (
                    <p className="text-[13px]" style={{ color: "var(--foreground-muted)" }}>
                        게시물에 좋아요를 눌렀어요
                    </p>
                )}
                <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "var(--foreground-muted)" }}>
                    시뮬 {event.simHour}시간째
                </p>
            </div>
        </div>
    );
}

// ─── 결과 카드 (상세 로그 포함) ────────────────────────────
function ResultCard({
    events,
    post,
    durationMinutes,
    onSave,
    isSaving,
    saved,
}: {
    events: SimEvent[];
    post: SimPost;
    durationMinutes: number;
    onSave: () => void;
    isSaving: boolean;
    saved: boolean;
}) {
    const [copied, setCopied] = useState(false);
    const [logTab, setLogTab] = useState<"summary" | "log">("summary");

    const likes     = events.filter(e => e.type === "like").length;
    const comments  = events.filter(e => e.type === "comment").length;
    const shares    = events.filter(e => e.type === "share").length;
    const purchases = events.filter(e => e.type === "purchase").length;
    const revenue   = events.filter(e => e.type === "purchase").reduce((s, e) => s + (e.amount ?? 0), 0);

    const summaryText =
        `📊 마켓 시뮬레이션 결과\n\n` +
        `📝 게시물: ${post.caption.slice(0, 40)}...\n` +
        `⏱️ 시뮬레이션: ${durationMinutes}분 (${durationMinutes}시간 분량)\n\n` +
        `❤️ 좋아요: ${likes}개\n💬 댓글: ${comments}개\n🔗 공유: ${shares}개\n🛍️ 구매: ${purchases}건\n` +
        `💰 총 매출: ₩${revenue.toLocaleString()}\n\n✨ Sellstagram 마케팅 실습 결과`;

    const handleCopy = () => {
        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-3xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>

            {/* 헤더 */}
            <div className="px-6 py-5"
                style={{ background: "linear-gradient(135deg, #FF6B35 0%, #FFC233 100%)" }}>
                <div className="flex items-center gap-2 mb-1">
                    <Zap size={20} className="text-white" />
                    <h2 className="text-lg font-black text-white font-outfit">마켓 시뮬레이션 완료!</h2>
                </div>
                <p className="text-white/80 text-sm">
                    {durationMinutes}분 동안 {durationMinutes}시간의 마켓 반응이 시뮬레이션됐어요
                </p>
            </div>

            {/* 탭 */}
            <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
                {(["summary", "log"] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setLogTab(tab)}
                        className="flex-1 py-3 text-xs font-bold transition-all"
                        style={{
                            color: logTab === tab ? "var(--primary)" : "var(--foreground-muted)",
                            borderBottom: logTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
                            background: "transparent",
                        }}
                    >
                        {tab === "summary" ? "📊 요약" : "📋 상세 로그"}
                    </button>
                ))}
            </div>

            {/* 요약 탭 */}
            {logTab === "summary" && (
                <>
                    <div className="grid grid-cols-2 gap-3 p-5">
                        {[
                            { label: "좋아요", value: likes,     emoji: "❤️", color: "#FF6B35" },
                            { label: "댓글",   value: comments,  emoji: "💬", color: "#4361EE" },
                            { label: "공유",   value: shares,    emoji: "🔗", color: "#06D6A0" },
                            { label: "구매",   value: purchases, emoji: "🛍️", color: "#D97706" },
                        ].map(s => (
                            <div key={s.label} className="rounded-2xl p-4 text-center"
                                style={{ background: "var(--surface-2)" }}>
                                <div className="text-2xl mb-1">{s.emoji}</div>
                                <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                                <div className="text-[11px] font-semibold" style={{ color: "var(--foreground-muted)" }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mx-5 mb-5 p-4 rounded-2xl text-center"
                        style={{ background: "rgba(255,194,51,0.12)", border: "1.5px solid rgba(255,194,51,0.4)" }}>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "#D97706" }}>총 예상 매출</p>
                        <p className="text-3xl font-black" style={{ color: "#D97706" }}>₩{revenue.toLocaleString()}</p>
                    </div>
                </>
            )}

            {/* 상세 로그 탭 */}
            {logTab === "log" && (
                <div className="p-4 overflow-y-auto" style={{ maxHeight: "360px" }}>
                    {events.length === 0 ? (
                        <p className="text-center text-xs py-8" style={{ color: "var(--foreground-muted)" }}>이벤트 없음</p>
                    ) : (
                        <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
                            {events.map((e) => {
                                const meta = EVENT_META[e.type];
                                const Icon = meta.icon;
                                return (
                                    <div key={e.id} className="flex items-start gap-3 py-3">
                                        <span className="text-lg shrink-0">{e.persona.avatar}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[13px] font-black" style={{ color: "var(--foreground)" }}>
                                                    {e.persona.name}
                                                </span>
                                                <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                                    {e.persona.age}세
                                                </span>
                                                <div className="flex items-center gap-1 ml-1">
                                                    <Icon size={10} style={{ color: meta.color }} />
                                                    <span className="text-[10px] font-bold" style={{ color: meta.color }}>
                                                        {meta.label}
                                                    </span>
                                                </div>
                                                <span className="ml-auto text-[9px]" style={{ color: "var(--foreground-muted)" }}>
                                                    {e.simHour}시간째
                                                </span>
                                            </div>
                                            {e.type === "comment" && e.comment && (
                                                <p className="text-[12px] mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                                                    "{e.comment}"
                                                </p>
                                            )}
                                            {e.type === "purchase" && (
                                                <p className="text-[12px] font-bold mt-0.5" style={{ color: "#D97706" }}>
                                                    ₩{(e.amount ?? 0).toLocaleString()} 결제
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-3 px-5 pb-5">
                <button onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                        background: copied ? "rgba(6,214,160,0.12)" : "var(--surface-2)",
                        color: copied ? "var(--accent)" : "var(--foreground-soft)",
                        border: `1.5px solid ${copied ? "var(--accent)" : "var(--border)"}`,
                    }}>
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    {copied ? "복사됨!" : "결과 복사"}
                </button>
                <button onClick={onSave} disabled={isSaving || saved}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                        background: saved ? "rgba(6,214,160,0.12)" : "linear-gradient(135deg, var(--primary), #FF9A72)",
                        color: saved ? "var(--accent)" : "white",
                        border: saved ? "1.5px solid var(--accent)" : "none",
                        boxShadow: saved ? "none" : "0 4px 12px var(--primary-glow)",
                        opacity: isSaving ? 0.7 : 1,
                    }}>
                    {saved ? <><CheckCircle size={16} /> 저장됨</> : isSaving ? "저장 중..." : <><TrendingUp size={16} /> 결과 저장</>}
                </button>
            </div>
        </div>
    );
}

interface DbPost {
    id: string;
    caption: string | null;
    image_url: string | null;
    engagement_rate: string | null;
    sales: string | null;
    tags: string[] | null;
    landing_images: string[] | null;
    selling_price: number | null;
    ad_budget: number | null;
}

// ─── 메인 페이지 ─────────────────────────────────────────────
export default function SimulatePage() {
    const { user, addFunds } = useGameStore();
    const [simState, setSimState] = useState<SimState>({ active: false, startedAt: null, durationMinutes: 10 });
    const [selectedPostId, setSelectedPostId] = useState<string>("");
    const [elapsedMs, setElapsedMs] = useState(0);
    const [visibleEvents, setVisibleEvents] = useState<SimEvent[]>([]);
    const [allEvents, setAllEvents] = useState<SimEvent[]>([]);
    const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
    const [finished, setFinished] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dbPosts, setDbPosts] = useState<DbPost[]>([]);
    const [aiAnalysis, setAiAnalysis] = useState<SimAnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const eventFeedRef = useRef<HTMLDivElement>(null);
    const lastVisibleCountRef = useRef(0);

    // DB에서 내 게시물 로드
    useEffect(() => {
        if (!user.handle) return;
        supabase
            .from("posts")
            .select("id, caption, image_url, engagement_rate, sales, tags, landing_images, selling_price, ad_budget")
            .eq("user_handle", user.handle)
            .order("created_at", { ascending: false })
            .limit(20)
            .then(({ data }) => {
                if (data) {
                    setDbPosts(data);
                    if (data.length > 0 && !selectedPostId) setSelectedPostId(data[0].id);
                }
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.handle]);

    const myPosts = dbPosts;

    const selectedDbPost = myPosts.find(p => p.id === selectedPostId);
    const simPost: SimPost | null = selectedDbPost ? {
        id: selectedDbPost.id,
        caption: selectedDbPost.caption ?? "",
        imageUrl: selectedDbPost.image_url ?? "",
        engagementRate: selectedDbPost.engagement_rate ?? "5%",
        productPrice: selectedDbPost.selling_price
            ?? (selectedDbPost.sales
                ? parseFloat(String(selectedDbPost.sales).replace(/[^0-9.]/g, "")) || 10000
                : 10000),
        tags: selectedDbPost.tags ?? [],
        landingImages: selectedDbPost.landing_images ?? [],
        adBudget: selectedDbPost.ad_budget ?? undefined,
    } : null;

    const durationMs = simState.durationMinutes * 60 * 1000;
    const remainingMs = Math.max(0, durationMs - elapsedMs);
    const remainingMin = Math.floor(remainingMs / 60000);
    const remainingSec = Math.floor((remainingMs % 60000) / 1000);
    const progressPct = durationMs > 0 ? Math.min(100, (elapsedMs / durationMs) * 100) : 0;

    // Supabase 시뮬레이션 상태 구독
    useEffect(() => {
        const loadState = async () => {
            const { data } = await supabase
                .from("app_settings")
                .select("sim_active, sim_started_at, sim_duration_minutes")
                .eq("id", 1).single();
            if (data) {
                setSimState({
                    active: data.sim_active ?? false,
                    startedAt: data.sim_started_at,
                    durationMinutes: data.sim_duration_minutes ?? 10,
                });
            }
        };
        loadState();

        const ch = supabase.channel("sim-state")
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_settings" }, (payload) => {
                const d = payload.new;
                if (typeof d.sim_active === "boolean") {
                    setSimState({
                        active: d.sim_active,
                        startedAt: d.sim_started_at ?? null,
                        durationMinutes: d.sim_duration_minutes ?? 10,
                    });
                }
            }).subscribe();

        return () => { supabase.removeChannel(ch); };
    }, []);

    // AI 분석 — 시뮬 활성화 + 게시물 선택 시 1회 호출
    useEffect(() => {
        if (!simState.active || !simPost) { setAiAnalysis(null); return; }

        let cancelled = false;
        const runAnalysis = async () => {
            setIsAnalyzing(true);
            try {
                const res = await fetch("/api/simulate/analyze-post", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        caption: simPost.caption,
                        tags: simPost.tags,
                        price: simPost.productPrice,
                        landingImages: simPost.landingImages,
                    }),
                });
                const json = await res.json();
                if (!cancelled && json.ok) setAiAnalysis(json.analysis);
            } catch {
                // AI 분석 실패해도 시뮬레이션은 기본값으로 진행
            } finally {
                if (!cancelled) setIsAnalyzing(false);
            }
        };

        runAnalysis();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simState.active, selectedPostId]);

    // 이벤트 생성 — AI 분석 결과 반영
    useEffect(() => {
        if (!simState.active || !simState.startedAt || !simPost) {
            setAllEvents([]); setVisibleEvents([]); setFinished(false); return;
        }
        const adMult = AD_PLANS_SIM.find(p => p.budget === simPost.adBudget)?.mult ?? 1.0;
        const events = generateSimEvents(
            simPost.id, simPost.engagementRate, simPost.productPrice,
            simState.durationMinutes, simState.startedAt,
            {
                conversionBoost: (aiAnalysis?.conversionBoost ?? 1.0) * adMult,
                aiComments: (aiAnalysis?.aiComments as AiComment[]) ?? [],
            }
        );
        setAllEvents(events);
        setVisibleEvents([]);
        setFinished(false);
        lastVisibleCountRef.current = 0;
        setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simState.active, simState.startedAt, simState.durationMinutes, selectedPostId, aiAnalysis]);

    // 타이머
    useEffect(() => {
        if (!simState.active || !simState.startedAt) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        const tick = () => {
            const elapsed = Date.now() - new Date(simState.startedAt!).getTime();
            setElapsedMs(elapsed);
            if (elapsed >= durationMs) { setFinished(true); if (timerRef.current) clearInterval(timerRef.current); }
        };
        tick();
        timerRef.current = setInterval(tick, 500);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simState.active, simState.startedAt, durationMs]);

    // 이벤트 순차 표시
    useEffect(() => {
        if (!simState.active || allEvents.length === 0) return;
        const shouldShow = allEvents.filter(e => e.realMs <= elapsedMs);
        if (shouldShow.length > lastVisibleCountRef.current) {
            const newOnes = shouldShow.slice(lastVisibleCountRef.current);
            setNewEventIds(new Set(newOnes.map(e => e.id)));
            setVisibleEvents(shouldShow);
            lastVisibleCountRef.current = shouldShow.length;
            setTimeout(() => setNewEventIds(new Set()), 600);
            if (eventFeedRef.current) {
                eventFeedRef.current.scrollTop = eventFeedRef.current.scrollHeight;
            }
        }
    }, [elapsedMs, allEvents, simState.active]);

    // 게시물 자동 선택 (DB 로드 시 처리됨, 이 useEffect 불필요)

    const handleSaveResult = useCallback(async () => {
        if (!simPost || !simState.startedAt || isSaving || saved) return;
        setIsSaving(true);
        try {
            const likes     = visibleEvents.filter(e => e.type === "like").length;
            const comments  = visibleEvents.filter(e => e.type === "comment").length;
            const shares    = visibleEvents.filter(e => e.type === "share").length;
            const purchases = visibleEvents.filter(e => e.type === "purchase").length;
            const revenue   = visibleEvents.filter(e => e.type === "purchase").reduce((s, e) => s + (e.amount ?? 0), 0);

            // Supabase 세션 토큰 포함해서 저장 (서버에서 balance 업데이트)
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch("/api/simulate/save-result", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    user_name: user.name, user_handle: user.handle,
                    post_id: simPost.id, post_caption: simPost.caption, post_image: simPost.imageUrl,
                    session_started_at: simState.startedAt, duration_minutes: simState.durationMinutes,
                    total_likes: likes, total_comments: comments, total_shares: shares,
                    total_purchases: purchases, total_revenue: revenue, events: visibleEvents,
                }),
            });

            if (res.ok && revenue > 0) {
                // 클라이언트 잔고도 즉시 반영
                addFunds(revenue);
            }
            setSaved(true);
        } finally { setIsSaving(false); }
    }, [simPost, simState, visibleEvents, user, isSaving, saved, addFunds]);

    // ─── 렌더링 ───────────────────────────────────────────────
    if (!simState.active) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6 max-w-lg mx-auto text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)", boxShadow: "0 8px 24px var(--primary-glow)" }}>
                    <Play size={36} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black font-outfit mb-2" style={{ color: "var(--foreground)" }}>마켓 시뮬레이션</h1>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                        선생님이 마켓을 열면 가상 구매자들의 반응을 실시간으로 확인할 수 있어요.
                    </p>
                </div>
                <div className="w-full p-4 rounded-2xl flex items-center gap-3"
                    style={{ background: "var(--surface-2)", border: "1.5px dashed var(--border)" }}>
                    <Pause size={20} style={{ color: "var(--foreground-muted)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
                        마켓 대기 중 — 선생님이 시뮬레이션을 시작하면 자동으로 시작돼요
                    </p>
                </div>
                <Link href="/feed" className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--foreground-muted)" }}>
                    <ChevronLeft size={16} />피드로 돌아가기
                </Link>
            </div>
        );
    }

    if (myPosts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 max-w-lg mx-auto text-center">
                <div className="text-5xl">📸</div>
                <h2 className="text-xl font-black font-outfit" style={{ color: "var(--foreground)" }}>게시물이 없어요</h2>
                <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>시뮬레이션을 시작하려면 먼저 피드에 게시물을 업로드해주세요.</p>
                <Link href="/feed" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                    style={{ background: "var(--primary)", boxShadow: "0 4px 12px var(--primary-glow)" }}>
                    게시물 올리러 가기
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 pb-28 flex flex-col gap-5">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
                <Link href="/feed" className="p-2 rounded-xl" style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}>
                    <ChevronLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-lg font-black font-outfit" style={{ color: "var(--foreground)" }}>마켓 시뮬레이션</h1>
                    <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>1분 = 1시간 · {simState.durationMinutes}시간 분량</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold text-green-500">LIVE</span>
                </div>
            </div>

            {/* 타이머 */}
            <div className="rounded-2xl p-5"
                style={{
                    background: finished
                        ? "linear-gradient(135deg, #06D6A0 0%, #4361EE 100%)"
                        : "linear-gradient(135deg, #FF6B35 0%, #FFC233 100%)",
                    boxShadow: "0 6px 20px rgba(255,107,53,0.25)",
                }}>
                <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1">
                    {finished ? "시뮬레이션 완료" : "남은 시간"}
                </p>
                <div className="flex items-end gap-2 mb-3">
                    {finished ? (
                        <span className="text-4xl font-black text-white font-outfit">완료! 🎉</span>
                    ) : (
                        <>
                            <span className="text-4xl font-black text-white font-outfit tabular-nums">
                                {String(remainingMin).padStart(2, "0")}:{String(remainingSec).padStart(2, "0")}
                            </span>
                            <span className="text-white/70 text-sm mb-1">남음</span>
                        </>
                    )}
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-white/20">
                    <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                    <span className="text-white/60 text-[10px] font-bold">{Math.floor(elapsedMs / 60000)}분 경과</span>
                    <span className="text-white/60 text-[10px] font-bold">이벤트 {visibleEvents.length}개</span>
                </div>
            </div>

            {/* 게시물 선택 */}
            {myPosts.length > 0 && (
                <div>
                    <p className="text-xs font-bold mb-2 px-1" style={{ color: "var(--foreground-muted)" }}>
                        분석할 게시물 선택 ({myPosts.length}개)
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {myPosts.map(post => (
                            <button key={post.id} onClick={() => { setSelectedPostId(post.id); setSaved(false); }}
                                className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all"
                                style={{
                                    border: selectedPostId === post.id ? "3px solid var(--primary)" : "2px solid var(--border)",
                                    opacity: selectedPostId === post.id ? 1 : 0.6,
                                }}>
                                {post.image_url
                                    ? <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: "var(--surface-2)" }}>📝</div>
                                }
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 게시물 미리보기 */}
            {simPost && (
                <div className="rounded-2xl overflow-hidden"
                    style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                    {simPost.imageUrl && (
                        <img src={simPost.imageUrl} alt="" className="w-full object-cover" style={{ maxHeight: "280px" }} />
                    )}
                    <div className="p-4">
                        <p className="text-sm font-semibold line-clamp-2" style={{ color: "var(--foreground)" }}>{simPost.caption}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                                인게이지먼트 {simPost.engagementRate}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(255,194,51,0.15)", color: "#D97706" }}>
                                ₩{simPost.productPrice.toLocaleString()}
                            </span>
                            {simPost.landingImages.length > 0 && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(67,97,238,0.12)", color: "#4361EE" }}>
                                    🖼️ 랜딩 {simPost.landingImages.length}장
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* AI 분석 결과 배너 */}
            {simPost && (
                <div className="rounded-2xl p-4"
                    style={{
                        background: isAnalyzing
                            ? "var(--surface)"
                            : aiAnalysis
                                ? `rgba(6,214,160,0.08)`
                                : "var(--surface)",
                        border: isAnalyzing
                            ? "1.5px dashed var(--border)"
                            : aiAnalysis
                                ? "1.5px solid rgba(6,214,160,0.4)"
                                : "1.5px dashed var(--border)",
                    }}>
                    {isAnalyzing ? (
                        <div className="flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                            <span className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                AI가 게시물과 랜딩 페이지를 분석 중...
                            </span>
                        </div>
                    ) : aiAnalysis ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#06D6A0" }}>
                                    ✨ AI 분석 완료
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{ background: "rgba(6,214,160,0.15)", color: "#06D6A0" }}>
                                        전환 배율 ×{aiAnalysis.conversionBoost.toFixed(1)}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{ background: "rgba(67,97,238,0.12)", color: "#4361EE" }}>
                                        랜딩 {aiAnalysis.landingScore}/10
                                    </span>
                                    {simPost?.adBudget && (() => {
                                        const adMult = AD_PLANS_SIM.find(p => p.budget === simPost.adBudget)?.mult ?? 1.0;
                                        return (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: "rgba(217,119,6,0.12)", color: "#D97706" }}>
                                                📢 광고 ×{adMult}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                            <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>
                                💡 {aiAnalysis.purchaseReason}
                            </p>
                        </div>
                    ) : (
                        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                            AI 분석 대기 중...
                        </p>
                    )}
                </div>
            )}

            {/* 실시간 이벤트 피드 */}
            {!finished && (
                <div className="rounded-2xl overflow-hidden"
                    style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                    <div className="px-4 py-3 flex items-center justify-between"
                        style={{ borderBottom: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2">
                            <Clock size={14} style={{ color: "var(--foreground-muted)" }} />
                            <span className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--foreground-soft)" }}>
                                실시간 반응
                            </span>
                        </div>
                        <div className="flex gap-3 text-[11px] font-bold">
                            <span style={{ color: "#FF6B35" }}>❤️ {visibleEvents.filter(e => e.type === "like").length}</span>
                            <span style={{ color: "#4361EE" }}>💬 {visibleEvents.filter(e => e.type === "comment").length}</span>
                            <span style={{ color: "#06D6A0" }}>🔗 {visibleEvents.filter(e => e.type === "share").length}</span>
                            <span style={{ color: "#D97706" }}>🛍️ {visibleEvents.filter(e => e.type === "purchase").length}</span>
                        </div>
                    </div>
                    <div ref={eventFeedRef} className="flex flex-col gap-2 p-3 overflow-y-auto" style={{ maxHeight: "400px" }}>
                        {visibleEvents.length === 0 ? (
                            <div className="py-10 text-center">
                                <div className="text-2xl mb-2 animate-bounce">⏳</div>
                                <p className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                    가상 구매자 반응을 기다리는 중...
                                </p>
                            </div>
                        ) : (
                            [...visibleEvents].reverse().map(event => (
                                <EventItem
                                    key={event.id}
                                    event={event}
                                    isNew={newEventIds.has(event.id)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* 완료 결과 카드 */}
            {finished && simPost && (
                <ResultCard
                    events={visibleEvents}
                    post={simPost}
                    durationMinutes={simState.durationMinutes}
                    onSave={handleSaveResult}
                    isSaving={isSaving}
                    saved={saved}
                />
            )}
        </div>
    );
}
