import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin/token";

export async function GET(request: NextRequest) {
    const token = request.cookies.get("admin_token")?.value ?? "";
    return NextResponse.json({ isAdmin: verifyAdminToken(token) });
}
