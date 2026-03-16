"use client";

import React, { useState } from "react";
import {
    X, Sparkles, ChevronRight, ChevronLeft, Loader2,
    RefreshCw, Check, Lightbulb, Zap, MessageSquare,
    Copy, CheckCheck, ArrowRight,
} from "lucide-react";
import GlassCard from "../common/GlassCard";
import { useGameStore } from "@/store/useGameStore";

// ─── 마케팅 전략 데이터 ──────────────────────────────────────────────
const MARKETING_STRATEGIES = [
    {
        id: "storytelling",
        theme: "스토리텔링",
        strategy: "Storytelling",
        description: "브랜드와 제품에 담긴 이야기로 감성적 연결을 만들어요.",
        tip: "구체적인 상황이나 경험을 묘사하면 공감도가 높아져요.",
        keywords: ["감성", "이야기", "경험", "순간"],
        emoji: "📖",
        color: "#FF6B35",
    },
    {
        id: "social_proof",
        theme: "사회적 증거",
        strategy: "Social Proof",
        description: "다른 사람들의 후기와 인기도를 강조해 신뢰를 높여요.",
        tip: "구체적인 숫자나 '많은 사람들이'라는 표현이 효과적이에요.",
        keywords: ["인기", "리뷰", "추천", "베스트"],
        emoji: "⭐",
        color: "#FFC233",
    },
    {
        id: "urgency",
        theme: "희소성·긴급감",
        strategy: "Urgency",
        description: "한정된 시간이나 수량을 강조해 즉각적 행동을 유도해요.",
        tip: "구체적인 마감 기한이나 수량을 명시하면 더 효과적이에요.",
        keywords: ["한정", "마감", "지금", "놓치지 마세요"],
        emoji: "⚡",
        color: "#EF4444",
    },
    {
        id: "problem_solution",
        theme: "문제-해결",
        strategy: "Problem-Solution",
        description: "고객의 고민을 먼저 공감하고 제품을 해결책으로 제시해요.",
        tip: "고객이 가장 많이 겪는 불편함을 구체적으로 언급하세요.",
        keywords: ["해결", "고민", "효과", "변화"],
        emoji: "🎯",
        color: "#4361EE",
    },
    {
        id: "lifestyle",
        theme: "라이프스타일",
        strategy: "Lifestyle",
        description: "제품을 사용하는 이상적인 라이프스타일을 그려줘요.",
        tip: "타겟 고객이 꿈꾸는 일상의 모습을 생생하게 묘사하세요.",
        keywords: ["라이프", "일상", "스타일", "감성"],
        emoji: "✨",
        color: "#06D6A0",
    },
    {
        id: "education",
        theme: "교육·정보 제공",
        strategy: "Education",
        description: "제품의 사용법이나 유익한 정보를 공유해 전문성을 높여요.",
        tip: "3가지 팁, 5단계 가이드 등 명확한 구조가 공유율을 높여요.",
        keywords: ["팁", "방법", "가이드", "알아두세요"],
        emoji: "📚",
        color: "#8B5CF6",
    },
];

const TONES = [
    { id: "friendly", label: "친근한", emoji: "😊", desc: "편안하고 따뜻한 말투" },
    { id: "trendy", label: "트렌디한", emoji: "🔥", desc: "Z세대 신조어 활용" },
    { id: "professional", label: "전문적인", emoji: "💼", desc: "신뢰감 있는 정보 전달" },
    { id: "humorous", label: "유머러스한", emoji: "😄", desc: "재치 있고 가벼운 접근" },
];

interface Draft {
    id: string;
    label: string;
    caption: string;
    strategyPoint: string;
    hashtags: string[];
    marketingTip: string;
}

interface PrefilledProduct {
    name: string;
    price: number;
    category: string;
    description?: string | null;
}

interface AIContentStudioProps {
    onApply: (caption: string, tags: string) => void;
    onClose: () => void;
    prefilledProduct?: PrefilledProduct | null;
}

