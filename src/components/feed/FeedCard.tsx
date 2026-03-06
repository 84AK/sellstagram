"use client";

import React, { useState, useEffect } from "react";
import {
    Heart,
    MessageCircle,
    Send,
    Bookmark,
    MoreHorizontal,
    ShoppingCart,
    CheckCircle2,
    TrendingUp,
    Loader2
} from "lucide-react";
import GlassCard from "../common/GlassCard";
import { useGameStore } from "@/store/useGameStore";
import { simulateMarketingEffect } from "@/lib/simulation/engine";
import { supabase } from "@/lib/supabase/client";

interface Comment {
    id: string;
    user_name: string;
    text: string;
    created_at: string;
}

interface FeedCardProps {
    id: string;
    user: {
        name: string;
        handle: string;
        avatar: string;
    };
    content: {
        image: string;
        caption: string;
        tags: string[];
    };
    stats: {
        likes: number;
        engagement: string;
        sales: string;
    };
    timeAgo: string;
}

export default function FeedCard({ id, user, content, stats, timeAgo }: FeedCardProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(stats.likes);
    const [isSaved, setIsSaved] = useState(false);
    const [localSales, setLocalSales] = useState(stats.sales);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [shareMsg, setShareMsg] = useState("");

    const { addFunds, user: currentUser } = useGameStore();

    // localStorage에서 좋아요/북마크 상태 복원
    useEffect(() => {
        const likedIds: string[] = JSON.parse(localStorage.getItem("liked_posts") || "[]");
        const savedIds: string[] = JSON.parse(localStorage.getItem("saved_posts") || "[]");
        setIsLiked(likedIds.includes(id));
        setIsSaved(savedIds.includes(id));
    }, [id]);

    useEffect(() => {
        if (!showComments || comments.length > 0) return;
        supabase
            .from("comments")
            .select("id, user_name, text, created_at")
            .eq("post_id", id)
            .order("created_at", { ascending: true })
            .then(({ data }) => { if (data) setComments(data); });

        const channel = supabase
            .channel(`comments-feed-${id}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `post_id=eq.${id}` }, (payload) => {
                setComments(prev => [...prev, payload.new as Comment]);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showComments]);

    const handleBuyNow = () => {
        if (isSimulating) return;
        setIsSimulating(true);
        setTimeout(() => {
            const result = simulateMarketingEffect({
                caption: content.caption,
                hashtags: content.tags,
                visualQuality: 0.85,
                baseFollowers: 5000
            }, 450000);

            addFunds(result.revenue);
            setLocalSales(`₩${(parseInt(localSales.replace(/[^0-9]/g, "")) + result.revenue).toLocaleString()}`);
            setIsSimulating(false);
        }, 800);
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
        });
        setSubmitting(false);
    };

    return (
        <GlassCard className="p-0 border-none group transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
            {/* Card Header */}
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
                <button className="p-2 text-foreground/30 hover:text-foreground transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* Main Image Area */}
            <div className="relative aspect-square w-full bg-foreground/5 overflow-hidden group/image">
                {content.image ? (
                    <>
                        <img src={content.image} alt={content.caption} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 opacity-0 group-hover/image:opacity-100 transition-opacity duration-700" />
                    </>
                ) : (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 opacity-0 group-hover/image:opacity-100 transition-opacity duration-700" />
                        <div className="absolute inset-0 flex items-center justify-center p-12 text-center">
                            <span className="text-foreground/5 font-black text-6xl italic select-none">#{id}</span>
                        </div>
                    </>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-all duration-500 translate-y-4 group-hover/image:translate-y-0 flex flex-col justify-end p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-primary/20 text-[8px] font-bold text-primary border border-primary/20 tracking-wider">ECO-TECH</span>
                        <span className="px-2 py-0.5 rounded-md bg-secondary/20 text-[8px] font-bold text-secondary border border-secondary/20 tracking-wider">PREMIUM</span>
                    </div>
                    <p className="text-xs text-foreground/70 font-medium leading-relaxed max-w-xs transition-all duration-500 delay-100 group-hover/image:translate-y-0 translate-y-2">
                        AI가 예측한 이 디자인의 시장 적합도는 **92.4%**입니다.
                    </p>
                </div>
            </div>

            {/* Interaction Bar */}
            <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={async () => {
                                const newLiked = !isLiked;
                                setIsLiked(newLiked);
                                const newCount = newLiked ? localLikes + 1 : localLikes - 1;
                                setLocalLikes(newCount);
                                // localStorage 유지
                                const likedIds: string[] = JSON.parse(localStorage.getItem("liked_posts") || "[]");
                                const updated = newLiked ? [...likedIds, id] : likedIds.filter(x => x !== id);
                                localStorage.setItem("liked_posts", JSON.stringify(updated));
                                await supabase.from("posts").update({ likes: newCount }).eq("id", id);
                            }}
                            className={`flex items-center gap-1.5 transition-all duration-300 hover:scale-110 ${isLiked ? "text-primary" : "text-foreground/70 hover:text-primary"}`}
                        >
                            <Heart size={24} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 2.5 : 2} />
                            <span className="text-sm font-bold">{localLikes}</span>
                        </button>
                        <button
                            onClick={() => setShowComments(v => !v)}
                            className={`transition-all duration-300 hover:scale-110 ${showComments ? "text-secondary" : "text-foreground/70 hover:text-secondary"}`}
                        >
                            <MessageCircle size={24} strokeWidth={2} />
                        </button>
                        <button
                            onClick={async () => {
                                const text = content.caption || "Sellstagram 게시물";
                                try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
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
                    <button
                        onClick={() => {
                            const newSaved = !isSaved;
                            setIsSaved(newSaved);
                            const savedIds: string[] = JSON.parse(localStorage.getItem("saved_posts") || "[]");
                            const updated = newSaved ? [...savedIds, id] : savedIds.filter(x => x !== id);
                            localStorage.setItem("saved_posts", JSON.stringify(updated));
                        }}
                        className={`transition-all duration-300 hover:scale-110 ${isSaved ? "text-secondary" : "text-foreground/70 hover:text-secondary"}`}
                    >
                        <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 2.5 : 2} />
                    </button>
                </div>

                {/* 댓글 섹션 */}
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

                {/* Stats Row */}
                <div className="flex items-center gap-6 py-1 border-y border-foreground/5">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest italic">Engagement</span>
                        <span className="text-sm font-black text-primary transition-all duration-300 group-hover:scale-105 origin-left italic">
                            {stats.engagement}
                        </span>
                    </div>
                    <div className="flex flex-col border-l border-foreground/5 pl-6 relative overflow-hidden">
                        <span className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest italic">Est. Sales</span>
                        <div className="flex items-center gap-1">
                            <span className={`text-sm font-black text-secondary transition-all duration-300 origin-left italic ${isSimulating ? "opacity-50 blur-sm" : "opacity-100 blur-0"}`}>
                                {localSales}
                            </span>
                            {isSimulating && <TrendingUp size={12} className="text-secondary animate-bounce" />}
                        </div>
                    </div>
                </div>

                {/* Caption & Purchase */}
                <div className="flex flex-col gap-3">
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

                    <button
                        onClick={handleBuyNow}
                        disabled={isSimulating}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-foreground text-background rounded-xl font-bold italic text-sm transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-lg shadow-black/10 dark:shadow-white/5 group/buy disabled:opacity-50"
                    >
                        <ShoppingCart size={16} className={`group-hover/buy:-translate-y-0.5 transition-transform ${isSimulating ? "animate-pulse" : ""}`} />
                        {isSimulating ? "시뮬레이션 중..." : "테스트 구매 시뮬레이션"}
                    </button>
                </div>
            </div>
        </GlassCard>
    );
}
