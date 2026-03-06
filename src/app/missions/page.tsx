"use client";

import React from "react";
import MissionList from "@/components/dashboard/MissionList";
import GlassCard from "@/components/common/GlassCard";
import { Sparkles, Trophy, Target, ArrowRight } from "lucide-react";

export default function MissionsPage() {
    return (
        <div className="flex flex-col gap-8 p-4 pt-12 lg:pt-16 max-w-4xl mx-auto pb-32">
            {/* Hero Section */}
            <GlassCard className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-primary/20 overflow-hidden relative group">
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Trophy size={20} className="text-primary" />
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter">마케팅 마스터 미션</h1>
                    </div>
                    <p className="text-sm text-foreground/70 leading-relaxed max-w-lg italic">
                        "실제 시장 데이터를 기반으로 설계된 주간 미션입니다. 미션을 완료하고 마케팅 예산과 포인트를 획득하여 랭킹을 올리세요!"
                    </p>
                    <div className="flex gap-4 mt-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-foreground/40 uppercase">This Week Reward</span>
                            <span className="text-lg font-black italic text-primary">₩2,500,000 P</span>
                        </div>
                        <div className="w-[1px] h-full bg-foreground/10 mx-2" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-foreground/40 uppercase">Time Remaining</span>
                            <span className="text-lg font-black italic text-secondary">04:12:44</span>
                        </div>
                    </div>
                </div>
                <Sparkles className="absolute -right-6 -bottom-6 w-48 h-48 text-primary/5 group-hover:scale-125 transition-transform duration-1000" />
            </GlassCard>

            {/* Detailed Mission List */}
            <MissionList />

            {/* Footer Tip */}
            <div className="p-6 bg-foreground/5 rounded-3xl border border-foreground/5 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold italic">Tip: 게시물의 '인게이지먼트'를 높이려면 AI 코치의 조언을 적극 활용하세요.</span>
                </div>
                <Target size={24} className="text-foreground/10" />
            </div>
        </div>
    );
}
