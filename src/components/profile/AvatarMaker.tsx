"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, Sparkles, Lock, Check, ShoppingBag } from "lucide-react";
import {
    DICEBEAR_STYLES,
    buildStyleUrl,
    buildOptionPreviewUrl,
    getUnlockedStyleIds,
    addUnlockedStyle,
    getSavedAvatarStyle,
    saveAvatarStyle,
} from "@/lib/avatar/styles";
import type { DiceBearStyle, StyleOption } from "@/lib/avatar/styles";
import { useGameStore } from "@/store/useGameStore";

interface AvatarMakerProps {
    seed: string;
    onSave: (avatarUrl: string) => void;
    onClose: () => void;
}

// 스타일 카드에 2개 샘플 아바타 미리보기
function StyleSamples({ style }: { style: DiceBearStyle }) {
    const seeds = ["alpha", "beta"];
    return (
        <div className="flex gap-2 justify-center items-center" style={{ minHeight: 60 }}>
            {seeds.map(s => (
                <img
                    key={s}
                    src={buildStyleUrl(style.id, style.defaultOptions, s, 80)}
                    alt=""
                    className="rounded-xl"
                    style={{ width: 52, height: 52, objectFit: "contain", background: "#f7f6f3" }}
                    loading="lazy"
                    onError={e => {
                        const t = e.currentTarget;
                        t.style.display = "none";
                        const span = document.createElement("span");
                        span.style.fontSize = "28px";
                        span.textContent = style.emoji;
                        t.parentElement?.appendChild(span);
                    }}
                />
            ))}
        </div>
    );
}

// 옵션 아이템 미리보기 (type: "avatar")
function OptionAvatarPreview({
    styleId,
    optKey,
    optValue,
    defaults,
    selected,
    onClick,
    label,
    hasProbability,
}: {
    styleId: string;
    optKey: string;
    optValue: string;
    defaults: Record<string, string>;
    selected: boolean;
    onClick: () => void;
    label: string;
    hasProbability?: boolean;
}) {
    const url = buildOptionPreviewUrl(styleId, optKey, optValue, defaults, hasProbability, 72);
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
            style={{
                background: selected ? "var(--primary-light)" : "var(--surface-2)",
                border: selected ? "2px solid var(--primary)" : "1.5px solid transparent",
                minWidth: 68,
            }}
        >
            <img src={url} alt={label} style={{ width: 48, height: 48, objectFit: "contain" }} loading="lazy" />
            <span className="text-[9px] font-bold text-center" style={{ color: selected ? "var(--primary)" : "var(--foreground-muted)" }}>
                {label}
            </span>
            {selected && (
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "var(--primary)" }}>
                    <Check size={8} color="white" />
                </div>
            )}
        </button>
    );
}

// 색상 스와치 (type: "color")
function ColorSwatch({
    color,
    label,
    selected,
    onClick,
}: {
    color: string;
    label: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            className="relative flex flex-col items-center gap-1 transition-all"
            style={{ minWidth: 40 }}
        >
            <div
                className="rounded-full border-2 transition-all"
                style={{
                    width: 36,
                    height: 36,
                    background: color.startsWith("#") ? color : `#${color}`,
                    borderColor: selected ? "var(--primary)" : "var(--border)",
                    boxShadow: selected ? "0 0 0 3px var(--primary-light)" : undefined,
                    transform: selected ? "scale(1.15)" : undefined,
                }}
            />
            {selected && (
                <div
                    className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--primary)", transform: "translate(30%, -30%)" }}
                >
                    <Check size={8} color="white" />
                </div>
            )}
            <span className="text-[8px] font-bold" style={{ color: "var(--foreground-muted)" }}>
                {label}
            </span>
        </button>
    );
}

// 스타일의 모든 avatar 타입 옵션을 첫 번째/기본 값으로 채워 무작위 렌더링 방지
function buildFullDefaults(style: DiceBearStyle): Record<string, string> {
    const defaults = { ...style.defaultOptions };
    style.options.forEach(opt => {
        if (!(opt.key in defaults) && opt.type === "avatar" && !opt.hasProbability && opt.values.length > 0) {
            const plain = opt.values.find(v => v.value === "plain" || v.value === "default");
            defaults[opt.key] = plain?.value ?? opt.values[0].value;
        }
    });
    return defaults;
}

