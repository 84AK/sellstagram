/* ═══════════════════════════════════════════════════════════
   캐릭터 시스템 v2
   - 기존 CHARACTERS / MARKETER_TO_CHARACTER 유지 (하위 호환)
   - CHARACTER_VARIANTS: 마케터 타입별 3종 (기본 + Lv.10 + Lv.25)
   - SKIN_VARIANTS: 5종 스킨 (CSS filter 기반)
═══════════════════════════════════════════════════════════ */

export type CharacterType = "creator" | "analyst" | "storyteller" | "innovator";
export type EvolutionStage = "egg" | "sprout" | "growth" | "master";

/* ─── 기존 타입 (하위 호환 유지) ─── */
export interface CharacterData {
  id: CharacterType;
  name: string;
  species: string;
  color: string;
  bgColor: string;
  borderColor: string;
  quote: string;
  baseStats: { creativity: number; analytics: number; persuasion: number; trend: number; teamwork: number; };
}

export const CHARACTERS: Record<CharacterType, CharacterData> = {
  creator:     { id: "creator",     name: "픽시", species: "크리에이터 · 분홍 여우",   color: "#FF6B9D", bgColor: "#FFF0F5", borderColor: "#FFD4E4", quote: "오늘도 짱 예쁘게 만들어 볼게! 💖", baseStats: { creativity:95, analytics:45, persuasion:68, trend:60, teamwork:55 } },
  analyst:     { id: "analyst",     name: "루미", species: "분석가 · 파란 부엉이",     color: "#4A90E2", bgColor: "#F0F5FF", borderColor: "#C8DCFF", quote: "데이터가 말하는 걸 들어볼랭? 🤓",    baseStats: { creativity:50, analytics:95, persuasion:55, trend:72, teamwork:60 } },
  storyteller: { id: "storyteller", name: "모키", species: "스토리텔러 · 황금 너구리", color: "#D47A00", bgColor: "#FFFDF0", borderColor: "#FFE8A0", quote: "꿀잼 이야기 하나 들려줄까? 히히",   baseStats: { creativity:65, analytics:40, persuasion:95, trend:58, teamwork:80 } },
  innovator:   { id: "innovator",   name: "제타", species: "이노베이터 · 보라 토끼",   color: "#9D4EDD", bgColor: "#F8F0FF", borderColor: "#E0CCFF", quote: "대박 아이디어 생각남! 같이 해보자구 ✨", baseStats: { creativity:75, analytics:55, persuasion:60, trend:85, teamwork:65 } },
};

export const MARKETER_TO_CHARACTER: Record<string, CharacterType> = {
  creator: "creator", analyst: "analyst", storyteller: "storyteller", innovator: "innovator",
};

/* ─── 레벨 / 진화 ─── */
export function getCharacterLevel(points: number): number {
  return Math.min(50, Math.floor(points / 200) + 1);
}
export function getEvolutionStage(level: number): EvolutionStage {
  if (level <= 9)  return "egg";
  if (level <= 24) return "sprout";
  if (level <= 39) return "growth";
  return "master";
}
export const EVOLUTION_LABELS: Record<EvolutionStage, string> = {
  egg: "🥚 알 단계", sprout: "🐣 새싹 단계", growth: "✨ 성장 단계", master: "👑 마스터!",
};

/* ═══════════════════════════════════════════════════════════
   NEW: 캐릭터 변형 시스템
═══════════════════════════════════════════════════════════ */

export interface CharacterVariant {
  id: string;
  marketerType: CharacterType;
  unlockLevel: number;   // 0 = 기본 (항상 해금)
  name: string;
  species: string;
  quote: string;
  colorFilter?: string;  // CSS filter — undefined=원본 색상
  color: string;         // UI 강조색
  bgColor: string;
  borderColor: string;
  baseStats: { creativity: number; analytics: number; persuasion: number; trend: number; teamwork: number; };
}

