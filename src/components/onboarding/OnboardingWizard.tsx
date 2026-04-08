"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import { supabase } from "@/lib/supabase/client";
import {
    Megaphone, BarChart2, Palette, Lightbulb,
    ChevronRight, ChevronLeft, Sparkles, Trophy,
    Users, CheckCircle2, Zap, GraduationCap, Shield,
    Loader2,
} from "lucide-react";
import { MARKETING_TYPE_DATA, AVATAR_OPTIONS, TEAM_EMOJIS } from "@/lib/constants/game";
import CharacterSVG from "@/components/character/CharacterSVG";
import { MARKETER_TO_CHARACTER, CHARACTERS } from "@/lib/characters/characters";

/* ── 마케터 포지션 타입 (아이콘은 크기가 달라 여기서 주입) ── */
interface MarketingType {
    id: string; icon: React.ReactNode; title: string;
    subtitle: string; desc: string; color: string; bg: string; badge: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
    creator: <Palette size={28} />,
    analyst: <BarChart2 size={28} />,
    storyteller: <Megaphone size={28} />,
    innovator: <Lightbulb size={28} />,
};

const MARKETING_TYPES: MarketingType[] = MARKETING_TYPE_DATA.map(t => ({
    ...t,
    icon: ICON_MAP[t.id],
}));


type Role = "student" | "teacher" | null;

