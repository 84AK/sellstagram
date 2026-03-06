import { NextResponse } from "next/server";
import { askGemini } from "@/lib/ai/gemini";
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
        console.error("AI API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
