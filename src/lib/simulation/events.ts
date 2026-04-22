/**
 * Sellstagram Market Simulation — Event Generator
 * 선생님이 시뮬레이션을 시작하면 게시물별로 가상 구매자 이벤트 시퀀스를 생성합니다.
 * seed 기반 결정론적 생성 → 같은 시작 시간 + 같은 포스트 → 항상 동일한 이벤트
 */

import { CUSTOMER_PERSONAS } from "@/lib/ai/personas";

export interface SimEvent {
    id: string;
    type: "like" | "comment" | "share" | "purchase";
    persona: { name: string; age: string; avatar: string; occupation?: string };
    comment?: string;
    amount?: number;     // 구매 금액 (purchase only)
    realMs: number;      // 실제 표시 시각 (ms from sim start)
    simHour: number;     // 시뮬레이션 시간 (1 simHour = 1 real minute)
}

// ─── 가상 구매자 페르소나 — personas.ts에서 파생 (Single Source of Truth)
const PERSONAS = CUSTOMER_PERSONAS.map(p => ({
    name: p.name,
    age: String(p.age),
    avatar: p.avatar,
    occupation: p.occupation,
}));

// ─── 댓글 템플릿 풀 ────────────────────────────────────────────
const COMMENTS = {
    positive: [
        "완전 제 스타일이에요 😍",
        "이거 어디서 살 수 있어요?",
        "너무 예쁘다 ㅠㅠ 사고싶다",
        "친구한테도 보여줘야겠다!",
        "이 가격이면 완전 득템이죠?",
        "품질 진짜 좋아보여요!",
        "배송 얼마나 걸려요? 빨리 받고 싶어요",
        "색상 다른 것도 있나요?",
        "인스타 올리려고 바로 주문했어요 🙌",
        "가성비 미쳤다 ㅠㅠ",
        "캡션이 너무 공감가요ㅠ",
        "이미 장바구니 담아뒀어요!",
        "콘텐츠 너무 잘 만들었다 👏",
        "다음에 또 올려주세요!",
    ],
    curious: [
        "소재가 어떻게 되나요?",
        "사이즈는 어떻게 되나요?",
        "후기 더 있으면 좋겠어요",
        "직접 써보셨나요?",
        "할인 행사는 없나요?",
        "다른 색상도 있나요?",
        "학생들도 살 수 있나요?",
    ],
    skeptical: [
        "다른 후기도 좀 찾아봐야겠네요",
        "가격이 조금 부담스럽긴 해요",
        "품질 보장은 어떻게 해요?",
        "AS는 어떻게 되나요?",
    ],
    purchase: [
        "방금 주문했어요! 빨리 오길 바라요 📦",
        "결제 완료! 배송 기대할게요 ✨",
        "친구랑 같이 하나씩 샀어요!",
        "드디어 샀다~ 오래 기다렸어요",
        "선물로 사봤어요 🎁",
    ],
};

// ─── 시드 기반 랜덤 함수 ────────────────────────────────────────
function seededRand(seed: number) {
    let s = (seed >>> 0) || 1;
    return () => {
        s = Math.imul(1664525, s) + 1013904223 | 0;
        return (s >>> 0) / 0xFFFFFFFF;
    };
}

function strHash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return Math.abs(h);
}

export interface AiComment {
    text: string;
    style: "positive" | "curious" | "skeptical" | "purchase";
}

