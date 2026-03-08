"use client";

import React, { useState } from "react";
import {
    X, Sparkles, ChevronRight, ChevronLeft, Loader2,
    RefreshCw, Check, Lightbulb, Target, Zap, MessageSquare,
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

interface AIContentStudioProps {
    onApply: (caption: string, tags: string) => void;
    onClose: () => void;
}

export default function AIContentStudio({ onApply, onClose }: AIContentStudioProps) {
    const { addSkillXP } = useGameStore();

    // Step 상태
    const [step, setStep] = useState(1); // 1:설정 2:초안 3:개선 4:완성

    // Step 1 - 설정
    const [productName, setProductName] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
    const [selectedTone, setSelectedTone] = useState<string | null>(null);

    // Step 2 - AI 초안
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
    const [promptSummary, setPromptSummary] = useState("");

    // Step 3 - 개선
    const [feedback, setFeedback] = useState("");
    const [refinedCaption, setRefinedCaption] = useState("");
    const [refinedHashtags, setRefinedHashtags] = useState<string[]>([]);
    const [changeLog, setChangeLog] = useState("");
    const [promptHint, setPromptHint] = useState("");
    const [isRefining, setIsRefining] = useState(false);

    // 복사 상태
    const [copied, setCopied] = useState(false);

    const strategy = MARKETING_STRATEGIES.find(s => s.id === selectedStrategy);
    const tone = TONES.find(t => t.id === selectedTone);
    const selectedDraft = drafts.find(d => d.id === selectedDraftId);

    const canProceedStep1 = productName.trim() && selectedStrategy && selectedTone;

    // ── Step 1 → Step 2: 초안 생성 ──────────────────────────────────
    const handleGenerate = async () => {
        if (!canProceedStep1 || !strategy || !tone) return;
        setIsGenerating(true);
        setStep(2);
        setDrafts([]);

        try {
            const res = await fetch("/api/ai/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productName,
                    targetAudience: targetAudience || "10~20대",
                    strategy,
                    tone: tone.label,
                }),
            });
            const data = await res.json();
            setDrafts(data.drafts ?? []);
            setPromptSummary(data.promptSummary ?? "");
            addSkillXP("copywriting", 10);
        } catch {
            setDrafts([]);
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Step 3: 피드백 개선 ──────────────────────────────────────────
    const handleRefine = async () => {
        if (!selectedDraft || !feedback.trim() || !strategy) return;
        setIsRefining(true);

        try {
            const res = await fetch("/api/ai/refine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentCaption: selectedDraft.caption,
                    feedback,
                    productName,
                    strategy,
                    tone: tone?.label ?? "친근한",
                }),
            });
            const data = await res.json();
            setRefinedCaption(data.caption ?? "");
            setRefinedHashtags(data.hashtags ?? []);
            setChangeLog(data.changeLog ?? "");
            setPromptHint(data.promptHint ?? "");
            addSkillXP("copywriting", 15);
            setStep(4);
        } catch {
            setRefinedCaption("");
        } finally {
            setIsRefining(false);
        }
    };

    // ── 완성된 캡션 적용 ─────────────────────────────────────────────
    const handleApply = () => {
        const finalCaption = refinedCaption || selectedDraft?.caption || "";
        const finalTags = (refinedHashtags.length > 0 ? refinedHashtags : selectedDraft?.hashtags ?? []).join(", ");
        addSkillXP("analytics", 10);
        onApply(finalCaption, finalTags);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // ── 단계 표시 ────────────────────────────────────────────────────
    const steps = ["전략 설정", "AI 초안", "피드백 개선", "완성"];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-xl p-0 overflow-hidden border-foreground/10 shadow-2xl flex flex-col max-h-[92vh]">

                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/5 flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(67,97,238,0.06))" }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg,#FF6B35,#4361EE)" }}>
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-black italic tracking-tight">AI 콘텐츠 스튜디오</h3>
                            <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">AI와 함께 마케팅 캡션 만들기</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
                        <X size={18} className="text-foreground/40" />
                    </button>
                </div>

                {/* 스텝 인디케이터 */}
                <div className="flex items-center px-6 py-3 gap-1 flex-shrink-0 border-b border-foreground/5">
                    {steps.map((s, i) => {
                        const num = i + 1;
                        const active = step === num;
                        const done = step > num;
                        return (
                            <React.Fragment key={s}>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                                        done ? "bg-accent text-white" : active ? "bg-primary text-white" : "bg-foreground/10 text-foreground/30"
                                    }`}>
                                        {done ? <Check size={10} /> : num}
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest hidden sm:block ${active ? "text-primary" : done ? "text-accent" : "text-foreground/30"}`}>
                                        {s}
                                    </span>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 rounded-full mx-1 transition-all ${done ? "bg-accent" : "bg-foreground/10"}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* 바디 */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">

                    {/* ── STEP 1: 전략 설정 ── */}
                    {step === 1 && (
                        <div className="p-6 flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                                    제품 / 서비스 이름 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    value={productName}
                                    onChange={e => setProductName(e.target.value)}
                                    placeholder="예: 오트밀 프로틴 쉐이크, 핸드메이드 캔들..."
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                                    타겟 고객 <span className="text-foreground/20 text-[9px]">(선택)</span>
                                </label>
                                <input
                                    value={targetAudience}
                                    onChange={e => setTargetAudience(e.target.value)}
                                    placeholder="예: 다이어트 중인 20대, 홈카페 좋아하는 직장인..."
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                                    마케팅 전략 선택 <span className="text-red-400">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {MARKETING_STRATEGIES.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setSelectedStrategy(s.id)}
                                            className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                                                selectedStrategy === s.id
                                                    ? "border-primary/40 shadow-md"
                                                    : "border-foreground/10 hover:border-foreground/20"
                                            }`}
                                            style={selectedStrategy === s.id ? { background: `${s.color}12` } : { background: "var(--surface)" }}
                                        >
                                            <span className="text-xl shrink-0">{s.emoji}</span>
                                            <div>
                                                <p className="text-xs font-black">{s.theme}</p>
                                                <p className="text-[9px] text-foreground/40 leading-tight mt-0.5">{s.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {strategy && (
                                <div className="flex items-start gap-2.5 p-3 rounded-2xl border border-foreground/10" style={{ background: "var(--surface-2)" }}>
                                    <Lightbulb size={14} className="text-primary shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-foreground/60 leading-relaxed">{strategy.tip}</p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                                    톤앤매너 <span className="text-red-400">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {TONES.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTone(t.id)}
                                            className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${
                                                selectedTone === t.id
                                                    ? "border-secondary/40 bg-secondary/8 shadow-md"
                                                    : "border-foreground/10 hover:border-foreground/20"
                                            }`}
                                            style={selectedTone === t.id ? { background: "rgba(67,97,238,0.08)" } : { background: "var(--surface)" }}
                                        >
                                            <span className="text-lg">{t.emoji}</span>
                                            <div className="text-left">
                                                <p className="text-xs font-black">{t.label}</p>
                                                <p className="text-[9px] text-foreground/40">{t.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: AI 초안 ── */}
                    {step === 2 && (
                        <div className="p-6 flex flex-col gap-4">
                            {/* 프롬프트 요약 */}
                            {promptSummary && (
                                <div className="flex items-start gap-2.5 p-3 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                                    <Target size={14} className="text-secondary shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-foreground/60 leading-relaxed">{promptSummary}</p>
                                </div>
                            )}

                            {isGenerating ? (
                                <div className="flex flex-col items-center gap-4 py-12">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                            style={{ background: "linear-gradient(135deg,#FF6B35,#4361EE)" }}>
                                            <Sparkles size={28} className="text-white animate-pulse" />
                                        </div>
                                        <Loader2 size={48} className="animate-spin text-primary/20 absolute -inset-4" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black italic">AI가 3가지 전략 초안을 생성 중...</p>
                                        <p className="text-[11px] text-foreground/40 mt-1">{strategy?.theme} 전략으로 {tone?.label} 톤 적용 중</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">3가지 초안 중 하나를 선택하세요</p>
                                    <div className="flex flex-col gap-3">
                                        {drafts.map(draft => (
                                            <button
                                                key={draft.id}
                                                onClick={() => setSelectedDraftId(draft.id)}
                                                className={`flex flex-col gap-2.5 p-4 rounded-2xl border text-left transition-all ${
                                                    selectedDraftId === draft.id
                                                        ? "border-primary/40 shadow-lg"
                                                        : "border-foreground/10 hover:border-foreground/20"
                                                }`}
                                                style={selectedDraftId === draft.id ? { background: "rgba(255,107,53,0.06)" } : { background: "var(--surface)" }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{draft.label}</span>
                                                    {selectedDraftId === draft.id && (
                                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                            <Check size={10} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium leading-relaxed">{draft.caption}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {draft.hashtags.map(tag => (
                                                        <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                                            style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex items-start gap-1.5 pt-1 border-t border-foreground/5">
                                                    <Zap size={10} className="text-secondary shrink-0 mt-0.5" />
                                                    <p className="text-[9px] text-foreground/50 leading-relaxed">{draft.strategyPoint}</p>
                                                </div>
                                                {selectedDraftId === draft.id && (
                                                    <div className="flex items-start gap-1.5 p-2.5 rounded-xl"
                                                        style={{ background: "rgba(255,107,53,0.08)" }}>
                                                        <Lightbulb size={10} className="text-primary shrink-0 mt-0.5" />
                                                        <p className="text-[9px] text-foreground/60 leading-relaxed">{draft.marketingTip}</p>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => { setSelectedDraftId(null); handleGenerate(); }}
                                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-foreground/10 text-xs font-bold text-foreground/50 hover:text-foreground/70 transition-all hover:border-foreground/20"
                                    >
                                        <RefreshCw size={12} /> 다시 생성하기
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3: 피드백 개선 ── */}
                    {step === 3 && selectedDraft && (
                        <div className="p-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-2 p-4 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">선택한 초안</p>
                                <p className="text-sm font-medium leading-relaxed">{selectedDraft.caption}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedDraft.hashtags.map(tag => (
                                        <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
                                    <MessageSquare size={10} />
                                    AI에게 개선 요청하기
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    placeholder="예: 더 짧게 만들어줘 / 이모지 더 추가해줘 / 10대 친구들이 좋아할 말투로 / 가격을 강조해줘..."
                                    rows={3}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                />
                                <p className="text-[10px] text-foreground/30 ml-1">AI에게 원하는 방향을 자연스럽게 말해보세요!</p>
                            </div>

                            {/* 피드백 예시 버튼들 */}
                            <div className="flex flex-wrap gap-1.5">
                                {["더 짧게!", "이모지 추가", "더 유머러스하게", "가격 강조", "Z세대 언어로", "감성적으로"].map(ex => (
                                    <button
                                        key={ex}
                                        onClick={() => setFeedback(ex)}
                                        className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-foreground/10 hover:border-primary/30 hover:text-primary transition-all"
                                        style={{ background: "var(--surface)" }}
                                    >
                                        {ex}
                                    </button>
                                ))}
                            </div>

                            {isRefining && (
                                <div className="flex items-center gap-2 py-2">
                                    <Loader2 size={14} className="animate-spin text-primary" />
                                    <span className="text-xs font-bold text-primary italic">피드백 반영 중...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 4: 완성 ── */}
                    {step === 4 && (
                        <div className="p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-2.5 p-3 rounded-2xl"
                                style={{ background: "rgba(6,214,160,0.08)", border: "1px solid rgba(6,214,160,0.2)" }}>
                                <Check size={16} className="text-accent shrink-0" />
                                <p className="text-xs font-black text-accent">캡션 개선 완료! 업로드 모달에 바로 적용해요.</p>
                            </div>

                            {/* 변경 로그 */}
                            {changeLog && (
                                <div className="flex items-start gap-2 p-3 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                                    <RefreshCw size={12} className="text-secondary shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-foreground/60 leading-relaxed">{changeLog}</p>
                                </div>
                            )}

                            {/* 완성된 캡션 */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">완성된 캡션</p>
                                    <button
                                        onClick={() => handleCopy(refinedCaption)}
                                        className="flex items-center gap-1 text-[9px] font-bold text-foreground/40 hover:text-primary transition-colors"
                                    >
                                        {copied ? <CheckCheck size={10} className="text-accent" /> : <Copy size={10} />}
                                        {copied ? "복사됨!" : "복사"}
                                    </button>
                                </div>
                                <div className="p-4 rounded-2xl border border-primary/20" style={{ background: "rgba(255,107,53,0.04)" }}>
                                    <p className="text-sm font-medium leading-relaxed">{refinedCaption}</p>
                                </div>
                            </div>

                            {/* 해시태그 */}
                            {refinedHashtags.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">해시태그</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {refinedHashtags.map(tag => (
                                            <span key={tag} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                                style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 프롬프트 힌트 */}
                            {promptHint && (
                                <div className="flex items-start gap-2 p-3 rounded-2xl"
                                    style={{ background: "rgba(67,97,238,0.08)", border: "1px solid rgba(67,97,238,0.15)" }}>
                                    <Lightbulb size={12} className="text-secondary shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-foreground/60 leading-relaxed">{promptHint}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 푸터 - 네비게이션 버튼 */}
                <div className="p-4 border-t border-foreground/5 flex items-center gap-2 flex-shrink-0 bg-background/80 backdrop-blur-md">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-foreground/10 text-xs font-bold text-foreground/50 hover:text-foreground/70 transition-all"
                        >
                            <ChevronLeft size={14} /> 이전
                        </button>
                    )}

                    {step === 1 && (
                        <button
                            onClick={handleGenerate}
                            disabled={!canProceedStep1}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-30 hover:opacity-90 active:scale-[0.98]"
                            style={{ background: "linear-gradient(135deg,#FF6B35,#4361EE)" }}
                        >
                            <Sparkles size={16} /> AI 초안 생성하기 <ChevronRight size={16} />
                        </button>
                    )}

                    {step === 2 && (
                        <button
                            onClick={() => setStep(3)}
                            disabled={!selectedDraftId || isGenerating}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-30 hover:opacity-90"
                            style={{ background: selectedDraftId ? "var(--foreground)" : "var(--foreground)" }}
                        >
                            이 초안으로 개선하기 <ArrowRight size={16} />
                        </button>
                    )}

                    {step === 3 && (
                        <>
                            <button
                                onClick={() => {
                                    // 개선 없이 바로 선택한 초안 적용
                                    const finalCaption = selectedDraft?.caption ?? "";
                                    const finalTags = (selectedDraft?.hashtags ?? []).join(", ");
                                    addSkillXP("analytics", 5);
                                    onApply(finalCaption, finalTags);
                                }}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-foreground/10 text-foreground/50 hover:text-foreground/70 transition-all"
                            >
                                그냥 사용
                            </button>
                            <button
                                onClick={handleRefine}
                                disabled={!feedback.trim() || isRefining}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-30 hover:opacity-90"
                                style={{ background: "linear-gradient(135deg,#FF6B35,#FFC233)" }}
                            >
                                {isRefining ? (
                                    <><Loader2 size={14} className="animate-spin" /> 개선 중...</>
                                ) : (
                                    <><Sparkles size={14} /> AI에게 개선 요청 <ArrowRight size={14} /></>
                                )}
                            </button>
                        </>
                    )}

                    {step === 4 && (
                        <button
                            onClick={handleApply}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
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
