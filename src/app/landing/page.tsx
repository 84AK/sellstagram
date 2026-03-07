"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /landing 경로는 루트(/)로 리다이렉트
export default function LandingRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace("/"); }, [router]);
    return null;
}
