"use client";

import React from "react";
import { buildAvatarUrl } from "@/lib/avatar/items";
import type { AvatarConfig } from "@/lib/avatar/types";
import { Zap } from "lucide-react";

interface IDCardProps {
    name: string;
    handle: string;
    team: string;
    rank: string;
    points: number;
    avatar: string;         // legacy emoji
    avatarConfig?: AvatarConfig;
    onCustomize?: () => void;
}

const RANK_COLORS: Record<string, string> = {
    Beginner:    "#94A3B8",
    Explorer:    "#06D6A0",
    Creator:     "#4361EE",
    Influencer:  "#FF6B35",
    Marketer:    "#FFC233",
    Teacher:     "#6C3483",
};

export default function IDCard({
    name, handle, team, rank, points, avatar, avatarConfig, onCustomize,
}: IDCardProps) {
    const hasConfig = avatarConfig && Object.keys(avatarConfig).length > 0;
    const avatarUrl = hasConfig
        ? buildAvatarUrl(avatarConfig!, handle || "user", 300)
        : null;

    const rankColor = RANK_COLORS[rank] ?? RANK_COLORS.Beginner;

    return (
        <div
            className="relative select-none"
            style={{
                width: 260,
                borderRadius: 24,
                background: "#fff",
                boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.06)",
            }}
        >
            {/* 상단 홀 */}
            <div className="flex justify-center pt-4 pb-1">
                <div
                    style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: "#E8E7E3", border: "2px solid #D1D0CC",
                    }}
                />
            </div>

            {/* 헤더 영역 */}
            <div className="flex items-start justify-between px-5 pb-3">
                {/* 브랜드 */}
                <div className="flex flex-col items-start">
                    <span
                        className="font-black italic leading-none tracking-tighter"
                        style={{ fontSize: 22, color: "#FF6B35", letterSpacing: "-0.04em" }}
                    >
                        SELL
                    </span>
                    <span
                        className="font-black italic leading-none tracking-tighter"
                        style={{ fontSize: 9, color: "#FF6B35", opacity: 0.6 }}
                    >
                        STAGRAM®
                    </span>
                </div>

                {/* 이름 + 정보 */}
                <div className="flex flex-col items-end gap-0.5 flex-1 ml-4">
                    <span className="font-black text-base tracking-tight" style={{ color: "#1A1A2E" }}>
                        {name || "학생"}
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: "#94A3B8" }}>
                        @{handle}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span
                            className="text-[9px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: `${rankColor}20`, color: rankColor }}
                        >
                            {rank}
                        </span>
                        <span
                            className="text-[9px] font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full"
                            style={{ background: "#FFF8E0", color: "#FFC233" }}
                        >
                            <Zap size={8} />
                            {points.toLocaleString()} XP
                        </span>
                    </div>
                    <span className="text-[10px] mt-0.5" style={{ color: "#CBD5E1" }}>
                        {team}
                    </span>
                </div>
            </div>

            {/* 아바타 영역 */}
            <div
                style={{
                    height: 200,
                    background: avatarConfig?.backgroundColor
                        ? `#${avatarConfig.backgroundColor}`
                        : "linear-gradient(135deg, #FFF0EB 0%, #EEF1FD 100%)",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={name}
                        style={{ width: 180, height: 180, objectFit: "contain" }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 w-full">
                        <span style={{ fontSize: 80, lineHeight: 1 }}>{avatar || "🦊"}</span>
                    </div>
                )}
            </div>

            {/* 하단 꾸미기 버튼 */}
            {onCustomize && (
                <button
                    onClick={onCustomize}
                    className="w-full py-3 flex items-center justify-center gap-2 text-xs font-black transition-all hover:opacity-80 active:scale-[0.98]"
                    style={{ background: "#FF6B35", color: "white" }}
                >
                    ✏️ 아바타 꾸미기
                </button>
            )}
        </div>
    );
}
