// ─────────────────────────────────────────────────
//  가상 방 꾸미기 에셋 정의
//  카테고리: furniture / tech / plant / deco / music
// ─────────────────────────────────────────────────

export type AssetCategory = "furniture" | "tech" | "plant" | "deco" | "music";

export interface PassiveBuff {
  /** 버프 효과 종류 */
  type:
    | "xp_boost"       // XP 획득 +%
    | "engagement"     // 게시물 인게이지먼트 +%
    | "revenue"        // 수익 +%
    | "idea_speed"     // 아이디어 창출 속도 (AI 코치 쿨타임 -%)
    | "luck"           // 미션 보상 랜덤 보너스 +%
    | "mood";          // 파트너 행복도 지속 (기분 감소 -%)
  value: number;       // 퍼센트 포인트 (예: 5 → +5%)
  label: string;       // UI 표시 텍스트
}

export interface RoomAsset {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  category: AssetCategory;
  /** z레이어 기본값 — 1:바닥 2:중간 3:벽 */
  defaultZ: 1 | 2 | 3;
  /** 기본 배치 위치 (%) */
  defaultX: number;
  defaultY: number;
  /** 패시브 버프 (없을 수 있음) */
  buff?: PassiveBuff;
  /** 잠금 해제 조건 */
  unlock:
    | { type: "default" }                  // 처음부터 해금
    | { type: "level"; level: number }     // 레벨 달성
    | { type: "posts"; count: number }     // 게시물 n개 이상
    | { type: "missions"; count: number }  // 미션 n개 완료
    | { type: "balance"; amount: number }; // 잔액 n원 이상 보유
  unlockDesc: string;
  /** 에셋 크기 배율 기본값 */
  defaultScale: number;
}

