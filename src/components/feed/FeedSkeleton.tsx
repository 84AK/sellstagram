"use client";

import React from "react";

/**
 * FeedSkeleton — 피드 로딩 시 보여줄 Shimmer 효과의 스켈레톤 UI
 * 2026 트렌드에 맞는 부드러운 애니메이션 적용
 */
export default function FeedSkeleton() {
    return (
        <div className="flex flex-col gap-6 w-full animate-pulse-slow">
            {[1, 2, 3].map((i) => (
                <div 
                    key={i} 
                    className="max-w-md mx-auto w-full rounded-2xl overflow-hidden relative overflow-hidden" 
                    style={{ background: "var(--surface)", border: "1.5px solid var(--border)" }}
                >
                    {/* Shimmer 효과를 위한 내부 레이어 */}
                    <div className="absolute inset-0 z-0 pointer-events-none skew-x-[-20deg] shimmer-bar" />

                    {/* 카드 헤더 (유저 정보) */}
                    <div className="p-4 flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full" style={{ background: "var(--surface-3)" }} />
                        <div className="flex flex-col gap-2">
                            <div className="h-3 w-28 rounded-full" style={{ background: "var(--surface-3)" }} />
                            <div className="h-2 w-16 rounded-full" style={{ background: "var(--surface-2)" }} />
                        </div>
                    </div>

                    {/* 이미지 영역 스켈레톤 */}
                    <div className="w-full aspect-square relative z-10" style={{ background: "var(--surface-2)" }}>
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <div className="w-24 h-24 rounded-3xl border-4 border-dashed border-current" />
                        </div>
                    </div>

                    {/* 카드 하단 (액션 및 캡션) */}
                    <div className="p-4 flex flex-col gap-4 relative z-10">
                        {/* 액션 버튼들 */}
                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-lg" style={{ background: "var(--surface-3)" }} />
                            <div className="w-6 h-6 rounded-lg" style={{ background: "var(--surface-3)" }} />
                            <div className="w-6 h-6 rounded-lg" style={{ background: "var(--surface-3)" }} />
                        </div>

                        {/* 캡션 텍스트 */}
                        <div className="flex flex-col gap-2.5">
                            <div className="h-3 w-full rounded-full" style={{ background: "var(--surface-2)" }} />
                            <div className="h-3 w-4/5 rounded-full" style={{ background: "var(--surface-2)" }} />
                            <div className="h-3 w-3/5 rounded-full" style={{ background: "var(--surface-2)" }} />
                        </div>

                        {/* 해시태그 */}
                        <div className="flex gap-2">
                            <div className="h-6 w-16 rounded-xl" style={{ background: "var(--surface-3)", opacity: 0.6 }} />
                            <div className="h-6 w-20 rounded-xl" style={{ background: "var(--surface-3)", opacity: 0.6 }} />
                        </div>
                    </div>
                </div>
            ))}

            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateX(-150%) skewX(-20deg); }
                    100% { transform: translateX(250%) skewX(-20deg); }
                }
                .shimmer-bar {
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.05),
                        rgba(255, 255, 255, 0.1),
                        rgba(255, 255, 255, 0.05),
                        transparent
                    );
                    width: 50%;
                    height: 100%;
                    animation: shimmer 1.8s infinite linear;
                }
                .animate-pulse-slow {
                    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}
