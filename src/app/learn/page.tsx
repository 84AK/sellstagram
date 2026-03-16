"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    BookOpen,
    Play,
    ExternalLink,
    Clock,
    Lightbulb,
    BarChart2,
    CheckCircle2,
    ChevronRight,
    ArrowLeft,
    Zap,
    Trophy,
    Star,
    Sparkles,
    GraduationCap,
    Target,
} from "lucide-react";
import {
    CONCEPT_CARDS,
    AI_TOOL_GUIDES,
    TUTORIALS,
    type Difficulty,
    type ConceptCard,
    type AIToolGuide,
    type Tutorial,
} from "@/lib/learn/content";
import { useGameStore } from "@/store/useGameStore";
import { SessionContent } from "@/app/session/page";
import MissionList from "@/components/dashboard/MissionList";

type Tab = "today" | "concept" | "ai" | "tutorial";
type SelectedItem =
    | { type: "concept"; data: ConceptCard }
    | { type: "ai"; data: AIToolGuide }
    | { type: "tutorial"; data: Tutorial }
    | null;

const DIFFICULTY_STYLE: Record<Difficulty, { color: string; bg: string }> = {
    초급: { color: "#06D6A0", bg: "#E6FBF5" },
    중급: { color: "#D97706", bg: "#FFF8E0" },
    고급: { color: "#EF4444", bg: "#FEF2F2" },
};

/* ── 목록 아이템 (왼쪽 패널 공통) ── */
function ListItem({
    emoji,
    logo,
    title,
    subtitle,
    difficulty,
    isRelated,
    isSelected,
    currentWeek,
    onClick,
}: {
    emoji: string;
    logo?: string;
    title: string;
    subtitle: string;
    difficulty: Difficulty;
    isRelated: boolean;
    isSelected: boolean;
    currentWeek: number;
    onClick: () => void;
}) {
    const diff = DIFFICULTY_STYLE[difficulty];
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all"
            style={{
                background: isSelected ? "var(--secondary-light)" : "transparent",
                border: isSelected ? "1.5px solid var(--secondary)" : "1.5px solid transparent",
            }}
            onMouseEnter={(e) => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
            }}
            onMouseLeave={(e) => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
        >
            {logo ? (
                <img
                    src={logo}
                    alt={title}
                    className="w-8 h-8 shrink-0 rounded-lg object-contain"
                    onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = "none";
                        const span = document.createElement("span");
                        span.className = "text-2xl shrink-0";
                        span.textContent = emoji;
                        el.parentElement?.insertBefore(span, el);
                    }}
                />
            ) : (
                <span className="text-2xl shrink-0">{emoji}</span>
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                        {title}
                    </span>
                    {isRelated && (
                        <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}
                        >
                            ⭐{currentWeek}회
                        </span>
                    )}
                </div>
                <span className="text-xs line-clamp-1" style={{ color: "var(--foreground-muted)" }}>
                    {subtitle}
                </span>
            </div>
            <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: diff.bg, color: diff.color }}
            >
                {difficulty}
            </span>
        </button>
    );
}

/* ── 섹션 라벨 ── */
function SectionLabel({ label }: { label: string }) {
    return (
        <p
            className="text-xs font-black px-2 py-2 sticky top-0 z-10"
            style={{ color: "var(--foreground-muted)", background: "var(--surface)" }}
        >
            {label}
        </p>
    );
}

