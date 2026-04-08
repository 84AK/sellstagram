"use client";

import React from "react";
import { Lock } from "lucide-react";
import CharacterSVG from "./CharacterSVG";
import {
  CHARACTER_VARIANTS,
  SKIN_VARIANTS,
  VARIANT_BASE_TYPE,
  getCharacterLevel,
  getEvolutionStage,
  isSkinUnlocked,
} from "@/lib/characters/characters";

interface Props {
  marketerType: string;
  currentCharId: string;
  currentSkin: string;
  points: number;
  completedMissions: number;
  postCount: number;
  balance: number;
  onSelectChar: (id: string) => void;
  onSelectSkin: (id: string) => void;
  onClose: () => void;
}

export default function CharacterSelectPanel({
  marketerType, currentCharId, currentSkin,
  points, completedMissions, postCount, balance,
  onSelectChar, onSelectSkin, onClose,
}: Props) {
  const level = getCharacterLevel(points);
  const variants = CHARACTER_VARIANTS.filter(v => v.marketerType === marketerType);

  return (
    <div
      className="rounded-3xl p-4"
      style={{ background: "var(--surface-1)", border: "1.5px solid var(--border)" }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>
          파트너 선택
        </span>
        <button
          onClick={onClose}
          className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
          style={{ color: "var(--foreground-muted)", background: "var(--surface-2)" }}
        >
          닫기 ✕
        </button>
      </div>

      {/* ── 캐릭터 슬롯 3개 ── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {variants.map(v => {
          const isLocked   = level < v.unlockLevel;
          const isSelected = v.id === currentCharId;
          const baseType   = VARIANT_BASE_TYPE[v.id] ?? "creator";

          return (
            <button
              key={v.id}
              onClick={() => !isLocked && onSelectChar(v.id)}
              disabled={isLocked}
              className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all"
              style={{
                background:  isSelected ? v.bgColor : "var(--surface-2)",
                border:      isSelected ? `2px solid ${v.color}` : "2px solid transparent",
                opacity:     isLocked ? 0.55 : 1,
                cursor:      isLocked ? "default" : "pointer",
              }}
            >
              {/* 선택됨 체크 */}
              {isSelected && (
                <div
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                  style={{ background: v.color }}
                >✓</div>
              )}

              {/* 캐릭터 미리보기 */}
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
                  style={{ background: v.bgColor }}
                >
                  <CharacterSVG
                    type={baseType}
                    size={52}
                    anim="idle"
                    colorFilter={v.colorFilter}
                    stage={getEvolutionStage(level)}
                  />
                </div>
                {isLocked && (
                  <div
                    className="absolute inset-0 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.35)" }}
                  >
                    <Lock size={18} color="white" />
                  </div>
                )}
              </div>

              {/* 이름 */}
              <span className="text-[11px] font-black" style={{ color: isSelected ? v.color : "var(--foreground)" }}>
                {v.name}
              </span>

              {/* 잠금 조건 / 해금 상태 */}
              <span className="text-[10px] font-semibold" style={{ color: "var(--foreground-muted)" }}>
                {isLocked ? `Lv.${v.unlockLevel} 필요` : v.unlockLevel === 0 ? "기본" : `Lv.${v.unlockLevel} 해금`}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 스킨 선택 ── */}
      <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <span className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: "var(--foreground-muted)" }}>
          스킨
        </span>
        <div className="flex gap-2 flex-wrap">
          {SKIN_VARIANTS.map(skin => {
            const unlocked   = isSkinUnlocked(skin, level, completedMissions, postCount, balance);
            const isSelected = skin.id === currentSkin;
            const curVariant = CHARACTER_VARIANTS.find(v => v.id === currentCharId);
            const baseType   = curVariant ? (VARIANT_BASE_TYPE[curVariant.id] ?? "creator") : "creator";

            return (
              <button
                key={skin.id}
                onClick={() => unlocked && onSelectSkin(skin.id)}
                disabled={!unlocked}
                title={unlocked ? skin.label : skin.unlockDesc}
                className="relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all"
                style={{
                  background: isSelected ? "var(--surface-3, #e8e8e8)" : "var(--surface-2)",
                  border:     isSelected ? "2px solid var(--primary, #FF6B35)" : "2px solid transparent",
                  opacity:    unlocked ? 1 : 0.45,
                  cursor:     unlocked ? "pointer" : "default",
                  minWidth:   56,
                }}
              >
                {/* 미니 캐릭터 미리보기 */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{ background: curVariant?.bgColor ?? "#f5f5f5" }}
                >
                  <CharacterSVG
                    type={baseType}
                    size={34}
                    anim="idle"
                    colorFilter={curVariant?.colorFilter}
                    skinFilter={skin.cssFilter || undefined}
                  />
                </div>

                {/* 잠금 뱃지 */}
                {!unlocked && (
                  <div className="absolute top-0.5 right-0.5">
                    <Lock size={10} color="#888" />
                  </div>
                )}

                <span className="text-[10px] font-bold" style={{ color: "var(--foreground-muted)" }}>
                  {skin.emoji} {skin.label}
                </span>
                {!unlocked && (
                  <span className="text-[9px]" style={{ color: "var(--foreground-muted)", opacity: 0.8 }}>
                    {skin.unlockDesc}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
