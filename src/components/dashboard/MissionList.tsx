"use client";

import React from "react";
import GlassCard from "@/components/common/GlassCard";
import {
    Trophy,
    Target,
    CheckCircle2,
    Sparkles,
    Coins
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";

type Mission = {
    id: string;
    type: "revenue" | "posts" | "engagement" | "likes";
    targetRevenue: number;
    targetCount?: number;
    targetEngagement?: number;
    isCompleted: boolean;
    isActive: boolean;
};

type Post = {
    stats: { sales?: string | number; likes: number | string; engagement?: string };
};

function getMissionProgress(mission: Mission, posts: Post[]): { current: number; target: number } {
    if (mission.type === "posts") {
        return { current: posts.length, target: mission.targetCount ?? 1 };
    }
    if (mission.type === "revenue") {
        const total = posts.reduce((sum: number, p: Post) => {
            const raw = typeof p.stats.sales === "string"
                ? parseInt(p.stats.sales.replace(/[₩,]/g, "") || "0") : 0;
            return sum + raw;
        }, 0);
        return { current: total, target: mission.targetRevenue };
    }
    if (mission.type === "engagement") {
        const qualified = posts.filter((p: Post) => {
            const eng = parseFloat(typeof p.stats.engagement === "string" ? p.stats.engagement.replace("%", "") : "0");
            return eng >= (mission.targetEngagement ?? 10);
        });
        return { current: qualified.length, target: mission.targetCount ?? 1 };
    }
    if (mission.type === "likes") {
        const total = posts.reduce((sum: number, p: Post) => {
            const raw = typeof p.stats.likes === "number" ? p.stats.likes : parseInt(String(p.stats.likes).replace(/[k,]/gi, "000") || "0");
            return sum + raw;
        }, 0);
        return { current: total, target: mission.targetRevenue };
    }
    return { current: 0, target: 1 };
}

export default function MissionList() {
    const { missions, posts } = useGameStore();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black italic flex items-center gap-3 tracking-tighter">
                    <Trophy size={28} className="text-secondary" />
                    주간 미션 마일스톤
                </h2>
                <div className="flex items-center gap-2 bg-foreground/5 px-3 py-1.5 rounded-full border border-foreground/5">
                    <span className="text-[10px] font-bold text-foreground/40 uppercase">Progress</span>
                    <span className="text-xs font-black italic">{missions.filter(m => m.isCompleted).length}/{missions.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {missions.map((mission) => {
                    const { current, target } = getMissionProgress(mission, posts);
                    const pct = mission.isCompleted ? 100 : target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

                    return (
                    <GlassCard
                        key={mission.id}
                        className={`relative group overflow-hidden transition-all duration-500 ${mission.isCompleted ? "border-green-500/20 bg-green-500/[0.02]" : "hover:border-primary/20"
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${mission.isCompleted
                                        ? "bg-green-500 text-white border-green-500"
                                        : "bg-foreground/5 text-foreground/20 border-foreground/10"
                                    }`}>
                                    {mission.isCompleted ? <CheckCircle2 size={24} /> : <Target size={24} />}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className={`text-lg font-black italic tracking-tight ${mission.isCompleted ? "text-green-500" : ""}`}>
                                        {mission.title}
                                    </h3>
                                    <p className="text-xs text-foreground/50 leading-relaxed font-medium">
                                        {mission.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-lg border border-foreground/5">
                                    <Coins size={12} className="text-secondary" />
                                    <span className="text-[10px] font-black italic">+{mission.reward.toLocaleString()}</span>
                                </div>
                                <span className={`text-[10px] font-black italic ${mission.isCompleted ? "text-green-500" : "text-foreground/30"}`}>
                                    {pct}%
                                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        {!mission.isCompleted && (
                            <div className="mt-4 h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-700"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        )}

                        {/* Background Decoration */}
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            {mission.isCompleted ? <Sparkles size={80} /> : <Target size={80} />}
                        </div>

                        {/* Progress line for active mission */}
                        {!mission.isCompleted && (
                            <div className="absolute bottom-0 left-0 h-0.5 bg-primary/20 w-0 group-hover:w-full transition-all duration-700" />
                        )}
                    </GlassCard>
                    );
                })}
            </div>
        </div>
    );
}
