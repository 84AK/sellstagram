import { NextResponse } from "next/server";
import { askGemini } from "@/lib/ai/gemini";
import { AI_PROMPTS } from "@/lib/ai/prompts";

export async function POST(request: Request) {
    try {
        const { productName, targetAudience, strategy, tone } = await request.json();

        if (!productName || !strategy || !tone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const prompt = AI_PROMPTS.DRAFT_CONTENT(
            productName,
            targetAudience,
            strategy.theme,
            strategy.strategy,
            strategy.description,
            strategy.tip,
            strategy.keywords,
            tone
        );

        const raw = await askGemini(prompt);

        // JSON 파싱 (코드블록 제거)
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json(parsed);
    } catch (error) {
        console.error("Draft API Error:", error);
        return NextResponse.json({ error: "AI 초안 생성 중 오류가 발생했습니다." }, { status: 500 });
    }
}
