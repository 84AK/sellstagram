import { NextResponse } from "next/server";
import { askGemini, GeminiError } from "@/lib/ai/gemini";
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
        if (error instanceof GeminiError) {
            const status = error.type === "quota" ? 429 : error.type === "invalid_key" ? 403 : 500;
            return NextResponse.json({ error: error.userMessage, errorType: error.type }, { status });
        }
        console.error("Refine API Error:", error);
        return NextResponse.json({ error: "AI가 잠시 쉬고 있어요. 조금 후에 다시 시도해주세요. 🤖" }, { status: 500 });
    }
}
