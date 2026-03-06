"use client";

import React from "react";
import GlassCard from "./GlassCard";
import {
    X,
    BookOpen,
    Target,
    MessageSquare,
    TrendingUp,
    Lightbulb,
    Sparkles,
    ArrowRight
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";

export default function GuideModal() {
    const { isGuideModalOpen, setGuideModalOpen } = useGameStore();

    if (!isGuideModalOpen) return null;

    const steps = [
        {
            icon: <Target className="text-primary" />,
            title: "상품 선정",
            desc: "셀러샵에서 마케팅할 상품을 고르세요. 각 상품은 고유한 타겟층이 있습니다."
        },
        {
            icon: <BookOpen className="text-secondary" />,
            title: "콘텐츠 기획",
            desc: "Z세대의 마음을 사로잡을 캡션과 해시태그를 작성하여 포스팅하세요."
        },
        {
            icon: <Sparkles className="text-accent" />,
            title: "AI 코칭",
            desc: "Gemini 3.1 Pro가 실시간으로 당신의 마케팅 전략을 정교하게 분석해줍니다."
        },
        {
            icon: <MessageSquare className="text-primary" />,
            title: "가상 반응",
            desc: "4명의 가상 페르소나가 당신의 게시물에 리얼한 댓글 반응을 남깁니다."
        },
        {
            icon: <TrendingUp className="text-secondary" />,
            title: "성과 분석",
            desc: "실제 매출 데이터와 인게이지먼트를 확인하며 마케팅 실력을 키우세요."
        },
        {
            icon: <Lightbulb className="text-accent" />,
            title: "미션 달성",
            desc: "주간 미션을 완료하고 보상을 얻어 더 큰 캠페인을 시작하세요!"
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
            <GlassCard className="w-full max-w-2xl p-0 overflow-hidden border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-xl">
                            <BookOpen size={24} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black italic tracking-tighter">Sellstagram Guide</h3>
                            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Master the Market in 2026</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setGuideModalOpen(false)}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X size={20} className="text-foreground/40" />
                    </button>
                </div>

                {/* Content - Bento Grid Inspired */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group animate-in slide-in-from-bottom-4 duration-500"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-background rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 border border-white/5">
                                    {step.icon}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h4 className="font-bold text-sm italic flex items-center gap-2">
                                        {step.title}
                                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </h4>
                                    <p className="text-[11px] text-foreground/50 leading-relaxed font-medium">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-8 pt-0">
                    <button
                        onClick={() => setGuideModalOpen(false)}
                        className="w-full py-4 bg-foreground text-background rounded-2xl font-black italic text-sm transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-xl"
                    >
                        준비 완료, 실습 시작하기!
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}
