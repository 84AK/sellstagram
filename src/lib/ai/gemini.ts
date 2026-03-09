import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── 에러 타입 분류 ───────────────────────────────────────────────────
export type GeminiErrorType = "quota" | "invalid_key" | "network" | "unknown";

export class GeminiError extends Error {
    type: GeminiErrorType;
    userMessage: string;

    constructor(type: GeminiErrorType, userMessage: string, original?: unknown) {
        super(userMessage);
        this.name = "GeminiError";
        this.type = type;
        this.userMessage = userMessage;
        if (original instanceof Error) this.stack = original.stack;
    }
}

function classifyGeminiError(error: unknown): GeminiError {
    const msg = error instanceof Error ? error.message : String(error);
    const lower = msg.toLowerCase();

    if (lower.includes("429") || lower.includes("resource_exhausted") || lower.includes("quota")) {
        return new GeminiError(
            "quota",
            "오늘 AI 사용량이 가득 찼어요. 내일 다시 시도하거나, 선생님께 문의해주세요. 😅",
            error
        );
    }

    if (lower.includes("403") || lower.includes("api_key_invalid") || lower.includes("permission_denied") || lower.includes("api key not valid")) {
        return new GeminiError(
            "invalid_key",
            "AI 연결에 문제가 생겼어요. 선생님께 알려주세요. 🔑",
            error
        );
    }

    if (lower.includes("fetch failed") || lower.includes("networkerror") || lower.includes("econnrefused") || lower.includes("enotfound")) {
        return new GeminiError(
            "network",
            "인터넷 연결을 확인해주세요. 네트워크 오류가 발생했어요. 🌐",
            error
        );
    }

    return new GeminiError(
        "unknown",
        "AI가 잠시 쉬고 있어요. 조금 후에 다시 시도해주세요. 🤖",
        error
    );
}

// ─── Gemini 클라이언트 ────────────────────────────────────────────────
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
export const geminiFlash = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// ─── 핵심 호출 함수 ───────────────────────────────────────────────────
export async function askGemini(prompt: string): Promise<string> {
    if (!apiKey) {
        throw new GeminiError("invalid_key", "AI 연결에 문제가 생겼어요. 선생님께 알려주세요. 🔑");
    }

    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        const geminiError = classifyGeminiError(error);
        console.error(`[Gemini ${geminiError.type}]`, error);
        throw geminiError;
    }
}
