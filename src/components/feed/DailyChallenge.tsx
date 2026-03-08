"use client";

import React, { useEffect, useState } from "react";
import { Zap, Clock, ChevronRight, Flame } from "lucide-react";
import { getTodayChallenge, getSecondsUntilMidnight, type DailyChallenge } from "@/lib/challenges/dailyChallenges";
import { useGameStore } from "@/store/useGameStore";

function formatCountdown(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DailyChallenge() {
    const { setUploadModalOpen } = useGameStore();
    const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        setChallenge(getTodayChallenge());
        setCountdown(getSecondsUntilMidnight());

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    // 자정 넘으면 챌린지 교체
                    setChallenge(getTodayChallenge());
                    return getSecondsUntilMidnight();
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!challenge) return null;

    return (
        <div
            className="rounded-2xl overflow-hidden cursor-pointer select-none"
            style={{
                background: "linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FFC233 100%)",
                boxShadow: "0 8px 32px rgba(255,107,53,0.35)",
            }}
            onClick={() => setExpanded(v => !v)}
        >
            {/* 메인 배너 */}
            <div className="flex items-center gap-3 p-4">
                {/* 아이콘 */}
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-2xl">
                    {challenge.icon}
                </div>

                {/* 텍스트 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <Flame size={10} className="text-white/80" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/80">
                            오늘의 챌린지
                        </span>
                    </div>
                    <p className="text-sm font-black text-white truncate">
                        {challenge.theme}
                    </p>
                    <p className="text-[10px] text-white/70 font-semibold">
                        {challenge.strategy}
                    </p>
                </div>

                {/* 보상 + 화살표 */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20">
                        <Zap size={10} className="text-white" />
                        <span className="text-[11px] font-black text-white">+{challenge.bonusXP} XP</span>
                    </div>
                    <ChevronRight
                        size={16}
                        className="text-white/60 transition-transform duration-200"
                        style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
                </div>
            </div>

            {/* 펼쳐지는 상세 내용 */}
            {expanded && (
                <div
                    className="mx-3 mb-3 p-4 rounded-xl flex flex-col gap-3"
                    style={{ background: "rgba(0,0,0,0.2)" }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* 과제 설명 */}
                    <p className="text-sm text-white/90 font-semibold leading-relaxed">
                        {challenge.description}
                    </p>

                    {/* 꿀팁 */}
                    <div className="flex gap-2 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.15)" }}>
                        <span className="text-base shrink-0">💡</span>
                        <p className="text-[11px] text-white/85 leading-relaxed">
                            {challenge.tip}
                        </p>
                    </div>

                    {/* 보상 + 남은 시간 + CTA */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-white/60" />
                            <span className="text-[10px] font-bold text-white/60">
                                {formatCountdown(countdown)} 후 마감
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20">
                                <span className="text-[10px] font-black text-white">
                                    ₩{challenge.bonusPoints.toLocaleString()} 보너스
                                </span>
                            </div>
                            <button
                                onClick={() => setUploadModalOpen(true, "general")}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-orange-600 transition-all active:scale-95"
                                style={{ background: "white" }}
                            >
                                참여하기 <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
