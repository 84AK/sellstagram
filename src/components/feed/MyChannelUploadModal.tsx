"use client";

import React, { useState } from "react";
import { X, Copy, Check, RefreshCw, Loader2, Sparkles } from "lucide-react";

type Platform = "instagram" | "blog" | "youtube" | "twitter";

interface ConversionResult {
    converted: string;
    tips: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const PLATFORMS: { id: Platform; label: string; emoji: string; color: string }[] = [
    { id: "instagram", label: "인스타그램", emoji: "📱", color: "#E1306C" },
    { id: "blog",      label: "블로그",     emoji: "📝", color: "#03C75A" },
    { id: "youtube",   label: "유튜브 쇼츠", emoji: "🎬", color: "#FF0000" },
    { id: "twitter",   label: "X",          emoji: "🐦", color: "#1DA1F2" },
];

export default function MyChannelUploadModal({ isOpen, onClose }: Props) {
    const [step, setStep] = useState<"write" | "converting" | "result">("write");
    const [topic, setTopic] = useState("");
    const [content, setContent] = useState("");
    const [activePlatform, setActivePlatform] = useState<Platform>("instagram");
    const [conversions, setConversions] = useState<Record<string, ConversionResult>>({});
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    async function handleConvert() {
        if (!content.trim()) {
            setError("내용을 입력해주세요.");
            return;
        }
        setError(null);
        setStep("converting");

        try {
            const results = await Promise.all(
                PLATFORMS.map(async (p) => {
                    const res = await fetch("/api/ai/convert", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ content, topic, platform: p.id }),
                    });
                    const data = await res.json() as { ok: boolean; converted: string; tips: string; error?: string };
                    if (!data.ok) throw new Error(data.error ?? "변환 실패");
                    return { id: p.id, converted: data.converted, tips: data.tips };
                })
            );