// ─── 이벤트 생성 진입점 ────────────────────────────────────────
export function generateSimEvents(
    postId: string,
    engagementRateStr: string,   // e.g. "8.4%" or "8.4"
    productPrice: number,
    durationMinutes: number,
    simStartedAt: string,        // ISO string — seed 생성에 사용
    options?: {
        conversionBoost?: number;   // AI 분석 결과 구매 전환 배율 (default 1.0)
        aiComments?: AiComment[];   // AI가 생성한 맞춤 댓글 풀
    }
): SimEvent[] {
    const seed = strHash(simStartedAt + postId);
    const rand = seededRand(seed);
    const durationMs = durationMinutes * 60 * 1000;

    const conversionBoost = options?.conversionBoost ?? 1.0;
    const aiComments = options?.aiComments ?? [];

    // 인게이지먼트율로 배율 결정 (0.5x ~ 4x)
    const engRate = parseFloat(engagementRateStr?.replace("%", "")) || 5;
    const engMult = Math.max(0.5, Math.min(4, engRate / 5));

    // AI 분석 배율 적용 — 구매는 conversionBoost, 좋아요/댓글은 부분 반영
    const totalMult = engMult;
    const purchaseMult = engMult * conversionBoost;

    // 이벤트 수 계산
    const numLikes     = Math.round((12 + durationMinutes * 5)   * totalMult);
    const numComments  = Math.round((2  + durationMinutes * 0.8) * totalMult);
    const numShares    = Math.round((1  + durationMinutes * 0.4) * totalMult);
    const numPurchases = Math.floor((0.3 + durationMinutes * 0.2) * purchaseMult);

    const events: SimEvent[] = [];
    let uid = 0;

    // 랜덤 시각 생성 (5%~95% of duration, 자연스러운 분포)
    const randomTime = () => {
        const t = rand();
        const biased = 0.5 + (t - 0.5) * 0.7;
        return Math.min(durationMs * 0.95, Math.max(durationMs * 0.03,
            biased * durationMs + (rand() - 0.5) * durationMs * 0.2
        ));
    };

    const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

    // AI 댓글 풀에서 style 별로 분류
    const aiPool = {
        positive: aiComments.filter(c => c.style === "positive").map(c => c.text),
        curious:  aiComments.filter(c => c.style === "curious").map(c => c.text),
        skeptical: aiComments.filter(c => c.style === "skeptical").map(c => c.text),
        purchase: aiComments.filter(c => c.style === "purchase").map(c => c.text),
    };

    // 댓글 선택: AI 생성본 우선, 없으면 기본 템플릿 fallback
    const pickComment = (style: "positive" | "curious" | "skeptical") => {
        const pool = aiPool[style].length > 0 ? aiPool[style] : COMMENTS[style];
        return pick(pool);
    };
    const pickPurchaseComment = () => {
        const pool = aiPool.purchase.length > 0 ? aiPool.purchase : COMMENTS.purchase;
        return pick(pool);
    };

    // Likes
    for (let i = 0; i < numLikes; i++) {
        events.push({
            id: `like-${uid++}`,
            type: "like",
            persona: pick(PERSONAS),
            realMs: randomTime(),
            simHour: 0,
        });
    }

    // Comments — AI 댓글로 더 사실적인 반응
    for (let i = 0; i < numComments; i++) {
        const r = rand();
        const style = r < 0.6 ? "positive" : r < 0.8 ? "curious" : "skeptical";
        events.push({
            id: `comment-${uid++}`,
            type: "comment",
            persona: pick(PERSONAS),
            comment: pickComment(style),
            realMs: randomTime(),
            simHour: 0,
        });
    }

    // Shares
    for (let i = 0; i < numShares; i++) {
        events.push({
            id: `share-${uid++}`,
            type: "share",
            persona: pick(PERSONAS),
            realMs: randomTime(),
            simHour: 0,
        });
    }

    // Purchases — conversionBoost 반영, 시간 후반부에 더 많이 발생
    for (let i = 0; i < numPurchases; i++) {
        const baseTime = randomTime();
        const purchaseTime = baseTime * 0.4 + durationMs * 0.4 * rand() + durationMs * 0.1;
        events.push({
            id: `purchase-${uid++}`,
            type: "purchase",
            persona: pick(PERSONAS),
            comment: pickPurchaseComment(),
            amount: productPrice,
            realMs: Math.min(durationMs * 0.95, purchaseTime),
            simHour: 0,
        });
    }

    // 시간순 정렬 + simHour 계산
    events.sort((a, b) => a.realMs - b.realMs);
    events.forEach(e => {
        e.simHour = Math.max(1, Math.ceil((e.realMs / durationMs) * durationMinutes));
    });

    return events;
}
