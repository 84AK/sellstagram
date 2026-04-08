"use client";

import React from "react";
import CharacterSVG from "./CharacterSVG";
import {
  CHARACTERS,
  MARKETER_TO_CHARACTER,
  getCharacterLevel,
  getEvolutionStage,
  EVOLUTION_LABELS,
} from "@/lib/characters/characters";

interface PartnerCardProps {
  marketerType: string;
  points: number;
}

const STAT_LABELS: Record<string, string> = {
  creativity: "창의력",
  analytics: "분석력",
  persuasion: "설득력",
  trend: "트렌드",
  teamwork: "팀워크",
};

export default function PartnerCard({ marketerType, points }: PartnerCardProps) {
  const charType = MARKETER_TO_CHARACTER[marketerType];
  if (!charType) return null;

  const char = CHARACTERS[charType];
  const level = getCharacterLevel(points);
  const stage = getEvolutionStage(level);
  const xpForNext = (level - 1) * 200;
  const xpCurrent = points - xpForNext;
  const xpNeeded = 200;
  const progress = Math.min(100, (xpCurrent / xpNeeded) * 100);

  return (
    <div
      className="rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6"
      style={{
        background: char.bgColor,
        border: `2px solid ${char.borderColor}`,
      }}
    >
      {/* 캐릭터 */}
      <div className="relative shrink-0">
        <div
          className="w-36 h-36 rounded-3xl flex items-center justify-center"
          style={{ background: "white", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
        >
          <CharacterSVG type={charType} size={120} />
        </div>
        {/* 레벨 뱃지 */}
        <div
          className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-xl text-xs font-black text-white"
          style={{ background: char.color }}
        >
          Lv.{level}
        </div>
      </div>

      {/* 정보 */}
      <div className="flex flex-col gap-3 flex-1 w-full">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black" style={{ color: char.color }}>{char.name}</span>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: char.borderColor, color: char.color }}
              >
                {EVOLUTION_LABELS[stage]}
              </span>
            </div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: "#aaa" }}>{char.species}</div>
          </div>
        </div>

        {/* 이름+코멘트 */}
        <p className="text-sm font-semibold italic" style={{ color: "#888" }}>&quot;{char.quote}&quot;</p>

        {/* XP 바 */}
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1" style={{ color: "#aaa" }}>
            <span>다음 레벨까지</span>
            <span>{Math.min(xpCurrent, xpNeeded)} / {xpNeeded} XP</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: char.borderColor }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: char.color }}
            />
          </div>
        </div>

        {/* 스탯 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
          {Object.entries(char.baseStats).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 text-[11px] font-bold" style={{ color: "#777" }}>
              <span className="w-12 shrink-0">{STAT_LABELS[key]}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: char.borderColor }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${val}%`, background: char.color, opacity: 0.7 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
