"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
    Zap, Loader2, Users, CheckCircle2, ChevronRight,
    Palette, BarChart2, Megaphone, Lightbulb, UserCheck, AlertCircle, ArrowLeft,
} from "lucide-react";
import { MARKETING_TYPE_DATA, AVATAR_OPTIONS } from "@/lib/constants/game";

const ICON_MAP_SM: Record<string, React.ReactNode> = {
    creator: <Palette size={18} />,
    analyst: <BarChart2 size={18} />,
    storyteller: <Megaphone size={18} />,
    innovator: <Lightbulb size={18} />,
};

const MARKETING_TYPES = MARKETING_TYPE_DATA.map(t => ({ ...t, icon: ICON_MAP_SM[t.id] }));

type Tab = "social" | "teamcode";
// 이름 확인 결과
type NameStatus = "available" | "taken" | "returning" | null;

export default function LoginPage() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("social");
    const [socialLoading, setSocialLoading] = useState<"google" | "kakao" | null>(null);
    const [error, setError] = useState<string | null>(null);

    /* ── 팀 코드 탭 상태 ── */
    const [teamCode, setTeamCode] = useState("");
    const [teamCodeChecking, setTeamCodeChecking] = useState(false);
    const [teamInfo, setTeamInfo] = useState<{ id: string; name: string; emoji: string } | null>(null);
    const [teamCodeError, setTeamCodeError] = useState("");
    const [name, setName] = useState("");
    const [nameChecking, setNameChecking] = useState(false);
    const [nameStatus, setNameStatus] = useState<NameStatus>(null);
    const [selectedType, setSelectedType] = useState<typeof MARKETING_TYPES[0] | null>(null);
    const [selectedAvatar, setSelectedAvatar] = useState("🦊");
    const [loading, setLoading] = useState(false);

    const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const teamCodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 이미 로그인된 경우 바로 진입
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) router.push("/feed");
        });
        const params = new URLSearchParams(window.location.search);
        if (params.get("error") === "auth") {
            setError("로그인 중 문제가 발생했어요. 다시 시도해주세요.");
        }
    }, [router]);

    /* ── 소셜 로그인 ── */
    const handleOAuth = async (provider: "google" | "kakao") => {
        setSocialLoading(provider);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) {
            setError("로그인 연결에 실패했어요. 다시 시도해주세요.");
            setSocialLoading(null);
        }
    };

    /* ── 팀 코드 입력 (디바운스) ── */
    const handleTeamCode = (raw: string) => {
        const code = raw.toUpperCase().slice(0, 6);
        setTeamCode(code);
        setTeamInfo(null);
        setTeamCodeError("");
        setNameStatus(null);
        setName("");
        if (teamCodeTimer.current) clearTimeout(teamCodeTimer.current);
        if (code.length < 6) return;
        setTeamCodeChecking(true);
        teamCodeTimer.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/teams/join?code=${encodeURIComponent(code)}`);
                if (res.ok) {
                    const json = await res.json();
                    setTeamInfo(json.team);
                } else {
                    const json = await res.json();
                    setTeamCodeError(json.error ?? "유효하지 않은 코드예요");
                }
            } catch {
                setTeamCodeError("네트워크 오류가 발생했어요");
            } finally {
                setTeamCodeChecking(false);
            }
        }, 400);
    };

    /* ── 이름 입력 → DB에서 이름 존재 여부 확인 ── */
    const handleNameChange = (value: string) => {
        setName(value);
        setNameStatus(null);
        if (nameTimer.current) clearTimeout(nameTimer.current);
        if (!value.trim() || !teamInfo) return;
        setNameChecking(true);
        nameTimer.current = setTimeout(async () => {
            try {
                // profiles 전체에서 이름 조회 (팀 무관)
                const { data: matches } = await supabase
                    .from("profiles")
                    .select("id, team")
                    .eq("name", value.trim());

                if (!matches || matches.length === 0) {
                    // 이름 사용 가능 → 신규 가입 폼 표시
                    setNameStatus("available");
                } else {
                    // 같은 팀에 이름이 있으면 → 기존 계정 (재로그인)
                    const sameTeam = matches.find(p => p.team === teamInfo.name);
                    if (sameTeam) {
                        setNameStatus("returning");
                    } else {
                        // 다른 팀에 이름 있음 → 사용 불가
                        setNameStatus("taken");
                    }
                }
            } catch {
                setNameStatus("available");
            } finally {
                setNameChecking(false);
            }
        }, 500);
    };

    /* ── 기존 계정 로그인 (서버 API 호출) ── */
    const handleReturningLogin = async () => {
        if (!teamInfo || !name.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/team-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), teamCode }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? "로그인 실패"); return; }
            if (json.session) {
                await supabase.auth.setSession({
                    access_token: json.session.access_token,
                    refresh_token: json.session.refresh_token,
                });
                router.push("/feed");
            }
        } catch {
            setError("네트워크 오류가 발생했어요");
        } finally {
            setLoading(false);
        }
    };

    /* ── 신규 가입 제출 ── */
    const handleNewUserJoin = async () => {
        if (!teamInfo || !name.trim() || !selectedType) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/team-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    teamCode,
                    type: selectedType.id,
                    avatar: selectedAvatar,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error ?? "참가에 실패했어요");
                return;
            }
            await supabase.auth.setSession({
                access_token: json.session.access_token,
                refresh_token: json.session.refresh_token,
            });
            router.push("/feed");
        } catch {
            setError("네트워크 오류가 발생했어요");
        } finally {
            setLoading(false);
        }
    };

    // 탭 전환 시 상태 초기화
    const switchTab = (t: Tab) => {
        setTab(t);
        setTeamCode("");
        setTeamInfo(null);
        setTeamCodeError("");
        setName("");
        setNameStatus(null);
        setSelectedType(null);
        setSelectedAvatar("🦊");
        setError(null);
    };

    const canSubmitNew =
        !!teamInfo && name.trim().length > 0 && nameStatus === "available" &&
        !nameChecking && !!selectedType && !loading;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative"
            style={{ background: "var(--background)" }}>

            {/* 홈으로 버튼 */}
            <button
                onClick={() => router.push("/")}
                className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                    background: "var(--surface-2)",
                    color: "var(--foreground-soft)",
                    border: "1px solid var(--border)",
                }}
            >
                <ArrowLeft size={15} />
                홈으로
            </button>

            <div className="w-full max-w-sm flex flex-col items-center gap-6">

                {/* 로고 */}
                <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)", boxShadow: "0 12px 32px var(--primary-glow)" }}>
                        <Zap size={40} className="text-white" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tight font-outfit" style={{ color: "var(--foreground)" }}>
                            Sellstagram
                        </h1>
                        <p className="text-sm mt-1 font-semibold" style={{ color: "var(--foreground-soft)" }}>
                            마케팅 시뮬레이션 플랫폼
                        </p>
                    </div>
                </div>

                {/* 탭 */}
                <div className="w-full flex rounded-2xl p-1 gap-1" style={{ background: "var(--surface-2)" }}>
                    {([ ["social", "소셜 로그인"], ["teamcode", "팀 코드 참가"] ] as const).map(([id, label]) => (
                        <button key={id} onClick={() => switchTab(id)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                            style={{
                                background: tab === id ? "var(--surface)" : "transparent",
                                color: tab === id ? "var(--foreground)" : "var(--foreground-muted)",
                                boxShadow: tab === id ? "var(--shadow-sm)" : "none",
                            }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* 에러 */}
                {error && (
                    <div className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-center"
                        style={{ background: "#FEF2F2", color: "#DC2626" }}>
                        {error}
                    </div>
                )}

                {/* ── 소셜 로그인 탭 ── */}
                {tab === "social" && (
                    <div className="w-full flex flex-col gap-3">
                        <div className="w-full rounded-2xl p-4 text-center" style={{ background: "var(--surface-2)" }}>
                            <p className="text-sm font-semibold" style={{ color: "var(--foreground-soft)" }}>
                                소셜 계정으로 간편하게 시작하세요
                            </p>
                            <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                                학생 · 교사 구분은 로그인 후 설정해요
                            </p>
                        </div>

                        <button onClick={() => handleOAuth("google")} disabled={socialLoading !== null}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                            style={{ background: "white", color: "#3C4043", border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                            {socialLoading === "google" ? <Loader2 size={20} className="animate-spin" style={{ color: "#4285F4" }} /> : (
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                            )}
                            Google로 시작하기
                        </button>

                        <button onClick={() => handleOAuth("kakao")} disabled={socialLoading !== null}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                            style={{ background: "#FEE500", color: "#3C1E1E", boxShadow: "0 2px 8px rgba(254,229,0,0.4)" }}>
                            {socialLoading === "kakao" ? <Loader2 size={20} className="animate-spin" style={{ color: "#3C1E1E" }} /> : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E">
                                    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.82 1.69 5.3 4.27 6.79L5.2 21l4.07-2.14c.88.2 1.79.3 2.73.3 5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
                                </svg>
                            )}
                            카카오로 시작하기
                        </button>

                        <p className="text-xs text-center" style={{ color: "var(--foreground-muted)" }}>
                            로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다
                        </p>
                    </div>
                )}

                {/* ── 팀 코드 탭 ── */}
                {tab === "teamcode" && (
                    <div className="w-full flex flex-col gap-4">

                        {/* 팀 코드 */}
                        <div>
                            <label className="text-xs font-bold mb-1.5 flex items-center gap-1.5 block"
                                style={{ color: "var(--foreground-soft)" }}>
                                <Users size={12} /> 팀 코드
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={teamCode}
                                    onChange={e => handleTeamCode(e.target.value)}
                                    placeholder="선생님께 받은 6자리 코드"
                                    maxLength={6}
                                    className="w-full px-4 py-3.5 rounded-xl text-base font-black outline-none tracking-widest uppercase"
                                    style={{
                                        background: "var(--surface-2)",
                                        border: teamInfo ? "2px solid var(--accent)" : teamCodeError ? "2px solid #EF4444" : "2px solid var(--border)",
                                        color: "var(--foreground)",
                                        letterSpacing: "0.2em",
                                    }}
                                />
                                {teamCodeChecking && (
                                    <Loader2 size={16} className="animate-spin absolute right-4 top-1/2 -translate-y-1/2"
                                        style={{ color: "var(--foreground-muted)" }} />
                                )}
                            </div>
                            {teamInfo && (
                                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl"
                                    style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
                                    <CheckCircle2 size={14} style={{ color: "var(--accent)" }} />
                                    <span className="text-sm font-black" style={{ color: "var(--accent)" }}>
                                        {teamInfo.emoji} {teamInfo.name} 확인됨
                                    </span>
                                </div>
                            )}
                            {teamCodeError && (
                                <p className="mt-1.5 text-xs font-bold" style={{ color: "#EF4444" }}>{teamCodeError}</p>
                            )}
                        </div>

                        {/* 이름 — 팀 확인 후 표시 */}
                        {teamInfo && (
                            <div>
                                <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>
                                    이름
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => handleNameChange(e.target.value)}
                                        placeholder="예: 김지우"
                                        className="w-full px-4 py-3.5 rounded-xl text-sm font-semibold outline-none"
                                        style={{
                                            background: "var(--surface-2)",
                                            border: nameStatus === "taken"
                                                ? "2px solid #F59E0B"
                                                : nameStatus === "available"
                                                ? "2px solid var(--accent)"
                                                : nameStatus === "returning"
                                                ? "2px solid var(--secondary)"
                                                : name ? "2px solid var(--primary)" : "2px solid var(--border)",
                                            color: "var(--foreground)",
                                        }}
                                    />
                                    {nameChecking && (
                                        <Loader2 size={14} className="animate-spin absolute right-4 top-1/2 -translate-y-1/2"
                                            style={{ color: "var(--foreground-muted)" }} />
                                    )}
                                    {!nameChecking && nameStatus === "available" && (
                                        <CheckCircle2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2"
                                            style={{ color: "var(--accent)" }} />
                                    )}
                                    {!nameChecking && nameStatus === "taken" && (
                                        <AlertCircle size={14} className="absolute right-4 top-1/2 -translate-y-1/2"
                                            style={{ color: "#F59E0B" }} />
                                    )}
                                </div>

                                {/* 이름 상태 피드백 */}
                                {nameStatus === "taken" && (
                                    <p className="mt-1.5 text-xs font-bold flex items-center gap-1" style={{ color: "#F59E0B" }}>
                                        <AlertCircle size={11} /> 이미 사용 중인 이름이에요. 다른 이름을 써주세요.
                                    </p>
                                )}
                                {nameStatus === "available" && (
                                    <p className="mt-1.5 text-xs font-bold flex items-center gap-1" style={{ color: "var(--accent)" }}>
                                        <CheckCircle2 size={11} /> 사용 가능한 이름이에요!
                                    </p>
                                )}
                                {nameStatus === "returning" && (
                                    <p className="mt-1.5 text-xs font-bold flex items-center gap-1" style={{ color: "var(--secondary)" }}>
                                        <UserCheck size={11} /> 기존 계정이 있어요. 바로 접속할게요!
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 기존 계정 → 접속 버튼 */}
                        {nameStatus === "returning" && !nameChecking && (
                            <button onClick={handleReturningLogin} disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                                style={{ background: "linear-gradient(135deg, var(--secondary), #6B5CE7)", boxShadow: "0 4px 14px rgba(67,97,238,0.3)" }}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
                                {loading ? "접속 중..." : "내 계정으로 접속하기"}
                            </button>
                        )}

                        {/* 신규 유저 → 마케터 타입 + 아바타 선택 */}
                        {nameStatus === "available" && !nameChecking && (
                            <>
                                <div className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                                    style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
                                    <UserCheck size={14} style={{ color: "var(--accent)" }} />
                                    <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                                        처음 오셨군요! 마케터 정보를 설정해주세요
                                    </span>
                                </div>

                                {/* 마케터 타입 */}
                                <div>
                                    <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>
                                        마케터 타입
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {MARKETING_TYPES.map(type => (
                                            <button key={type.id} onClick={() => setSelectedType(type)}
                                                className="relative flex items-center gap-2 p-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                style={{
                                                    background: selectedType?.id === type.id ? type.bg : "var(--surface-2)",
                                                    border: selectedType?.id === type.id ? `2px solid ${type.color}` : "2px solid transparent",
                                                }}>
                                                {selectedType?.id === type.id && (
                                                    <CheckCircle2 size={12} className="absolute top-1.5 right-1.5"
                                                        style={{ color: type.color }} />
                                                )}
                                                <span style={{ color: selectedType?.id === type.id ? type.color : "var(--foreground-muted)" }}>
                                                    {type.icon}
                                                </span>
                                                <span className="text-xs font-black" style={{ color: "var(--foreground)" }}>
                                                    {type.title}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 아바타 */}
                                <div>
                                    <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>
                                        아바타
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {AVATAR_OPTIONS.map(emoji => (
                                            <button key={emoji} onClick={() => setSelectedAvatar(emoji)}
                                                className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                                                style={{
                                                    background: selectedAvatar === emoji ? "var(--primary-light)" : "var(--surface-2)",
                                                    border: selectedAvatar === emoji ? "2px solid var(--primary)" : "2px solid transparent",
                                                }}>
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 참가 버튼 */}
                                <button onClick={handleNewUserJoin} disabled={!canSubmitNew}
                                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)", boxShadow: canSubmitNew ? "0 4px 14px var(--primary-glow)" : "none" }}>
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
                                    {loading ? "참가 중..." : "셀스타그램 참가하기"}
                                </button>
                            </>
                        )}

                        {/* 로딩 중 (반환 유저 로그인 처리) */}
                        {loading && nameStatus !== "available" && (
                            <div className="flex items-center justify-center gap-2 py-2">
                                <Loader2 size={16} className="animate-spin" style={{ color: "var(--primary)" }} />
                                <span className="text-sm font-semibold" style={{ color: "var(--foreground-soft)" }}>로그인 중...</span>
                            </div>
                        )}

                        <p className="text-xs text-center" style={{ color: "var(--foreground-muted)" }}>
                            팀 코드는 선생님께 받으세요 · 소셜 계정 없이도 참가 가능해요
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
