"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    BookOpen,
    Sparkles,
    Play,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Clock,
    Lightbulb,
    BarChart2,
    CheckCircle2,
    ChevronRight,
    ArrowRight,
    Zap,
    Trophy,
} from "lucide-react";
import {
    CONCEPT_CARDS,
    AI_TOOL_GUIDES,
    TUTORIALS,
    type Difficulty,
} from "@/lib/learn/content";
import { useGameStore } from "@/store/useGameStore";

type Tab = "concept" | "ai" | "tutorial";

const DIFFICULTY_STYLE: Record<Difficulty, { color: string; bg: string }> = {
    초급: { color: "#06D6A0", bg: "#E6FBF5" },
    중급: { color: "#D97706", bg: "#FFF8E0" },
    고급: { color: "#EF4444", bg: "#FEF2F2" },
};

export default function LearnPage() {
    const { week: currentWeek, setUploadModalOpen } = useGameStore();
    const [activeTab, setActiveTab] = useState<Tab>("concept");
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null);
    const [expandedAI, setExpandedAI] = useState<string | null>(null);
    const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | "전체">("전체");

    const tabs: { id: Tab; label: string; emoji: string }[] = [
        { id: "concept", label: "마케팅 개념", emoji: "📚" },
        { id: "ai", label: "AI 도구", emoji: "🤖" },
        { id: "tutorial", label: "단계별 실습", emoji: "🎯" },
    ];

    const filteredConcepts = CONCEPT_CARDS.filter(
        (c) => filterDifficulty === "전체" || c.difficulty === filterDifficulty
    );
    const filteredTutorials = TUTORIALS.filter(
        (t) => filterDifficulty === "전체" || t.difficulty === filterDifficulty
    );

    // 현재 수업과 관련된 자료
    const relatedConcepts = CONCEPT_CARDS.filter((c) => c.relatedWeeks.includes(currentWeek));
    const relatedTutorials = TUTORIALS.filter((t) => t.relatedWeeks.includes(currentWeek));

    return (
        <div className="flex flex-col gap-6 p-4 pt-6 max-w-3xl mx-auto pb-24">

            {/* ── 헤더 ── */}
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--accent-light)" }}>
                    <BookOpen size={22} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                    <h1 className="text-2xl font-black font-outfit" style={{ color: "var(--foreground)" }}>
                        학습 자료 허브
                    </h1>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground-soft)" }}>
                        개념 → 도구 → 실습, 이 순서로 배워요!
                    </p>
                </div>
            </div>

            {/* ── 오늘의 학습 플로우 (핵심 안내) ── */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1.5px solid var(--secondary)", background: "var(--secondary-light)" }}
            >
                <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(67,97,238,0.2)" }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={16} style={{ color: "var(--secondary)" }} />
                        <span className="font-black text-sm" style={{ color: "var(--secondary)" }}>
                            이렇게 사용하세요 — {currentWeek}회차 수업 기준
                        </span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>
                        아래 3단계 순서대로 진행하면 수업 내용을 완벽하게 익힐 수 있어요!
                    </p>
                </div>

                <div className="p-5 flex flex-col gap-3">
                    {/* Step 1 */}
                    <button
                        onClick={() => { setActiveTab("concept"); setExpandedCard(null); }}
                        className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:scale-[1.01]"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0"
                            style={{ background: "#EEF1FD", color: "var(--secondary)" }}>
                            1
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-base" style={{ color: "var(--foreground)" }}>
                                📚 마케팅 개념 카드 읽기
                            </p>
                            <p className="text-sm mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                                {relatedConcepts.length > 0
                                    ? `오늘 수업엔 "${relatedConcepts[0].title}" 등 ${relatedConcepts.length}개가 관련돼요`
                                    : "오늘 수업의 핵심 개념을 먼저 이해해요"}
                            </p>
                        </div>
                        <ChevronRight size={18} style={{ color: "var(--foreground-muted)" }} />
                    </button>

                    <div className="flex items-center gap-2 px-4">
                        <div className="w-px h-4 mx-auto" style={{ background: "var(--border)", width: "1px" }} />
                        <ArrowRight size={14} style={{ color: "var(--foreground-muted)" }} />
                    </div>

                    {/* Step 2 */}
                    <button
                        onClick={() => setActiveTab("ai")}
                        className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:scale-[1.01]"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0"
                            style={{ background: "#FFF0EB", color: "var(--primary)" }}>
                            2
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-base" style={{ color: "var(--foreground)" }}>
                                🤖 AI 도구 사용법 보기
                            </p>
                            <p className="text-sm mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                                ChatGPT·Canva·Claude 프롬프트 예시를 복사해서 써봐요
                            </p>
                        </div>
                        <ChevronRight size={18} style={{ color: "var(--foreground-muted)" }} />
                    </button>

                    <div className="flex items-center gap-2 px-4">
                        <ArrowRight size={14} style={{ color: "var(--foreground-muted)" }} />
                    </div>

                    {/* Step 3 */}
                    <button
                        onClick={() => { setActiveTab("tutorial"); setExpandedTutorial(null); }}
                        className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:scale-[1.01]"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0"
                            style={{ background: "#E6FBF5", color: "var(--accent)" }}>
                            3
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-base" style={{ color: "var(--foreground)" }}>
                                🎯 튜토리얼 따라하기
                            </p>
                            <p className="text-sm mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                                단계별 가이드를 보며 셀스타그램에 직접 실습해요
                            </p>
                        </div>
                        <ChevronRight size={18} style={{ color: "var(--foreground-muted)" }} />
                    </button>

                    {/* 최종 액션 */}
                    <div
                        className="flex items-center gap-3 p-4 rounded-2xl mt-1"
                        style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}
                    >
                        <Zap size={20} className="text-white shrink-0" />
                        <div className="flex-1">
                            <p className="font-black text-base text-white">🚀 마지막: 셀스타그램에 실습 결과 올리기</p>
                            <p className="text-sm text-white/80 mt-0.5">배운 내용을 게시물로 만들어 팀 피드에 공유해요!</p>
                        </div>
                        <button
                            onClick={() => setUploadModalOpen(true, "mission")}
                            className="px-3 py-2 bg-white rounded-xl font-bold text-sm transition-all hover:bg-white/90 shrink-0"
                            style={{ color: "var(--primary)" }}
                        >
                            업로드
                        </button>
                    </div>
                </div>
            </div>

            {/* ── 오늘 수업 관련 자료 추천 ── */}
            {(relatedConcepts.length > 0 || relatedTutorials.length > 0) && (
                <div
                    className="rounded-2xl p-5"
                    style={{ background: "var(--highlight-light)", border: "1.5px solid var(--highlight)" }}
                >
                    <p className="font-black text-base mb-3 flex items-center gap-2" style={{ color: "#92400E" }}>
                        ⭐ {currentWeek}회차 수업 추천 자료
                    </p>
                    <div className="flex flex-col gap-2">
                        {relatedConcepts.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => { setActiveTab("concept"); setExpandedCard(c.id); }}
                                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                            >
                                <span className="text-xl">{c.emoji}</span>
                                <div className="flex-1">
                                    <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{c.title}</p>
                                    <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>{c.summary}</p>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                                    style={{ background: c.bg, color: c.color }}>개념</span>
                            </button>
                        ))}
                        {relatedTutorials.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => { setActiveTab("tutorial"); setExpandedTutorial(t.id); }}
                                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                            >
                                <span className="text-xl">{t.emoji}</span>
                                <div className="flex-1">
                                    <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{t.title}</p>
                                    <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>{t.desc}</p>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                                    style={{ background: t.bg, color: t.color }}>실습</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 탭 메뉴 ── */}
            <div className="flex gap-2 p-1.5 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                        style={{
                            background: activeTab === tab.id ? "var(--surface)" : "transparent",
                            color: activeTab === tab.id ? "var(--foreground)" : "var(--foreground-muted)",
                            boxShadow: activeTab === tab.id ? "var(--shadow-sm)" : "none",
                        }}
                    >
                        <span className="text-base">{tab.emoji}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── 난이도 필터 ── */}
            {activeTab !== "ai" && (
                <div className="flex gap-2">
                    {(["전체", "초급", "중급", "고급"] as const).map((level) => {
                        const style = level !== "전체" ? DIFFICULTY_STYLE[level] : null;
                        const isActive = filterDifficulty === level;
                        return (
                            <button
                                key={level}
                                onClick={() => setFilterDifficulty(level)}
                                className="px-4 py-2 rounded-full text-sm font-bold transition-all"
                                style={{
                                    background: isActive ? (style?.bg ?? "var(--foreground)") : "var(--surface-2)",
                                    color: isActive ? (style?.color ?? "var(--surface)") : "var(--foreground-muted)",
                                    border: isActive && style ? `1.5px solid ${style.color}55` : "1.5px solid transparent",
                                }}
                            >
                                {level}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ══════════════ 마케팅 개념 카드 탭 ══════════════ */}
            {activeTab === "concept" && (
                <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold px-1" style={{ color: "var(--foreground-soft)" }}>
                        카드를 눌러서 개념 설명, 실제 예시, 핵심 포인트를 확인하세요
                    </p>
                    {filteredConcepts.map((card) => {
                        const isExpanded = expandedCard === card.id;
                        const isRelated = card.relatedWeeks.includes(currentWeek);
                        const diffStyle = DIFFICULTY_STYLE[card.difficulty];

                        return (
                            <div
                                key={card.id}
                                className="rounded-2xl overflow-hidden transition-all"
                                style={{
                                    background: "var(--surface)",
                                    border: isExpanded ? `2px solid ${card.color}66` : "1px solid var(--border)",
                                    boxShadow: isExpanded ? `0 4px 20px ${card.color}11` : "none",
                                }}
                            >
                                <button
                                    onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                                    className="w-full flex items-center gap-4 p-5 text-left"
                                >
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                                        style={{ background: card.bg }}>
                                        {card.emoji}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-base font-black" style={{ color: "var(--foreground)" }}>
                                                {card.title}
                                            </span>
                                            {isRelated && (
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}>
                                                    ⭐ {currentWeek}회차
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>
                                            {card.summary}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                            style={{ background: diffStyle.bg, color: diffStyle.color }}>
                                            {card.difficulty}
                                        </span>
                                        <div style={{ color: "var(--foreground-muted)" }}>
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-5 pb-6 flex flex-col gap-5">
                                        {/* 설명 박스 */}
                                        <div className="p-4 rounded-2xl" style={{ background: card.bg }}>
                                            <p className="text-xs font-bold mb-2" style={{ color: card.color }}>
                                                {card.subtitle}
                                            </p>
                                            <p className="text-base leading-relaxed" style={{ color: "var(--foreground)" }}>
                                                {card.body}
                                            </p>
                                        </div>

                                        {/* 핵심 포인트 */}
                                        <div>
                                            <p className="text-sm font-black mb-3 flex items-center gap-2"
                                                style={{ color: "var(--foreground)" }}>
                                                <Lightbulb size={15} style={{ color: card.color }} />
                                                핵심 포인트
                                            </p>
                                            <div className="flex flex-col gap-2">
                                                {card.keyPoints.map((pt, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: card.color }} />
                                                        <span className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                                                            {pt}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 실제 예시 */}
                                        <div>
                                            <p className="text-sm font-black mb-3 flex items-center gap-2"
                                                style={{ color: "var(--foreground)" }}>
                                                <BarChart2 size={15} style={{ color: card.color }} />
                                                실제 예시
                                            </p>
                                            <div className="flex flex-col gap-2">
                                                {card.examples.map((ex, i) => (
                                                    <div key={i} className="p-4 rounded-xl text-sm leading-relaxed"
                                                        style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}>
                                                        {ex}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 관련 수업 + 바로 실습 */}
                                        <div className="flex items-center gap-3 flex-wrap pt-2"
                                            style={{ borderTop: "1px solid var(--border)" }}>
                                            <span className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                                관련 수업:
                                            </span>
                                            {card.relatedWeeks.map((w) => (
                                                <span key={w} className="text-sm font-bold px-3 py-1 rounded-full"
                                                    style={{
                                                        background: w === currentWeek ? card.bg : "var(--surface-2)",
                                                        color: w === currentWeek ? card.color : "var(--foreground-muted)",
                                                        border: w === currentWeek ? `1px solid ${card.color}44` : "none",
                                                    }}>
                                                    {w}회차{w === currentWeek ? " ← 지금!" : ""}
                                                </span>
                                            ))}
                                            <button
                                                onClick={() => { setActiveTab("tutorial"); }}
                                                className="ml-auto flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all hover:opacity-80"
                                                style={{ background: card.bg, color: card.color }}>
                                                튜토리얼로 → <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══════════════ AI 도구 가이드 탭 ══════════════ */}
            {activeTab === "ai" && (
                <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold px-1" style={{ color: "var(--foreground-soft)" }}>
                        도구를 눌러 4단계 사용법과 복사 가능한 프롬프트 예시를 확인하세요
                    </p>

                    <div className="p-4 rounded-2xl flex items-start gap-3"
                        style={{ background: "var(--secondary-light)", border: "1px solid rgba(67,97,238,0.2)" }}>
                        <Sparkles size={18} style={{ color: "var(--secondary)" }} className="shrink-0 mt-0.5" />
                        <p className="text-sm" style={{ color: "var(--foreground-soft)" }}>
                            <strong style={{ color: "var(--secondary)" }}>초보자라면?</strong> ChatGPT나 Claude부터 시작하세요.
                            익숙해지면 Canva AI로 이미지까지 만들 수 있어요! 모든 도구에 무료 플랜이 있어요.
                        </p>
                    </div>

                    {AI_TOOL_GUIDES.map((tool) => {
                        const isExpanded = expandedAI === tool.id;
                        const diffStyle = DIFFICULTY_STYLE[tool.difficulty];

                        return (
                            <div key={tool.id} className="rounded-2xl overflow-hidden transition-all"
                                style={{
                                    background: "var(--surface)",
                                    border: isExpanded ? `2px solid ${tool.color}55` : "1px solid var(--border)",
                                }}>
                                <button
                                    onClick={() => setExpandedAI(isExpanded ? null : tool.id)}
                                    className="w-full flex items-center gap-4 p-5 text-left">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                                        style={{ background: tool.bg }}>
                                        {tool.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-base font-black block mb-1" style={{ color: "var(--foreground)" }}>
                                            {tool.name}
                                        </span>
                                        <span className="text-sm" style={{ color: "var(--foreground-soft)" }}>
                                            {tool.tagline}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                            style={{ background: diffStyle.bg, color: diffStyle.color }}>
                                            {tool.difficulty}
                                        </span>
                                        {isExpanded ? <ChevronUp size={18} style={{ color: "var(--foreground-muted)" }} /> : <ChevronDown size={18} style={{ color: "var(--foreground-muted)" }} />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-5 pb-6 flex flex-col gap-5">
                                        {/* 활용 사례 */}
                                        <div className="flex flex-wrap gap-2">
                                            {tool.useCases.map((uc) => (
                                                <span key={uc} className="text-sm font-bold px-3 py-1.5 rounded-full"
                                                    style={{ background: tool.bg, color: tool.color }}>
                                                    {uc}
                                                </span>
                                            ))}
                                        </div>

                                        {/* 사용 방법 */}
                                        <div>
                                            <p className="text-sm font-black mb-3" style={{ color: "var(--foreground)" }}>
                                                📋 사용 방법 (따라해보세요)
                                            </p>
                                            <div className="flex flex-col gap-3">
                                                {tool.steps.map((s, i) => (
                                                    <div key={i} className="flex gap-4 items-start">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                                                            style={{ background: tool.bg, color: tool.color }}>
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                                                {s.step}
                                                            </p>
                                                            <p className="text-sm mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                                                                {s.desc}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 프롬프트 예시 */}
                                        {tool.promptExample && (
                                            <div>
                                                <p className="text-sm font-black mb-2" style={{ color: "var(--foreground)" }}>
                                                    💬 이렇게 입력해보세요! (복사 가능)
                                                </p>
                                                <div className="p-4 rounded-xl text-sm font-mono leading-relaxed"
                                                    style={{
                                                        background: "var(--surface-2)",
                                                        color: "var(--foreground)",
                                                        borderLeft: `4px solid ${tool.color}`,
                                                    }}>
                                                    {tool.promptExample}
                                                </div>
                                            </div>
                                        )}

                                        <a href={tool.link} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base text-white transition-all hover:opacity-90"
                                            style={{ background: tool.color }}>
                                            <ExternalLink size={16} />
                                            {tool.name} 열기 →
                                        </a>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══════════════ 단계별 실습 튜토리얼 탭 ══════════════ */}
            {activeTab === "tutorial" && (
                <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold px-1" style={{ color: "var(--foreground-soft)" }}>
                        튜토리얼을 펼치고 단계별 가이드를 따라 셀스타그램에서 바로 실습하세요
                    </p>

                    {filteredTutorials.map((tutorial) => {
                        const isExpanded = expandedTutorial === tutorial.id;
                        const isRelated = tutorial.relatedWeeks.includes(currentWeek);
                        const diffStyle = DIFFICULTY_STYLE[tutorial.difficulty];

                        return (
                            <div key={tutorial.id} className="rounded-2xl overflow-hidden transition-all"
                                style={{
                                    background: "var(--surface)",
                                    border: isExpanded ? `2px solid ${tutorial.color}55` : "1px solid var(--border)",
                                }}>
                                <button
                                    onClick={() => setExpandedTutorial(isExpanded ? null : tutorial.id)}
                                    className="w-full flex items-center gap-4 p-5 text-left">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                                        style={{ background: tutorial.bg }}>
                                        {tutorial.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-base font-black" style={{ color: "var(--foreground)" }}>
                                                {tutorial.title}
                                            </span>
                                            {isRelated && (
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}>
                                                    ⭐ {currentWeek}회차
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} style={{ color: "var(--foreground-muted)" }} />
                                                <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                                                    {tutorial.duration}
                                                </span>
                                            </div>
                                            <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                                                {tutorial.steps.length}단계
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                            style={{ background: diffStyle.bg, color: diffStyle.color }}>
                                            {diffStyle && tutorial.difficulty}
                                        </span>
                                        {isExpanded ? <ChevronUp size={18} style={{ color: "var(--foreground-muted)" }} /> : <ChevronDown size={18} style={{ color: "var(--foreground-muted)" }} />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-5 pb-6 flex flex-col gap-4">
                                        <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                                            {tutorial.desc}
                                        </p>

                                        {/* 단계별 가이드 */}
                                        <div className="flex flex-col gap-3">
                                            {tutorial.steps.map((step, i) => (
                                                <div key={i} className="flex gap-4 p-4 rounded-2xl"
                                                    style={{ background: "var(--surface-2)" }}>
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                                                        style={{ background: tutorial.color, color: "white" }}>
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                                            {step.title}
                                                        </p>
                                                        <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                                                            {step.desc}
                                                        </p>
                                                        {step.tip && (
                                                            <div className="flex items-start gap-2 mt-1 p-2.5 rounded-xl"
                                                                style={{ background: "var(--highlight-light)" }}>
                                                                <span>💡</span>
                                                                <span className="text-sm" style={{ color: "#D97706" }}>
                                                                    {step.tip}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* 관련 수업 */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                                관련 수업:
                                            </span>
                                            {tutorial.relatedWeeks.map((w) => (
                                                <span key={w} className="text-sm font-bold px-3 py-1 rounded-full"
                                                    style={{
                                                        background: w === currentWeek ? tutorial.bg : "var(--surface-2)",
                                                        color: w === currentWeek ? tutorial.color : "var(--foreground-muted)",
                                                    }}>
                                                    {w}회차{w === currentWeek ? " ← 지금!" : ""}
                                                </span>
                                            ))}
                                        </div>

                                        {/* 실습 버튼 */}
                                        <button
                                            onClick={() => setUploadModalOpen(true, "mission")}
                                            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98]"
                                            style={{ background: tutorial.color }}>
                                            <Play size={16} />
                                            따라했으면 셀스타그램에 올려보세요!
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* 학습 완료 CTA */}
                    <div className="mt-2 p-5 rounded-2xl flex items-center gap-4"
                        style={{ background: "var(--accent-light)", border: "1.5px solid var(--accent)" }}>
                        <Trophy size={28} style={{ color: "var(--accent)" }} className="shrink-0" />
                        <div>
                            <p className="font-black text-base" style={{ color: "var(--accent)" }}>
                                튜토리얼 완료 후 미션 도전!
                            </p>
                            <p className="text-sm mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                                배운 것을 활용해 이번 주 팀 미션을 완료하면 XP를 받아요
                            </p>
                        </div>
                        <Link href="/missions"
                            className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 shrink-0"
                            style={{ background: "var(--accent)" }}>
                            미션 <ChevronRight size={14} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
