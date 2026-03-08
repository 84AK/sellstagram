"use client";

import React from "react";
import { SKILLS, LEVELS, getSkillLevel, getSkillProgress, SkillXP } from "@/lib/skills/skillTree";

interface SkillTreeProps {
    skillXP: SkillXP;
}

export default function SkillTree({ skillXP }: SkillTreeProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SKILLS.map((skill) => {
                const xp = skillXP?.[skill.key] ?? 0;
                const level = getSkillLevel(xp);
                const progress = getSkillProgress(xp);
                const isMax = level.level === 5;
                const nextLevel = LEVELS.find(l => l.level === level.level + 1);

                return (
                    <div
                        key={skill.key}
                        className="rounded-2xl p-5 flex flex-col gap-4"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        {/* 헤더 */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                                    style={{ background: skill.bgColor }}
                                >
                                    {skill.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                        {skill.name}
                                    </p>
                                    <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                        {skill.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 레벨 + 도트 */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-1.5">
                                {LEVELS.map((lv) => {
                                    const reached = level.level >= lv.level;
                                    return (
                                        <div
                                            key={lv.level}
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all"
                                            style={{
                                                background: reached ? lv.color : "var(--surface-2)",
                                                color: reached ? "white" : "var(--foreground-muted)",
                                            }}
                                        >
                                            {lv.level}
                                        </div>
                                    );
                                })}
                            </div>
                            <span
                                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                style={{ background: level.color + "20", color: level.color }}
                            >
                                {level.label}
                            </span>
                        </div>

                        {/* XP 바 */}
                        <div className="flex flex-col gap-1.5">
                            <div
                                className="h-2 rounded-full overflow-hidden"
                                style={{ background: "var(--surface-2)" }}
                            >
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${progress.percent}%`,
                                        background: `linear-gradient(90deg, ${skill.color}, ${skill.color}cc)`,
                                    }}
                                />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[10px] font-bold" style={{ color: "var(--foreground-muted)" }}>
                                    {isMax ? "MAX" : `${progress.current} / ${progress.next} XP`}
                                </span>
                                <span className="text-[10px] font-black" style={{ color: skill.color }}>
                                    {isMax ? "🏆 완성" : `${progress.percent}%`}
                                </span>
                            </div>
                        </div>

                        {/* 다음 해금 */}
                        {!isMax && nextLevel && (
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px]"
                                style={{ background: "var(--surface-2)" }}
                            >
                                <span>🔓</span>
                                <span className="font-semibold" style={{ color: "var(--foreground-soft)" }}>
                                    Lv.{nextLevel.level} 달성 시 — {nextLevel.unlock}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
