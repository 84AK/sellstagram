"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Shield, Users, FileText, Trophy, MessageSquare,
    LogOut, Loader2, Trash2, Crown, RefreshCw,
    TrendingUp, ShoppingBag, BarChart3, Settings, Eye, EyeOff, Check,
    Lock, Unlock, Key,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { CURRICULUM } from "@/lib/curriculum/sessions";

interface Profile {
    id: string;
    name: string;
    handle: string;
    team: string;
    points: number;
    rank: string;
    role: string;
    is_leader: boolean;
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

type Tab = "overview" | "users" | "teams" | "posts" | "settings";

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
    const [updatingTeam, setUpdatingTeam] = useState<string | null>(null);
    const [updatingLeader, setUpdatingLeader] = useState<string | null>(null);
    const [deletingPost, setDeletingPost] = useState<string | null>(null);

    // API 키 관리 상태
    const [apiKeyStatus, setApiKeyStatus] = useState<{ hasKey: boolean; masked: string | null } | null>(null);
    const [newApiKey, setNewApiKey] = useState("");
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [apiKeySaving, setApiKeySaving] = useState(false);
    const [apiKeyMsg, setApiKeyMsg] = useState<{ ok: boolean; msg: string } | null>(null);

    // PIN 설정 상태
    const [currentPin, setCurrentPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [pinSaving, setPinSaving] = useState(false);
    const [pinResult, setPinResult] = useState<{ ok: boolean; msg: string } | null>(null);

    // 초기 잔액 설정 상태
    const [initialBalance, setInitialBalance] = useState(1000000);
    const [balanceInput, setBalanceInput] = useState("1000000");
    const [isSavingBalance, setIsSavingBalance] = useState(false);
    const [balanceSaved, setBalanceSaved] = useState(false);

    // 회차 열람 관리 상태
    const [unlockedWeeks, setUnlockedWeeks] = useState<number[]>([]);
    const [togglingWeek, setTogglingWeek] = useState<number | null>(null);

    // 관리자 인증 확인
    useEffect(() => {
        fetch("/api/auth/admin-check").then(r => r.json()).then(({ isAdmin }) => {
            if (!isAdmin) { router.replace("/admin"); return; }
            setAuthChecked(true);
            // API 키 상태 초기 로드
            fetch("/api/admin/gemini-key").then(r => r.json()).then(setApiKeyStatus);
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
                { data: gameState },
                { data: appSettings },
            ] = await Promise.all([
                supabase.from("profiles").select("*").order("created_at"),
                supabase.from("posts").select("id,user_name,user_handle,caption,description,likes,type,created_at").order("created_at", { ascending: false }).limit(50),
                supabase.from("comments").select("id", { count: "exact", head: true }),
                supabase.from("purchases").select("id", { count: "exact", head: true }),
                supabase.from("game_state").select("teacher_pin, initial_balance").eq("id", 1).single(),
                supabase.from("app_settings").select("unlocked_weeks").eq("id", 1).single(),
            ]);
            setProfiles(profileData ?? []);
            setPosts(postData ?? []);
            setCommentCount(commentCnt ?? 0);
            setPurchaseCount(purchaseCnt ?? 0);
            setCurrentPin(gameState?.teacher_pin ?? "");
            if (gameState?.initial_balance != null) {
                setInitialBalance(gameState.initial_balance);
                setBalanceInput(String(gameState.initial_balance));
            }
            if (Array.isArray(appSettings?.unlocked_weeks)) {
                setUnlockedWeeks(appSettings.unlocked_weeks);
            }
            setLoading(false);
        };
        load();
    }, [authChecked]);

    const handleLogout = async () => {
        await fetch("/api/auth/admin-logout", { method: "POST" });
        router.push("/admin");
    };

    const adminUpdateProfile = async (userId: string, field: string, value: unknown) => {
        try {
            const res = await fetch("/api/admin/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, field, value }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({ error: "서버 오류" }));
                console.error("프로필 업데이트 실패:", body.error);
                return false;
            }
            return true;
        } catch (err) {
            console.error("프로필 업데이트 오류:", err);
            return false;
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingRole(userId);
        const ok = await adminUpdateProfile(userId, "role", newRole);
        if (ok) setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
        setUpdatingRole(null);
    };

    const handleTeamChange = async (userId: string, newTeam: string) => {
        setUpdatingTeam(userId);
        const ok = await adminUpdateProfile(userId, "team", newTeam);
        if (ok) setProfiles(prev => prev.map(p => p.id === userId ? { ...p, team: newTeam } : p));
        setUpdatingTeam(null);
    };

    const handleLeaderToggle = async (userId: string, currentIsLeader: boolean) => {
        setUpdatingLeader(userId);
        const newIsLeader = !currentIsLeader;
        const ok = await adminUpdateProfile(userId, "is_leader", newIsLeader);
        if (ok) setProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_leader: newIsLeader } : p));
        setUpdatingLeader(null);
    };

    const handleSaveBalance = async () => {
        const parsed = parseInt(balanceInput.replace(/,/g, ""), 10);
        if (isNaN(parsed) || parsed < 0) return;
        setIsSavingBalance(true);
        const res = await fetch("/api/admin/reset-balance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ balance: parsed }),
        });
        if (res.ok) {
            setInitialBalance(parsed);
            setBalanceSaved(true);
            setTimeout(() => setBalanceSaved(false), 2500);
        } else {
            const { error } = await res.json();
            alert("잔액 설정 실패: " + error);
        }
        setIsSavingBalance(false);
    };

    const handleSavePin = async () => {
        if (!newPin) return;
        if (newPin !== confirmPin) {
            setPinResult({ ok: false, msg: "새 PIN이 일치하지 않습니다." });
            return;
        }
        if (newPin.length < 4) {
            setPinResult({ ok: false, msg: "PIN은 4자리 이상이어야 합니다." });
            return;
        }
        setPinSaving(true);
        const { error } = await supabase
            .from("game_state")
            .update({ teacher_pin: newPin })
            .eq("id", 1);
        if (error) {
            setPinResult({ ok: false, msg: "저장 실패: " + error.message });
        } else {
            setCurrentPin(newPin);
            setNewPin("");
            setConfirmPin("");
            setPinResult({ ok: true, msg: "PIN이 성공적으로 변경되었습니다." });
        }
        setPinSaving(false);
        setTimeout(() => setPinResult(null), 3000);
    };

    // 회차 열람 토글
    const updateUnlockedWeeks = async (next: number[]) => {
        const res = await fetch("/api/admin/update-settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field: "unlocked_weeks", value: next }),
        });
        return res.ok;
    };

    const handleToggleLock = async (w: number) => {
        setTogglingWeek(w);
        const next = unlockedWeeks.includes(w)
            ? unlockedWeeks.filter(v => v !== w)
            : [...unlockedWeeks, w].sort((a, b) => a - b);
        const ok = await updateUnlockedWeeks(next);
        if (ok) setUnlockedWeeks(next);
        setTogglingWeek(null);
    };

    const handleUnlockAll = async () => {
        const all = Array.from({ length: 29 }, (_, i) => i + 1);
        const ok = await updateUnlockedWeeks(all);
        if (ok) setUnlockedWeeks(all);
    };

    const handleLockAll = async () => {
        const ok = await updateUnlockedWeeks([]);
        if (ok) setUnlockedWeeks([]);
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
        { id: "settings", label: "설정", icon: Settings },
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
                <div className="flex items-center gap-2">
                    <button onClick={() => router.push("/feed")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-blue-50"
                        style={{ color: "var(--secondary)" }}>
                        ← 앱으로
                    </button>
                    <button onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-red-50"
                        style={{ color: "var(--foreground-muted)" }}>
                        <LogOut size={14} /> 로그아웃
                    </button>
                </div>
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
                                <div key={p.id} className="flex flex-col gap-2 p-3.5 rounded-xl"
                                    style={{ background: "var(--surface)", border: `1px solid ${p.is_leader ? "rgba(255,194,51,0.4)" : "var(--border)"}` }}>
                                    {/* 상단: 프로필 정보 */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                                                style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}>
                                                {p.name[0]}
                                            </div>
                                            {p.is_leader && (
                                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                                                    style={{ background: "var(--highlight)" }}>
                                                    <Crown size={9} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                                                {p.name}
                                                {p.role === "teacher" && <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">교사</span>}
                                                {p.is_leader && <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,194,51,0.15)", color: "#b45309" }}>리더</span>}
                                            </p>
                                            <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                                                @{p.handle} · {p.points} XP
                                            </p>
                                        </div>
                                        {(updatingRole === p.id || updatingTeam === p.id || updatingLeader === p.id) && (
                                            <Loader2 size={14} className="animate-spin shrink-0" style={{ color: "#7C3AED" }} />
                                        )}
                                    </div>
                                    {/* 하단: 팀 / 역할 / 리더 컨트롤 */}
                                    <div className="flex items-center gap-2 pl-12">
                                        {/* 팀 배정 */}
                                        <select
                                            value={p.team || "미배정"}
                                            onChange={e => handleTeamChange(p.id, e.target.value)}
                                            disabled={updatingTeam === p.id}
                                            className="text-xs font-bold px-2 py-1.5 rounded-lg outline-none flex-1"
                                            style={{ background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                                            <option value="미배정">미배정</option>
                                            <option value="A팀">A팀</option>
                                            <option value="B팀">B팀</option>
                                            <option value="C팀">C팀</option>
                                            <option value="D팀">D팀</option>
                                            <option value="E팀">E팀</option>
                                            <option value="F팀">F팀</option>
                                        </select>
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
                                        {/* 리더 토글 */}
                                        <button
                                            onClick={() => handleLeaderToggle(p.id, p.is_leader)}
                                            disabled={updatingLeader === p.id}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                                            style={{
                                                background: p.is_leader ? "rgba(255,194,51,0.15)" : "var(--surface-2)",
                                                color: p.is_leader ? "#b45309" : "var(--foreground-muted)",
                                                border: `1px solid ${p.is_leader ? "rgba(255,194,51,0.4)" : "var(--border)"}`,
                                            }}>
                                            <Crown size={11} />
                                            {p.is_leader ? "리더 해제" : "리더 지정"}
                                        </button>
                                    </div>
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
                                            <span key={p.id} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
                                                style={{
                                                    background: p.is_leader ? "rgba(255,194,51,0.15)" : "var(--surface-2)",
                                                    color: p.is_leader ? "#b45309" : "var(--foreground-soft)",
                                                }}>
                                                {p.is_leader && <Crown size={9} />}
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
                {/* ── 설정 탭 ── */}
                {activeTab === "settings" && (
                    <div className="flex flex-col gap-6 max-w-2xl">
                        {/* 학생 초기 잔액 설정 */}
                        <div className="flex flex-col gap-4 p-5 rounded-2xl"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Settings size={16} style={{ color: "var(--primary)" }} />
                                    <h3 className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                        학생 초기 잔액 설정
                                    </h3>
                                </div>
                                {balanceSaved && (
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                        style={{ background: "rgba(6,214,160,0.1)", color: "var(--accent)" }}>
                                        ✓ 저장됨
                                    </span>
                                )}
                            </div>
                            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                현재 설정: ₩{initialBalance.toLocaleString()} · 저장 시 전체 학생 잔액이 이 금액으로 리셋됩니다.
                            </p>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                                        style={{ color: "var(--foreground-muted)" }}>₩</span>
                                    <input
                                        type="number"
                                        value={balanceInput}
                                        onChange={(e) => setBalanceInput(e.target.value)}
                                        min={0}
                                        step={100000}
                                        className="w-full pl-7 pr-4 py-3 rounded-xl text-sm font-bold outline-none"
                                        style={{
                                            background: "var(--surface-2)",
                                            border: "1px solid var(--border)",
                                            color: "var(--foreground)",
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={handleSaveBalance}
                                    disabled={isSavingBalance}
                                    className="px-5 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
                                    style={{ background: "var(--primary)" }}
                                >
                                    {isSavingBalance ? "저장 중..." : "전체 적용"}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 p-5 rounded-2xl"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <div className="flex items-center gap-2">
                                <Settings size={16} style={{ color: "#7C3AED" }} />
                                <h3 className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                    교사 PIN 관리
                                </h3>
                            </div>
                            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                교사 대시보드 접근 시 사용하는 PIN 번호입니다.
                            </p>

                            {/* 현재 PIN */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest"
                                    style={{ color: "var(--foreground-muted)" }}>현재 PIN</label>
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                    <span className="text-sm font-mono font-bold flex-1" style={{ color: "var(--foreground)" }}>
                                        {showPin ? (currentPin || "미설정") : (currentPin ? "•".repeat(currentPin.length) : "미설정")}
                                    </span>
                                    <button onClick={() => setShowPin(v => !v)}
                                        className="p-1" style={{ color: "var(--foreground-muted)" }}>
                                        {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* 새 PIN 입력 */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest"
                                    style={{ color: "var(--foreground-muted)" }}>새 PIN</label>
                                <input
                                    type={showPin ? "text" : "password"}
                                    value={newPin}
                                    onChange={e => setNewPin(e.target.value)}
                                    placeholder="새 PIN 입력 (4자리 이상)"
                                    className="px-4 py-3 rounded-xl text-sm font-mono font-bold outline-none"
                                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                />
                            </div>

                            {/* PIN 확인 */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest"
                                    style={{ color: "var(--foreground-muted)" }}>새 PIN 확인</label>
                                <input
                                    type={showPin ? "text" : "password"}
                                    value={confirmPin}
                                    onChange={e => setConfirmPin(e.target.value)}
                                    placeholder="새 PIN 재입력"
                                    className="px-4 py-3 rounded-xl text-sm font-mono font-bold outline-none"
                                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                />
                            </div>

                            {/* 결과 메시지 */}
                            {pinResult && (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
                                    style={{
                                        background: pinResult.ok ? "rgba(6,214,160,0.1)" : "rgba(239,68,68,0.1)",
                                        color: pinResult.ok ? "var(--accent)" : "#ef4444",
                                    }}>
                                    {pinResult.ok ? <Check size={14} /> : <Shield size={14} />}
                                    {pinResult.msg}
                                </div>
                            )}

                            <button
                                onClick={handleSavePin}
                                disabled={pinSaving || !newPin || !confirmPin}
                                className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", color: "white" }}>
                                {pinSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                {pinSaving ? "저장 중..." : "PIN 변경 저장"}
                            </button>
                        </div>

                        {/* AI API 키 관리 */}
                        <div className="flex flex-col gap-4 p-5 rounded-2xl"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <div className="flex items-center gap-2">
                                <Key size={16} style={{ color: "#7C3AED" }} />
                                <h3 className="text-sm font-black" style={{ color: "var(--foreground)" }}>Gemini AI 키 관리</h3>
                            </div>
                            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                할당량 초과 시 새 키를 등록하면 재배포 없이 즉시 반영됩니다. DB 키가 없으면 환경변수 키를 사용합니다.
                            </p>

                            {/* 현재 상태 */}
                            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${apiKeyStatus?.hasKey ? "bg-green-400" : "bg-foreground/20"}`} />
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                            {apiKeyStatus?.hasKey ? "DB 키 등록됨" : "환경변수 키 사용 중"}
                                        </p>
                                        {apiKeyStatus?.hasKey && apiKeyStatus.masked && (
                                            <p className="text-xs font-mono mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                                {apiKeyStatus.masked}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {apiKeyStatus?.hasKey && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm("DB 키를 삭제하면 환경변수 키로 복귀해요. 계속할까요?")) return;
                                            setApiKeySaving(true);
                                            await fetch("/api/admin/gemini-key", { method: "DELETE" });
                                            const updated = await fetch("/api/admin/gemini-key").then(r => r.json());
                                            setApiKeyStatus(updated);
                                            setApiKeyMsg({ ok: true, msg: "키가 삭제됐어요. 환경변수 키를 사용합니다." });
                                            setApiKeySaving(false);
                                        }}
                                        disabled={apiKeySaving}
                                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                        style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                        키 삭제
                                    </button>
                                )}
                            </div>

                            {/* 피드백 */}
                            {apiKeyMsg && (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
                                    style={{
                                        background: apiKeyMsg.ok ? "rgba(6,214,160,0.1)" : "rgba(239,68,68,0.1)",
                                        color: apiKeyMsg.ok ? "var(--accent)" : "#ef4444",
                                    }}>
                                    {apiKeyMsg.ok ? <Check size={14} /> : <Shield size={14} />}
                                    {apiKeyMsg.msg}
                                </div>
                            )}

                            {/* 새 키 입력 */}
                            {showApiKeyInput ? (
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="password"
                                        value={newApiKey}
                                        onChange={e => setNewApiKey(e.target.value)}
                                        placeholder="AIza..."
                                        className="px-4 py-3 rounded-xl text-sm font-mono font-bold outline-none"
                                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                    />
                                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                        Google AI Studio(aistudio.google.com)에서 발급한 키를 입력하세요.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setShowApiKeyInput(false); setNewApiKey(""); }}
                                            className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                                            style={{ background: "var(--surface-2)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
                                            취소
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!newApiKey.trim()) return;
                                                setApiKeySaving(true);
                                                setApiKeyMsg(null);
                                                const res = await fetch("/api/admin/gemini-key", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ apiKey: newApiKey.trim() }),
                                                });
                                                const data = await res.json();
                                                if (!res.ok) {
                                                    setApiKeyMsg({ ok: false, msg: data.error ?? "저장 실패" });
                                                } else {
                                                    setApiKeyMsg({ ok: true, msg: "새 키가 저장됐어요! 즉시 반영됩니다." });
                                                    setNewApiKey("");
                                                    setShowApiKeyInput(false);
                                                    const updated = await fetch("/api/admin/gemini-key").then(r => r.json());
                                                    setApiKeyStatus(updated);
                                                }
                                                setApiKeySaving(false);
                                            }}
                                            disabled={apiKeySaving || !newApiKey.trim()}
                                            className="flex-1 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50"
                                            style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>
                                            {apiKeySaving ? "저장 중..." : "저장하기"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setShowApiKeyInput(true); setApiKeyMsg(null); }}
                                    className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90"
                                    style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>
                                    🔑 새 API 키 등록 / 교체
                                </button>
                            )}
                        </div>

                        {/* 회차 열람 관리 */}
                        <div className="flex flex-col gap-4 p-5 rounded-2xl"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Unlock size={16} style={{ color: "#7C3AED" }} />
                                    <h3 className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                        회차 열람 관리
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                        {unlockedWeeks.length}/29 열림
                                    </span>
                                    <button
                                        onClick={handleUnlockAll}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                                        style={{ background: "rgba(6,214,160,0.15)", color: "var(--accent)" }}>
                                        전체 열기
                                    </button>
                                    <button
                                        onClick={handleLockAll}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                                        style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
                                        전체 잠금
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                열린 회차만 학생이 세션 페이지에서 볼 수 있습니다.
                            </p>

                            {/* 1학기 */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider mb-2"
                                    style={{ color: "var(--foreground-muted)" }}>1학기 (1~15회)</p>
                                <div className="flex flex-col gap-1.5">
                                    {CURRICULUM.filter(s => s.semester === 1).map(s => {
                                        const isOpen = unlockedWeeks.includes(s.week);
                                        const isToggling = togglingWeek === s.week;
                                        return (
                                            <div key={s.week}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                                                style={{
                                                    background: isOpen ? "rgba(6,214,160,0.06)" : "var(--surface-2)",
                                                    border: `1px solid ${isOpen ? "rgba(6,214,160,0.25)" : "transparent"}`,
                                                }}>
                                                <span className="text-xs font-black w-10 shrink-0"
                                                    style={{ color: isOpen ? "var(--accent)" : "var(--foreground-muted)" }}>
                                                    {s.week}회
                                                </span>
                                                <span className="flex-1 text-xs font-semibold truncate"
                                                    style={{ color: isOpen ? "var(--foreground)" : "var(--foreground-muted)" }}>
                                                    {s.title}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleLock(s.week)}
                                                    disabled={isToggling}
                                                    className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-40"
                                                    style={{
                                                        background: isOpen ? "rgba(6,214,160,0.15)" : "var(--border)",
                                                        color: isOpen ? "var(--accent)" : "var(--foreground-muted)",
                                                    }}>
                                                    {isToggling
                                                        ? <Loader2 size={11} className="animate-spin" />
                                                        : isOpen
                                                            ? <><Unlock size={11} /> 열림</>
                                                            : <><Lock size={11} /> 잠김</>
                                                    }
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2학기 */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider mb-2"
                                    style={{ color: "var(--foreground-muted)" }}>2학기 (16~29회)</p>
                                <div className="flex flex-col gap-1.5">
                                    {CURRICULUM.filter(s => s.semester === 2).map(s => {
                                        const isOpen = unlockedWeeks.includes(s.week);
                                        const isToggling = togglingWeek === s.week;
                                        return (
                                            <div key={s.week}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                                                style={{
                                                    background: isOpen ? "rgba(6,214,160,0.06)" : "var(--surface-2)",
                                                    border: `1px solid ${isOpen ? "rgba(6,214,160,0.25)" : "transparent"}`,
                                                }}>
                                                <span className="text-xs font-black w-10 shrink-0"
                                                    style={{ color: isOpen ? "var(--accent)" : "var(--foreground-muted)" }}>
                                                    {s.week}회
                                                </span>
                                                <span className="flex-1 text-xs font-semibold truncate"
                                                    style={{ color: isOpen ? "var(--foreground)" : "var(--foreground-muted)" }}>
                                                    {s.title}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleLock(s.week)}
                                                    disabled={isToggling}
                                                    className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-40"
                                                    style={{
                                                        background: isOpen ? "rgba(6,214,160,0.15)" : "var(--border)",
                                                        color: isOpen ? "var(--accent)" : "var(--foreground-muted)",
                                                    }}>
                                                    {isToggling
                                                        ? <Loader2 size={11} className="animate-spin" />
                                                        : isOpen
                                                            ? <><Unlock size={11} /> 열림</>
                                                            : <><Lock size={11} /> 잠김</>
                                                    }
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
