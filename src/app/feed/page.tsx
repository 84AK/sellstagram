"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
    Bell,
    Sparkles,
    Filter,
    Plus,
    GraduationCap,
    Flame,
    ChevronRight,
    Zap,
    Loader2,
} from "lucide-react";
import StoryBar from "@/components/feed/StoryBar";
import FeedCard from "@/components/feed/FeedCard";
import VideoPlayer from "@/components/feed/VideoPlayer";
import DailyChallenge from "@/components/feed/DailyChallenge";
import Insights from "@/components/dashboard/Insights";
import MyChannelFeed from "@/components/feed/MyChannelFeed";
import MyChannelUploadModal from "@/components/feed/MyChannelUploadModal";
import ABTestVoteCard from "@/components/feed/ABTestVoteCard";
import FeedSkeleton from "@/components/feed/FeedSkeleton";
import { useGameStore } from "@/store/useGameStore";
import { useABTestStore } from "@/store/useABTestStore";
import { supabase, DbPost } from "@/lib/supabase/client";

function dbPostToStorePost(p: DbPost) {
    return {
        id: p.id,
        type: p.type as "post" | "video",
        user: { name: p.user_name, handle: p.user_handle, avatar: p.user_avatar },
        content: p.type === "post" ? { image: p.image_url ?? "", caption: p.caption ?? "", tags: p.tags ?? [] } : undefined,
        description: p.description ?? undefined,
        musicName: p.music_name ?? undefined,
        stats: {
            likes: p.likes,
            engagement: p.engagement_rate,
            sales: p.sales ?? undefined,
            comments: p.comments ? String(p.comments) : undefined,
            shares: p.shares ? String(p.shares) : undefined,
        },
        timeAgo: new Date(p.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        createdAt: p.created_at,
        sellingPrice: p.selling_price ?? undefined,
        landingImages: p.landing_images ?? undefined,
        images: p.images && p.images.length > 0 ? p.images : undefined,
        adBudget: p.ad_budget ?? undefined,
    };
}

function calcStreak(posts: Array<{ user: { handle: string }; createdAt?: string }>, handle: string): number {
    const myDays = new Set(
        posts
            .filter(p => p.user.handle === handle && p.createdAt)
            .map(p => new Date(p.createdAt!).toDateString())
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (myDays.has(d.toDateString())) streak++;
        else if (i > 0) break;
    }
    return streak;
}

const PAGE_SIZE = 10;

export default function FeedPage() {
    // 셀렉터로 필요한 필드만 구독 → 무관한 store 변경(balance 등)에 리렌더링 방지
    const posts = useGameStore(s => s.posts);
    const week = useGameStore(s => s.week);
    const user = useGameStore(s => s.user);
    const setUploadModalOpen = useGameStore(s => s.setUploadModalOpen);
    const setGuideModalOpen = useGameStore(s => s.setGuideModalOpen);
    const addPost = useGameStore(s => s.addPost);
    const setWeek = useGameStore(s => s.setWeek);
    const { tests: abTests, loadTests: loadABTests } = useABTestStore();
    // A/B 테스트 Supabase 초기화
    React.useEffect(() => { loadABTests(); }, [loadABTests]);

    const [feedFilter, setFeedFilter] = useState<"latest" | "hot">("latest");
    const [classActive, setClassActive] = useState(false);
    const [activeMission, setActiveMission] = useState<{ title: string; description: string } | null>(null);
    const [feedTab, setFeedTab] = useState<"simulation" | "channel">("simulation");
    const [channelModalOpen, setChannelModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [dbOffset, setDbOffset] = useState(PAGE_SIZE);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const sortedPosts = feedFilter === "hot"
        ? [...posts].sort((a, b) => {
            const aL = typeof a.stats.likes === "number" ? a.stats.likes : parseFloat(String(a.stats.likes)) || 0;
            const bL = typeof b.stats.likes === "number" ? b.stats.likes : parseFloat(String(b.stats.likes)) || 0;
            return bL - aL;
          })
        : posts;

    const streak = calcStreak(posts, user.handle);

    const loadMorePosts = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const { data, error } = await supabase
            .from("posts")
            .select("*")
            .order("created_at", { ascending: false })
            .range(dbOffset, dbOffset + PAGE_SIZE - 1);
        if (!error && data) {
            setHasMore(data.length === PAGE_SIZE);
            setDbOffset(prev => prev + data.length);
            if (data.length > 0) {
                useGameStore.setState(state => ({
                    posts: [...state.posts, ...data.map(dbPostToStorePost)],
                }));
            }
        }
        setLoadingMore(false);
    }, [loadingMore, hasMore, dbOffset]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) loadMorePosts(); },
            { threshold: 0.1 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadMorePosts]);

    useEffect(() => {
        // 초기 데이터 4개 쿼리를 병렬로 실행 (순차 실행 대비 ~3배 빠름)
        const loadActiveMission = () => {
            supabase.from("missions").select("title, description").eq("is_active", true)
                .order("created_at", { ascending: true }).limit(1).single()
                .then(({ data }) => setActiveMission(data ?? null));
        };

        setIsLoading(true);
        setLoadError(false);
        Promise.all([
            supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(PAGE_SIZE),
            supabase.from("game_state").select("week").eq("id", 1).single(),
            supabase.from("app_settings").select("class_active").eq("id", 1).single(),
            supabase.from("missions").select("title, description").eq("is_active", true)
                .order("created_at", { ascending: true }).limit(1).single(),
        ]).then(([postsRes, gameRes, settingsRes, missionRes]) => {
            if (postsRes.error) { setLoadError(true); setIsLoading(false); return; }
            if (postsRes.data) {
                setHasMore(postsRes.data.length === PAGE_SIZE);
                if (postsRes.data.length > 0) {
                    useGameStore.setState({ posts: postsRes.data.map(dbPostToStorePost) });
                }
            }
            if (gameRes.data) setWeek(gameRes.data.week);
            if (settingsRes.data) setClassActive(settingsRes.data.class_active);
            setActiveMission(missionRes.data ?? null);
            setIsLoading(false);
        }).catch(() => { setLoadError(true); setIsLoading(false); });

        // 4개 테이블을 단일 채널로 통합 → Supabase 연결 수 75% 절감 (30명 접속 시 120→30채널)
        const feedChannel = supabase
            .channel("feed-all")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
                const newPost = dbPostToStorePost(payload.new as DbPost);
                addPost(newPost);
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_state" }, (payload) => {
                if (payload.new?.week) setWeek(payload.new.week);
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_settings" }, (payload) => {
                if (typeof payload.new?.class_active === "boolean") {
                    setClassActive(payload.new.class_active);
                }
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "missions" }, () => {
                loadActiveMission();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(feedChannel);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col lg:flex-row gap-8 p-4 pt-6 lg:pt-10 max-w-6xl mx-auto w-full overflow-x-hidden">

            {/* ── 메인 피드 영역 ── */}
            <div className="flex-1 flex flex-col gap-5 min-w-0 overflow-x-hidden">

                {/* 모바일 헤더 */}
                <header className="flex justify-between items-center px-1 md:hidden w-full">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, var(--primary), #FF9A72)" }}
                        >
                            <Zap size={16} className="text-white" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight font-outfit" style={{ color: "var(--foreground)" }}>
                            Sellstagram
                        </h1>
                    </div>
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={() => setUploadModalOpen(true)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "var(--primary)", boxShadow: "0 3px 10px var(--primary-glow)" }}
                        >
                            <Plus size={18} className="text-white" />
                        </button>
                        <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                            <Bell size={18} style={{ color: "var(--foreground-soft)" }} />
                        </button>
                    </div>
                </header>

                {/* 탭 전환 */}
                <div
                    className="flex gap-1 p-1 rounded-2xl"
                    style={{ background: "var(--surface-2)" }}
                >
                    {(["simulation", "channel"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFeedTab(tab)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all"
                            style={{
                                background: feedTab === tab ? "var(--surface)" : "transparent",
                                color: feedTab === tab ? "var(--foreground)" : "var(--foreground-muted)",
                                boxShadow: feedTab === tab ? "var(--shadow-sm)" : "none",
                            }}
                        >
                            {tab === "simulation" ? (
                                <><span>🎮</span><span>시뮬레이션</span></>
                            ) : (
                                <><span>📡</span><span>내 채널</span></>
                            )}
                        </button>
                    ))}
                </div>

                {/* 내 채널 탭 */}
                {feedTab === "channel" && (
                    <MyChannelFeed onOpenUpload={() => setChannelModalOpen(true)} />
                )}

                {/* ── 시뮬레이션 탭 콘텐츠 ── */}
                {feedTab === "simulation" && (<>

                {/* 수업 진행 배너 — 선생님이 수업 시작 눌렀을 때만 표시 */}
                {classActive ? (
                    <div
                        className="flex items-center justify-between px-4 py-3 rounded-2xl"
                        style={{ background: "var(--secondary-light)", border: "1.5px solid rgba(67,97,238,0.3)" }}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--secondary)" }}>
                                <GraduationCap size={16} className="text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                                    <p className="text-xs font-bold" style={{ color: "var(--secondary)" }}>
                                        {week}회차 수업 진행 중
                                    </p>
                                </div>
                                <p className="text-[10px]" style={{ color: "var(--foreground-soft)" }}>
                                    {user.team} · {user.name}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/session"
                            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                            style={{ background: "var(--secondary)", color: "white" }}
                        >
                            수업 보기
                            <ChevronRight size={13} />
                        </Link>
                    </div>
                ) : null}

                {/* 스토리 바 */}
                <StoryBar />

                {/* 이번 주 미션 히어로 카드 — 수업 진행 중 + 활성 미션 있을 때만 표시 */}
                {classActive && activeMission && <div
                    className="relative overflow-hidden rounded-2xl p-5"
                    style={{
                        background: "linear-gradient(135deg, #FF6B35 0%, #FF9A72 50%, #FFC233 100%)",
                        boxShadow: "0 8px 28px var(--primary-glow)",
                    }}
                >
                    <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10 bg-white" />
                    <div className="absolute -right-4 -bottom-10 w-32 h-32 rounded-full opacity-10 bg-white" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                                📚 {week}회차 미션
                            </span>
                        </div>

                        <h2 className="text-xl font-black text-white mb-1.5 font-outfit leading-tight">
                            {activeMission.title}
                        </h2>
                        <p className="text-sm text-white/80 mb-5 max-w-xs leading-relaxed">
                            {activeMission.description}
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setUploadModalOpen(true, "mission")}
                                className="flex-1 py-2.5 bg-white rounded-xl font-bold text-sm transition-all hover:bg-white/90 active:scale-[0.98]"
                                style={{ color: "var(--primary)" }}
                            >
                                🚀 실습 시작하기
                            </button>
                            <button
                                onClick={() => setGuideModalOpen(true)}
                                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-sm transition-all border border-white/20"
                            >
                                가이드
                            </button>
                        </div>
                    </div>
                </div>}

                {/* 개인 현황 빠른 요약 */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-4 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-center gap-1 mb-1.5">
                            <Flame size={14} style={{ color: "var(--primary)" }} />
                            <span className="text-[10px] font-bold uppercase" style={{ color: "var(--foreground-muted)" }}>연속 업로드</span>
                        </div>
                        <span className="text-2xl font-black" style={{ color: "var(--primary)" }}>{streak > 0 ? `${streak}일` : "-"}</span>
                    </div>
                    <div className="rounded-2xl p-4 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-center gap-1 mb-1.5">
                            <Sparkles size={14} style={{ color: "var(--secondary)" }} />
                            <span className="text-[10px] font-bold uppercase" style={{ color: "var(--foreground-muted)" }}>내 점수</span>
                        </div>
                        <span className="text-2xl font-black" style={{ color: "var(--secondary)" }}>{user.points}</span>
                    </div>
                </div>

                {/* 일일 마케팅 챌린지 — 모바일 전용 */}
                <div className="lg:hidden">
                    <DailyChallenge />
                </div>

                {/* 피드 헤더 */}
                <div className="flex justify-between items-center px-1 mt-2">
                    <h3 className="text-lg font-black font-outfit flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                        실시간 피드
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
                    </h3>
                    <div className="flex gap-1.5">
                        {(["latest", "hot"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFeedFilter(f)}
                                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                                style={{
                                    background: feedFilter === f ? "var(--primary)" : "var(--surface-2)",
                                    color: feedFilter === f ? "white" : "var(--foreground-soft)",
                                }}
                            >
                                {f === "latest" ? (
                                    <><Filter size={11} /> 최신</>
                                ) : (
                                    <><Flame size={11} /> 인기</>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* A/B 테스트 섹션 — 가로 스크롤 */}
                {(() => {
                    const activeTests = abTests.filter(t => t.status === "active");
                    if (activeTests.length === 0) return null;
                    return (
                        <div className="flex flex-col gap-2">
                            {/* 헤더 */}
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-black flex items-center gap-2" style={{ color: "#8B5CF6" }}>
                                    <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ background: "#8B5CF6" }} />
                                    진행 중인 A/B 테스트
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#8B5CF622", color: "#8B5CF6" }}>
                                    {activeTests.length}개
                                </span>
                            </div>

                            {/* 가로 스크롤 컨테이너 */}
                            <div
                                className="flex gap-3 overflow-x-auto pb-2 no-scrollbar"
                                style={{ scrollSnapType: "x mandatory" }}
                            >
                                {activeTests.map(t => (
                                    <div
                                        key={t.id}
                                        className="shrink-0"
                                        style={{ width: "min(88vw, 420px)", scrollSnapAlign: "start" }}
                                    >
                                        <ABTestVoteCard test={t} />
                                    </div>
                                ))}
                                {/* 오른쪽 여백 — 마지막 카드가 잘려 보이게 */}
                                <div className="shrink-0 w-4" />
                            </div>

                            {/* 페이지 인디케이터 (2개 이상일 때) */}
                            {activeTests.length > 1 && (
                                <div className="flex justify-center gap-1.5 mt-1">
                                    {activeTests.map((t, i) => (
                                        <span key={t.id} className="w-1.5 h-1.5 rounded-full transition-all"
                                            style={{ background: i === 0 ? "#8B5CF6" : "#8B5CF633" }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* 피드 목록 */}
                <div className="flex flex-col gap-6 pb-8">
                    {isLoading ? (
                        <FeedSkeleton />
                    ) : loadError ? (
                        <div className="text-center py-12 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground-soft)" }}>
                                피드를 불러오지 못했어요
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-xs font-bold px-4 py-2 rounded-xl text-white"
                                style={{ background: "var(--primary)" }}
                            >
                                새로고침
                            </button>
                        </div>
                    ) : sortedPosts.map(post => {
                        if (post.type === "video") {
                            return (
                                <div key={post.id} className="w-full max-w-sm mx-auto">
                                    <VideoPlayer
                                        id={post.id}
                                        user={post.user}
                                        description={post.description ?? ""}
                                        musicName={post.musicName ?? ""}
                                        stats={{
                                            likes: String(post.stats.likes),
                                            comments: post.stats.comments ?? "0",
                                            shares: post.stats.shares ?? "0",
                                        }}
                                    />
                                </div>
                            );
                        } else if (post.content) {
                            return (
                                <div key={post.id} className="max-w-md mx-auto w-full rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                                    <FeedCard
                                        id={post.id}
                                        user={post.user}
                                        content={post.content}
                                        stats={{
                                            likes: typeof post.stats.likes === "number" ? post.stats.likes : 0,
                                            engagement: post.stats.engagement ?? "",
                                            sales: post.stats.sales ?? "",
                                            comments: post.stats.comments,
                                            shares: post.stats.shares,
                                        }}
                                        timeAgo={post.timeAgo}
                                        sellingPrice={post.sellingPrice}
                                        landingImages={post.landingImages}
                                        images={post.images}
                                        adBudget={post.adBudget}
                                    />
                                </div>
                            );
                        }
                        return null;
                    })}

                    {/* 무한 스크롤 sentinel + 로딩 */}
                    {!isLoading && !loadError && (
                        <div ref={sentinelRef} className="flex justify-center py-4 pb-24">
                            {loadingMore ? (
                                <div className="flex items-center gap-2" style={{ color: "var(--foreground-muted)" }}>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-xs font-medium">피드 불러오는 중...</span>
                                </div>
                            ) : !hasMore && sortedPosts.length > 0 ? (
                                <p className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
                                    모든 게시물을 봤어요 ✓
                                </p>
                            ) : null}
                        </div>
                    )}
                </div>

                </>)}
            </div>

            {/* ── 사이드 대시보드 (LG+) ── */}
            <aside className="hidden lg:flex flex-col gap-5 w-80 shrink-0 sticky top-10 h-fit">
                <Insights />
                <DailyChallenge />
                <div className="px-2 py-1 text-[10px] flex flex-wrap gap-x-3 gap-y-1.5 uppercase tracking-wider font-bold" style={{ color: "var(--foreground-muted)" }}>
                    <Link href="#" className="hover:opacity-70 transition-opacity">이용약관</Link>
                    <Link href="#" className="hover:opacity-70 transition-opacity">개인정보</Link>
                    <Link href="#" className="hover:opacity-70 transition-opacity">도움말</Link>
                    <span>© 2026 SELLSTAGRAM</span>
                    <span style={{ color: "var(--border)" }}>·</span>
                    <Link
                        href="https://litt.ly/aklabs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-70 transition-opacity"
                        style={{ color: "var(--secondary)" }}
                    >
                        아크랩스
                    </Link>
                </div>
            </aside>

            {/* 모바일 FAB */}
            <button
                onClick={() => feedTab === "channel" ? setChannelModalOpen(true) : setUploadModalOpen(true)}
                className="fixed bottom-24 right-5 rounded-2xl flex items-center justify-center lg:hidden z-40 transition-all hover:scale-110 active:scale-95"
                style={{
                    width: "52px",
                    height: "52px",
                    background: feedTab === "channel"
                        ? "linear-gradient(135deg, var(--secondary), #6B8FFF)"
                        : "linear-gradient(135deg, var(--primary), #FF9A72)",
                    boxShadow: feedTab === "channel"
                        ? "0 6px 20px rgba(67,97,238,0.4)"
                        : "0 6px 20px var(--primary-glow)",
                }}
            >
                <Plus size={24} className="text-white" />
            </button>

            {/* 내 채널 업로드 모달 */}
            <MyChannelUploadModal
                isOpen={channelModalOpen}
                onClose={() => setChannelModalOpen(false)}
            />
        </div>
    );
}
