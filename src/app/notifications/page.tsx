"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface Notification {
    id: string;
    title: string;
    body: string;
    url: string;
    created_at: string;
}

const LAST_READ_KEY = "notifications_last_read_at";

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastReadAt, setLastReadAt] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(LAST_READ_KEY);
        setLastReadAt(stored);

        supabase
            .from("notifications")
            .select("id, title, body, url, created_at")
            .order("created_at", { ascending: false })
            .limit(50)
            .then(({ data }) => {
                setNotifications(data ?? []);
                setLoading(false);
                // 페이지 진입 시 현재 시각을 "읽음" 기준으로 저장
                localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
            });
    }, []);

    const isUnread = (createdAt: string) =>
        !lastReadAt || new Date(createdAt) > new Date(lastReadAt);

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "방금";
        if (diffMin < 60) return `${diffMin}분 전`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `${diffH}시간 전`;
        const diffD = Math.floor(diffH / 24);
        if (diffD < 7) return `${diffD}일 전`;
        return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
    };

    return (
        <div className="min-h-screen" style={{ background: "var(--background)" }}>
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #FF6B35, #FF9A72)" }}>
                        <Bell size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black" style={{ color: "var(--foreground)" }}>알림 수신함</h1>
                        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>선생님이 보낸 공지 알림</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={24} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <Bell size={40} style={{ color: "var(--foreground-muted)", opacity: 0.3 }} />
                        <p className="text-sm font-bold" style={{ color: "var(--foreground-muted)" }}>받은 알림이 없어요</p>
                        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>선생님이 보내는 공지가 여기 쌓입니다</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {notifications.map((n) => {
                            const unread = isUnread(n.created_at);
                            return (
                                <button
                                    key={n.id}
                                    onClick={() => router.push(n.url || "/")}
                                    className="w-full text-left rounded-2xl p-4 flex items-start gap-3 transition-all active:scale-[0.98]"
                                    style={{
                                        background: unread ? "rgba(255,107,53,0.06)" : "var(--surface)",
                                        border: `1px solid ${unread ? "rgba(255,107,53,0.2)" : "var(--border)"}`,
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                                        style={{ background: unread ? "rgba(255,107,53,0.15)" : "var(--surface-2)" }}>
                                        <Bell size={14} style={{ color: unread ? "#FF6B35" : "var(--foreground-muted)" }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black truncate" style={{ color: "var(--foreground)" }}>
                                                {n.title}
                                            </p>
                                            {unread && (
                                                <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B35" }} />
                                            )}
                                        </div>
                                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--foreground-muted)" }}>
                                            {n.body}
                                        </p>
                                        <p className="text-[10px] mt-1.5 font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                            {formatTime(n.created_at)}
                                        </p>
                                    </div>
                                    <ChevronRight size={14} className="shrink-0 mt-1" style={{ color: "var(--foreground-muted)" }} />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
