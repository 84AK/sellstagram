"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Trophy, Users, Clock, ChevronRight,
    BarChart2, Sparkles, Filter,
} from "lucide-react";
import { useABTestStore, calcABResult, ABTest, REASON_TAGS } from "@/store/useABTestStore";
import { useGameStore } from "@/store/useGameStore";

type FilterMode = "all" | "mine" | "active" | "closed";

const WINNER_COLORS = { a: "#FF6B35", b: "#4361EE", tie: "#06D6A0" };
const WINNER_LABELS = { a: "A 버전 승리", b: "B 버전 승리", tie: "동점" };

function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function getDuration(createdAt: string, endsAt: string) {
    const diff = new Date(endsAt).getTime() - new Date(createdAt).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}시간`;
    return `${Math.floor(hours / 24)}일`;
}

function ResultMiniBar({ aPct, bPct, winner }: { aPct: number; bPct: number; winner: "a" | "b" | "tie" }) {
    return (
        <div className="flex gap-1 items-center">
            <span className="text-[10px] font-black w-7 text-right" style={{ color: WINNER_COLORS.a }}>{aPct}%</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: "var(--surface-2)" }}>
                <div style={{ width: `${aPct}%`, background: WINNER_COLORS.a, borderRadius: "9999px 0 0 9999px" }} />
                <div style={{ width: `${bPct}%`, background: WINNER_COLORS.b, borderRadius: "0 9999px 9999px 0" }} />
            </div>
            <span className="text-[10px] font-black w-7" style={{ color: WINNER_COLORS.b }}>{bPct}%</span>
        </div>
    );
}

function ABHistoryCard({ test, myHandle, onClick }: {
    test: ABTest;
    myHandle: string;
    onClick: () => void;
}) {
    const result = calcABResult(test);
    const isMine = test.creatorHandle === myHandle;
    const myVote = test.votes.find(v => v.voterHandle === myHandle);
    const topReason = REASON_TAGS.find(r => {
        const top = Object.entries(result.reasons)
            .sort((a, b) => (b[1].a + b[1].b) - (a[1].a + a[1].b))[0];
        return top && r.id === top[0] && (top[1].a + top[1].b) > 0;
    });

    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.99] hover:shadow-md"
            style={{ background: "var(--surface)", border: "1.5px solid var(--border)" }}
        >
            {/* 헤더 */}
            <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {/* 상태 배지 */}
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{
                                background: test.status === "active" ? "#06D6A022" : "var(--surface-2)",
                                color:      test.status === "active" ? "#06D6A0"   : "var(--foreground-muted)",
                            }}>
                            {test.status === "active" ? "● 진행중" : "종료"}
                        </span>
                        {isMine && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                style={{ background: "#FF6B3522", color: "#FF6B35" }}>내 테스트</span>
                        )}
                        {myVote && !isMine && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                style={{ background: "#4361EE22", color: "#4361EE" }}>
                                투표함 ({myVote.choice.toUpperCase()})
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-black leading-snug" style={{ color: "var(--foreground)" }}>
                        {test.question}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "var(--foreground-muted)" }}>
                        @{test.creatorHandle} · {formatDate(test.createdAt)}
                    </p>
                </div>
                {/* 이미지 미리보기 */}
                <div className="flex gap-1 shrink-0">
                    {[test.variantA.image, test.variantB.image].map((img, i) => (
                        <div key={i} className="w-12 h-12 rounded-xl overflow-hidden relative"
                            style={{ border: "2px solid var(--border)" }}>
                            {img ? (
                                <img src={img} alt={`variant ${i === 0 ? "A" : "B"}`}
                                    className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-black"
                                    style={{ background: i === 0 ? "#FF6B3520" : "#4361EE20",
                                             color: i === 0 ? "#FF6B35" : "#4361EE" }}>
                                    {i === 0 ? "A" : "B"}
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-black"
                                style={{ background: i === 0 ? "#FF6B35CC" : "#4361EECC", color: "white" }}>
                                {i === 0 ? "A" : "B"}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 결과 바 */}
            <div className="px-4 pb-3">
                <ResultMiniBar aPct={result.aPct} bPct={result.bPct} winner={result.winner} />
            </div>

            {/* 푸터 */}
            <div className="px-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <Users size={11} style={{ color: "var(--foreground-muted)" }} />
                        <span className="text-[11px] font-bold" style={{ color: "var(--foreground-muted)" }}>
                            {result.total}표
                        </span>
                    </div>
                    {test.status === "closed" && result.total > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                            style={{ background: `${WINNER_COLORS[result.winner]}18` }}>
                            {result.winner !== "tie" && <Trophy size={10} style={{ color: WINNER_COLORS[result.winner] }} />}
                            <span className="text-[10px] font-black"
                                style={{ color: WINNER_COLORS[result.winner] }}>
                                {WINNER_LABELS[result.winner]}
                            </span>
                        </div>
                    )}
                    {topReason && result.total > 0 && (
                        <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                            {topReason.emoji} 이유 1위
                        </span>
                    )}
                </div>
                <ChevronRight size={14} style={{ color: "var(--foreground-muted)" }} />
            </div>
        </button>
    );
}

export default function ABTestHistoryPage() {
    const router = useRouter();
    const { tests, loading, loadTests } = useABTestStore();
    const { user } = useGameStore();
    const myHandle = user.handle;

    const [filter, setFilter] = useState<FilterMode>("all");

    useEffect(() => { loadTests(); }, []);

    const FILTER_OPTIONS: { id: FilterMode; label: string }[] = [
        { id: "all",    label: "전체" },
        { id: "active", label: "진행중" },
        { id: "closed", label: "종료된" },
        { id: "mine",   label: "내 테스트" },
    ];

    const filtered = tests.filter(t => {
        if (filter === "active") return t.status === "active";
        if (filter === "closed") return t.status === "closed";
        if (filter === "mine")   return t.creatorHandle === myHandle;
        return true;
    });

    // 통계 요약
    const closedTests = tests.filter(t => t.status === "closed");
    const totalVotes  = tests.reduce((s, t) => s + t.votes.length, 0);
    const myTests     = tests.filter(t => t.creatorHandle === myHandle);
    const myVoted     = tests.filter(t => t.votes.some(v => v.voterHandle === myHandle) && t.creatorHandle !== myHandle);

    return (
        <div className="min-h-screen pb-24" style={{ background: "var(--background)" }}>
            {/* 헤더 */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <button onClick={() => router.back()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
                    style={{ background: "var(--surface-2)", color: "var(--foreground)" }}>
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h1 className="text-base font-black" style={{ color: "var(--foreground)" }}>
                        AB 테스트 이력
                    </h1>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                        진행한 테스트 결과를 확인하세요
                    </p>
                </div>
                <BarChart2 size={20} style={{ color: "var(--primary)" }} />
            </div>

            <div className="max-w-xl mx-auto px-4 py-5 flex flex-col gap-5">

                {/* 통계 요약 카드 */}
                <div className="grid grid-cols-2 gap-2.5">
                    {[
                        { label: "전체 테스트",  value: tests.length,         emoji: "🧪" },
                        { label: "종료된 테스트", value: closedTests.length,   emoji: "✅" },
                        { label: "내가 만든",    value: myTests.length,        emoji: "🎯" },
                        { label: "내가 투표한",  value: myVoted.length,        emoji: "🗳️" },
                    ].map(item => (
                        <div key={item.label}
                            className="rounded-2xl px-4 py-3 flex items-center gap-3"
                            style={{ background: "var(--surface)", border: "1.5px solid var(--border)" }}>
                            <span className="text-xl">{item.emoji}</span>
                            <div>
                                <p className="text-lg font-black leading-none" style={{ color: "var(--foreground)" }}>
                                    {item.value}
                                </p>
                                <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                    {item.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 필터 탭 */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {FILTER_OPTIONS.map(opt => (
                        <button key={opt.id}
                            onClick={() => setFilter(opt.id)}
                            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                            style={{
                                background: filter === opt.id
                                    ? "linear-gradient(135deg, var(--primary), #FF9A72)"
                                    : "var(--surface-2)",
                                color: filter === opt.id ? "white" : "var(--foreground-soft)",
                                border: `1px solid ${filter === opt.id ? "transparent" : "var(--border)"}`,
                            }}>
                            {opt.label}
                            {opt.id === "all" ? ` (${tests.length})` :
                             opt.id === "active" ? ` (${tests.filter(t => t.status === "active").length})` :
                             opt.id === "closed" ? ` (${closedTests.length})` :
                             ` (${myTests.length})`}
                        </button>
                    ))}
                </div>

                {/* 목록 */}
                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="rounded-2xl h-36 animate-pulse"
                                style={{ background: "var(--surface-2)" }} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16">
                        <span className="text-4xl">🔍</span>
                        <p className="text-sm font-bold" style={{ color: "var(--foreground-muted)" }}>
                            {filter === "mine" ? "아직 만든 AB 테스트가 없어요" : "해당 조건의 테스트가 없어요"}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filtered.map(test => (
                            <ABHistoryCard
                                key={test.id}
                                test={test}
                                myHandle={myHandle}
                                onClick={() => router.push(`/ab-test/${test.id}`)}
                            />
                        ))}
                    </div>
                )}

                {/* 인사이트 배너 */}
                {closedTests.length >= 2 && (() => {
                    const myClosedWins = closedTests.filter(t => {
                        if (t.creatorHandle !== myHandle) return false;
                        const r = calcABResult(t);
                        return r.winner !== "tie" && r.total > 0;
                    });
                    if (myClosedWins.length === 0) return null;

                    // 가장 많이 선택된 이유 태그 통계
                    const reasonCount: Record<string, number> = {};
                    myClosedWins.forEach(t => {
                        const r = calcABResult(t);
                        const top = Object.entries(r.reasons)
                            .sort((a, b) => (b[1].a + b[1].b) - (a[1].a + a[1].b))[0];
                        if (top) reasonCount[top[0]] = (reasonCount[top[0]] || 0) + 1;
                    });
                    const topReasonId = Object.entries(reasonCount).sort((a, b) => b[1] - a[1])[0]?.[0];
                    const topReason = REASON_TAGS.find(r => r.id === topReasonId);

                    return (
                        <div className="rounded-2xl p-4 flex gap-3"
                            style={{ background: "linear-gradient(135deg, #8B5CF610, #4361EE08)",
                                     border: "1.5px solid #8B5CF630" }}>
                            <Sparkles size={18} style={{ color: "#8B5CF6", flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <p className="text-sm font-black" style={{ color: "#8B5CF6" }}>
                                    마케터 패턴 인사이트
                                </p>
                                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                                    내 테스트 {myClosedWins.length}개를 분석했어요.
                                    {topReason && ` 승리한 컨텐츠에서 '${topReason.emoji} ${topReason.label}'이(가) 가장 많이 선택됐어요. 이 요소를 다음 컨텐츠에 집중해보세요!`}
                                </p>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
