"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/common/GlassCard";
import EditProfileModal from "@/components/profile/EditProfileModal";
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
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { supabase, isSupabaseConfigured, DbProfile } from "@/lib/supabase/client";

interface TeamMember {
    id: string;
    name: string;
    avatar: string;
    rank: string;
    isMe: boolean;
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, inventory, campaigns } = useGameStore();

    const [showEditModal, setShowEditModal] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teamCreatedAt, setTeamCreatedAt] = useState<string | null>(null);
    const [loadingTeam, setLoadingTeam] = useState(true);
    const [activeTab, setActiveTab] = useState<"team" | "bookmarks">("team");
    const [bookmarkedPosts, setBookmarkedPosts] = useState<{ id: string; image_url: string | null; caption: string | null; likes: number }[]>([]);
    const [loadingBookmarks, setLoadingBookmarks] = useState(false);

    const stats = [
        { label: "실습 상품", value: inventory.length, icon: Zap },
        { label: "총 캠페인", value: campaigns.length, icon: Activity },
        { label: "획득 포인트", value: user.points, icon: Trophy },
    ];

    // 팀 멤버 로드
    useEffect(() => {
        if (!user.team) return;

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

    return (
        <>
            {showEditModal && (
                <EditProfileModal onClose={() => setShowEditModal(false)} />
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
                                onClick={handleManageTeam}
                                className="px-6 py-2.5 bg-foreground/5 border border-foreground/10 rounded-2xl text-xs font-black italic hover:bg-foreground/10 transition-all flex items-center gap-2 active:scale-[0.97]"
                            >
                                {isTeacher ? "교사 대시보드" : "워크스페이스 초대"} <Users size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, idx) => (
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
                <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: "var(--surface-2)" }}>
                    {([
                        { key: "team", label: "팀 워크스페이스", icon: Users },
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
                            <button
                                onClick={handleManageTeam}
                                className="text-[10px] font-bold text-primary italic hover:underline flex items-center gap-1 transition-opacity hover:opacity-70"
                            >
                                {isTeacher ? "대시보드" : "Manage Team"} <ChevronRight size={12} />
                            </button>
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

                    {/* Activity Feed / Mini Insights */}
                    {activeTab === "team" && <div className="flex flex-col gap-6">
                        <h2 className="text-xl font-black italic flex items-center gap-2">
                            <Activity size={20} className="text-primary" />
                            최근 활동
                        </h2>
                        <div className="flex flex-col gap-4">
                            {campaigns.length > 0 ? (
                                campaigns.slice(0, 3).map((c, i) => {
                                    const d = new Date();
                                    return (
                                        <div key={c.id} className="flex gap-4 p-4 rounded-2xl bg-foreground/5 border border-foreground/5 relative overflow-hidden group">
                                            <div className="flex flex-col gap-1 items-center justify-center shrink-0">
                                                <span className="text-[9px] font-black text-foreground/30 uppercase">
                                                    {d.toLocaleString("en", { month: "short" })}
                                                </span>
                                                <span className="text-lg font-black italic leading-none">
                                                    {String(d.getDate() - i).padStart(2, "0")}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-black leading-snug">캠페인 최적화 완료</span>
                                                <span className="text-[9px] text-foreground/40 font-bold">
                                                    ROI +{Math.round(c.efficiency * 10)}% Efficiency
                                                </span>
                                            </div>
                                            <div className="absolute right-0 top-0 h-full w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                                    <Activity size={24} className="text-foreground/20" />
                                    <p className="text-xs text-foreground/40 font-semibold">
                                        아직 활동이 없어요
                                    </p>
                                    <p className="text-[10px] text-foreground/30">
                                        캠페인을 시작하면 여기에 기록돼요
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>}
                </div>
            </div>
        </>
    );
}
