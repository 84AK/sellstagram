import { createHmac } from "crypto";

// ADMIN_ID + ADMIN_PASSWORD 기반의 결정론적 토큰 생성 (서버 전용)
// 코드에 자격증명이 절대 포함되지 않고 env vars에만 존재
export function generateAdminToken(): string {
    const id = process.env.ADMIN_ID ?? "";
    const pw = process.env.ADMIN_PASSWORD ?? "";
    if (!id || !pw) return "";
    return createHmac("sha256", pw).update(id).digest("hex");
}

export function verifyAdminToken(token: string): boolean {
    if (!token) return false;
    return token === generateAdminToken();
}