export const CHARACTER_VARIANTS: CharacterVariant[] = [
  /* ── CREATOR ── */
  {
    id: "pixie", marketerType: "creator", unlockLevel: 0,
    name: "픽시", species: "크리에이터 · 분홍 여우",
    quote: "오늘도 짱 예쁘게 만들어 볼게! 💖",
    colorFilter: undefined,
    color: "#FF6B9D", bgColor: "#FFF0F5", borderColor: "#FFD4E4",
    baseStats: { creativity:95, analytics:45, persuasion:68, trend:60, teamwork:55 },
  },
  {
    id: "luna", marketerType: "creator", unlockLevel: 10,
    name: "루나", species: "크리에이터 · 달빛 여우",
    quote: "달빛 아래 만들면 더 예뻐! 🌙",
    colorFilter: "hue-rotate(250deg) saturate(0.85) brightness(1.05)",
    color: "#8B6FFF", bgColor: "#F5F0FF", borderColor: "#DDD0FF",
    baseStats: { creativity:98, analytics:42, persuasion:72, trend:65, teamwork:50 },
  },
  {
    id: "flame", marketerType: "creator", unlockLevel: 25,
    name: "플레임", species: "크리에이터 · 불꽃 여우",
    quote: "열정으로 불태워버릴게! 🔥",
    colorFilter: "hue-rotate(30deg) saturate(1.6) brightness(1.08)",
    color: "#FF5500", bgColor: "#FFF5EC", borderColor: "#FFD0A0",
    baseStats: { creativity:100, analytics:40, persuasion:80, trend:75, teamwork:48 },
  },

  /* ── ANALYST ── */
  {
    id: "lumi", marketerType: "analyst", unlockLevel: 0,
    name: "루미", species: "분석가 · 파란 부엉이",
    quote: "데이터가 말하는 걸 들어볼랭? 🤓",
    colorFilter: undefined,
    color: "#4A90E2", bgColor: "#F0F5FF", borderColor: "#C8DCFF",
    baseStats: { creativity:50, analytics:95, persuasion:55, trend:72, teamwork:60 },
  },
  {
    id: "bit", marketerType: "analyst", unlockLevel: 10,
    name: "비트", species: "분석가 · 사이버 부엉이",
    quote: "최적 경로 계산 완료! 💾",
    colorFilter: "hue-rotate(-25deg) saturate(2) brightness(1.12)",
    color: "#00A8E8", bgColor: "#F0FBFF", borderColor: "#A0EEFF",
    baseStats: { creativity:48, analytics:99, persuasion:50, trend:78, teamwork:58 },
  },
  {
    id: "prism", marketerType: "analyst", unlockLevel: 25,
    name: "프리즘", species: "분석가 · 크리스탈 부엉이",
    quote: "모든 각도에서 분석해볼게! 🔬",
    colorFilter: "hue-rotate(55deg) saturate(0.85) brightness(1.1)",
    color: "#B040FF", bgColor: "#FBF0FF", borderColor: "#EEC0FF",
    baseStats: { creativity:55, analytics:100, persuasion:58, trend:80, teamwork:62 },
  },

  /* ── STORYTELLER ── */
  {
    id: "moki", marketerType: "storyteller", unlockLevel: 0,
    name: "모키", species: "스토리텔러 · 황금 너구리",
    quote: "꿀잼 이야기 하나 들려줄까? 히히",
    colorFilter: undefined,
    color: "#D47A00", bgColor: "#FFFDF0", borderColor: "#FFE8A0",
    baseStats: { creativity:65, analytics:40, persuasion:95, trend:58, teamwork:80 },
  },
  {
    id: "blink", marketerType: "storyteller", unlockLevel: 10,
    name: "블링크", species: "스토리텔러 · 마스크 너구리",
    quote: "반전 있는 이야기가 제일 재밌어! 🎭",
    colorFilter: "hue-rotate(-40deg) saturate(1.8) brightness(1.05)",
    color: "#E83030", bgColor: "#FFF5F5", borderColor: "#FFCCC0",
    baseStats: { creativity:70, analytics:38, persuasion:98, trend:62, teamwork:78 },
  },
  {
    id: "echo", marketerType: "storyteller", unlockLevel: 25,
    name: "에코", species: "스토리텔러 · 음파 너구리",
    quote: "이야기의 파동이 세상을 흔들어! 🎵",
    colorFilter: "hue-rotate(80deg) saturate(1.3) brightness(1.05)",
    color: "#00B060", bgColor: "#F0FFF8", borderColor: "#A0FFD0",
    baseStats: { creativity:72, analytics:42, persuasion:100, trend:65, teamwork:85 },
  },

  /* ── INNOVATOR ── */
  {
    id: "zeta", marketerType: "innovator", unlockLevel: 0,
    name: "제타", species: "이노베이터 · 보라 토끼",
    quote: "대박 아이디어 생각남! 같이 해보자구 ✨",
    colorFilter: undefined,
    color: "#9D4EDD", bgColor: "#F8F0FF", borderColor: "#E0CCFF",
    baseStats: { creativity:75, analytics:55, persuasion:60, trend:85, teamwork:65 },
  },
  {
    id: "quantum", marketerType: "innovator", unlockLevel: 10,
    name: "퀀텀", species: "이노베이터 · 황금 번개 토끼",
    quote: "두 번 번쩍이면 두 배 빠르지! ⚡",
    colorFilter: "hue-rotate(140deg) saturate(2) brightness(1.15)",
    color: "#E8A000", bgColor: "#FFFEF0", borderColor: "#FFE880",
    baseStats: { creativity:78, analytics:52, persuasion:62, trend:90, teamwork:60 },
  },
  {
    id: "nova", marketerType: "innovator", unlockLevel: 25,
    name: "노바", species: "이노베이터 · 우주 토끼",
    quote: "우주 끝까지 아이디어 탐험 중! 🌌",
    colorFilter: "hue-rotate(-25deg) saturate(0.8) brightness(0.92)",
    color: "#4040EE", bgColor: "#F0F0FF", borderColor: "#C0C0FF",
    baseStats: { creativity:82, analytics:58, persuasion:65, trend:95, teamwork:68 },
  },
];

