"use client";

import { useEffect, useState } from "react";
import {
    X,
    TrendingUp,
    Heart,
    FileText,
    BarChart2,
    Sparkles,
    Loader2,
    Image as ImageIcon,
    ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useGameStore } from "@/store/useGameStore";

interface WeeklyReportModalProps {
    weekNumber: number;
    sessionTitle: string;
    onClose: () => void;
}

interface PostStat {
    id: string;
    caption: string | null;
    likes: number;
    engagement_rate: string | null;
    image_url: string | null;
}

export default function WeeklyReportModal({ weekNumber, sessionTitle, onClose }: WeeklyReportModalProps) {
    const { user } = useGameStore();
    const [posts, setPosts] = useState<PostStat[]>([]);
    const [coaching, setCoaching] = useState("");
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingCoaching, setLoadingCoaching] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setLoadingPosts(false); return; }

            // 최근 7일 게시물
            const since = new Date();
            since.setDate(since.getDate() - 7);

            const { data } = await supabase
                .from("posts")
                .select("id, caption, likes, engagement_rate, image_url")
                .eq("user_id", session.user.id)
                .gte("created_at", since.toISOString())
                .order("created_at", { ascending: false });

            setPosts(data ?? []);
            setLoadingPosts(false);
        };
        fetchPosts();
    }, []);

    useEffect(() => {
        if (loadingPosts) return;

        const fetchCoaching = async () => {
            setLoadingCoaching(true);
            const postCount = posts.length;
            const totalLikes = posts.reduce((s, p) => s + (p.likes ?? 0), 0);
            const engValues = posts.map(p => {
                const raw = parseFloat((p.engagement_rate ?? "0").replace("%", ""));
                return isNaN(raw) ? 0 : raw;
            });
            const avgEngagement = engValues.length > 0
                ? engValues.reduce((s, v) => s + v, 0) / engValues.length
                : 0;
            const bestPost = [...posts].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0];

            try {
                const res = await fetch("/api/ai/weekly-report", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        weekNumber,
                        sessionTitle,
                        postCount,
                        avgEngagement,
                        totalLikes,
                        bestCaption: bestPost?.caption?.slice(0, 60) ?? "",
                    }),
                });
                const data = await res.json();
                setCoaching(data.coaching ?? "");
            } catch {
                setCoaching("AI 코치 연결에 실패했어요. 잠시 후 다시 시도해보세요.");
            } finally {
                setLoadingCoaching(false);
            }
        };
        fetchCoaching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadingPosts]);

    const totalLikes = posts.reduce((s, p) => s + (p.likes ?? 0), 0);
    const engValues = posts.map(p => {
        const raw = parseFloat((p.engagement_rate ?? "0").replace("%", ""));
        return isNaN(raw) ? 0 : raw;
    });
    const avgEngagement = engValues.length > 0
        ? engValues.reduce((s, v) => s + v, 0) / engValues.length
        : 0;
    const bestPost = [...posts].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
                className="w-full max-w-md rounded-3xl flex flex-col overflow-hidden max-h-[90vh]"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>
                            {weekNumber}회차 수업
                        </p>
                        <h2 className="text-lg font-black italic tracking-tighter" style={{ color: "var(--foreground)" }}>
                            마케팅 성과 리포트
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: "var(--surface-2)" }}
                    >
                        <X size={16} style={{ color: "var(--foreground-muted)" }} />
                    </button>
                </div>

                <div className="overflow-y-auto flex flex-col gap-5 p-5">
                    {loadingPosts ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
                        </div>
                    ) : (
                        <>
                            {/* 핵심 수치 4개 */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: FileText, label: "업로드 게시물", value: `${posts.length}개`, color: "var(--secondary)" },
                                    { icon: BarChart2, label: "평균 인게이지먼트", value: `${avgEngagement.toFixed(1)}%`, color: "var(--primary)" },
                                    { icon: Heart, label: "총 좋아요", value: `${totalLikes}개`, color: "#EF4444" },
                                    { icon: TrendingUp, label: "활동 점수", value: posts.length > 0 ? `${Math.min(100, posts.length * 20 + Math.round(avgEngagement * 2))}점` : "0점", color: "var(--accent)" },
                                ].map(({ icon: Icon, label, value, color }) => (
                                    <div key={label} className="flex flex-col gap-2 p-4 rounded-2xl" style={{ background: "var(--surface)" }}>
                                        <Icon size={14} style={{ color }} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>{label}</span>
                                        <span className="text-xl font-black" style={{ color }}>{value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* 베스트 게시물 */}
                            {bestPost && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest px-1" style={{ color: "var(--foreground-muted)" }}>
                                        🏆 이번 주 베스트 게시물
                                    </p>
                                    <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--surface)" }}>
                                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                                            {bestPost.image_url ? (
                                                <img src={bestPost.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon size={20} style={{ color: "var(--foreground-muted)" }} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                                                {bestPost.caption ?? "(캡션 없음)"}
                                            </p>
                                            <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                                ♥ {bestPost.likes}개
                                            </p>
                                        </div>
                                        <ChevronRight size={14} style={{ color: "var(--foreground-muted)" }} />
                                    </div>
                                </div>
                            )}

                            {posts.length === 0 && (
                                <div className="flex flex-col items-center gap-2 py-6 text-center">
                                    <FileText size={28} style={{ color: "var(--foreground-muted)" }} />
                                    <p className="text-sm font-bold" style={{ color: "var(--foreground-muted)" }}>이번 주 게시물이 없어요</p>
                                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>콘텐츠를 업로드하면 성과가 여기에 표시돼요</p>
                                </div>
                            )}

                            {/* AI 코칭 */}
                            <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: "var(--primary-light)", border: "1px solid rgba(255,107,53,0.15)" }}>
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} style={{ color: "var(--primary)" }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>AI 코치 피드백</span>
                                </div>
                                {loadingCoaching ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin" style={{ color: "var(--primary)" }} />
                                        <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>AI 코치가 분석 중...</span>
                                    </div>
                                ) : (
                                    <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                                        {coaching || "분석 결과가 없어요."}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-2xl font-black text-sm transition-all hover:opacity-90"
                                style={{ background: "var(--foreground)", color: "var(--background)" }}
                            >
                                확인
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
