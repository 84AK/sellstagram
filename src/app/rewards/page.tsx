"use client";

import React, { useState, useEffect } from "react";
import {
    Gift,
    Coins,
    CheckCircle,
    AlertCircle,
    Loader2,
    ShoppingCart,
    Star,
    Sparkles,
    Crown,
    Zap,
    Package,
} from "lucide-react";
import GlassCard from "@/components/common/GlassCard";
import BrandLoader from "@/components/common/BrandLoader";
import { useGameStore } from "@/store/useGameStore";
import { supabase } from "@/lib/supabase/client";

interface RewardItem {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: "virtual" | "real" | "boost" | "frame";
    cost_points: number;
    quantity_limit: number | null;
    quantity_used: number;
    is_active: boolean;
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    frame:   { label: "프로필 프레임", color: "var(--primary)",   bg: "var(--primary-light)",  icon: <Crown size={12} /> },
    boost:   { label: "피드 부스트",   color: "var(--secondary)", bg: "rgba(67,97,238,0.1)",    icon: <Zap size={12} /> },
    virtual: { label: "가상 아이템",   color: "var(--accent)",    bg: "rgba(6,214,160,0.1)",    icon: <Sparkles size={12} /> },
    real:    { label: "실물 보상",     color: "#D97706",          bg: "rgba(217,119,6,0.1)",    icon: <Star size={12} /> },
};