/* ── 개념 카드 상세 ── */
function ConceptDetail({
    card,
    currentWeek,
    onTutorial,
}: {
    card: ConceptCard;
    currentWeek: number;
    onTutorial: () => void;
}) {
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0"
                    style={{ background: card.bg }}
                >
                    {card.emoji}
                </div>
                <div>
                    <h2 className="text-xl font-black" style={{ color: "var(--foreground)" }}>
                        {card.title}
                    </h2>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: card.color }}>
                        {card.subtitle}
                    </p>
                </div>
            </div>

            <div className="p-4 rounded-2xl" style={{ background: card.bg }}>
                <p className="text-xs font-bold mb-2" style={{ color: card.color }}>
                    {card.subtitle}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {card.body}
                </p>
            </div>

            <div>
                <p className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
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

            <div>
                <p className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                    <BarChart2 size={15} style={{ color: card.color }} />
                    실제 예시
                </p>
                <div className="flex flex-col gap-2">
                    {card.examples.map((ex, i) => (
                        <div
                            key={i}
                            className="p-3 rounded-xl text-sm leading-relaxed"
                            style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}
                        >
                            {ex}
                        </div>
                    ))}
                </div>
            </div>

            <div
                className="pt-3 flex items-center gap-2 flex-wrap"
                style={{ borderTop: "1px solid var(--border)" }}
            >
                <span className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
                    관련 수업:
                </span>
                {card.relatedWeeks.map((w) => (
                    <span
                        key={w}
                        className="text-sm font-bold px-2.5 py-1 rounded-full"
                        style={{
                            background: w === currentWeek ? card.bg : "var(--surface-2)",
                            color: w === currentWeek ? card.color : "var(--foreground-muted)",
                            border: w === currentWeek ? `1px solid ${card.color}44` : "none",
                        }}
                    >
                        {w}회차{w === currentWeek ? " ← 지금!" : ""}
                    </span>
                ))}
                <button
                    onClick={onTutorial}
                    className="ml-auto flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all hover:opacity-80"
                    style={{ background: card.bg, color: card.color }}
                >
                    튜토리얼로 <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

