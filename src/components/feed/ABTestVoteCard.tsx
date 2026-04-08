"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { FlaskConical, Clock, CheckCircle2, Trophy, X, Share2, Check, Maximize2 } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useABTestStore, ABTest, ABVote, REASON_TAGS, ReasonTag, calcABResult } from "@/store/useABTestStore";

interface Props {
    test: ABTest;
    onVoteCallback?: (vote: ABVote) => void;
}

function timeLeft(endsAt: string): string {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "마감";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) return `${Math.floor(h / 24)}일 남음`;
    if (h > 0) return `${h}시간 ${m}분 남음`;
    return `${m}분 남음`;
}

function ResultBar({ pct, color, label, large }: { pct: number; color: string; label: string; large?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <span className={`font-black ${large ? "text-xs w-5" : "text-[11px] w-4"}`} style={{ color }}>{label}</span>
            <div className={`flex-1 rounded-full overflow-hidden ${large ? "h-3" : "h-2"}`} style={{ background: "var(--surface-3,#e5e5e5)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className={`font-black text-right ${large ? "text-xs w-10" : "text-[11px] w-8"}`} style={{ color }}>{pct}%</span>
        </div>
    );
}

// ── 공유 버튼 + 전체화면 버튼 공통 헤더 ──────────────────────────────
function CardHeader({
    test, isClosed, copied, onShare, onFullscreen, onClose, isFullscreen,
}: {
    test: ABTest; isClosed: boolean; copied: boolean;
    onShare: () => void; onFullscreen?: () => void; onClose?: () => void; isFullscreen?: boolean;
}) {
    const { closeTest } = useABTestStore();
    const { user } = useGameStore();
    const isMyTest = user.handle === test.creatorHandle;

    return (
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: isClosed ? "var(--surface-2)" : "linear-gradient(135deg, #8B5CF622, #4361EE11)" }}>
            <div className="flex items-center gap-2">
                <FlaskConical size={15} style={{ color: isClosed ? "var(--foreground-muted)" : "#8B5CF6" }} />
                <span className="text-xs font-black" style={{ color: isClosed ? "var(--foreground-muted)" : "#8B5CF6" }}>
                    A/B 테스트
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: isClosed ? "var(--surface-3)" : "#8B5CF622", color: isClosed ? "var(--foreground-muted)" : "#8B5CF6" }}>
                    {isClosed ? "마감됨" : "진행 중"}
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                    <Clock size={11} /> {isClosed ? "마감" : timeLeft(test.endsAt)}
                </div>
                {/* 공유 */}
                <button onClick={onShare}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all"
                    style={{ background: copied ? "#06D6A022" : "#8B5CF622", color: copied ? "#06D6A0" : "#8B5CF6" }}>
                    {copied ? <><Check size={11} /> 복사됨</> : <><Share2 size={11} /> 공유</>}
                </button>
                {/* 전체화면 토글 */}
                {isFullscreen ? (
                    <button onClick={onClose}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                        style={{ background: "var(--surface-3)" }}>
                        <X size={14} style={{ color: "var(--foreground-muted)" }} />
                    </button>
                ) : (
                    <button onClick={onFullscreen} title="전체화면"
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                        style={{ background: "#8B5CF622" }}>
                        <Maximize2 size={13} style={{ color: "#8B5CF6" }} />
                    </button>
                )}
                {/* 마감 버튼 (내 테스트) */}
                {isMyTest && !isClosed && !isFullscreen && (
                    <button onClick={() => closeTest(test.id)} title="테스트 마감"
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "var(--surface-3)" }}>
                        <X size={11} style={{ color: "var(--foreground-muted)" }} />
                    </button>
                )}
            </div>
        </div>
    );
}

