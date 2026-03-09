"use client";

import React, { useState, useEffect } from "react";
import GlassCard from "@/components/common/GlassCard";
import {
    ShoppingBag,
    Tag,
    ArrowRight,
    Package,
    Coins,
    Search,
    CheckCircle,
    AlertCircle,
    Sparkles,
    Loader2,
    Image as ImageIcon,
    Zap,
    Palette,
    Lock,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { supabase } from "@/lib/supabase/client";
import {
    AVATAR_ITEMS,
    CATEGORY_ICONS,
    getOwnedItems,
    addOwnedItem,
    buildAvatarUrl,
    getItemPreviewUrl,
} from "@/lib/avatar/items";
import { DEFAULT_AVATAR_CONFIG } from "@/lib/avatar/types";
import type { AvatarCategory } from "@/lib/avatar/types";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    cost: number;
    category: string;
    stock: number;
    image_url: string | null;
    xp_bonus: number;
    is_active: boolean;
}

const AVATAR_CATEGORIES: AvatarCategory[] = ["헤어", "머리색", "눈", "입", "옷", "옷색상", "액세서리", "배경색"];
const RARITY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
    common: { bg: "var(--surface-2)", text: "var(--foreground-muted)", label: "일반" },
    rare:   { bg: "var(--secondary-light)", text: "var(--secondary)", label: "레어 ⭐" },
    epic:   { bg: "var(--primary-light)", text: "var(--primary)", label: "에픽 🔥" },
};

