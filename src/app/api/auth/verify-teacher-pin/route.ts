import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { pin } = await request.json();
    const correctPin = process.env.TEACHER_PIN;

    if (!correctPin || pin !== correctPin) {
        return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({ valid: true });
}