export default function AvatarMaker({ seed, onSave, onClose }: AvatarMakerProps) {
    const { user, addPoints } = useGameStore();
    const [view, setView] = useState<"styles" | "editor">("styles");
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
    const [activeStyleId, setActiveStyleId] = useState<string>("fun-emoji");
    const [options, setOptions] = useState<Record<string, string>>({});
    const [activeOptKey, setActiveOptKey] = useState<string | null>(null);

    useEffect(() => {
        const unlocked = getUnlockedStyleIds();
        setUnlockedIds(unlocked);
        // 저장된 아바타 복원
        const saved = getSavedAvatarStyle();
        if (saved) {
            setActiveStyleId(saved.styleId);
            // 저장된 옵션에 없는 키를 기본값으로 채움
            const style = DICEBEAR_STYLES.find(s => s.id === saved.styleId) ?? DICEBEAR_STYLES[0];
            setOptions({ ...buildFullDefaults(style), ...saved.options });
        } else {
            const defaultStyle = DICEBEAR_STYLES[0];
            setActiveStyleId(defaultStyle.id);
            setOptions(buildFullDefaults(defaultStyle));
        }
    }, []);

    const activeStyle = DICEBEAR_STYLES.find(s => s.id === activeStyleId) ?? DICEBEAR_STYLES[0];

    const handleSelectStyle = (style: DiceBearStyle) => {
        const isUnlocked = unlockedIds.includes(style.id);
        if (!isUnlocked) return;
        setActiveStyleId(style.id);
        setOptions(buildFullDefaults(style));
        setActiveOptKey(style.options[0]?.key ?? null);
        setView("editor");
    };

    const handleUnlock = (style: DiceBearStyle) => {
        if (!user || user.points < style.xpCost) return;
        addPoints(-style.xpCost);
        addUnlockedStyle(style.id);
        setUnlockedIds(prev => [...prev, style.id]);
    };

    const handleOptionChange = (optKey: string, value: string) => {
        setOptions(prev => ({ ...prev, [optKey]: value }));
    };

    const handleSave = useCallback(() => {
        const url = buildStyleUrl(activeStyle.id, options, seed, 200);
        saveAvatarStyle(activeStyle.id, options);
        onSave(url);
    }, [activeStyle, options, seed, onSave]);

    const probabilityKeys = activeStyle.options.filter(o => o.hasProbability).map(o => o.key);
    const previewUrl = buildStyleUrl(activeStyle.id, options, seed, 300, probabilityKeys);

    const activeOption: StyleOption | null =
        activeOptKey ? (activeStyle.options.find(o => o.key === activeOptKey) ?? null) : null;

    const content = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="relative flex flex-col overflow-hidden"
                style={{
                    width: "min(960px, 98vw)",
                    maxHeight: "92vh",
                    background: "var(--background)",
                    borderRadius: 28,
                    border: "1px solid var(--border)",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-7 py-5 shrink-0"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <div className="flex items-center gap-3">
                        {view === "editor" && (
                            <button
                                onClick={() => setView("styles")}
                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
                                style={{ background: "var(--surface-2)", color: "var(--foreground)" }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                        )}
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "var(--primary)", color: "white" }}
                        >
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black italic tracking-tight" style={{ color: "var(--foreground)" }}>
                                {view === "styles" ? "아바타 스타일 선택" : `${activeStyle.nameKo} 커스터마이징`}
                            </h2>
                            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                {view === "styles"
                                    ? `${unlockedIds.length}/${DICEBEAR_STYLES.length} 스타일 해금됨`
                                    : "옵션을 선택해 나만의 아바타를 만들어보세요"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* XP 표시 */}
                        <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black"
                            style={{ background: "var(--highlight)", color: "#7c4a00" }}
                        >
                            ⭐ {user?.points ?? 0} XP
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-70"
                            style={{ background: "var(--surface-2)", color: "var(--foreground)" }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden">

                    {/* ── 스타일 선택 뷰 ── */}
                    {view === "styles" && (
                        <div className="h-full overflow-y-auto p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {DICEBEAR_STYLES.map(style => {
                                    const isUnlocked = unlockedIds.includes(style.id);
                                    const isActive = style.id === activeStyleId;
                                    const canAfford = (user?.points ?? 0) >= style.xpCost;

                                    return (
                                        <div
                                            key={style.id}
                                            className="flex flex-col rounded-2xl overflow-hidden transition-all"
                                            style={{
                                                background: "var(--surface)",
                                                border: isActive
                                                    ? "2px solid var(--primary)"
                                                    : "1.5px solid var(--border)",
                                                opacity: isUnlocked ? 1 : 0.85,
                                            }}
                                        >
                                            {/* 샘플 아바타들 */}
                                            <div
                                                className="p-4 flex flex-col items-center gap-3"
                                                style={{ background: isUnlocked ? "var(--surface-2)" : "var(--surface-3)" }}
                                            >
                                                <StyleSamples style={style} />
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-lg">{style.emoji}</span>
                                                    <span className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                                        {style.nameKo}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-center" style={{ color: "var(--foreground-muted)" }}>
                                                    {style.description}
                                                </p>
                                            </div>

                                            {/* 하단 버튼 */}
                                            <div className="p-3">
                                                {isUnlocked ? (
                                                    <button
                                                        onClick={() => handleSelectStyle(style)}
                                                        className="w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                                                        style={{
                                                            background: isActive ? "var(--primary)" : "var(--surface-2)",
                                                            color: isActive ? "white" : "var(--foreground)",
                                                        }}
                                                    >
                                                        {isActive ? (
                                                            <><Check size={12} /> 선택됨 — 편집하기</>
                                                        ) : (
                                                            "선택하기"
                                                        )}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUnlock(style)}
                                                        disabled={!canAfford}
                                                        className="w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-40"
                                                        style={{
                                                            background: canAfford ? "var(--highlight)" : "var(--surface-3)",
                                                            color: canAfford ? "#7c4a00" : "var(--foreground-muted)",
                                                        }}
                                                    >
                                                        {canAfford ? (
                                                            <><ShoppingBag size={11} /> ⭐ {style.xpCost} XP로 해금</>
                                                        ) : (
                                                            <><Lock size={11} /> ⭐ {style.xpCost} XP 필요</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── 옵션 에디터 뷰 ── */}
                    {view === "editor" && (
                        <div className="flex h-full overflow-hidden">
                            {/* 왼쪽: 미리보기 + 저장 */}
                            <div
                                className="flex flex-col items-center justify-center gap-5 shrink-0 p-6"
                                style={{ width: 220, borderRight: "1px solid var(--border)", background: "var(--surface)" }}
                            >
                                {/* 아바타 미리보기 */}
                                <div
                                    className="rounded-2xl overflow-hidden shadow-md"
                                    style={{
                                        width: 160,
                                        height: 160,
                                        background: options.backgroundColor ? `#${options.backgroundColor}` : "#f7f6f3",
                                        border: "2px solid var(--border)",
                                    }}
                                >
                                    <img
                                        src={previewUrl}
                                        alt="preview"
                                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-center" style={{ color: "var(--foreground-muted)" }}>
                                    실시간 미리보기
                                </p>

                                <button
                                    onClick={handleSave}
                                    className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                                    style={{ background: "var(--primary)", color: "white" }}
                                >
                                    <Check size={16} />
                                    저장하기
                                </button>

                                <button
                                    onClick={() => setView("styles")}
                                    className="w-full py-2 rounded-xl text-xs font-bold text-center transition-all hover:opacity-70"
                                    style={{ color: "var(--foreground-muted)" }}
                                >
                                    스타일 변경
                                </button>
                            </div>

                            {/* 오른쪽: 옵션 탭 + 값 선택 */}
                            <div className="flex flex-col flex-1 overflow-hidden">
                                {/* 옵션 탭 */}
                                <div
                                    className="flex items-center gap-1.5 px-4 py-3 shrink-0 overflow-x-auto no-scrollbar"
                                    style={{ borderBottom: "1px solid var(--border)" }}
                                >
                                    {activeStyle.options.map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => setActiveOptKey(opt.key)}
                                            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                                            style={{
                                                background: activeOptKey === opt.key ? "var(--foreground)" : "var(--surface-2)",
                                                color: activeOptKey === opt.key ? "var(--background)" : "var(--foreground-soft)",
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* 옵션 값 목록 */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {activeOption?.type === "avatar" && (
                                        <div className="flex flex-wrap gap-2">
                                            {activeOption.values.map(v => (
                                                <OptionAvatarPreview
                                                    key={v.value}
                                                    styleId={activeStyle.id}
                                                    optKey={activeOption.key}
                                                    optValue={v.value}
                                                    defaults={options}
                                                    selected={options[activeOption.key] === v.value}
                                                    onClick={() => handleOptionChange(activeOption.key, v.value)}
                                                    label={v.label}
                                                    hasProbability={activeOption.hasProbability}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {activeOption?.type === "color" && (
                                        <div className="flex flex-wrap gap-3">
                                            {activeOption.values.map(v => (
                                                <ColorSwatch
                                                    key={v.value}
                                                    color={v.color ?? `#${v.value}`}
                                                    label={v.label}
                                                    selected={options[activeOption.key] === v.value}
                                                    onClick={() => handleOptionChange(activeOption.key, v.value)}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {!activeOption && (
                                        <p className="text-sm text-center mt-8" style={{ color: "var(--foreground-muted)" }}>
                                            위에서 편집할 옵션을 선택하세요
                                        </p>
                                    )}
                                </div>

                                {/* 힌트 */}
                                <div
                                    className="px-4 py-3 shrink-0"
                                    style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
                                >
                                    <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                                        💡 옵션을 클릭하면 미리보기에 바로 반영돼요 · 저장 후 프로필에 적용됩니다
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof window === "undefined") return null;
    return createPortal(content, document.body);
}
