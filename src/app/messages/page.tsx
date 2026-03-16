"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useGameStore } from "@/store/useGameStore";
import { ArrowLeft, Send, ImageIcon, Inbox, Loader2, Check } from "lucide-react";

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    post_id: string | null;
    text: string | null;
    read: boolean;
    created_at: string;
    sender: {
        name: string;
        handle: string;
        avatar: string;
    } | null;
    post: {
        id: string;
        caption: string | null;
        image_url: string | null;
    } | null;
}

function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
}

export default function MessagesPage() {
    const router = useRouter();
    const { user } = useGameStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMsg, setActiveMsg] = useState<Message | null>(null);
    const [replyText, setReplyText] = useState("");
    const [replySending, setReplySending] = useState(false);
    const [replySent, setReplySent] = useState(false);

    useEffect(() => {
        (async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) { setLoading(false); return; }

            const { data } = await supabase
                .from("messages")
                .select(`
                    id, sender_id, receiver_id, post_id, text, read, created_at,
                    sender:profiles!messages_sender_id_fkey(name, handle, avatar),
                    post:posts(id, caption, image_url)
                `)
                .eq("receiver_id", authUser.id)
                .order("created_at", { ascending: false });

            setMessages((data as unknown as Message[]) ?? []);
            setLoading(false);
        })();
    }, []);

    // 메시지 클릭 시 읽음 처리
    const openMessage = async (msg: Message) => {
        setActiveMsg(msg);
        setReplyText("");
        setReplySent(false);
        if (!msg.read) {
            await supabase.from("messages").update({ read: true }).eq("id", msg.id);
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
        }
    };

    // 답장 전송
    const handleReply = async () => {
        if (!replyText.trim() || replySending || replySent || !activeMsg) return;
        setReplySending(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;
            await supabase.from("messages").insert({
                sender_id: authUser.id,
                receiver_id: activeMsg.sender_id,
                text: replyText.trim(),
            });
            setReplySent(true);
            setReplyText("");
        } finally {
            setReplySending(false);
        }
    };

    const unreadCount = messages.filter(m => !m.read).length;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 pb-28 min-h-screen" style={{ background: "var(--background)" }}>

            {/* 헤더 */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => router.back()} className="p-2 rounded-xl transition-colors"
                    style={{ background: "var(--surface-2)", color: "var(--foreground)" }}>
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black" style={{ color: "var(--foreground)" }}>받은 메시지</h1>
                    {unreadCount > 0 && (
                        <p className="text-[12px] font-semibold" style={{ color: "var(--primary)" }}>
                            읽지 않은 메시지 {unreadCount}개
                        </p>
                    )}
                </div>
            </div>

            {/* 메시지 상세 모달 */}
            {activeMsg && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => { if (e.target === e.currentTarget) setActiveMsg(null); }}>
                    <div className="w-full max-w-sm rounded-t-3xl md:rounded-3xl overflow-hidden"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        {/* 모달 헤더 */}
                        <div className="flex items-center gap-3 px-5 py-4"
                            style={{ borderBottom: "1px solid var(--border)" }}>
                            <div className="w-10 h-10 rounded-full p-[2px] shrink-0"
                                style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
                                <div className="w-full h-full rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                                    style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}>
                                    {activeMsg.sender?.avatar?.startsWith("http") ? (
                                        <img src={activeMsg.sender.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : activeMsg.sender?.avatar ? (
                                        <span>{activeMsg.sender.avatar}</span>
                                    ) : (
                                        (activeMsg.sender?.name?.[0] ?? "?").toUpperCase()
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
                                    {activeMsg.sender?.name ?? "알 수 없음"}
                                </p>
                                <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                                    @{activeMsg.sender?.handle} · {timeAgo(activeMsg.created_at)}
                                </p>
                            </div>
                            <button onClick={() => setActiveMsg(null)}
                                className="text-[13px] font-bold" style={{ color: "var(--foreground-muted)" }}>
                                닫기
                            </button>
                        </div>

                        {/* 공유된 게시물 미리보기 */}
                        {activeMsg.post && (
                            <button
                                onClick={() => { setActiveMsg(null); router.push(`/post/${activeMsg.post!.id}`); }}
                                className="w-full flex items-center gap-3 px-5 py-3 transition-colors hover:opacity-80"
                                style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                                    style={{ background: "var(--border)" }}>
                                    {activeMsg.post.image_url
                                        ? <img src={activeMsg.post.image_url} alt="" className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon size={18} style={{ color: "var(--foreground-muted)" }} />
                                          </div>
                                    }
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-[11px] font-bold mb-0.5" style={{ color: "var(--secondary)" }}>공유된 게시물</p>
                                    <p className="text-[13px] truncate" style={{ color: "var(--foreground)" }}>
                                        {activeMsg.post.caption ?? "이미지 게시물"}
                                    </p>
                                </div>
                                <Send size={14} style={{ color: "var(--foreground-muted)" }} />
                            </button>
                        )}

                        {/* 메시지 본문 */}
                        <div className="px-5 pt-5 pb-3">
                            <p className="text-[15px] leading-relaxed" style={{ color: "var(--foreground)" }}>
                                {activeMsg.text || "메시지 없음"}
                            </p>
                        </div>

                        {/* 답장 입력창 */}
                        <div className="px-5 pb-5 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                            {replySent ? (
                                <div className="flex items-center justify-center gap-2 py-3 rounded-2xl"
                                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                                    <Check size={15} />
                                    <span className="text-sm font-bold">
                                        {activeMsg.sender?.name}님께 답장을 보냈어요!
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleReply()}
                                        placeholder={`${activeMsg.sender?.name ?? ""}에게 답장...`}
                                        className="flex-1 px-4 py-2.5 rounded-2xl text-[14px] outline-none"
                                        style={{
                                            background: "var(--surface-2)",
                                            color: "var(--foreground)",
                                            border: "1.5px solid var(--border)",
                                        }}
                                        autoFocus
                                        disabled={replySending}
                                    />
                                    <button
                                        onClick={handleReply}
                                        disabled={!replyText.trim() || replySending}
                                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
                                        style={{ background: "var(--secondary)", color: "white" }}
                                    >
                                        {replySending
                                            ? <Loader2 size={16} className="animate-spin" />
                                            : <Send size={16} />
                                        }
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 메시지 목록 */}
            {loading ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--surface-2)" }} />
                    ))}
                </div>
            ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "var(--surface-2)" }}>
                        <Inbox size={28} style={{ color: "var(--foreground-muted)" }} />
                    </div>
                    <p className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>받은 메시지가 없어요</p>
                    <p className="text-[13px]" style={{ color: "var(--foreground-muted)" }}>
                        친구가 게시물을 공유하면 여기에 표시돼요
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {messages.map(msg => (
                        <button
                            key={msg.id}
                            onClick={() => openMessage(msg)}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all hover:opacity-90 w-full"
                            style={{
                                background: msg.read ? "var(--surface)" : "var(--surface)",
                                border: msg.read ? "1px solid var(--border)" : "1.5px solid var(--secondary)",
                            }}
                        >
                            {/* 아바타 */}
                            <div className="w-11 h-11 rounded-full p-[2px] shrink-0"
                                style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
                                <div className="w-full h-full rounded-full flex items-center justify-center text-[13px] font-bold text-white"
                                    style={{ background: "linear-gradient(135deg, var(--secondary), var(--accent))" }}>
                                    {msg.sender?.avatar?.startsWith("http") ? (
                                        <img src={msg.sender.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : msg.sender?.avatar ? (
                                        <span>{msg.sender.avatar}</span>
                                    ) : (
                                        (msg.sender?.name?.[0] ?? "?").toUpperCase()
                                    )}
                                </div>
                            </div>

                            {/* 내용 */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                                        {msg.sender?.name ?? "알 수 없음"}
                                    </span>
                                    {!msg.read && (
                                        <span className="w-2 h-2 rounded-full shrink-0"
                                            style={{ background: "var(--secondary)" }} />
                                    )}
                                    <span className="text-[11px] ml-auto shrink-0" style={{ color: "var(--foreground-muted)" }}>
                                        {timeAgo(msg.created_at)}
                                    </span>
                                </div>
                                <p className="text-[12px] truncate" style={{ color: "var(--foreground-soft)" }}>
                                    {msg.post ? "📸 게시물 공유 · " : ""}{msg.text || "메시지를 보냈어요"}
                                </p>
                            </div>

                            {/* 게시물 썸네일 */}
                            {msg.post?.image_url && (
                                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                                    <img src={msg.post.image_url} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
