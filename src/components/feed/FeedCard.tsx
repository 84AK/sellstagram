"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Heart,
    MessageCircle,
    Send,
    Bookmark,
    MoreHorizontal,
    Sparkles,
    X,
    Loader2,
    TrendingUp,
    ShoppingBag,
    Search,
    Link2,
    Check,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
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

// 광고 예산 플랜
const AD_PLANS = [
    { budget: 3000,  label: "스타터",   mult: 1.3, emoji: "🌱", desc: "노출 1.3배" },
    { budget: 10000, label: "부스트",   mult: 2.0, emoji: "🚀", desc: "노출 2배" },
    { budget: 30000, label: "프리미엄", mult: 3.5, emoji: "💎", desc: "노출 3.5배" },
];

interface FeedCardProps {
    id: string;
    user: { name: string; handle: string; avatar: string };
    content: { image: string; caption: string; tags: string[] };
    stats: { likes: number; engagement: string; sales: string; comments?: string; shares?: string };
    timeAgo: string;
    sellingPrice?: number;
    landingImages?: string[];
    images?: string[];
    adBudget?: number;
}

export default function FeedCard({ id, user, content, stats, timeAgo, sellingPrice, landingImages, images, adBudget: initialAdBudget }: FeedCardProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(stats.likes);
    const [isSaved, setIsSaved] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUsers, setShareUsers] = useState<{ id: string; name: string; handle: string; avatar: string; team: string }[]>([]);
    const [shareSearch, setShareSearch] = useState("");
    const [sharedTo, setSharedTo] = useState<Set<string>>(new Set());
    const [selectedShareUser, setSelectedShareUser] = useState<{ id: string; name: string } | null>(null);
    const [shareMessage, setShareMessage] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);
    const [msgSent, setMsgSent] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const shareSearchRef = useRef<HTMLInputElement>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [simResult, setSimResult] = useState<SimResult | null>(null);
    const [showSimResult, setShowSimResult] = useState(false);
    // AI 반응 제외한 실제 사람 댓글 수
    const [humanCommentCount, setHumanCommentCount] = useState(0);
    // 이미지 캐러셀 — image_url(첫 번째) + images(나머지)를 합쳐 전체 슬라이드 구성
    const allImages = (() => {
        const first = content.image ? [content.image] : [];
        const rest = images && images.length > 0 ? images : [];
        const combined = [...first, ...rest];
        return combined.length > 0 ? combined : [];
    })();
    const [imgIdx, setImgIdx] = useState(0);
    // 캡션 더보기
    const CAPTION_LIMIT = 80;
    const [captionExpanded, setCaptionExpanded] = useState(false);
    // 편집/삭제
    const [showEditModal, setShowEditModal] = useState(false);
    const [editCaption, setEditCaption] = useState(content.caption);
    const [editTags, setEditTags] = useState(content.tags.join(", "));
    const [editImages, setEditImages] = useState<string[]>(allImages);
    const [editLandingImages, setEditLandingImages] = useState<string[]>(landingImages ?? []);
    const [landingUploading, setLandingUploading] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [deleted, setDeleted] = useState(false);

    // 광고 시스템
    const [adBudget, setAdBudget] = useState<number | null>(initialAdBudget ?? null);
    const [showAdModal, setShowAdModal] = useState(false);
    const [adRunning, setAdRunning] = useState(false);

    const { addInsight, startCampaign, setAIReportModal, addSkillXP, user: currentUser, balance, spendBalance } = useGameStore();
    const router = useRouter();
    const isMyPost = user.handle === currentUser.handle;

    // 마운트 시 human comment count만 별도 로드 (AI 반응 제외)
    useEffect(() => {
        supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", id)
            .eq("is_ai_reaction", false)
            .then(({ count }) => setHumanCommentCount(count ?? 0));
    }, [id]);

    // 인게이지먼트 실시간 계산 (좋아요+실제댓글+공유 / 기준팔로워 500명)
    const BASE_FOLLOWERS = 500;
    const shareCount = parseInt(stats.shares || "0") || 0;
    const totalEngagements = localLikes + humanCommentCount + shareCount;
    const engagementRate = ((totalEngagements / BASE_FOLLOWERS) * 100).toFixed(1);

    // 좋아요/북마크 복원
    useEffect(() => {
        const likedIds: string[] = JSON.parse(localStorage.getItem("liked_posts") || "[]");
        const savedIds: string[] = JSON.parse(localStorage.getItem("saved_posts") || "[]");
        setIsLiked(likedIds.includes(id));
        setIsSaved(savedIds.includes(id));
    }, [id]);

    // 팔로우 상태 DB에서 로드
    useEffect(() => {
        if (isMyPost) return;
        (async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;
            const { data: profile } = await supabase
                .from("profiles").select("id").eq("handle", user.handle).maybeSingle();
            if (!profile) return;
            const { data: follow } = await supabase
                .from("follows").select("id")
                .eq("follower_id", authUser.id).eq("following_id", profile.id).maybeSingle();
            setIsFollowing(!!follow);
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.handle, isMyPost]);

    // 공유 모달 열릴 때 유저 목록 로드
    useEffect(() => {
        if (!showShareModal) return;
        setTimeout(() => shareSearchRef.current?.focus(), 100);
        supabase
            .from("profiles")
            .select("id, name, handle, avatar, team")
            .neq("handle", currentUser.handle)
            .order("name")
            .limit(30)
            .then(({ data }) => { if (data) setShareUsers(data); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showShareModal]);

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

    // 댓글 로드
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

    // 광고 집행 핸들러
    const handleRunAd = async (budget: number) => {
        if (adRunning || balance < budget) return;
        setAdRunning(true);
        try {
            // 잔고 차감 (로컬 + Supabase)
            spendBalance(budget);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: prof } = await supabase.from("profiles").select("balance").eq("id", session.user.id).single();
                if (prof) {
                    await supabase.from("profiles").update({ balance: Math.max(0, prof.balance - budget) }).eq("id", session.user.id);
                }
            }
            // posts 테이블에 ad_budget 저장 (기존 값보다 크면 업데이트)
            await supabase.from("posts").update({ ad_budget: budget }).eq("id", id);
            setAdBudget(budget);
            setShowAdModal(false);
        } finally {
            setAdRunning(false);
        }
    };

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
        setHumanCommentCount(prev => prev + 1);
        setSubmitting(false);
    };

    const sendShareMessage = async () => {
        if (!selectedShareUser || sendingMsg || msgSent) return;
        setSendingMsg(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;
            const { data: senderProfile } = await supabase
                .from("profiles").select("id").eq("id", authUser.id).maybeSingle();
            if (!senderProfile) return;
            await supabase.from("messages").insert({
                sender_id: senderProfile.id,
                receiver_id: selectedShareUser.id,
                post_id: id,
                text: shareMessage || `게시물을 공유했습니다.`,
            });
            const newShareCount = shareCount + 1;
            const newEngagement = (((localLikes + humanCommentCount + newShareCount) / BASE_FOLLOWERS) * 100).toFixed(1) + "%";
            await supabase.from("posts").update({ shares: newShareCount, engagement_rate: newEngagement }).eq("id", id);
            setSharedTo(prev => new Set([...prev, selectedShareUser.id]));
            setMsgSent(true);
        } catch { /* 실패 시 무시 */ } finally {
            setSendingMsg(false);
        }
    };

    const uploadLandingImage = async (file: File): Promise<string | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || "anon";
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/landing_${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("posts").upload(path, file, { cacheControl: "3600" });
        if (error) { console.error("Landing image upload error:", error.message); return null; }
        const { data: { publicUrl } } = supabase.storage.from("posts").getPublicUrl(path);
        return publicUrl;
    };

    const handleLandingImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        setLandingUploading(true);
        const urls: string[] = [];
        for (const file of files) {
            const url = await uploadLandingImage(file);
            if (url) urls.push(url);
        }
        setEditLandingImages(prev => [...prev, ...urls]);
        setLandingUploading(false);
        e.target.value = "";
    };

    const handleEditSave = async () => {
        if (editSaving) return;
        setEditSaving(true);
        const tagList = editTags.split(",").map(t => t.trim()).filter(Boolean);
        const firstImg = editImages[0] ?? "";
        await supabase.from("posts").update({
            caption: editCaption,
            tags: tagList,
            images: editImages,
            image_url: firstImg,
            landing_images: editLandingImages,
        }).eq("id", id);
        content.caption = editCaption;
        content.tags = tagList;
        content.image = firstImg;
        setImgIdx(0);
        setEditSaving(false);
        setShowEditModal(false);
        setShowMenu(false);
    };

    const handleDelete = async () => {
        if (!confirm("게시물을 삭제할까요?")) return;
        await supabase.from("posts").delete().eq("id", id);
        setDeleted(true);
        setShowMenu(false);
    };

    if (deleted) return null;

    return (
        <>
        <article className="border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>

            {/* ─── 헤더 ─── */}
            <div className="flex items-center justify-between px-4 py-3 gap-2 min-w-0">
                <button
                    onClick={() => router.push(`/profile/${encodeURIComponent(user.handle)}`)}
                    className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0 flex-1"
                >
                    {/* 인스타그램 스타일 그라디언트 링 아바타 */}
                    <div
                        className="w-9 h-9 rounded-full p-[2px] shrink-0"
                        style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
                    >
                        <div
                            className="w-full h-full rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                            style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}
                        >
                            {user.avatar?.startsWith("http") ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : user.avatar ? (
                                <span className="text-base leading-none">{user.avatar}</span>
                            ) : (
                                (user.name?.[0] ?? "?").toUpperCase()
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 leading-none min-w-0 w-full">
                            <span className="text-[15px] font-bold truncate" style={{ color: "var(--foreground)" }}>
                                {user.name}
                            </span>
                            {adBudget && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0"
                                    style={{ background: "rgba(217,119,6,0.12)", color: "#D97706" }}>
                                    <Megaphone size={8} /> 광고
                                </span>
                            )}
                        </div>
                        <span className="text-[13px] mt-0.5 truncate w-full" style={{ color: "var(--foreground-muted)" }}>
                            @{user.handle} · {adBudget ? "Sponsored" : timeAgo}
                        </span>
                    </div>
                </button>

                <div className="flex items-center gap-3 shrink-0">
                    {!isMyPost && (
                        <button
                            onClick={async () => {
                                const { data: { user: authUser } } = await supabase.auth.getUser();
                                if (!authUser) return;
                                const { data: profile } = await supabase
                                    .from("profiles").select("id").eq("handle", user.handle).maybeSingle();
                                if (!profile) return;
                                if (isFollowing) {
                                    setIsFollowing(false);
                                    const { error } = await supabase.from("follows")
                                        .delete()
                                        .eq("follower_id", authUser.id)
                                        .eq("following_id", profile.id);
                                    if (error) setIsFollowing(true);
                                } else {
                                    setIsFollowing(true);
                                    const { error } = await supabase.from("follows")
                                        .insert({ follower_id: authUser.id, following_id: profile.id });
                                    if (error) setIsFollowing(false);
                                }
                            }}
                            className="text-[13px] font-bold transition-colors"
                            style={{ color: isFollowing ? "var(--foreground-muted)" : "var(--secondary)" }}
                        >
                            {isFollowing ? "팔로잉" : "팔로우"}
                        </button>
                    )}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(v => !v)}
                            className="p-1 transition-colors"
                            style={{ color: "var(--foreground-muted)" }}
                        >
                            {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <MoreHorizontal size={20} />}
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 top-8 z-20 min-w-[170px] rounded-2xl overflow-hidden shadow-xl"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                    {isMyPost && (
                                        <>
                                            <button onClick={handleAIAnalyze}
                                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors hover:bg-foreground/5 text-left"
                                                style={{ color: "var(--primary)" }}>
                                                <Sparkles size={15} /> AI 분석하기
                                            </button>
                                            <button onClick={() => { setShowAdModal(true); setShowMenu(false); }}
                                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors hover:bg-foreground/5 text-left"
                                                style={{ color: "#D97706" }}>
                                                <Megaphone size={15} />
                                                {adBudget ? `광고 중 (₩${adBudget.toLocaleString()})` : "광고 집행하기"}
                                            </button>
                                            <button onClick={() => { setEditImages(allImages); setShowEditModal(true); setShowMenu(false); }}
                                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors hover:bg-foreground/5 text-left"
                                                style={{ color: "var(--secondary)" }}>
                                                <Pencil size={15} /> 수정하기
                                            </button>
                                            <button onClick={handleDelete}
                                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors hover:bg-red-50 text-left"
                                                style={{ color: "#EF4444" }}>
                                                <Trash2 size={15} /> 삭제하기
                                            </button>
                                            <div style={{ borderTop: "1px solid var(--border)" }} />
                                        </>
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
            </div>

            {/* ─── 이미지 캐러셀 ─── */}
            <div className="relative aspect-square w-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                {allImages.length > 0 ? (
                    <img
                        src={allImages[imgIdx]}
                        alt={content.caption}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-black text-8xl italic select-none" style={{ color: "var(--border)" }}>S</span>
                    </div>
                )}
                {allImages.length > 1 && (
                    <>
                        <button
                            onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                            disabled={imgIdx === 0}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white disabled:opacity-20 transition-opacity hover:bg-black/60 z-10"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setImgIdx(i => Math.min(allImages.length - 1, i + 1))}
                            disabled={imgIdx === allImages.length - 1}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white disabled:opacity-20 transition-opacity hover:bg-black/60 z-10"
                        >
                            <ChevronRight size={18} />
                        </button>
                        {/* 인디케이터 점 */}
                        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-10">
                            {allImages.map((_, i) => (
                                <button key={i} onClick={() => setImgIdx(i)}
                                    className="w-1.5 h-1.5 rounded-full transition-all"
                                    style={{ background: i === imgIdx ? "white" : "rgba(255,255,255,0.5)" }}
                                />
                            ))}
                        </div>
                        {/* n/n 표시 */}
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[11px] font-bold text-white z-10"
                            style={{ background: "rgba(0,0,0,0.45)" }}>
                            {imgIdx + 1}/{allImages.length}
                        </div>
                    </>
                )}
            </div>

            {/* ─── 인터랙션 바 ─── */}
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
                <div className="flex items-center gap-1">
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
                            const newEngagement = (((newCount + humanCommentCount + shareCount) / BASE_FOLLOWERS) * 100).toFixed(1) + "%";
                            await supabase.from("posts").update({ likes: newCount, engagement_rate: newEngagement }).eq("id", id);
                        }}
                        className="p-2 transition-all duration-200 active:scale-90"
                        style={{ color: isLiked ? "#E1306C" : "var(--foreground)" }}
                    >
                        <Heart size={26} fill={isLiked ? "currentColor" : "none"} strokeWidth={1.8} />
                    </button>

                    {/* 댓글 */}
                    <button
                        onClick={() => setShowComments(v => !v)}
                        className="p-2 transition-all duration-200 active:scale-90"
                        style={{ color: "var(--foreground)" }}
                    >
                        <MessageCircle size={26} strokeWidth={1.8} />
                    </button>

                    {/* 공유 */}
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="p-2 transition-all duration-200 active:scale-90"
                        style={{ color: "var(--foreground)" }}
                    >
                        <Send size={26} strokeWidth={1.8} />
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
                    className="p-2 transition-all duration-200 active:scale-90"
                    style={{ color: "var(--foreground)" }}
                >
                    <Bookmark size={26} fill={isSaved ? "currentColor" : "none"} strokeWidth={1.8} />
                </button>
            </div>

            {/* ─── 좋아요 수 + 인게이지먼트 ─── */}
            <div className="px-4 pb-1">
                <p className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>
                    좋아요 {localLikes.toLocaleString()}개
                </p>
                {totalEngagements > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[13px]" style={{ color: "var(--foreground-muted)" }}>
                            인게이지먼트
                        </span>
                        <TermTooltip termKey="engagement" size={12} />
                        <span className="text-[13px] font-bold" style={{ color: "var(--primary)" }}>
                            {totalEngagements}회 · {engagementRate}%
                        </span>
                    </div>
                )}
            </div>

            {/* ─── 캡션 + 해시태그 ─── */}
            <div className="px-4 pb-2">
                <p className="text-[15px] leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                    {captionExpanded || content.caption.length <= CAPTION_LIMIT
                        ? content.caption
                        : content.caption.slice(0, CAPTION_LIMIT) + "..."}
                </p>
                {content.caption.length > CAPTION_LIMIT && (
                    <button
                        onClick={() => setCaptionExpanded(v => !v)}
                        className="text-[13px] font-bold mt-0.5 transition-opacity hover:opacity-70"
                        style={{ color: "var(--foreground-muted)" }}
                    >
                        {captionExpanded ? "접기" : "더보기"}
                    </button>
                )}
                {content.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {content.tags.map(tag => (
                            <span key={tag} className="text-[14px] font-medium" style={{ color: "var(--secondary)" }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── 구매하기 버튼 ─── */}
            {sellingPrice && (
                <div className="mx-4 mb-3">
                    <button
                        onClick={() => router.push(`/post/${id}`)}
                        className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)", boxShadow: "0 4px 14px rgba(255,107,53,0.3)" }}
                    >
                        <ShoppingBag size={16} />
                        구매하기 · ₩{sellingPrice.toLocaleString()}
                    </button>
                </div>
            )}

            {/* ─── 댓글 토글 ─── */}
            {showComments && (
                <div className="px-4 pb-3 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="pt-2">
                        {comments.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {comments.map((c) => (
                                    <div key={c.id} className="flex gap-2 items-start">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                            style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}>
                                            {c.user_name[0]}
                                        </div>
                                        <p className="text-[13px]" style={{ color: "var(--foreground)" }}>
                                            <span className="font-semibold">{c.user_name} </span>
                                            <span style={{ color: "var(--foreground-soft)" }}>{c.text}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[12px] text-center py-1" style={{ color: "var(--foreground-muted)" }}>
                                첫 번째 댓글을 남겨보세요!
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}>
                            {(currentUser.name || "나")[0]}
                        </div>
                        <input
                            type="text"
                            value={commentInput}
                            onChange={e => setCommentInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSubmitComment()}
                            placeholder="댓글 달기..."
                            className="flex-1 text-[13px] outline-none bg-transparent"
                            style={{ color: "var(--foreground)" }}
                            disabled={submitting}
                            autoFocus
                        />
                        {submitting
                            ? <Loader2 size={13} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                            : <button onClick={handleSubmitComment} disabled={!commentInput.trim()}
                                className="text-[13px] font-bold disabled:opacity-30 transition-opacity"
                                style={{ color: "var(--secondary)" }}>
                                게시
                            </button>
                        }
                    </div>
                </div>
            )}

            {/* ─── 내 게시물 — 시뮬레이션 결과 ─── */}
            {isMyPost && simResult && (
                <div className="mx-4 mb-3 rounded-2xl overflow-hidden"
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


            {/* ─── 공유 모달 (인스타그램 스타일) ─── */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowShareModal(false); }}
                >
                    <div
                        className="w-full max-w-sm rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden"
                        style={{ background: "var(--surface)", maxHeight: "80vh" }}
                    >
                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="p-1 rounded-full transition-colors"
                                style={{ color: "var(--foreground)" }}
                            >
                                <X size={22} />
                            </button>
                            <span className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>공유</span>
                            <div className="w-8" />
                        </div>

                        {/* 검색 */}
                        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "var(--surface-2)" }}>
                                <Search size={15} style={{ color: "var(--foreground-muted)" }} />
                                <input
                                    ref={shareSearchRef}
                                    type="text"
                                    value={shareSearch}
                                    onChange={e => setShareSearch(e.target.value)}
                                    placeholder="검색"
                                    className="flex-1 text-[14px] outline-none bg-transparent"
                                    style={{ color: "var(--foreground)" }}
                                />
                            </div>
                        </div>

                        {/* 유저 목록 */}
                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            {shareUsers.length === 0 ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={20} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3">
                                    {shareUsers
                                        .filter(u => !shareSearch || u.name.includes(shareSearch) || u.handle.includes(shareSearch))
                                        .map(u => {
                                            const isSelected = selectedShareUser?.id === u.id;
                                            const sent = sharedTo.has(u.id);
                                            return (
                                                <button
                                                    key={u.id}
                                                    onClick={() => {
                                                        setSelectedShareUser(isSelected ? null : { id: u.id, name: u.name });
                                                        setShareMessage("");
                                                        setMsgSent(false);
                                                    }}
                                                    className="flex flex-col items-center gap-1.5 transition-all"
                                                >
                                                    <div className="relative">
                                                        <div
                                                            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white transition-all"
                                                            style={{
                                                                background: "linear-gradient(135deg, var(--secondary), var(--accent))",
                                                                outline: isSelected ? "3px solid var(--secondary)" : "none",
                                                                outlineOffset: "2px",
                                                            }}
                                                        >
                                                            {u.avatar?.startsWith("http") ? (
                                                                <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover" />
                                                            ) : u.avatar ? (
                                                                <span>{u.avatar}</span>
                                                            ) : (
                                                                (u.name?.[0] ?? "?").toUpperCase()
                                                            )}
                                                        </div>
                                                        {(isSelected || sent) && (
                                                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                                                                style={{ background: sent ? "var(--accent)" : "var(--secondary)" }}>
                                                                <Check size={11} className="text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] font-medium text-center leading-tight" style={{ color: "var(--foreground)" }}>
                                                        {u.name}
                                                    </span>
                                                    <span className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>
                                                        {u.team}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        {/* 하단: 메시지 입력 + 보내기 / 링크 복사 */}
                        <div className="px-4 py-3 flex flex-col gap-2.5" style={{ borderTop: "1px solid var(--border)" }}>
                            {/* 메시지 입력 (선택된 유저 있을 때) */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={shareMessage}
                                    onChange={e => setShareMessage(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && selectedShareUser && !sendingMsg && sendShareMessage()}
                                    placeholder={selectedShareUser ? `${selectedShareUser.name}에게 메시지 쓰기...` : "메시지 쓰기..."}
                                    className="flex-1 text-[13px] outline-none px-3 py-2.5 rounded-xl"
                                    style={{ background: "var(--surface-2)", color: "var(--foreground)" }}
                                    disabled={!selectedShareUser}
                                />
                            </div>
                            {/* 보내기 버튼 */}
                            {selectedShareUser && (
                                <button
                                    onClick={sendShareMessage}
                                    disabled={sendingMsg || msgSent}
                                    className="w-full py-3 rounded-2xl font-bold text-[14px] text-white transition-all disabled:opacity-60"
                                    style={{ background: msgSent ? "var(--accent)" : "var(--secondary)" }}
                                >
                                    {sendingMsg ? <Loader2 size={16} className="animate-spin mx-auto" />
                                        : msgSent ? "✓ 보냄!"
                                        : `${selectedShareUser.name}에게 보내기`}
                                </button>
                            )}
                            {/* 링크 복사 */}
                            <button
                                onClick={async () => {
                                    try { await navigator.clipboard.writeText(`${window.location.origin}/post/${id}`); } catch { /* ignore */ }
                                    setLinkCopied(true);
                                    setTimeout(() => setLinkCopied(false), 2500);
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl font-semibold text-[13px] transition-all"
                                style={{
                                    background: linkCopied ? "var(--accent-light)" : "var(--surface-2)",
                                    color: linkCopied ? "var(--accent)" : "var(--foreground-soft)",
                                    border: `1px solid ${linkCopied ? "var(--accent)" : "var(--border)"}`,
                                }}
                            >
                                {linkCopied ? <Check size={14} /> : <Link2 size={14} />}
                                {linkCopied ? "링크 복사됨!" : "링크 복사"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </article>

        {/* ─── 광고 집행 모달 ─── */}
        {showAdModal && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}
                onClick={(e) => { if (e.target === e.currentTarget) setShowAdModal(false); }}
            >
                <div className="w-full max-w-sm rounded-t-3xl md:rounded-3xl overflow-hidden"
                    style={{ background: "var(--surface)" }}>
                    {/* 헤더 */}
                    <div className="px-5 py-4 flex items-center justify-between"
                        style={{ borderBottom: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(217,119,6,0.12)" }}>
                                <Megaphone size={15} style={{ color: "#D97706" }} />
                            </div>
                            <div>
                                <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>광고 집행하기</p>
                                <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>내 잔고: ₩{balance.toLocaleString()}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAdModal(false)}
                            className="p-1.5 rounded-xl" style={{ background: "var(--surface-2)" }}>
                            <X size={14} style={{ color: "var(--foreground-muted)" }} />
                        </button>
                    </div>

                    {/* 현재 광고 중이면 상태 표시 */}
                    {adBudget && (
                        <div className="mx-4 mt-4 p-3 rounded-2xl flex items-center gap-2"
                            style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.25)" }}>
                            <Zap size={14} style={{ color: "#D97706" }} />
                            <p className="text-xs font-bold" style={{ color: "#D97706" }}>
                                현재 ₩{adBudget.toLocaleString()} 광고 집행 중 · 시뮬레이션에서 전환율 ×{AD_PLANS.find(p => p.budget === adBudget)?.mult ?? "?"}배 적용
                            </p>
                        </div>
                    )}

                    {/* 광고 플랜 선택 */}
                    <div className="p-4 flex flex-col gap-3">
                        <p className="text-[11px] font-bold px-1" style={{ color: "var(--foreground-muted)" }}>
                            💡 광고비를 쓸수록 AI 가상 고객 노출이 늘고, 시뮬레이션 구매 전환율이 올라가요
                        </p>
                        {AD_PLANS.map((plan) => {
                            const canAfford = balance >= plan.budget;
                            const isActive = adBudget === plan.budget;
                            return (
                                <button
                                    key={plan.budget}
                                    onClick={() => !isActive && handleRunAd(plan.budget)}
                                    disabled={!canAfford || adRunning || isActive}
                                    className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                                    style={{
                                        background: isActive
                                            ? "rgba(217,119,6,0.10)"
                                            : canAfford ? "var(--surface-2)" : "var(--surface-2)",
                                        border: isActive
                                            ? "2px solid #D97706"
                                            : "1.5px solid var(--border)",
                                        opacity: !canAfford && !isActive ? 0.4 : 1,
                                    }}
                                >
                                    <span className="text-2xl">{plan.emoji}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                                {plan.label}
                                            </span>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                                style={{ background: "rgba(217,119,6,0.12)", color: "#D97706" }}>
                                                {plan.desc}
                                            </span>
                                            {isActive && (
                                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                                                    style={{ background: "#D97706", color: "white" }}>집행 중</span>
                                            )}
                                        </div>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                            시뮬레이션 구매 전환율 ×{plan.mult}배 · ROAS 학습
                                        </p>
                                    </div>
                                    <span className="text-sm font-black" style={{ color: canAfford ? "#D97706" : "var(--foreground-muted)" }}>
                                        ₩{plan.budget.toLocaleString()}
                                    </span>
                                </button>
                            );
                        })}
                        {adRunning && (
                            <div className="flex items-center justify-center gap-2 py-2">
                                <Loader2 size={14} className="animate-spin" style={{ color: "#D97706" }} />
                                <span className="text-xs font-bold" style={{ color: "#D97706" }}>광고 집행 중...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ─── 편집 모달 ─── */}
        {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
                <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    {/* 헤더 */}
                    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                        <span className="text-[16px] font-bold" style={{ color: "var(--foreground)" }}>게시물 수정</span>
                        <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-full hover:bg-foreground/5">
                            <X size={20} style={{ color: "var(--foreground-muted)" }} />
                        </button>
                    </div>
                    {/* 본문 */}
                    <div className="p-5 flex flex-col gap-4">

                        {/* 이미지 편집 */}
                        {editImages.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>
                                    이미지 ({editImages.length}장)
                                </label>
                                <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1">
                                    {editImages.map((img, idx) => (
                                        <div key={idx} className="relative shrink-0 group">
                                            <div className="w-20 h-20 rounded-xl overflow-hidden"
                                                style={{ border: idx === 0 ? "2px solid var(--secondary)" : "1.5px solid var(--border)" }}>
                                                <img src={img} alt={`이미지 ${idx + 1}`}
                                                    className="w-full h-full object-cover" />
                                            </div>
                                            {/* 순서 번호 */}
                                            <span className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                                                style={{ background: idx === 0 ? "var(--secondary)" : "rgba(0,0,0,0.5)" }}>
                                                {idx + 1}
                                            </span>
                                            {/* 삭제 버튼 — 이미지 우상단 안쪽에 배치 (클리핑 방지) */}
                                            {editImages.length > 1 && (
                                                <button
                                                    onClick={() => setEditImages(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{ background: "#EF4444", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
                                                >
                                                    <X size={10} />
                                                </button>
                                            )}
                                            {/* 순서 이동 버튼 */}
                                            <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {idx > 0 && (
                                                    <button
                                                        onClick={() => setEditImages(prev => {
                                                            const a = [...prev];
                                                            [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]];
                                                            return a;
                                                        })}
                                                        className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                                                        style={{ background: "rgba(0,0,0,0.6)" }}
                                                    >
                                                        <ChevronLeft size={10} />
                                                    </button>
                                                )}
                                                {idx < editImages.length - 1 && (
                                                    <button
                                                        onClick={() => setEditImages(prev => {
                                                            const a = [...prev];
                                                            [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]];
                                                            return a;
                                                        })}
                                                        className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                                                        style={{ background: "rgba(0,0,0,0.6)" }}
                                                    >
                                                        <ChevronRight size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                    썸네일 위에 커서를 올리면 삭제(×) 및 순서 이동(‹ ›) 버튼이 나타납니다. 첫 번째 이미지가 대표 이미지예요.
                                </p>
                            </div>
                        )}

                        {/* 랜딩페이지 상세 이미지 */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>
                                랜딩페이지 상세 이미지 ({editLandingImages.length}장)
                            </label>
                            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 items-center">
                                {editLandingImages.map((img, idx) => (
                                    <div key={idx} className="relative shrink-0 group">
                                        <div className="w-20 h-20 rounded-xl overflow-hidden"
                                            style={{ border: "1.5px solid var(--border)" }}>
                                            <img src={img} alt={`랜딩 ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                                            style={{ background: "rgba(0,0,0,0.5)" }}>
                                            {idx + 1}
                                        </span>
                                        <button
                                            onClick={() => setEditLandingImages(prev => prev.filter((_, i) => i !== idx))}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ background: "#EF4444", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                                {/* 이미지 추가 버튼 */}
                                <label className="shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                                    style={{ border: "1.5px dashed var(--border)", background: "var(--surface-2)" }}>
                                    {landingUploading
                                        ? <Loader2 size={18} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                                        : <>
                                            <span className="text-lg" style={{ color: "var(--foreground-muted)" }}>+</span>
                                            <span className="text-[9px] font-bold" style={{ color: "var(--foreground-muted)" }}>추가</span>
                                          </>
                                    }
                                    <input type="file" accept="image/*" multiple className="hidden"
                                        onChange={handleLandingImageSelect} disabled={landingUploading} />
                                </label>
                            </div>
                            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                상품 상세 페이지에 표시되는 랜딩 이미지예요. 나중에 추가해도 돼요.
                            </p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>캡션</label>
                            <textarea
                                value={editCaption}
                                onChange={e => setEditCaption(e.target.value)}
                                rows={4}
                                className="w-full rounded-2xl p-4 text-[14px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>해시태그 (쉼표 구분)</label>
                            <input
                                value={editTags}
                                onChange={e => setEditTags(e.target.value)}
                                placeholder="태그1, 태그2, 태그3"
                                className="w-full rounded-2xl px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                            />
                        </div>
                        <button
                            onClick={handleEditSave}
                            disabled={editSaving}
                            className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ background: "var(--secondary)" }}
                        >
                            {editSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            {editSaving ? "저장 중..." : "저장하기"}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
