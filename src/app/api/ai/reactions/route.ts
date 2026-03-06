import { NextResponse } from "next/server";
import { askGemini } from "@/lib/ai/gemini";
import { AI_PROMPTS } from "@/lib/ai/prompts";
import { CUSTOMER_PERSONAS } from "@/lib/ai/personas";

export async function POST(request: Request) {
    try {
        const { product, tags } = await request.json();

        const prompt = AI_PROMPTS.PEOPLE_REACTIONS(
            product || "스마트워치",
            tags || ["테크", "패션"],
            CUSTOMER_PERSONAS
        );

        const result = await askGemini(prompt);

        // Attempt to parse JSON from Gemini's response
        try {
            const jsonStart = result.indexOf("[");
            const jsonEnd = result.lastIndexOf("]") + 1;
            const jsonStr = result.substring(jsonStart, jsonEnd);
            const reactions = JSON.parse(jsonStr);

            return NextResponse.json({ reactions });
        } catch (parseError) {
            console.error("JSON Parsing Error:", result);
            return NextResponse.json({
                reactions: [
                    { name: "지우", comment: "와 진짜 이뻐요! 😍", personaId: "p1" },
                    { name: "민수", comment: "이거 어디서 사요? 🔥", personaId: "p2" }
                ]
            });
        }
    } catch (error) {
        console.error("AI Reactions API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
