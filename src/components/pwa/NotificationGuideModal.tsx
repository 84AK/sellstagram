"use client";

import { useState, useEffect } from "react";
import { X, Bell, Chrome, Smartphone, Monitor } from "lucide-react";
import { usePushNotification } from "@/lib/push/usePushNotification";

type Browser = "chrome" | "safari" | "firefox" | "edge" | "other";

function detectBrowser(): Browser {
    if (typeof window === "undefined") return "other";
    const ua = navigator.userAgent;
    if (ua.includes("Edg/")) return "edge";
    if (ua.includes("Chrome/")) return "chrome";
    if (ua.includes("Firefox/")) return "firefox";
    if (ua.includes("Safari/")) return "safari";
    return "other";
}

function detectDevice(): "mobile" | "desktop" {
    if (typeof window === "undefined") return "desktop";
    return /Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop";
}

const GUIDES: Record<Browser, { title: string; steps: string[] }> = {
    chrome: {
        title: "Chrome 알림 재허용",
        steps: [
            "주소창 왼쪽 자물쇠(🔒) 아이콘을 클릭하세요",
            '"알림" 항목을 찾아 "차단" → "허용" 으로 변경하세요',
            "페이지를 새로고침한 후 아래 '다시 시도' 버튼을 눌러주세요",
        ],
    },
    safari: {
        title: "Safari 알림 재허용",
        steps: [
            "상단 메뉴에서 Safari → 이 웹사이트 설정을 클릭하세요",
            '"알림" 항목을 "허용" 으로 변경하세요',
            "페이지를 새로고침한 후 아래 '다시 시도' 버튼을 눌러주세요",
        ],
    },
    firefox: {
        title: "Firefox 알림 재허용",
        steps: [
            "주소창 왼쪽 방패(🛡) 아이콘을 클릭하세요",
            '"권한" 섹션에서 알림을 "허용" 으로 변경하세요',
            "페이지를 새로고침한 후 아래 '다시 시도' 버튼을 눌러주세요",
        ],
    },
    edge: {
        title: "Edge 알림 재허용",
        steps: [
            "주소창 왼쪽 자물쇠(🔒) 아이콘을 클릭하세요",
            '"알림" 항목을 "허용" 으로 변경하세요',
            "페이지를 새로고침한 후 아래 '다시 시도' 버튼을 눌러주세요",
        ],
    },
    other: {
        title: "브라우저 알림 재허용",
        steps: [
            "주소창 왼쪽 자물쇠 또는 설정 아이콘을 클릭하세요",
            '"알림" 또는 "권한" 항목을 찾아 허용으로 변경하세요',
            "페이지를 새로고침한 후 아래 '다시 시도' 버튼을 눌러주세요",
        ],
    },
};

interface Props {
    onClose: () => void;
}

export default function NotificationGuideModal({ onClose }: Props) {
    const { subscribe, isLoading, permission } = usePushNotification();
    const [browser, setBrowser] = useState<Browser>("chrome");
    const [device, setDevice] = useState<"mobile" | "desktop">("desktop");
    const [retryResult, setRetryResult] = useState<"success" | "still-denied" | null>(null);

    useEffect(() => {
        setBrowser(detectBrowser());
        setDevice(detectDevice());
    }, []);

    async function handleRetry() {
        setRetryResult(null);
        const ok = await subscribe();
        if (ok) {
            setRetryResult("success");
            setTimeout(onClose, 1500);
        } else {
            setRetryResult("still-denied");
        }
    }

    const guide = GUIDES[browser];

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-md rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom-4 duration-300"
                style={{ background: "var(--surface)", border: "1.5px solid var(--border)" }}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(239,68,68,0.12)" }}
                        >
                            <Bell size={16} style={{ color: "#EF4444" }} />
                        </div>
                        <p className="text-base font-black" style={{ color: "var(--foreground)" }}>
                            {guide.title}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ color: "var(--foreground-muted)" }}>
                        <X size={18} />
                    </button>
                </div>

                {/* 브라우저 탭 */}
                <div className="flex gap-1 mb-5 overflow-x-auto no-scrollbar">
                    {(["chrome", "safari", "firefox", "edge"] as Browser[]).map((b) => (
                        <button
                            key={b}
                            onClick={() => setBrowser(b)}
                            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize"
                            style={{
                                background: browser === b ? "var(--accent)" : "var(--surface-2)",
                                color: browser === b ? "white" : "var(--foreground-muted)",
                            }}
                        >
                            {b === "chrome" ? "Chrome" : b === "safari" ? "Safari" : b === "firefox" ? "Firefox" : "Edge"}
                        </button>
                    ))}
                </div>

                {/* 단계별 안내 */}
                <div className="space-y-3 mb-6">
                    {guide.steps.map((step, i) => (
                        <div key={i} className="flex gap-3 items-start">
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white mt-0.5"
                                style={{ background: "linear-gradient(135deg, #FF6B35, #FF9A72)" }}
                            >
                                {i + 1}
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                                {step}
                            </p>
                        </div>
                    ))}
                </div>

                {/* 모바일 보충 안내 */}
                {device === "mobile" && (
                    <div
                        className="flex gap-2 items-start p-3 rounded-xl mb-4 text-xs"
                        style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}
                    >
                        <Smartphone size={14} className="shrink-0 mt-0.5" />
                        <span>모바일에서는 브라우저 설정 → 사이트 설정 → 알림에서 변경할 수 있어요.</span>
                    </div>
                )}

                {/* 결과 메시지 */}
                {retryResult === "success" && (
                    <p className="text-sm font-black text-center mb-3" style={{ color: "#22C55E" }}>
                        알림 설정 완료!
                    </p>
                )}
                {retryResult === "still-denied" && (
                    <p className="text-xs text-center mb-3" style={{ color: "#EF4444" }}>
                        아직 차단 상태예요. 위 안내를 따라 브라우저 설정을 변경한 후 다시 시도해 주세요.
                    </p>
                )}

                {/* 버튼 */}
                <button
                    onClick={handleRetry}
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #FF6B35, #FF9A72)" }}
                >
                    {isLoading ? "확인 중..." : "다시 시도"}
                </button>
            </div>
        </div>
    );
}