export function RewardsContent() {
    const { user, addPoints } = useGameStore();
    const [items, setItems] = useState<RewardItem[]>([]);
    const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [toast, setToast] = useState<{ name: string; icon: string } | null>(null);
    const [activeType, setActiveType] = useState<string>("all");

    useEffect(() => {
        const load = async () => {
            const [{ data: rewardItems }, { data: { session } }] = await Promise.all([
                supabase.from("reward_items").select("*").eq("is_active", true).order("cost_points"),
                supabase.auth.getSession(),
            ]);
            setItems(rewardItems ?? []);

            if (session?.user?.id) {
                const { data: purchases } = await supabase
                    .from("reward_purchases")
                    .select("item_id")
                    .eq("user_id", session.user.id);
                setOwnedIds(new Set((purchases ?? []).map((p: { item_id: string }) => p.item_id)));
            }
            setLoading(false);
        };
        load();
    }, []);

    const types = ["all", ...Array.from(new Set(items.map(i => i.type)))];

    const filtered = activeType === "all" ? items : items.filter(i => i.type === activeType);

    const handlePurchase = async (item: RewardItem) => {
        if (purchasing || ownedIds.has(item.id) || user.points < item.cost_points) return;
        if (item.quantity_limit !== null && item.quantity_used >= item.quantity_limit) return;
        setPurchasing(item.id);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setPurchasing(null); return; }

        const { error } = await supabase.from("reward_purchases").insert({
            user_id: session.user.id,
            item_id: item.id,
            user_name: user.name,
            item_name: item.name,
        });

        if (!error) {
            // 포인트 차감
            addPoints(-item.cost_points);
            await supabase
                .from("profiles")
                .update({ points: user.points - item.cost_points })
                .eq("id", session.user.id);

            // 수량 증가
            await supabase
                .from("reward_items")
                .update({ quantity_used: item.quantity_used + 1 })
                .eq("id", item.id);

            setOwnedIds(prev => new Set([...prev, item.id]));
            setItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, quantity_used: i.quantity_used + 1 } : i
            ));
            setToast({ name: item.name, icon: item.icon });
            setTimeout(() => setToast(null), 3000);
        }
        setPurchasing(null);
    };

    const isSoldOut = (item: RewardItem) =>
        item.quantity_limit !== null && item.quantity_used >= item.quantity_limit;

    return (
        <div className="flex flex-col gap-8 p-4 pt-12 lg:pt-16 max-w-5xl mx-auto pb-32">

            {/* 구매 완료 토스트 */}
            {toast && (
                <div
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-top-2 duration-300"
                    style={{ background: "var(--accent)", color: "white", minWidth: "280px" }}
                >
                    <span className="text-2xl">{toast.icon}</span>
                    <div>
                        <p className="text-sm font-black">{toast.name} 획득!</p>
                        <p className="text-xs opacity-80">리워드 마켓에서 구매 완료됐어요 🎉</p>
                    </div>
                </div>
            )}

            {/* 헤더 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2" style={{ color: "var(--primary)" }}>
                        <Gift size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">Reward Market</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tighter italic font-outfit" style={{ color: "var(--foreground)" }}>
                        리워드 마켓
                    </h1>
                    <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                        마케팅 활동으로 모은 포인트를 사용해 보상을 받아보세요!
                    </p>
                </div>

                {/* 보유 포인트 */}
                <div
                    className="flex items-center gap-4 px-5 py-3 rounded-2xl shrink-0"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>
                            보유 포인트
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Coins size={16} style={{ color: "var(--highlight)" }} />
                            <span className="text-xl font-black" style={{ color: "var(--foreground)" }}>
                                {user.points.toLocaleString()} P
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>
                            보유 아이템
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Package size={16} style={{ color: "var(--accent)" }} />
                            <span className="text-xl font-black" style={{ color: "var(--foreground)" }}>
                                {ownedIds.size}개
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 타입 필터 */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
                {types.map(type => {
                    const meta = TYPE_META[type];
                    const isActive = activeType === type;
                    return (
                        <button
                            key={type}
                            onClick={() => setActiveType(type)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                            style={{
                                background: isActive
                                    ? (meta?.bg ?? "var(--foreground)")
                                    : "var(--surface-2)",
                                color: isActive
                                    ? (meta?.color ?? "var(--background)")
                                    : "var(--foreground-soft)",
                                border: isActive ? `1.5px solid ${meta?.color ?? "var(--border)"}` : "1.5px solid transparent",
                            }}
                        >
                            {type === "all" ? "전체" : meta?.label ?? type}
                        </button>
                    );
                })}
            </div>

            {/* 아이템 목록 */}
            {loading ? (
                <BrandLoader variant="section" />
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Gift size={40} style={{ color: "var(--foreground-muted)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
                        {items.length === 0
                            ? "선생님이 아직 리워드 아이템을 등록하지 않았어요"
                            : "해당 카테고리에 아이템이 없어요"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(item => {
                        const isOwned = ownedIds.has(item.id);
                        const canAfford = user.points >= item.cost_points;
                        const soldOut = isSoldOut(item);
                        const isBuying = purchasing === item.id;
                        const meta = TYPE_META[item.type] ?? TYPE_META.virtual;
                        const remaining = item.quantity_limit !== null
                            ? item.quantity_limit - item.quantity_used
                            : null;

                        return (
                            <GlassCard
                                key={item.id}
                                className="relative p-0 overflow-hidden flex flex-col border-none transition-all duration-300 hover:scale-[1.02]"
                            >
                                {/* 아이템 이미지 / 아이콘 영역 */}
                                <div
                                    className="flex items-center justify-center py-10 relative"
                                    style={{ background: meta.bg }}
                                >
                                    <span className="text-6xl">{item.icon}</span>

                                    {/* 타입 배지 */}
                                    <div
                                        className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black"
                                        style={{ background: "var(--background)", color: meta.color }}
                                    >
                                        {meta.icon}
                                        {meta.label}
                                    </div>

                                    {/* 보유 중 / 품절 배지 */}
                                    {isOwned && (
                                        <div
                                            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black text-white"
                                            style={{ background: "var(--accent)" }}
                                        >
                                            <CheckCircle size={11} /> 보유 중
                                        </div>
                                    )}
                                    {!isOwned && soldOut && (
                                        <div
                                            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black text-white"
                                            style={{ background: "var(--foreground-muted)" }}
                                        >
                                            품절
                                        </div>
                                    )}
                                </div>

                                {/* 아이템 정보 */}
                                <div className="p-5 flex flex-col gap-4 flex-1">
                                    <div>
                                        <h3 className="text-base font-black tracking-tight" style={{ color: "var(--foreground)" }}>
                                            {item.name}
                                        </h3>
                                        <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: "var(--foreground-muted)" }}>
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* 비용 + 수량 */}
                                    <div
                                        className="flex justify-between items-end pb-3"
                                        style={{ borderBottom: "1px solid var(--border)" }}
                                    >
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--foreground-muted)" }}>
                                                필요 포인트
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <Coins size={14} style={{ color: "var(--highlight)" }} />
                                                <p className="text-xl font-black" style={{ color: "var(--foreground)" }}>
                                                    {item.cost_points.toLocaleString()} P
                                                </p>
                                            </div>
                                        </div>
                                        {remaining !== null && (
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--foreground-muted)" }}>
                                                    잔여 수량
                                                </p>
                                                <p className="text-sm font-bold" style={{ color: remaining <= 3 ? "var(--primary)" : "var(--accent)" }}>
                                                    {remaining}개
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* 구매 버튼 */}
                                    {isOwned ? (
                                        <div
                                            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-white"
                                            style={{ background: "var(--accent)" }}
                                        >
                                            <CheckCircle size={15} /> 보유 중
                                        </div>
                                    ) : (
                                        <button
                                            disabled={!canAfford || isBuying || soldOut}
                                            onClick={() => handlePurchase(item)}
                                            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                                            style={{
                                                background: soldOut
                                                    ? "var(--surface-2)"
                                                    : canAfford ? "var(--foreground)" : "var(--surface-2)",
                                                color: soldOut
                                                    ? "var(--foreground-muted)"
                                                    : canAfford ? "var(--background)" : "var(--foreground-muted)",
                                            }}
                                        >
                                            {isBuying ? (
                                                <><Loader2 size={15} className="animate-spin" /> 처리 중...</>
                                            ) : soldOut ? (
                                                <><AlertCircle size={15} /> 품절</>
                                            ) : canAfford ? (
                                                <><ShoppingCart size={15} /> 포인트로 교환</>
                                            ) : (
                                                <><AlertCircle size={15} /> 포인트 부족 ({(item.cost_points - user.points).toLocaleString()}P 필요)</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}

            {/* 포인트 획득 안내 */}
            <div
                className="flex items-start gap-4 p-4 rounded-2xl"
                style={{ background: "rgba(255,194,51,0.1)", border: "1px solid rgba(255,194,51,0.25)" }}
            >
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#FFC233" }}
                >
                    <Coins size={18} className="text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold" style={{ color: "#D97706" }}>포인트 획득 방법</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-soft)" }}>
                        게시물 업로드 (+10~20P) · 오늘의 챌린지 참여 (+보너스P) · 미션 완료 · AI 분석 실행
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RewardsContent;
