"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Shield, Users, FileText, Trophy, MessageSquare,
    LogOut, Loader2, Trash2, Crown, RefreshCw,
    TrendingUp, ShoppingBag, BarChart3,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Profile {
    id: string;
    name: string;
    handle: string;
    team: string;
    points: number;
    rank: string;
    role: string;
    created_at: string;
}

interface Post {
    id: string;
    user_name: string;
    user_handle: string;
    caption: string | null;
    description: string | null;
    likes: number;
    type: string;
    created_at: string;
}

interface TeamStat {
    team: string;
    members: number;
    points: number;
    posts: number;
}

type Tab = "overview" | "users" | "teams" | "posts";

export default function AdminDashboard() {
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("overview");

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [commentCount, setCommentCount] = useState(0);
    const [purchaseCount, setPurchaseCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);
    const [deletingPost, setDeletingPost] = useState<string | null>(null);

    // 관리자 인증 확인
    useEffect(() => {
        fetch("/api/auth/admin-check").then(r => r.json()).then(({ isAdmin }) => {
            if (!isAdmin) { router.replace("/admin"); return; }
            setAuthChecked(true);
        });
    }, [router]);

    // 데이터 로드
    useEffect(() => {
        if (!authChecked) return;
        const load = async () => {
            const [
                { data: profileData },
                { data: postData },
                { count: commentCnt },
                { count: purchaseCnt },
            ] = await Promise.all([
                supabase.from("profiles").select("*").order("created_at"),
                supabase.from("posts").select("id,user_name,user_handle,caption,description,likes,type,created_at").order("created_at", { ascending: false }).limit(50),
                supabase.from("comments").select("id", { count: "exact", head: true }),
                supabase.from("purchases").select("id", { count: "exact", head: true }),
            ]);
            setProfiles(profileData ?? []);
            setPosts(postData ?? []);
            setCommentCount(commentCnt ?? 0);
            setPurchaseCount(purchaseCnt ?? 0);
            setLoading(false);
        };
        load();
    }, [authChecked]);

    const handleLogout = async () => {
        await fetch("/api/auth/admin-logout", { method: "POST" });
        router.push("/admin");
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingRole(userId);
        await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
        setUpdatingRole(null);
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm("이 게시물을 삭제할까요?")) return;
        setDeletingPost(postId);
        await supabase.from("posts").delete().eq("id", postId);
        setPosts(prev => prev.filter(p => p.id !== postId));
        setDeletingPost(null);
    };

    // 팀 통계 계산
    const teamStats: TeamStat[] = (() => {
        const map: Record<string, TeamStat> = {};
        profiles.forEach(p => {
            const t = p.team || "미배정";
            if (!map[t]) map[t] = { team: t, members: 0, points: 0, posts: 0 };
            map[t].members++;
            map[t].points += p.points;
        });
        posts.forEach(p => {
            const profile = profiles.find(pr => pr.handle === p.user_handle);
            const t = profile?.team || "미배정";
            if (map[t]) map[t].posts++;
        });
        return Object.values(map).sort((a, b) => b.points - a.points);
    })();

    const stats = [
        { label: "전체 학생", value: profiles.filter(p => p.role !== "teacher").length, icon: Users, color: "var(--secondary)" },
        { label: "전체 게시물", value: posts.length, icon: FileText, color: "var(--primary)" },
        { label: "전체 댓글", value: commentCount, icon: MessageSquare, color: "var(--accent)" },
        { label: "상품 구매", value: purchaseCount, icon: ShoppingBag, color: "var(--highlight)" },
    ];

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: "overview", label: "개요", icon: BarChart3 },
        { id: "users", label: "사용자 관리", icon: Users },
        { id: "teams", label: "팀 현황", icon: Trophy },
        { id: "posts", label: "게시물 관리", icon: FileText },
    ];

    if (!authChecked || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
                <Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: "var(--background)" }}>
            {/* 헤더 */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
                style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>
                        <Shield size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-black" style={{ color: "var(--foreground)" }}>관리자 대시보드</h1>
                        <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Sellstagram Admin</p>
                    </div>
                </div>
                <button onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-red-50"
                    style={{ color: "var(--foreground-muted)" }}>
                    <LogOut size={14} /> 로그아웃
                </button>
            </header>

            <div className="max-w-5xl mx-auto p-5 flex flex-col gap-6 pb-20">
                {/* 탭 */}
                <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: "var(--surface-2)" }}>
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{
                                background: activeTab === id ? "var(--background)" : "transparent",
                                color: activeTab === id ? "#7C3AED" : "var(--foreground-muted)",
                                boxShadow: activeTab === id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                            }}>
                            <Icon size={13} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── 개요 탭 ── */}
                {activeTab === "overview" && (
                    <div className="flex flex-col gap-5">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="flex flex-col gap-2 p-4 rounded-2xl"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                    <div className="flex items-center gap-2">
                                        <Icon size={14} style={{ color }} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>{label}</span>
                                    </div>
                                    <span className="text-3xl font-black" style={{ color }}>{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* 상위 학생 포인트 */}
                        <div className="flex flex-col gap-3 p-5 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp size={16} style={{ color: "#7C3AED" }} />
                                <h3 className="text-sm font-black" style={{ color: "var(--foreground)" }}>포인트 TOP 10</h3>
                            </div>
                            <div className="flex flex-col gap-2">
                                {[...profiles].sort((a, b) => b.points - a.points).slice(0, 10).map((p, i) => (
                                    <div key={p.id} className="flex items-center gap-3 py-1">
                                        <span className="text-xs font-black w-5 text-center" style={{ color: i < 3 ? "#7C3AED" : "var(--foreground-muted)" }}>
                                            {i + 1}
                                        </span>
                                        {i === 0 && <Crown size={12} style={{ color: "var(--highlight)" }} />}
                                        <span className="flex-1 text-sm font-semibold" style={{ color: "var(--foreground)" }}>{p.name}</span>
                                        <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{p.team}</span>
                                        <span className="text-sm font-black" style={{ color: "#7C3AED" }}>{p.points} XP</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 사용자 관리 탭 ── */}
                {activeTab === "users" && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                전체 {profiles.length}명
                            </p>
                            <button onClick={() => window.location.reload()} className="p-2 rounded-lg" style={{ color: "var(--foreground-muted)" }}>
                                <RefreshCw size={14} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {profiles.map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-3.5 rounded-xl"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                                        style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}>
                                        {p.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                                            {p.name}
                                            {p.role === "teacher" && <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">교사</span>}
                                        </p>
                                        <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                                            @{p.handle} · {p.team} · {p.points} XP
                                        </p>
                                    </div>
                                    {/* 역할 변경 */}
                                    <select
                                        value={p.role || "student"}
                                        onChange={e => handleRoleChange(p.id, e.target.value)}
                                        disabled={updatingRole === p.id}
                                        className="text-xs font-bold px-2 py-1.5 rounded-lg outline-none"
                                        style={{ background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                                        <option value="student">학생</option>
                                        <option value="teacher">교사</option>
                                    </select>
                                    {updatingRole === p.id && <Loader2 size={14} className="animate-spin shrink-0" style={{ color: "#7C3AED" }} />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 팀 현황 탭 ── */}
                {activeTab === "teams" && (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>팀 {teamStats.length}개 (포인트 순)</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {teamStats.map((t, i) => (
                                <div key={t.team} className="flex flex-col gap-3 p-4 rounded-2xl"
                                    style={{ background: "var(--surface)", border: `1px solid ${i === 0 ? "#7C3AED40" : "var(--border)"}` }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {i === 0 && <Crown size={14} style={{ color: "var(--highlight)" }} />}
                                            <span className="font-black" style={{ color: i === 0 ? "#7C3AED" : "var(--foreground)" }}>{t.team}</span>
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                                            style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
                                            {i + 1}위
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        {[
                                            { label: "멤버", value: t.members },
                                            { label: "포인트", value: t.points },
                                            { label: "게시물", value: t.posts },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex flex-col gap-0.5 p-2 rounded-xl" style={{ background: "var(--surface-2)" }}>
                                                <span className="text-[9px] font-bold uppercase" style={{ color: "var(--foreground-muted)" }}>{label}</span>
                                                <span className="text-lg font-black" style={{ color: "var(--foreground)" }}>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* 팀원 목록 */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {profiles.filter(p => p.team === t.team).map(p => (
                                            <span key={p.id} className="text-[10px] font-semibold px-2 py-1 rounded-full"
                                                style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}>
                                                {p.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 게시물 관리 탭 ── */}
                {activeTab === "posts" && (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                            전체 게시물 {posts.length}개
                        </p>
                        <div className="flex flex-col gap-2">
                            {posts.map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-3.5 rounded-xl"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-bold text-white"
                                        style={{ background: p.type === "video" ? "var(--secondary)" : "var(--primary)" }}>
                                        {p.type === "video" ? "동영상" : "이미지"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                                            {p.caption ?? p.description ?? "(내용 없음)"}
                                        </p>
                                        <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                                            @{p.user_handle} · ♥ {p.likes} · {new Date(p.created_at).toLocaleDateString("ko-KR")}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeletePost(p.id)}
                                        disabled={deletingPost === p.id}
                                        className="p-2 rounded-lg transition-colors hover:bg-red-50 shrink-0"
                                        style={{ color: "var(--foreground-muted)" }}>
                                        {deletingPost === p.id
                                            ? <Loader2 size={15} className="animate-spin" />
                                            : <Trash2 size={15} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
