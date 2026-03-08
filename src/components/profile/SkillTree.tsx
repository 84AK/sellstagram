"use client";

import React from "react";
import { SKILLS, getSkillLevel, getSkillProgress, SkillXP } from "@/lib/skills/skillTree";

interface SkillTreeProps {
    skillXP: SkillXP;
}

export default function SkillTree({ skillXP }: SkillTreeProps) {
    return (
        <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold px-1" style={{ color: "var(--foreground-muted)" }}>
                게시물 업로드, AI 분석, 챌린지 참여로 스킬 XP를 쌓고 마케팅 마스터가 되어보세요!
            </p>

            {SKILLS.map((skill) => {
                const xp = skillXP?.[skill.key] ?? 0;
                const level = getSkillLevel(xp);
                const progress = getSkillProgress(xp);
                const isMaxLevel = level.level === 5;

                return (
                    <div
                        key={skill.key}
                        className="rounded-2xl p-5 flex flex-col gap-4"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        {/* 스킬 헤더 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                    style={{ background: skill.bgColor }}
                                >
                                    {skill.icon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                            {skill.name}
                                        </span>
                                        <span
                                            className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                                            style={{ background: skill.bgColor, color: skill.color }}
                                        >
                                            {skill.nameEn}
                                        </span>
                                    </div>
                                    <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                        {skill.description}
                                    </p>
                                </div>
                            </div>

                            {/* 레벨 배지 */}
                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                                <div
                                    className="px-2.5 py-1 rounded-full text-[10px] font-black"
                                    style={{ background: level.color + "20", color: level.color }}
                                >
                                    Lv.{level.level}
                                </div>
                                <span className="text-[9px] font-bold" style={{ color: "var(--foreground-muted)" }}>
                                    {level.label}
                                </span>
                            </div>
                        </div>

                        {/* 진행 바 */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold" style={{ color: "var(--foreground-muted)" }}>
                                    {isMaxLevel ? "최고 레벨 달성!" : `${progress.current} / ${progress.next} XP`}
                                </span>
                                <span className="text-[10px] font-black" style={{ color: skill.color }}>
                                    {isMaxLevel ? "MAX" : `${progress.percent}%`}
                                </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${progress.percent}%`,
                                        background: `linear-gradient(90deg, ${skill.color}, ${skill.color}cc)`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* 레벨별 단계 표시 */}
                        <div className="flex gap-1.5">
                            {skill.levels.map((lv) => {
                                const reached = level.level >= lv.level;
                                return (
                                    <div
                                        key={lv.level}
                                        className="flex-1 flex flex-col items-center gap-1"
                                    >
                                        <div
                                            className="w-full h-1.5 rounded-full transition-colors duration-500"
                                            style={{ background: reached ? lv.color : "var(--border)" }}
                                        />
                                        <span
                                            className="text-[8px] font-bold"
                                            style={{ color: reached ? lv.color : "var(--foreground-muted)" }}
                                        >
                                            {lv.level}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 다음 레벨 해금 안내 */}
                        {!isMaxLevel && (
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                style={{ background: "var(--surface-2)" }}
                            >
                                <span className="text-sm">🔓</span>
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>
                                        다음 레벨 해금
                                    </span>
                                    <p className="text-[10px] font-semibold" style={{ color: "var(--foreground-soft)" }}>
                                        {skill.levels.find(l => l.level === level.level + 1)?.unlock}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* XP 획득 방법 */}
                        <p className="text-[9px] font-semibold" style={{ color: "var(--foreground-muted)" }}>
                            💡 {skill.howToEarn}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