/* ── AI 도구 상세 ── */
function AIToolDetail({ tool }: { tool: AIToolGuide }) {
    const diff = DIFFICULTY_STYLE[tool.difficulty];
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0"
                    style={{ background: tool.logo ? "transparent" : tool.bg }}
                >
                    {tool.logo ? (
                        <img
                            src={tool.logo}
                            alt={tool.name}
                            className="w-14 h-14 object-contain rounded-xl"
                            onError={(e) => {
                                const el = e.currentTarget;
                                el.style.display = "none";
                                const span = document.createElement("span");
                                span.textContent = tool.emoji;
                                el.parentElement?.appendChild(span);
                                if (el.parentElement) el.parentElement.style.background = tool.bg;
                            }}
                        />
                    ) : (
                        tool.emoji
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-black" style={{ color: "var(--foreground)" }}>
                        {tool.name}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                        {tool.tagline}
                    </p>
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                        style={{ background: diff.bg, color: diff.color }}
                    >
                        {tool.difficulty}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {tool.useCases.map((uc) => (
                    <span
                        key={uc}
                        className="text-sm font-bold px-3 py-1.5 rounded-full"
                        style={{ background: tool.bg, color: tool.color }}
                    >
                        {uc}
                    </span>
                ))}
            </div>

            <div>
                <p className="text-sm font-black mb-3" style={{ color: "var(--foreground)" }}>
                    사용 방법 (따라해보세요)
                </p>
                <div className="flex flex-col gap-3">
                    {tool.steps.map((s, i) => (
                        <div key={i} className="flex gap-4 items-start">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                                style={{ background: tool.bg, color: tool.color }}
                            >
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

            {tool.promptExample && (
                <div>
                    <p className="text-sm font-black mb-2" style={{ color: "var(--foreground)" }}>
                        이렇게 입력해보세요! (복사 가능)
                    </p>
                    <div
                        className="p-4 rounded-xl text-sm font-mono leading-relaxed"
                        style={{
                            background: "var(--surface-2)",
                            color: "var(--foreground)",
                            borderLeft: `4px solid ${tool.color}`,
                        }}
                    >
                        {tool.promptExample}
                    </div>
                </div>
            )}

            <a
                href={tool.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base text-white transition-all hover:opacity-90"
                style={{ background: tool.color }}
            >
                <ExternalLink size={16} />
                {tool.name} 열기 →
            </a>
        </div>
    );
}

/* ── 튜토리얼 상세 ── */
function TutorialDetail({
    tutorial,
    currentWeek,
    onUpload,
}: {
    tutorial: Tutorial;
    currentWeek: number;
    onUpload: () => void;
}) {
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0"
                    style={{ background: tutorial.bg }}
                >
                    {tutorial.emoji}
                </div>
                <div>
                    <h2 className="text-xl font-black" style={{ color: "var(--foreground)" }}>
                        {tutorial.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
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
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                {tutorial.desc}
            </p>

            <div className="flex flex-col gap-3">
                {tutorial.steps.map((step, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                            style={{ background: tutorial.color, color: "white" }}
                        >
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
                                <div
                                    className="flex items-start gap-2 mt-1 p-2.5 rounded-xl"
                                    style={{ background: "var(--highlight-light)" }}
                                >
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

            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
                    관련 수업:
                </span>
                {tutorial.relatedWeeks.map((w) => (
                    <span
                        key={w}
                        className="text-sm font-bold px-2.5 py-1 rounded-full"
                        style={{
                            background: w === currentWeek ? tutorial.bg : "var(--surface-2)",
                            color: w === currentWeek ? tutorial.color : "var(--foreground-muted)",
                        }}
                    >
                        {w}회차{w === currentWeek ? " ← 지금!" : ""}
                    </span>
                ))}
            </div>

            <button
                onClick={onUpload}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: tutorial.color }}
            >
                <Play size={16} />
                따라했으면 셀스타그램에 올려보세요!
            </button>
        </div>
    );
}

/* ── 빈 상태 ── */
function EmptyDetail() {
    return (
        <div
            className="flex flex-col items-center justify-center h-full gap-4 py-20"
            style={{ color: "var(--foreground-muted)" }}
        >
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--surface-2)" }}
            >
                <BookOpen size={28} style={{ color: "var(--foreground-muted)" }} />
            </div>
            <div className="text-center">
                <p className="font-bold text-base" style={{ color: "var(--foreground-soft)" }}>
                    항목을 선택하세요
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
                    왼쪽 목록에서 학습할 내용을 클릭하면
                    <br />
                    여기서 전체 내용을 확인할 수 있어요
                </p>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   메인 페이지
══════════════════════════════════════════════ */
type OuterTab = "session" | "learn" | "missions";

export default function LearnPage() {
    const { week: currentWeek, setUploadModalOpen } = useGameStore();
    const [outerTab, setOuterTab] = useState<OuterTab>("session");
    const [activeTab, setActiveTab] = useState<Tab>("today");
    const [selected, setSelected] = useState<SelectedItem>(null);
    const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | "전체">("전체");
    const [mobileDetail, setMobileDetail] = useState(false);

    const relatedConcepts = CONCEPT_CARDS.filter((c) => c.relatedWeeks.includes(currentWeek));
    const relatedTutorials = TUTORIALS.filter((t) => t.relatedWeeks.includes(currentWeek));

    const conceptList =
        activeTab === "today"
            ? relatedConcepts
            : CONCEPT_CARDS.filter((c) => filterDifficulty === "전체" || c.difficulty === filterDifficulty);

    const tutorialList =
        activeTab === "today"
            ? relatedTutorials
            : TUTORIALS.filter((t) => filterDifficulty === "전체" || t.difficulty === filterDifficulty);

    const selectItem = (item: SelectedItem) => {
        setSelected(item);
        setMobileDetail(true);
    };

    const switchTab = (tab: Tab) => {
        setActiveTab(tab);
        setSelected(null);
        setMobileDetail(false);
    };

    const tabs: { id: Tab; label: string; emoji: string }[] = [
        { id: "today", label: "오늘 수업", emoji: "⭐" },
        { id: "concept", label: "마케팅 개념", emoji: "📚" },
        { id: "ai", label: "AI 도구", emoji: "🤖" },
        { id: "tutorial", label: "단계별 실습", emoji: "🎯" },
    ];

    /* ─ 왼쪽 패널 목록 렌더 ─ */
    const renderList = () => {
        if (activeTab === "today") {
            const hasRelated = relatedConcepts.length > 0 || relatedTutorials.length > 0;
            return (
                <>
                    {!hasRelated && (
                        <div className="flex flex-col items-center gap-3 py-10 text-center px-4">
                            <Star size={28} style={{ color: "var(--highlight)" }} />
                            <p className="text-sm font-bold" style={{ color: "var(--foreground-soft)" }}>
                                {currentWeek}회차 관련 자료 준비 중
                            </p>
                            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                다른 탭에서 전체 자료를 확인하세요
                            </p>
                        </div>
                    )}
                    {relatedConcepts.length > 0 && (
                        <div>
                            <SectionLabel label="📚 마케팅 개념" />
                            {relatedConcepts.map((card) => (
                                <ListItem
                                    key={card.id}
                                    emoji={card.emoji}
                                    title={card.title}
                                    subtitle={card.summary}
                                    difficulty={card.difficulty}
                                    isRelated
                                    isSelected={selected?.type === "concept" && selected.data.id === card.id}
                                    currentWeek={currentWeek}
                                    onClick={() => selectItem({ type: "concept", data: card })}
                                />
                            ))}
                        </div>
                    )}
                    <div className="mt-2">
                        <SectionLabel label="🤖 AI 도구" />
                        {AI_TOOL_GUIDES.map((tool) => (
                            <ListItem
                                key={tool.id}
                                emoji={tool.emoji}
                                logo={tool.logo}
                                title={tool.name}
                                subtitle={tool.tagline}
                                difficulty={tool.difficulty}
                                isRelated={false}
                                isSelected={selected?.type === "ai" && selected.data.id === tool.id}
                                currentWeek={currentWeek}
                                onClick={() => selectItem({ type: "ai", data: tool })}
                            />
                        ))}
                    </div>
                    {relatedTutorials.length > 0 && (
                        <div className="mt-2">
                            <SectionLabel label="🎯 단계별 실습" />
                            {relatedTutorials.map((tutorial) => (
                                <ListItem
                                    key={tutorial.id}
                                    emoji={tutorial.emoji}
                                    title={tutorial.title}
                                    subtitle={tutorial.desc}
                                    difficulty={tutorial.difficulty}
                                    isRelated
                                    isSelected={selected?.type === "tutorial" && selected.data.id === tutorial.id}
                                    currentWeek={currentWeek}
                                    onClick={() => selectItem({ type: "tutorial", data: tutorial })}
                                />
                            ))}
                        </div>
                    )}
                    {/* 업로드 CTA */}
                    <div
                        className="mt-4 p-4 rounded-2xl"
                        style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                            <Zap size={15} className="text-white" />
                            <p className="font-black text-sm text-white">실습 결과 올리기</p>
                        </div>
                        <p className="text-xs text-white/80 mb-3">배운 내용을 게시물로 만들어 팀 피드에 공유하세요!</p>
                        <button
                            onClick={() => setUploadModalOpen(true, "mission")}
                            className="w-full py-2 bg-white rounded-xl font-bold text-sm transition-all hover:bg-white/90"
                            style={{ color: "var(--primary)" }}
                        >
                            콘텐츠 업로드
                        </button>
                    </div>
                </>
            );
        }

        if (activeTab === "concept") {
            return (
                <>
                    {conceptList.length === 0 ? (
                        <p className="text-sm text-center py-10" style={{ color: "var(--foreground-muted)" }}>
                            해당 난이도 자료가 없어요
                        </p>
                    ) : (
                        conceptList.map((card) => (
                            <ListItem
                                key={card.id}
                                emoji={card.emoji}
                                title={card.title}
                                subtitle={card.summary}
                                difficulty={card.difficulty}
                                isRelated={card.relatedWeeks.includes(currentWeek)}
                                isSelected={selected?.type === "concept" && selected.data.id === card.id}
                                currentWeek={currentWeek}
                                onClick={() => selectItem({ type: "concept", data: card })}
                            />
                        ))
                    )}
                </>
            );
        }

        if (activeTab === "ai") {
            return (
                <>
                    <div
                        className="p-3 rounded-xl flex items-start gap-2 mb-2"
                        style={{ background: "var(--secondary-light)", border: "1px solid rgba(67,97,238,0.2)" }}
                    >
                        <Sparkles size={15} style={{ color: "var(--secondary)" }} className="shrink-0 mt-0.5" />
                        <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>
                            초보자라면 ChatGPT나 Claude부터 시작하세요!
                        </p>
                    </div>
                    {AI_TOOL_GUIDES.map((tool) => (
                        <ListItem
                            key={tool.id}
                            emoji={tool.emoji}
                            logo={tool.logo}
                            title={tool.name}
                            subtitle={tool.tagline}
                            difficulty={tool.difficulty}
                            isRelated={false}
                            isSelected={selected?.type === "ai" && selected.data.id === tool.id}
                            currentWeek={currentWeek}
                            onClick={() => selectItem({ type: "ai", data: tool })}
                        />
                    ))}
                </>
            );
        }

        if (activeTab === "tutorial") {
            return (
                <>
                    {tutorialList.length === 0 ? (
                        <p className="text-sm text-center py-10" style={{ color: "var(--foreground-muted)" }}>
                            해당 난이도 자료가 없어요
                        </p>
                    ) : (
                        tutorialList.map((tutorial) => (
                            <ListItem
                                key={tutorial.id}
                                emoji={tutorial.emoji}
                                title={tutorial.title}
                                subtitle={tutorial.desc}
                                difficulty={tutorial.difficulty}
                                isRelated={tutorial.relatedWeeks.includes(currentWeek)}
                                isSelected={selected?.type === "tutorial" && selected.data.id === tutorial.id}
                                currentWeek={currentWeek}
                                onClick={() => selectItem({ type: "tutorial", data: tutorial })}
                            />
                        ))
                    )}
                    <div
                        className="mt-4 p-4 rounded-2xl flex items-start gap-3"
                        style={{ background: "var(--accent-light)", border: "1.5px solid var(--accent)" }}
                    >
                        <Trophy size={20} style={{ color: "var(--accent)" }} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-black text-sm" style={{ color: "var(--accent)" }}>
                                튜토리얼 후 미션!
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                                배운 내용으로 팀 미션 완료하고 XP 받기
                            </p>
                            <Link
                                href="/missions"
                                className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-lg font-bold text-xs text-white"
                                style={{ background: "var(--accent)" }}
                            >
                                미션 가기 <ChevronRight size={12} />
                            </Link>
                        </div>
                    </div>
                </>
            );
        }

        return null;
    };

    /* ─ 오른쪽 패널 상세 렌더 ─ */
    const renderDetail = () => {
        if (!selected) return <EmptyDetail />;
        if (selected.type === "concept")
            return (
                <ConceptDetail
                    card={selected.data}
                    currentWeek={currentWeek}
                    onTutorial={() => switchTab("tutorial")}
                />
            );
        if (selected.type === "ai") return <AIToolDetail tool={selected.data} />;
        if (selected.type === "tutorial")
            return (
                <TutorialDetail
                    tutorial={selected.data}
                    currentWeek={currentWeek}
                    onUpload={() => setUploadModalOpen(true, "mission")}
                />
            );
        return null;
    };

    const outerTabs: { id: OuterTab; label: string; icon: React.ReactNode; emoji: string; color: string; solidBg: string }[] = [
        { id: "session",  label: "오늘의 수업", icon: <GraduationCap size={17} />, emoji: "📚", color: "#4361EE", solidBg: "#4361EE" },
        { id: "learn",    label: "학습 자료",   icon: <BookOpen size={17} />,      emoji: "📖", color: "#06D6A0", solidBg: "#06D6A0" },
        { id: "missions", label: "미션 센터",   icon: <Target size={17} />,        emoji: "🏆", color: "#D97706", solidBg: "#D97706" },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* ── 최상위 탭 네비 ── */}
            <div className="sticky top-0 z-20 px-4 py-4 overflow-x-auto"
                style={{ background: "var(--background)", borderBottom: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="flex items-center gap-2">
                    {outerTabs.map(t => {
                        const active = outerTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setOuterTab(t.id)}
                                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-black whitespace-nowrap transition-all active:scale-95"
                                style={{
                                    background: active ? t.solidBg : "var(--surface-2)",
                                    color: active ? "white" : "var(--foreground-soft)",
                                    boxShadow: active ? `0 4px 14px ${t.solidBg}44` : "none",
                                    transform: active ? "scale(1.03)" : "scale(1)",
                                }}
                            >
                                <span style={{ opacity: active ? 1 : 0.6 }}>{t.icon}</span>
                                {t.label}
                                {active && <span className="w-1.5 h-1.5 rounded-full bg-white/70 ml-0.5" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 오늘의 수업 탭 */}
            {outerTab === "session" && <SessionContent />}

            {/* 미션 센터 탭 */}
            {outerTab === "missions" && (
                <div className="flex flex-col gap-8 p-4 pt-6 max-w-4xl mx-auto pb-32 w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--highlight-light)" }}>
                            <Trophy size={20} style={{ color: "#D97706" }} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black italic">미션 센터</h2>
                            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>주간 미션을 완료하고 포인트를 획득하세요</p>
                        </div>
                    </div>
                    <MissionList />
                </div>
            )}

            {/* 학습 자료 탭 */}
            {outerTab === "learn" && <div className="flex flex-col">
            {/* ── 헤더 + 탭 ── */}
            <div className="px-4 pt-5 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--accent-light)" }}
                    >
                        <BookOpen size={20} style={{ color: "var(--accent)" }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black font-outfit" style={{ color: "var(--foreground)" }}>
                            학습 자료 허브
                        </h1>
                        <p className="text-xs font-medium" style={{ color: "var(--foreground-soft)" }}>
                            {currentWeek}회차 수업 · 개념 → AI 도구 → 실습 순서로 배워요
                        </p>
                    </div>
                </div>

                {/* 탭 */}
                <div
                    className="flex gap-1 p-1 rounded-xl overflow-x-auto"
                    style={{ background: "var(--surface-2)" }}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => switchTab(tab.id)}
                            className="flex-1 min-w-fit flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all whitespace-nowrap"
                            style={{
                                background: activeTab === tab.id ? "var(--surface)" : "transparent",
                                color: activeTab === tab.id ? "var(--foreground)" : "var(--foreground-muted)",
                                boxShadow: activeTab === tab.id ? "var(--shadow-sm)" : "none",
                            }}
                        >
                            <span>{tab.emoji}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* 난이도 필터 (개념/튜토리얼 탭만) */}
                {(activeTab === "concept" || activeTab === "tutorial") && (
                    <div className="flex gap-2 mt-3">
                        {(["전체", "초급", "중급", "고급"] as const).map((level) => {
                            const diffStyle = level !== "전체" ? DIFFICULTY_STYLE[level] : null;
                            const isActive = filterDifficulty === level;
                            return (
                                <button
                                    key={level}
                                    onClick={() => setFilterDifficulty(level)}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                                    style={{
                                        background: isActive
                                            ? (diffStyle?.bg ?? "var(--foreground)")
                                            : "var(--surface-2)",
                                        color: isActive
                                            ? (diffStyle?.color ?? "var(--surface)")
                                            : "var(--foreground-muted)",
                                        border:
                                            isActive && diffStyle
                                                ? `1.5px solid ${diffStyle.color}55`
                                                : "1.5px solid transparent",
                                    }}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── 2패널 레이아웃 ── */}
            <div className="flex items-start">
                {/* 모바일: 상세 보기 (목록 대신 표시) */}
                {mobileDetail && selected && (
                    <div className="md:hidden flex flex-col w-full px-4 pb-24">
                        <button
                            onClick={() => setMobileDetail(false)}
                            className="flex items-center gap-2 text-sm font-bold py-4"
                            style={{ color: "var(--secondary)" }}
                        >
                            <ArrowLeft size={16} />
                            목록으로
                        </button>
                        <div className="pb-6">{renderDetail()}</div>
                    </div>
                )}

                {/* 왼쪽: 목록 패널 */}
                <div
                    className={`${mobileDetail ? "hidden" : "block"} md:block w-full md:w-72 lg:w-80 flex-shrink-0 border-r px-3 py-2 pb-24 md:pb-10`}
                    style={{ borderColor: "var(--border)" }}
                >
                    {renderList()}
                </div>

                {/* 오른쪽: 상세 패널 (데스크탑, sticky) */}
                <div
                    className="hidden md:block flex-1 px-6 py-4 pb-10"
                    style={{ position: "sticky", top: 0, maxHeight: "100dvh", overflowY: "auto" }}
                >
                    {renderDetail()}
                </div>
            </div>
        </div>}
        </div>
    );
}