export default function AIContentStudio({ onApply, onClose, prefilledProduct }: AIContentStudioProps) {
    const { addSkillXP } = useGameStore();

    const [step, setStep] = useState(1);

    // Step 1
    const [productName, setProductName] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
    const [selectedTone, setSelectedTone] = useState<string | null>(null);

    // Step 2
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
    const [promptSummary, setPromptSummary] = useState("");
    const [aiError, setAiError] = useState<string | null>(null);

    // Step 3
    const [feedback, setFeedback] = useState("");
    const [refinedCaption, setRefinedCaption] = useState("");
    const [refinedHashtags, setRefinedHashtags] = useState<string[]>([]);
    const [changeLog, setChangeLog] = useState("");
    const [promptHint, setPromptHint] = useState("");
    const [isRefining, setIsRefining] = useState(false);

    const [copied, setCopied] = useState(false);

    // 구매한 상품 정보 자동 입력
    React.useEffect(() => {
        if (!prefilledProduct) return;
        setProductName(prefilledProduct.name);
    }, [prefilledProduct]);

    const strategy = MARKETING_STRATEGIES.find(s => s.id === selectedStrategy);
    const tone = TONES.find(t => t.id === selectedTone);
    const selectedDraft = drafts.find(d => d.id === selectedDraftId);
    const canProceedStep1 = productName.trim() && selectedStrategy && selectedTone;

    const handleGenerate = async () => {
        if (!canProceedStep1 || !strategy || !tone) return;
        setIsGenerating(true);
        setAiError(null);
        setStep(2);
        setDrafts([]);
        try {
            const res = await fetch("/api/ai/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productName, targetAudience: targetAudience || "10~20대", strategy, tone: tone.label }),
            });
            const data = await res.json();
            if (!res.ok) {
                setAiError(data.error ?? "AI 초안 생성에 실패했어요.");
                return;
            }
            setDrafts(data.drafts ?? []);
            setPromptSummary(data.promptSummary ?? "");
            addSkillXP("copywriting", 10);
        } catch {
            setAiError("네트워크 연결을 확인해주세요. 🌐");
        } finally { setIsGenerating(false); }
    };

    const handleRefine = async () => {
        if (!selectedDraft || !feedback.trim() || !strategy) return;
        setIsRefining(true);
        setAiError(null);
        try {
            const res = await fetch("/api/ai/refine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentCaption: selectedDraft.caption, feedback, productName, strategy, tone: tone?.label ?? "친근한" }),
            });
            const data = await res.json();
            if (!res.ok) {
                setAiError(data.error ?? "AI 개선에 실패했어요.");
                return;
            }
            setRefinedCaption(data.caption ?? "");
            setRefinedHashtags(data.hashtags ?? []);
            setChangeLog(data.changeLog ?? "");
            setPromptHint(data.promptHint ?? "");
            addSkillXP("copywriting", 15);
            setStep(4);
        } catch {
            setAiError("네트워크 연결을 확인해주세요. 🌐");
        } finally { setIsRefining(false); }
    };

    const handleApply = () => {
        const finalCaption = refinedCaption || selectedDraft?.caption || "";
        const finalTags = (refinedHashtags.length > 0 ? refinedHashtags : selectedDraft?.hashtags ?? []).join(", ");
        addSkillXP("analytics", 10);
        onApply(finalCaption, finalTags);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    };

    const STEP_META = [
        { num: 1, label: "전략 설정" },
        { num: 2, label: "AI 초안" },
        { num: 3, label: "피드백" },
        { num: 4, label: "완성" },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-lg p-0 overflow-hidden border-foreground/10 shadow-2xl flex flex-col max-h-[92vh]">

                {/* ── 헤더 ── */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-foreground/8 flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(67,97,238,0.06))" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ background: "linear-gradient(135deg,#FF6B35,#4361EE)" }}>
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight leading-tight">AI 콘텐츠 스튜디오</h3>
                            <p className="text-xs text-foreground/50 mt-0.5">AI와 함께 마케팅 캡션 만들기</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-foreground/8 rounded-full transition-colors">
                        <X size={20} className="text-foreground/40" />
                    </button>
                </div>

                {/* ── 스텝 인디케이터 ── */}
                <div className="flex items-center px-6 py-4 gap-1 flex-shrink-0 border-b border-foreground/5">
                    {STEP_META.map((s, i) => {
                        const active = step === s.num;
                        const done = step > s.num;
                        return (
                            <React.Fragment key={s.num}>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                        done ? "bg-accent text-white" : active ? "bg-primary text-white" : "bg-foreground/10 text-foreground/30"
                                    }`}>
                                        {done ? <Check size={12} /> : s.num}
                                    </div>
                                    <span className={`text-xs font-bold ${active ? "text-primary" : done ? "text-accent" : "text-foreground/30"}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEP_META.length - 1 && (
                                    <div className={`flex-1 h-0.5 rounded-full mx-1 transition-all ${done ? "bg-accent/60" : "bg-foreground/10"}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* ── 바디 ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">

                    {/* ── STEP 1: 전략 설정 ── */}
                    {step === 1 && (
                        <div className="p-6 flex flex-col gap-6">
                            {/* 안내 문구 */}
                            <div>
                                <h4 className="text-base font-black leading-snug">어떤 제품을 홍보할 건가요?</h4>
                                <p className="text-sm text-foreground/50 mt-1">제품 정보와 마케팅 전략을 선택하면 AI가 캡션 초안을 만들어줘요.</p>
                            </div>

                            {/* 구매한 상품 자동 입력 배지 */}
                            {prefilledProduct && (
                                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                                    style={{ background: "rgba(6,214,160,0.08)", border: "1.5px solid rgba(6,214,160,0.3)" }}>
                                    <span className="text-lg">🛍️</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold" style={{ color: "var(--accent)" }}>구매한 상품 자동 입력됨</p>
                                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                                            {prefilledProduct.name}
                                        </p>
                                    </div>
                                    <span className="text-[12px] font-black" style={{ color: "#D97706" }}>
                                        ₩{prefilledProduct.price.toLocaleString()}
                                    </span>
                                </div>
                            )}

                            {/* 제품명 */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-foreground/70">
                                    제품 / 서비스 이름 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    value={productName}
                                    onChange={e => setProductName(e.target.value)}
                                    placeholder="예: 오트밀 프로틴 쉐이크, 핸드메이드 캔들..."
                                    className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    style={{
                                        background: prefilledProduct ? "rgba(6,214,160,0.06)" : "var(--foreground-5, rgba(0,0,0,0.05))",
                                        border: prefilledProduct ? "1.5px solid rgba(6,214,160,0.4)" : "1px solid var(--border)",
                                    }}
                                />
                            </div>

                            {/* 타겟 고객 */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-foreground/70">
                                    타겟 고객
                                    <span className="text-xs font-normal text-foreground/40 ml-1.5">(선택 사항)</span>
                                </label>
                                <input
                                    value={targetAudience}
                                    onChange={e => setTargetAudience(e.target.value)}
                                    placeholder="예: 다이어트 중인 20대, 홈카페 좋아하는 직장인..."
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>

                            {/* 마케팅 전략 */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-bold text-foreground/70">
                                    마케팅 전략 <span className="text-red-400">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {MARKETING_STRATEGIES.map(s => {
                                        const isSelected = selectedStrategy === s.id;
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedStrategy(s.id)}
                                                className="flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all"
                                                style={{
                                                    border: isSelected ? `1.5px solid ${s.color}60` : "1.5px solid transparent",
                                                    background: isSelected ? `${s.color}10` : "var(--surface)",
                                                    outline: isSelected ? `none` : "1px solid var(--border)",
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-2xl">{s.emoji}</span>
                                                    {isSelected && (
                                                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                                            style={{ background: s.color }}>
                                                            <Check size={11} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold leading-snug">{s.theme}</p>
                                                    {/* 설명은 선택 시에만 표시 */}
                                                    {isSelected && (
                                                        <p className="text-xs text-foreground/55 leading-relaxed mt-1.5 animate-in slide-in-from-top-1 duration-200">
                                                            {s.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* 선택된 전략 팁 */}
                                {strategy && (
                                    <div className="flex items-start gap-2.5 p-3.5 rounded-2xl animate-in slide-in-from-top-2 duration-200"
                                        style={{ background: "var(--surface-2)" }}>
                                        <Lightbulb size={15} className="text-primary shrink-0 mt-0.5" />
                                        <p className="text-sm text-foreground/65 leading-relaxed">{strategy.tip}</p>
                                    </div>
                                )}
                            </div>

                            {/* 톤앤매너 */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-bold text-foreground/70">
                                    톤앤매너 <span className="text-red-400">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {TONES.map(t => {
                                        const isSelected = selectedTone === t.id;
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => setSelectedTone(t.id)}
                                                className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                                                style={{
                                                    border: isSelected ? "1.5px solid rgba(67,97,238,0.5)" : "1.5px solid transparent",
                                                    background: isSelected ? "rgba(67,97,238,0.08)" : "var(--surface)",
                                                    outline: isSelected ? "none" : "1px solid var(--border)",
                                                }}
                                            >
                                                <span className="text-2xl shrink-0">{t.emoji}</span>
                                                <div>
                                                    <p className="text-sm font-bold">{t.label}</p>
                                                    <p className="text-xs text-foreground/45 mt-0.5">{t.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: AI 초안 ── */}
                    {step === 2 && (
                        <div className="p-6 flex flex-col gap-5">
                            {/* AI 에러 배너 */}
                            {aiError && !isGenerating && (
                                <div className="flex items-start gap-3 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-200"
                                    style={{ background: "rgba(239,68,68,0.07)", border: "1.5px solid rgba(239,68,68,0.25)" }}>
                                    <span className="text-lg shrink-0">⚠️</span>
                                    <div>
                                        <p className="text-sm font-bold text-red-500">AI를 사용할 수 없어요</p>
                                        <p className="text-sm text-foreground/60 mt-0.5 leading-relaxed">{aiError}</p>
                                    </div>
                                </div>
                            )}
                            {isGenerating ? (
                                <div className="flex flex-col items-center gap-5 py-16">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                                            style={{ background: "linear-gradient(135deg,#FF6B35,#4361EE)" }}>
                                            <Sparkles size={32} className="text-white animate-pulse" />
                                        </div>
                                        <Loader2 size={56} className="animate-spin text-primary/20 absolute -inset-4" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-base font-black">AI가 초안 3개를 만드는 중...</p>
                                        <p className="text-sm text-foreground/45 mt-1.5">{strategy?.theme} 전략 · {tone?.label} 톤 적용 중</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* 안내 */}
                                    <div>
                                        <h4 className="text-base font-black">마음에 드는 초안을 골라보세요</h4>
                                        {promptSummary && (
                                            <p className="text-sm text-foreground/50 mt-1 leading-relaxed">{promptSummary}</p>
                                        )}
                                    </div>

                                    {/* 초안 카드 */}
                                    <div className="flex flex-col gap-3">
                                        {drafts.map(draft => {
                                            const isSelected = selectedDraftId === draft.id;
                                            return (
                                                <button
                                                    key={draft.id}
                                                    onClick={() => setSelectedDraftId(draft.id)}
                                                    className="flex flex-col gap-3 p-5 rounded-2xl border text-left transition-all"
                                                    style={{
                                                        border: isSelected ? "1.5px solid rgba(255,107,53,0.5)" : "1.5px solid transparent",
                                                        background: isSelected ? "rgba(255,107,53,0.05)" : "var(--surface)",
                                                        outline: isSelected ? "none" : "1px solid var(--border)",
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-black text-primary uppercase tracking-wide">{draft.label}</span>
                                                        {isSelected && (
                                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                                <Check size={11} className="text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* 캡션 */}
                                                    <p className="text-sm font-medium leading-relaxed">{draft.caption}</p>

                                                    {/* 해시태그 */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {draft.hashtags.map(tag => (
                                                            <span key={tag} className="text-xs font-bold px-2.5 py-1 rounded-full"
                                                                style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* 전략 포인트 - 선택 시만 */}
                                                    {isSelected && (
                                                        <div className="flex flex-col gap-2 pt-1 border-t border-foreground/8 animate-in slide-in-from-top-1 duration-200">
                                                            <div className="flex items-start gap-2">
                                                                <Zap size={13} className="text-secondary shrink-0 mt-0.5" />
                                                                <p className="text-xs text-foreground/55 leading-relaxed">{draft.strategyPoint}</p>
                                                            </div>
                                                            <div className="flex items-start gap-2 p-3 rounded-xl"
                                                                style={{ background: "rgba(255,107,53,0.06)" }}>
                                                                <Lightbulb size={13} className="text-primary shrink-0 mt-0.5" />
                                                                <p className="text-xs text-foreground/65 leading-relaxed">{draft.marketingTip}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* 재생성 버튼 */}
                                    <button
                                        onClick={() => { setSelectedDraftId(null); handleGenerate(); }}
                                        className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-foreground/10 text-sm font-bold text-foreground/50 hover:text-foreground/70 transition-all hover:border-foreground/20"
                                    >
                                        <RefreshCw size={14} /> 다시 생성하기
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3: 피드백 개선 ── */}
                    {step === 3 && selectedDraft && (
                        <div className="p-6 flex flex-col gap-5">
                            {/* AI 에러 배너 */}
                            {aiError && (
                                <div className="flex items-start gap-3 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-200"
                                    style={{ background: "rgba(239,68,68,0.07)", border: "1.5px solid rgba(239,68,68,0.25)" }}>
                                    <span className="text-lg shrink-0">⚠️</span>
                                    <div>
                                        <p className="text-sm font-bold text-red-500">AI를 사용할 수 없어요</p>
                                        <p className="text-sm text-foreground/60 mt-0.5 leading-relaxed">{aiError}</p>
                                        <p className="text-xs text-foreground/40 mt-1">&quot;그냥 사용&quot; 버튼으로 선택한 초안을 바로 적용할 수 있어요.</p>
                                    </div>
                                </div>
                            )}
                            {/* 안내 */}
                            <div>
                                <h4 className="text-base font-black">AI에게 개선을 요청하세요</h4>
                                <p className="text-sm text-foreground/50 mt-1">원하는 방향을 자연스럽게 말해주면 AI가 수정해줘요.</p>
                            </div>

                            {/* 선택한 초안 미리보기 */}
                            <div className="flex flex-col gap-2.5 p-4 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                                <p className="text-xs font-bold text-foreground/40">선택한 초안</p>
                                <p className="text-sm font-medium leading-relaxed">{selectedDraft.caption}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedDraft.hashtags.map(tag => (
                                        <span key={tag} className="text-xs font-bold px-2.5 py-1 rounded-full"
                                            style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 피드백 입력 */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-foreground/70 flex items-center gap-1.5">
                                    <MessageSquare size={14} /> 개선 요청 내용
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    placeholder="예: 더 짧게 만들어줘 / 이모지 더 추가해줘 / 10대 친구들이 좋아할 말투로..."
                                    rows={3}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                />
                            </div>

                            {/* 빠른 예시 칩 */}
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-bold text-foreground/40">빠른 선택</p>
                                <div className="flex flex-wrap gap-2">
                                    {["더 짧게!", "이모지 추가", "더 유머러스하게", "가격 강조", "Z세대 언어로", "감성적으로"].map(ex => (
                                        <button
                                            key={ex}
                                            onClick={() => setFeedback(ex)}
                                            className="text-sm font-bold px-3.5 py-2 rounded-xl border border-foreground/10 hover:border-primary/40 hover:text-primary transition-all"
                                            style={{ background: "var(--surface)" }}
                                        >
                                            {ex}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isRefining && (
                                <div className="flex items-center gap-2.5 py-2">
                                    <Loader2 size={16} className="animate-spin text-primary" />
                                    <span className="text-sm font-bold text-primary">피드백 반영 중...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 4: 완성 ── */}
                    {step === 4 && (
                        <div className="p-6 flex flex-col gap-5">
                            {/* 완성 배너 */}
                            <div className="flex items-center gap-3 p-4 rounded-2xl"
                                style={{ background: "rgba(6,214,160,0.08)", border: "1.5px solid rgba(6,214,160,0.25)" }}>
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                                    <Check size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-accent">캡션이 완성됐어요!</p>
                                    <p className="text-xs text-foreground/50 mt-0.5">아래 버튼을 눌러 업로드 화면에 바로 적용하세요.</p>
                                </div>
                            </div>

                            {/* 변경 로그 */}
                            {changeLog && (
                                <div className="flex items-start gap-2.5 p-4 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                                    <RefreshCw size={14} className="text-secondary shrink-0 mt-0.5" />
                                    <p className="text-sm text-foreground/60 leading-relaxed">{changeLog}</p>
                                </div>
                            )}

                            {/* 완성된 캡션 */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-foreground/70">완성된 캡션</p>
                                    <button
                                        onClick={() => handleCopy(refinedCaption)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-foreground/40 hover:text-primary transition-colors"
                                    >
                                        {copied ? <CheckCheck size={12} className="text-accent" /> : <Copy size={12} />}
                                        {copied ? "복사됨!" : "복사"}
                                    </button>
                                </div>
                                <div className="p-4 rounded-2xl" style={{ background: "rgba(255,107,53,0.05)", border: "1.5px solid rgba(255,107,53,0.2)" }}>
                                    <p className="text-sm font-medium leading-relaxed">{refinedCaption}</p>
                                </div>
                            </div>

                            {/* 해시태그 */}
                            {refinedHashtags.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-bold text-foreground/70">해시태그</p>
                                    <div className="flex flex-wrap gap-2">
                                        {refinedHashtags.map(tag => (
                                            <span key={tag} className="text-sm font-bold px-3 py-1.5 rounded-full"
                                                style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 프롬프트 힌트 */}
                            {promptHint && (
                                <div className="flex items-start gap-2.5 p-4 rounded-2xl"
                                    style={{ background: "rgba(67,97,238,0.07)", border: "1px solid rgba(67,97,238,0.15)" }}>
                                    <Lightbulb size={14} className="text-secondary shrink-0 mt-0.5" />
                                    <p className="text-sm text-foreground/60 leading-relaxed">{promptHint}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── 푸터 ── */}
                <div className="px-6 py-4 border-t border-foreground/5 flex items-center gap-2.5 flex-shrink-0 bg-background/80 backdrop-blur-md">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-foreground/10 text-sm font-bold text-foreground/50 hover:text-foreground/70 transition-all shrink-0"
                        >
                            <ChevronLeft size={15} /> 이전
                        </button>
                    )}

                    {step === 1 && (
                        <button
                            onClick={handleGenerate}
                            disabled={!canProceedStep1}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-30 hover:opacity-90 active:scale-[0.98]"
                            style={{ background: "linear-gradient(135deg,#FF6B35,#4361EE)" }}
                        >
                            <Sparkles size={16} /> AI 초안 생성하기 <ChevronRight size={16} />
                        </button>
                    )}

                    {step === 2 && (
                        <button
                            onClick={() => setStep(3)}
                            disabled={!selectedDraftId || isGenerating}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-30 hover:opacity-90"
                            style={{ background: "var(--foreground)" }}
                        >
                            이 초안으로 개선하기 <ArrowRight size={16} />
                        </button>
                    )}

                    {step === 3 && (
                        <>
                            <button
                                onClick={() => {
                                    const finalCaption = selectedDraft?.caption ?? "";
                                    const finalTags = (selectedDraft?.hashtags ?? []).join(", ");
                                    addSkillXP("analytics", 5);
                                    onApply(finalCaption, finalTags);
                                }}
                                className="px-4 py-3 rounded-xl text-sm font-bold border border-foreground/10 text-foreground/50 hover:text-foreground/70 transition-all shrink-0"
                            >
                                그냥 사용
                            </button>
                            <button
                                onClick={handleRefine}
                                disabled={!feedback.trim() || isRefining}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-30 hover:opacity-90"
                                style={{ background: "linear-gradient(135deg,#FF6B35,#FFC233)" }}
                            >
                                {isRefining
                                    ? <><Loader2 size={15} className="animate-spin" /> 개선 중...</>
                                    : <><Sparkles size={15} /> AI에게 개선 요청 <ArrowRight size={15} /></>}
                            </button>
                        </>
                    )}

                    {step === 4 && (
                        <button
                            onClick={handleApply}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
                            style={{ background: "linear-gradient(135deg,#06D6A0,#4361EE)" }}
                        >
                            <Check size={16} /> 업로드 모달에 적용하기
                        </button>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
