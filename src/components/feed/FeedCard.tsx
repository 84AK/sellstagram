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
    FlaskConical,
    Lock,
    ArrowRightCircle,
    Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ABTestCreateModal from "./ABTestCreateModal";
import TermTooltip from "../common/TermTooltip";
import { useGameStore } from "@/store/useGameStore";
import { simulateMarketingEffect } from "@/lib/simulation/engine";
import { supabase } from "@/lib/supabase/client";
import { getValidSession, showSessionExpiredError } from "@/lib/supabase/session";
import { useAIAccess } from "@/lib/hooks/useAIAccess";

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

// 광고 플랜 (일일 예산 기준)
const AD_PLANS = [
    { dailyBudget: 3000,  label: "스타터",   mult: 1.3, emoji: "🌱", dailyReach: 300 },
    { dailyBudget: 10000, label: "부스트",   mult: 2.0, emoji: "🚀", dailyReach: 1000 },
    { dailyBudget: 30000, label: "프리미엄", mult: 3.5, emoji: "💎", dailyReach: 3500 },
];
const AD_DURATIONS = [1, 3, 7];

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
    source?: "simulation" | "channel";
    isAdmin?: boolean;
    onMoveToChannel?: (id: string) => void;
    onAdminDelete?: (id: string) => void;
}

