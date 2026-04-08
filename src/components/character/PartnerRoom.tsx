"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import CharacterSVG, { CharAnim } from "./CharacterSVG";
import CharacterSelectPanel from "./CharacterSelectPanel";
import RoomAssetPanel from "./RoomAssetPanel";
import {
  MARKETER_DEFAULT_CHAR,
  VARIANT_BASE_TYPE,
  CHARACTER_VARIANTS,
  SKIN_VARIANTS,
  getCharacterLevel,
  getEvolutionStage,
  EVOLUTION_LABELS,
  getVariantById,
  getSkinById,
} from "@/lib/characters/characters";
import { getAssetById, calcRoomBuffs } from "@/lib/room/assets";
import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";

/* ─── 메시지 ─── */
const MESSAGES: Record<string, Record<"happy"|"sad"|"idle"|"curious", string[]>> = {
  creator:     { happy:["오늘 콘텐츠 진짜 예쁘게 나왔어! 💖","크리에이티브 에너지 MAX! ✨","이 아이디어 대박이야 👏"], sad:["게시물 좀 올려줘... 나 심심해 😢","콘텐츠 없으면 힘이 안 나...","같이 만들어보자!"], idle:["뭐 만들까? 💭","오늘도 파이팅! 🎨","새 아이디어 떠올랐어?"], curious:["흠... 다른 방향은 어떨까? 🤔","다른 스타일 써봤어?"] },
  analyst:     { happy:["인게이지먼트 올라가고 있어! 📈","데이터 결과 좋아 🤓","분석 최고야!"], sad:["미션 달성률 너무 낮아... 📉","데이터 같이 봐봐","숫자가 답을 알아 🔍"], idle:["데이터 확인했어? 📊","숫자가 말해줘","분석 준비 됐어!"], curious:["이 패턴... 흥미롭다 🧐","A/B 테스트 해볼까?"] },
  storyteller: { happy:["이 스토리 진짜 꿀잼! 히히 😄","사람들이 반응하고 있어!","스토리 구성 완벽해!"], sad:["이야기가 멈추면 안 돼... 😔","스토리 이어가줘","같이 써보자!"], idle:["오늘 무슨 이야기 할까? 📖","꿀잼 아이디어 있어?","히히, 같이 만들자!"], curious:["반전이 필요한 것 같아 🎭","다른 시각으로 볼까?"] },
  innovator:   { happy:["대박 아이디어야! ✨","완전 새로운 방식인데?!","트렌드 앞서가고 있어 🚀"], sad:["새로운 걸 시도해봐! 💡","변화가 필요해","같이 돌파구 찾자!"], idle:["새로운 거 해볼까? 🚀","아이디어 폭발 중! ✨","다음 트렌드는?"], curious:["아직 아무도 안 해본 방식인데? 🌟","뭔가 떠오르고 있어!"] },
};

/* 아이템 배치 반응 메시지 */
const ITEM_ADDED_MSGS = (name: string) => [
  `우와! ${name} 생겼다! 🎉`,
  `오오~ 방이 더 예뻐졌어! 💖`,
  `${name}? 나 완전 좋아! 🥳`,
  `이거 완전 마음에 들어! ✨`,
  `이제 더 열심히 할 수 있어! 💪`,
];

/* ─── 감정 계산 ─── */
function calcMood(posts: number, done: number, total: number, bal: number): "happy"|"sad"|"idle" {
  const rate = total > 0 ? done / total : 1;
  if (posts >= 2 && rate >= 0.5) return "happy";
  if (bal < 50000 || (total > 0 && rate < 0.15)) return "sad";
  return "idle";
}

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

/* ─── 방 테마 (마케터 기본) ─── */
const MARKETER_THEMES: Record<string, { wall: string; floor: string }> = {
  creator:     { wall: "#FFF0F5", floor: "#FFE0EC" },
  analyst:     { wall: "#F0F5FF", floor: "#C8DCFF" },
  storyteller: { wall: "#FFFDF0", floor: "#FFE8B0" },
  innovator:   { wall: "#F8F0FF", floor: "#E0CCFF" },
};

