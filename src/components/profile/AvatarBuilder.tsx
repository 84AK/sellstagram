"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Check, Lock, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import {
    AVATAR_ITEMS,
    CATEGORY_ICONS,
    AVATAR_CONFIG_KEY,
    buildAvatarUrl,
    getOwnedItems,
    getItemPreviewUrl,
} from "@/lib/avatar/items";
import type { AvatarConfig, AvatarCategory, AvatarItemDef } from "@/lib/avatar/types";
import { DEFAULT_AVATAR_CONFIG } from "@/lib/avatar/types";

interface AvatarBuilderProps {
    initialConfig: AvatarConfig;
    seed: string;
    onSave: (config: AvatarConfig) => void;
    onClose: () => void;
}

// 아이템 미리보기 이미지 컴포넌트
function ItemPreview({ item, seed }: { item: import("@/lib/avatar/types").AvatarItemDef; seed: string }) {
    const url = getItemPreviewUrl(item, seed);
    return (
        <img
            src={url}
            alt={item.name}
            style={{ width: 64, height: 64, objectFit: "contain" }}
            loading="lazy"
        />
    );
}

const CATEGORIES: AvatarCategory[] = ["헤어", "머리색", "눈", "입", "옷", "옷색상", "액세서리", "배경색"];

const RARITY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
    common: { bg: "var(--surface-2)", text: "var(--foreground-muted)", label: "일반" },
    rare:   { bg: "#EEF1FD", text: "var(--secondary)", label: "레어" },
    epic:   { bg: "#FFF0EB", text: "var(--primary)", label: "에픽" },
};

