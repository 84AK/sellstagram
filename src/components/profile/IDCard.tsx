"use client";

import React from "react";
import { Zap, Palette } from "lucide-react";

interface IDCardProps {
    name: string;
    handle: string;
    team: string;
    rank: string;
    points: number;
    avatar: string;   // DiceBear URL (https://...) or legacy emoji
    avatarConfig?: object; // kept for backward compat, not used
    onCustomize?: () => void;
}

const RANK_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
    Beginner:   { bg: "#94A3B820", text: "#94A3B8", glow: "#94A3B840" },
    Explorer:   { bg: "#06D6A020", text: "#06D6A0", glow: "#06D6A040" },
    Creator:    { bg: "#4361EE20", text: "#4361EE", glow: "#4361EE40" },
    Influencer: { bg: "#FF6B3520", text: "#FF6B35", glow: "#FF6B3540" },
    Marketer:   { bg: "#FFC23320", text: "#FFC233", glow: "#FFC23340" },
    Teacher:    { bg: "#6C348320", text: "#6C3483", glow: "#6C348340" },
};

export default function IDCard({
    name, handle, team, rank, points, avatar, onCustomize,
}: IDCardProps) {
    const isUrl = avatar?.startsWith("http");
    const rc = RANK_COLORS[rank] ?? RANK_COLORS.Beginner;

    return (
        <div
            className="relative select-none"
            style={{
                width: 320,
                borderRadius: 32,
                background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
                boxShadow: `0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08), 0 0 80px ${rc.glow}`,
                overflow: "hidden",
            }}
        >
            {/* 배경 글로우 패턴 */}
            <div
                style={{
                    position: "absolute", top: -60, right: -60, width: 200, height: 200,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${rc.glow} 0%, transparent 70%)`,
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute", bottom: -40, left: -40, width: 160, height: 160,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(67,97,238,0.15) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}
            />

            {/* 상단 홀 + 브랜드 바 */}
            <div
                className="flex items-center justify-between px-6 pt-5 pb-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
                <div className="flex flex-col">
                    <span
                        className="font-black italic leading-none tracking-tighter"
                        style={{ fontSize: 28, color: "#FF6B35", letterSpacing: "-0.04em", textShadow: "0 0 20px rgba(255,107,53,0.5)" }}
                    >
                        SELL
                    </span>
                    <span
                        className="font-black italic leading-none"
                        style={{ fontSize: 10, color: "#FF6B35", opacity: 0.7, letterSpacing: "0.05em" }}
                    >
                        STAGRAM®
                    </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <div
                        style={{
                            width: 20, height: 20, borderRadius: "50%",
                            background: "rgba(255,255,255,0.1)",
                            border: "1.5px solid rgba(255,255,255,0.2)",
                        }}
                    />
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.1em" }}>
                        MARKETER ID
                    </span>
                </div>
            </div>

            {/* 아바타 영역 */}
            <div
                style={{
                    height: 240,
                    background: isUrl
                        ? "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 100%)"
                        : "linear-gradient(180deg, rgba(255,107,53,0.08) 0%, rgba(67,97,238,0.08) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* 원형 글로우 */}
                <div
                    style={{
                        position: "absolute",
                        width: 200, height: 200,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${rc.glow} 0%, transparent 70%)`,
                        pointerEvents: "none",
                    }}
                />
                {isUrl ? (
                    <img
                        src={avatar}
                        alt={name}
                        style={{ width: 200, height: 200, objectFit: "contain", position: "relative", zIndex: 1 }}
                    />
                ) : (
                    <span style={{ fontSize: 100, lineHeight: 1, position: "relative", zIndex: 1 }}>{avatar || "🦊"}</span>
                )}
            </div>

            {/* 정보 영역 */}
            <div
                className="flex flex-col gap-4 px-6 py-5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
                {/* 이름 + 핸들 */}
                <div>
                    <h3 className="text-2xl font-black tracking-tight" style={{ color: "white", lineHeight: 1.1 }}>
                        {name || "학생"}
                    </h3>
                    <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                        @{handle} · {team}
                    </p>
                </div>

                {/* 랭크 + XP */}
                <div className="flex items-center gap-3">
                    <span
                        className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider"
                        style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.text}40` }}
                    >
                        {rank}
                    </span>
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ background: "rgba(255,194,51,0.12)", border: "1px solid rgba(255,194,51,0.25)" }}
                    >
                        <Zap size={12} style={{ color: "#FFC233" }} />
                        <span className="text-xs font-black" style={{ color: "#FFC233" }}>
                            {points.toLocaleString()} XP
                        </span>
                    </div>
                </div>
            </div>

            {/* 하단 꾸미기 버튼 */}
            {onCustomize && (
                <button
                    onClick={onCustomize}
                    className="w-full py-4 flex items-center justify-center gap-2 text-sm font-black transition-all hover:opacity-80 active:scale-[0.98]"
                    style={{
                        background: "linear-gradient(90deg, #FF6B35 0%, #e55b28 100%)",
                        color: "white",
                        letterSpacing: "0.02em",
                    }}
                >
                    <Palette size={16} />
                    아바타 꾸미기
                </button>
            )}
        </div>
    );
}