export const ROOM_ASSETS: RoomAsset[] = [
  // ── FURNITURE ───────────────────────────────────
  {
    id: "desk",
    emoji: "🖥️",
    name: "마케터 책상",
    desc: "크리에이터의 작업 공간. XP 획득이 늘어납니다.",
    category: "furniture",
    defaultZ: 2,
    defaultX: 20,
    defaultY: 55,
    buff: { type: "xp_boost", value: 5, label: "XP +5%" },
    unlock: { type: "default" },
    unlockDesc: "기본 해금",
    defaultScale: 1.2,
  },
  {
    id: "beanbag",
    emoji: "🛋️",
    name: "빈백 소파",
    desc: "파트너의 기분이 천천히 떨어집니다.",
    category: "furniture",
    defaultZ: 2,
    defaultX: 75,
    defaultY: 65,
    buff: { type: "mood", value: 10, label: "기분 유지 +10%" },
    unlock: { type: "level", level: 5 },
    unlockDesc: "Lv.5 해금",
    defaultScale: 1.1,
  },
  {
    id: "trophy_shelf",
    emoji: "🏆",
    name: "트로피 선반",
    desc: "미션 달성 시 보너스 보상을 받습니다.",
    category: "furniture",
    defaultZ: 3,
    defaultX: 50,
    defaultY: 20,
    buff: { type: "luck", value: 8, label: "미션 보상 +8%" },
    unlock: { type: "missions", count: 5 },
    unlockDesc: "미션 5개 완료",
    defaultScale: 1.0,
  },
  {
    id: "whiteboard",
    emoji: "📋",
    name: "전략 화이트보드",
    desc: "AI 코치에게 더 자주 질문할 수 있습니다.",
    category: "furniture",
    defaultZ: 3,
    defaultX: 15,
    defaultY: 20,
    buff: { type: "idea_speed", value: 15, label: "AI 코치 쿨다운 -15%" },
    unlock: { type: "level", level: 10 },
    unlockDesc: "Lv.10 해금",
    defaultScale: 1.1,
  },

  // ── TECH ────────────────────────────────────────
  {
    id: "camera",
    emoji: "📸",
    name: "콘텐츠 카메라",
    desc: "게시물 인게이지먼트가 올라갑니다.",
    category: "tech",
    defaultZ: 2,
    defaultX: 30,
    defaultY: 60,
    buff: { type: "engagement", value: 6, label: "인게이지먼트 +6%" },
    unlock: { type: "posts", count: 3 },
    unlockDesc: "게시물 3개",
    defaultScale: 1.0,
  },
  {
    id: "ring_light",
    emoji: "💡",
    name: "링 라이트",
    desc: "콘텐츠 퀄리티 업! 인게이지먼트 보너스.",
    category: "tech",
    defaultZ: 2,
    defaultX: 60,
    defaultY: 55,
    buff: { type: "engagement", value: 4, label: "인게이지먼트 +4%" },
    unlock: { type: "posts", count: 5 },
    unlockDesc: "게시물 5개",
    defaultScale: 1.0,
  },
  {
    id: "monitor",
    emoji: "🖥️",
    name: "듀얼 모니터",
    desc: "데이터 분석 효율 UP — XP 보너스.",
    category: "tech",
    defaultZ: 2,
    defaultX: 45,
    defaultY: 55,
    buff: { type: "xp_boost", value: 8, label: "XP +8%" },
    unlock: { type: "level", level: 15 },
    unlockDesc: "Lv.15 해금",
    defaultScale: 1.2,
  },
  {
    id: "speaker_ai",
    emoji: "🤖",
    name: "AI 스피커",
    desc: "AI 코치 아이디어 생성 속도 향상.",
    category: "tech",
    defaultZ: 2,
    defaultX: 80,
    defaultY: 60,
    buff: { type: "idea_speed", value: 10, label: "AI 코치 쿨다운 -10%" },
    unlock: { type: "balance", amount: 1000000 },
    unlockDesc: "잔액 100만원 보유",
    defaultScale: 0.9,
  },

  // ── PLANT ────────────────────────────────────────
  {
    id: "cactus",
    emoji: "🌵",
    name: "작은 선인장",
    desc: "데스크 위 작은 친구. 기분을 올려줍니다.",
    category: "plant",
    defaultZ: 2,
    defaultX: 25,
    defaultY: 62,
    buff: { type: "mood", value: 5, label: "기분 유지 +5%" },
    unlock: { type: "default" },
    unlockDesc: "기본 해금",
    defaultScale: 0.8,
  },
  {
    id: "monstera",
    emoji: "🌿",
    name: "몬스테라",
    desc: "방의 청량함. 파트너 기분 유지 효과.",
    category: "plant",
    defaultZ: 2,
    defaultX: 85,
    defaultY: 55,
    buff: { type: "mood", value: 8, label: "기분 유지 +8%" },
    unlock: { type: "level", level: 8 },
    unlockDesc: "Lv.8 해금",
    defaultScale: 1.1,
  },
  {
    id: "flower_vase",
    emoji: "🌸",
    name: "꽃 화병",
    desc: "행운을 부르는 예쁜 꽃.",
    category: "plant",
    defaultZ: 2,
    defaultX: 55,
    defaultY: 65,
    buff: { type: "luck", value: 5, label: "미션 보상 +5%" },
    unlock: { type: "missions", count: 3 },
    unlockDesc: "미션 3개 완료",
    defaultScale: 0.9,
  },

  // ── DECO ─────────────────────────────────────────
  {
    id: "star_poster",
    emoji: "⭐",
    name: "스타 포스터",
    desc: "영감의 원천. XP 획득 소폭 상승.",
    category: "deco",
    defaultZ: 3,
    defaultX: 35,
    defaultY: 15,
    buff: { type: "xp_boost", value: 3, label: "XP +3%" },
    unlock: { type: "default" },
    unlockDesc: "기본 해금",
    defaultScale: 1.0,
  },
  {
    id: "neon_sign",
    emoji: "✨",
    name: "네온 사인",
    desc: "\"GO VIRAL\" — 바이럴 가능성 UP!",
    category: "deco",
    defaultZ: 3,
    defaultX: 70,
    defaultY: 15,
    buff: { type: "engagement", value: 5, label: "인게이지먼트 +5%" },
    unlock: { type: "posts", count: 10 },
    unlockDesc: "게시물 10개",
    defaultScale: 1.1,
  },
  {
    id: "goal_board",
    emoji: "🎯",
    name: "목표 보드",
    desc: "미션 보상이 더욱 커집니다.",
    category: "deco",
    defaultZ: 3,
    defaultX: 85,
    defaultY: 20,
    buff: { type: "luck", value: 10, label: "미션 보상 +10%" },
    unlock: { type: "missions", count: 10 },
    unlockDesc: "미션 10개 완료",
    defaultScale: 1.0,
  },
  {
    id: "piggy_bank",
    emoji: "🐷",
    name: "돼지 저금통",
    desc: "수익 창출 보너스.",
    category: "deco",
    defaultZ: 2,
    defaultX: 10,
    defaultY: 65,
    buff: { type: "revenue", value: 5, label: "수익 +5%" },
    unlock: { type: "balance", amount: 500000 },
    unlockDesc: "잔액 50만원 보유",
    defaultScale: 0.9,
  },

  // ── MUSIC ────────────────────────────────────────
  {
    id: "bluetooth_speaker",
    emoji: "🔊",
    name: "블루투스 스피커",
    desc: "음악이 흐르면 파트너도 신나요.",
    category: "music",
    defaultZ: 2,
    defaultX: 15,
    defaultY: 70,
    buff: { type: "mood", value: 6, label: "기분 유지 +6%" },
    unlock: { type: "default" },
    unlockDesc: "기본 해금",
    defaultScale: 0.9,
  },
  {
    id: "vinyl_player",
    emoji: "🎵",
    name: "바이닐 플레이어",
    desc: "레트로 감성! 창의력과 XP 보너스.",
    category: "music",
    defaultZ: 2,
    defaultX: 40,
    defaultY: 70,
    buff: { type: "xp_boost", value: 6, label: "XP +6%" },
    unlock: { type: "level", level: 12 },
    unlockDesc: "Lv.12 해금",
    defaultScale: 1.0,
  },
  {
    id: "headphones",
    emoji: "🎧",
    name: "프로 헤드폰",
    desc: "몰입 모드 — 인게이지먼트 극대화.",
    category: "music",
    defaultZ: 2,
    defaultX: 65,
    defaultY: 70,
    buff: { type: "engagement", value: 7, label: "인게이지먼트 +7%" },
    unlock: { type: "posts", count: 8 },
    unlockDesc: "게시물 8개",
    defaultScale: 0.9,
  },
];