export default function FeedCard({ id, user, content, stats, timeAgo, sellingPrice, landingImages, images, adBudget: initialAdBudget, source, isAdmin, onMoveToChannel, onAdminDelete }: FeedCardProps) {
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
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const shareSearchRef = useRef<HTMLInputElement>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [simResult, setSimResult] = useState<SimResult | null>(null);
    const [showSimResult, setShowSimResult] = useState(false);
    // AI 반응 제외한 실제 사람 댓글 수
    const [humanCommentCount, setHumanCommentCount] = useState(0);
    // 가상 고객 반응 (AI 생성 댓글)
    const [showAiReactions, setShowAiReactions] = useState(false);
    const [aiReactions, setAiReactions] = useState<{ id: string; user_name: string; text: string }[]>([]);
    const [aiReactionsLoaded, setAiReactionsLoaded] = useState(false);
    // 이미지 캐러셀 — image_url(첫 번째) + images(나머지)를 합쳐 전체 슬라이드 구성
    const initImages = (() => {
        const first = content.image ? [content.image] : [];
        const rest = images && images.length > 0 ? images : [];
        const combined = [...first, ...rest];
        return combined.length > 0 ? combined : [];
    })();
    const [allImages, setAllImages] = useState<string[]>(initImages);
    const [imgIdx, setImgIdx] = useState(0);

    // 캐러셀 이미지 전체 프리로드 — 화살표 클릭 시 즉시 표시
    useEffect(() => {
        allImages.forEach(src => {
            if (!src) return;
            const img = new window.Image();
            img.src = src;
        });
    }, [allImages]);
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

    // A/B 테스트
    const [showABModal, setShowABModal] = useState(false);

    // 광고 시스템
    const [adBudget, setAdBudget] = useState<number | null>(initialAdBudget ?? null);
    const [showAdModal, setShowAdModal] = useState(false);
    const [adRunning, setAdRunning] = useState(false);
    const [selectedPlanIdx, setSelectedPlanIdx] = useState(1); // 기본: 부스트
    const [selectedDays, setSelectedDays] = useState(3);       // 기본: 3일
    const [activeCampaign, setActiveCampaign] = useState<{
        id: string; total_budget: number; daily_budget: number; duration_days: number;
        start_date: string; end_date: string; status: string;
        impressions: number; landing_visits: number; mult: number;
        simulated_purchases: number; simulated_revenue: number;
    } | null>(null);

    const { addInsight, startCampaign, setAIReportModal, addSkillXP, user: currentUser, balance, spendBalance } = useGameStore();
    const router = useRouter();
    const isMyPost = user.handle === currentUser.handle;
    const { hasAccess: hasAIAccess } = useAIAccess();

    // ── 채널로 이동 ──
    const [movingToChannel, setMovingToChannel] = useState(false);
    const handleMoveToChannel = async () => {
        if (!confirm(`이 게시물을 내 채널로 이동할까요?\n시뮬레이션 피드에서 사라지고 채널 탭에서 보입니다.`)) return;
        setMovingToChannel(true);
        setShowMenu(false);
        const session = await getValidSession();
        if (!session) { showSessionExpiredError(); setMovingToChannel(false); return; }
        const { error } = await supabase.from("posts").update({ source: "channel" }).eq("id", id);
        if (error) { alert("이동에 실패했어요. 잠시 후 다시 시도해 주세요."); }
        else { onMoveToChannel?.(id); }
        setMovingToChannel(false);
    };

    // ── 관리자 삭제 ──
    const [adminDeleting, setAdminDeleting] = useState(false);
    const handleAdminDelete = async () => {
        if (!confirm(`[관리자] @${user.handle}의 게시물을 삭제할까요?`)) return;
        setAdminDeleting(true);
        setShowMenu(false);
        const res = await fetch("/api/admin/delete-post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: id }),
        });
        if (!res.ok) { alert("관리자 삭제에 실패했어요."); }
        else { onAdminDelete?.(id); setDeleted(true); }
        setAdminDeleting(false);
    };

    // ── 관리자 채널 이동 ──
    const [adminMoving, setAdminMoving] = useState(false);
    const handleAdminMoveToChannel = async () => {
        if (!confirm(`[관리자] @${user.handle}의 게시물을 채널로 이동할까요?`)) return;
        setAdminMoving(true);
        setShowMenu(false);
        const res = await fetch("/api/admin/update-post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: id, field: "source", value: "channel" }),
        });
        if (!res.ok) { alert("관리자 이동에 실패했어요."); }
        else { onMoveToChannel?.(id); }
        setAdminMoving(false);
    };

    // 마운트 시 human comment count만 별도 로드 (AI 반응 제외)
    useEffect(() => {
        supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", id)
            .eq("is_ai_reaction", false)
            .then(({ count }) => setHumanCommentCount(count ?? 0));
    }, [id]);

    // 타인 게시물: 만료된 광고 뱃지 숨김 처리 (클라이언트 사이드 체크)
    useEffect(() => {
        if (isMyPost || !initialAdBudget) return;
        supabase
            .from("ad_campaigns")
            .select("end_date, status")
            .eq("post_id", id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data }) => {
                if (!data || data.status !== "active" || (data.end_date && new Date(data.end_date) < new Date())) {
                    setAdBudget(null);
                }
            });
    }, [id, isMyPost, initialAdBudget]);

    // 광고 캠페인 로드 + 경과일 기반 시뮬레이션 실행 (내 게시물만)
    useEffect(() => {
        if (!isMyPost) return;
        supabase
            .from("ad_campaigns")
            .select("id,total_budget,daily_budget,duration_days,start_date,end_date,status,impressions,landing_visits,mult,simulated_purchases,simulated_revenue")
            .eq("post_id", id)
            .eq("status", "active")
            .maybeSingle()
            .then(async ({ data }) => {
                if (!data) {
                    // active 캠페인이 없으면 광고 뱃지 제거 (posts.ad_budget이 stale한 경우 대비)
                    if (initialAdBudget) {
                        supabase.from("posts").update({ ad_budget: null }).eq("id", id);
                        setAdBudget(null);
                    }
                    return;
                }
                const now = new Date();
                if (data.end_date && new Date(data.end_date) < now) {
                    supabase.from("ad_campaigns").update({ status: "completed" }).eq("id", data.id);
                    supabase.from("posts").update({ ad_budget: null }).eq("id", id);
                    setAdBudget(null);
                    return;
                }

                setActiveCampaign(data);
                setAdBudget(data.daily_budget);

                // 경과일 기반 광고 시뮬레이션
                const startDate = new Date(data.start_date);
                const msPerDay = 1000 * 60 * 60 * 24;
                const daysElapsed = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / msPerDay) + 1);
                // AI가 분석한 콘텐츠 품질 점수 (광고 집행 시 1회 Gemini 호출 → DB 저장값)
                // simulated_revenue 필드에 conversionBoost(0.3~2.5)가 저장되어 있음
                const contentScore = (data.simulated_revenue && data.simulated_revenue > 0 && data.simulated_revenue <= 2.5)
                    ? data.simulated_revenue
                    : 1.0;
                // 하루 도달 인원 (광고 예산 기반) × AI 콘텐츠 품질 점수
                const adBaseFollowers = Math.floor(data.daily_budget / 10);
                const daySim = simulateMarketingEffect(
                    { caption: content.caption, hashtags: content.tags, visualQuality: Math.min(1, contentScore / 2.5), baseFollowers: adBaseFollowers },
                    sellingPrice ?? 30000
                );
                const expectedImpressions = Math.min(
                    Math.floor(daySim.impressions * daysElapsed * data.mult),
                    Math.floor(daySim.impressions * data.duration_days * data.mult)
                );

                if (data.impressions < expectedImpressions) {
                    const newImpressions = expectedImpressions - data.impressions;
                    const newLikes = Math.max(1, Math.floor(newImpressions * (daySim.clicks / Math.max(daySim.impressions, 1)) * 0.4));
                    const newLandingVisits = Math.floor(newImpressions * 0.05);

                    // 광고 캠페인 통계 업데이트
                    await supabase.from("ad_campaigns").update({
                        impressions: expectedImpressions,
                        landing_visits: (data.landing_visits || 0) + newLandingVisits,
                    }).eq("id", data.id);

                    // 게시물 좋아요 업데이트 (광고 노출로 인한 AI 반응)
                    const { data: post } = await supabase.from("posts").select("likes, engagement_rate").eq("id", id).single();
                    if (post) {
                        const newLikesTotal = (post.likes || 0) + newLikes;
                        const newEngagement = parseFloat(((newLikesTotal / 500) * 100).toFixed(2));
                        await supabase.from("posts").update({
                            likes: newLikesTotal,
                            engagement_rate: newEngagement,
                        }).eq("id", id);
                        setLocalLikes(newLikesTotal);
                    }

                    setActiveCampaign(prev => prev ? {
                        ...prev,
                        impressions: expectedImpressions,
                        landing_visits: (prev.landing_visits || 0) + newLandingVisits,
                    } : null);
                }
            });
    }, [id, isMyPost]);

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

    // 가상 고객 반응 로드
    useEffect(() => {
        if (!showAiReactions || aiReactionsLoaded) return;
        supabase
            .from("comments")
            .select("id, user_name, text, created_at")
            .eq("post_id", id)
            .eq("is_ai_reaction", true)
            .order("created_at", { ascending: true })
            .then(({ data }) => {
                if (data) setAiReactions(data);
                setAiReactionsLoaded(true);
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAiReactions]);

    // 광고 집행 핸들러
    const handleRunAd = async () => {
        const plan = AD_PLANS[selectedPlanIdx];
        const totalCost = plan.dailyBudget * selectedDays;
        if (adRunning || balance < totalCost) return;
        setAdRunning(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // 총 예산 차감 (로컬 + Supabase)
            spendBalance(totalCost);
            const { data: prof } = await supabase.from("profiles").select("balance").eq("id", session.user.id).single();
            if (prof) {
                await supabase.from("profiles").update({ balance: Math.max(0, prof.balance - totalCost) }).eq("id", session.user.id);
            }

            // 기존 active 캠페인 완료 처리
            if (activeCampaign) {
                await supabase.from("ad_campaigns").update({ status: "completed" }).eq("id", activeCampaign.id);
            }

            // AI로 게시물 콘텐츠 품질 분석 (1회만 호출 — conversionBoost 0.3~2.5)
            let contentScore = 1.0;
            try {
                const aiRes = await fetch("/api/simulate/analyze-post", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        caption: content.caption,
                        tags: content.tags,
                        price: sellingPrice ?? 30000,
                        landingImages: landingImages ?? [],
                    }),
                });
                const aiData = await aiRes.json();
                if (aiData.ok && aiData.analysis?.conversionBoost) {
                    contentScore = aiData.analysis.conversionBoost;
                }
            } catch { /* AI 실패 시 기본값 1.0 유지 */ }

            // 새 캠페인 생성 (content_score를 simulated_revenue에 저장)
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + selectedDays * 24 * 60 * 60 * 1000);
            const { data: newCampaign } = await supabase.from("ad_campaigns").insert({
                post_id: id,
                user_id: session.user.id,
                user_handle: user.handle,
                total_budget: totalCost,
                daily_budget: plan.dailyBudget,
                duration_days: selectedDays,
                mult: plan.mult,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: "active",
                impressions: 0,
                landing_visits: 0,
                simulated_revenue: contentScore, // AI 분석 콘텐츠 품질 점수 저장
            }).select().single();

            // posts 테이블 ad_budget 동기화
            await supabase.from("posts").update({ ad_budget: plan.dailyBudget }).eq("id", id);

            setAdBudget(plan.dailyBudget);
            if (newCampaign) setActiveCampaign(newCampaign);
            setShowAdModal(false);
        } finally {
            setAdRunning(false);
        }
    };

    // 광고 중단
    const handleStopAd = async () => {
        if (!activeCampaign) return;
        await supabase.from("ad_campaigns").update({ status: "paused" }).eq("id", activeCampaign.id);
        await supabase.from("posts").update({ ad_budget: 0 }).eq("id", id);
        setActiveCampaign(null);
        setAdBudget(null);
        setShowAdModal(false);
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
        // images 컬럼은 첫 번째 이미지(image_url)를 제외한 나머지만 저장
        const extraImages = editImages.slice(1);
        const { error } = await supabase.from("posts").update({
            caption: editCaption,
            tags: tagList,
            image_url: firstImg,
            images: extraImages,
            landing_images: editLandingImages,
        }).eq("id", id);
        if (error) {
            alert("저장에 실패했어요. 다시 시도해주세요.");
            setEditSaving(false);
            return;
        }
        content.caption = editCaption;
        content.tags = tagList;
        content.image = firstImg;
        setAllImages(editImages);
        setImgIdx(0);
        setEditSaving(false);
        setShowEditModal(false);
        setShowMenu(false);
    };

    const handleDelete = async () => {
        if (!confirm("게시물을 삭제할까요?")) return;
        // 삭제 전 세션 유효성 확인 (모든 브라우저 공통)
        const session = await getValidSession();
        if (!session) { showSessionExpiredError(); return; }
        const { error } = await supabase.from("posts").delete().eq("id", id);
        if (error) {
            alert("삭제에 실패했어요. 잠시 후 다시 시도해 주세요.");
            return;
        }
        setDeleted(true);
        setShowMenu(false);
    };

    if (deleted) return null;

    return (
        <>
        {/* A/B 테스트 생성 모달 */}
        {showABModal && (
            <ABTestCreateModal
                postA={{ id, image: content.image, images: allImages, caption: content.caption, tags: content.tags }}
                onClose={() => setShowABModal(false)}
                onCreated={() => { setShowABModal(false); }}
            />
        )}

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
                            <span className="text-[15px] font-bold truncate cursor-pointer hover:underline" style={{ color: "var(--foreground)" }}>
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
                                    {/* ── 내 게시물 메뉴 ── */}
                                    {isMyPost && (
                                        <>
                                            <button
                                                onClick={hasAIAccess ? handleAIAnalyze : undefined}
                                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors hover:bg-foreground/5 text-left"
                                                style={{ color: hasAIAccess ? "var(--primary)" : "var(--foreground-muted)", cursor: hasAIAccess ? "pointer" : "default" }}
                                            >
                                                {hasAIAccess
                                                    ? <><Sparkles size={15} /> AI 분석하기</>
                                                    : <><Lock size={15} /> AI 분석하기 <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "#8B5CF622", color: "#8B5CF6" }}>팀 배정 필요</span></>
                                                }
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
                                            <button onClick={() => { setShowABModal(true); setShowMenu(false); }}
                                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors hover:bg-foreground/5 text-left"
                                                style={{ color: "#8B5CF6" }}>
                                                <FlaskConical size={15} /> A/B 테스트
                                            </button>
                                            {/* 시뮬레이션 게시물만 채널 이동 가능 */}
                                            {source === "simulation" && (
                                                <button
                                                    onClick={handleMoveToChannel}
                                                    disabled={movingToChannel}
                                                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors hover:bg-foreground/5 text-left disabled:opacity-50"
                                                    style={{ color: "#06D6A0" }}>
                                                    <ArrowRightCircle size={15} />
                                                    {movingToChannel ? "이동 중..." : "내 채널로 이동"}
                                                </button>
                                            )}
                                            <button onClick={handleDelete}
                                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors hover:bg-red-50 text-left"
                                                style={{ color: "#EF4444" }}>
                                                <Trash2 size={15} /> 삭제하기
                                            </button>
                                            <div style={{ borderTop: "1px solid var(--border)" }} />
                                        </>
                                    )}
                                    {/* ── 관리자 전용 메뉴 (다른 유저 게시물) ── */}
                                    {isAdmin && !isMyPost && (
                                        <>
                                            <div className="px-4 py-2 flex items-center gap-1.5">
                                                <Shield size={11} style={{ color: "#7C3AED" }} />
                                                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#7C3AED" }}>관리자</span>
                                            </div>
                                            {source === "simulation" && (
                                                <button
                                                    onClick={handleAdminMoveToChannel}
                                                    disabled={adminMoving}
                                                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors hover:bg-foreground/5 text-left disabled:opacity-50"
                                                    style={{ color: "#06D6A0" }}>
                                                    <ArrowRightCircle size={15} />
                                                    {adminMoving ? "이동 중..." : "채널로 이동"}
                                                </button>
                                            )}
                                            <button
                                                onClick={handleAdminDelete}
                                                disabled={adminDeleting}
                                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors hover:bg-red-50 text-left disabled:opacity-50"
                                                style={{ color: "#EF4444" }}>
                                                <Trash2 size={15} />
                                                {adminDeleting ? "삭제 중..." : "삭제하기 (관리자)"}
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
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 cursor-zoom-in"
                        onClick={() => setLightboxOpen(true)}
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
                {isMyPost && activeCampaign && activeCampaign.impressions > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[12px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                            광고 노출 {activeCampaign.impressions.toLocaleString()}회
                        </span>
                        {activeCampaign.landing_visits > 0 && (
                            <span className="text-[12px]" style={{ color: "var(--foreground-muted)" }}>
                                방문 {activeCampaign.landing_visits.toLocaleString()}회
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* ─── 캡션 + 해시태그 ─── */}
            <div className="px-4 pb-2">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
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

            {/* ─── 가상 고객 반응 토글 ─── */}
            <div className="px-4 pb-1">
                <button
                    onClick={() => setShowAiReactions(v => !v)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all"
                    style={{
                        color: showAiReactions ? "white" : "var(--foreground-muted)",
                        background: showAiReactions ? "linear-gradient(135deg, #4361EE, #06D6A0)" : "var(--surface-2)",
                        border: "1px solid var(--border)",
                    }}
                >
                    🤖 가상 고객 반응 {aiReactionsLoaded && aiReactions.length > 0 ? `(${aiReactions.length})` : "보기"}
                </button>
            </div>

            {showAiReactions && (
                <div className="mx-4 mb-3 rounded-xl overflow-hidden"
                    style={{ border: "1px solid rgba(67,97,238,0.25)", background: "rgba(67,97,238,0.04)" }}>
                    <div className="px-3 py-2 flex items-center gap-1.5"
                        style={{ borderBottom: "1px solid rgba(67,97,238,0.15)" }}>
                        <span className="text-[11px] font-black" style={{ color: "#4361EE" }}>🤖 가상 소비자 반응</span>
                        <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>— AI가 생성한 페르소나 반응입니다</span>
                    </div>
                    <div className="px-3 py-2 flex flex-col gap-2">
                        {!aiReactionsLoaded ? (
                            <div className="flex items-center gap-2 py-2">
                                <Loader2 size={12} className="animate-spin" style={{ color: "#4361EE" }} />
                                <span className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>불러오는 중...</span>
                            </div>
                        ) : aiReactions.length === 0 ? (
                            <p className="text-[11px] text-center py-2" style={{ color: "var(--foreground-muted)" }}>
                                게시물을 업로드하면 가상 고객 반응이 생성됩니다
                            </p>
                        ) : (
                            aiReactions.map((r) => {
                                const nameParts = r.user_name.match(/^(.+?)\(([^)]+)\)\s*$/);
                                const displayName = nameParts ? nameParts[1] : r.user_name;
                                const meta = nameParts ? nameParts[2] : "";
                                return (
                                    <div key={r.id} className="flex gap-2 items-start">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0"
                                            style={{ background: "rgba(67,97,238,0.12)", border: "1px solid rgba(67,97,238,0.2)" }}>
                                            🤖
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold" style={{ color: "#4361EE" }}>
                                                {displayName}
                                                {meta && <span className="font-normal text-[10px] ml-1" style={{ color: "var(--foreground-muted)" }}>· {meta}</span>}
                                            </p>
                                            <p className="text-[12px]" style={{ color: "var(--foreground-soft)" }}>{r.text}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
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

        {/* ─── 광고 모달 ─── */}
        {showAdModal && (() => {
            const plan = AD_PLANS[selectedPlanIdx];
            const totalCost = plan.dailyBudget * selectedDays;
            const canAfford = balance >= totalCost;
            const totalReach = plan.dailyReach * selectedDays;

            // 진행 중인 캠페인 기간 계산
            let elapsedDays = 0;
            let remainDays = 0;
            if (activeCampaign) {
                const now = Date.now();
                const start = new Date(activeCampaign.start_date).getTime();
                const end = new Date(activeCampaign.end_date).getTime();
                elapsedDays = Math.min((now - start) / 86400000, activeCampaign.duration_days);
                remainDays = Math.max(0, Math.ceil((end - now) / 86400000));
            }

            return (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                onClick={(e) => { if (e.target === e.currentTarget) setShowAdModal(false); }}
            >
                <div className="w-full max-w-sm rounded-t-3xl md:rounded-3xl overflow-y-auto"
                    style={{ background: "var(--surface)", maxHeight: "90vh" }}>

                    {/* 헤더 */}
                    <div className="px-5 py-4 flex items-center justify-between sticky top-0 z-10"
                        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(217,119,6,0.12)" }}>
                                <Megaphone size={15} style={{ color: "#D97706" }} />
                            </div>
                            <div>
                                <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                    {activeCampaign ? "광고 관리" : "광고 집행하기"}
                                </p>
                                <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>잔고: ₩{balance.toLocaleString()}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAdModal(false)}
                            className="p-1.5 rounded-xl" style={{ background: "var(--surface-2)" }}>
                            <X size={14} style={{ color: "var(--foreground-muted)" }} />
                        </button>
                    </div>

                    <div className="p-5 flex flex-col gap-5">

                        {/* ── 진행 중인 캠페인 성과 ── */}
                        {activeCampaign && (
                            <div className="flex flex-col gap-3">
                                {/* 상태 배너 */}
                                <div className="flex items-center justify-between p-3 rounded-2xl"
                                    style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.25)" }}>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block" />
                                        <span className="text-xs font-black" style={{ color: "#D97706" }}>광고 집행 중</span>
                                    </div>
                                    <span className="text-xs font-bold" style={{ color: "#D97706" }}>
                                        {remainDays > 0 ? `D-${remainDays} 남음` : "오늘 종료"}
                                    </span>
                                </div>

                                {/* 성과 지표 그리드 */}
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: "노출", value: activeCampaign.impressions.toLocaleString(), sub: "명", color: "var(--secondary)" },
                                        { label: "랜딩 방문", value: activeCampaign.landing_visits.toLocaleString(), sub: "명", color: "var(--accent)" },
                                        { label: "구매 건수", value: `${activeCampaign.simulated_purchases}건`, sub: "AI 시뮬", color: "var(--primary)" },
                                        { label: "시뮬 매출", value: `₩${activeCampaign.simulated_revenue.toLocaleString()}`, sub: `예산 ₩${activeCampaign.total_budget.toLocaleString()}`, color: "#06D6A0" },
                                    ].map(item => (
                                        <div key={item.label} className="p-3 rounded-2xl flex flex-col gap-1"
                                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                            <span className="text-[10px] font-bold uppercase" style={{ color: "var(--foreground-muted)" }}>{item.label}</span>
                                            <span className="text-base font-black" style={{ color: item.color }}>{item.value}</span>
                                            <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{item.sub}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* 기간 바 */}
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                                        <span>{new Date(activeCampaign.start_date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} 시작</span>
                                        <span>{new Date(activeCampaign.end_date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} 종료</span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                                        <div className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${Math.min(100, (elapsedDays / activeCampaign.duration_days) * 100)}%`,
                                                background: "linear-gradient(90deg, #D97706, #F59E0B)"
                                            }} />
                                    </div>
                                </div>

                                <button
                                    onClick={handleStopAd}
                                    className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
                                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground-soft)" }}
                                >
                                    광고 중단하기
                                </button>
                                <div className="flex items-center gap-2 my-1">
                                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                                    <span className="text-[10px] font-bold" style={{ color: "var(--foreground-muted)" }}>새 광고 집행</span>
                                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                                </div>
                            </div>
                        )}

                        {/* ── 플랜 선택 ── */}
                        <div className="flex flex-col gap-2">
                            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>광고 플랜</p>
                            {AD_PLANS.map((p, idx) => (
                                <button key={idx} onClick={() => setSelectedPlanIdx(idx)}
                                    className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all"
                                    style={{
                                        background: selectedPlanIdx === idx ? "rgba(217,119,6,0.08)" : "var(--surface-2)",
                                        border: selectedPlanIdx === idx ? "2px solid #D97706" : "1.5px solid var(--border)",
                                    }}>
                                    <span className="text-xl">{p.emoji}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>{p.label}</p>
                                        <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                            일 ~{p.dailyReach.toLocaleString()}명 노출 · 전환율 ×{p.mult}배
                                        </p>
                                    </div>
                                    <span className="text-sm font-black" style={{ color: "#D97706" }}>
                                        ₩{p.dailyBudget.toLocaleString()}<span className="text-[10px] font-bold">/일</span>
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* ── 기간 선택 ── */}
                        <div className="flex flex-col gap-2">
                            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>광고 기간</p>
                            <div className="flex gap-2">
                                {AD_DURATIONS.map(d => (
                                    <button key={d} onClick={() => setSelectedDays(d)}
                                        className="flex-1 py-3 rounded-2xl text-sm font-black transition-all"
                                        style={{
                                            background: selectedDays === d ? "#D97706" : "var(--surface-2)",
                                            color: selectedDays === d ? "white" : "var(--foreground-soft)",
                                            border: selectedDays === d ? "none" : "1px solid var(--border)",
                                        }}>
                                        {d}일
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── 예산 요약 ── */}
                        <div className="p-4 rounded-2xl flex flex-col gap-2"
                            style={{ background: canAfford ? "rgba(217,119,6,0.06)" : "rgba(239,68,68,0.06)",
                                border: `1px solid ${canAfford ? "rgba(217,119,6,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: "var(--foreground-soft)" }}>총 예산</span>
                                <span className="font-black" style={{ color: canAfford ? "#D97706" : "#EF4444" }}>
                                    ₩{totalCost.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span style={{ color: "var(--foreground-muted)" }}>예상 총 노출</span>
                                <span className="font-bold" style={{ color: "var(--foreground-soft)" }}>
                                    ~{totalReach.toLocaleString()}명
                                </span>
                            </div>
                            {!canAfford && (
                                <p className="text-[11px] font-bold" style={{ color: "#EF4444" }}>
                                    잔고 부족 (₩{(totalCost - balance).toLocaleString()} 더 필요)
                                </p>
                            )}
                        </div>

                        {/* ── 집행 버튼 ── */}
                        <button
                            onClick={handleRunAd}
                            disabled={!canAfford || adRunning}
                            className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
                            style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)" }}>
                            {adRunning
                                ? <><Loader2 size={16} className="animate-spin" /> 처리 중...</>
                                : <><Megaphone size={16} /> 광고 집행하기 · ₩{totalCost.toLocaleString()}</>
                            }
                        </button>
                        <p className="text-[10px] text-center -mt-2" style={{ color: "var(--foreground-muted)" }}>
                            광고 집행 시 즉시 예산이 차감되며 {selectedDays}일 후 자동 종료됩니다
                        </p>
                    </div>
                </div>
            </div>
            );
        })()}

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

        {/* ─── 라이트박스 ─── */}
        {lightboxOpen && allImages.length > 0 && (
            <div
                className="fixed inset-0 z-[99998] flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)" }}
                onClick={() => setLightboxOpen(false)}
            >
                {/* 닫기 버튼 */}
                <button
                    className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-70 z-10"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                    onClick={() => setLightboxOpen(false)}
                >
                    <X size={20} />
                </button>

                {/* 이미지 */}
                <img
                    src={allImages[imgIdx]}
                    alt={content.caption}
                    className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl select-none"
                    style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}
                    onClick={e => e.stopPropagation()}
                />

                {/* 멀티 이미지 이전/다음 */}
                {allImages.length > 1 && (
                    <>
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-20 transition-opacity hover:opacity-70"
                            style={{ background: "rgba(255,255,255,0.15)" }}
                            disabled={imgIdx === 0}
                            onClick={e => { e.stopPropagation(); setImgIdx(i => Math.max(0, i - 1)); }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-20 transition-opacity hover:opacity-70"
                            style={{ background: "rgba(255,255,255,0.15)" }}
                            disabled={imgIdx === allImages.length - 1}
                            onClick={e => { e.stopPropagation(); setImgIdx(i => Math.min(allImages.length - 1, i + 1)); }}
                        >
                            <ChevronRight size={20} />
                        </button>
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                            {allImages.map((_, i) => (
                                <button key={i}
                                    className="w-1.5 h-1.5 rounded-full transition-all"
                                    style={{ background: i === imgIdx ? "white" : "rgba(255,255,255,0.4)" }}
                                    onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        )}
        </>
    );
}
