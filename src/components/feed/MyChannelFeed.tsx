"use client";

import React from "react";
import { Plus } from "lucide-react";

interface Props {
    onOpenUpload: () => void;
}

const PLATFORMS = [
    { emoji: "📱", label: "인스타그램", color: "#E1306C" },
    { emoji: "📝", label: "블로그",     color: "#03C75A" },
    { emoji: "🎬", label: "유튜브",     color: "#FF0000" },
    { emoji: "🐦", label: "X",          color: "#1DA1F2" },
];

const STEPS = [
    {
        number: "1",
        emoji: "🤖",
        title: "셀스타그램에서 AI 코칭 받기",
        desc: "시뮬레이션 피드에서 마케팅 게시물을 올리고 AI 코칭을 받아보세요.",
    },
    {
        number: "2",
        emoji: "✨",
        title: "플랫폼별로 자동 변환",
        desc: "내 채널 탭에서 내용을 입력하면 인스타그램, 블로그, 유튜브, X 형식으로 동시 변환됩니다.",
    },
    {
        number: "3",
        emoji: "📋",
        title: "복사해서 내 SNS에 붙여넣기",
        desc: "원하는 플랫폼 탭의 복사 버튼을 누르고 실제 SNS에 그대로 붙여넣으면 끝!",
    },
];

export default function MyChannelFeed({ onOpenUpload }: Props) {
    return (
        <div className="flex flex-col gap-5 pb-24">
            {/* 상단 안내 카드 */}
            <div
                className="rounded-2xl p-5"
                style={{
                    background: "linear-gradient(135deg, var(--secondary), #6B8FFF)",
                    boxShadow: "0 8px 28px rgba(67,97,238,0.28)",
                }}
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">📡</span>
                            <h2 className="text-xl font-black text-white font-outfit">내 채널</h2>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed mb-4 max-w-xs">
                            셀스타그램에서 진단받은 콘텐츠를 실제 SNS에 올려보세요
                        </p>
                        <button
                            onClick={onOpenUpload}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl font-bold text-sm transition-all hover:bg-white/90 active:scale-[0.97]"
                            style={{ color: "var(--secondary)" }}
                        >
                            <Plus size={15} />
                            콘텐츠 만들기
                        </button>
                    </div>
                    <div className="text-5xl opacity-20 select-none shrink-0">📡</div>
                </div>
            </div>

            {/* 연결 가능한 플랫폼 */}
            <div
                className="rounded-2xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--foreground-muted)" }}>
                    연결 가능한 플랫폼
                </h3>
                <div className="flex gap-2 flex-wrap mb-3">
                    {PLATFORMS.map((p) => (
                        <div
                            key={p.label}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                            style={{ background: `${p.color}15`, color: p.color }}
                        >
                            <span>{p.emoji}</span>
                            <span>{p.label}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    💬 AI가 각 플랫폼에 맞는 형식으로 자동 변환해드려요
                </p>
            </div>

            {/* 흐름 설명 3단계 */}
            <div
                className="rounded-2xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--foreground-muted)" }}>
                    이렇게 사용하세요
                </h3>
                <div className="flex flex-col gap-4">
                    {STEPS.map((s, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-white"
                                style={{ background: "var(--secondary)" }}
                            >
                                {s.number}
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span>{s.emoji}</span>
                                    <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                        {s.title}
                                    </p>
                                </div>
                                <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                                    {s.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA 버튼 */}
            <button
                onClick={onOpenUpload}
                className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:opacity-90"
                style={{
                    background: "linear-gradient(135deg, var(--secondary), #6B8FFF)",
                    color: "white",
                    boxShadow: "0 4px 16px rgba(67,97,238,0.3)",
                }}
            >
                <Plus size={16} />
                지금 바로 콘텐츠 만들기
            </button>
        </div>
    );
}