export default function OnboardingWizard({ onComplete }: { onComplete?: () => void }) {
    const { updateProfile } = useGameStore();
    const router = useRouter();

    const [step, setStep] = useState(1);          // 1=역할선택, 2=마케터타입/교사PIN, 3=이름/팀/아바타, 4=확인
    const [role, setRole] = useState<Role>(null);
    const [selectedType, setSelectedType] = useState<MarketingType | null>(null);
    const [name, setName] = useState("");
    const [nameChecking, setNameChecking] = useState(false);
    const [nameDuplicate, setNameDuplicate] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [joinedTeam, setJoinedTeam] = useState<{ name: string; emoji: string; color: string } | null>(null);
    const [joinCodeChecking, setJoinCodeChecking] = useState(false);
    const [joinCodeError, setJoinCodeError] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState("🦊");
    const [isComplete, setIsComplete] = useState(false);
    const [animating, setAnimating] = useState(false);
    const [teacherPin, setTeacherPin] = useState("");
    const [pinError, setPinError] = useState(false);
    const [saving, setSaving] = useState(false);

    const totalSteps = role === "teacher" ? 2 : 4;

    const goNext = () => {
        setAnimating(true);
        setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 200);
    };
    const goBack = () => {
        setAnimating(true);
        setTimeout(() => { setStep(s => s - 1); setAnimating(false); }, 200);
    };

    // 이름 입력 시 500ms 디바운스로 중복 체크
    const nameCheckTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleNameChange = (value: string) => {
        setName(value);
        setNameDuplicate(false);
        if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
        if (!value.trim()) return;
        nameCheckTimer.current = setTimeout(async () => {
            setNameChecking(true);
            const { data } = await supabase
                .from("profiles")
                .select("id")
                .eq("name", value.trim())
                .limit(1);
            setNameDuplicate((data?.length ?? 0) > 0);
            setNameChecking(false);
        }, 500);
    };

    const handleJoinCode = async (code: string) => {
        setJoinCode(code);
        setJoinedTeam(null);
        setJoinCodeError("");
        if (code.trim().length < 6) return;
        setJoinCodeChecking(true);
        try {
            const res = await fetch(`/api/teams/join?code=${encodeURIComponent(code.trim())}`);
            if (res.ok) {
                const json = await res.json();
                setJoinedTeam(json.team);
            } else {
                const json = await res.json();
                setJoinCodeError(json.error ?? "유효하지 않은 코드예요");
            }
        } catch {
            setJoinCodeError("네트워크 오류가 발생했어요");
        } finally {
            setJoinCodeChecking(false);
        }
    };

    // 교사 완료
    const handleTeacherFinish = async () => {
        setSaving(true);
        const res = await fetch("/api/auth/verify-teacher-pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin: teacherPin }),
        });
        if (!res.ok) {
            setSaving(false);
            setPinError(true);
            setTimeout(() => setPinError(false), 1500);
            return;
        }
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const userId = session.user.id;
                const teacherName = session.user.user_metadata?.full_name || session.user.email || "선생님";
                const handle = "teacher_" + userId.slice(0, 6);
                const { error } = await supabase.from("profiles").upsert({
                    id: userId, name: teacherName, handle,
                    avatar: "👨‍🏫", marketer_type: null, team: "교사",
                    points: 0, rank: "Teacher", role: "teacher",
                });
                if (error) console.error("Profile upsert error:", error.message);
                updateProfile({ name: teacherName, handle, avatar: "👨‍🏫", rank: "Teacher", team: "교사", role: "teacher" });
            }
            router.push("/teacher");
        } catch (e) {
            console.error("Teacher finish error:", e);
        } finally {
            setSaving(false);
        }
    };

    // 학생 완료
    const handleStudentFinish = async () => {
        if (!selectedType || !name.trim()) return;
        setSaving(true);

        const handle = name.trim().toLowerCase().replace(/\s/g, "_") + "_marketer";

        const assignedTeam = joinedTeam?.name ?? "미배정";

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { error: upsertError } = await supabase.from("profiles").upsert({
                id: session.user.id, name: name.trim(), handle,
                avatar: selectedAvatar, marketer_type: selectedType.id,
                team: assignedTeam, points: 0, rank: selectedType.badge, role: "student",
            });
            if (upsertError) {
                console.error("Profile save error:", upsertError.message);
                setSaving(false);
                return; // 저장 실패 시 완료 화면으로 넘어가지 않음
            }
            localStorage.setItem("sellstagram_user_id", session.user.id);
        }

        updateProfile({ name: name.trim(), handle, avatar: selectedAvatar, rank: selectedType.badge, team: assignedTeam, role: "student", marketerType: selectedType.id });

        setSaving(false);
        setIsComplete(true);
    };

    const handleEnter = () => {
        if (onComplete) onComplete();
        else router.replace("/feed");
    };

    // ── 완료 화면 ──
    if (isComplete && selectedType) {
        const charType = MARKETER_TO_CHARACTER[selectedType.id];
        const char = charType ? CHARACTERS[charType] : null;
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
                <div className="w-full max-w-sm rounded-3xl p-8 text-center"
                    style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>

                    {/* 파트너 캐릭터 등장 */}
                    {char && charType && (
                        <div className="flex flex-col items-center mb-5">
                            <div className="w-28 h-28 rounded-3xl flex items-center justify-center mb-3"
                                style={{ background: char.bgColor, border: `2px solid ${char.borderColor}`, animation: "var(--animate-pop-in)" }}>
                                <CharacterSVG type={charType} size={100} />
                            </div>
                            <span className="text-lg font-black" style={{ color: char.color }}>{char.name}</span>
                            <span className="text-xs font-semibold mt-0.5" style={{ color: "#aaa" }}>{char.species}</span>
                            <span className="text-xs italic mt-1 px-3" style={{ color: "#bbb" }}>&quot;{char.quote}&quot;</span>
                        </div>
                    )}

                    <h2 className="text-2xl font-black mb-1 font-outfit" style={{ color: "var(--foreground)" }}>
                        파트너 만남 완료! 🎉
                    </h2>
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground-soft)" }}>
                        {name} · {selectedType.badge}
                    </p>
                    <p className="text-xs mb-5" style={{ color: "var(--foreground-muted)" }}>
                        XP를 모을수록 파트너가 함께 성장해요 🌱
                    </p>
                    <div className="rounded-2xl p-4 mb-6" style={{ background: joinedTeam ? "var(--accent-light)" : "var(--surface-2)", border: joinedTeam ? "1px solid var(--accent)" : "none" }}>
                        <div className="flex items-center gap-2">
                            <Users size={16} style={{ color: joinedTeam ? "var(--accent)" : "var(--secondary)" }} />
                            <span className="text-sm font-semibold" style={{ color: "var(--foreground-soft)" }}>
                                {joinedTeam
                                    ? `${joinedTeam.emoji} ${joinedTeam.name}에 합류했어요!`
                                    : "팀은 선생님이 곧 배정해 드릴 거예요!"}
                            </span>
                        </div>
                    </div>
                    <button onClick={handleEnter}
                        className="w-full py-3.5 rounded-2xl font-black text-white text-base transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)", boxShadow: "0 6px 20px var(--primary-glow)" }}>
                        <Sparkles size={16} className="inline mr-2" />
                        셀스타그램 시작하기!
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}>
            <div className="w-full max-w-lg rounded-3xl overflow-hidden"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)", opacity: animating ? 0 : 1, transition: "opacity 0.2s ease" }}>

                {/* 헤더 */}
                <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}>
                                <Zap size={16} className="text-white" />
                            </div>
                            <span className="font-black text-sm font-outfit" style={{ color: "var(--foreground)" }}>Sellstagram</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: "var(--foreground-muted)" }}>
                            {step} / {totalSteps}
                        </span>
                    </div>
                    <div className="progress-track h-1.5">
                        <div className="progress-fill progress-orange" style={{ width: `${(step / totalSteps) * 100}%` }} />
                    </div>
                </div>

                {/* 콘텐츠 */}
                <div className="px-6 py-6">

                    {/* ── STEP 1: 역할 선택 ── */}
                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-black mb-1 font-outfit" style={{ color: "var(--foreground)" }}>
                                어떤 역할로 시작하나요? 👋
                            </h2>
                            <p className="text-sm mb-6" style={{ color: "var(--foreground-soft)" }}>
                                역할에 따라 다른 화면이 준비되어 있어요
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                {/* 학생 */}
                                <button
                                    onClick={() => setRole("student")}
                                    className="flex flex-col items-center gap-3 p-6 rounded-2xl text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    style={{
                                        background: role === "student" ? "#FFF0EB" : "var(--surface-2)",
                                        border: role === "student" ? "2px solid var(--primary)" : "2px solid transparent",
                                        boxShadow: role === "student" ? "0 4px 16px var(--primary-glow)" : "none",
                                    }}
                                >
                                    {role === "student" && (
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle2 size={16} style={{ color: "var(--primary)" }} />
                                        </div>
                                    )}
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                                        style={{ background: role === "student" ? "var(--primary)" : "var(--surface)" }}>
                                        <GraduationCap size={30} className={role === "student" ? "text-white" : ""} style={{ color: role === "student" ? "white" : "var(--foreground-muted)" }} />
                                    </div>
                                    <div>
                                        <p className="font-black text-base" style={{ color: "var(--foreground)" }}>학생</p>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--foreground-soft)" }}>마케팅 미션에 도전!</p>
                                    </div>
                                </button>

                                {/* 교사 */}
                                <button
                                    onClick={() => setRole("teacher")}
                                    className="flex flex-col items-center gap-3 p-6 rounded-2xl text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    style={{
                                        background: role === "teacher" ? "#EEF1FD" : "var(--surface-2)",
                                        border: role === "teacher" ? "2px solid var(--secondary)" : "2px solid transparent",
                                        boxShadow: role === "teacher" ? "0 4px 16px rgba(67,97,238,0.2)" : "none",
                                    }}
                                >
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                        style={{ background: role === "teacher" ? "var(--secondary)" : "var(--surface)" }}>
                                        <Shield size={30} style={{ color: role === "teacher" ? "white" : "var(--foreground-muted)" }} />
                                    </div>
                                    <div>
                                        <p className="font-black text-base" style={{ color: "var(--foreground)" }}>교사</p>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--foreground-soft)" }}>수업 현황 관리</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2 (교사): PIN 입력 ── */}
                    {step === 2 && role === "teacher" && (
                        <div>
                            <h2 className="text-xl font-black mb-1 font-outfit" style={{ color: "var(--foreground)" }}>
                                교사 인증 🔐
                            </h2>
                            <p className="text-sm mb-6" style={{ color: "var(--foreground-soft)" }}>
                                교사 전용 PIN을 입력하세요
                            </p>
                            <div className="flex flex-col gap-3">
                                <input
                                    type="password"
                                    value={teacherPin}
                                    onChange={e => setTeacherPin(e.target.value)}
                                    placeholder="비밀번호 입력"
                                    className="w-full px-4 py-4 rounded-xl text-base font-medium outline-none transition-all"
                                    style={{
                                        background: "var(--surface-2)",
                                        border: pinError ? "2px solid #EF4444" : "2px solid var(--secondary)",
                                        color: "var(--foreground)",
                                    }}
                                />
                                {pinError && (
                                    <p className="text-sm font-bold text-center" style={{ color: "#EF4444" }}>
                                        PIN이 올바르지 않아요
                                    </p>
                                )}
                                <div className="p-3 rounded-xl flex items-center gap-2"
                                    style={{ background: "var(--secondary-light)" }}>
                                    <Shield size={14} style={{ color: "var(--secondary)" }} />
                                    <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>
                                        교사 PIN은 선생님께 문의하세요
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2 (학생): 마케터 타입 ── */}
                    {step === 2 && role === "student" && (
                        <div>
                            <h2 className="text-xl font-black mb-1 font-outfit" style={{ color: "var(--foreground)" }}>
                                나는 어떤 마케터? 🤔
                            </h2>
                            <p className="text-sm mb-4" style={{ color: "var(--foreground-soft)" }}>
                                타입을 고르면 나만의 파트너가 생겨요!
                            </p>

                            {/* 선택된 캐릭터 미리보기 */}
                            {selectedType && (() => {
                                const charType = MARKETER_TO_CHARACTER[selectedType.id];
                                const char = charType ? CHARACTERS[charType] : null;
                                return char ? (
                                    <div className="flex items-center gap-3 p-3 rounded-2xl mb-4 transition-all"
                                        style={{ background: char.bgColor, border: `1.5px solid ${char.borderColor}` }}>
                                        <CharacterSVG type={charType} size={56} />
                                        <div>
                                            <p className="font-black text-sm" style={{ color: char.color }}>{char.name}</p>
                                            <p className="text-[11px]" style={{ color: "#aaa" }}>{char.species}</p>
                                            <p className="text-[11px] italic mt-0.5" style={{ color: "#999" }}>&quot;{char.quote}&quot;</p>
                                        </div>
                                    </div>
                                ) : null;
                            })()}

                            <div className="grid grid-cols-2 gap-3">
                                {MARKETING_TYPES.map((type) => (
                                    <button key={type.id} onClick={() => setSelectedType(type)}
                                        className="relative flex flex-col gap-2 p-4 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        style={{
                                            background: selectedType?.id === type.id ? type.bg : "var(--surface-2)",
                                            border: selectedType?.id === type.id ? `2px solid ${type.color}` : "2px solid transparent",
                                        }}>
                                        {selectedType?.id === type.id && (
                                            <div className="absolute top-2 right-2">
                                                <CheckCircle2 size={16} style={{ color: type.color }} />
                                            </div>
                                        )}
                                        <div style={{ color: selectedType?.id === type.id ? type.color : "var(--foreground-muted)" }}>
                                            {type.icon}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm" style={{ color: "var(--foreground)" }}>{type.title}</p>
                                            <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "var(--foreground-soft)" }}>{type.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: 이름 + 팀코드 + 아바타 ── */}
                    {step === 3 && role === "student" && (
                        <div>
                            <h2 className="text-xl font-black mb-1 font-outfit" style={{ color: "var(--foreground)" }}>
                                내 마케터 정보 입력 ✏️
                            </h2>
                            <p className="text-sm mb-5" style={{ color: "var(--foreground-soft)" }}>
                                이름과 아바타를 설정해요. 팀 코드가 있으면 입력해보세요!
                            </p>
                            <div className="flex flex-col gap-4">
                                {/* 이름 */}
                                <div>
                                    <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>이름</label>
                                    <div className="relative">
                                        <input type="text" value={name} onChange={e => handleNameChange(e.target.value)}
                                            placeholder="예: 김지우"
                                            className="w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none"
                                            style={{
                                                background: "var(--surface-2)",
                                                border: nameDuplicate ? "2px solid #EF4444" : name ? "2px solid var(--primary)" : "2px solid transparent",
                                                color: "var(--foreground)",
                                            }} />
                                        {nameChecking && (
                                            <Loader2 size={14} className="animate-spin absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-muted)" }} />
                                        )}
                                    </div>
                                    {nameDuplicate && (
                                        <p className="mt-1.5 text-xs font-bold" style={{ color: "#EF4444" }}>
                                            이미 사용 중인 이름이에요. 다른 이름을 입력해주세요.
                                        </p>
                                    )}
                                </div>

                                {/* 팀 코드 (선택) */}
                                <div>
                                    <label className="text-xs font-bold mb-1.5 flex items-center gap-1.5 block" style={{ color: "var(--foreground-soft)" }}>
                                        <Users size={12} />
                                        팀 코드
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "var(--surface-3)", color: "var(--foreground-muted)" }}>선택</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={joinCode}
                                            onChange={e => handleJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                                            placeholder="선생님께 받은 6자리 코드 입력"
                                            maxLength={6}
                                            className="w-full px-4 py-3 rounded-xl text-sm font-black outline-none tracking-widest uppercase"
                                            style={{
                                                background: "var(--surface-2)",
                                                border: joinedTeam
                                                    ? "2px solid var(--accent)"
                                                    : joinCodeError
                                                    ? "2px solid #EF4444"
                                                    : "2px solid transparent",
                                                color: "var(--foreground)",
                                                letterSpacing: "0.15em",
                                            }}
                                        />
                                        {joinCodeChecking && (
                                            <Loader2 size={16} className="animate-spin absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-muted)" }} />
                                        )}
                                    </div>
                                    {joinedTeam && (
                                        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
                                            <CheckCircle2 size={14} style={{ color: "var(--accent)" }} />
                                            <span className="text-sm font-black" style={{ color: "var(--accent)" }}>
                                                {joinedTeam.emoji} {joinedTeam.name} 배정 확인!
                                            </span>
                                        </div>
                                    )}
                                    {joinCodeError && (
                                        <p className="mt-1.5 text-xs font-bold" style={{ color: "#EF4444" }}>{joinCodeError}</p>
                                    )}
                                    {!joinCode && (
                                        <p className="mt-1.5 text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                            코드가 없으면 비워두세요 — 팀 미배정으로 시작해요
                                        </p>
                                    )}
                                </div>

                                {/* 아바타 */}
                                <div>
                                    <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--foreground-soft)" }}>아바타</label>
                                    <div className="flex flex-wrap gap-2">
                                        {AVATAR_OPTIONS.map(emoji => (
                                            <button key={emoji} onClick={() => setSelectedAvatar(emoji)}
                                                className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                                                style={{
                                                    background: selectedAvatar === emoji ? "var(--primary-light)" : "var(--surface-2)",
                                                    border: selectedAvatar === emoji ? "2px solid var(--primary)" : "2px solid transparent",
                                                }}>
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: 확인 ── */}
                    {step === 4 && role === "student" && selectedType && (
                        <div>
                            <h2 className="text-xl font-black mb-1 font-outfit" style={{ color: "var(--foreground)" }}>
                                마케터 카드 완성! 🎉
                            </h2>
                            <p className="text-sm mb-5" style={{ color: "var(--foreground-soft)" }}>
                                이 정보로 셀스타그램을 시작할게요
                            </p>
                            <div className="rounded-2xl p-5 mb-4"
                                style={{ background: `linear-gradient(135deg, ${selectedType.color}22, ${selectedType.color}11)`, border: `1.5px solid ${selectedType.color}44` }}>
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                                        style={{ background: "white", boxShadow: "var(--shadow-sm)" }}>
                                        {selectedAvatar}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-black text-lg" style={{ color: "var(--foreground)" }}>{name || "이름 없음"}</span>
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full w-fit"
                                            style={{ background: selectedType.bg, color: selectedType.color }}>
                                            {selectedType.badge}
                                        </span>
                                        {joinedTeam ? (
                                            <span className="text-xs font-black" style={{ color: "var(--accent)" }}>
                                                {joinedTeam.emoji} {joinedTeam.name} 배정됨
                                            </span>
                                        ) : (
                                            <span className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                                팀 미배정 (추후 배정 가능)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "var(--secondary-light)" }}>
                                <Trophy size={18} style={{ color: "var(--secondary)" }} className="shrink-0 mt-0.5" />
                                <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>
                                    팀원들과 인사하고 첫 마케팅 콘텐츠를 만들어 피드에 올려보세요!
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 하단 버튼 */}
                <div className="px-6 pb-6 flex gap-3" style={{ borderTop: "1px solid var(--border)" }}>
                    {step > 1 && (
                        <button onClick={goBack}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                            style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}>
                            <ChevronLeft size={16} /> 이전
                        </button>
                    )}

                    {/* 다음/완료 버튼 */}
                    {step < totalSteps ? (
                        <button onClick={goNext}
                            disabled={
                                (step === 1 && !role) ||
                                (step === 2 && role === "student" && !selectedType) ||
                                (step === 3 && role === "student" && (
                                    !name.trim() ||                                          // 이름 미입력
                                    nameChecking ||                                          // 이름 중복 확인 중
                                    nameDuplicate ||                                         // 이름 중복
                                    joinCodeChecking ||                                      // 코드 검증 중
                                    (joinCode.trim().length > 0 && !joinedTeam)             // 코드 입력했는데 유효하지 않음
                                ))
                            }
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)", boxShadow: "0 4px 14px var(--primary-glow)" }}>
                            다음 <ChevronRight size={16} />
                        </button>
                    ) : role === "teacher" ? (
                        <button onClick={handleTeacherFinish} disabled={!teacherPin || saving}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                            style={{ background: "linear-gradient(135deg, var(--secondary), #6B5CE7)" }}>
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                            {saving ? "저장 중..." : "교사 대시보드 입장"}
                        </button>
                    ) : (
                        <button onClick={handleStudentFinish} disabled={!selectedType || !name.trim() || saving}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                            style={{ background: "linear-gradient(135deg, var(--accent), var(--secondary))" }}>
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {saving ? "저장 중..." : "마케터 시작!"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
