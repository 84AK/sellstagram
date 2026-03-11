"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !password) return;
        setLoading(true);
        setError("");

        const res = await fetch("/api/auth/admin-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, password }),
        });

        if (res.ok) {
            router.push("/admin/dashboard");
        } else {
            setError("아이디 또는 비밀번호가 올바르지 않습니다.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: "var(--background)" }}>
            <div className="w-full max-w-sm flex flex-col gap-8">
                {/* 헤더 */}
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>
                        <Shield size={32} className="text-white" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-black" style={{ color: "var(--foreground)" }}>
                            관리자 로그인
                        </h1>
                        <p className="text-sm mt-1" style={{ color: "var(--foreground-soft)" }}>
                            Sellstagram Admin
                        </p>
                    </div>
                </div>

                {/* 폼 */}
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest"
                            style={{ color: "var(--foreground-soft)" }}>
                            관리자 ID
                        </label>
                        <input
                            type="text"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            placeholder="아이디 입력"
                            autoComplete="username"
                            className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                            style={{
                                background: "var(--card-bg)",
                                border: "1px solid var(--border)",
                                color: "var(--foreground)",
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest"
                            style={{ color: "var(--foreground-soft)" }}>
                            비밀번호
                        </label>
                        <div className="relative">
                            <input
                                type={showPw ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호 입력"
                                autoComplete="current-password"
                                className="w-full px-4 py-3 pr-11 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                                style={{
                                    background: "var(--card-bg)",
                                    border: "1px solid var(--border)",
                                    color: "var(--foreground)",
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                                style={{ color: "var(--foreground-soft)" }}
                            >
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-center font-medium text-red-500">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !id || !password}
                        className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", color: "white" }}
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                        {loading ? "인증 중..." : "관리자로 로그인"}
                    </button>
                </form>

                <p className="text-center text-xs" style={{ color: "var(--foreground-soft)" }}>
                    관리자 계정은 운영자만 사용할 수 있습니다.
                </p>
                <button
                    onClick={() => router.push("/feed")}
                    className="text-center text-xs font-semibold hover:underline"
                    style={{ color: "var(--foreground-muted)" }}
                >
                    ← 학생 앱으로 돌아가기
                </button>
            </div>
        </div>
    );
}
