import { NextRequest, NextResponse } from "next/server";

/**
 * 🚀 초간단 인메모리 Rate Limiter (서버리스 환경에서는 인스턴스별로 공유되지 않을 수 있음)
 * 하지만 동일 인스턴스로 들어오는 무분별한 요청을 방어하는 데 효과적입니다.
 */

interface RateLimitStore {
    count: number;
    resetTime: number;
}

const store = new Map<string, RateLimitStore>();

// 설정: 1분당 최대 10회 요청 허용 (AI 호출용)
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

export async function rateLimit(request: NextRequest) {
    // x-forwarded-for 헤더를 먼저 확인하고, 없으면 request.ip(Vercel 등)를 사용
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : (request as any).ip || "anonymous";
    const now = Date.now();
    const currentState = store.get(ip);

    if (!currentState || now > currentState.resetTime) {
        // 처음이거나 시간이 경과한 경우 초기화
        store.set(ip, {
            count: 1,
            resetTime: now + WINDOW_MS,
        });
        return null; // 통과
    }

    if (currentState.count >= MAX_REQUESTS) {
        // 한도 초과
        return NextResponse.json(
            { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요. (Rate Limit Exceeded)" },
            { 
                status: 429,
                headers: {
                    "Retry-After": Math.ceil((currentState.resetTime - now) / 1000).toString(),
                }
            }
        );
    }

    // 카운트 증가
    currentState.count += 1;
    return null; // 통과
}

// ─── 가비지 컬렉션 (주기적으로 만료된 데이터 삭제) ───
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [ip, state] of store.entries()) {
            if (now > state.resetTime) {
                store.delete(ip);
            }
        }
    }, 5 * 60 * 1000); // 5분마다 청소
}
