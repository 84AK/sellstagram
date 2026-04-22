"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, X, Smartphone } from "lucide-react";
import { usePushNotification } from "@/lib/push/usePushNotification";

const DISMISSED_KEY = "push_banner_dismissed";

export default function PushPermissionBanner() {
    const { permission, isSubscribed, isSupported, isLoading, subscribe } = usePushNotification();
    const [visible, setVisible] = useState(false);
    const [subscribeResult, setSubscribeResult] = useState<"success" | "denied" | "error" | null>(null);

    useEffect(() => {
        if (!isSupported) return;
        if (permission === "granted" || permission === "denied") return;
        if (sessionStorage.getItem(DISMISSED_KEY)) return;
        // 3초 후 배너 표시 (페이지 로드 직후 덜 침습적으로)
        const t = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(t);
    }, [isSupported, permission]);

    if (!visible || isSubscribed) return null;

    function dismiss() {
        sessionStorage.setItem(DISMISSED_KEY, "1");
        setVisible(false);
    }

    async function handleSubscribe() {
        const ok = await subscribe();
        if (ok) {
            setSubscribeResult("success");
            setTimeout(() => setVisible(false), 2000);
        } else if (Notification.permission === "granted") {
            // 권한은 허용됐지만 구독 등록 자체 실패 (VAPID 설정 등 기술적 오류)
            setSubscribeResult("error");
        } else {
            setSubscribeResult("denied");
        }
    }

    return (
        <div
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[150] w-[min(92vw,400px)] rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
            style={{
                background: "var(--surface)",
                border: "1.5px solid var(--border)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
        >
            <div className="p-4 flex gap-3 items-start">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #FF6B35, #FF9A72)" }}
                >
                    <Bell size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    {subscribeResult === "success" ? (
                        <p className="text-sm font-black" style={{ color: "var(--accent)" }}>
                            알림 설정 완료!
                        </p>
                    ) : subscribeResult === "error" ? (
                        <>
                            <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                구독 등록에 실패했어요
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                잠시 후 다시 시도해 주세요.
                            </p>
                        </>
                    ) : subscribeResult === "denied" ? (
                        <>
                            <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                알림이 차단되었어요
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                브라우저 설정에서 알림을 허용해 주세요.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                수업 알림 받기
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                미션 시작, 선생님 공지, AI 분석 완료 알림을 받아보세요.
                            </p>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={handleSubscribe}
                                    disabled={isLoading}
                                    className="flex-1 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95 disabled:opacity-60"
                                    style={{ background: "linear-gradient(135deg, #FF6B35, #FF9A72)" }}
                                >
                                    {isLoading ? "처리 중..." : "알림 허용"}
                                </button>
                                <button
                                    onClick={dismiss}
                                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                                    style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}
                                >
                                    <BellOff size={12} /> 나중에
                                </button>
                            </div>
                        </>
                    )}
                </div>
                <button onClick={dismiss} className="shrink-0 mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
