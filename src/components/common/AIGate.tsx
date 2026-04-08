"use client";

import React from "react";
import { Lock, Sparkles } from "lucide-react";
import { useAIAccess } from "@/lib/hooks/useAIAccess";

interface AIGateProps {
    children: React.ReactNode;
    /** "block" → 자식 대신 잠금 UI 렌더 (기본값) */
    mode?: "block" | "overlay";
    /** 잠금 UI 크기 */
    size?: "sm" | "md";
}

/**
 * AI 기능 접근 제어 래퍼.
 * - 권한 있으면 children 그대로 렌더.
 * - 권한 없으면 잠금 안내 UI 렌더.
 */
export function AIGate({ children, size = "md" }: AIGateProps) {
    const { hasAccess } = useAIAccess();
    if (hasAccess) return <>{children}</>;
    return <AILockBanner size={size} />;
}

/**
 * 인라인 잠금 배너 (버튼/섹션 대신 표시).
 */
export function AILockBanner({ size = "md" }: { size?: "sm" | "md" }) {
    const isSmall = size === "sm";
    return (
        <div
            className={`flex items-center gap-3 rounded-2xl ${isSmall ? "px-3 py-2" : "px-4 py-3"}`}
            style={{
                background: "linear-gradient(135deg, #8B5CF608, #4361EE08)",
                border: "1.5px dashed #8B5CF644",
            }}
        >
            <div
                className={`rounded-xl flex items-center justify-center shrink-0 ${isSmall ? "w-7 h-7" : "w-9 h-9"}`}
                style={{ background: "#8B5CF622" }}
            >
                <Lock size={isSmall ? 13 : 16} style={{ color: "#8B5CF6" }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`font-black ${isSmall ? "text-[11px]" : "text-xs"}`} style={{ color: "#8B5CF6" }}>
                    AI 기능 — 팀 배정 필요
                </p>
                <p className={`mt-0.5 leading-snug ${isSmall ? "text-[10px]" : "text-[11px]"}`} style={{ color: "var(--foreground-muted)" }}>
                    선생님께 팀 코드를 받거나 프리미엄 플랜을 이용해주세요.
                </p>
            </div>
            {!isSmall && (
                <button
                    disabled
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold opacity-50 cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #4361EE)", color: "white" }}
                >
                    <Sparkles size={11} /> 업그레이드
                </button>
            )}
        </div>
    );
}

/**
 * 버튼 위에 씌우는 잠금 오버레이 (버튼을 disabled처럼 보이게 + 자물쇠 뱃지).
 * children을 그대로 보여주되 클릭 시 잠금 토스트.
 */
export function AILockOverlay({
    children,
    onLocked,
}: {
    children: React.ReactNode;
    onLocked?: () => void;
}) {
    const { hasAccess } = useAIAccess();
    if (hasAccess) return <>{children}</>;

    return (
        <div className="relative" onClick={onLocked}>
            <div className="pointer-events-none opacity-40 select-none">{children}</div>
            <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl cursor-not-allowed"
                style={{ background: "rgba(139,92,246,0.08)" }}
            >
                <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
                    style={{ background: "var(--surface)", border: "1.5px solid #8B5CF644", color: "#8B5CF6", boxShadow: "0 2px 8px rgba(139,92,246,0.15)" }}
                >
                    <Lock size={11} /> 팀 배정 필요
                </div>
            </div>
        </div>
    );
}
