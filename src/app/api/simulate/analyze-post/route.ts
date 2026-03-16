import { NextRequest, NextResponse } from "next/server";
import { askGemini, askGeminiVision, GeminiError } from "@/lib/ai/gemini";
import { AI_PROMPTS } from "@/lib/ai/prompts";

export interface SimAnalysisResult {
    conversionBoost: number;       // 0.3 ~ 2.5 (구매 전환율 배율)
    purchaseReason: string;        // 구매 동기 한 줄 요약
    landingScore: number;          // 랜딩 페이지 품질 점수 (0~10)
    aiComments: Array<{
        text: string;
        style: "positive" | "curious" | "skeptical" | "purchase";
    }>;
}

// 시뮬레이션 시작 시 1회만 호출 — 캡션+랜딩 이미지를 분석하여 구매 전환 데이터 생성
export async function POST(request: NextRequest) {
    try {
        const { caption, tags, price, landingImages } = await request.json() as {
            caption: string;
            tags: string[];
            price: number;
            landingImages: string[];
        };

        const prompt = AI_PROMPTS.SIM_ANALYZE(
            caption || "",
            tags || [],
            price || 10000,
            landingImages?.length ?? 0
        );

        let raw: string;

        // 랜딩 이미지가 있으면 Vision 모델로 실제 이미지 분석
        if (landingImages && landingImages.length > 0) {
            raw = await askGeminiVision(prompt, landingImages);
        } else {
            raw = await askGemini(prompt);
        }

        // JSON 파싱
        const jsonStart = raw.indexOf("{");
        const jsonEnd = raw.lastIndexOf("}") + 1;
        if (jsonStart === -1) throw new Error("JSON not found in response");

        const parsed = JSON.parse(raw.substring(jsonStart, jsonEnd)) as SimAnalysisResult;

        // 값 범위 안전 보정
        parsed.conversionBoost = Math.max(0.3, Math.min(2.5, parsed.conversionBoost ?? 1.0));
        parsed.landingScore = Math.max(0, Math.min(10, parsed.landingScore ?? 5));
        if (!Array.isArray(parsed.aiComments) || parsed.aiComments.length === 0) {
            throw new Error("aiComments missing");
        }

        return NextResponse.json({ ok: true, analysis: parsed });

    } catch (error) {
        if (error instanceof GeminiError) {
            console.warn(`[SimAnalyze GeminiError ${error.type}] fallback 사용`);
        } else {
            console.error("[SimAnalyze Error]", error);
        }

        // fallback — AI 실패 시 기본값 반환 (시뮬레이션은 계속 진행)
        const fallback: SimAnalysisResult = {
            conversionBoost: 1.0,
            purchaseReason: "기본 마케팅 전략",
            landingScore: 5,
            aiComments: [
                { text: "완전 제 스타일이에요 😍", style: "positive" },
                { text: "이거 어디서 살 수 있어요?", style: "curious" },
                { text: "가성비 미쳤다 ㅠㅠ", style: "positive" },
                { text: "소재가 어떻게 되나요?", style: "curious" },
                { text: "친구한테도 보여줘야겠다!", style: "positive" },
                { text: "가격이 조금 부담스럽긴 해요", style: "skeptical" },
                { text: "방금 주문했어요! 📦", style: "purchase" },
                { text: "콘텐츠 너무 잘 만들었다 👏", style: "positive" },
            ],
        };
        return NextResponse.json({ ok: true, analysis: fallback, fallback: true });
    }
}