export default function ShopPage() {
    const { balance, addFunds, addPoints, user, setUploadModalOpen, setAvatarConfig } = useGameStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [toast, setToast] = useState<{ name: string; xp: number } | null>(null);

    // 탭: 상점 vs 아바타
    const [activeTab, setActiveTab] = useState<"shop" | "avatar">("shop");
    // 아바타 탭용
    const [avatarCategory, setAvatarCategory] = useState<AvatarCategory>("헤어");
    const [avatarOwned, setAvatarOwned] = useState<Set<string>>(new Set());
    const [avatarToast, setAvatarToast] = useState<string | null>(null);
    const [buyingAvatarId, setBuyingAvatarId] = useState<string | null>(null);

    // 아바타 보유 아이템 로드 (localStorage)
    useEffect(() => {
        const owned = getOwnedItems();
        const defaults = AVATAR_ITEMS.filter(i => i.isDefault).map(i => i.id);
        setAvatarOwned(new Set([...owned, ...defaults]));
    }, []);

    // 아바타 아이템 XP 구매
    const handleAvatarPurchase = async (itemId: string) => {
        const item = AVATAR_ITEMS.find(i => i.id === itemId);
        if (!item || avatarOwned.has(itemId) || user.points < item.xpPrice) return;
        setBuyingAvatarId(itemId);
        // XP 차감
        addPoints(-item.xpPrice);
        // localStorage에 저장
        addOwnedItem(itemId);
        setAvatarOwned(prev => new Set([...prev, itemId]));
        // Supabase points 업데이트 (옵션)
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                await supabase
                    .from("profiles")
                    .update({ points: user.points - item.xpPrice })
                    .eq("id", session.user.id);
            }
        } catch {/* ignore */}
        setAvatarToast(item.name);
        setTimeout(() => setAvatarToast(null), 3000);
        setBuyingAvatarId(null);
    };

    // 상품 + 내 구매 목록 로드
    useEffect(() => {
        const load = async () => {
            const [{ data: prods }, { data: { session } }] = await Promise.all([
                supabase.from("products").select("*").eq("is_active", true).order("created_at"),
                supabase.auth.getSession(),
            ]);
            setProducts(prods ?? []);

            if (session?.user?.id) {
                const { data: bought } = await supabase
                    .from("purchases")
                    .select("product_id")
                    .eq("user_id", session.user.id);
                setOwnedIds(new Set((bought ?? []).map((b: { product_id: string }) => b.product_id)));
            }
            setLoading(false);
        };
        load();
    }, []);

    const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

    const filtered = products.filter(p =>
        (selectedCategory === "All" || p.category === selectedCategory) &&
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePurchase = async (product: Product) => {
        if (purchasing || ownedIds.has(product.id) || balance < product.price) return;
        setPurchasing(product.id);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setPurchasing(null); return; }

        const { error } = await supabase.from("purchases").insert({
            user_id: session.user.id,
            product_id: product.id,
        });

        if (!error) {
            const newBalance = balance - product.price;
            const newPoints = user.points + product.xp_bonus;

            // Zustand 업데이트
            addFunds(-product.price);
            addPoints(product.xp_bonus);

            // DB에 잔액 차감 + XP 저장
            await supabase
                .from("profiles")
                .update({ balance: newBalance, points: newPoints })
                .eq("id", session.user.id);

            setOwnedIds(prev => new Set([...prev, product.id]));
            setToast({ name: product.name, xp: product.xp_bonus });
            setTimeout(() => setToast(null), 3500);
        }
        setPurchasing(null);
    };

    const avatarCategoryItems = AVATAR_ITEMS.filter(i => i.category === avatarCategory);
    const currentConfig = user.avatarConfig ?? DEFAULT_AVATAR_CONFIG;
    const previewUrl = buildAvatarUrl(currentConfig, user.handle || "user", 200);

    return (
        <div className="flex flex-col gap-8 p-4 pt-12 lg:pt-16 max-w-6xl mx-auto pb-32">

            {/* 아바타 구매 토스트 */}
            {avatarToast && (
                <div
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl"
                    style={{ background: "var(--secondary)", color: "white", minWidth: "300px" }}
                >
                    <Sparkles size={18} className="shrink-0" />
                    <p className="text-sm font-black">🎉 {avatarToast} 구매 완료! 아바타에서 착용해보세요</p>
                </div>
            )}

            {/* 구매 완료 토스트 */}
            {toast && (
                <div
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl"
                    style={{ background: "var(--accent)", color: "white", minWidth: "320px" }}
                >
                    <CheckCircle size={20} className="shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-black">{toast.name} 구매 완료!</p>
                        <p className="text-xs opacity-80 mt-0.5">+{toast.xp} XP 획득 · 이제 마케팅 콘텐츠를 올려보세요</p>
                    </div>
                    <button
                        onClick={() => { setToast(null); setUploadModalOpen(true, "mission"); }}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all hover:opacity-80"
                        style={{ background: "rgba(255,255,255,0.25)", color: "white" }}
                    >
                        콘텐츠 만들기
                        <ArrowRight size={13} />
                    </button>
                </div>
            )}

            {/* 헤더 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2" style={{ color: "var(--primary)" }}>
                        <ShoppingBag size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">Marketplace</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tighter italic font-outfit" style={{ color: "var(--foreground)" }}>
                        셀러 상점
                    </h1>
                    <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                        {activeTab === "shop" ? "상품을 구매하고 마케팅 실습을 시작하세요." : "XP를 사용해 나만의 아바타를 꾸며보세요."}
                    </p>
                </div>

                {/* 잔액 + XP */}
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>잔액</span>
                        <div className="flex items-center gap-1.5">
                            <Coins size={16} style={{ color: "var(--secondary)" }} />
                            <span className="text-xl font-black" style={{ color: "var(--foreground)" }}>₩{balance.toLocaleString()}</span>
                        </div>
                    </div>
                    <div style={{ width: 1, height: 36, background: "var(--border)" }} />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>보유 XP</span>
                        <div className="flex items-center gap-1.5">
                            <Zap size={16} style={{ color: "var(--highlight)" }} />
                            <span className="text-xl font-black" style={{ color: "var(--foreground)" }}>{user.points.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 메인 탭 */}
            <div className="flex gap-2 p-1.5 rounded-2xl w-fit" style={{ background: "var(--surface-2)" }}>
                {([
                    { key: "shop", label: "셀러 상점", icon: ShoppingBag },
                    { key: "avatar", label: "아바타 꾸미기", icon: Palette },
                ] as const).map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all"
                        style={{
                            background: activeTab === key ? "var(--foreground)" : "transparent",
                            color: activeTab === key ? "var(--background)" : "var(--foreground-soft)",
                        }}
                    >
                        <Icon size={15} />
                        {label}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════
                아바타 탭
            ══════════════════════════════════════════ */}
            {activeTab === "avatar" && (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* 아바타 프리뷰 */}
                    <div className="shrink-0 flex flex-col items-center gap-4">
                        <div
                            className="rounded-3xl overflow-hidden shadow-xl"
                            style={{
                                width: 200, height: 200,
                                background: currentConfig.backgroundColor ? `#${currentConfig.backgroundColor}` : "#ffffff",
                                border: "2px solid var(--border)",
                            }}
                        >
                            <img src={previewUrl} alt="my avatar" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>{user.name}</p>
                            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>현재 아바타</p>
                        </div>
                        <div
                            className="px-4 py-3 rounded-2xl flex flex-col gap-1 w-full text-center"
                            style={{ background: "var(--highlight-light)", border: "1px solid rgba(255,194,51,0.3)" }}
                        >
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--highlight-dark)" }}>
                                보유 XP
                            </p>
                            <div className="flex items-center justify-center gap-1.5">
                                <Zap size={16} style={{ color: "var(--highlight)" }} />
                                <span className="text-2xl font-black" style={{ color: "var(--foreground)" }}>
                                    {user.points.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <p className="text-[10px] text-center px-2" style={{ color: "var(--foreground-muted)" }}>
                            구매 후 프로필 페이지에서 착용하세요
                        </p>
                    </div>

                    {/* 아이템 목록 */}
                    <div className="flex-1 flex flex-col gap-4">
                        {/* 카테고리 탭 */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {AVATAR_CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setAvatarCategory(cat)}
                                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                                    style={{
                                        background: avatarCategory === cat ? "var(--foreground)" : "var(--surface-2)",
                                        color: avatarCategory === cat ? "var(--background)" : "var(--foreground-soft)",
                                    }}
                                >
                                    {CATEGORY_ICONS[cat]} {cat}
                                </button>
                            ))}
                        </div>

                        {/* 아이템 그리드 */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                            {avatarCategoryItems.map(item => {
                                const owned = avatarOwned.has(item.id);
                                const isBuying = buyingAvatarId === item.id;
                                const canAfford = user.points >= item.xpPrice;
                                const rs = RARITY_STYLE[item.rarity];
                                const previewUrl = getItemPreviewUrl(item, user.handle || "user");

                                return (
                                    <div
                                        key={item.id}
                                        className="relative flex flex-col items-center gap-2 rounded-2xl overflow-hidden transition-all"
                                        style={{
                                            background: owned ? "var(--surface)" : "var(--surface-2)",
                                            border: owned ? "2px solid var(--accent)" : "1.5px dashed var(--border)",
                                        }}
                                    >
                                        {/* 레어리티 뱃지 */}
                                        <span
                                            className="absolute top-2 left-2 z-10 text-[8px] font-black px-1.5 py-0.5 rounded-full"
                                            style={{ background: rs.bg, color: rs.text }}
                                        >
                                            {rs.label}
                                        </span>

                                        {/* 보유/잠금 뱃지 */}
                                        {owned && (
                                            <div
                                                className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center"
                                                style={{ background: "var(--accent)" }}
                                            >
                                                <CheckCircle size={12} className="text-white" />
                                            </div>
                                        )}
                                        {!owned && !item.isDefault && (
                                            <div
                                                className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center"
                                                style={{ background: "rgba(0,0,0,0.18)" }}
                                            >
                                                <Lock size={10} className="text-white" />
                                            </div>
                                        )}

                                        {/* DiceBear 아바타 미리보기 */}
                                        <div
                                            className="w-full flex items-center justify-center relative"
                                            style={{
                                                height: 110,
                                                background: item.slot === "backgroundColor"
                                                    ? `#${item.value || "f7f6f3"}`
                                                    : "var(--surface-3)",
                                                filter: !owned && !item.isDefault ? "grayscale(60%) opacity(0.7)" : "none",
                                            }}
                                        >
                                            <img
                                                src={previewUrl}
                                                alt={item.name}
                                                style={{ width: 90, height: 90, objectFit: "contain" }}
                                                loading="lazy"
                                            />
                                        </div>

                                        {/* 이름 + 버튼 */}
                                        <div className="flex flex-col items-center gap-1.5 px-2 pb-3 w-full">
                                            <p className="text-xs font-bold text-center leading-tight" style={{ color: "var(--foreground)" }}>
                                                {item.name}
                                            </p>

                                            {owned || item.isDefault ? (
                                                <span
                                                    className="text-[10px] font-bold px-3 py-1 rounded-full"
                                                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                                                >
                                                    {item.isDefault ? "무료" : "✓ 보유 중"}
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleAvatarPurchase(item.id)}
                                                    disabled={!canAfford || isBuying}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black transition-all active:scale-[0.97] disabled:cursor-not-allowed"
                                                    style={{
                                                        background: canAfford ? "var(--highlight)" : "var(--surface-3)",
                                                        color: canAfford ? "white" : "var(--foreground-muted)",
                                                    }}
                                                >
                                                    {isBuying ? (
                                                        <Loader2 size={10} className="animate-spin" />
                                                    ) : !canAfford ? (
                                                        <><Lock size={9} /> XP 부족</>
                                                    ) : (
                                                        <><Zap size={10} /> {item.xpPrice.toLocaleString()} XP</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════
                기존 상점 탭
            ══════════════════════════════════════════ */}
            {activeTab === "shop" && <>

            {/* 검색 + 카테고리 */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--foreground-muted)" }} />
                    <input
                        type="text"
                        placeholder="상품 검색..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: "var(--surface-2)", color: "var(--foreground)" }}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                            style={{
                                background: selectedCategory === cat ? "var(--foreground)" : "var(--surface-2)",
                                color: selectedCategory === cat ? "var(--background)" : "var(--foreground-soft)",
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 상품 목록 */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={28} className="animate-spin" style={{ color: "var(--primary)" }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Package size={40} style={{ color: "var(--foreground-muted)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
                        {products.length === 0 ? "선생님이 아직 상품을 등록하지 않았어요" : "검색 결과가 없어요"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map(product => {
                        const isOwned = ownedIds.has(product.id);
                        const canAfford = balance >= product.price;
                        const isBuying = purchasing === product.id;
                        const margin = product.price - product.cost;
                        const marginRate = product.cost > 0 ? Math.round((margin / product.cost) * 100) : 0;

                        return (
                            <GlassCard key={product.id} className="relative group p-0 overflow-hidden flex flex-col border-none transition-all duration-300 hover:scale-[1.02]">
                                {/* 상품 이미지 */}
                                <div className="aspect-[4/3] w-full relative flex items-center justify-center overflow-hidden"
                                    style={{ background: "var(--surface-2)" }}>
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <ImageIcon size={40} style={{ color: "var(--foreground-muted)" }} />
                                            <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{product.category}</span>
                                        </div>
                                    )}
                                    {/* 뱃지들 */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                                            style={{ background: "var(--background)", color: "var(--foreground-soft)", opacity: 0.9 }}>
                                            {product.category}
                                        </span>
                                        {product.xp_bonus > 0 && (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
                                                style={{ background: "var(--highlight)", color: "white" }}>
                                                <Zap size={9} />+{product.xp_bonus} XP
                                            </span>
                                        )}
                                    </div>
                                    {isOwned && (
                                        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black text-white"
                                            style={{ background: "var(--accent)" }}>
                                            <CheckCircle size={11} />보유 중
                                        </div>
                                    )}
                                </div>

                                {/* 상품 정보 */}
                                <div className="p-5 flex-1 flex flex-col gap-4">
                                    <div>
                                        <h3 className="text-lg font-black tracking-tight" style={{ color: "var(--foreground)" }}>
                                            {product.name}
                                        </h3>
                                        <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                                            {product.description}
                                        </p>
                                    </div>

                                    {/* 가격 정보 */}
                                    <div className="flex justify-between items-end pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--foreground-muted)" }}>판매가</p>
                                            <p className="text-xl font-black" style={{ color: "var(--primary)" }}>₩{product.price.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--foreground-muted)" }}>마진율</p>
                                            <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>+{marginRate}%</p>
                                        </div>
                                    </div>

                                    {/* 구매 / 실습 버튼 */}
                                    {isOwned ? (
                                        <button
                                            onClick={() => setUploadModalOpen(true, "mission")}
                                            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                                            style={{ background: "var(--accent)", color: "white" }}
                                        >
                                            <Zap size={15} />
                                            지금 콘텐츠 만들기
                                            <ArrowRight size={15} />
                                        </button>
                                    ) : (
                                        <button
                                            disabled={!canAfford || isBuying}
                                            onClick={() => handlePurchase(product)}
                                            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                                            style={{
                                                background: canAfford ? "var(--foreground)" : "var(--surface-2)",
                                                color: canAfford ? "var(--background)" : "var(--foreground-muted)",
                                            }}
                                        >
                                            {isBuying ? (
                                                <><Loader2 size={15} className="animate-spin" /> 구매 중...</>
                                            ) : canAfford ? (
                                                <>구매 및 실습 등록 <ArrowRight size={15} /></>
                                            ) : (
                                                <><AlertCircle size={15} /> 잔액 부족 (₩{(product.price - balance).toLocaleString()} 부족)</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}

            {/* 안내 섹션 */}
            {ownedIds.size > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "var(--secondary-light)", border: "1px solid rgba(67,97,238,0.15)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--secondary)" }}>
                        <Tag size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold" style={{ color: "var(--secondary)" }}>
                            {ownedIds.size}개 상품 보유 중
                        </p>
                        <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>
                            보유 상품으로 콘텐츠를 업로드하면 더 높은 시뮬레이션 효과를 얻을 수 있어요.
                        </p>
                    </div>
                </div>
            )}

            </> /* end shop tab */}
        </div>
    );
}
