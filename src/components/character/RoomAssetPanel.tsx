"use client";

import React, { useState } from "react";
import { Lock, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import {
  ROOM_ASSETS,
  ASSET_CATEGORIES,
  isAssetUnlocked,
  AssetCategory,
} from "@/lib/room/assets";
import { useRoomStore, PlacedItem } from "@/store/useRoomStore";

interface Props {
  level: number;
  postCount: number;
  completedMissions: number;
  balance: number;
  onItemAdded: (assetName: string) => void;
  onClose: () => void;
}

const ROOM_THEMES = [
  { id: "cozy",    label: "아늑한",  bg: "#FFF3E0", border: "#FF6B35" },
  { id: "minimal", label: "미니멀",  bg: "#F5F5F5", border: "#9E9E9E" },
  { id: "night",   label: "나이트",  bg: "#1A1A2E", border: "#4361EE" },
  { id: "nature",  label: "자연",    bg: "#E8F5E9", border: "#06D6A0" },
  { id: "city",    label: "시티",    bg: "#E3F2FD", border: "#4361EE" },
  { id: "retro",   label: "레트로",  bg: "#FFF8E1", border: "#FFC233" },
] as const;

export default function RoomAssetPanel({
  level, postCount, completedMissions, balance, onItemAdded, onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<AssetCategory | "theme" | "placed">("furniture");
  const { placedItems, addItem, removeItem, scaleItem, roomTheme, setRoomTheme } = useRoomStore();

  const assetsInTab = activeTab !== "theme" && activeTab !== "placed"
    ? ROOM_ASSETS.filter(a => a.category === activeTab)
    : [];

  const handleAdd = (assetId: string, assetName: string) => {
    addItem(assetId);
    onItemAdded(assetName);
  };

  return (
    <div
      className="rounded-3xl p-4 flex flex-col gap-3"
      style={{
        background: "var(--surface-1, #fff)",
        border: "1.5px solid var(--border)",
        maxHeight: 420,
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>
          방 꾸미기
        </span>
        <button
          onClick={onClose}
          className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
          style={{ color: "var(--foreground-muted)", background: "var(--surface-2)" }}
        >
          닫기 ✕
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1.5 flex-wrap">
        {ASSET_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className="text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all"
            style={{
              background: activeTab === cat.id ? "var(--primary)" : "var(--surface-2)",
              color: activeTab === cat.id ? "#fff" : "var(--foreground-muted)",
            }}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
        <button
          onClick={() => setActiveTab("theme")}
          className="text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all"
          style={{
            background: activeTab === "theme" ? "var(--secondary)" : "var(--surface-2)",
            color: activeTab === "theme" ? "#fff" : "var(--foreground-muted)",
          }}
        >
          🎨 테마
        </button>
        <button
          onClick={() => setActiveTab("placed")}
          className="text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all"
          style={{
            background: activeTab === "placed" ? "var(--accent)" : "var(--surface-2)",
            color: activeTab === "placed" ? "#fff" : "var(--foreground-muted)",
          }}
        >
          📦 배치됨 ({placedItems.length})
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="overflow-y-auto flex-1 no-scrollbar">

        {/* 카테고리 에셋 */}
        {activeTab !== "theme" && activeTab !== "placed" && (
          <div className="grid grid-cols-2 gap-2">
            {assetsInTab.map(asset => {
              const unlocked    = isAssetUnlocked(asset, level, postCount, completedMissions, balance);
              const alreadyPlaced = placedItems.filter(i => i.assetId === asset.id).length;

              return (
                <div
                  key={asset.id}
                  className="relative flex flex-col gap-1 rounded-2xl p-3 transition-all"
                  style={{
                    background: "var(--surface-2)",
                    opacity: unlocked ? 1 : 0.5,
                    border: alreadyPlaced > 0 ? "1.5px solid var(--accent)" : "1.5px solid transparent",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{asset.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-black truncate" style={{ color: "var(--foreground)" }}>
                        {asset.name}
                      </div>
                      {asset.buff && (
                        <div className="text-[10px] font-bold" style={{ color: "var(--accent)" }}>
                          {asset.buff.label}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                    {unlocked ? asset.desc : asset.unlockDesc}
                  </p>

                  {unlocked ? (
                    <button
                      onClick={() => handleAdd(asset.id, asset.name)}
                      className="flex items-center justify-center gap-1 text-[11px] font-bold py-1 rounded-xl mt-1 transition-all active:scale-95"
                      style={{ background: "var(--primary)", color: "#fff" }}
                    >
                      <Plus size={12} /> 배치
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] py-1 justify-center" style={{ color: "var(--foreground-muted)" }}>
                      <Lock size={11} /> {asset.unlockDesc}
                    </div>
                  )}

                  {alreadyPlaced > 0 && (
                    <div
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      {alreadyPlaced}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 테마 선택 */}
        {activeTab === "theme" && (
          <div className="grid grid-cols-3 gap-2">
            {ROOM_THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setRoomTheme(t.id as Parameters<typeof setRoomTheme>[0])}
                className="flex flex-col items-center gap-1.5 rounded-2xl py-3 px-2 transition-all"
                style={{
                  background: t.bg,
                  border: roomTheme === t.id ? `2px solid ${t.border}` : "2px solid transparent",
                }}
              >
                <div className="w-6 h-6 rounded-full" style={{ background: t.border }} />
                <span className="text-[11px] font-black" style={{ color: "#333" }}>{t.label}</span>
                {roomTheme === t.id && (
                  <span className="text-[10px] font-bold" style={{ color: t.border }}>✓ 적용됨</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* 배치된 아이템 목록 + 크기 조절 */}
        {activeTab === "placed" && (
          <div className="flex flex-col gap-2">
            {placedItems.length === 0 ? (
              <div className="text-center py-8 text-[12px]" style={{ color: "var(--foreground-muted)" }}>
                아직 배치한 에셋이 없어요.<br />카테고리 탭에서 에셋을 추가해 보세요!
              </div>
            ) : (
              placedItems.map((item: PlacedItem) => {
                const asset = ROOM_ASSETS.find(a => a.id === item.assetId);
                if (!asset) return null;
                const scalePercent = Math.round(item.scale * 100);

                return (
                  <div
                    key={item.instanceId}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2"
                    style={{ background: "var(--surface-2)" }}
                  >
                    {/* 이모지 */}
                    <span className="text-xl shrink-0">{asset.emoji}</span>

                    {/* 이름 + 버프 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-black truncate" style={{ color: "var(--foreground)" }}>{asset.name}</div>
                      {asset.buff && (
                        <div className="text-[10px]" style={{ color: "var(--accent)" }}>{asset.buff.label}</div>
                      )}
                    </div>

                    {/* 크기 조절 */}
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => scaleItem(item.instanceId, item.scale + 0.15)}
                        className="w-6 h-5 flex items-center justify-center rounded-lg transition-all active:scale-90"
                        style={{ background: "var(--primary-light, #fff0eb)" }}
                        title="크게"
                      >
                        <ChevronUp size={12} color="var(--primary)" />
                      </button>
                      <span className="text-[9px] font-black" style={{ color: "var(--foreground-muted)" }}>
                        {scalePercent}%
                      </span>
                      <button
                        onClick={() => scaleItem(item.instanceId, item.scale - 0.15)}
                        className="w-6 h-5 flex items-center justify-center rounded-lg transition-all active:scale-90"
                        style={{ background: "var(--surface-3, #e5e5e5)" }}
                        title="작게"
                      >
                        <ChevronDown size={12} color="var(--foreground-muted)" />
                      </button>
                    </div>

                    {/* 제거 */}
                    <button
                      onClick={() => removeItem(item.instanceId)}
                      className="p-1.5 rounded-xl shrink-0 transition-all active:scale-90"
                      style={{ background: "var(--surface-3, #e5e5e5)" }}
                      title="제거"
                    >
                      <Trash2 size={12} color="var(--foreground-muted)" />
                    </button>
                  </div>
                );
              })
            )}

            {placedItems.length > 0 && (
              <p className="text-center text-[10px] mt-1" style={{ color: "var(--foreground-muted)" }}>
                방에서 아이템을 드래그해서 위치를 바꿀 수 있어요 🖱️
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
