import { NextRequest, NextResponse } from "next/server";
import { generateAdminToken } from "@/lib/admin/token";

export async function POST(request: NextRequest) {
    const { id, password } = await request.json();

    if (
        !process.env.ADMIN_ID ||
        !process.env.ADMIN_PASSWORD ||
        id !== process.env.ADMIN_ID ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return NextResponse.json({ error: "인증 실패" }, { status: 401 });
    }

    const token = generateAdminToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24시간
        path: "/",
    });

    return response;
}