            const map: Record<string, ConversionResult> = {};
            for (const r of results) {
                map[r.id] = { converted: r.converted, tips: r.tips };
            }
            setConversions(map);
            setStep("result");
        } catch (e) {
            const msg = e instanceof Error ? e.message : "변환 중 오류가 발생했어요.";
            setError(msg);
            setStep("write");
        }
    }

    function handleCopy() {
        const text = conversions[activePlatform]?.converted ?? "";
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function handleReset() {
        setStep("write");
        setConversions({});
        setCopied(false);
        setError(null);
    }

    function handleClose() {
        handleReset();
        setTopic("");
        setContent("");
        onClose();
    }

    const activePlatformMeta = PLATFORMS.find(p => p.id === activePlatform)!;

    return (
        <div
            className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ zIndex: 150, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div
                className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
                style={{
                    background: "var(--surface)",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
                    maxHeight: "90dvh",
                }}
            >
                {/* 헤더 */}
                <div
                    className="flex items-center justify-between px-5 py-4 shrink-0"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, var(--secondary), #6B8FFF)" }}
                        >
                            <Sparkles size={15} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-black font-outfit" style={{ color: "var(--foreground)" }}>
                                내 채널 콘텐츠 만들기
                            </h2>
                            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                AI가 플랫폼별로 자동 변환해드려요
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
                        style={{ background: "var(--surface-2)" }}
                    >
                        <X size={16} style={{ color: "var(--foreground-soft)" }} />
                    </button>
                </div>

                {/* 본문 */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

                    {/* ── 작성 단계 ── */}
                    {(step === "write" || step === "converting") && (
                        <>
                            {/* 주제 입력 */}
                            <div>
                                <label
                                    className="block text-xs font-bold mb-1.5 uppercase tracking-wider"
                                    style={{ color: "var(--foreground-soft)" }}
                                >
                                    주제 / 제목
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="오늘 만든 AI 이미지, 수업 내용, 내 생각..."
                                    disabled={step === "converting"}
                                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                                    style={{
                                        background: "var(--surface-2)",
                                        border: "1.5px solid var(--border)",
                                        color: "var(--foreground)",
                                    }}
                                />
                            </div>

                            {/* 내용 입력 */}
                            <div>
                                <label
                                    className="block text-xs font-bold mb-1.5 uppercase tracking-wider"
                                    style={{ color: "var(--foreground-soft)" }}
                                >
                                    내용 <span style={{ color: "var(--primary)" }}>*</span>
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="셀스타그램에서 진단받은 내용이나 오늘 만든 콘텐츠를 작성해보세요"
                                    rows={6}
                                    disabled={step === "converting"}
                                    className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all leading-relaxed"
                                    style={{
                                        background: "var(--surface-2)",
                                        border: "1.5px solid var(--border)",
                                        color: "var(--foreground)",
                                    }}
                                />
                                <p className="text-right text-[10px] mt-1" style={{ color: "var(--foreground-muted)" }}>
                                    {content.length}자
                                </p>
                            </div>

                            {/* 에러 */}
                            {error && (
                                <div
                                    className="rounded-xl px-4 py-3 text-sm"
                                    style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                                >
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* 변환 버튼 */}
                            <button
                                onClick={handleConvert}
                                disabled={step === "converting" || !content.trim()}
                                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                                style={{
                                    background: "linear-gradient(135deg, var(--secondary), #6B8FFF)",
                                    color: "white",
                                    boxShadow: "0 4px 16px rgba(67,97,238,0.3)",
                                }}
                            >
                                {step === "converting" ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        4개 플랫폼 변환 중...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        AI로 변환하기
                                    </>
                                )}
                            </button>

                            {step === "converting" && (
                                <div className="text-center text-xs" style={{ color: "var(--foreground-muted)" }}>
                                    인스타그램 · 블로그 · 유튜브 · X 동시 변환 중
                                </div>
                            )}
                        </>
                    )}

                    {/* ── 결과 단계 ── */}
                    {step === "result" && (
                        <>
                            {/* 플랫폼 탭 */}
                            <div className="flex gap-2 flex-wrap">
                                {PLATFORMS.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setActivePlatform(p.id); setCopied(false); }}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                                        style={{
                                            background: activePlatform === p.id ? p.color : "var(--surface-2)",
                                            color: activePlatform === p.id ? "white" : "var(--foreground-soft)",
                                            boxShadow: activePlatform === p.id ? `0 3px 10px ${p.color}44` : "none",
                                        }}
                                    >
                                        <span>{p.emoji}</span>
                                        <span>{p.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* 변환 결과 텍스트 */}
                            <div
                                className="rounded-2xl p-4 relative"
                                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                            >
                                <div
                                    className="absolute top-3 right-3 w-2 h-2 rounded-full"
                                    style={{ background: activePlatformMeta.color }}
                                />
                                <p
                                    className="text-sm leading-relaxed whitespace-pre-wrap"
                                    style={{ color: "var(--foreground)" }}
                                >
                                    {conversions[activePlatform]?.converted ?? ""}
                                </p>
                            </div>

                            {/* 팁 */}
                            {conversions[activePlatform]?.tips && (
                                <div
                                    className="rounded-xl px-4 py-3 flex items-start gap-2"
                                    style={{ background: "var(--accent-light)", border: "1px solid rgba(6,214,160,0.2)" }}
                                >
                                    <span className="text-base shrink-0">💡</span>
                                    <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                                        {conversions[activePlatform]?.tips}
                                    </p>
                                </div>
                            )}

                            {/* 버튼 영역 */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                                    style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}
                                >
                                    <RefreshCw size={14} />
                                    다시 작성
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                                    style={{
                                        background: copied ? "var(--accent)" : activePlatformMeta.color,
                                        color: "white",
                                        boxShadow: copied ? "0 3px 12px rgba(6,214,160,0.35)" : `0 3px 12px ${activePlatformMeta.color}44`,
                                    }}
                                >
                                    {copied ? (
                                        <><Check size={15} /> 복사됨!</>
                                    ) : (
                                        <><Copy size={15} /> 복사하기</>
                                    )}
                                </button>
                            </div>

                            <p className="text-center text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                                복사 후 실제 {activePlatformMeta.label}에 붙여넣기 해보세요 ✨
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
