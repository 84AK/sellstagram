"use client";

import React, { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
    X, Sparkles, Loader2, RefreshCw, Copy, Check,
    ImagePlus, Trash2, Eye, FileText, ToggleLeft, ToggleRight,
    Send, Info,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useAIAccess } from "@/lib/hooks/useAIAccess";
import { Lock } from "lucide-react";

// ─── 상수 ──────────────────────────────────────────────────────────
const MAX_IMAGES    = 5;
const MAX_MB        = 5;
const MAX_BYTES     = MAX_MB * 1024 * 1024;
const ACCEPT_TYPES  = ["image/jpeg", "image/png", "image/gif", "image/webp"];

type Platform = "instagram" | "blog" | "youtube" | "twitter";
const PLATFORMS: { id: Platform; label: string; emoji: string; color: string }[] = [
    { id: "instagram", label: "인스타그램", emoji: "📱", color: "#E1306C" },
    { id: "blog",      label: "블로그",     emoji: "📝", color: "#03C75A" },
    { id: "youtube",   label: "유튜브 쇼츠", emoji: "🎬", color: "#FF0000" },
    { id: "twitter",   label: "X",          emoji: "🐦", color: "#1DA1F2" },
];

interface ConversionResult { converted: string; tips: string; }

// ─── 마크다운 힌트 ──────────────────────────────────────────────────
const MD_HINTS = [
    { sym: "**굵게**",  desc: "굵은 글씨" },
    { sym: "*기울임*",  desc: "이탤릭" },
    { sym: "# 제목",    desc: "큰 제목" },
    { sym: "## 소제목", desc: "소제목" },
    { sym: "> 인용",    desc: "인용구" },
    { sym: "- 항목",    desc: "목록" },
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function MyChannelUploadModal({ isOpen, onClose }: Props) {
    // ── 전역 스토어 ────────────────────────────────────────────────
    const { addPost, addPoints, user } = useGameStore();

    // ── 작성 상태 ──────────────────────────────────────────────────
    const [topic,     setTopic]     = useState("");
    const [content,   setContent]   = useState("");
    const [images,    setImages]    = useState<{ url: string; name: string }[]>([]);
    const [previewMd, setPreviewMd] = useState(false);
    const [useAI,     setUseAI]     = useState(false);
    const { hasAccess: hasAIAccess } = useAIAccess();
    const [showHints, setShowHints] = useState(false);

    // ── AI 변환 상태 ───────────────────────────────────────────────
    const [step,        setStep]       = useState<"write" | "converting" | "aiResult" | "done">("write");
    const [conversions, setConversions] = useState<Record<string, ConversionResult>>({});
    const [activePlat,  setActivePlat] = useState<Platform>("instagram");
    const [copied,      setCopied]     = useState(false);

    // ── 에러 ───────────────────────────────────────────────────────
    const [errors, setErrors] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef  = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    // ── 이미지 처리 ────────────────────────────────────────────────
    function processFiles(files: FileList | File[]) {
        const fileArr = Array.from(files);
        const newErrors: string[] = [];
        const toAdd: { url: string; name: string }[] = [];

        for (const file of fileArr) {
            if (images.length + toAdd.length >= MAX_IMAGES) {
                newErrors.push(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있어요.`);
                break;
            }
            if (!ACCEPT_TYPES.includes(file.type)) {
                newErrors.push(`${file.name}: 지원하지 않는 형식이에요 (jpg·png·gif·webp만 가능).`);
                continue;
            }
            if (file.size > MAX_BYTES) {
                newErrors.push(`${file.name}: 파일 크기가 ${MAX_MB}MB를 초과했어요 (현재 ${(file.size / 1024 / 1024).toFixed(1)}MB).`);
                continue;
            }
            toAdd.push({ url: URL.createObjectURL(file), name: file.name });
        }

        setErrors(newErrors);
        if (toAdd.length > 0) setImages(prev => [...prev, ...toAdd]);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files) processFiles(e.target.files);
        e.target.value = "";
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
    }

    function removeImage(idx: number) {
        setImages(prev => {
            URL.revokeObjectURL(prev[idx].url);
            return prev.filter((_, i) => i !== idx);
        });
    }

    // ── 피드에 올리기 (공통) ──────────────────────────────────────
    function postToFeed(captionOverride?: string) {
        const caption = captionOverride ?? content.trim();
        addPost({
            id:      Math.random().toString(36).substr(2, 9),
            type:    "post",
            user:    { name: user.name, handle: user.handle, avatar: user.avatar },
            content: {
                image:   images[0]?.url ?? "",
                caption: (topic ? `**${topic}**\n\n` : "") + caption,
                tags:    [],
            },
            images:  images.map(i => i.url),
            stats:   { likes: 0, engagement: "0%", sales: "₩0", comments: "0", shares: "0" },
            timeAgo: "방금 전",
            createdAt: new Date().toISOString(),
        });
        addPoints(20);
        setStep("done");
    }

    // ── 기본 올리기 (AI 없이) ─────────────────────────────────────
    function handleDirectPost() {
        const errs: string[] = [];
        if (!content.trim()) errs.push("내용을 입력해주세요.");
        if (errs.length) { setErrors(errs); return; }
        setErrors([]);
        postToFeed();
    }

    // ── AI 변환 후 올리기 ─────────────────────────────────────────
    async function handleAIConvert() {
        const errs: string[] = [];
        if (!content.trim()) errs.push("내용을 입력해주세요.");
        if (errs.length) { setErrors(errs); return; }
        setErrors([]);
        setStep("converting");

        try {
            const results = await Promise.all(
                PLATFORMS.map(async (p) => {
                    const res  = await fetch("/api/ai/convert", {
                        method:  "POST",
                        headers: { "Content-Type": "application/json" },
                        body:    JSON.stringify({ content, topic, platform: p.id }),
                    });
                    const data = await res.json() as { ok: boolean; converted: string; tips: string; error?: string };
                    if (!data.ok) throw new Error(data.error ?? "변환 실패");
                    return { id: p.id, converted: data.converted, tips: data.tips };
                })
            );
            const map: Record<string, ConversionResult> = {};
            for (const r of results) map[r.id] = { converted: r.converted, tips: r.tips };
            setConversions(map);
            setStep("aiResult");
        } catch (e) {
            setErrors([e instanceof Error ? e.message : "변환 중 오류가 발생했어요."]);
            setStep("write");
        }
    }

    function handleCopy() {
        const text = conversions[activePlat]?.converted ?? "";
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    // ── 초기화 & 닫기 ─────────────────────────────────────────────
    function handleReset() {
        images.forEach(i => URL.revokeObjectURL(i.url));
        setImages([]); setTopic(""); setContent(""); setErrors([]);
        setStep("write"); setConversions({}); setCopied(false);
        setPreviewMd(false); setShowHints(false);
    }

    function handleClose() { handleReset(); onClose(); }

    const activeMeta = PLATFORMS.find(p => p.id === activePlat)!;
    const canPost    = content.trim().length > 0;

    return (
        <div
            className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ zIndex: 150, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div
                className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
                style={{
                    background:  "var(--surface)",
                    boxShadow:   "0 24px 60px rgba(0,0,0,0.18)",
                    maxHeight:   "92dvh",
                }}
            >
                {/* ── 헤더 ── */}
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
                                {step === "aiResult" ? "AI 변환 결과 — 원하는 플랫폼 선택" : "이미지와 내용을 작성하고 피드에 올려보세요"}
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

                {/* ── 본문 ── */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 no-scrollbar">

                    {/* ════════ 작성 단계 ════════ */}
                    {(step === "write" || step === "converting") && (
                        <>
                            {/* ① 이미지 업로드 */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-soft)" }}>
                                        이미지 <span style={{ color: "var(--foreground-muted)" }}>({images.length}/{MAX_IMAGES} · 장당 최대 {MAX_MB}MB)</span>
                                    </label>
                                </div>

                                {/* 드롭존 */}
                                {images.length < MAX_IMAGES && (
                                    <div
                                        ref={dropZoneRef}
                                        onClick={() => fileInputRef.current?.click()}
                                        onDrop={handleDrop}
                                        onDragOver={e => e.preventDefault()}
                                        className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:opacity-80 py-5"
                                        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                                    >
                                        <ImagePlus size={22} style={{ color: "var(--foreground-muted)" }} />
                                        <p className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                            클릭하거나 이미지를 여기로 드래그하세요
                                        </p>
                                        <p className="text-[10px]" style={{ color: "var(--foreground-muted)", opacity: 0.7 }}>
                                            jpg · png · gif · webp
                                        </p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {/* 이미지 썸네일 */}
                                {images.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {images.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={img.url}
                                                    alt={img.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{ background: "rgba(0,0,0,0.6)" }}
                                                >
                                                    <Trash2 size={12} color="white" />
                                                </button>
                                                {idx === 0 && (
                                                    <span
                                                        className="absolute bottom-1 left-1 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                                        style={{ background: "var(--primary)", color: "white" }}
                                                    >
                                                        대표
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {/* 추가 버튼 */}
                                        {images.length < MAX_IMAGES && (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all hover:opacity-80"
                                                style={{ background: "var(--surface-2)", border: "1.5px dashed var(--border)" }}
                                            >
                                                <ImagePlus size={16} style={{ color: "var(--foreground-muted)" }} />
                                                <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>추가</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ② 제목 */}
                            <div>
                                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "var(--foreground-soft)" }}>
                                    제목 / 주제
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    placeholder="오늘 만든 AI 이미지, 수업 내용, 내 생각..."
                                    disabled={step === "converting"}
                                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                                    style={{
                                        background: "var(--surface-2)",
                                        border:     "1.5px solid var(--border)",
                                        color:      "var(--foreground)",
                                    }}
                                />
                            </div>

                            {/* ③ 내용 + 마크다운 미리보기 */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-soft)" }}>
                                        내용 <span style={{ color: "var(--primary)" }}>*</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {/* 마크다운 힌트 토글 */}
                                        <button
                                            onClick={() => setShowHints(v => !v)}
                                            className="text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all"
                                            style={{
                                                color:      showHints ? "var(--secondary)" : "var(--foreground-muted)",
                                                background: showHints ? "var(--secondary-light)" : "var(--surface-2)",
                                            }}
                                        >
                                            <Info size={10} /> 마크다운
                                        </button>
                                        {/* 작성/미리보기 탭 */}
                                        <div className="flex rounded-lg overflow-hidden" style={{ border: "1.5px solid var(--border)" }}>
                                            <button
                                                onClick={() => setPreviewMd(false)}
                                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold transition-all"
                                                style={{
                                                    background: !previewMd ? "var(--secondary)" : "transparent",
                                                    color:      !previewMd ? "white" : "var(--foreground-muted)",
                                                }}
                                            >
                                                <FileText size={11} /> 작성
                                            </button>
                                            <button
                                                onClick={() => setPreviewMd(true)}
                                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold transition-all"
                                                style={{
                                                    background: previewMd ? "var(--secondary)" : "transparent",
                                                    color:      previewMd ? "white" : "var(--foreground-muted)",
                                                }}
                                            >
                                                <Eye size={11} /> 미리보기
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 마크다운 힌트 */}
                                {showHints && (
                                    <div
                                        className="flex flex-wrap gap-1.5 mb-2 p-2.5 rounded-xl"
                                        style={{ background: "var(--secondary-light, #EEF1FD)" }}
                                    >
                                        {MD_HINTS.map(h => (
                                            <button
                                                key={h.sym}
                                                title={h.desc}
                                                onClick={() => setContent(c => c + h.sym.split(" ")[0])}
                                                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg transition-all hover:opacity-80"
                                                style={{ background: "var(--secondary)", color: "white" }}
                                            >
                                                {h.sym}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* 작성 or 미리보기 */}
                                {!previewMd ? (
                                    <textarea
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        placeholder={"셀스타그램에서 진단받은 내용이나 오늘 만든 콘텐츠를 작성해보세요\n\n**굵게**, *기울임*, # 제목 등 마크다운 사용 가능해요"}
                                        rows={6}
                                        disabled={step === "converting"}
                                        className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none leading-relaxed font-mono"
                                        style={{
                                            background: "var(--surface-2)",
                                            border:     "1.5px solid var(--border)",
                                            color:      "var(--foreground)",
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="w-full rounded-xl px-4 py-3 min-h-[150px] text-sm leading-relaxed react-markdown"
                                        style={{
                                            background: "var(--surface-2)",
                                            border:     "1.5px solid var(--border)",
                                            color:      "var(--foreground)",
                                        }}
                                    >
                                        {content.trim() ? (
                                            <ReactMarkdown>{content}</ReactMarkdown>
                                        ) : (
                                            <span style={{ color: "var(--foreground-muted)", fontStyle: "italic" }}>
                                                내용을 입력하면 여기에 미리보기가 표시돼요
                                            </span>
                                        )}
                                    </div>
                                )}
                                <p className="text-right text-[10px] mt-1" style={{ color: "var(--foreground-muted)" }}>
                                    {content.length}자
                                </p>
                            </div>

                            {/* ④ AI 피드백 토글 */}
                            {hasAIAccess ? (
                                /* 권한 있음 — 기존 토글 */
                                <div
                                    className="flex items-center justify-between rounded-2xl px-4 py-3"
                                    style={{ background: useAI ? "var(--secondary-light, #EEF1FD)" : "var(--surface-2)", border: `1.5px solid ${useAI ? "var(--secondary)" : "var(--border)"}` }}
                                >
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={16} style={{ color: useAI ? "var(--secondary)" : "var(--foreground-muted)" }} />
                                        <div>
                                            <p className="text-sm font-black" style={{ color: useAI ? "var(--secondary)" : "var(--foreground)" }}>
                                                AI 피드백 받기
                                            </p>
                                            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                                {useAI ? "4개 플랫폼 캡션 자동 변환 후 올릴 수 있어요" : "선택 · AI가 4개 플랫폼으로 변환해줘요"}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setUseAI(v => !v)} className="shrink-0 transition-all">
                                        {useAI
                                            ? <ToggleRight size={32} style={{ color: "var(--secondary)" }} />
                                            : <ToggleLeft  size={32} style={{ color: "var(--foreground-muted)" }} />
                                        }
                                    </button>
                                </div>
                            ) : (
                                /* 권한 없음 — 잠금 배너 */
                                <div
                                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                                    style={{ background: "linear-gradient(135deg, #8B5CF608, #4361EE08)", border: "1.5px dashed #8B5CF644" }}
                                >
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#8B5CF622" }}>
                                        <Lock size={16} style={{ color: "#8B5CF6" }} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black" style={{ color: "#8B5CF6" }}>AI 피드백 — 팀 배정 필요</p>
                                        <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                            선생님께 팀 코드를 받거나 프리미엄 플랜을 이용해주세요.
                                        </p>
                                    </div>
                                    <button disabled className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold opacity-50 cursor-not-allowed"
                                        style={{ background: "linear-gradient(135deg, #8B5CF6, #4361EE)", color: "white" }}>
                                        <Sparkles size={11} /> 업그레이드
                                    </button>
                                </div>
                            )}

                            {/* 에러 */}
                            {errors.length > 0 && (
                                <div className="rounded-xl px-4 py-3 flex flex-col gap-1" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                                    {errors.map((e, i) => <p key={i} className="text-sm">⚠️ {e}</p>)}
                                </div>
                            )}

                            {/* ⑤ 버튼 */}
                            {(!useAI || !hasAIAccess) ? (
                                /* 바로 올리기 */
                                <button
                                    onClick={handleDirectPost}
                                    disabled={!canPost}
                                    className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                                    style={{
                                        background: "linear-gradient(135deg, var(--primary), #FF9A72)",
                                        color:      "white",
                                        boxShadow:  "0 4px 16px rgba(255,107,53,0.3)",
                                    }}
                                >
                                    <Send size={16} /> 피드에 올리기
                                </button>
                            ) : (
                                /* AI 변환 후 올리기 */
                                <button
                                    onClick={handleAIConvert}
                                    disabled={step === "converting" || !canPost}
                                    className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                                    style={{
                                        background: "linear-gradient(135deg, var(--secondary), #6B8FFF)",
                                        color:      "white",
                                        boxShadow:  "0 4px 16px rgba(67,97,238,0.3)",
                                    }}
                                >
                                    {step === "converting" ? (
                                        <><Loader2 size={16} className="animate-spin" /> 4개 플랫폼 변환 중...</>
                                    ) : (
                                        <><Sparkles size={16} /> AI 피드백 받고 올리기</>
                                    )}
                                </button>
                            )}

                            {step === "converting" && (
                                <p className="text-center text-xs" style={{ color: "var(--foreground-muted)" }}>
                                    인스타그램 · 블로그 · 유튜브 · X 동시 변환 중 ✨
                                </p>
                            )}
                        </>
                    )}

                    {/* ════════ AI 결과 단계 ════════ */}
                    {step === "aiResult" && (
                        <>
                            {/* 플랫폼 탭 */}
                            <div className="flex gap-2 flex-wrap">
                                {PLATFORMS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setActivePlat(p.id); setCopied(false); }}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                                        style={{
                                            background: activePlat === p.id ? p.color : "var(--surface-2)",
                                            color:      activePlat === p.id ? "white" : "var(--foreground-soft)",
                                            boxShadow:  activePlat === p.id ? `0 3px 10px ${p.color}44` : "none",
                                        }}
                                    >
                                        <span>{p.emoji}</span> <span>{p.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* 변환 결과 */}
                            <div
                                className="rounded-2xl p-4 relative"
                                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                            >
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ background: activeMeta.color }} />
                                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>
                                    {conversions[activePlat]?.converted ?? ""}
                                </p>
                            </div>

                            {/* 팁 */}
                            {conversions[activePlat]?.tips && (
                                <div
                                    className="rounded-xl px-4 py-3 flex items-start gap-2"
                                    style={{ background: "var(--accent-light)", border: "1px solid rgba(6,214,160,0.2)" }}
                                >
                                    <span className="text-base shrink-0">💡</span>
                                    <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                                        {conversions[activePlat]?.tips}
                                    </p>
                                </div>
                            )}

                            {/* 업로드된 이미지 미리보기 (요약) */}
                            {images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {images.map((img, i) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            key={i}
                                            src={img.url}
                                            alt=""
                                            className="h-16 w-16 object-cover rounded-xl shrink-0"
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 버튼 영역 */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep("write")}
                                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                                    style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}
                                >
                                    <RefreshCw size={14} /> 다시 작성
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold transition-all"
                                    style={{
                                        background: copied ? "var(--accent)" : "var(--surface-2)",
                                        color:      copied ? "white" : "var(--foreground-soft)",
                                    }}
                                >
                                    {copied ? <><Check size={14} /> 복사됨</> : <><Copy size={14} /> 복사</>}
                                </button>
                                <button
                                    onClick={() => postToFeed(conversions[activePlat]?.converted)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                                    style={{
                                        background: `linear-gradient(135deg, ${activeMeta.color}, ${activeMeta.color}cc)`,
                                        color:      "white",
                                        boxShadow:  `0 4px 16px ${activeMeta.color}44`,
                                    }}
                                >
                                    <Send size={14} /> 피드에 올리기
                                </button>
                            </div>
                        </>
                    )}

                    {/* ════════ 완료 단계 ════════ */}
                    {step === "done" && (
                        <div className="flex flex-col items-center gap-4 py-8 text-center">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                                style={{ background: "var(--accent-light)", animation: "pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
                            >
                                🎉
                            </div>
                            <div>
                                <p className="text-lg font-black" style={{ color: "var(--foreground)" }}>
                                    피드에 올렸어요!
                                </p>
                                <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
                                    XP +20 획득 · 시뮬레이션 피드에서 확인해보세요
                                </p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
                                    style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}
                                >
                                    하나 더 올리기
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
                                    style={{ background: "var(--primary)", color: "white" }}
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