// ── 카테고리 메타 ────────────────────────────────────
export const ASSET_CATEGORIES: { id: AssetCategory; label: string; emoji: string }[] = [
  { id: "furniture", label: "가구", emoji: "🛋️" },
  { id: "tech",      label: "테크", emoji: "💻" },
  { id: "plant",     label: "식물", emoji: "🌿" },
  { id: "deco",      label: "소품", emoji: "✨" },
  { id: "music",     label: "음악", emoji: "🎵" },
];

// ── 헬퍼 ─────────────────────────────────────────────
export function getAssetById(id: string): RoomAsset | undefined {
  return ROOM_ASSETS.find(a => a.id === id);
}

export function isAssetUnlocked(
  asset: RoomAsset,
  level: number,
  postCount: number,
  completedMissions: number,
  balance: number,
): boolean {
  const u = asset.unlock;
  if (u.type === "default")   return true;
  if (u.type === "level")     return level >= u.level;
  if (u.type === "posts")     return postCount >= u.count;
  if (u.type === "missions")  return completedMissions >= u.count;
  if (u.type === "balance")   return balance >= u.amount;
  return false;
}

/** 현재 방에 배치된 에셋들의 패시브 버프 합산 */
export function calcRoomBuffs(placedAssetIds: string[]): Record<PassiveBuff["type"], number> {
  const result: Record<PassiveBuff["type"], number> = {
    xp_boost: 0,
    engagement: 0,
    revenue: 0,
    idea_speed: 0,
    luck: 0,
    mood: 0,
  };
  for (const id of placedAssetIds) {
    const asset = getAssetById(id);
    if (asset?.buff) {
      result[asset.buff.type] += asset.buff.value;
    }
  }
  return result;
}
