import { NextResponse } from "next/server";
import { askGemini } from "@/lib/ai/gemini";
import { AI_PROMPTS } from "@/lib/ai/prompts";

export async function POST(request: Request) {
    try {
        const { currentCaption, feedback, productName, strategy, tone } = await request.json();

        if (!currentCaption || !feedback || !productName || !strategy) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const prompt = AI_PROMPTS.REFINE_CONTENT(
            currentCaption,
            feedback,
            productName,
            strategy.theme,
            strategy.keywords,
            tone
        );

        const raw = await askGemini(prompt);
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json(parsed);
    } catch (error) {
        console.error("Refine API Error:", error);
        return NextResponse.json({ error: "AI 재생성 중 오류가 발생했습니다." }, { status: 500 });
    }
}
