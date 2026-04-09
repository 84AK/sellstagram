"use client";

import React, { useEffect, useState } from "react";
import { Plus, X, Image as ImageIcon, Video, ArrowLeft, Heart, MessageCircle, Share2, Send, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useGameStore } from "@/store/useGameStore";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** avatar가 http로 시작하면 이미지, 아니면 이모지/이니셜로 처리 */
function AvatarDisplay({ avatar, name, size }: { avatar?: string | null; name: string; size: "lg" | "md" | "sm" }) {
    const fontSize = size === "lg" ? "1.6rem" : size === "md" ? "1.1rem" : "0.8rem";
    if (avatar && (avatar.startsWith("http") || avatar.startsWith("/"))) {
        return <img src={avatar} alt={name} className="w-full h-full object-cover" />;
    }
    if (avatar && avatar.trim().length > 0) {
        return <span style={{ fontSize, lineHeight: 1 }}>{avatar}</span>;
    }
    return (
        <span className="font-black text-white" style={{ fontSize }}>
            {name[0]?.toUpperCase() ?? "?"}
        </span>
    );
}

interface StoryUser {
    id: string;
    name: string;
    handle: string;
    avatar?: string | null;
}

interface UserPost {
    id: string;
    type: "post" | "video";
    caption: string | null;
    image_url: string | null;
    description: string | null;
    likes: number;
    created_at: string;
    tags?: string[] | null;
}

interface Comment {
    id: string;
    user_name: string;
    user_handle: string;
    text: string;
    created_at: string;
}

interface UserModalProps {
    user: StoryUser;
    onClose: () => void;
}

