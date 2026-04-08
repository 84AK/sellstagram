"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
    X, FlaskConical, ImagePlus, Trash2, Eye, FileText, ChevronDown,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useABTestStore, QUESTION_PRESETS, ABVariant } from "@/store/useABTestStore";
import { supabase } from "@/lib/supabase/client";

interface Props {
    /** A 버전으로 사용할 기존 게시물 정보 */
    postA: {
        id: string;
        image: string;
        images?: string[];
        caption: string;
        tags: string[];
    };
    onClose: () => void;
    onCreated: () => void;
}

const MAX_IMAGES = 4;
const MAX_BYTES  = 5 * 1024 * 1024;
const DURATIONS  = [
    { label: "수업 중 (1시간)",  hours: 1  },
    { label: "오늘 하루",        hours: 24 },
    { label: "3일",              hours: 72 },
];

export default function ABTestCreateModal({ postA, onClose, onCreated }: Props) {
    const { user, addPoints } = useGameStore();
    const { addTest } = useABTestStore();

    // ── B 버전 작성 상태 ────────────────────────────────────────────
    const [bCaption,  setBCaption]  = useState("");
    const [bImages,   setBImages]   = useState<{ url: string; blob?: boolean }[]>([]);

    // blob URL 메모리 누수 방지 — 언마운트 시 해제
    useEffect(() => {
        return () => {
            bImages.forEach(i => { if (i.blob) URL.revokeObjectURL(i.url); });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [previewMd, setPreviewMd] = useState(false);

    // ── 설정 상태 ───────────────────────────────────────────────────
    const [question,     setQuestion]     = useState(QUESTION_PRESETS[0]);
    const [customQ,      setCustomQ]      = useState("");
    const [showQDropdown, setShowQDropdown] = useState(false);
    const [durationIdx,  setDurationIdx]  = useState(0);
    const [error,        setError]        = useState("");
    const [creating,     setCreating]     = useState(false);

    const fileRef = useRef<HTMLInputElement>(null);

    // blob: URL → Supabase Storage 업로드, 실패 시 빈 문자열 반환
    async function uploadBlobToStorage(blobUrl: string): Promise<string> {
        try {
            const res  = await fetch(blobUrl);
            const blob = await res.blob();
            const ext  = blob.type.split("/")[1] ?? "jpg";
            const path = `ab-tests/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
            const { data, error } = await supabase.storage.from("posts").upload(path, blob, { contentType: blob.type });
            if (error || !data) return "";
            return supabase.storage.from("posts").getPublicUrl(data.path).data.publicUrl;
        } catch {
            return "";
        }
    }

    // ── A 버전 이미지 목록 ─────────────────────────────────────────
    const aImages = postA.images && postA.images.length > 0 ? postA.images : postA.image ? [postA.image] : [];

    // 허용 MIME 화이트리스트 (SVG 제외 — XSS 위험)
    const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];

    // ── 이미지 업로드 ──────────────────────────────────────────────
    function processFiles(files: FileList | File[]) {
        const errs: string[] = [];
        const toAdd: { url: string; blob: boolean }[] = [];
        for (const f of Array.from(files)) {
            if (bImages.length + toAdd.length >= MAX_IMAGES) { errs.push("최대 4장까지 업로드할 수 있어요."); break; }
            if (!ALLOWED_MIME.includes(f.type)) { errs.push(`${f.name}: 지원하지 않는 형식 (jpg/png/gif/webp만 가능)`); continue; }
            if (f.size > MAX_BYTES) { errs.push(`${f.name}: 5MB 초과`); continue; }
            toAdd.push({ url: URL.createObjectURL(f), blob: true });
        }
        if (errs.length) setError(errs.join(" | "));
        if (toAdd.length) setBImages(prev => [...prev, ...toAdd]);
    }

    // ── 테스트 생성 ────────────────────────────────────────────────
    async function handleCreate() {
        if (!bCaption.trim()) { setError("B 버전 내용을 입력해주세요."); return; }
        setError("");
        setCreating(true);

        // B 버전 이미지: blob: URL이면 Supabase Storage에 업로드
        const uploadedBImages: string[] = await Promise.all(
            bImages.map(i =>
                i.blob
                    ? uploadBlobToStorage(i.url)
                    : Promise.resolve(i.url)
            )
        );
        const bImgFiltered = uploadedBImages.filter(Boolean);
        if (bImages.length > 0 && bImgFiltered.length === 0) {
            setError("이미지 업로드에 실패했어요. 다시 시도해주세요.");
            setCreating(false);
            return;
        }

        const finalQ = customQ.trim() || question;
        const endsAt = new Date(Date.now() + DURATIONS[durationIdx].hours * 3600 * 1000).toISOString();

        const variantA: ABVariant = {
            image:   aImages[0] ?? "",
            images:  aImages,
            caption: postA.caption,
            tags:    postA.tags,
        };
        const variantB: ABVariant = {
            image:   bImgFiltered[0] ?? "",
            images:  bImgFiltered,
            caption: bCaption,
        };

        const result = await addTest({
            creatorHandle: user.handle,
            creatorName:   user.name,
            creatorAvatar: user.avatar,
            variantA,
            variantB,
            question:      finalQ,
            status:        "active",
            endsAt,
        });

        setCreating(false);
        if (!result) { setError("테스트 생성에 실패했어요. 다시 시도해주세요."); return; }

        addPoints(10); // 테스트 생성 XP
        onCreated();
    }

    return (
        <div
            className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ zIndex: 160, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
                style={{ background: "var(--surface)", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", maxHeight: "92dvh" }}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8B5CF6, #4361EE)" }}>
                            <FlaskConical size={15} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-black font-outfit" style={{ color: "var(--foreground)" }}>A/B 테스트 만들기</h2>
                            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>기존 게시물(A)과 새 버전(B)을 비교해요</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                        <X size={16} style={{ color: "var(--foreground-soft)" }} />
                    </button>
                </div>

                {/* 본문 */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 no-scrollbar">

                    {/* ── A/B 나란히 레이아웃 ── */}
                    <div className="grid grid-cols-2 gap-3">

                        {/* A 버전 (기존 게시물, 읽기 전용) */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ background: "#4361EE" }}>A</span>
                                <span className="text-xs font-bold" style={{ color: "var(--foreground-muted)" }}>기존 게시물</span>
                            </div>
                            {aImages[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={aImages[0]} alt="A" className="w-full aspect-square object-cover rounded-2xl" />
                            ) : (
                                <div className="w-full aspect-square rounded-2xl flex items-center justify-center text-3xl" style={{ background: "var(--surface-2)" }}>🖼️</div>
                            )}
                            <div
                                className="rounded-xl p-2.5 text-xs leading-relaxed react-markdown"
                                style={{ background: "var(--surface-2)", color: "var(--foreground)", minHeight: 64 }}
                            >
                                <ReactMarkdown>{postA.caption.length > 120 ? postA.caption.slice(0, 120) + "…" : postA.caption}</ReactMarkdown>
                            </div>
                        </div>

                        {/* B 버전 (새로 작성) */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ background: "#FF6B35" }}>B</span>
                                <span className="text-xs font-bold" style={{ color: "var(--foreground-muted)" }}>새 버전 작성</span>
                            </div>

                            {/* B 이미지 */}
                            {bImages.length > 0 ? (
                                <div className="relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={bImages[0].url} alt="B" className="w-full aspect-square object-cover rounded-2xl" />
                                    <button
                                        onClick={() => { bImages.forEach(i => { if (i.blob) URL.revokeObjectURL(i.url); }); setBImages([]); }}
                                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                                        style={{ background: "rgba(0,0,0,0.6)" }}
                                    >
                                        <Trash2 size={11} color="white" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    onDrop={e => { e.preventDefault(); processFiles(e.dataTransfer.files); }}
                                    onDragOver={e => e.preventDefault()}
                                    className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:opacity-80"
                                    style={{ background: "var(--surface-2)", border: "1.5px dashed var(--border)" }}
                                >
                                    <ImagePlus size={20} style={{ color: "var(--foreground-muted)" }} />
                                    <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>이미지 (선택)</span>
                                </button>
                            )}
                            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) processFiles(e.target.files); e.target.value = ""; }} />

                            {/* B 캡션 작성/미리보기 */}
                            <div className="flex gap-1 mb-0.5">
                                <button onClick={() => setPreviewMd(false)} className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all" style={{ background: !previewMd ? "var(--secondary)" : "var(--surface-2)", color: !previewMd ? "white" : "var(--foreground-muted)" }}>
                                    <FileText size={9} /> 작성
                                </button>
                                <button onClick={() => setPreviewMd(true)} className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all" style={{ background: previewMd ? "var(--secondary)" : "var(--surface-2)", color: previewMd ? "white" : "var(--foreground-muted)" }}>
                                    <Eye size={9} /> 미리보기
                                </button>
                            </div>
                            {!previewMd ? (
                                <textarea
                                    value={bCaption}
                                    onChange={e => setBCaption(e.target.value)}
                                    placeholder={"기존과 다른 캡션을 작성해봐요\n**굵게**, *기울임*, # 제목 사용 가능"}
                                    rows={4}
                                    className="w-full rounded-xl px-3 py-2 text-xs outline-none resize-none leading-relaxed font-mono"
                                    style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", color: "var(--foreground)", minHeight: 64 }}
                                />
                            ) : (
                                <div className="rounded-xl px-3 py-2 text-xs leading-relaxed react-markdown min-h-16" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}>
                                    {bCaption.trim() ? <ReactMarkdown>{bCaption}</ReactMarkdown> : <span style={{ color: "var(--foreground-muted)", fontStyle: "italic" }}>미리보기</span>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── 투표 설정 ── */}
                    <div className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: "var(--surface-2)" }}>
                        <p className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>투표 설정</p>

                        {/* 질문 선택 */}
                        <div>
                            <label className="text-[11px] font-bold mb-1 block" style={{ color: "var(--foreground-soft)" }}>투표 질문</label>
                            <div className="relative">
                                <button
                                    onClick={() => setShowQDropdown(v => !v)}
                                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-left transition-all"
                                    style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                                >
                                    {customQ || question}
                                    <ChevronDown size={14} style={{ color: "var(--foreground-muted)" }} />
                                </button>
                                {showQDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowQDropdown(false)} />
                                        <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-2xl overflow-hidden shadow-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                            {QUESTION_PRESETS.map(q => (
                                                <button key={q} onClick={() => { setQuestion(q); setCustomQ(""); setShowQDropdown(false); }}
                                                    className="w-full text-left px-4 py-3 text-sm font-semibold transition-colors hover:bg-foreground/5"
                                                    style={{ color: q === question ? "var(--primary)" : "var(--foreground)" }}>
                                                    {q}
                                                </button>
                                            ))}
                                            <div style={{ borderTop: "1px solid var(--border)" }}>
                                                <input
                                                    value={customQ}
                                                    onChange={e => { setCustomQ(e.target.value); setShowQDropdown(false); }}
                                                    placeholder="직접 입력..."
                                                    className="w-full px-4 py-3 text-sm outline-none"
                                                    style={{ background: "var(--surface-2)", color: "var(--foreground)" }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 투표 기간 */}
                        <div>
                            <label className="text-[11px] font-bold mb-1 block" style={{ color: "var(--foreground-soft)" }}>투표 마감</label>
                            <div className="flex gap-2">
                                {DURATIONS.map((d, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setDurationIdx(i)}
                                        className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all"
                                        style={{
                                            background: durationIdx === i ? "var(--secondary)" : "var(--surface)",
                                            color:      durationIdx === i ? "white" : "var(--foreground-muted)",
                                            border:     `1.5px solid ${durationIdx === i ? "var(--secondary)" : "var(--border)"}`,
                                        }}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 에러 */}
                    {error && (
                        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* 생성 버튼 */}
                    <button
                        onClick={handleCreate}
                        disabled={!bCaption.trim() || creating}
                        className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #8B5CF6, #4361EE)", color: "white", boxShadow: "0 4px 16px rgba(139,92,246,0.3)" }}
                    >
                        <FlaskConical size={16} />
                        {creating ? "저장 중..." : "테스트 시작하기 (XP +10)"}
                    </button>
                    <p className="text-center text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                        피드에 투표 카드가 등장해요 · 내 게시물엔 투표 불가
                    </p>
                </div>
            </div>
        </div>
    );
}
