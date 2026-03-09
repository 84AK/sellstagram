"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/common/GlassCard";
import EditProfileModal from "@/components/profile/EditProfileModal";
import SkillTree from "@/components/profile/SkillTree";
import IDCard from "@/components/profile/IDCard";
import AvatarMaker from "@/components/profile/AvatarMaker";
import {
    User,
    Settings,
    Users,
    Trophy,
    Activity,
    Calendar,
    ChevronRight,
    ShieldCheck,
    Zap,
    Loader2,
    Crown,
    Bookmark,
    Image as ImageIcon,
    TrendingUp,
    Palette,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { supabase, isSupabaseConfigured, DbProfile } from "@/lib/supabase/client";
import { getSavedAvatarStyle } from "@/lib/avatar/styles";

interface TeamMember {
    id: string;
    name: string;
    avatar: string;
    rank: string;
    isMe: boolean;
}

export default function ProfilePage() {
    const router = useRouter();
    const { user } = useGameStore();
    // Load saved avatar style from localStorage on mount (for DiceBear URL sync)
    useEffect(() => {
        const saved = getSavedAvatarStyle();
        if (saved && !user.avatar?.startsWith("https://api.dicebear.com")) {
            // Will be synced on next save — nothing to do here
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showAvatarBuilder, setShowAvatarBuilder] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teamCreatedAt, setTeamCreatedAt] = useState<string | null>(null);
    const [loadingTeam, setLoadingTeam] = useState(true);
    const [activeTab, setActiveTab] = useState<"team" | "skills" | "bookmarks" | "idcard">("idcard");
    const [bookmarkedPosts, setBookmarkedPosts] = useState<{ id: string; image_url: string | null; caption: string | null; likes: number }[]>([]);
    const [loadingBookmarks, setLoadingBookmarks] = useState(false);
    const [recentPosts, setRecentPosts] = useState<{ id: string; caption: string | null; image_url: string | null; likes: number; engagement_rate: string; created_at: string; week: number | null }[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [postCount, setPostCount] = useState(0);
    const [weekCount, setWeekCount] = useState(0);

    // 팀 멤버 로드
    useEffect(() => {
        if (!user.team) { setLoadingTeam(false); return; }

        const fetchTeamMembers = async () => {
            setLoadingTeam(true);

            if (!isSupabaseConfigured) {
                // Supabase 미연결 시 기본 표시 (본인만)
                setTeamMembers([{
                    id: "me",
                    name: user.name,
                    avatar: user.avatar || "🦊",
                    rank: user.rank,
                    isMe: true,
                }]);
                setLoadingTeam(false);
                return;
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();
                const myId = session?.user?.id;

                const { data, error } = await supabase
                    .from("profiles")
                    .select("id, name, avatar, rank, created_at")
                    .eq("team", user.team)
                    .order("created_at", { ascending: true });

                if (error) throw error;

                const members: TeamMember[] = (data as DbProfile[]).map((p) => ({
                    id: p.id,
                    name: p.name,
                    avatar: p.avatar || "🦊",
                    rank: p.rank,
                    isMe: p.id === myId,
                }));

                setTeamMembers(members);

                // 팀 결성일 = 첫 번째 멤버의 created_at
                if (data.length > 0) {
                    const d = new Date(data[0].created_at);
                    setTeamCreatedAt(
                        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                    );
                }
            } catch (e) {
                console.error("팀 멤버 로드 실패:", e);
                // 실패 시 본인만 표시
                setTeamMembers([{
                    id: "me",
                    name: user.name,
                    avatar: user.avatar || "🦊",
                    rank: user.rank,
                    isMe: true,
                }]);
            } finally {
                setLoadingTeam(false);
            }
        };

        fetchTeamMembers();
    }, [user.team, user.name, user.avatar, user.rank]);

    // 최근 활동 + 통계: 본인 게시물 로드
    useEffect(() => {
        if (!user.handle) return;
        setLoadingActivity(true);
        supabase
            .from("posts")
            .select("id, caption, image_url, likes, engagement_rate, created_at, week")
            .eq("user_handle", user.handle)
            .order("created_at", { ascending: false })
            .then(({ data }) => {
                const all = data ?? [];
                setRecentPosts(all.slice(0, 5));
                setPostCount(all.length);
                const weeks = new Set(all.map(p => p.week).filter(Boolean));
                setWeekCount(weeks.size);
                setLoadingActivity(false);
            });
    }, [user.handle]);

    // 북마크 탭 선택 시 로드
    useEffect(() => {
        if (activeTab !== "bookmarks") return;
        setLoadingBookmarks(true);
        const savedIds: string[] = JSON.parse(localStorage.getItem("saved_posts") || "[]");
        if (savedIds.length === 0) { setBookmarkedPosts([]); setLoadingBookmarks(false); return; }
        supabase
            .from("posts")
            .select("id, image_url, caption, likes")
            .in("id", savedIds)
            .then(({ data }) => {
                setBookmarkedPosts(data ?? []);
                setLoadingBookmarks(false);
            });
    }, [activeTab]);

    const handleManageTeam = () => {
        if (user.rank === "Teacher" || user.team === "교사") {
            router.push("/teacher");
        } else {
            // 팀 코드 클립보드에 복사
            const teamCode = user.team.replace("팀", "");
            navigator.clipboard?.writeText(teamCode).catch(() => {});
            alert(`팀 코드: ${user.team}\n팀원들에게 팀 코드를 알려주세요!`);
        }
    };

    const isTeacher = user.rank === "Teacher" || user.team === "교사";
    // 팀장 = 첫 번째 멤버 (가장 먼저 가입)
    const leaderId = teamMembers.length > 0 ? teamMembers[0].id : null;

    const handleAvatarSave = async (avatarUrl: string) => {
        setShowAvatarBuilder(false);
        // DiceBear URL을 기존 profiles.avatar 컬럼에 저장 (SQL 불필요)
        useGameStore.getState().updateProfile({ avatar: avatarUrl });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                await supabase.from("profiles")
                    .update({ avatar: avatarUrl })
                    .eq("id", session.user.id);
            }
        } catch {/* ignore */}
    };

    return (
        <>
            {showEditModal && (
                <EditProfileModal onClose={() => setShowEditModal(false)} />
            )}
            {showAvatarBuilder && (
                <AvatarMaker
                    seed={user.handle || user.name || "user"}
                    onSave={handleAvatarSave}
                    onClose={() => setShowAvatarBuilder(false)}
                />
            )}

            <div className="flex flex-col gap-8 p-4 pt-12 lg:pt-16 max-w-5xl mx-auto pb-32">
                {/* Header / Profile Hero */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 px-2">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-primary via-accent to-secondary p-1 shadow-2xl shadow-primary/20 group">
                            <div className="w-full h-full rounded-[2.3rem] bg-background flex items-center justify-center overflow-hidden">
                                {user.avatar ? (
                                    <span className="text-6xl">{user.avatar}</span>
                                ) : (
                                    <User size={64} className="text-foreground/10 group-hover:scale-110 transition-transform duration-500" />
                                )}
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary rounded-2xl flex items-center justify-center border-4 border-background text-background shadow-lg">
                            <ShieldCheck size={20} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 text-center md:text-left flex-1 pt-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                <h1 className="text-4xl font-black italic tracking-tighter">{user.name}</h1>
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                    {user.rank}
                                </span>
                            </div>
                            <span className="text-foreground/40 font-medium">@{user.handle} • {user.team} 소속</span>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="px-6 py-2.5 bg-foreground text-background rounded-2xl text-xs font-black italic hover:bg-foreground/90 transition-all flex items-center gap-2 active:scale-[0.97]"
                            >
                                프로필 편집 <Settings size={14} />
                            </button>
                            <button
                                onClick={() => setShowAvatarBuilder(true)}
                                className="px-6 py-2.5 rounded-2xl text-xs font-black italic transition-all flex items-center gap-2 active:scale-[0.97]"
                                style={{ background: "var(--primary)", color: "white" }}
                            >
                                아바타 꾸미기 <Palette size={14} />
                            </button>
                            {isTeacher && (
                                <button
                                    onClick={handleManageTeam}
                                    className="px-6 py-2.5 bg-foreground/5 border border-foreground/10 rounded-2xl text-xs font-black italic hover:bg-foreground/10 transition-all flex items-center gap-2 active:scale-[0.97]"
                                >
                                    교사 대시보드 <Users size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "내 게시물", value: postCount, icon: TrendingUp },
                        { label: "참여 주차", value: weekCount, icon: Activity },
                        { label: "획득 포인트", value: user.points, icon: Trophy },
                    ].map((stat, idx) => (
                        <GlassCard key={idx} className="flex flex-col gap-2 p-6 transition-all hover:scale-[1.02]">
                            <div className="flex items-center gap-2 text-foreground/40">
                                <stat.icon size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <span className="text-3xl font-black italic">{stat.value}</span>
                        </GlassCard>
                    ))}
                </div>

                {/* 탭 전환 */}
                <div className="flex gap-1 p-1 rounded-2xl w-fit overflow-x-auto no-scrollbar" style={{ background: "var(--surface-2)" }}>
                    {([
                        { key: "idcard", label: "ID 카드", icon: ShieldCheck },
                        { key: "team", label: "팀 워크스페이스", icon: Users },
                        { key: "skills", label: "스킬 트리", icon: TrendingUp },
                        { key: "bookmarks", label: "북마크", icon: Bookmark },
                    ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{
                                background: activeTab === key ? "var(--background)" : "transparent",
                                color: activeTab === key ? "var(--foreground)" : "var(--foreground-muted)",
                                boxShadow: activeTab === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                            }}
                        >
                            <Icon size={14} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area: Team & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ID 카드 탭 */}
                    {activeTab === "idcard" && (
                        <div className="lg:col-span-3 flex flex-col lg:flex-row gap-10 items-start">
                            {/* 카드 */}
                            <div className="flex flex-col items-center gap-4">
                                <IDCard
                                    name={user.name}
                                    handle={user.handle}
                                    team={user.team}
                                    rank={user.rank}
                                    points={user.points}
                                    avatar={user.avatar}
                                    avatarConfig={user.avatarConfig}
                                    onCustomize={() => setShowAvatarBuilder(true)}
                                />
                                <p className="text-xs text-center" style={{ color: "var(--foreground-muted)" }}>
                                    나만의 마케터 ID 카드 🪪
                                </p>
                            </div>

                            {/* 아바타 안내 */}
                            <div className="flex flex-col gap-5 flex-1 max-w-lg">
                                <div>
                                    <h3 className="text-2xl font-black italic tracking-tight" style={{ color: "var(--foreground)" }}>
                                        나만의 마케터 아이덴티티
                                    </h3>
                                    <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
                                        XP를 모아 아바타를 꾸미고, 팀 피드와 랭킹에서 나만의 스타일로 표시돼요.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: "헤어 스타일", count: 14, emoji: "💇", desc: "14가지 헤어" },
                                        { label: "눈 표현", count: 11, emoji: "👁️", desc: "11가지 눈" },
                                        { label: "의상", count: 18, emoji: "👕", desc: "8종 × 10색상" },
                                        { label: "액세서리", count: 7, emoji: "👓", desc: "안경·선글라스" },
                                        { label: "머리색", count: 10, emoji: "🎨", desc: "10가지 색상" },
                                        { label: "배경색", count: 12, emoji: "🖼️", desc: "12가지 배경" },
                                    ].map(({ label, emoji, desc }) => (
                                        <div
                                            key={label}
                                            className="flex items-center gap-3 p-3 rounded-2xl"
                                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                                        >
                                            <span style={{ fontSize: 24 }}>{emoji}</span>
                                            <div>
                                                <p className="text-xs font-black" style={{ color: "var(--foreground)" }}>{label}</p>
                                                <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowAvatarBuilder(true)}
                                    className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                                    style={{ background: "var(--primary)", color: "white" }}
                                >
                                    <Palette size={18} />
                                    지금 아바타 꾸미기
                                </button>

                                <div
                                    className="flex items-start gap-3 p-4 rounded-2xl"
                                    style={{ background: "var(--highlight-light)", border: "1px solid rgba(255,194,51,0.3)" }}
                                >
                                    <Zap size={16} style={{ color: "var(--highlight)", marginTop: 2 }} />
                                    <div>
                                        <p className="text-xs font-black" style={{ color: "var(--highlight-dark)" }}>
                                            XP로 잠금 해제
                                        </p>
                                        <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                                            콘텐츠 업로드, 미션 완료, 상품 구매로 XP를 쌓고 셀러 상점 → 아바타 탭에서 새 아이템을 언락하세요.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 스킬 트리 탭 */}
                    {activeTab === "skills" && (
                        <div className="lg:col-span-3 flex flex-col gap-4">
                            <div className="flex items-center gap-2 px-1">
                                <TrendingUp size={20} style={{ color: "var(--primary)" }} />
                                <h2 className="text-xl font-black italic">마케팅 스킬 트리</h2>
                            </div>
                            <SkillTree skillXP={user.skillXP ?? { copywriting: 0, analytics: 0, creative: 0 }} />
                        </div>
                    )}

                    {/* 북마크 탭 */}
                    {activeTab === "bookmarks" && (
                        <div className="lg:col-span-3 flex flex-col gap-4">
                            {loadingBookmarks ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                                </div>
                            ) : bookmarkedPosts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Bookmark size={36} style={{ color: "var(--foreground-muted)" }} />
                                    <p className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>저장된 게시물이 없어요</p>
                                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>피드에서 북마크 버튼을 눌러 저장해보세요</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-1.5">
                                    {bookmarkedPosts.map(post => (
                                        <div key={post.id} className="aspect-square rounded-2xl overflow-hidden relative group"
                                            style={{ background: "var(--surface-2)" }}>
                                            {post.image_url ? (
                                                <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon size={24} style={{ color: "var(--foreground-muted)" }} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">♥ {post.likes}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Team Workspace Section */}
                    {activeTab === "team" && <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-black italic flex items-center gap-2">
                                <Users size={20} className="text-secondary" />
                                팀 워크스페이스
                            </h2>
                            {isTeacher && (
                                <button
                                    onClick={handleManageTeam}
                                    className="text-[10px] font-bold text-primary italic hover:underline flex items-center gap-1 transition-opacity hover:opacity-70"
                                >
                                    대시보드 <ChevronRight size={12} />
                                </button>
                            )}
                        </div>

                        <GlassCard className="flex flex-col gap-6 border-secondary/10">
                            {/* 팀 정보 헤더 */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center font-black text-2xl text-secondary border border-secondary/20">
                                    {user.team[0]}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-black italic">{user.team}</span>
                                    <span className="text-xs text-foreground/40 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {teamCreatedAt ? `${teamCreatedAt} 결성됨` : "결성일 불명"}
                                    </span>
                                </div>
                            </div>

                            {/* 팀 멤버 목록 */}
                            <div className="flex flex-col gap-3">
                                <h3 className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest ml-1">
                                    Team Members ({loadingTeam ? "..." : teamMembers.length})
                                </h3>

                                {loadingTeam ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 size={20} className="animate-spin text-foreground/30" />
                                    </div>
                                ) : teamMembers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                                        <Users size={24} className="text-foreground/20" />
                                        <p className="text-xs font-semibold text-foreground/40">팀 배정 대기 중</p>
                                        <p className="text-[10px] text-foreground/30">선생님이 팀을 배정하면 팀원이 표시돼요</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {teamMembers.map((member) => {
                                            const isLeader = member.id === leaderId;
                                            return (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-foreground/5 border border-foreground/5 hover:border-foreground/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-sm">
                                                            {member.avatar}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold">
                                                                {member.name}{member.isMe ? " (나)" : ""}
                                                            </span>
                                                            <span className="text-[10px] text-foreground/40">{member.rank}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {isLeader && (
                                                            <Crown size={12} className="text-highlight" />
                                                        )}
                                                        <span className={`text-[9px] font-bold uppercase ${isLeader ? "text-primary" : "text-foreground/40"}`}>
                                                            {isLeader ? "Leader" : "Member"}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>}

                    {/* Activity Feed */}
                    {activeTab === "team" && <div className="flex flex-col gap-6">
                        <h2 className="text-xl font-black italic flex items-center gap-2">
                            <Activity size={20} className="text-primary" />
                            최근 업로드
                        </h2>
                        <div className="flex flex-col gap-3">
                            {loadingActivity ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 size={20} className="animate-spin text-foreground/30" />
                                </div>
                            ) : recentPosts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                                    <Activity size={24} className="text-foreground/20" />
                                    <p className="text-xs text-foreground/40 font-semibold">아직 활동이 없어요</p>
                                    <p className="text-[10px] text-foreground/30">게시물을 올리면 여기에 기록돼요</p>
                                </div>
                            ) : recentPosts.map((post) => {
                                const d = new Date(post.created_at);
                                return (
                                    <div key={post.id} className="flex items-center gap-3 p-3 rounded-2xl bg-foreground/5 border border-foreground/5">
                                        {post.image_url ? (
                                            <img src={post.image_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-foreground/10 shrink-0 flex items-center justify-center">
                                                <ImageIcon size={18} className="text-foreground/20" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate" style={{ color: "var(--foreground)" }}>
                                                {post.caption ?? "게시물"}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                                    ❤️ {post.likes} · 📈 {post.engagement_rate}
                                                </span>
                                                {post.week && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                                                        style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                                                        {post.week}주차
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[9px] shrink-0" style={{ color: "var(--foreground-muted)" }}>
                                            {d.toLocaleString("ko-KR", { month: "short", day: "numeric" })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>}
                </div>
            </div>
        </>
    );
}