/* ─── 헬퍼 ─── */
export const MARKETER_DEFAULT_CHAR: Record<string, string> = {
  creator: "pixie", analyst: "lumi", storyteller: "moki", innovator: "zeta",
};

export const VARIANT_BASE_TYPE: Record<string, CharacterType> = {
  pixie: "creator",  luna: "creator",  flame: "creator",
  lumi: "analyst",   bit: "analyst",   prism: "analyst",
  moki: "storyteller", blink: "storyteller", echo: "storyteller",
  zeta: "innovator", quantum: "innovator",   nova: "innovator",
};

export function getVariantById(id: string): CharacterVariant | undefined {
  return CHARACTER_VARIANTS.find(v => v.id === id);
}

export function getVariantsByType(marketerType: string): CharacterVariant[] {
  return CHARACTER_VARIANTS.filter(v => v.marketerType === marketerType);
}

/* ═══════════════════════════════════════════════════════════
   NEW: 스킨 시스템
═══════════════════════════════════════════════════════════ */

export type SkinUnlockType = "default" | "level" | "missions" | "posts" | "balance";

export interface SkinVariant {
  id: string;
  label: string;
  emoji: string;
  cssFilter: string;       // "" = 필터 없음
  unlockType: SkinUnlockType;
  unlockValue: number;     // 0 = 항상 해금
  unlockDesc: string;
}

export const SKIN_VARIANTS: SkinVariant[] = [
  {
    id: "default", label: "기본", emoji: "✨", cssFilter: "",
    unlockType: "default", unlockValue: 0, unlockDesc: "기본 제공",
  },
  {
    id: "night", label: "나이트", emoji: "🌙",
    cssFilter: "brightness(0.65) contrast(1.15) saturate(0.75)",
    unlockType: "level", unlockValue: 15, unlockDesc: "Lv.15 달성",
  },
  {
    id: "gold", label: "골드", emoji: "✨",
    cssFilter: "sepia(0.45) saturate(2.2) hue-rotate(8deg) brightness(1.15)",
    unlockType: "missions", unlockValue: 20, unlockDesc: "미션 20개 완료",
  },
  {
    id: "neon", label: "네온", emoji: "🌈",
    cssFilter: "saturate(2.8) brightness(1.3) contrast(1.1)",
    unlockType: "posts", unlockValue: 10, unlockDesc: "게시물 10개 업로드",
  },
  {
    id: "ice", label: "아이스", emoji: "❄️",
    cssFilter: "hue-rotate(185deg) saturate(0.55) brightness(1.18)",
    unlockType: "balance", unlockValue: 1000000, unlockDesc: "잔액 100만원 달성",
  },
];

export function getSkinById(id: string): SkinVariant {
  return SKIN_VARIANTS.find(s => s.id === id) ?? SKIN_VARIANTS[0];
}

export function isSkinUnlocked(
  skin: SkinVariant,
  level: number,
  completedMissions: number,
  postCount: number,
  balance: number,
): boolean {
  if (skin.unlockType === "default") return true;
  if (skin.unlockType === "level")    return level >= skin.unlockValue;
  if (skin.unlockType === "missions") return completedMissions >= skin.unlockValue;
  if (skin.unlockType === "posts")    return postCount >= skin.unlockValue;
  if (skin.unlockType === "balance")  return balance >= skin.unlockValue;
  return false;
}
