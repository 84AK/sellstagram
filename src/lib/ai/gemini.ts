import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
    model: "gemini-flash-latest"
});

export const geminiFlash = genAI.getGenerativeModel({
    model: "gemini-flash-latest"
});

export async function askGemini(prompt: string) {
    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
}