export default function AvatarBuilder({ initialConfig, seed, onSave, onClose }: AvatarBuilderProps) {
    const [config, setConfig] = useState<AvatarConfig>({ ...DEFAULT_AVATAR_CONFIG, ...initialConfig });
    const [activeCategory, setActiveCategory] = useState<AvatarCategory>("헤어");
    const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
    const [imgKey, setImgKey] = useState(0); // force re-render on config change

    useEffect(() => {
        const owned = getOwnedItems();
        // Add all default (free) items as owned
        const defaults = AVATAR_ITEMS.filter(i => i.isDefault).map(i => i.id);
        setOwnedIds(new Set([...owned, ...defaults]));
    }, []);

    const previewUrl = buildAvatarUrl(config, seed, 300);

    const categoryItems = AVATAR_ITEMS.filter(i => i.category === activeCategory);

    const isEquipped = (item: AvatarItemDef): boolean => {
        const currentValue = config[item.slot as keyof AvatarConfig];
        return currentValue === item.value;
    };

    const handleSelect = (item: AvatarItemDef) => {
        if (!ownedIds.has(item.id)) return; // locked
        setConfig(prev => ({ ...prev, [item.slot]: item.value }));
        setImgKey(k => k + 1);
    };

    const handleSave = useCallback(() => {
        localStorage.setItem(AVATAR_CONFIG_KEY, JSON.stringify(config));
        onSave(config);
    }, [config, onSave]);

    const catIdx = CATEGORIES.indexOf(activeCategory);

    const content = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="relative flex flex-col overflow-hidden"
                style={{
                    width: "min(920px, 98vw)",
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
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "var(--primary)", color: "white" }}
                        >
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black italic tracking-tight" style={{ color: "var(--foreground)" }}>
                                아바타 꾸미기
                            </h2>
                            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                내 마케터 ID 카드를 완성해봐요 ✨
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-70"
                        style={{ background: "var(--surface-2)", color: "var(--foreground)" }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Preview */}
                    <div
                        className="flex flex-col items-center justify-center gap-6 shrink-0 p-8"
                        style={{ width: 260, borderRight: "1px solid var(--border)", background: "var(--surface)" }}
                    >
                        <div
                            className="rounded-2xl overflow-hidden shadow-lg"
                            style={{
                                width: 180, height: 180,
                                background: config.backgroundColor ? `#${config.backgroundColor}` : "#ffffff",
                                border: "2px solid var(--border)",
                            }}
                        >
                            <img
                                key={imgKey}
                                src={previewUrl}
                                alt="preview"
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            />
                        </div>
                        <p className="text-xs font-bold text-center" style={{ color: "var(--foreground-muted)" }}>
                            실시간 미리보기
                        </p>

                        {/* Save button */}
                        <button
                            onClick={handleSave}
                            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                            style={{ background: "var(--primary)", color: "white" }}
                        >
                            <Check size={16} />
                            저장하기
                        </button>
                    </div>

                    {/* Right: Items */}
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Category tabs */}
                        <div
                            className="flex items-center gap-1 px-4 py-3 shrink-0 overflow-x-auto no-scrollbar"
                            style={{ borderBottom: "1px solid var(--border)" }}
                        >
                            <button
                                onClick={() => setActiveCategory(CATEGORIES[Math.max(0, catIdx - 1)])}
                                disabled={catIdx === 0}
                                className="shrink-0 p-1.5 rounded-lg disabled:opacity-30"
                                style={{ background: "var(--surface-2)" }}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                                    style={{
                                        background: activeCategory === cat ? "var(--foreground)" : "var(--surface-2)",
                                        color: activeCategory === cat ? "var(--background)" : "var(--foreground-soft)",
                                    }}
                                >
                                    <span>{CATEGORY_ICONS[cat]}</span>
                                    {cat}
                                </button>
                            ))}
                            <button
                                onClick={() => setActiveCategory(CATEGORIES[Math.min(CATEGORIES.length - 1, catIdx + 1)])}
                                disabled={catIdx === CATEGORIES.length - 1}
                                className="shrink-0 p-1.5 rounded-lg disabled:opacity-30"
                                style={{ background: "var(--surface-2)" }}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* Items grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {categoryItems.map(item => {
                                    const owned = ownedIds.has(item.id);
                                    const equipped = isEquipped(item);
                                    const rs = RARITY_STYLE[item.rarity];

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            disabled={!owned}
                                            className="relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all group"
                                            style={{
                                                background: equipped ? "var(--primary-light)" : "var(--surface)",
                                                border: equipped
                                                    ? "2px solid var(--primary)"
                                                    : owned
                                                        ? "1.5px solid var(--border)"
                                                        : "1.5px dashed var(--border)",
                                                opacity: owned ? 1 : 0.55,
                                                cursor: owned ? "pointer" : "not-allowed",
                                                transform: equipped ? "scale(1.04)" : undefined,
                                            }}
                                        >
                                            {/* Rarity badge */}
                                            <span
                                                className="absolute top-2 left-2 text-[8px] font-black px-1.5 py-0.5 rounded-full"
                                                style={{ background: rs.bg, color: rs.text }}
                                            >
                                                {rs.label}
                                            </span>

                                            {/* Equipped checkmark */}
                                            {equipped && (
                                                <div
                                                    className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                                                    style={{ background: "var(--primary)" }}
                                                >
                                                    <Check size={10} className="text-white" />
                                                </div>
                                            )}

                                            {/* Lock icon for unowned */}
                                            {!owned && (
                                                <div
                                                    className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                                                    style={{ background: "var(--surface-3)" }}
                                                >
                                                    <Lock size={9} style={{ color: "var(--foreground-muted)" }} />
                                                </div>
                                            )}

                                            {/* DiceBear 미리보기 */}
                                            <div
                                                style={{
                                                    filter: !owned ? "grayscale(60%) opacity(0.6)" : "none",
                                                    background: item.slot === "backgroundColor"
                                                        ? `#${item.value || "f7f6f3"}`
                                                        : "var(--surface-3)",
                                                    borderRadius: 12,
                                                    padding: 4,
                                                    marginTop: 8,
                                                }}
                                            >
                                                <ItemPreview item={item} seed={seed} />
                                            </div>

                                            {/* Name */}
                                            <span
                                                className="text-[10px] font-bold text-center leading-tight"
                                                style={{ color: equipped ? "var(--primary)" : "var(--foreground-soft)" }}
                                            >
                                                {item.name}
                                            </span>

                                            {/* Price or owned */}
                                            <span
                                                className="text-[9px] font-bold"
                                                style={{ color: item.isDefault ? "var(--accent)" : owned ? "var(--accent)" : "var(--foreground-muted)" }}
                                            >
                                                {item.isDefault ? "무료" : owned ? "보유 중" : `🔒 잠김`}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bottom hint */}
                        <div
                            className="px-4 py-3 shrink-0"
                            style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
                        >
                            <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                                💡 잠긴 아이템은 셀러 상점 &gt; 아바타 탭에서 XP로 구매할 수 있어요
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof window === "undefined") return null;
    return createPortal(content, document.body);
}