// ── A/B 카드 본문 (normal / fullscreen 공용) ──────────────────────────
function CardBody({
    test, large = false,
    selectedChoice, setSelectedChoice,
    selectedReason, setSelectedReason,
    showResult, showDetail, setShowDetail,
    submitted, isMyTest, hasVoted, myVote,
    result, onVote,
}: {
    test: ABTest; large?: boolean;
    selectedChoice: "a"|"b"|null; setSelectedChoice: (v: "a"|"b") => void;
    selectedReason: ReasonTag|null; setSelectedReason: (r: ReasonTag) => void;
    showResult: boolean; showDetail: boolean; setShowDetail: (fn: (v: boolean) => boolean) => void;
    submitted: boolean; isMyTest: boolean; hasVoted: boolean;
    myVote: ABVote | undefined;
    result: ReturnType<typeof calcABResult>;
    onVote: () => void;
}) {
    const aImg = test.variantA.images?.[0] ?? test.variantA.image;
    const bImg = test.variantB.images?.[0] ?? test.variantB.image;
    const captionLimit = large ? 200 : 100;
    const imgRatio     = large ? "4/5" : "3/4";
    const captionLines = large ? "line-clamp-6" : "line-clamp-4";
    const captionSize  = large ? "text-xs" : "text-[10px]";

    return (
        <>
            {/* 질문 */}
            <div className={`px-4 ${large ? "pt-4 pb-2" : "pt-3 pb-1"}`}>
                <p className={`font-black text-center ${large ? "text-base" : "text-sm"}`} style={{ color: "var(--foreground)" }}>
                    {test.question}
                </p>
                <p className="text-[10px] text-center mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                    by @{test.creatorHandle} · {result.total}명 투표
                </p>
            </div>

            {/* A / B 카드 */}
            <div className={`grid grid-cols-2 gap-3 px-4 pt-3 pb-2`}>
                {(["a", "b"] as const).map(v => {
                    const variant  = v === "a" ? test.variantA : test.variantB;
                    const img      = v === "a" ? aImg : bImg;
                    const pct      = v === "a" ? result.aPct : result.bPct;
                    const color    = v === "a" ? "#4361EE" : "#FF6B35";
                    const isWinner = result.winner === v;
                    const isChosen = selectedChoice === v;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const myChoice = myVote?.choice === v;
                    const canSelect = !showResult && !isMyTest;

                    return (
                        <button key={v}
                            disabled={showResult || isMyTest}
                            onClick={() => canSelect && setSelectedChoice(v)}
                            className="flex flex-col gap-2 rounded-2xl p-2 transition-all text-left"
                            style={{
                                background: isChosen ? `${color}18` : "var(--surface-2)",
                                border:     `2px solid ${isChosen || myChoice ? color : "transparent"}`,
                                cursor:     canSelect ? "pointer" : "default",
                                opacity:    showResult && result.winner !== "tie" && !isWinner ? 0.65 : 1,
                            }}>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
                                    {v.toUpperCase()}
                                </span>
                                {showResult && isWinner && result.winner !== "tie" && (
                                    <Trophy size={large ? 16 : 13} style={{ color: "#FFC233" }} />
                                )}
                                {myChoice && <CheckCircle2 size={large ? 16 : 13} style={{ color }} />}
                            </div>

                            {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img} alt={v} className="w-full object-cover rounded-xl"
                                    style={{ aspectRatio: imgRatio }} />
                            ) : (
                                <div className="w-full rounded-xl flex items-center justify-center text-2xl"
                                    style={{ aspectRatio: imgRatio, background: "var(--surface-3)" }}>🖼️</div>
                            )}

                            <div className={`leading-relaxed react-markdown ${captionLines} ${captionSize}`} style={{ color: "var(--foreground)" }}>
                                <ReactMarkdown>
                                    {variant.caption.length > captionLimit
                                        ? variant.caption.slice(0, captionLimit) + "…"
                                        : variant.caption}
                                </ReactMarkdown>
                            </div>

                            {showResult && (
                                <div className="mt-1">
                                    <ResultBar pct={pct} color={color} label={v.toUpperCase()} large={large} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* 이유 선택 */}
            {!showResult && !isMyTest && selectedChoice && (
                <div className="px-4 pb-3 flex flex-col gap-2">
                    <p className="text-[11px] font-bold" style={{ color: "var(--foreground-muted)" }}>선택 이유 (1가지)</p>
                    <div className="flex flex-wrap gap-1.5">
                        {REASON_TAGS.map(r => (
                            <button key={r.id} onClick={() => setSelectedReason(r.id)}
                                className={`flex items-center gap-1 font-bold px-2.5 py-1 rounded-full transition-all ${large ? "text-xs" : "text-[11px]"}`}
                                style={{
                                    background: selectedReason === r.id ? "#8B5CF6" : "var(--surface-2)",
                                    color:      selectedReason === r.id ? "white" : "var(--foreground-muted)",
                                }}>
                                {r.emoji} {r.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={onVote} disabled={!selectedReason}
                        className={`w-full rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40 ${large ? "py-3.5 text-base" : "py-2.5 text-sm"}`}
                        style={{ background: "linear-gradient(135deg, #8B5CF6, #4361EE)", color: "white" }}>
                        {selectedChoice.toUpperCase()} 버전 선택! (+5 XP)
                    </button>
                </div>
            )}

            {/* 내 게시물 */}
            {isMyTest && (
                <div className="px-4 pb-3 text-center text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                    내 게시물이라 투표할 수 없어요. 결과는 실시간으로 확인할 수 있어요 👆
                </div>
            )}

            {/* 투표 완료 */}
            {(submitted || (hasVoted && !isMyTest)) && (
                <div className={`px-4 pb-3 text-center font-bold ${large ? "text-sm" : "text-[11px]"}`} style={{ color: "#8B5CF6" }}>
                    ✅ 투표 완료! +5 XP 적립됨
                </div>
            )}

            {/* AI 분석 */}
            {showResult && result.total > 0 && (
                <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <div className="px-4 py-3" style={{ background: "linear-gradient(135deg, #8B5CF611, #4361EE0A)" }}>
                        <p className={`font-black mb-1 ${large ? "text-xs" : "text-[11px]"}`} style={{ color: "#8B5CF6" }}>🤖 마케팅 분석</p>
                        <p className={`leading-relaxed ${large ? "text-sm" : "text-xs"}`} style={{ color: "var(--foreground)" }}>{result.aiComment}</p>
                    </div>
                    <button onClick={() => setShowDetail(v => !v)}
                        className={`w-full px-4 py-2 font-bold text-left transition-colors ${large ? "text-xs" : "text-[11px]"}`}
                        style={{ borderTop: "1px solid var(--border)", color: "var(--foreground-muted)", background: "var(--surface-2)" }}>
                        {showDetail ? "▲ 이유 분포 접기" : "▼ 이유 분포 보기"}
                    </button>
                    {showDetail && (
                        <div className="px-4 py-3 flex flex-col gap-2" style={{ background: "var(--surface-2)" }}>
                            {REASON_TAGS.map(r => {
                                const aCount = result.reasons[r.id].a;
                                const bCount = result.reasons[r.id].b;
                                if (aCount + bCount === 0) return null;
                                return (
                                    <div key={r.id} className="flex items-center gap-2 text-[11px]">
                                        <span className="w-20 shrink-0">{r.emoji} {r.label}</span>
                                        <span className="px-1.5 py-0.5 rounded font-black text-white text-[9px]" style={{ background: "#4361EE" }}>A {aCount}</span>
                                        <span className="px-1.5 py-0.5 rounded font-black text-white text-[9px]" style={{ background: "#FF6B35" }}>B {bCount}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────
export default function ABTestVoteCard({ test, onVoteCallback }: Props) {
    const { user, addPoints } = useGameStore();

    const isMyTest  = user.handle === test.creatorHandle;
    const myVote    = test.votes.find(v => v.voterHandle === user.handle);
    const hasVoted  = !!myVote;
    const isClosed  = test.status === "closed";
    const showResult = hasVoted || isClosed || isMyTest;

    const [selectedChoice, setSelectedChoice] = useState<"a"|"b"|null>(null);
    const [selectedReason, setSelectedReason] = useState<ReasonTag|null>(null);
    const [showDetail,     setShowDetail]      = useState(false);
    const [submitted,      setSubmitted]       = useState(false);
    const [copied,         setCopied]          = useState(false);
    const [isFullscreen,   setIsFullscreen]    = useState(false);

    const { addVote } = useABTestStore();
    const result = calcABResult(test);

    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/ab-test/${test.id}`
        : `/ab-test/${test.id}`;

    function handleShare() {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    async function handleVote() {
        if (!selectedChoice || !selectedReason) return;
        await addVote(test.id, { voterHandle: user.handle, choice: selectedChoice, reasonTag: selectedReason });
        const newVote: ABVote = {
            id: crypto.randomUUID(), testId: test.id, voterHandle: user.handle,
            choice: selectedChoice, reasonTag: selectedReason, createdAt: new Date().toISOString(),
        };
        onVoteCallback?.(newVote);
        addPoints(5);
        setSubmitted(true);
    }

    const sharedBodyProps = {
        test, selectedChoice, setSelectedChoice,
        selectedReason, setSelectedReason,
        showResult, showDetail, setShowDetail,
        submitted, isMyTest, hasVoted, myVote,
        result, onVote: handleVote,
    };

    const headerProps = { test, isClosed, copied, onShare: handleShare };

    return (
        <>
            {/* ── 일반 카드 ── */}
            <div className="rounded-3xl overflow-hidden"
                style={{ background: "var(--surface)", border: "2px solid", borderColor: isClosed ? "var(--border)" : "#8B5CF6", boxShadow: isClosed ? "none" : "0 4px 20px rgba(139,92,246,0.12)" }}>
                <CardHeader {...headerProps} onFullscreen={() => setIsFullscreen(true)} />
                <CardBody {...sharedBodyProps} />
            </div>

            {/* ── 전체화면 오버레이 ── */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-[200] flex flex-col"
                    style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
                    onClick={e => { if (e.target === e.currentTarget) setIsFullscreen(false); }}
                >
                    <div
                        className="relative m-auto w-full flex flex-col rounded-3xl overflow-hidden overflow-y-auto"
                        style={{
                            background: "var(--surface)",
                            border: `2px solid ${isClosed ? "var(--border)" : "#8B5CF6"}`,
                            boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
                            maxWidth: 680,
                            maxHeight: "92dvh",
                        }}
                    >
                        <CardHeader {...headerProps} isFullscreen onClose={() => setIsFullscreen(false)} />
                        <div className="overflow-y-auto no-scrollbar">
                            <CardBody {...sharedBodyProps} large />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
