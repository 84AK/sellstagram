/**
 * 2026 Sellstagram Commerce Engine
 * 게시물의 퀄리티를 분석하여 가상의 판매 지표를 생성하는 핵심 로직입니다.
 */

interface PostData {
    caption: string;
    hashtags: string[];
    visualQuality: number; // 0 to 1
    baseFollowers: number;
}

interface SimulationResult {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    engagementRate: number;
}

const BASE_CTR = 0.05; // 5% 기본 클릭률
const BASE_CVR = 0.02; // 2% 기본 구매 전환율 (커머스 평균)

export function simulateMarketingEffect(post: PostData, productPrice: number): SimulationResult {
    // 1. 카피라이팅 분석 (단순 길이 및 키워드 기반 가중치 변환)
    const captionWeight = post.caption.length > 20 && post.caption.length < 100 ? 1.2 : 0.8;
    const hashTagWeight = post.hashtags.length >= 3 && post.hashtags.length <= 10 ? 1.1 : 0.9;

    // 2. 도달 범위 계산 (팔로워 수 + 랜덤 노출)
    const impressions = Math.floor(post.baseFollowers * (0.5 + Math.random() * 2) * post.visualQuality);

    // 3. 클릭률(CTR) 계산
    const ctr = BASE_CTR * captionWeight * hashTagWeight * (0.8 + Math.random() * 0.4);
    const clicks = Math.floor(impressions * ctr);

    // 4. 구매 전환율(CVR) 계산 (가격 저항성 포함)
    const priceResistance = productPrice > 50000 ? 0.7 : 1.0;
    const cvr = BASE_CVR * post.visualQuality * priceResistance * (0.9 + Math.random() * 0.2);
    const conversions = Math.floor(clicks * cvr);

    // 5. 최종 성과 보고
    return {
        impressions,
        clicks,
        conversions,
        revenue: conversions * productPrice,
        engagementRate: Number(((clicks / impressions) * 100).toFixed(2))
    };
}
