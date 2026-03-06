"use client";

import React from "react";
import GlassCard from "../common/GlassCard";
import { X, Sparkles, BookOpen, Calendar, Share2, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useGameStore } from "@/store/useGameStore";

export default function AIReportModal() {
    const { isAIReportModalOpen, activeInsight, setAIReportModal } = useGameStore();

    if (!isAIReportModalOpen || !activeInsight) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
            <GlassCard className="w-full max-w-4xl h-[90vh] p-0 overflow-hidden border-primary/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 md:p-8 border-b border-foreground/5 bg-background/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Sparkles size={24} className="text-primary animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black italic tracking-tighter text-foreground">
                                {activeInsight.title}
                            </h2>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">
                                <span className="flex items-center gap-1"><Calendar size={12} /> {activeInsight.date}</span>
                                <span className="w-1 h-1 bg-foreground/20 rounded-full" />
                                <span className="flex items-center gap-1"><BookOpen size={12} /> AI Marketing Report</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setAIReportModal(false)}
                        className="p-3 hover:bg-foreground/5 rounded-full transition-all hover:rotate-90"
                    >
                        <X size={24} className="text-foreground/40" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-gradient-to-b from-transparent to-primary/[0.02]">
                    <div className="max-w-3xl mx-auto">
                        <div className="prose-report">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-4xl font-black mb-8 text-primary italic border-l-8 border-primary pl-6 py-2" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-2xl font-black mb-4 text-foreground/90 mt-12 flex items-center gap-2 before:content-[''] before:w-2 before:h-2 before:bg-secondary before:rounded-full" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-xl font-bold mb-3 text-foreground/80" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-lg mb-6 leading-relaxed text-foreground/70 font-medium" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded shadow-sm" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-none mb-8 flex flex-col gap-3" {...props} />,
                                    li: ({ node, ...props }) => <li className="flex items-start gap-3 text-lg text-foreground/80 before:content-['⚡'] before:mt-1" {...props} />,
                                    hr: ({ node, ...props }) => <hr className="my-12 border-foreground/5" {...props} />,
                                    blockquote: ({ node, ...props }) => <blockquote className="my-8 p-6 bg-foreground/5 rounded-3xl border-l-4 border-secondary italic text-lg" {...props} />,
                                }}
                            >
                                {activeInsight.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 md:p-8 border-t border-foreground/5 bg-foreground/[0.02] flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground/30 italic">
                        * 본 리포트는 2026년 마케팅 트렌드 데이터를 기반으로 AI가 생성했습니다.
                    </p>
                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 text-xs font-black italic transition-all active:scale-95">
                            <Share2 size={16} /> 공유하기
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white hover:bg-primary/90 text-xs font-black italic transition-all shadow-lg shadow-primary/20 active:scale-95">
                            <Download size={16} /> PDF 저장
                        </button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
