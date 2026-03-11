"use client";

import React from "react";

interface IDCardProps {
    name: string;
    handle: string;
    team: string;
    rank: string;
    points: number;
    avatar: string;
    avatarConfig?: object;
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
        <div style={{
            position: "relative",
            userSelect: "none",
            width: 320,
            borderRadius: 32,
            background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
            boxShadow: `0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08), 0 0 80px ${rc.glow}`,
            overflow: "hidden",
            fontFamily: "inherit",
        }}>
            {/* 배경 글로우 패턴 */}
            <div style={{
                position: "absolute", top: -60, right: -60, width: 200, height: 200,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${rc.glow} 0%, transparent 70%)`,
                pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute", bottom: -40, left: -40, width: 160, height: 160,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(67,97,238,0.15) 0%, transparent 70%)",
                pointerEvents: "none",
            }} />

            {/* 상단 브랜드 바 */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{
                        fontWeight: 900,
                        fontStyle: "italic",
                        lineHeight: 1,
                        letterSpacing: "-0.04em",
                        fontSize: 28,
                        color: "#FF6B35",
                        textShadow: "0 0 20px rgba(255,107,53,0.5)",
                        display: "block",
                    }}>
                        SELL
                    </span>
                    <span style={{
                        fontWeight: 900,
                        fontStyle: "italic",
                        lineHeight: 1,
                        fontSize: 10,
                        color: "#FF6B35",
                        opacity: 0.7,
                        letterSpacing: "0.05em",
                        display: "block",
                    }}>
                        STAGRAM®
                    </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                    }} />
                    <span style={{
                        fontSize: 9, color: "rgba(255,255,255,0.3)",
                        fontWeight: 700, letterSpacing: "0.1em",
                        display: "block",
                    }}>
                        MARKETER ID
                    </span>
                </div>
            </div>

            {/* 아바타 영역 */}
            <div style={{
                height: 240,
                background: isUrl
                    ? "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 100%)"
                    : "linear-gradient(180deg, rgba(255,107,53,0.08) 0%, rgba(67,97,238,0.08) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
            }}>
                <div style={{
                    position: "absolute",
                    width: 200, height: 200,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${rc.glow} 0%, transparent 70%)`,
                    pointerEvents: "none",
                }} />
                {isUrl ? (
                    <img
                        src={avatar}
                        alt={name}
                        style={{ width: 180, height: 180, objectFit: "contain", position: "relative", zIndex: 1 }}
                    />
                ) : (
                    <span style={{ fontSize: 100, lineHeight: 1, position: "relative", zIndex: 1 }}>
                        {avatar || "🦊"}
                    </span>
                )}
            </div>

            {/* 정보 영역 */}
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                padding: "20px 24px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
            }}>
                {/* 이름 + 핸들 */}
                <div>
                    <h3 style={{
                        fontSize: 24,
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        color: "white",
                        lineHeight: 1.1,
                        margin: 0,
                    }}>
                        {name || "학생"}
                    </h3>
                    <p style={{
                        fontSize: 14,
                        marginTop: 4,
                        color: "rgba(255,255,255,0.45)",
                        margin: "4px 0 0 0",
                    }}>
                        @{handle} · {team}
                    </p>
                </div>

                {/* 랭크 + XP 배지 */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "6px 12px",
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        background: rc.bg,
                        color: rc.text,
                        border: `1px solid ${rc.text}40`,
                    }}>
                        {rank}
                    </span>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 9999,
                        background: "rgba(255,194,51,0.12)",
                        border: "1px solid rgba(255,194,51,0.25)",
                    }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFC233" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span style={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: "#FFC233",
                        }}>
                            {points.toLocaleString()} XP
                        </span>
                    </div>
                </div>
            </div>

            {/* 하단 꾸미기 버튼 */}
            {onCustomize && (
                <button
                    onClick={onCustomize}
                    data-html2canvas-ignore="true"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        width: "100%",
                        padding: "16px 0",
                        background: "linear-gradient(90deg, #FF6B35 0%, #e55b28 100%)",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 900,
                        letterSpacing: "0.02em",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="13.5" cy="6.5" r=".5" fill="white" />
                        <circle cx="17.5" cy="10.5" r=".5" fill="white" />
                        <circle cx="8.5" cy="7.5" r=".5" fill="white" />
                        <circle cx="6.5" cy="12.5" r=".5" fill="white" />
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                    </svg>
                    아바타 꾸미기
                </button>
            )}
        </div>
    );
}
