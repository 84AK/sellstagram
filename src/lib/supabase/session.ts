import { supabase } from "./client";
import type { Session } from "@supabase/supabase-js";

/**
 * 모든 브라우저에서 안정적으로 유효한 세션을 반환합니다.
 *
 * 동작 순서:
 * 1. getSession() — localStorage의 토큰 확인
 * 2. 토큰 있으나 만료 → refreshSession() 으로 자동 갱신
 * 3. 둘 다 실패 → null 반환 (호출부에서 재로그인 안내)
 *
 * iOS Safari, Chrome, Firefox, Samsung Internet 등
 * 모든 브라우저에서 동일하게 동작합니다.
 */
export async function getValidSession(): Promise<Session | null> {
    // 1차: 현재 세션 조회
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session;

    // 2차: 세션 없으면 refresh 시도 (iOS 백그라운드 복귀, 탭 재활성화 등)
    const { data: { session: refreshed }, error } = await supabase.auth.refreshSession();
    if (error) {
        console.warn("[Sellstagram] 세션 갱신 실패:", error.message);
        return null;
    }
    return refreshed;
}

/**
 * 세션이 없을 때 사용자에게 표시할 공통 에러 메시지
 * (alert 대신 toast를 사용하는 경우 이 함수를 수정하세요)
 */
export function showSessionExpiredError() {
    alert(
        "로그인 세션이 만료되었어요.\n\n" +
        "아래 방법으로 해결할 수 있어요:\n" +
        "1. 페이지를 새로고침 (F5 또는 당겨서 새로고침)\n" +
        "2. 그래도 안 되면 로그아웃 후 다시 로그인\n\n" +
        "아이패드/아이폰에서는 사파리를 완전히 종료 후\n" +
        "다시 열면 해결됩니다."
    );
}
