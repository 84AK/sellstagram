import { NextResponse } from "next/server";
import { askGemini } from "@/lib/ai/gemini";
import { AI_PROMPTS } from "@/lib/ai/prompts";
import { CUSTOMER_PERSONAS } from "@/lib/ai/personas";

const PERSONA_EMOJIS: Record<string, string> = { p1: "🛍️", p2: "♻️", p3: "🔍", p4: "✨" };

export async function POST(request: Request) {
    try {
        const { product, tags, caption } = await request.json();

        const prompt = AI_PROMPTS.PEOPLE_REACTIONS(
            product || "스마트워치",
            tags || ["테크", "패션"],
            CUSTOMER_PERSONAS,
            caption || product
        );

        const result = await askGemini(prompt);

        try {
            const jsonStart = result.indexOf("[");
            const jsonEnd = result.lastIndexOf("]") + 1;
            const jsonStr = result.substring(jsonStart, jsonEnd);
            const reactions = JSON.parse(jsonStr);

            // personaEmoji 필드 추가
            const enriched = reactions.map((r: { personaId: string; [key: string]: unknown }) => ({
                ...r,
                personaEmoji: PERSONA_EMOJIS[r.personaId] ?? "👤",
            }));

            return NextResponse.json({ reactions: enriched });
        } catch {
            console.error("JSON Parsing Error:", result);
            return NextResponse.json({
                reactions: [
                    { name: "민지(18)", comment: "와 진짜 사고 싶어요! 😍", personaId: "p1", sentiment: "positive", personaEmoji: "🛍️" },
                    { name: "재현(24)", comment: "친환경 제품이군요! 좋아요 ♻️", personaId: "p2", sentiment: "positive", personaEmoji: "♻️" },
                    { name: "서준(30)", comment: "가격 대비 품질이 어때요? 🔍", personaId: "p3", sentiment: "skeptical", personaEmoji: "🔍" },
                ]
            });
        }
    } catch (error) {
        console.error("AI Reactions API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
