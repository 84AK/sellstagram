import { askGemini } from "./gemini";
import { AI_PROMPTS } from "./prompts";

/**
 * 2026 Sellstagram Vision Analysis Engine
 */

export async function analyzePostVisual(imageData: string, caption: string) {
    try {
        const prompt = AI_PROMPTS.VISION_ANALYSIS(caption);
        const text = await askGemini(prompt);

        return {
            visualScore: 0.85, // Mocked score
            analysis: text,
            colorPalette: ["#FF007A", "#00F0FF", "#7000FF"],
        };
    } catch (error) {
        console.error("Vision Analysis Error:", error);
        return {
            visualScore: 0.5,
            analysis: "이미지 분석 중 오류가 발생했습니다. 기본적인 디자인 원칙을 준수하세요.",
            colorPalette: [],
        };
    }
}