/* ─── 방 꾸미기 테마 override ─── */
const DECO_ROOM_THEMES: Record<string, { wall: string; floor: string }> = {
  cozy:    { wall: "#FFF8F0", floor: "#FFE8CC" },
  minimal: { wall: "#F7F7F7", floor: "#E8E8E8" },
  night:   { wall: "#1A1A2E", floor: "#16213E" },
  nature:  { wall: "#F0FFF4", floor: "#C6F6D5" },
  city:    { wall: "#EBF4FF", floor: "#BEE3F8" },
  retro:   { wall: "#FFFDE7", floor: "#FFF9C4" },
};

/* ─── 상수 ─── */
const MARGIN = 10;
const SPEED  = 0.07;

/* 반짝이 파티클 */
const SPARKLES = ["✨","⭐","🌟","💫","🎊"];

interface WalkState {
  x: number; y: number; tx: number; ty: number;
  flip: boolean; pauseUntil: number;
  reactUntil: number; reactAnim: CharAnim;
}

export default function PartnerRoom({ marketerType, points }: { marketerType: string; points: number }) {
  const { posts, missions, balance, user, setSelectedChar, setActiveSkin } = useGameStore();
  const { placedItems, roomTheme, loadFromStorage, moveItem } = useRoomStore();

  /* ─── 캐릭터/스킨 결정 ─── */
  const defaultCharId = MARKETER_DEFAULT_CHAR[marketerType] ?? "pixie";
  const charId   = user.selectedCharId || defaultCharId;
  const skinId   = user.activeSkin    || "default";
  const variant  = getVariantById(charId) ?? getVariantById(defaultCharId)!;
  const skin     = getSkinById(skinId);
  const baseType = VARIANT_BASE_TYPE[variant.id] ?? "creator";
  const level    = getCharacterLevel(points);
  const stage    = getEvolutionStage(level);

  const xpCur = Math.min(points - (level - 1) * 200, 200);
  const xpPct = Math.min(100, (xpCur / 200) * 100);

  const [showStats,      setShowStats]      = useState(false);
  const [showPanel,      setShowPanel]      = useState(false);
  const [showAssetPanel, setShowAssetPanel] = useState(false);
  const [anim,           setAnim]           = useState<CharAnim>("idle");
  const [bubble, setBubble] = useState<{ msg: string; show: boolean; bx: number; by: number }>({
    msg: "", show: false, bx: 40, by: 50,
  });
  /* 파티클 폭죽 */
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; char: string }[]>([]);

  /* ─── refs ─── */
  const charRef      = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLDivElement>(null);
  const walkRef      = useRef<WalkState>({ x: 40, y: 50, tx: 60, ty: 50, flip: false, pauseUntil: 0, reactUntil: 0, reactAnim: "idle" });
  const animRef      = useRef<CharAnim>("idle");
  const rafRef       = useRef<number | null>(null);
  const bubbleTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseMoodRef  = useRef<"happy"|"sad"|"idle">("idle");
  const marketerRef  = useRef(marketerType);
  /* 드래그 */
  const draggingRef  = useRef<{ instanceId: string; elem: HTMLDivElement } | null>(null);
  const didDragRef   = useRef(false);

  /* ─── localStorage 로드 ─── */
  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  /* ─── 감정/타입 ref 동기화 ─── */
  const completedM = missions.filter(m => m.isCompleted).length;
  const activeM    = missions.filter(m => m.isActive).length;
  const baseMood   = calcMood(posts.length, completedM, activeM, balance);
  useEffect(() => { baseMoodRef.current = baseMood; },    [baseMood]);
  useEffect(() => { marketerRef.current = marketerType; }, [marketerType]);

  /* ─── 말풍선 ─── */
  const showBubble = useCallback((msg: string, bx: number, by: number, ms = 2600) => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    setBubble({ msg, show: true, bx, by });
    bubbleTimer.current = setTimeout(() => setBubble(b => ({ ...b, show: false })), ms);
  }, []);

  /* ─── 파티클 폭죽 ─── */
  const burstSparkles = useCallback((cx: number, cy: number) => {
    const particles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: cx + (Math.random() - 0.5) * 30,
      y: cy + (Math.random() - 0.5) * 20,
      char: SPARKLES[Math.floor(Math.random() * SPARKLES.length)],
    }));
    setSparkles(particles);
    setTimeout(() => setSparkles([]), 900);
  }, []);

  /* ─── 클릭 반응 ─── */
  const handleClick = useCallback(() => {
    if (didDragRef.current) { didDragRef.current = false; return; }
    const ws = walkRef.current;
    const mt = marketerRef.current in MESSAGES ? marketerRef.current : "creator";
    showBubble(pickRandom(MESSAGES[mt].happy), ws.x, ws.y, 2400);
    ws.reactUntil = Date.now() + 2400;
    ws.reactAnim  = "happy";
  }, [showBubble]);

  /* ─── 아이템 배치 반응 ─── */
  const handleItemAdded = useCallback((assetName: string) => {
    const ws = walkRef.current;
    const msg = pickRandom(ITEM_ADDED_MSGS(assetName));
    showBubble(msg, ws.x, ws.y, 3200);
    ws.reactUntil = Date.now() + 3200;
    ws.reactAnim  = "happy";
    burstSparkles(ws.x, ws.y);
  }, [showBubble, burstSparkles]);

  /* ─── 드래그 핸들러 ─── */
  const handleItemPointerDown = useCallback((
    e: React.PointerEvent<HTMLDivElement>,
    instanceId: string,
  ) => {
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    draggingRef.current = { instanceId, elem: e.currentTarget as HTMLDivElement };
    didDragRef.current = false;
  }, []);

  const handleItemPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(4, Math.min(96, ((e.clientY - rect.top)  / rect.height) * 100));
    draggingRef.current.elem.style.left = `${x}%`;
    draggingRef.current.elem.style.top  = `${y}%`;
    didDragRef.current = true;
  }, []);

  const handleItemPointerUp = useCallback((
    e: React.PointerEvent<HTMLDivElement>,
    instanceId: string,
  ) => {
    if (!draggingRef.current) return;
    const canvas = canvasRef.current;
    if (canvas && didDragRef.current) {
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(4, Math.min(96, ((e.clientY - rect.top)  / rect.height) * 100));
      moveItem(instanceId, x, y);
    }
    draggingRef.current = null;
  }, [moveItem]);

  /* ─── RAF 루프 ─── */
  useEffect(() => {
    const PAUSE_MIN = 2500;
    const PAUSE_MAX = 5000;
    let pauseDecided = false;

    const pickTarget = () => {
      const ws = walkRef.current;
      let nx: number, ny: number;
      do {
        nx = MARGIN + Math.random() * (100 - MARGIN * 2);
        ny = MARGIN + Math.random() * (100 - MARGIN * 2);
      } while (Math.hypot(nx - ws.x, ny - ws.y) < 12);
      ws.tx = nx; ws.ty = ny;
    };

    pickTarget();

    const setCharAnim = (a: CharAnim) => {
      if (a !== animRef.current) { animRef.current = a; setAnim(a); }
    };

    const applyPos = (x: number, y: number, flip: boolean) => {
      if (!charRef.current) return;
      charRef.current.style.left      = `${x}%`;
      charRef.current.style.top       = `${y}%`;
      charRef.current.style.transform = `translate(-50%, -50%) scaleX(${flip ? -1 : 1})`;
    };

    const tick = () => {
      const now  = Date.now();
      const ws   = walkRef.current;
      const mood = baseMoodRef.current;

      if (now < ws.reactUntil) {
        setCharAnim(ws.reactAnim);
        applyPos(ws.x, ws.y, ws.flip);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (now < ws.pauseUntil) {
        if (!pauseDecided) {
          setCharAnim(
            mood === "happy" ? "happy" :
            mood === "sad"   ? "sad"   :
            Math.random() < 0.12 ? "curious" : "idle"
          );
          pauseDecided = true;
        }
        applyPos(ws.x, ws.y, ws.flip);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      pauseDecided = false;

      const dx   = ws.tx - ws.x;
      const dy   = ws.ty - ws.y;
      const dist = Math.hypot(dx, dy);

      if (dist < SPEED * 1.5) {
        ws.x = ws.tx; ws.y = ws.ty;
        ws.pauseUntil = now + PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN);
        if (Math.random() < 0.28) {
          const mt  = marketerRef.current in MESSAGES ? marketerRef.current : "creator";
          const key = mood === "happy" ? "happy" : mood === "sad" ? "sad" : (Math.random() < 0.3 ? "curious" : "idle");
          showBubble(pickRandom(MESSAGES[mt][key]), ws.x, ws.y, 2300);
        }
        pickTarget();
      } else {
        ws.x += (dx / dist) * SPEED;
        ws.y += (dy / dist) * SPEED;
        ws.flip = dx < 0;
        setCharAnim("walk");
        applyPos(ws.x, ws.y, ws.flip);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current)    cancelAnimationFrame(rafRef.current);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── 캐릭터 선택 핸들러 ─── */
  const handleSelectChar = useCallback((id: string) => { setSelectedChar(id); }, [setSelectedChar]);
  const handleSelectSkin = useCallback((id: string) => { setActiveSkin(id);  }, [setActiveSkin]);

  // 배치된 에셋 버프 합산
  const roomBuffs = calcRoomBuffs(placedItems.map(i => i.assetId));
  const hasBuffs  = Object.values(roomBuffs).some(v => v > 0);

  // 테마: 방 꾸미기 테마 우선, 없으면 마케터 기본
  const decoTheme = DECO_ROOM_THEMES[roomTheme];
  const theme     = decoTheme ?? (MARKETER_THEMES[marketerType] ?? MARKETER_THEMES.creator);
  const charSize  = stage === "egg" ? 72 : stage === "sprout" ? 84 : stage === "growth" ? 96 : 110;

  return (
    <div className="rounded-3xl overflow-hidden select-none" style={{ border: `2px solid ${variant.borderColor}` }}>

      {/* ── 방 캔버스 ── */}
      <div
        ref={canvasRef}
        className="relative overflow-hidden"
        style={{
          height: 220,
          background: `linear-gradient(180deg, ${theme.wall} 50%, ${theme.floor} 100%)`,
          cursor: showAssetPanel ? "crosshair" : "pointer",
        }}
        onClick={handleClick}
      >
        <div className="absolute bottom-0 left-0 right-0 h-1 opacity-30" style={{ background: variant.color }} />

        {/* 레벨/진화 배지 */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: variant.color }}>
            Lv.{level}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: variant.borderColor, color: variant.color }}>
            {EVOLUTION_LABELS[stage]}
          </span>
        </div>

        {/* 꾸미기 모드 안내 */}
        {showAssetPanel && (
          <div
            className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full z-10"
            style={{ background: "rgba(6,214,160,0.18)", color: "#06D6A0", border: "1px solid #06D6A0" }}
          >
            🖱️ 아이템 드래그로 위치 이동
          </div>
        )}

        {/* 말풍선 */}
        {bubble.show && (
          <div
            className="absolute z-20 px-3 py-1.5 rounded-2xl rounded-bl-none text-xs font-semibold shadow-md pointer-events-none"
            style={{
              left: `${Math.min(bubble.bx, 68)}%`,
              bottom: `${Math.max(8, 100 - bubble.by)}%`,
              background: "white", color: "#333",
              border: `1.5px solid ${variant.borderColor}`,
              animation: "bubblePop 0.28s ease-out",
              maxWidth: 180, whiteSpace: "pre-wrap", lineHeight: 1.45,
            }}
          >
            {bubble.msg}
            <span className="absolute -bottom-[7px] left-3 block" style={{
              width: 0, height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: `7px solid ${variant.borderColor}`,
            }}/>
          </div>
        )}

        {/* 파티클 폭죽 */}
        {sparkles.map(s => (
          <div
            key={s.id}
            className="absolute pointer-events-none text-base z-30"
            style={{
              left: `${s.x}%`,
              top:  `${s.y}%`,
              animation: "confetti-fall 0.9s ease-out forwards",
              fontSize: 18,
            }}
          >
            {s.char}
          </div>
        ))}

        {/* 캐릭터 — DOM 직접 조작 */}
        <div
          ref={charRef}
          className="absolute z-10"
          style={{
            left: "40%", top: "50%",
            transform: "translate(-50%, -50%) scaleX(1)",
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.10))",
            willChange: "left, top, transform",
          }}
          onClick={e => { e.stopPropagation(); handleClick(); }}
        >
          <CharacterSVG
            type={baseType}
            size={charSize}
            anim={anim}
            colorFilter={variant.colorFilter}
            skinFilter={skin.cssFilter || undefined}
            stage={stage}
            stageColor={variant.color}
          />
        </div>

        {/* 배치된 방 에셋 이모지 */}
        {placedItems.map(item => {
          const asset = getAssetById(item.assetId);
          if (!asset) return null;
          const zStyle = item.z === 3 ? 1 : item.z === 1 ? 3 : 2;
          return (
            <div
              key={item.instanceId}
              className="absolute"
              style={{
                left:   `${item.x}%`,
                top:    `${item.y}%`,
                transform: `translate(-50%, -50%) scaleX(${item.flipX ? -1 : 1}) scale(${item.scale})`,
                fontSize: 28,
                zIndex: zStyle,
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
                cursor: "grab",
                touchAction: "none",
              }}
              onPointerDown={e => handleItemPointerDown(e, item.instanceId)}
              onPointerMove={handleItemPointerMove}
              onPointerUp={e => handleItemPointerUp(e, item.instanceId)}
              onClick={e => e.stopPropagation()}
            >
              {asset.emoji}
              {/* 드래그 모드일 때 테두리 힌트 */}
              {showAssetPanel && (
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{ border: "1.5px dashed rgba(6,214,160,0.5)", borderRadius: 8 }}
                />
              )}
            </div>
          );
        })}

        {/* 힌트 */}
        <div className="absolute bottom-3 left-3 text-[10px] font-semibold opacity-35" style={{ color: variant.color }}>
          {showAssetPanel ? "🏠 꾸미기 모드" : "탭하면 반응해요 💬"}
        </div>
      </div>

      {/* ── 하단 정보 ── */}
      <div className="px-4 py-3" style={{ background: variant.bgColor }}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base font-black" style={{ color: variant.color }}>{variant.name}</span>
              <span className="text-[11px] font-semibold opacity-55" style={{ color: variant.color }}>{variant.species}</span>
              {skinId !== "default" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: variant.borderColor, color: variant.color }}>
                  {SKIN_VARIANTS.find(s => s.id === skinId)?.emoji} {SKIN_VARIANTS.find(s => s.id === skinId)?.label}
                </span>
              )}
            </div>
            <p className="text-[11px] italic mt-0.5 truncate" style={{ color: "#999" }}>&quot;{variant.quote}&quot;</p>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => { setShowPanel(v => !v); setShowAssetPanel(false); }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all"
              style={{
                background: showPanel ? variant.color : variant.borderColor,
                color:      showPanel ? "white"        : variant.color,
              }}
            >
              {showPanel ? "완료 ✓" : "변경 ✏️"}
            </button>
            <button
              onClick={() => { setShowAssetPanel(v => !v); setShowPanel(false); }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all"
              style={{
                background: showAssetPanel ? "#06D6A0" : variant.borderColor,
                color:      showAssetPanel ? "white"   : variant.color,
              }}
            >
              {showAssetPanel ? "완료 ✓" : "🏠 꾸미기"}
            </button>
            <button
              onClick={() => setShowStats(v => !v)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all"
              style={{
                background: showStats ? variant.color : variant.borderColor,
                color:      showStats ? "white"        : variant.color,
              }}
            >
              {showStats ? "접기 ▲" : "스탯 ▼"}
            </button>
          </div>
        </div>

        {/* XP 바 */}
        <div className="mt-2.5">
          <div className="flex justify-between text-[10px] font-bold mb-1" style={{ color: "#aaa" }}>
            <span>다음 레벨까지</span><span>{xpCur} / 200 XP</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: variant.borderColor }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${xpPct}%`, background: variant.color }} />
          </div>
        </div>

        {/* 스탯 패널 */}
        {showStats && (
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {Object.entries(variant.baseStats).map(([k, v]) => {
              const L: Record<string, string> = { creativity:"창의력", analytics:"분석력", persuasion:"설득력", trend:"트렌드", teamwork:"팀워크" };
              return (
                <div key={k} className="flex items-center gap-2 text-[11px] font-bold" style={{ color: "#777" }}>
                  <span className="w-12 shrink-0">{L[k]}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: variant.borderColor }}>
                    <div className="h-full rounded-full" style={{ width:`${v}%`, background: variant.color, opacity: 0.7 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 방 에셋 버프 요약 */}
        {hasBuffs && !showPanel && !showAssetPanel && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {roomBuffs.xp_boost   > 0 && <span title="XP 획득량이 증가해요" className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-help" style={{ background: "#EEF1FD", color: "#4361EE" }}>XP +{roomBuffs.xp_boost}%</span>}
            {roomBuffs.engagement > 0 && <span title="게시물 인게이지먼트가 높아져요" className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-help" style={{ background: "#E6FBF5", color: "#06D6A0" }}>인게이지먼트 +{roomBuffs.engagement}%</span>}
            {roomBuffs.revenue    > 0 && <span title="수익 창출이 늘어나요" className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-help" style={{ background: "#FFF8E0", color: "#92400E" }}>수익 +{roomBuffs.revenue}%</span>}
            {roomBuffs.luck       > 0 && <span title="미션 보상이 늘어나요" className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-help" style={{ background: "#FFF0EB", color: "#FF6B35" }}>보상 +{roomBuffs.luck}%</span>}
            {roomBuffs.mood       > 0 && <span title="파트너 기분이 오래 유지돼요" className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-help" style={{ background: "#F0F5FF", color: "#4361EE" }}>기분 +{roomBuffs.mood}%</span>}
            {roomBuffs.idea_speed > 0 && <span title="AI 코치를 더 자주 사용할 수 있어요" className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-help" style={{ background: "#F8F0FF", color: "#8B5CF6" }}>AI속도 +{roomBuffs.idea_speed}%</span>}
          </div>
        )}

        {/* 캐릭터 선택 패널 */}
        {showPanel && (
          <div className="mt-3">
            <CharacterSelectPanel
              marketerType={marketerType}
              currentCharId={charId}
              currentSkin={skinId}
              points={points}
              completedMissions={completedM}
              postCount={posts.length}
              balance={balance}
              onSelectChar={handleSelectChar}
              onSelectSkin={handleSelectSkin}
              onClose={() => setShowPanel(false)}
            />
          </div>
        )}

        {/* 방 꾸미기 패널 */}
        {showAssetPanel && (
          <div className="mt-3">
            <RoomAssetPanel
              level={level}
              postCount={posts.length}
              completedMissions={completedM}
              balance={balance}
              onItemAdded={handleItemAdded}
              onClose={() => setShowAssetPanel(false)}
            />
          </div>
        )}

        {/* 감정 상태 */}
        {!showPanel && !showAssetPanel && (
          <div className="mt-2 text-[10px] font-semibold opacity-45 text-center" style={{ color: variant.color }}>
            {baseMood === "happy" && "😊 활발하게 활동 중!"}
            {baseMood === "sad"   && "😢 더 많이 활동해 줘..."}
            {baseMood === "idle"  && "💤 조용히 기다리는 중"}
          </div>
        )}
      </div>
    </div>
  );
}
