import { NextResponse } from "next/server";
import { askGemini } from "@/lib/ai/gemini";
import { AI_PROMPTS } from "@/lib/ai/prompts";

export async function POST(request: Request) {
    try {
        const { weekNumber, sessionTitle, postCount, avgEngagement, totalLikes, bestCaption } = await request.json();

        const prompt = AI_PROMPTS.WEEKLY_REPORT(
            weekNumber,
            sessionTitle,
            postCount,
            avgEngagement,
            totalLikes,
            bestCaption
        );

        const coaching = await askGemini(prompt);
        return NextResponse.json({ coaching });
    } catch (error) {
        console.error("Weekly Report API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
