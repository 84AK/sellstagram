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
    Gift,
    X,
    ChevronLeft,
    ChevronRight,
    Info,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { supabase } from "@/lib/supabase/client";
import {
    DICEBEAR_STYLES,
    buildStyleUrl,
    getUnlockedStyleIds,
    addUnlockedStyle,
} from "@/lib/avatar/styles";
import { RewardsContent } from "@/app/rewards/page";

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
    detail_images: string[] | null;
}


export default function ShopPage() {
    const { balance, addFunds, addPoints, user, setUploadModalOpen, setUploadPreFillProduct } = useGameStore();
    const [products, setProducts] = useState<Product[]>([]);
    // product_id → { quantity: 보유수량, sold_quantity: 판매된수량 }
    const [ownedInventory, setOwnedInventory] = useState<Map<string, { quantity: number; sold_quantity: number }>>(new Map());
    const [purchaseQtys, setPurchaseQtys] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [toast, setToast] = useState<{ name: string; xp: number } | null>(null);
    const [detailProduct, setDetailProduct] = useState<Product | null>(null);
    const [detailImgIdx, setDetailImgIdx] = useState(0);

    // 최상위 탭: 셀러샵 vs 리워드 마켓
    const [outerTab, setOuterTab] = useState<"shop" | "rewards">("shop");
    // 탭: 상점 vs 아바타
    const [activeTab, setActiveTab] = useState<"shop" | "avatar">("shop");
    // 아바타 스타일 해금
    const [unlockedStyleIds, setUnlockedStyleIds] = useState<string[]>([]);
    const [avatarToast, setAvatarToast] = useState<string | null>(null);
    const [buyingStyleId, setBuyingStyleId] = useState<string | null>(null);

    // 해금된 스타일 로드
    useEffect(() => {
        setUnlockedStyleIds(getUnlockedStyleIds());
    }, []);

    // 스타일 XP 구매
    const handleStyleUnlock = async (styleId: string) => {
        const style = DICEBEAR_STYLES.find(s => s.id === styleId);
        if (!style || unlockedStyleIds.includes(styleId) || user.points < style.xpCost) return;
        setBuyingStyleId(styleId);
        addPoints(-style.xpCost);
        addUnlockedStyle(styleId);
        setUnlockedStyleIds(prev => [...prev, styleId]);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                await supabase
                    .from("profiles")
                    .update({ points: user.points - style.xpCost })
                    .eq("id", session.user.id);
            }
        } catch {/* ignore */}
        setAvatarToast(style.nameKo);
        setTimeout(() => setAvatarToast(null), 3000);
        setBuyingStyleId(null);
    };

    // 상품 + 내 구매 목록 로드
    useEffect(() => {
        const load = async () => {
            // session은 로컬 캐시에서 빠르게 조회 후 products + purchases 동시 실행
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const [prodsRes, purchasesRes] = await Promise.all([
                fetch("/api/products").then(r => r.json()),
                userId
                    ? supabase.from("purchases").select("product_id, quantity, sold_quantity").eq("user_id", userId)
                    : Promise.resolve({ data: null }),
            ]);

            setProducts(prodsRes.data ?? []);

            if (purchasesRes.data) {
                const inv = new Map<string, { quantity: number; sold_quantity: number }>();
                (purchasesRes.data as { product_id: string; quantity: number; sold_quantity: number }[]).forEach(b => {
                    inv.set(b.product_id, { quantity: b.quantity ?? 1, sold_quantity: b.sold_quantity ?? 0 });
                });
                setOwnedInventory(inv);
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
        const qty = purchaseQtys[product.id] ?? 5;
        const totalCost = product.price * qty;
        if (purchasing || balance < totalCost) return;
        setPurchasing(product.id);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setPurchasing(null); return; }

        const existing = ownedInventory.get(product.id);
        let error;

        if (existing) {
            // 추가 구매: 수량만 증가
            ({ error } = await supabase
                .from("purchases")
                .update({ quantity: existing.quantity + qty })
                .eq("user_id", session.user.id)
                .eq("product_id", product.id));
        } else {
            // 최초 구매
            ({ error } = await supabase
                .from("purchases")
                .insert({ user_id: session.user.id, product_id: product.id, quantity: qty, sold_quantity: 0 }));
        }

        if (!error) {
            const newBalance = balance - totalCost;
            const xpGain = existing ? 0 : product.xp_bonus; // XP는 최초 구매 시에만
            addFunds(-totalCost);
            if (xpGain > 0) addPoints(xpGain);

            await supabase
                .from("profiles")
                .update({ balance: newBalance, ...(xpGain > 0 ? { points: user.points + xpGain } : {}) })
                .eq("id", session.user.id);

            const newQty = (existing?.quantity ?? 0) + qty;
            const newSold = existing?.sold_quantity ?? 0;
            setOwnedInventory(prev => new Map(prev).set(product.id, { quantity: newQty, sold_quantity: newSold }));
            setToast({ name: `${product.name} ${qty}개`, xp: xpGain });
            setTimeout(() => setToast(null), 3500);
        }
        setPurchasing(null);
    };

    const currentAvatarUrl = user.avatar?.startsWith("http")
        ? user.avatar
        : buildStyleUrl("fun-emoji", {}, user.handle || "user", 200);

    return (
        <div className="flex flex-col min-h-screen">
            {/* ── 최상위 탭 ── */}
            <div className="sticky top-0 z-20 px-4 py-4"
                style={{ background: "var(--background)", borderBottom: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="flex items-center gap-2">
                    {[
                        { id: "shop" as const,    icon: <ShoppingBag size={17} />, label: "셀러샵",    color: "#FF6B35" },
                        { id: "rewards" as const, icon: <Gift size={17} />,        label: "리워드 마켓", color: "#D97706" },
                    ].map(t => {
                        const active = outerTab === t.id;
                        return (
                            <button key={t.id} onClick={() => setOuterTab(t.id)}
                                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-black whitespace-nowrap transition-all active:scale-95"
                                style={{
                                    background: active ? t.color : "var(--surface-2)",
                                    color: active ? "white" : "var(--foreground-soft)",
                                    boxShadow: active ? `0 4px 14px ${t.color}44` : "none",
                                    transform: active ? "scale(1.03)" : "scale(1)",
                                }}>
                                <span style={{ opacity: active ? 1 : 0.6 }}>{t.icon}</span>
                                {t.label}
                                {active && <span className="w-1.5 h-1.5 rounded-full bg-white/70 ml-0.5" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 리워드 마켓 탭 */}
            {outerTab === "rewards" && <RewardsContent />}

            {/* 셀러샵 탭 */}
            {outerTab === "shop" && <div className="flex flex-col gap-8 p-4 pt-6 max-w-6xl mx-auto pb-32 w-full">

            {/* 아바타 구매 토스트 */}
            {avatarToast && (
                <div
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl"
                    style={{ background: "var(--secondary)", color: "white", minWidth: "300px" }}
                >
                    <Sparkles size={18} className="shrink-0" />
                    <p className="text-sm font-black">🎉 {avatarToast} 스타일 해금 완료! 프로필에서 사용해보세요</p>
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
                아바타 탭 — DiceBear 스타일 해금
            ══════════════════════════════════════════ */}
            {activeTab === "avatar" && (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* 왼쪽: 현재 아바타 + XP */}
                    <div className="shrink-0 flex flex-col items-center gap-4" style={{ width: 200 }}>
                        <div
                            className="rounded-3xl overflow-hidden shadow-xl"
                            style={{ width: 200, height: 200, background: "#f7f6f3", border: "2px solid var(--border)" }}
                        >
                            <img src={currentAvatarUrl} alt="my avatar" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
                            해금 후 프로필 페이지에서 아바타를 꾸며보세요
                        </p>
                    </div>

                    {/* 오른쪽: 스타일 카드 그리드 */}
                    <div className="flex-1">
                        <p className="text-sm font-black mb-4" style={{ color: "var(--foreground)" }}>
                            🎨 아바타 스타일 ({unlockedStyleIds.length}/{DICEBEAR_STYLES.length} 해금)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {DICEBEAR_STYLES.map(style => {
                                const isUnlocked = unlockedStyleIds.includes(style.id);
                                const isBuying = buyingStyleId === style.id;
                                const canAfford = user.points >= style.xpCost;
                                const seeds = ["alpha", "beta"];

                                return (
                                    <div
                                        key={style.id}
                                        className="flex flex-col rounded-2xl overflow-hidden transition-all"
                                        style={{
                                            background: "var(--surface)",
                                            border: isUnlocked
                                                ? "2px solid var(--accent)"
                                                : "1.5px dashed var(--border)",
                                        }}
                                    >
                                        {/* 샘플 아바타 2개 */}
                                        <div
                                            className="flex gap-3 p-4 justify-center items-center"
                                            style={{
                                                background: isUnlocked ? "var(--surface-2)" : "var(--surface-3)",
                                                filter: isUnlocked ? "none" : "grayscale(40%)",
                                                minHeight: 76,
                                            }}
                                        >
                                            {seeds.map(s => (
                                                <img
                                                    key={s}
                                                    src={buildStyleUrl(style.id, style.defaultOptions, s, 80)}
                                                    alt=""
                                                    className="rounded-xl"
                                                    style={{ width: 56, height: 56, objectFit: "contain", background: "#f7f6f3" }}
                                                    loading="lazy"
                                                    onError={e => {
                                                        const t = e.currentTarget;
                                                        t.style.display = "none";
                                                        const span = document.createElement("span");
                                                        span.style.fontSize = "32px";
                                                        span.textContent = style.emoji;
                                                        t.parentElement?.appendChild(span);
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {/* 정보 */}
                                        <div className="flex flex-col gap-3 p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{style.emoji}</span>
                                                <div>
                                                    <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>{style.nameKo}</p>
                                                    <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{style.description}</p>
                                                </div>
                                                {isUnlocked && (
                                                    <div className="ml-auto">
                                                        <CheckCircle size={18} style={{ color: "var(--accent)" }} />
                                                    </div>
                                                )}
                                            </div>

                                            {isUnlocked ? (
                                                <span
                                                    className="text-[11px] font-black px-3 py-2 rounded-xl text-center"
                                                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                                                >
                                                    ✓ 해금 완료 — 프로필에서 사용하기
                                                </span>
                                            ) : style.xpCost === 0 ? (
                                                <span
                                                    className="text-[11px] font-black px-3 py-2 rounded-xl text-center"
                                                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                                                >
                                                    무료
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleStyleUnlock(style.id)}
                                                    disabled={!canAfford || isBuying}
                                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-[0.97] disabled:cursor-not-allowed"
                                                    style={{
                                                        background: canAfford ? "var(--highlight)" : "var(--surface-3)",
                                                        color: canAfford ? "#7c4a00" : "var(--foreground-muted)",
                                                    }}
                                                >
                                                    {isBuying ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : !canAfford ? (
                                                        <><Lock size={11} /> ⭐ {style.xpCost.toLocaleString()} XP 필요</>
                                                    ) : (
                                                        <><Zap size={11} /> ⭐ {style.xpCost.toLocaleString()} XP로 해금</>
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
                        const inv = ownedInventory.get(product.id);
                        const isOwned = !!inv;
                        const remaining = inv ? inv.quantity - inv.sold_quantity : 0;
                        const qty = purchaseQtys[product.id] ?? 5;
                        const totalCost = product.price * qty;
                        const canAfford = balance >= totalCost;
                        const isBuying = purchasing === product.id;
                        const margin = product.price - product.cost;
                        const marginRate = product.cost > 0 ? Math.round((margin / product.cost) * 100) : 0;

                        return (
                            <GlassCard key={product.id} className="relative group p-0 overflow-hidden flex flex-col border-none transition-all duration-300 hover:scale-[1.02]">
                                {/* 상품 이미지 */}
                                <div className="aspect-[4/3] w-full relative flex items-center justify-center overflow-hidden cursor-pointer"
                                    style={{ background: "var(--surface-2)" }}
                                    onClick={() => { setDetailProduct(product); setDetailImgIdx(0); }}>
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
                                            style={{ background: remaining > 0 ? "var(--accent)" : "var(--foreground-muted)" }}>
                                            <CheckCircle size={11} />
                                            {remaining > 0 ? `${remaining}개 남음` : "재고 소진"}
                                        </div>
                                    )}
                                </div>

                                {/* 상품 정보 */}
                                <div className="p-5 flex-1 flex flex-col gap-4">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-lg font-black tracking-tight" style={{ color: "var(--foreground)" }}>
                                                {product.name}
                                            </h3>
                                            <button
                                                onClick={() => { setDetailProduct(product); setDetailImgIdx(0); }}
                                                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:opacity-80"
                                                style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}>
                                                <Info size={11} /> 상세 보기
                                            </button>
                                        </div>
                                        <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                                            {product.description}
                                        </p>
                                        {(product.detail_images?.length ?? 0) > 0 && (
                                            <p className="text-[10px] mt-1 font-bold" style={{ color: "var(--secondary)" }}>
                                                📸 상세 이미지 {product.detail_images!.length}장 · 콘텐츠 제작 시 랜딩에 자동 추가
                                            </p>
                                        )}
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

                                    {/* 수량 선택 */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>
                                                {isOwned ? "추가 구매 수량" : "구매 수량"}
                                            </span>
                                            <span className="text-xs font-black" style={{ color: "var(--primary)" }}>
                                                ₩{(product.price * qty).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {[5, 10, 20, 50].map(n => (
                                                <button
                                                    key={n}
                                                    onClick={() => setPurchaseQtys(prev => ({ ...prev, [product.id]: n }))}
                                                    className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                                                    style={{
                                                        background: qty === n ? "var(--secondary)" : "var(--surface-2)",
                                                        color: qty === n ? "white" : "var(--foreground-soft)",
                                                    }}
                                                >
                                                    {n}개
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 구매 + 콘텐츠 버튼 */}
                                    <div className="flex flex-col gap-2">
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
                                                <>{isOwned ? "추가 구매" : "구매 등록"} {qty}개 <ArrowRight size={15} /></>
                                            ) : (
                                                <><AlertCircle size={15} /> 잔액 부족</>
                                            )}
                                        </button>
                                        {isOwned && remaining > 0 && (
                                            <button
                                                onClick={() => {
                                                    setUploadPreFillProduct({
                                                        id: product.id,
                                                        name: product.name,
                                                        detailImages: product.detail_images ?? [],
                                                        price: product.price,
                                                    });
                                                    setUploadModalOpen(true, "mission");
                                                }}
                                                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                                                style={{ background: "var(--accent)", color: "white" }}
                                            >
                                                <Zap size={15} />
                                                콘텐츠 만들기 ({remaining}개 남음)
                                                <ArrowRight size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}

            {/* 안내 섹션 */}
            {ownedInventory.size > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "var(--secondary-light)", border: "1px solid rgba(67,97,238,0.15)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--secondary)" }}>
                        <Tag size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold" style={{ color: "var(--secondary)" }}>
                            {ownedInventory.size}종 상품 보유 중 · 총 {Array.from(ownedInventory.values()).reduce((a, v) => a + v.quantity - v.sold_quantity, 0)}개 재고
                        </p>
                        <p className="text-xs" style={{ color: "var(--foreground-soft)" }}>
                            콘텐츠를 올릴 때마다 재고가 1개씩 소진돼요. 재고가 없으면 목록에서 사라져요.
                        </p>
                    </div>
                </div>
            )}

            </> /* end shop tab */}
        </div>}

        {/* ══════════════════════════════════════════
            상품 상세 모달
        ══════════════════════════════════════════ */}
        {detailProduct && (() => {
            const dp = detailProduct;
            const allDetailImgs = [
                ...(dp.image_url ? [dp.image_url] : []),
                ...(dp.detail_images ?? []),
            ];
            const inv = ownedInventory.get(dp.id);
            const remaining = inv ? inv.quantity - inv.sold_quantity : 0;
            const qty = purchaseQtys[dp.id] ?? 5;
            const totalCost = dp.price * qty;
            const canAfford = balance >= totalCost;
            const isBuying = purchasing === dp.id;
            const margin = dp.price - dp.cost;
            const marginRate = dp.cost > 0 ? Math.round((margin / dp.cost) * 100) : 0;

            return (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.55)" }}
                    onClick={(e) => { if (e.target === e.currentTarget) setDetailProduct(null); }}>
                    <div className="w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col"
                        style={{ background: "var(--surface)", maxHeight: "90vh" }}>

                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-5 py-4 shrink-0"
                            style={{ borderBottom: "1px solid var(--border)" }}>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                                    style={{ color: "var(--foreground-muted)" }}>{dp.category}</p>
                                <h2 className="text-lg font-black" style={{ color: "var(--foreground)" }}>{dp.name}</h2>
                            </div>
                            <button onClick={() => setDetailProduct(null)}
                                className="p-2 rounded-xl" style={{ background: "var(--surface-2)" }}>
                                <X size={18} style={{ color: "var(--foreground-muted)" }} />
                            </button>
                        </div>

                        {/* 스크롤 본문 */}
                        <div className="flex-1 overflow-y-auto">

                            {/* 이미지 캐러셀 */}
                            {allDetailImgs.length > 0 && (
                                <div className="relative w-full aspect-[4/3] bg-black/5">
                                    <img
                                        src={allDetailImgs[detailImgIdx]}
                                        alt={`상품 이미지 ${detailImgIdx + 1}`}
                                        className="w-full h-full object-contain"
                                    />
                                    {allDetailImgs.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setDetailImgIdx(i => Math.max(0, i - 1))}
                                                disabled={detailImgIdx === 0}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
                                                style={{ background: "rgba(0,0,0,0.45)", color: "white" }}>
                                                <ChevronLeft size={18} />
                                            </button>
                                            <button
                                                onClick={() => setDetailImgIdx(i => Math.min(allDetailImgs.length - 1, i + 1))}
                                                disabled={detailImgIdx === allDetailImgs.length - 1}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
                                                style={{ background: "rgba(0,0,0,0.45)", color: "white" }}>
                                                <ChevronRight size={18} />
                                            </button>
                                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                                                {allDetailImgs.map((_, i) => (
                                                    <button key={i} onClick={() => setDetailImgIdx(i)}
                                                        className="w-1.5 h-1.5 rounded-full transition-all"
                                                        style={{ background: i === detailImgIdx ? "white" : "rgba(255,255,255,0.45)" }} />
                                                ))}
                                            </div>
                                            <span className="absolute top-3 right-3 text-[11px] font-bold px-2 py-1 rounded-full"
                                                style={{ background: "rgba(0,0,0,0.5)", color: "white" }}>
                                                {detailImgIdx + 1}/{allDetailImgs.length}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* 썸네일 줄 */}
                            {allDetailImgs.length > 1 && (
                                <div className="flex gap-2 px-5 py-3 overflow-x-auto">
                                    {allDetailImgs.map((img, i) => (
                                        <button key={i} onClick={() => setDetailImgIdx(i)}
                                            className="shrink-0 w-14 h-14 rounded-xl overflow-hidden transition-all"
                                            style={{ border: i === detailImgIdx ? "2px solid var(--primary)" : "2px solid transparent" }}>
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* 상품 설명 */}
                            <div className="px-5 py-4 flex flex-col gap-4">
                                {/* 가격 */}
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                                            style={{ color: "var(--foreground-muted)" }}>판매가</p>
                                        <p className="text-3xl font-black" style={{ color: "var(--primary)" }}>
                                            ₩{dp.price.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                            style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                                            마진율 +{marginRate}%
                                        </span>
                                        {dp.xp_bonus > 0 && (
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                                                style={{ background: "rgba(255,194,51,0.15)", color: "#D97706" }}>
                                                <Zap size={11} /> 구매 시 +{dp.xp_bonus} XP
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 설명 */}
                                {dp.description && (
                                    <div className="p-4 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                                        <p className="text-[11px] font-bold uppercase tracking-widest mb-2"
                                            style={{ color: "var(--foreground-muted)" }}>상품 설명</p>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap"
                                            style={{ color: "var(--foreground-soft)" }}>{dp.description}</p>
                                    </div>
                                )}

                                {/* 콘텐츠 제작 안내 */}
                                {(dp.detail_images?.length ?? 0) > 0 && (
                                    <div className="flex items-start gap-3 p-3.5 rounded-2xl"
                                        style={{ background: "rgba(67,97,238,0.07)", border: "1px solid rgba(67,97,238,0.15)" }}>
                                        <Sparkles size={15} style={{ color: "var(--secondary)", flexShrink: 0, marginTop: 1 }} />
                                        <p className="text-[12px] leading-relaxed" style={{ color: "var(--secondary)" }}>
                                            상품 구매 후 <strong>콘텐츠 만들기</strong>를 누르면 이 상세 이미지 {dp.detail_images!.length}장이
                                            피드 랜딩페이지에 자동으로 추가돼요!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 하단 버튼 영역 */}
                        <div className="px-5 py-4 flex flex-col gap-2 shrink-0"
                            style={{ borderTop: "1px solid var(--border)" }}>
                            {/* 수량 선택 */}
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold" style={{ color: "var(--foreground-muted)" }}>구매 수량</span>
                                <div className="flex gap-1.5 flex-1">
                                    {[5, 10, 20, 50].map(n => (
                                        <button key={n}
                                            onClick={() => setPurchaseQtys(prev => ({ ...prev, [dp.id]: n }))}
                                            className="flex-1 py-1.5 rounded-xl text-xs font-black transition-all"
                                            style={{
                                                background: qty === n ? "var(--secondary)" : "var(--surface-2)",
                                                color: qty === n ? "white" : "var(--foreground-soft)",
                                            }}>
                                            {n}개
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs font-black" style={{ color: "var(--primary)" }}>
                                    ₩{totalCost.toLocaleString()}
                                </span>
                            </div>
                            {/* 버튼 */}
                            <div className="flex gap-2">
                                <button
                                    disabled={!canAfford || isBuying}
                                    onClick={() => handlePurchase(dp)}
                                    className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                                    style={{
                                        background: canAfford ? "var(--foreground)" : "var(--surface-2)",
                                        color: canAfford ? "var(--background)" : "var(--foreground-muted)",
                                    }}>
                                    {isBuying ? <><Loader2 size={15} className="animate-spin" /> 구매 중...</>
                                        : canAfford ? <>{inv ? "추가 구매" : "구매 등록"} {qty}개</>
                                        : <><AlertCircle size={15} /> 잔액 부족</>}
                                </button>
                                {inv && remaining > 0 && (
                                    <button
                                        onClick={() => {
                                            setUploadPreFillProduct({
                                                id: dp.id,
                                                name: dp.name,
                                                detailImages: dp.detail_images ?? [],
                                                price: dp.price,
                                            });
                                            setUploadModalOpen(true, "mission");
                                            setDetailProduct(null);
                                        }}
                                        className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                                        style={{ background: "var(--accent)", color: "white" }}>
                                        <Zap size={15} />
                                        콘텐츠 만들기
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        })()}

        </div>
    );
}
