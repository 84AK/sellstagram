"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useGameStore } from "@/store/useGameStore";
import {
    ArrowLeft, Heart, MessageCircle, Send, Bookmark,
    MoreHorizontal, Loader2, X, Check, Link2, Grid3x3,
    ShoppingBag, ChevronLeft, ChevronRight, Sparkles, Pencil,
} from "lucide-react";

interface PostDetail {
    id: string;
    user_id: string | null;
    user_name: string;
    user_handle: string;
    user_avatar: string;
    caption: string | null;
    image_url: string | null;
    tags: string[];
    likes: number;
    comments: number;
    shares: number;
    created_at: string;
    landing_images: string[] | null;
    selling_price: number | null;
    sold_count: number | null;
    seller_user_id: string | null;
}

interface Comment {
    id: string;
    user_name: string;
    text: string;
    created_at: string;
}

interface OtherPost {
    id: string;
    image_url: string | null;
    likes: number;
    caption: string | null;
}

export default function PostDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user: me, balance, addFunds } = useGameStore();
    const isLoggedIn = !!me.handle;

    const [post, setPost] = useState<PostDetail | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [otherPosts, setOtherPosts] = useState<OtherPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [isLiked, setIsLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    // 랜딩 페이지 슬라이더
    const [slideIdx, setSlideIdx] = useState(0);

    // 구매 관련
    const [buying, setBuying] = useState(false);
    const [buyDone, setBuyDone] = useState(false);
    const [buyError, setBuyError] = useState("");
    const [localSoldCount, setLocalSoldCount] = useState(0);
    const [showBuyModal, setShowBuyModal] = useState(false);

    // 랜딩페이지 수정
    const [showEditLanding, setShowEditLanding] = useState(false);
    const [editPrice, setEditPrice] = useState("");
    const [editCaption, setEditCaption] = useState("");
    const [editTags, setEditTags] = useState("");
    const [editSaving, setEditSaving] = useState(false);

    /* ── 데이터 로드 ── */
    useEffect(() => {
        if (!id) return;
        (async () => {
            const { data, error } = await supabase
                .from("posts")
                .select("id, user_id, user_name, user_handle, user_avatar, caption, image_url, tags, likes, comments, shares, created_at, landing_images, selling_price, sold_count, seller_user_id")
                .eq("id", id)
                .single();

            if (error || !data) { setNotFound(true); setLoading(false); return; }
            setPost(data as PostDetail);
            setLocalLikes(data.likes);
            setLocalSoldCount(data.sold_count ?? 0);

            // 랜딩 페이지 방문 추적 (활성 광고 캠페인이 있으면 landing_visits 증가)
            const { data: campaign } = await supabase
                .from("ad_campaigns")
                .select("id, landing_visits, end_date")
                .eq("post_id", id)
                .eq("status", "active")
                .maybeSingle();
            if (campaign && new Date(campaign.end_date) > new Date()) {
                await supabase.from("ad_campaigns")
                    .update({ landing_visits: (campaign.landing_visits ?? 0) + 1 })
                    .eq("id", campaign.id);
            }

            const likedIds: string[] = JSON.parse(localStorage.getItem("liked_posts") || "[]");
            const savedIds: string[] = JSON.parse(localStorage.getItem("saved_posts") || "[]");
            setIsLiked(likedIds.includes(id));
            setIsSaved(savedIds.includes(id));

            const { data: cmts } = await supabase
                .from("comments")
                .select("id, user_name, text, created_at")
                .eq("post_id", id)
                .eq("is_ai_reaction", false)
                .order("created_at", { ascending: true });
            if (cmts) setComments(cmts);

            const { data: others } = await supabase
                .from("posts")
                .select("id, image_url, likes, caption")
                .eq("user_handle", data.user_handle)
                .neq("id", id)
                .order("created_at", { ascending: false })
                .limit(9);
            if (others) setOtherPosts(others as OtherPost[]);

            setLoading(false);
        })();
    }, [id]);

    /* ── 댓글 실시간 ── */
    useEffect(() => {
        if (!id) return;
        const ch = supabase
            .channel(`post-detail-comments-${id}`)
            .on("postgres_changes", {
                event: "INSERT", schema: "public", table: "comments",
                filter: `post_id=eq.${id}`,
            }, (payload) => {
                const c = payload.new as Comment & { is_ai_reaction?: boolean };
                if (!c.is_ai_reaction) setComments(prev => [...prev, c]);
            })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [id]);

    const handleLike = async () => {
        if (!post) return;
        const next = !isLiked;
        setIsLiked(next);
        const newCount = next ? localLikes + 1 : localLikes - 1;
        setLocalLikes(newCount);
        const likedIds: string[] = JSON.parse(localStorage.getItem("liked_posts") || "[]");
        localStorage.setItem("liked_posts", JSON.stringify(
            next ? [...likedIds, id] : likedIds.filter(x => x !== id)
        ));
        await supabase.from("posts").update({ likes: newCount }).eq("id", id);
    };

    const handleSave = () => {
        const next = !isSaved;
        setIsSaved(next);
        const savedIds: string[] = JSON.parse(localStorage.getItem("saved_posts") || "[]");
        localStorage.setItem("saved_posts", JSON.stringify(
            next ? [...savedIds, id] : savedIds.filter(x => x !== id)
        ));
    };

    const handleComment = async () => {
        const text = commentInput.trim();
        if (!text || submitting) return;
        setSubmitting(true);
        setCommentInput("");
        await supabase.from("comments").insert({
            post_id: id,
            user_name: me.name || "익명",
            user_handle: me.handle || "unknown",
            text,
            is_ai_reaction: false,
        });
        setSubmitting(false);
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
    };

    /* ── 판매자 잔액 실시간 구독 (판매자 본인에게만 적용) ── */
    useEffect(() => {
        if (!post?.seller_user_id) return;
        let ch: ReturnType<typeof supabase.channel> | null = null;
        supabase.auth.getSession().then(({ data: { session: sess } }) => {
            if (!sess?.user || sess.user.id !== post.seller_user_id) return;
            ch = supabase
                .channel(`profile-balance-${post.seller_user_id}`)
                .on("postgres_changes", {
                    event: "UPDATE", schema: "public", table: "profiles",
                    filter: `id=eq.${post.seller_user_id}`,
                }, (payload) => {
                    const newBal = (payload.new as { balance?: number }).balance;
                    if (typeof newBal === "number") {
                        // Zustand balance를 DB 값으로 동기화
                        addFunds(newBal - balance);
                    }
                })
                .subscribe();
        });
        return () => { if (ch) supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [post?.seller_user_id]);

    /* ── 랜딩페이지 수정 ── */
    const openEditLanding = () => {
        if (!post) return;
        setEditPrice(String(post.selling_price ?? ""));
        setEditCaption(post.caption ?? "");
        setEditTags((post.tags ?? []).join(", "));
        setShowEditLanding(true);
    };

    const handleLandingEditSave = async () => {
        if (!post || editSaving) return;
        const price = parseInt(editPrice.replace(/[^0-9]/g, ""));
        if (isNaN(price) || price <= 0) { alert("올바른 가격을 입력해주세요."); return; }
        setEditSaving(true);
        const tagList = editTags.split(",").map(t => t.trim()).filter(Boolean);
        const { error } = await supabase.from("posts").update({
            selling_price: price,
            caption: editCaption.trim(),
            tags: tagList,
        }).eq("id", post.id);
        if (error) {
            alert("저장에 실패했어요. 다시 시도해주세요.");
            setEditSaving(false);
            return;
        }
        setPost(prev => prev ? { ...prev, selling_price: price, caption: editCaption.trim(), tags: tagList } : prev);
        setEditSaving(false);
        setShowEditLanding(false);
    };

    /* ── 구매 ── */
    const handleBuy = async () => {
        if (!post?.selling_price || buying || buyDone) return;
        setBuyError("");
        const price = post.selling_price;

        if (balance < price) {
            setBuyError(`잔액이 부족해요. (보유: ₩${balance.toLocaleString()})`);
            return;
        }

        setBuying(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) { setBuyError("로그인이 필요해요."); setBuying(false); return; }

            const buyerId = session.user.id;
            const sellerId = post.seller_user_id;

            // 1. 구매자 잔액 차감 (Zustand + DB)
            addFunds(-price);
            const { data: buyerProf } = await supabase.from("profiles").select("balance").eq("id", buyerId).single();
            const newBuyerBal = (buyerProf?.balance ?? 0) - price;
            await supabase.from("profiles").update({ balance: newBuyerBal }).eq("id", buyerId);

            // 2. 판매자 잔액 증가
            if (sellerId) {
                const { data: sellerProf } = await supabase.from("profiles").select("balance").eq("id", sellerId).single();
                const newSellerBal = (sellerProf?.balance ?? 0) + price;
                await supabase.from("profiles").update({ balance: newSellerBal }).eq("id", sellerId);
                // 판매자가 현재 사용자이면 Zustand도 업데이트
                if (sellerId === buyerId) {
                    addFunds(price); // 차감한 것 복구 후 판매금 추가는 아니므로 net 0, 구매 차감이 이미 됐으므로 추가만
                }
            }

            // 3. 거래 기록 (virtual_sales 테이블 없어도 진행)
            await supabase.from("virtual_sales").insert({
                post_id: id,
                seller_id: sellerId ?? null,
                buyer_id: buyerId,
                amount: price,
            }).then(() => {/* 무시 */});

            // 4. sold_count 증가
            const newSoldCount = localSoldCount + 1;
            setLocalSoldCount(newSoldCount);
            await supabase.from("posts").update({ sold_count: newSoldCount }).eq("id", id);

            setBuyDone(true);
            setShowBuyModal(true);
        } catch {
            setBuyError("구매 처리 중 오류가 발생했어요. 다시 시도해주세요.");
            addFunds(post.selling_price); // 롤백
        } finally {
            setBuying(false);
        }
    };

    const timeAgo = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
        if (diff < 60) return "방금 전";
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
        return `${Math.floor(diff / 86400)}일 전`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--primary)" }} />
        </div>
    );

    if (notFound || !post) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--background)" }}>
            <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>게시물을 찾을 수 없어요</p>
            <button onClick={() => router.push("/feed")}
                className="text-sm font-semibold" style={{ color: "var(--secondary)" }}>
                피드로 돌아가기
            </button>
        </div>
    );

    const hasLanding = post.landing_images && post.landing_images.length > 0 && post.selling_price;
    const images = post.landing_images ?? [];
    const isMyPost = post.user_handle === me.handle;

    return (
        <div className="min-h-screen pb-4" style={{ background: "var(--background)" }}>

            {/* ── 모바일 헤더 ── */}
            <div className="flex items-center gap-3 px-4 py-3 md:hidden sticky top-0 z-10" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ color: "var(--foreground)" }}>
                    <ArrowLeft size={22} />
                </button>
                <span className="text-[15px] font-bold flex-1" style={{ color: "var(--foreground)" }}>
                    {hasLanding ? "상품 상세" : "게시물"}
                </span>
                {hasLanding && (
                    <span className="text-[12px] font-bold px-2.5 py-1 rounded-full text-white"
                        style={{ background: "var(--primary)" }}>
                        ₩{post.selling_price!.toLocaleString()}
                    </span>
                )}
            </div>

            {/* ── 데스크탑 뒤로가기 ── */}
            <div className="hidden md:flex items-center gap-3 px-6 py-4 max-w-5xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "var(--foreground-soft)" }}
                >
                    <ArrowLeft size={18} /> 뒤로가기
                </button>
            </div>

            <div className="max-w-2xl mx-auto">

                {/* ── 랜딩 페이지 모드 ── */}
                {hasLanding ? (
                    <div className="flex flex-col">
                        {/* 상품 이미지 슬라이더 */}
                        <div className="relative w-full aspect-square" style={{ background: "var(--surface-2)" }}>
                            <img
                                src={images[slideIdx]}
                                alt={`상품 이미지 ${slideIdx + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setSlideIdx(i => Math.max(0, i - 1))}
                                        disabled={slideIdx === 0}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white disabled:opacity-20 transition-opacity hover:bg-black/60"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => setSlideIdx(i => Math.min(images.length - 1, i + 1))}
                                        disabled={slideIdx === images.length - 1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white disabled:opacity-20 transition-opacity hover:bg-black/60"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                    {/* 인디케이터 */}
                                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                                        {images.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSlideIdx(i)}
                                                className="w-1.5 h-1.5 rounded-full transition-all"
                                                style={{ background: i === slideIdx ? "white" : "rgba(255,255,255,0.5)" }}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* 썸네일 스트립 */}
                        {images.length > 1 && (
                            <div className="flex gap-1.5 px-4 py-3 overflow-x-auto" style={{ background: "var(--surface)" }}>
                                {images.map((url, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSlideIdx(i)}
                                        className="w-14 h-14 rounded-lg overflow-hidden shrink-0 transition-all"
                                        style={{ outline: i === slideIdx ? "2px solid var(--primary)" : "none", outlineOffset: "1px" }}
                                    >
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* 상품 정보 */}
                        <div className="px-4 py-5 flex flex-col gap-4" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                            {/* 판매자 */}
                            <button
                                onClick={() => router.push(`/profile/${encodeURIComponent(post.user_handle)}`)}
                                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity w-fit"
                            >
                                <div
                                    className="w-9 h-9 rounded-full p-[2px] shrink-0"
                                    style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
                                >
                                    <div
                                        className="w-full h-full rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                                        style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}
                                    >
                                        {post.user_avatar?.startsWith("http") ? (
                                            <img src={post.user_avatar} alt={post.user_name} className="w-full h-full rounded-full object-cover" />
                                        ) : post.user_avatar ? (
                                            <span>{post.user_avatar}</span>
                                        ) : (
                                            (post.user_name?.[0] ?? "?").toUpperCase()
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>{post.user_name}</p>
                                    <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>@{post.user_handle}</p>
                                </div>
                            </button>

                            {/* 가격 + 판매수 */}
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[11px] font-bold mb-0.5" style={{ color: "var(--foreground-muted)" }}>판매가</p>
                                    <p className="text-3xl font-black" style={{ color: "var(--primary)" }}>
                                        ₩{post.selling_price!.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>누적 판매</p>
                                    <p className="text-lg font-black" style={{ color: "var(--foreground)" }}>{localSoldCount}건</p>
                                </div>
                            </div>

                            {/* 캡션 */}
                            {post.caption && (
                                <div className="p-4 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Sparkles size={12} style={{ color: "var(--primary)" }} />
                                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>상품 설명</span>
                                    </div>
                                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--foreground-soft)" }}>{post.caption}</p>
                                    {post.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {post.tags.map(tag => (
                                                <span key={tag} className="text-[12px] font-medium" style={{ color: "var(--secondary)" }}>#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 댓글 섹션 */}
                        <div className="px-4 py-4 flex flex-col gap-3" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                            <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>댓글 {comments.length}개</p>
                            {comments.map(c => (
                                <div key={c.id} className="flex gap-2.5">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                                        style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}>
                                        {(c.user_name?.[0] ?? "?").toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[13px]" style={{ color: "var(--foreground)" }}>
                                            <span className="font-semibold">{c.user_name} </span>
                                            <span style={{ color: "var(--foreground-soft)" }}>{c.text}</span>
                                        </p>
                                        <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>{timeAgo(c.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-[12px] text-center py-2" style={{ color: "var(--foreground-muted)" }}>첫 댓글을 남겨보세요!</p>
                            )}
                            {/* 댓글 입력 */}
                            {isLoggedIn ? (
                            <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                    style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}>
                                    {(me.name?.[0] ?? "?").toUpperCase()}
                                </div>
                                <input
                                    type="text"
                                    value={commentInput}
                                    onChange={e => setCommentInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleComment()}
                                    placeholder="댓글 달기..."
                                    className="flex-1 text-[13px] outline-none bg-transparent"
                                    style={{ color: "var(--foreground)" }}
                                    disabled={submitting}
                                />
                                {submitting
                                    ? <Loader2 size={14} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                                    : <button onClick={handleComment} disabled={!commentInput.trim()}
                                        className="text-[13px] font-bold disabled:opacity-30" style={{ color: "var(--secondary)" }}>게시</button>
                                }
                            </div>
                            ) : (
                            <div className="pt-2 text-center text-[12px]" style={{ borderTop: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
                                <a href="/login" className="font-bold" style={{ color: "var(--secondary)" }}>로그인</a>하고 댓글을 달아보세요
                            </div>
                            )}
                        </div>

                                        {/* ── 구매 완료 모달 ── */}
                        {showBuyModal && (
                            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm"
                                onClick={() => setShowBuyModal(false)}>
                                <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                                    onClick={e => e.stopPropagation()}>
                                    <div className="px-6 pt-8 pb-6 flex flex-col items-center gap-4 text-center">
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center"
                                            style={{ background: "linear-gradient(135deg, var(--accent), #04B893)" }}>
                                            <Check size={32} className="text-white" strokeWidth={3} />
                                        </div>
                                        <div>
                                            <p className="text-xl font-black mb-1" style={{ color: "var(--foreground)" }}>구매 완료!</p>
                                            <p className="text-[14px]" style={{ color: "var(--foreground-soft)" }}>
                                                <span className="font-black" style={{ color: "var(--primary)" }}>₩{post.selling_price!.toLocaleString()}</span>이 구매 처리되었어요.
                                            </p>
                                            <p className="text-[12px] mt-1" style={{ color: "var(--foreground-muted)" }}>
                                                판매자 <span className="font-semibold">@{post.user_handle}</span>의 잔액에 즉시 입금됩니다.
                                            </p>
                                        </div>
                                        <div className="w-full rounded-2xl px-4 py-3 flex items-center justify-between"
                                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                            <span className="text-[12px] font-bold" style={{ color: "var(--foreground-muted)" }}>내 잔액</span>
                                            <span className="text-[14px] font-black" style={{ color: "var(--secondary)" }}>₩{balance.toLocaleString()}</span>
                                        </div>
                                        <button
                                            onClick={() => setShowBuyModal(false)}
                                            className="w-full py-3.5 rounded-2xl font-black text-white text-[15px] transition-all hover:opacity-90"
                                            style={{ background: "var(--secondary)" }}
                                        >
                                            확인
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── 하단 구매 버튼 ── */}
                        <div className="sticky bottom-0 z-20 px-4 py-4"
                            style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
                            {buyError && (
                                <p className="text-[12px] font-bold text-center mb-2" style={{ color: "var(--primary)" }}>{buyError}</p>
                            )}
                            {!isLoggedIn ? (
                                <a href="/login"
                                    className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm text-white transition-all hover:opacity-90"
                                    style={{ background: "linear-gradient(135deg, var(--secondary), #6B8EFF)" }}>
                                    <ShoppingBag size={18} /> 로그인하고 구매하기
                                </a>
                            ) : isMyPost ? (
                                <div className="flex gap-2">
                                    <div className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm"
                                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
                                        <ShoppingBag size={18} /> 내 게시물 · 판매 중
                                    </div>
                                    <button
                                        onClick={openEditLanding}
                                        className="px-5 py-4 rounded-2xl flex items-center gap-2 font-black text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
                                        style={{ background: "linear-gradient(135deg, var(--secondary), #6B5CE7)" }}
                                    >
                                        <Pencil size={16} /> 수정
                                    </button>
                                </div>
                            ) : buyDone ? (
                                <div className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm text-white"
                                    style={{ background: "var(--accent)" }}>
                                    <Check size={18} /> 구매 완료!
                                </div>
                            ) : (
                                <button
                                    onClick={handleBuy}
                                    disabled={buying || balance < (post.selling_price ?? 0)}
                                    className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                                    style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)", boxShadow: "0 4px 20px rgba(255,107,53,0.35)" }}
                                >
                                    {buying ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} />}
                                    {buying ? "처리 중..." : `구매하기 · ₩${post.selling_price!.toLocaleString()}`}
                                </button>
                            )}
                            <p className="text-[11px] text-center mt-1.5" style={{ color: "var(--foreground-muted)" }}>
                                {!isLoggedIn ? "셀스타그램에 로그인하면 구매할 수 있어요" : isMyPost ? `누적 판매 ${localSoldCount}건` : `내 잔액: ₩${balance.toLocaleString()} · 구매 시 즉시 판매자에게 전달`}
                            </p>
                        </div>
                    </div>

                ) : (
                    // ── 일반 게시물 뷰 (기존 스타일) ──
                    <div
                        className="flex flex-col md:flex-row md:rounded-2xl overflow-hidden md:mx-6"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        {/* 좌측: 이미지 */}
                        <div className="md:w-[55%] aspect-square md:aspect-auto md:min-h-[520px] relative flex-shrink-0" style={{ background: "var(--surface-2)" }}>
                            {post.image_url ? (
                                <img src={post.image_url} alt={post.caption ?? ""} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="font-black text-8xl italic select-none" style={{ color: "var(--border)" }}>S</span>
                                </div>
                            )}
                        </div>

                        {/* 우측: 정보 */}
                        <div className="flex flex-col flex-1 min-h-0">
                            {/* 헤더 */}
                            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                                <button
                                    onClick={() => router.push(`/profile/${encodeURIComponent(post.user_handle)}`)}
                                    className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                                >
                                    <div
                                        className="w-9 h-9 rounded-full p-[2px] shrink-0"
                                        style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
                                    >
                                        <div
                                            className="w-full h-full rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                                            style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}
                                        >
                                            {post.user_avatar?.startsWith("http") ? (
                                                <img src={post.user_avatar} alt={post.user_name} className="w-full h-full rounded-full object-cover" />
                                            ) : post.user_avatar ? (
                                                <span className="text-base">{post.user_avatar}</span>
                                            ) : (
                                                (post.user_name?.[0] ?? "?").toUpperCase()
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>{post.user_name}</p>
                                        <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>@{post.user_handle}</p>
                                    </div>
                                </button>
                                <MoreHorizontal size={20} style={{ color: "var(--foreground-muted)" }} />
                            </div>

                            {/* 댓글 + 캡션 */}
                            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ maxHeight: "340px" }}>
                                <div className="flex gap-2.5">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                                        style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}>
                                        {(post.user_name?.[0] ?? "?").toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[13px]" style={{ color: "var(--foreground)" }}>
                                            <span className="font-semibold">{post.user_handle} </span>
                                            {post.caption}
                                        </p>
                                        {post.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {post.tags.map(tag => (
                                                    <span key={tag} className="text-[12px] font-medium" style={{ color: "var(--secondary)" }}>#{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-[10px] mt-1" style={{ color: "var(--foreground-muted)" }}>{timeAgo(post.created_at)}</p>
                                    </div>
                                </div>

                                {comments.map(c => (
                                    <div key={c.id} className="flex gap-2.5">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                                            style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}>
                                            {(c.user_name?.[0] ?? "?").toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-[13px]" style={{ color: "var(--foreground)" }}>
                                                <span className="font-semibold">{c.user_name} </span>
                                                <span style={{ color: "var(--foreground-soft)" }}>{c.text}</span>
                                            </p>
                                            <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>{timeAgo(c.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                                {comments.length === 0 && (
                                    <p className="text-[12px] text-center py-4" style={{ color: "var(--foreground-muted)" }}>첫 번째 댓글을 남겨보세요!</p>
                                )}
                            </div>

                            {/* 하단 액션 바 */}
                            <div style={{ borderTop: "1px solid var(--border)" }}>
                                <div className="flex items-center justify-between px-3 py-2.5">
                                    <div className="flex items-center gap-1">
                                        <button onClick={handleLike} className="p-2 transition-all active:scale-90"
                                            style={{ color: isLiked ? "#E1306C" : "var(--foreground)" }}>
                                            <Heart size={24} fill={isLiked ? "currentColor" : "none"} strokeWidth={1.8} />
                                        </button>
                                        <button className="p-2" style={{ color: "var(--foreground)" }}>
                                            <MessageCircle size={24} strokeWidth={1.8} />
                                        </button>
                                        <button onClick={handleCopyLink} className="p-2 transition-colors"
                                            style={{ color: linkCopied ? "var(--accent)" : "var(--foreground)" }}>
                                            {linkCopied ? <Check size={24} strokeWidth={2} /> : <Send size={24} strokeWidth={1.8} />}
                                        </button>
                                    </div>
                                    <button onClick={handleSave} className="p-2" style={{ color: "var(--foreground)" }}>
                                        <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} strokeWidth={1.8} />
                                    </button>
                                </div>

                                <div className="px-4 pb-1">
                                    <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>좋아요 {localLikes.toLocaleString()}개</p>
                                    <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                        {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                                    </p>
                                </div>

                                <div className="px-4 pb-2 pt-1">
                                    <button onClick={handleCopyLink}
                                        className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
                                        style={{ color: linkCopied ? "var(--accent)" : "var(--foreground-muted)" }}>
                                        {linkCopied ? <Check size={13} /> : <Link2 size={13} />}
                                        {linkCopied ? "링크 복사됨!" : "링크 복사"}
                                    </button>
                                </div>

                                {isLoggedIn ? (
                                <div className="flex items-center gap-2 px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                        style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}>
                                        {(me.name?.[0] ?? "?").toUpperCase()}
                                    </div>
                                    <input
                                        type="text"
                                        value={commentInput}
                                        onChange={e => setCommentInput(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleComment()}
                                        placeholder="댓글 달기..."
                                        className="flex-1 text-[13px] outline-none bg-transparent"
                                        style={{ color: "var(--foreground)" }}
                                        disabled={submitting}
                                    />
                                    {submitting
                                        ? <Loader2 size={14} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                                        : <button onClick={handleComment} disabled={!commentInput.trim()}
                                            className="text-[13px] font-bold disabled:opacity-30" style={{ color: "var(--secondary)" }}>게시</button>
                                    }
                                </div>
                                ) : (
                                <div className="px-4 py-3 text-center text-[12px]" style={{ borderTop: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
                                    <a href="/login" className="font-bold" style={{ color: "var(--secondary)" }}>로그인</a>하고 댓글을 달아보세요
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 작성자의 다른 게시물 ── */}
                {otherPosts.length > 0 && (
                    <div className="mt-8 px-4 md:px-6 pb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <Grid3x3 size={16} style={{ color: "var(--foreground-muted)" }} />
                            <button
                                onClick={() => router.push(`/profile/${encodeURIComponent(post.user_handle)}`)}
                                className="text-[13px] font-bold hover:underline"
                                style={{ color: "var(--foreground)" }}
                            >
                                @{post.user_handle}의 다른 게시물
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            {otherPosts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => router.push(`/post/${p.id}`)}
                                    className="relative aspect-square overflow-hidden group"
                                    style={{ background: "var(--surface-2)" }}
                                >
                                    {p.image_url ? (
                                        <img src={p.image_url} alt={p.caption ?? ""} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="font-black text-4xl italic select-none" style={{ color: "var(--border)" }}>S</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <div className="flex items-center gap-1 text-white text-[13px] font-bold">
                                            <Heart size={16} fill="white" /> {p.likes}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── 랜딩페이지 수정 모달 ── */}
            {showEditLanding && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => !editSaving && setShowEditLanding(false)}>
                    <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                        onClick={e => e.stopPropagation()}>

                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-5 py-4"
                            style={{ borderBottom: "1px solid var(--border)" }}>
                            <h3 className="text-[16px] font-black" style={{ color: "var(--foreground)" }}>
                                랜딩페이지 수정
                            </h3>
                            <button onClick={() => setShowEditLanding(false)} disabled={editSaving}
                                className="p-1.5 rounded-full" style={{ color: "var(--foreground-muted)" }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-5 py-5 flex flex-col gap-5">
                            {/* 판매가격 */}
                            <div>
                                <label className="text-[12px] font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>
                                    판매 가격 (₩)
                                </label>
                                <input
                                    type="number"
                                    value={editPrice}
                                    onChange={e => setEditPrice(e.target.value)}
                                    placeholder="예: 29000"
                                    className="w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none"
                                    style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                                />
                            </div>

                            {/* 상품 설명 */}
                            <div>
                                <label className="text-[12px] font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>
                                    상품 설명
                                </label>
                                <textarea
                                    value={editCaption}
                                    onChange={e => setEditCaption(e.target.value)}
                                    placeholder="상품의 특징, 혜택, 감성적인 설명을 입력하세요"
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl text-sm leading-relaxed outline-none resize-none"
                                    style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                                />
                            </div>

                            {/* 해시태그 */}
                            <div>
                                <label className="text-[12px] font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>
                                    해시태그 (쉼표로 구분)
                                </label>
                                <input
                                    type="text"
                                    value={editTags}
                                    onChange={e => setEditTags(e.target.value)}
                                    placeholder="예: 이어폰, 무선, 노이즈캔슬링"
                                    className="w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none"
                                    style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                                />
                                <p className="text-[11px] mt-1" style={{ color: "var(--foreground-muted)" }}>
                                    이미지 수정은 피드의 게시물 수정에서 할 수 있어요
                                </p>
                            </div>

                            {/* 저장 버튼 */}
                            <button
                                onClick={handleLandingEditSave}
                                disabled={editSaving || !editPrice || !editCaption.trim()}
                                className="w-full py-4 rounded-2xl font-black text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg, var(--secondary), #6B5CE7)" }}
                            >
                                {editSaving ? <><Loader2 size={16} className="animate-spin" /> 저장 중...</> : <><Check size={16} /> 저장하기</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
