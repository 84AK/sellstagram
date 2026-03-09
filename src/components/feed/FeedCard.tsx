"use client";

import React, { useState, useEffect } from "react";
import {
    Heart,
    MessageCircle,
    Send,
    Bookmark,
    MoreHorizontal,
    CheckCircle2,
    Sparkles,
    X,
    Loader2,
    TrendingUp,
    ShoppingBag,
    Share2,
} from "lucide-react";
import GlassCard from "../common/GlassCard";
import TermTooltip from "../common/TermTooltip";
import { useGameStore } from "@/store/useGameStore";
import { simulateMarketingEffect } from "@/lib/simulation/engine";
import { supabase } from "@/lib/supabase/client";

interface Comment {
    id: string;
    user_name: string;
    text: string;
    created_at: string;
}

interface SimResult {
    total_likes: number;
    total_comments: number;
    total_shares: number;
    total_purchases: number;
    total_revenue: number;
    created_at: string;
}

interface FeedCardProps {
    id: string;
    user: { name: string; handle: string; avatar: string };
    content: { image: string; caption: string; tags: string[] };
    stats: { likes: number; engagement: string; sales: string };
    timeAgo: string;
}

export default function FeedCard({ id, user, content, stats, timeAgo }: FeedCardProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(stats.likes);
    const [isSaved, setIsSaved] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [shareMsg, setShareMsg] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [simResult, setSimResult] = useState<SimResult | null>(null);
    const [showSimResult, setShowSimResult] = useState(false);

    const { addInsight, startCampaign, setAIReportModal, addSkillXP, user: currentUser } = useGameStore();
    const isMyPost = user.handle === currentUser.handle;

    // 좋아요/북마크 복원
    useEffect(() => {
        const likedIds: string[] = JSON.parse(localStorage.getItem("liked_posts") || "[]");
        const savedIds: string[] = JSON.parse(localStorage.getItem("saved_posts") || "[]");
        setIsLiked(likedIds.includes(id));
        setIsSaved(savedIds.includes(id));
    }, [id]);

    // 내 게시물의 시뮬레이션 결과 로드
    useEffect(() => {
        if (!isMyPost) return;
        supabase
            .from("simulation_results")
            .select("total_likes, total_comments, total_shares, total_purchases, total_revenue, created_at")
            .eq("post_id", id)
            .order("created_at", { ascending: false })
            .limit(1)
            .then(({ data }) => {
                if (data && data.length > 0) setSimResult(data[0] as SimResult);
            });

        // 실시간 구독 (새 시뮬 결과 저장 시 자동 업데이트)
        const ch = supabase
            .channel(`sim-result-${id}`)
            .on("postgres_changes", {
                event: "INSERT", schema: "public", table: "simulation_results",
                filter: `post_id=eq.${id}`,
            }, (payload) => {
                setSimResult(payload.new as SimResult);
            })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [id, isMyPost]);

    // 댓글 로드 (마케터 댓글만, is_ai_reaction 제외)
    useEffect(() => {
        if (!showComments) return;
        supabase
            .from("comments")
            .select("id, user_name, text, created_at")
            .eq("post_id", id)
            .eq("is_ai_reaction", false)
            .order("created_at", { ascending: true })
            .then(({ data }) => { if (data) setComments(data); });

        const channel = supabase
            .channel(`comments-feed-${id}`)
            .on("postgres_changes", {
                event: "INSERT", schema: "public", table: "comments",
                filter: `post_id=eq.${id}`,
            }, (payload) => {
                const c = payload.new as Comment & { is_ai_reaction?: boolean };
                if (!c.is_ai_reaction) setComments(prev => [...prev, c]);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showComments]);

    const handleAIAnalyze = async () => {
        setShowMenu(false);
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/ai/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "coach", caption: content.caption, engagement: "Predictions" }),
            });
            const data = await res.json();
            const sim = simulateMarketingEffect({
                caption: content.caption,
                hashtags: content.tags,
                visualQuality: 0.8,
                baseFollowers: 500,
            }, 30000);
            startCampaign({
                id: Math.random().toString(36).substr(2, 9),
                productId: id,
                spent: 0,
                revenue: sim.revenue,
                efficiency: parseFloat((sim.engagementRate).toFixed(2)),
                engagement: sim.engagementRate,
            });
            const newInsight = {
                id: Math.random().toString(36).substr(2, 9),
                type: "coach" as const,
                title: "게시물 AI 분석",
                content: data.insight ?? `## 분석 결과\n\n- **예상 노출**: ${sim.impressions.toLocaleString()}명\n- **인게이지먼트**: ${sim.engagementRate.toFixed(1)}%`,
                date: new Date().toISOString().split("T")[0],
            };
            addInsight(newInsight);
            addSkillXP("analytics", 25);
            setAIReportModal(true, newInsight);
        } catch { /* 실패 시 무시 */ } finally { setIsAnalyzing(false); }
    };

    const handleSubmitComment = async () => {
        const text = commentInput.trim();
        if (!text || submitting) return;
        setSubmitting(true);
        setCommentInput("");
        await supabase.from("comments").insert({
            post_id: id,
            user_name: currentUser.name || "익명",
            user_handle: currentUser.handle || "unknown",
            text,
            is_ai_reaction: false,
        });
        setSubmitting(false);
    };

    return (
        <GlassCard className="p-0 border-none group transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 px-5">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-primary via-accent to-secondary p-[2px]">
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden relative">
                            <div className="absolute inset-0 bg-foreground/5 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-foreground/20 italic">{user.name[0]}</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold tracking-tight">{user.name}</span>
                            <CheckCircle2 size={12} className="text-secondary" />
                        </div>
                        <span className="text-[10px] text-foreground/40 font-medium">@{user.handle} • {timeAgo}</span>
                    </div>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(v => !v)}
                        className="p-2 text-foreground/30 hover:text-foreground transition-colors"
                    >
                        {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <MoreHorizontal size={20} />}
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-8 z-20 min-w-[160px] rounded-2xl overflow-hidden shadow-xl"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                {isMyPost && (
                                    <button onClick={handleAIAnalyze}
                                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors hover:bg-foreground/5 text-left"
                                        style={{ color: "var(--primary)" }}>
                                        <Sparkles size={15} /> AI 분석하기
                                    </button>
                                )}
                                <button onClick={() => setShowMenu(false)}
                                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors hover:bg-foreground/5 text-left"
                                    style={{ color: "var(--foreground-muted)" }}>
                                    <X size={15} /> 닫기
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 이미지 */}
            <div className="relative aspect-square w-full bg-foreground/5 overflow-hidden group/image">
                {content.image ? (
                    <img src={content.image} alt={content.caption} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-12 text-center">
                        <span className="text-foreground/5 font-black text-6xl italic select-none">#{id}</span>
                    </div>
                )}
            </div>

            {/* 인터랙션 바 */}
            <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        {/* 좋아요 */}
                        <button
                            onClick={async () => {
                                const newLiked = !isLiked;
                                setIsLiked(newLiked);
                                const newCount = newLiked ? localLikes + 1 : localLikes - 1;
                                setLocalLikes(newCount);
                                const likedIds: string[] = JSON.parse(localStorage.getItem("liked_posts") || "[]");
                                localStorage.setItem("liked_posts", JSON.stringify(
                                    newLiked ? [...likedIds, id] : likedIds.filter(x => x !== id)
                                ));
                                await supabase.from("posts").update({ likes: newCount }).eq("id", id);
                            }}
                            className={`flex items-center gap-1.5 transition-all duration-300 hover:scale-110 ${isLiked ? "text-primary" : "text-foreground/70 hover:text-primary"}`}
                        >
                            <Heart size={24} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 2.5 : 2} />
                            <span className="text-sm font-bold">{localLikes}</span>
                        </button>

                        {/* 댓글 */}
                        <button
                            onClick={() => setShowComments(v => !v)}
                            className={`transition-all duration-300 hover:scale-110 ${showComments ? "text-secondary" : "text-foreground/70 hover:text-secondary"}`}
                        >
                            <MessageCircle size={24} strokeWidth={2} />
                        </button>

                        {/* 공유 */}
                        <button
                            onClick={async () => {
                                try { await navigator.clipboard.writeText(content.caption || "Sellstagram 게시물"); } catch { /* ignore */ }
                                setShareMsg("복사됨!");
                                setTimeout(() => setShareMsg(""), 2000);
                            }}
                            className="relative text-foreground/70 hover:text-accent transition-all duration-300 hover:scale-110"
                        >
                            <Send size={24} strokeWidth={2} />
                            {shareMsg && (
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap px-2 py-1 rounded-lg bg-foreground text-background">
                                    {shareMsg}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* 북마크 */}
                    <button
                        onClick={() => {
                            const newSaved = !isSaved;
                            setIsSaved(newSaved);
                            const savedIds: string[] = JSON.parse(localStorage.getItem("saved_posts") || "[]");
                            localStorage.setItem("saved_posts", JSON.stringify(
                                newSaved ? [...savedIds, id] : savedIds.filter(x => x !== id)
                            ));
                        }}
                        className={`transition-all duration-300 hover:scale-110 ${isSaved ? "text-secondary" : "text-foreground/70 hover:text-secondary"}`}
                    >
                        <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 2.5 : 2} />
                    </button>
                </div>

                {/* 마케터 댓글 */}
                {showComments && (
                    <div className="flex flex-col gap-2.5">
                        {comments.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {comments.map((c) => (
                                    <div key={c.id} className="flex gap-2 items-start">
                                        <div className="w-5 h-5 rounded-full bg-foreground/10 shrink-0 flex items-center justify-center text-[8px] font-bold">
                                            {c.user_name[0]}
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold">{c.user_name} </span>
                                            <span className="text-[11px] text-foreground/70">{c.text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11px] text-foreground/40 text-center py-1">첫 번째 댓글을 남겨보세요!</p>
                        )}
                        <div className="flex items-center gap-2 pt-1 border-t border-foreground/5">
                            <div className="w-6 h-6 rounded-full bg-secondary/20 shrink-0 flex items-center justify-center text-[9px] font-bold text-secondary">
                                {(currentUser.name || "나")[0]}
                            </div>
                            <input
                                type="text"
                                value={commentInput}
                                onChange={e => setCommentInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSubmitComment()}
                                placeholder="댓글 달기..."
                                className="flex-1 text-sm outline-none bg-transparent text-foreground"
                                disabled={submitting}
                                autoFocus
                            />
                            {submitting
                                ? <Loader2 size={14} className="animate-spin text-foreground/30" />
                                : <button onClick={handleSubmitComment} disabled={!commentInput.trim()} className="text-secondary disabled:opacity-30 transition-opacity">
                                    <Send size={14} />
                                </button>
                            }
                        </div>
                    </div>
                )}

                {/* 인게이지먼트 스탯 */}
                <div className="flex items-center gap-4 py-1 border-y border-foreground/5">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest italic">Engagement</span>
                            <TermTooltip termKey="engagement" size={12} />
                        </div>
                        <span className="text-sm font-black text-primary italic">{stats.engagement}</span>
                    </div>
                </div>

                {/* 캡션 & 태그 */}
                <div className="flex flex-col gap-1">
                    <p className="text-sm leading-relaxed text-foreground/80 line-clamp-2 italic">
                        <span className="font-bold text-foreground mr-2">{user.handle}</span>
                        {content.caption}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {content.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-bold text-accent hover:underline cursor-pointer italic">#{tag}</span>
                        ))}
                    </div>
                </div>

                {/* 내 게시물 — 시뮬레이션 결과 */}
                {isMyPost && simResult && (
                    <div className="rounded-2xl overflow-hidden"
                        style={{ border: "1px solid rgba(6,214,160,0.3)", background: "rgba(6,214,160,0.05)" }}>
                        <button
                            onClick={() => setShowSimResult(v => !v)}
                            className="w-full flex items-center justify-between px-4 py-3"
                        >
                            <div className="flex items-center gap-2">
                                <TrendingUp size={14} style={{ color: "var(--accent)" }} />
                                <span className="text-[12px] font-black" style={{ color: "var(--accent)" }}>
                                    마켓 시뮬레이션 결과
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-bold">
                                <span style={{ color: "#FF6B35" }}>❤️ {simResult.total_likes}</span>
                                <span style={{ color: "#4361EE" }}>💬 {simResult.total_comments}</span>
                                <span style={{ color: "#D97706" }}>🛍️ {simResult.total_purchases}</span>
                            </div>
                        </button>
                        {showSimResult && (
                            <div className="px-4 pb-4 flex flex-col gap-3"
                                style={{ borderTop: "1px solid rgba(6,214,160,0.2)" }}>
                                <div className="grid grid-cols-4 gap-2 pt-3">
                                    {[
                                        { label: "좋아요",  value: simResult.total_likes,     emoji: "❤️",  color: "#FF6B35" },
                                        { label: "댓글",    value: simResult.total_comments,  emoji: "💬",  color: "#4361EE" },
                                        { label: "공유",    value: simResult.total_shares,    emoji: "🔗",  color: "#06D6A0" },
                                        { label: "구매",    value: simResult.total_purchases, emoji: "🛍️", color: "#D97706" },
                                    ].map(s => (
                                        <div key={s.label} className="rounded-xl p-2 text-center"
                                            style={{ background: "var(--surface-2)" }}>
                                            <div className="text-base mb-0.5">{s.emoji}</div>
                                            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                                            <div className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                                {simResult.total_revenue > 0 && (
                                    <div className="p-3 rounded-xl text-center"
                                        style={{ background: "rgba(255,194,51,0.12)", border: "1px solid rgba(255,194,51,0.3)" }}>
                                        <p className="text-[10px] font-bold mb-0.5" style={{ color: "#D97706" }}>매출 (잔고 반영됨)</p>
                                        <p className="text-xl font-black" style={{ color: "#D97706" }}>
                                            ₩{simResult.total_revenue.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                <p className="text-[10px] text-center" style={{ color: "var(--foreground-muted)" }}>
                                    {new Date(simResult.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} 기준
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* 내 게시물 — 결과 없을 때 안내 */}
                {isMyPost && !simResult && (
                    <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                        style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
                        <ShoppingBag size={15} />
                        <span className="text-[12px] font-semibold">마켓 시뮬레이션 결과가 여기에 표시돼요</span>
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
