import { NextResponse } from "next/server";
import { askGemini, GeminiError } from "@/lib/ai/gemini";
import { AI_PROMPTS } from "@/lib/ai/prompts";

export async function POST(request: Request) {
    try {
        const { caption, engagement, type } = await request.json();

        let prompt = "";
        if (type === "coach") {
            prompt = AI_PROMPTS.COACH_INSIGHT(caption, engagement);
        }

        if (!prompt) {
            return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
        }

        const insight = await askGemini(prompt);
        return NextResponse.json({ insight });
    } catch (error) {
        if (error instanceof GeminiError) {
            const status = error.type === "quota" ? 429 : error.type === "invalid_key" ? 403 : 500;
            return NextResponse.json({ error: error.userMessage, errorType: error.type }, { status });
        }
        console.error("AI Analyze API Error:", error);
        return NextResponse.json({ error: "AI가 잠시 쉬고 있어요. 조금 후에 다시 시도해주세요. 🤖" }, { status: 500 });
    }
}
