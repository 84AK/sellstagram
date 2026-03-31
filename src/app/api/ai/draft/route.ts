import { NextRequest, NextResponse } from "next/server";
import { askGemini, GeminiError } from "@/lib/ai/gemini";
import { AI_PROMPTS } from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(request: NextRequest) {
    // 🚦 Rate Limiting
    const limitResponse = await rateLimit(request);
    if (limitResponse) return limitResponse;
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
        if (error instanceof GeminiError) {
            const status = error.type === "quota" ? 429 : error.type === "invalid_key" ? 403 : 500;
            return NextResponse.json({ error: error.userMessage, errorType: error.type }, { status });
        }
        console.error("Draft API Error:", error);
        return NextResponse.json({ error: "AI가 잠시 쉬고 있어요. 조금 후에 다시 시도해주세요. 🤖" }, { status: 500 });
    }
}
