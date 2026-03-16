"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
    GraduationCap,
    ChevronRight,
    Clock,
    Target,
    BookOpen,
    Sparkles,
    CheckCircle2,
    Lock,
    Play,
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    Zap,
    Trophy,
    Users,
    BarChart2,
    ExternalLink,
    PenLine,
    Copy,
    Check,
} from "lucide-react";
import {
    CURRICULUM,
    getSessionByWeek,
    THEME_LABELS,
    THEME_COLORS,
    ACTIVITY_ICONS,
} from "@/lib/curriculum/sessions";
import { useGameStore } from "@/store/useGameStore";
import WeeklyReportModal from "@/components/feed/WeeklyReportModal";

export function SessionContent() {
    const { week: currentWeek, setUploadModalOpen, user } = useGameStore();
    const [viewWeek, setViewWeek] = useState(currentWeek);
    const [expandedActivity, setExpandedActivity] = useState<number | null>(0);
    const [showCurriculumMap, setShowCurriculumMap] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [promptCopied, setPromptCopied] = useState<number | null>(null);
    const [teamMembers, setTeamMembers] = useState<{ name: string; avatar: string }[]>([]);
    const [loadingTeam, setLoadingTeam] = useState(true);
    const [unlockedWeeks, setUnlockedWeeks] = useState<number[]>([]);

    useEffect(() => {
        if (!user.team) {
            setLoadingTeam(false);
            return;
        }
        setLoadingTeam(true);
        supabase
            .from("profiles")
            .select("name, avatar")
            .eq("team", user.team)
            .then(({ data }) => {
                if (data) setTeamMembers(data);
                setLoadingTeam(false);
            });
    }, [user.team]);

    useEffect(() => {
        supabase.from("app_settings").select("unlocked_weeks").eq("id", 1).single()
            .then(({ data }) => { if (Array.isArray(data?.unlocked_weeks)) setUnlockedWeeks(data.unlocked_weeks); });
    }, []);

    const isLocked = !unlockedWeeks.includes(viewWeek);

    const session = getSessionByWeek(viewWeek);
    const isCurrentSession = viewWeek === currentWeek;
    const isPastSession = viewWeek < currentWeek;

    if (!session) return null;

    const themeStyle = THEME_COLORS[session.theme];

    const copyPrompt = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setPromptCopied(index);
            setTimeout(() => setPromptCopied(null), 2000);
        });
    };

    return (
        <>
        {showReport && (
            <WeeklyReportModal
                weekNumber={viewWeek}
                sessionTitle={session.title}
                onClose={() => setShowReport(false)}
            />
        )}
        <div className="flex flex-col gap-6 px-4 pt-6 max-w-2xl mx-auto pb-28">

            {/* ── 헤더 ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: themeStyle.bg }}
                    >
                        <GraduationCap size={24} style={{ color: themeStyle.color }} />
                    </div>
                    <div>
                        <p className="text-sm font-bold" style={{ color: "var(--foreground-muted)" }}>
                            {session.semester}학기
                        </p>
                        <h1 className="text-2xl font-black font-outfit" style={{ color: "var(--foreground)" }}>
                            {viewWeek}회차 수업
                        </h1>
                    </div>
                </div>
                {/* 커리큘럼 지도 토글 */}
                <button
                    onClick={() => setShowCurriculumMap(!showCurriculumMap)}
                    className="flex items-center gap-1.5 text-sm font-bold px-3 py-2.5 rounded-xl transition-all"
                    style={{
                        background: showCurriculumMap ? "var(--secondary-light)" : "var(--surface-2)",
                        color: showCurriculumMap ? "var(--secondary)" : "var(--foreground-soft)",
                    }}
                >
                    <BookOpen size={15} />
                    {showCurriculumMap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {/* ── 커리큘럼 지도 (토글) ── */}
            {showCurriculumMap && (
                <div
                    className="rounded-2xl p-4"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                    <h3 className="text-sm font-black mb-4" style={{ color: "var(--foreground)" }}>
                        29회 전체 커리큘럼
                    </h3>

                    {/* 1학기 */}
                    <div className="mb-4">
                        <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "var(--foreground-muted)" }}>
                            1학기 (15회)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {CURRICULUM.filter((s) => s.semester === 1).map((s) => {
                                const tc = THEME_COLORS[s.theme];
                                const isDone = s.week < currentWeek;
                                const isCurrent = s.week === currentWeek;
                                const locked = !unlockedWeeks.includes(s.week);
                                return (
                                    <button
                                        key={s.week}
                                        onClick={() => { if (!locked) { setViewWeek(s.week); setShowCurriculumMap(false); setExpandedActivity(0); } }}
                                        disabled={locked}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        style={{
                                            background: locked ? "var(--surface-2)" : isCurrent ? tc.color : isDone ? tc.bg : "var(--surface-2)",
                                            color: locked ? "var(--foreground-muted)" : isCurrent ? "white" : isDone ? tc.color : "var(--foreground-muted)",
                                            border: locked ? "1.5px solid transparent" : isCurrent ? "none" : `1.5px solid ${isDone ? tc.color + "44" : "transparent"}`,
                                        }}
                                    >
                                        {locked ? <Lock size={9} /> : isDone ? <CheckCircle2 size={9} /> : isCurrent ? <Play size={9} /> : <Lock size={9} />}
                                        {s.week}회
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2학기 */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "var(--foreground-muted)" }}>
                            2학기 (14회)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {CURRICULUM.filter((s) => s.semester === 2).map((s) => {
                                const tc = THEME_COLORS[s.theme];
                                const isDone = s.week < currentWeek;
                                const isCurrent = s.week === currentWeek;
                                const locked = !unlockedWeeks.includes(s.week);
                                return (
                                    <button
                                        key={s.week}
                                        onClick={() => { if (!locked) { setViewWeek(s.week); setShowCurriculumMap(false); setExpandedActivity(0); } }}
                                        disabled={locked}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        style={{
                                            background: locked ? "var(--surface-2)" : isCurrent ? tc.color : isDone ? tc.bg : "var(--surface-2)",
                                            color: locked ? "var(--foreground-muted)" : isCurrent ? "white" : isDone ? tc.color : "var(--foreground-muted)",
                                            border: locked ? "1.5px solid transparent" : isCurrent ? "none" : `1.5px solid ${isDone ? tc.color + "44" : "transparent"}`,
                                        }}
                                    >
                                        {locked ? <Lock size={9} /> : isDone ? <CheckCircle2 size={9} /> : isCurrent ? <Play size={9} /> : <Lock size={9} />}
                                        {s.week}회
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── 이전/다음 주 내비 ── */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => { setViewWeek((w) => Math.max(1, w - 1)); setExpandedActivity(0); }}
                    disabled={viewWeek <= 1}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: "var(--surface-2)" }}
                >
                    <ChevronLeft size={20} style={{ color: "var(--foreground-soft)" }} />
                </button>

                <div className="flex-1 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    {[
                        Math.max(1, viewWeek - 2),
                        Math.max(1, viewWeek - 1),
                        viewWeek,
                        Math.min(29, viewWeek + 1),
                        Math.min(29, viewWeek + 2),
                    ]
                        .filter((v, i, arr) => arr.indexOf(v) === i)
                        .map((w) => (
                            <button
                                key={w}
                                onClick={() => { setViewWeek(w); setExpandedActivity(0); }}
                                className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                style={{
                                    background: w === viewWeek ? "var(--primary)" : "var(--surface-2)",
                                    color: w === viewWeek ? "white" : "var(--foreground-soft)",
                                }}
                            >
                                {w}회차
                            </button>
                        ))}
                </div>

                <button
                    onClick={() => { setViewWeek((w) => Math.min(29, w + 1)); setExpandedActivity(0); }}
                    disabled={viewWeek >= 29 || !unlockedWeeks.includes(viewWeek + 1)}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: "var(--surface-2)" }}
                >
                    <ChevronRight size={20} style={{ color: "var(--foreground-soft)" }} />
                </button>
            </div>

            {/* ── 오늘 수업 타이틀 카드 ── */}
            <div
                className="relative overflow-hidden rounded-2xl p-6"
                style={{
                    background: `linear-gradient(135deg, ${themeStyle.color}18, ${themeStyle.color}08)`,
                    border: `1.5px solid ${themeStyle.color}33`,
                }}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <span
                                className="text-xs font-bold px-3 py-1.5 rounded-full"
                                style={{ background: themeStyle.bg, color: themeStyle.color }}
                            >
                                {THEME_LABELS[session.theme]}
                            </span>
                            {isCurrentSession && (
                                <span className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
                                    진행 중
                                </span>
                            )}
                            {isPastSession && (
                                <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                                    style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
                                    완료
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-black font-outfit mb-1" style={{ color: "var(--foreground)" }}>
                            {session.title}
                        </h2>
                        <p className="text-base font-semibold" style={{ color: "var(--foreground-soft)" }}>
                            {session.subtitle}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: "var(--foreground-muted)" }}>
                            <Clock size={14} />
                            2시간
                        </div>
                        <div className="flex gap-1 mt-1">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        background: i < session.difficultyLevel ? themeStyle.color : "var(--surface-2)",
                                    }}
                                />
                            ))}
                        </div>
                        <p className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                            {session.difficultyLevel === 1 ? "기초" : session.difficultyLevel === 2 ? "보통" : "심화"}
                        </p>
                    </div>
                </div>

                {session.aiTool && (
                    <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${themeStyle.color}22` }}>
                        <Sparkles size={14} style={{ color: themeStyle.color }} />
                        <span className="text-sm font-bold" style={{ color: "var(--foreground-soft)" }}>
                            사용 AI 도구
                        </span>
                        <span className="text-sm font-bold" style={{ color: themeStyle.color }}>
                            {session.aiTool}
                        </span>
                    </div>
                )}
            </div>

            {/* ── 수업 결과 기록 버튼 ── */}
            <a
                href="https://84ak.github.io/activity_log/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                    background: `linear-gradient(135deg, ${themeStyle.color}14, ${themeStyle.color}08)`,
                    border: `1.5px solid ${themeStyle.color}40`,
                }}
            >
                <div className="flex items-center gap-4">
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: themeStyle.bg }}
                    >
                        <PenLine size={20} style={{ color: themeStyle.color }} />
                    </div>
                    <div>
                        <p className="text-base font-black" style={{ color: themeStyle.color }}>
                            {viewWeek}회차 활동 기록하기
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                            오늘 만든 이미지·프롬프트 결과를 저장해요
                        </p>
                    </div>
                </div>
                <ExternalLink size={16} style={{ color: themeStyle.color, opacity: 0.7 }} />
            </a>

            {/* ── 잠금 오버레이 ── */}
            {isLocked && (
                <div
                    className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
                    style={{ background: "var(--surface)", border: "2px dashed var(--border)" }}
                >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "var(--surface-2)" }}>
                        <Lock size={28} style={{ color: "var(--foreground-muted)" }} />
                    </div>
                    <div>
                        <p className="text-base font-black mb-1" style={{ color: "var(--foreground)" }}>
                            {viewWeek}회차 수업은 아직 잠겨 있어요
                        </p>
                        <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>
                            선생님이 수업을 진행하면 자동으로 공개됩니다
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                        style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
                        <GraduationCap size={13} />
                        현재 {currentWeek}회차 수업 진행 중
                    </div>
                </div>
            )}

            {!isLocked && <>

            {/* ── 학습 목표 ── */}
            <div
                className="rounded-2xl p-6"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                <div className="flex items-center gap-2.5 mb-4">
                    <Target size={18} style={{ color: "var(--secondary)" }} />
                    <h3 className="text-base font-black" style={{ color: "var(--foreground)" }}>
                        오늘의 학습 목표
                    </h3>
                </div>
                <div className="flex flex-col gap-3">
                    {session.goals.map((goal, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-black"
                                style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}
                            >
                                {i + 1}
                            </div>
                            <span className="text-base font-medium leading-snug" style={{ color: "var(--foreground)" }}>
                                {goal}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── 2시간 활동 타임라인 ── */}
            <div>
                <h3 className="text-base font-black mb-4 px-1 flex items-center gap-2.5" style={{ color: "var(--foreground)" }}>
                    <Clock size={18} style={{ color: "var(--primary)" }} />
                    2시간 활동 플랜
                </h3>

                <div className="flex flex-col gap-3">
                    {session.activities.map((activity, i) => {
                        const isExpanded = expandedActivity === i;
                        const iconEmoji = ACTIVITY_ICONS[activity.type];
                        const isCopied = promptCopied === i;

                        return (
                            <div
                                key={i}
                                className="rounded-2xl overflow-hidden transition-all"
                                style={{
                                    background: "var(--surface)",
                                    border: isExpanded ? `1.5px solid ${themeStyle.color}55` : "1px solid var(--border)",
                                    boxShadow: isExpanded ? `0 4px 20px ${themeStyle.color}11` : "none",
                                }}
                            >
                                {/* 활동 헤더 */}
                                <button
                                    onClick={() => setExpandedActivity(isExpanded ? null : i)}
                                    className="w-full flex items-center gap-4 p-5 text-left"
                                >
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                                        style={{
                                            background: isExpanded ? themeStyle.bg : "var(--surface-2)",
                                        }}
                                    >
                                        {iconEmoji}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold mb-1" style={{ color: "var(--foreground-muted)" }}>
                                            ⏱ {activity.time}
                                        </p>
                                        <p className="text-base font-bold truncate" style={{ color: "var(--foreground)" }}>
                                            {activity.title}
                                        </p>
                                    </div>

                                    <div style={{ color: "var(--foreground-muted)" }}>
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </button>

                                {/* 활동 상세 */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 flex flex-col gap-4">
                                        <p className="text-base leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                                            {activity.desc}
                                        </p>

                                        {/* Gemini 프롬프트 복사 블록 */}
                                        {activity.aiPrompt && (
                                            <div
                                                className="rounded-xl overflow-hidden"
                                                style={{ border: `1.5px solid ${themeStyle.color}33` }}
                                            >
                                                <div
                                                    className="flex items-center justify-between px-4 py-2.5"
                                                    style={{ background: themeStyle.bg }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles size={13} style={{ color: themeStyle.color }} />
                                                        <span className="text-xs font-black" style={{ color: themeStyle.color }}>
                                                            Gemini 프롬프트
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => copyPrompt(activity.aiPrompt!, i)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all"
                                                        style={{
                                                            background: isCopied ? "var(--accent)" : themeStyle.color,
                                                            color: "white",
                                                        }}
                                                    >
                                                        {isCopied ? <Check size={11} /> : <Copy size={11} />}
                                                        {isCopied ? "복사됨!" : "복사"}
                                                    </button>
                                                </div>
                                                <div className="px-4 py-3" style={{ background: "var(--surface-2)" }}>
                                                    <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--foreground-soft)", fontFamily: "monospace" }}>
                                                        {activity.aiPrompt}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {activity.tip && (
                                            <div
                                                className="flex items-start gap-3 p-4 rounded-xl"
                                                style={{ background: "var(--highlight-light)" }}
                                            >
                                                <span className="text-xl shrink-0">💡</span>
                                                <div>
                                                    <p className="text-xs font-black mb-1" style={{ color: "var(--highlight-dark)" }}>
                                                        선생님 팁
                                                    </p>
                                                    <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                                                        {activity.tip}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* 실습 타입이면 업로드 버튼 (+XP 표시) */}
                                        {(activity.type === "practice" || activity.type === "wrap") && isCurrentSession && (
                                            <button
                                                onClick={() => setUploadModalOpen(true, "mission")}
                                                className="w-full py-3 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                                                style={{
                                                    background: `linear-gradient(135deg, ${themeStyle.color}, ${themeStyle.color}CC)`,
                                                }}
                                            >
                                                <Zap size={16} />
                                                지금 업로드하기
                                                <span className="ml-1 text-xs font-black px-2 py-0.5 rounded-full bg-white/20">
                                                    +XP
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── 키워드 태그 ── */}
            <div
                className="rounded-2xl p-6"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                <h3 className="text-sm font-black mb-4" style={{ color: "var(--foreground-soft)" }}>
                    📚 이번 수업 핵심 키워드
                </h3>
                <div className="flex flex-wrap gap-2.5">
                    {session.keywords.map((kw) => (
                        <span
                            key={kw}
                            className="text-sm font-bold px-4 py-2 rounded-full"
                            style={{ background: themeStyle.bg, color: themeStyle.color }}
                        >
                            #{kw}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── 수업 전후 학습 자료 CTA ── */}
            <div className="grid grid-cols-2 gap-3">
                <Link
                    href="/learn"
                    className="rounded-2xl p-5 flex flex-col gap-2.5 transition-all hover:scale-[1.02]"
                    style={{ background: "var(--accent-light)", border: `1px solid ${THEME_COLORS.skill.color}22` }}
                >
                    <BookOpen size={22} style={{ color: "var(--accent)" }} />
                    <p className="text-sm font-black" style={{ color: "var(--accent)" }}>
                        학습 자료 보기
                    </p>
                    <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>
                        마케팅 개념 + AI 도구 가이드
                    </p>
                </Link>

                <Link
                    href="/missions"
                    className="rounded-2xl p-5 flex flex-col gap-2.5 transition-all hover:scale-[1.02]"
                    style={{ background: "var(--highlight-light)", border: `1px solid var(--highlight)22` }}
                >
                    <Trophy size={22} style={{ color: "#D97706" }} />
                    <p className="text-sm font-black" style={{ color: "#D97706" }}>
                        미션 확인하기
                    </p>
                    <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>
                        이번 주 팀 미션 보기
                    </p>
                </Link>
            </div>

            {/* ── 이번 주 성과 리포트 CTA ── */}
            {(isCurrentSession || isPastSession) && (
                <button
                    onClick={() => setShowReport(true)}
                    className="w-full flex items-center justify-between p-5 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: "var(--secondary-light)", border: "1px solid rgba(67,97,238,0.15)" }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "var(--secondary)" }}>
                            <BarChart2 size={20} className="text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-base font-black" style={{ color: "var(--secondary)" }}>
                                {viewWeek}회차 성과 리포트
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                                AI 코치의 이번 주 마케팅 피드백 받기
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={18} style={{ color: "var(--secondary)" }} />
                </button>
            )}

            </>}

            {/* ── 팀 현황 미니 ── */}
            <div
                className="rounded-2xl p-6"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                <div className="flex items-center gap-2.5 mb-4">
                    <Users size={18} style={{ color: "var(--secondary)" }} />
                    <h3 className="text-base font-black" style={{ color: "var(--foreground)" }}>
                        팀 참여 현황
                    </h3>
                </div>
                {loadingTeam ? (
                    <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                        팀원 정보를 불러오는 중...
                    </p>
                ) : !user.team ? (
                    <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                        아직 팀에 배정되지 않았어요. 선생님께 문의하세요.
                    </p>
                ) : teamMembers.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                        같은 팀 학생이 없어요.
                    </p>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {teamMembers.slice(0, 5).map((m, i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center text-lg"
                                    style={{ background: "var(--surface-2)", borderColor: "var(--surface)" }}
                                    title={m.name}
                                >
                                    {m.avatar?.startsWith("http") ? (
                                        <img src={m.avatar} alt={m.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <span>{m.avatar || "🦊"}</span>
                                    )}
                                </div>
                            ))}
                            {teamMembers.length > 5 && (
                                <div
                                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                                    style={{ background: "var(--surface-2)", borderColor: "var(--surface)", color: "var(--foreground-muted)" }}
                                >
                                    +{teamMembers.length - 5}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                {user.team} · {teamMembers.length}명
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                {teamMembers.map(m => m.name).join(", ")}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}

export default SessionContent;
