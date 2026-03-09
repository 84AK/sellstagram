import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";

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

// ─── API 키 캐시 (서버 메모리, 5분 TTL) ──────────────────────────────
let cachedKey: string | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

async function resolveApiKey(): Promise<string> {
    const now = Date.now();

    // 캐시 유효하면 바로 반환
    if (cachedKey && now < cacheExpiresAt) {
        return cachedKey;
    }

    // DB에서 키 조회 시도
    try {
        const admin = createAdminClient();
        const { data } = await admin
            .from("app_settings")
            .select("gemini_api_key")
            .eq("id", 1)
            .single();

        if (data?.gemini_api_key) {
            cachedKey = data.gemini_api_key as string;
            cacheExpiresAt = now + CACHE_TTL_MS;
            return cachedKey;
        }
    } catch {
        // DB 연결 실패 시 env var fallback
    }

    // env var fallback
    const envKey = process.env.GEMINI_API_KEY ?? "";
    cachedKey = envKey;
    cacheExpiresAt = now + CACHE_TTL_MS;
    return envKey;
}

// DB 키 저장 후 캐시 즉시 무효화 (새 키 즉시 반영)
export function invalidateApiKeyCache() {
    cachedKey = null;
    cacheExpiresAt = 0;
}

// ─── 핵심 호출 함수 ───────────────────────────────────────────────────
export async function askGemini(prompt: string): Promise<string> {
    const apiKey = await resolveApiKey();

    if (!apiKey) {
        throw new GeminiError("invalid_key", "AI 연결에 문제가 생겼어요. 선생님께 알려주세요. 🔑");
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        const geminiError = classifyGeminiError(error);
        console.error(`[Gemini ${geminiError.type}]`, error);
        throw geminiError;
    }
}

// 하위 호환성 유지
export const geminiModel = null;
export const geminiFlash = null;
