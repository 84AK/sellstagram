"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useGameStore } from "@/store/useGameStore";
import {
    ArrowLeft, Link as LinkIcon, Grid3x3, Heart, MessageCircle,
    Loader2, ExternalLink, X, Send, Trash2, Search,
} from "lucide-react";

/* ── 타입 ── */
interface PublicProfile {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    bio: string | null;
    profile_link: string | null;
    team: string | null;
    rank: string | null;
    points: number;
}

interface Post {
    id: string;
    caption: string | null;
    image_url: string | null;
    likes: number;
    comments: number;
    created_at: string;
    user_name: string;
    user_avatar: string;
}

interface Comment {
    id: string;
    user_name: string;
    user_handle: string;
    user_avatar: string;
    text: string;
    created_at: string;
}

interface FollowUser {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    team: string | null;
}

const TEAM_EMOJIS: Record<string, string> = {
    "A팀": "🔥", "B팀": "⚡", "C팀": "🌊", "D팀": "🌿", "E팀": "🦁", "F팀": "🚀",
};

export default function PublicProfilePage() {
    const { handle } = useParams<{ handle: string }>();
    const router = useRouter();
    const { user: me } = useGameStore();

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    /* ── 팔로우 ── */
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);

    /* ── 팔로워/팔로잉 모달 ── */
    const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
    const [followModalUsers, setFollowModalUsers] = useState<FollowUser[]>([]);
    const [followModalSearch, setFollowModalSearch] = useState("");
    const [followModalLoading, setFollowModalLoading] = useState(false);

    /* ── 포스트 상세 모달 ── */
    const [activePost, setActivePost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likeLoading, setLikeLoading] = useState(false);

    /* ── 프로필 + 게시물 + 팔로우 수 로드 ── */
    useEffect(() => {
        if (!handle) return;
        const decodedHandle = decodeURIComponent(handle as string);
        (async () => {
            const { data: prof, error } = await supabase
                .from("profiles")
                .select("id, name, handle, avatar, bio, profile_link, team, rank, points")
                .eq("handle", decodedHandle)
                .single();

            if (error || !prof) { setNotFound(true); setLoading(false); return; }
            setProfile(prof);

            const [{ data: postData }, { count: follCount }, { count: follgCount }] = await Promise.all([
                supabase
                    .from("posts")
                    .select("id, caption, image_url, likes, comments, created_at, user_name, user_avatar")
                    .eq("user_id", prof.id)
                    .order("created_at", { ascending: false }),
                supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", prof.id),
                supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", prof.id),
            ]);

            setPosts(postData ?? []);
            setFollowerCount(follCount ?? 0);
            setFollowingCount(follgCount ?? 0);

            // 내가 이 사람을 팔로우하는지
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser && authUser.id !== prof.id) {
                const { data: myFollow } = await supabase
                    .from("follows").select("id")
                    .eq("follower_id", authUser.id).eq("following_id", prof.id).maybeSingle();
                setIsFollowing(!!myFollow);
            }
            setLoading(false);
        })();
    }, [handle]);

    /* ── 팔로우 토글 ── */
    const toggleFollow = async () => {
        if (!profile || followLoading) return;
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser || authUser.id === profile.id) return;
        setFollowLoading(true);
        if (isFollowing) {
            await supabase.from("follows").delete()
                .eq("follower_id", authUser.id).eq("following_id", profile.id);
            setIsFollowing(false);
            setFollowerCount(c => Math.max(0, c - 1));
        } else {
            await supabase.from("follows").insert({ follower_id: authUser.id, following_id: profile.id });
            setIsFollowing(true);
            setFollowerCount(c => c + 1);
        }
        setFollowLoading(false);
    };

    /* ── 팔로워/팔로잉 모달 열기 ── */
    const openFollowModal = async (type: "followers" | "following") => {
        if (!profile) return;
        setFollowModal(type);
        setFollowModalSearch("");
        setFollowModalLoading(true);
        setFollowModalUsers([]);

        if (type === "followers") {
            // 나를 팔로우하는 사람들
            const { data } = await supabase
                .from("follows")
                .select("profiles!follows_follower_id_fkey(id, name, handle, avatar, team)")
                .eq("following_id", profile.id)
                .order("created_at", { ascending: false });
            const users = (data ?? []).map((r: any) => r.profiles).filter(Boolean);
            setFollowModalUsers(users as FollowUser[]);
        } else {
            // 내가 팔로우하는 사람들
            const { data } = await supabase
                .from("follows")
                .select("profiles!follows_following_id_fkey(id, name, handle, avatar, team)")
                .eq("follower_id", profile.id)
                .order("created_at", { ascending: false });
            const users = (data ?? []).map((r: any) => r.profiles).filter(Boolean);
            setFollowModalUsers(users as FollowUser[]);
        }
        setFollowModalLoading(false);
    };

    /* ── 포스트 클릭 → 상세 페이지 ── */
    const openPost = (post: Post) => {
        router.push(`/post/${post.id}`);
    };

    const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
    const isMyProfile = profile?.handle === me.handle;

    /* ── 렌더링 ── */
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--primary)" }} />
        </div>
    );

    if (notFound || !profile) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--background)" }}>
            <p className="text-4xl">🔍</p>
            <p className="font-bold" style={{ color: "var(--foreground)" }}>프로필을 찾을 수 없어요</p>
            <button onClick={() => router.back()} className="text-sm font-semibold" style={{ color: "var(--primary)" }}>돌아가기</button>
        </div>
    );

    const teamEmoji = profile.team ? (TEAM_EMOJIS[profile.team] ?? "👥") : null;
    const filteredFollowUsers = followModalUsers.filter(u =>
        !followModalSearch || u.name.includes(followModalSearch) || u.handle.includes(followModalSearch)
    );

    return (
        <div className="min-h-screen" style={{ background: "var(--background)" }}>
            {/* 헤더 */}
            <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-4"
                style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                <button onClick={() => router.back()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ color: "var(--foreground)" }}>
                    <ArrowLeft size={22} />
                </button>
                <span className="font-bold text-[15px]" style={{ color: "var(--foreground)" }}>
                    @{profile.handle}
                </span>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* ── 프로필 헤더 ── */}
                <div className="px-5 pt-6 pb-4">
                    <div className="flex items-start gap-6">
                        {/* 아바타 (인스타그램 스타일 링) */}
                        <div
                            className="w-24 h-24 rounded-full p-[3px] shrink-0"
                            style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
                        >
                            <div
                                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-4xl"
                                style={{ background: "var(--surface)" }}
                            >
                                {profile.avatar?.startsWith("http")
                                    ? <img src={profile.avatar} className="w-full h-full object-cover" alt="" />
                                    : profile.avatar || (profile.name?.[0] ?? "?").toUpperCase()}
                            </div>
                        </div>

                        {/* 인스타그램 스타일 통계 (게시물 / 팔로워 / 팔로잉) */}
                        <div className="flex-1 flex justify-around items-center pt-2">
                            <div className="text-center">
                                <p className="text-[18px] font-black" style={{ color: "var(--foreground)" }}>{posts.length}</p>
                                <p className="text-[12px]" style={{ color: "var(--foreground-soft)" }}>게시물</p>
                            </div>
                            <button className="text-center hover:opacity-70 transition-opacity" onClick={() => openFollowModal("followers")}>
                                <p className="text-[18px] font-black" style={{ color: "var(--foreground)" }}>{followerCount}</p>
                                <p className="text-[12px]" style={{ color: "var(--foreground-soft)" }}>팔로워</p>
                            </button>
                            <button className="text-center hover:opacity-70 transition-opacity" onClick={() => openFollowModal("following")}>
                                <p className="text-[18px] font-black" style={{ color: "var(--foreground)" }}>{followingCount}</p>
                                <p className="text-[12px]" style={{ color: "var(--foreground-soft)" }}>팔로잉</p>
                            </button>
                        </div>
                    </div>

                    {/* 이름 + 팀 */}
                    <div className="mt-3">
                        <p className="font-bold text-[14px]" style={{ color: "var(--foreground)" }}>{profile.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {profile.rank && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                                    {profile.rank}
                                </span>
                            )}
                            {profile.team && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}>
                                    {teamEmoji} {profile.team}
                                </span>
                            )}
                        </div>
                        {profile.bio && (
                            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                                {profile.bio}
                            </p>
                        )}
                        {profile.profile_link && (
                            <a href={profile.profile_link.startsWith("http") ? profile.profile_link : `https://${profile.profile_link}`}
                                target="_blank" rel="noopener noreferrer"
                                className="mt-1 flex items-center gap-1 text-[13px] font-semibold w-fit"
                                style={{ color: "var(--secondary)" }}>
                                <LinkIcon size={12} />
                                {profile.profile_link.replace(/^https?:\/\//, "")}
                                <ExternalLink size={10} />
                            </a>
                        )}
                    </div>

                    {/* 팔로우 / 내 프로필 버튼 */}
                    <div className="mt-3 flex gap-2">
                        {isMyProfile ? (
                            <button
                                onClick={() => router.push("/profile")}
                                className="flex-1 py-2 rounded-xl text-[13px] font-semibold transition-colors"
                                style={{ background: "var(--surface-2)", color: "var(--foreground)" }}
                            >
                                프로필 편집
                            </button>
                        ) : (
                            <button
                                onClick={toggleFollow}
                                disabled={followLoading}
                                className="flex-1 py-2 rounded-xl text-[13px] font-bold transition-all disabled:opacity-60"
                                style={{
                                    background: isFollowing ? "var(--surface-2)" : "var(--secondary)",
                                    color: isFollowing ? "var(--foreground)" : "white",
                                }}
                            >
                                {followLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : isFollowing ? "팔로잉" : "팔로우"}
                            </button>
                        )}
                    </div>
                </div>

                {/* 구분선 + 그리드 탭 */}
                <div className="flex items-center justify-center py-2"
                    style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                        <Grid3x3 size={14} /> 게시물
                    </div>
                </div>

                {/* ── 3열 그리드 ── */}
                {posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <p className="text-5xl">📷</p>
                        <p className="text-[14px] font-semibold" style={{ color: "var(--foreground-muted)" }}>아직 게시물이 없어요</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-0.5 pb-20">
                        {posts.map(post => (
                            <button key={post.id} onClick={() => openPost(post)}
                                className="relative aspect-square overflow-hidden group"
                                style={{ background: "var(--surface-2)" }}>
                                {post.image_url ? (
                                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-4xl italic font-black select-none" style={{ color: "var(--border)" }}>S</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                                    <span className="text-white text-[13px] font-bold flex items-center gap-1">
                                        <Heart size={14} fill="white" /> {post.likes}
                                    </span>
                                    <span className="text-white text-[13px] font-bold flex items-center gap-1">
                                        <MessageCircle size={14} fill="white" /> {post.comments}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── 팔로워/팔로잉 모달 ── */}
            {followModal && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                    onClick={e => { if (e.target === e.currentTarget) setFollowModal(null); }}
                >
                    <div className="w-full max-w-sm rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col"
                        style={{ background: "var(--surface)", maxHeight: "70vh" }}>
                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                            <span className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>
                                {followModal === "followers" ? "팔로워" : "팔로잉"}
                            </span>
                            <button onClick={() => setFollowModal(null)} style={{ color: "var(--foreground)" }}>
                                <X size={22} />
                            </button>
                        </div>
                        {/* 검색 */}
                        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--surface-2)" }}>
                                <Search size={14} style={{ color: "var(--foreground-muted)" }} />
                                <input
                                    type="text"
                                    value={followModalSearch}
                                    onChange={e => setFollowModalSearch(e.target.value)}
                                    placeholder="검색"
                                    className="flex-1 text-[13px] outline-none bg-transparent"
                                    style={{ color: "var(--foreground)" }}
                                    autoFocus
                                />
                            </div>
                        </div>
                        {/* 목록 */}
                        <div className="flex-1 overflow-y-auto">
                            {followModalLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 size={20} className="animate-spin" style={{ color: "var(--primary)" }} />
                                </div>
                            ) : filteredFollowUsers.length === 0 ? (
                                <p className="text-center text-[13px] py-10" style={{ color: "var(--foreground-muted)" }}>
                                    {followModal === "followers" ? "아직 팔로워가 없어요" : "아직 팔로잉이 없어요"}
                                </p>
                            ) : (
                                <div className="flex flex-col">
                                    {filteredFollowUsers.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => { setFollowModal(null); router.push(`/profile/${encodeURIComponent(u.handle)}`); }}
                                            className="flex items-center gap-3 px-5 py-3 hover:bg-foreground/5 transition-colors text-left"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                                                style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}
                                            >
                                                {u.avatar?.startsWith("http")
                                                    ? <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover" />
                                                    : u.avatar ? <span>{u.avatar}</span>
                                                    : (u.name?.[0] ?? "?").toUpperCase()}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>{u.name}</span>
                                                <span className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>@{u.handle} · {u.team}</span>
                                            </div>
                                            <span className="ml-auto text-[12px] font-bold px-3 py-1 rounded-lg"
                                                style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}>
                                                팔로잉
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
