import { useGameStore } from "@/store/useGameStore";

/**
 * AI 기능 접근 권한 훅
 *
 * 허용 조건:
 *   - role = "admin" | "teacher"  → 항상 허용
 *   - team 값이 있는 학생 (선생님이 팀 배정)  → 허용
 *   - team 비어있음 (팀 미배정)  → 잠금 (유료 플랜 필요)
 */
export function useAIAccess() {
    const { user } = useGameStore();

    const isPrivileged =
        user.role === "admin" ||
        user.role === "teacher";

    // "미배정" 또는 빈 문자열이면 팀 미배정으로 판단
    const UNASSIGNED_VALUES = ["", "미배정", "unassigned"];
    const hasTeam =
        typeof user.team === "string" &&
        !UNASSIGNED_VALUES.includes(user.team.trim());

    const hasAccess = isPrivileged || hasTeam;

    return {
        /** true → AI 기능 사용 가능 */
        hasAccess,
        /** true → 관리자 / 교사 */
        isPrivileged,
        /** true → 팀 배정된 학생 */
        hasTeam,
    };
}
