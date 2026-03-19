/**
 * 게임 공통 상수 — 여러 파일에서 중복 정의를 방지하기 위해 여기서 단일 관리
 * 아이콘(JSX)는 크기가 컴포넌트마다 달라 각 파일에서 별도 정의
 */

export const MARKETING_TYPE_DATA = [
    {
        id: "creator",
        title: "크리에이터",
        subtitle: "Creator",
        desc: "비주얼과 감성으로 사람들의 마음을 움직이는 타입. 콘텐츠로 말해요!",
        color: "#FF6B35",
        bg: "#FFF0EB",
        badge: "🎨 콘텐츠 창작자",
    },
    {
        id: "analyst",
        title: "분석가",
        subtitle: "Analyst",
        desc: "데이터와 숫자로 정확하게 전략을 세우는 타입. 근거 있는 마케팅!",
        color: "#4361EE",
        bg: "#EEF1FD",
        badge: "📊 데이터 전략가",
    },
    {
        id: "storyteller",
        title: "스토리텔러",
        subtitle: "Storyteller",
        desc: "이야기로 브랜드를 살아있게 만드는 타입. 공감과 감동의 마케팅!",
        color: "#8B5CF6",
        bg: "#F3EEFF",
        badge: "✍️ 브랜드 스토리텔러",
    },
    {
        id: "innovator",
        title: "이노베이터",
        subtitle: "Innovator",
        desc: "항상 새롭고 독특한 아이디어를 내는 타입. 남들이 안 한 것을 해요!",
        color: "#06D6A0",
        bg: "#E6FBF5",
        badge: "💡 트렌드 개척자",
    },
] as const;

export type MarketingTypeId = typeof MARKETING_TYPE_DATA[number]["id"];

export const AVATAR_OPTIONS = [
    "🦊", "🐺", "🦋", "🐬", "🦄", "🐉", "🦅", "🦁", "🐙", "🌟",
] as const;

export const TEAM_META: Record<string, { emoji: string; color: string }> = {
    "A팀": { emoji: "🔥", color: "#FF6B35" },
    "B팀": { emoji: "⚡", color: "#4361EE" },
    "C팀": { emoji: "🌊", color: "#06D6A0" },
    "D팀": { emoji: "🌿", color: "#8B5CF6" },
    "E팀": { emoji: "🦁", color: "#FFC233" },
    "F팀": { emoji: "🚀", color: "#EF4444" },
};

/** TEAM_META에서 이모지만 추출한 맵 */
export const TEAM_EMOJIS: Record<string, string> = Object.fromEntries(
    Object.entries(TEAM_META).map(([k, v]) => [k, v.emoji])
);
