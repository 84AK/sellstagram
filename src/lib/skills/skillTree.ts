export type SkillKey = "copywriting" | "analytics" | "creative";

export interface SkillLevel {
    level: number;
    label: string;
    minXP: number;
    color: string;
    unlock: string;   // 이 레벨에서 해금되는 것
}

export interface SkillDef {
    key: SkillKey;
    name: string;
    nameEn: string;
    icon: string;
    color: string;       // CSS var or hex
    bgColor: string;
    description: string;
    howToEarn: string;   // XP 획득 방법 안내
    levels: SkillLevel[];
}

export const LEVELS: SkillLevel[] = [
    { level: 1, label: "견습생",      minXP: 0,   color: "#9CA3AF", unlock: "기본 AI 분석 1회" },
    { level: 2, label: "성장 중",     minXP: 100, color: "#60A5FA", unlock: "AI 리포트 전략 팁 추가" },
    { level: 3, label: "실전 마케터", minXP: 250, color: "#34D399", unlock: "챌린지 보너스 XP +10%" },
    { level: 4, label: "전문가",      minXP: 500, color: "#F59E0B", unlock: "피드 부스트 아이템 할인" },
    { level: 5, label: "마스터",      minXP: 800, color: "#FF6B35", unlock: "프로필 골드 프레임 해금" },
];

export const SKILLS: SkillDef[] = [
    {
        key: "copywriting",
        name: "카피라이팅",
        nameEn: "Copywriting",
        icon: "✍️",
        color: "var(--primary)",
        bgColor: "var(--primary-light)",
        description: "소비자의 마음을 움직이는 문장을 쓰는 능력",
        howToEarn: "게시물 업로드, 챌린지 참여 시 XP 획득",
        levels: LEVELS,
    },
    {
        key: "analytics",
        name: "데이터 분석",
        nameEn: "Analytics",
        icon: "📊",
        color: "var(--secondary)",
        bgColor: "rgba(67,97,238,0.1)",
        description: "마케팅 성과를 읽고 전략을 개선하는 능력",
        howToEarn: "AI 분석 실행, 리포트 열람 시 XP 획득",
        levels: LEVELS,
    },
    {
        key: "creative",
        name: "크리에이티브",
        nameEn: "Creative",
        icon: "🎨",
        color: "var(--accent)",
        bgColor: "rgba(6,214,160,0.1)",
        description: "시각적 임팩트와 콘텐츠 기획 감각",
        howToEarn: "이미지 포함 게시물, 다양한 콘텐츠 업로드 시 XP 획득",
        levels: LEVELS,
    },
];

export interface SkillXP {
    copywriting: number;
    analytics: number;
    creative: number;
}

export const DEFAULT_SKILL_XP: SkillXP = {
    copywriting: 0,
    analytics: 0,
    creative: 0,
};

/** 현재 XP로 레벨 계산 */
export function getSkillLevel(xp: number): SkillLevel {
    const levels = [...LEVELS].reverse();
    return levels.find(l => xp >= l.minXP) ?? LEVELS[0];
}

/** 다음 레벨까지 필요한 XP와 현재 진행률 */
export function getSkillProgress(xp: number): { current: number; next: number | null; percent: number } {
    const currentLevel = getSkillLevel(xp);
    const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
    if (!nextLevel) return { current: xp, next: null, percent: 100 };
    const rangeXP = nextLevel.minXP - currentLevel.minXP;
    const earnedXP = xp - currentLevel.minXP;
    return {
        current: earnedXP,
        next: rangeXP,
        percent: Math.min(100, Math.floor((earnedXP / rangeXP) * 100)),
    };
}
