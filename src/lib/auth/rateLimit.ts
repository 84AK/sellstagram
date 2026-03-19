/**
 * 서버 메모리 기반 Rate Limiter (Redis 없이 동작)
 * Next.js 서버 인스턴스가 재시작되면 카운터 초기화됨
 * 교실 환경(단일 서버)에서 충분한 수준의 보호 제공
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const limitMap = new Map<string, RateLimitEntry>();

// 오래된 항목 주기적 정리 (메모리 누수 방지)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of limitMap.entries()) {
        if (now > entry.resetAt) limitMap.delete(key);
    }
}, 60_000);

/**
 * @param key       - IP 주소 등 식별자
 * @param max       - 윈도우 내 최대 요청 수
 * @param windowMs  - 윈도우 크기 (밀리초)
 * @returns         - true: 허용, false: 차단
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = limitMap.get(key);

    if (!entry || now > entry.resetAt) {
        limitMap.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (entry.count >= max) return false;
    entry.count++;
    return true;
}

/** IP 추출 헬퍼 */
export function getClientIP(request: Request): string {
    const forwarded = (request as Request & { headers: Headers }).headers.get("x-forwarded-for");
    return forwarded?.split(",")[0].trim() ?? "unknown";
}