function PostDetailView({ post, user }: { post: UserPost; user: StoryUser; onBack: () => void }) {
    const { user: currentUser } = useGameStore();
    const [isLiked, setIsLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(post.likes);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const [shareMsg, setShareMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // 댓글 초기 로드 + 실시간 구독
    useEffect(() => {
        const loadComments = async () => {
            const { data } = await supabase
                .from("comments")
                .select("id, user_name, user_handle, text, created_at")
                .eq("post_id", post.id)
                .order("created_at", { ascending: true });
            if (data) setComments(data);
        };
        loadComments();

        const channel = supabase
            .channel(`comments-${post.id}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `post_id=eq.${post.id}` }, (payload) => {
                setComments(prev => [...prev, payload.new as Comment]);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [post.id]);

    const handleLike = async () => {
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        const newCount = newLiked ? localLikes + 1 : localLikes - 1;
        setLocalLikes(newCount);
        await supabase.from("posts").update({ likes: newCount }).eq("id", post.id);
    };

    const handleSubmitComment = async () => {
        const text = commentInput.trim();
        if (!text || submitting) return;
        setSubmitting(true);
        setCommentInput("");
        await supabase.from("comments").insert({
            post_id: post.id,
            user_name: currentUser.name || "익명",
            user_handle: currentUser.handle || "unknown",
            text,
        });
        setSubmitting(false);
    };

    const handleShare = async () => {
        const text = post.caption ?? post.description ?? "Sellstagram 게시물";
        try {
            await navigator.clipboard.writeText(text);
            setShareMsg("클립보드에 복사됐어요!");
        } catch {
            setShareMsg("복사 실패");
        }
        setTimeout(() => setShareMsg(""), 2000);
    };

    return (
        <div className="flex flex-col">
            {/* 이미지 */}
            {post.image_url ? (
                <div className="relative w-full" style={{ aspectRatio: "1/1" }}>
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="w-full flex items-center justify-center" style={{ height: "320px", background: "var(--surface-2)" }}>
                    {post.type === "video"
                        ? <Video size={48} style={{ color: "var(--foreground-muted)" }} />
                        : <ImageIcon size={48} style={{ color: "var(--foreground-muted)" }} />
                    }
                </div>
            )}

            <div className="p-5 flex flex-col gap-4">
                {/* 액션 버튼 */}
                <div className="flex items-center gap-5">
                    <button
                        onClick={handleLike}
                        className="flex items-center gap-1.5 transition-all duration-200"
                        style={{ color: isLiked ? "var(--primary)" : "var(--foreground-soft)" }}
                    >
                        <Heart size={24} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 2.5 : 2} />
                        <span className="text-sm font-bold">{localLikes}</span>
                    </button>
                    <button
                        onClick={() => setShowComments(v => !v)}
                        className="transition-all duration-200"
                        style={{ color: showComments ? "var(--secondary)" : "var(--foreground-soft)" }}
                    >
                        <MessageCircle size={24} strokeWidth={2} />
                    </button>
                    <button onClick={handleShare} className="relative" style={{ color: "var(--foreground-soft)" }}>
                        <Share2 size={24} strokeWidth={2} />
                        {shareMsg && (
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap px-2 py-1 rounded-lg"
                                style={{ background: "var(--foreground)", color: "var(--background)" }}>
                                {shareMsg}
                            </span>
                        )}
                    </button>
                </div>

                {/* 댓글 영역 */}
                {showComments && (
                    <div className="flex flex-col gap-3">
                        {/* 댓글 목록 */}
                        {comments.length > 0 ? (
                            <div className="flex flex-col gap-2.5">
                                {comments.map((c) => (
                                    <div key={c.id} className="flex gap-2 items-start">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-white"
                                            style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}>
                                            {c.user_name[0]}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[11px] font-bold" style={{ color: "var(--foreground)" }}>{c.user_name} </span>
                                            <span className="text-[12px]" style={{ color: "var(--foreground-soft)" }}>{c.text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11px] text-center py-1" style={{ color: "var(--foreground-muted)" }}>
                                첫 번째 댓글을 남겨보세요!
                            </p>
                        )}
                        {/* 댓글 입력창 */}
                        <div className="flex items-center gap-2 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                                style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}>
                                {(currentUser.name || "나")[0]}
                            </div>
                            <input
                                type="text"
                                value={commentInput}
                                onChange={e => setCommentInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSubmitComment()}
                                placeholder="댓글 달기..."
                                className="flex-1 text-sm outline-none bg-transparent"
                                style={{ color: "var(--foreground)" }}
                                autoFocus
                                disabled={submitting}
                            />
                            <button
                                onClick={handleSubmitComment}
                                disabled={!commentInput.trim() || submitting}
                                className="p-1.5 rounded-full transition-all disabled:opacity-30"
                                style={{ color: "var(--secondary)" }}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* 캡션 */}
                {(post.caption || post.description) && (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                        <span className="font-bold mr-1" style={{ color: "var(--foreground)" }}>{user.name}</span>
                        {post.caption ?? post.description}
                    </p>
                )}

                {/* 태그 */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {post.tags.map(tag => (
                            <span key={tag} className="text-[11px] font-bold" style={{ color: "var(--accent)" }}>#{tag}</span>
                        ))}
                    </div>
                )}

                <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                    {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                </p>
            </div>
        </div>
    );
}

function UserPostsModal({ user, onClose }: UserModalProps) {
    const router = useRouter();
    const [posts, setPosts] = useState<UserPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<UserPost | null>(null);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from("posts")
                .select("id, type, caption, image_url, description, likes, created_at, tags")
                .eq("user_handle", user.handle)
                .order("created_at", { ascending: false })
                .limit(9);
            setPosts(data ?? []);
            setLoading(false);
        };
        load();
    }, [user.handle]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => { if (selected) setSelected(null); else onClose(); }}
        >
            <div
                className="w-full rounded-3xl overflow-hidden shadow-2xl overflow-y-auto"
                style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    maxWidth: selected ? "480px" : "360px",
                    maxHeight: "90vh",
                    transition: "max-width 0.3s ease",
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
                    style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                        {selected && (
                            <button onClick={() => setSelected(null)} className="p-1 rounded-full transition-colors hover:bg-black/5"
                                style={{ color: "var(--foreground-muted)" }}>
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <button
                            onClick={() => { onClose(); router.push(`/profile/${user.handle}`); }}
                            className="flex items-center gap-3 group text-left"
                        >
                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}
                            >
                                <AvatarDisplay avatar={user.avatar} name={user.name} size="md" />
                            </div>
                            <div>
                                <p className="text-sm font-black group-hover:underline" style={{ color: "var(--foreground)" }}>{user.name}</p>
                                <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>@{user.handle}</p>
                            </div>
                        </button>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => { onClose(); router.push(`/profile/${user.handle}`); }}
                            className="p-1.5 rounded-full transition-colors hover:bg-black/5"
                            title="프로필 보기"
                            style={{ color: "var(--foreground-muted)" }}
                        >
                            <ExternalLink size={16} />
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-full transition-colors hover:bg-black/5"
                            style={{ color: "var(--foreground-muted)" }}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {selected ? (
                    <PostDetailView post={selected} user={user} onBack={() => setSelected(null)} />
                ) : (
                    /* ── 게시물 그리드 ── */
                    <div className="p-4">
                        {loading ? (
                            <div className="grid grid-cols-3 gap-1.5">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="aspect-square rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
                                ))}
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="py-10 text-center">
                                <p className="text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>
                                    아직 게시물이 없어요
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1.5">
                                {posts.map(post => (
                                    <button
                                        key={post.id}
                                        onClick={() => setSelected(post)}
                                        className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer"
                                        style={{ background: "var(--surface-2)" }}
                                    >
                                        {post.image_url ? (
                                            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {post.type === "video"
                                                    ? <Video size={20} style={{ color: "var(--foreground-muted)" }} />
                                                    : <ImageIcon size={20} style={{ color: "var(--foreground-muted)" }} />
                                                }
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-[11px] font-bold">♥ {post.likes}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className="text-center text-[10px] mt-3" style={{ color: "var(--foreground-muted)" }}>
                            게시물 {posts.length}개
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function StoryBar() {
    const { user } = useGameStore();
    const [others, setOthers] = useState<StoryUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<StoryUser | null>(null);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from("profiles")
                .select("id, name, handle, avatar")
                .neq("handle", user.handle || "")
                .order("created_at", { ascending: false })
                .limit(50);
            if (data) setOthers(data);
        };
        load();
    }, [user.handle]);

    return (
        <>
            <div className="flex items-center gap-4 py-4 px-2 overflow-x-auto no-scrollbar">
                {/* 내 스토리 → 프로필로 이동 */}
                <Link href="/profile" className="flex flex-col items-center gap-1.5 shrink-0 group">
                    <div className="relative p-[2.5px] rounded-full bg-foreground/5 border border-foreground/10 transition-transform duration-300 group-hover:scale-105">
                        <div className="w-14 h-14 rounded-full bg-background border-2 border-background overflow-hidden relative flex items-center justify-center">
                            <AvatarDisplay avatar={user.avatar} name={user.name || "?"} size="lg" />
                            <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                                <Plus size={10} className="text-white" strokeWidth={4} />
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] font-medium text-foreground/40">내 스토리</span>
                </Link>

                {/* 다른 가입자 → 팝업 */}
                {others.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setSelectedUser(s)}
                        className="flex flex-col items-center gap-1.5 shrink-0 group"
                    >
                        <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-primary via-accent to-secondary transition-transform duration-300 group-hover:scale-105">
                            <div className="w-14 h-14 rounded-full bg-background border-2 border-background overflow-hidden flex items-center justify-center">
                                <AvatarDisplay avatar={s.avatar} name={s.name} size="lg" />
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-foreground">{s.name}</span>
                    </button>
                ))}

                {others.length === 0 && (
                    <span className="text-[11px] text-foreground/30 italic pl-2">
                        아직 다른 학생이 없어요
                    </span>
                )}
            </div>

            {/* 유저 게시물 팝업 */}
            {selectedUser && (
                <UserPostsModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </>
    );
}
