"use client";

import React, { useState, useEffect } from "react";
import GlassCard from "../common/GlassCard";
import { X, Sparkles, BookOpen, Calendar, Share2, Download, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useGameStore } from "@/store/useGameStore";

export default function AIReportModal() {
    const { isAIReportModalOpen, activeInsight, setAIReportModal, addSkillXP } = useGameStore();
    const [copied, setCopied] = useState(false);
    const [shared, setShared] = useState(false);

    // 리포트 열람 시 analytics XP 지급 (중복 방지: 모달 열릴 때 1회)
    useEffect(() => {
        if (isAIReportModalOpen && activeInsight) {
            addSkillXP("analytics", 10);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAIReportModalOpen, activeInsight?.id]);

    if (!isAIReportModalOpen || !activeInsight) return null;

    // 클립보드 복사
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(activeInsight.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback: textarea 방식
            const el = document.createElement("textarea");
            el.value = activeInsight.content;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // 공유하기
    const handleShare = async () => {
        const text = `📊 ${activeInsight.title}\n\n${activeInsight.content.slice(0, 200)}...`;
        if (navigator.share) {
            try {
                await navigator.share({ title: activeInsight.title, text });
            } catch {
                // 취소 등 무시
            }
        } else {
            // 브라우저 미지원 → 텍스트 클립보드 복사로 fallback
            await navigator.clipboard.writeText(text).catch(() => {});
            setShared(true);
            setTimeout(() => setShared(false), 2000);
        }
    };

    // PDF 저장 (브라우저 프린트 다이얼로그 → PDF로 저장)
    const handlePDF = () => {
        const win = window.open("", "_blank", "width=800,height=900");
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8" />
                <title>${activeInsight.title}</title>
                <style>
                    body { font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; padding: 48px; max-width: 720px; margin: 0 auto; color: #1a1a1a; line-height: 1.7; }
                    h1 { font-size: 28px; font-weight: 900; color: #FF6B35; margin-bottom: 8px; }
                    h2 { font-size: 20px; font-weight: 800; margin-top: 36px; margin-bottom: 12px; }
                    h3 { font-size: 16px; font-weight: 700; margin-top: 24px; margin-bottom: 8px; }
                    p  { font-size: 15px; margin-bottom: 16px; }
                    ul { padding-left: 20px; margin-bottom: 20px; }
                    li { font-size: 15px; margin-bottom: 8px; }
                    strong { color: #FF6B35; background: #FFF0EB; padding: 1px 4px; border-radius: 3px; }
                    blockquote { border-left: 4px solid #4361EE; padding: 12px 20px; background: #f5f7ff; margin: 24px 0; border-radius: 0 8px 8px 0; font-style: italic; }
                    hr { border: none; border-top: 1px solid #eee; margin: 32px 0; }
                    .footer { font-size: 11px; color: #aaa; margin-top: 48px; border-top: 1px solid #eee; padding-top: 12px; }
                    @media print { body { padding: 24px; } }
                </style>
            </head>
            <body>
                <h1>${activeInsight.title}</h1>
                <p style="font-size:12px;color:#888;margin-bottom:32px">${activeInsight.date} · AI Marketing Report</p>
                ${activeInsight.content
                    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
                    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
                    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
                    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
                    .replace(/^- (.+)$/gm, "<li>$1</li>")
                    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
                    .replace(/^---$/gm, "<hr>")
                    .replace(/\n\n/g, "</p><p>")
                    .replace(/^(?!<[hupbli])/gm, "<p>")
                    .replace(/(?<![>])$/gm, "</p>")
                }
                <div class="footer">* 본 리포트는 2026년 마케팅 트렌드 데이터를 기반으로 AI가 생성했습니다.</div>
                <script>window.onload = () => { window.print(); }</script>
            </body>
            </html>
        `);
        win.document.close();
    };

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
                                    h1: ({ node, ...props }) => <h1 className="text-4xl font-black mb-8 text-primary italic border-l-8 border-primary pl-6 py-2" style={{ wordBreak: "keep-all" }} {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-2xl font-black mb-4 text-foreground/90 mt-12 flex items-center gap-2 before:content-[''] before:w-2 before:h-2 before:bg-secondary before:rounded-full" style={{ wordBreak: "keep-all" }} {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-xl font-bold mb-3 text-foreground/80" style={{ wordBreak: "keep-all" }} {...props} />,
                                    p: ({ node, ...props }) => <p className="text-base mb-5 leading-relaxed text-foreground/70 font-medium" style={{ wordBreak: "keep-all" }} {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded shadow-sm" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-none mb-8 flex flex-col gap-3" {...props} />,
                                    li: ({ node, ...props }) => <li className="flex items-start gap-3 text-base text-foreground/80 before:content-['⚡'] before:mt-1 before:shrink-0" style={{ wordBreak: "keep-all" }} {...props} />,
                                    hr: ({ node, ...props }) => <hr className="my-12 border-foreground/5" {...props} />,
                                    blockquote: ({ node, ...props }) => <blockquote className="my-8 p-6 bg-foreground/5 rounded-3xl border-l-4 border-secondary italic text-base" style={{ wordBreak: "keep-all" }} {...props} />,
                                    table: ({ node, ...props }) => (
                                        <div className="overflow-x-auto my-6 rounded-2xl border" style={{ borderColor: "var(--border)" }}>
                                            <table className="w-full text-sm border-collapse" {...props} />
                                        </div>
                                    ),
                                    thead: ({ node, ...props }) => <thead style={{ background: "var(--surface-2)" }} {...props} />,
                                    th: ({ node, ...props }) => (
                                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider"
                                            style={{ color: "var(--foreground)", borderBottom: "2px solid var(--border)", wordBreak: "keep-all", minWidth: "80px" }}
                                            {...props} />
                                    ),
                                    td: ({ node, ...props }) => (
                                        <td className="px-4 py-3 text-sm leading-relaxed align-top"
                                            style={{ color: "var(--foreground-muted)", borderBottom: "1px solid var(--border)", wordBreak: "keep-all" }}
                                            {...props} />
                                    ),
                                }}
                            >
                                {activeInsight.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 md:p-8 border-t border-foreground/5 bg-foreground/[0.02] flex items-center justify-between gap-4">
                    <p className="text-xs font-bold text-foreground/30 italic hidden md:block">
                        * 본 리포트는 2026년 마케팅 트렌드 데이터를 기반으로 AI가 생성했습니다.
                    </p>
                    <div className="flex gap-2 ml-auto">
                        {/* 복사하기 */}
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black italic transition-all active:scale-95"
                            style={{
                                background: copied ? "rgba(6,214,160,0.15)" : "var(--surface-2)",
                                color: copied ? "var(--accent)" : "var(--foreground-soft)",
                            }}
                        >
                            {copied ? <Check size={15} /> : <Copy size={15} />}
                            {copied ? "복사됨!" : "내용 복사"}
                        </button>
                        {/* 공유하기 */}
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black italic transition-all active:scale-95"
                            style={{
                                background: shared ? "rgba(6,214,160,0.15)" : "var(--surface-2)",
                                color: shared ? "var(--accent)" : "var(--foreground-soft)",
                            }}
                        >
                            {shared ? <Check size={15} /> : <Share2 size={15} />}
                            {shared ? "복사됨!" : "공유하기"}
                        </button>
                        {/* PDF 저장 */}
                        <button
                            onClick={handlePDF}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black italic transition-all active:scale-95 text-white"
                            style={{ background: "var(--primary)" }}
                        >
                            <Download size={15} /> PDF 저장
                        </button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
