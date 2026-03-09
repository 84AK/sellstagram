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
    DICEBEAR_STYLES,
    buildStyleUrl,
    getUnlockedStyleIds,
    addUnlockedStyle,
} from "@/lib/avatar/styles";

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


export default function ShopPage() {
    const { balance, addFunds, addPoints, user, setUploadModalOpen } = useGameStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [toast, setToast] = useState<{ name: string; xp: number } | null>(null);

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

    const currentAvatarUrl = user.avatar?.startsWith("http")
        ? user.avatar
        : buildStyleUrl("fun-emoji", {}, user.handle || "user", 200);

    return (
        <div className="flex flex-col gap-8 p-4 pt-12 lg:pt-16 max-w-6xl mx-auto pb-32">

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
                                const seeds = ["alpha", "beta", "gamma", "delta"];

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
                                        {/* 샘플 아바타 4개 */}
                                        <div
                                            className="flex gap-2 p-4 justify-center"
                                            style={{
                                                background: isUnlocked ? "var(--surface-2)" : "var(--surface-3)",
                                                filter: isUnlocked ? "none" : "grayscale(40%)",
                                            }}
                                        >
                                            {seeds.map(s => (
                                                <img
                                                    key={s}
                                                    src={buildStyleUrl(style.id, style.defaultOptions, s, 64)}
                                                    alt=""
                                                    className="rounded-lg"
                                                    style={{ width: 44, height: 44, objectFit: "contain", background: "#f7f6f3" }}
                                                    loading="lazy"
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
