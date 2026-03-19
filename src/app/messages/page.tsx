"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useGameStore } from "@/store/useGameStore";
import {
    ArrowLeft, Send, ImageIcon, Inbox, Loader2, Check,
    PenSquare, Search, ChevronLeft, X,
} from "lucide-react";

/* ───────── 타입 ───────── */
interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    post_id: string | null;
    text: string | null;
    read: boolean;
    created_at: string;
    sender: { name: string; handle: string; avatar: string } | null;
    post: { id: string; caption: string | null; image_url: string | null } | null;
}

interface Profile {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    team: string | null;
    role: string | null;
}

type View = "inbox" | "user-list" | "compose";

/* ───────── 유틸 ───────── */
function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
}

function Avatar({ avatar, name, size = 44 }: { avatar: string; name: string; size?: number }) {
    const style: React.CSSProperties = {
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--secondary), var(--accent))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.3,
        fontWeight: 700,
        color: "white",
        overflow: "hidden",
        flexShrink: 0,
    };
    if (avatar?.startsWith("http")) {
        return <img src={avatar} alt={name} style={{ ...style, objectFit: "cover" }} />;
    }
    return <div style={style}>{avatar || name?.[0]?.toUpperCase() || "?"}</div>;
}

/* ───────── 메인 컴포넌트 ───────── */
export default function MessagesPage() {
    const router = useRouter();
    const { user } = useGameStore();

    // 뷰 상태
    const [view, setView] = useState<View>("inbox");
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

    // 받은 메시지
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingInbox, setLoadingInbox] = useState(true);
    const [activeMsg, setActiveMsg] = useState<Message | null>(null);
    const [replyText, setReplyText] = useState("");
    const [replySending, setReplySending] = useState(false);
    const [replySent, setReplySent] = useState(false);

    // 유저 목록
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // 메시지 작성
    const [composeText, setComposeText] = useState("");
    const [composeSending, setComposeSending] = useState(false);
    const [composeSent, setComposeSent] = useState(false);

    /* ── 받은 메시지 로드 ── */
    useEffect(() => {
        (async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) { setLoadingInbox(false); return; }

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
            setLoadingInbox(false);
        })();
    }, []);

    /* ── 유저 목록 로드 (첫 진입 시) ── */
    const loadProfiles = async () => {
        if (profiles.length > 0) return; // 이미 로드됨
        setLoadingProfiles(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { setLoadingProfiles(false); return; }

        const { data } = await supabase
            .from("profiles")
            .select("id, name, handle, avatar, team, role")
            .neq("id", authUser.id)
            .order("name", { ascending: true });

        setProfiles((data as unknown as Profile[]) ?? []);
        setLoadingProfiles(false);
    };

    const handleOpenUserList = async () => {
        setView("user-list");
        setSearchQuery("");
        await loadProfiles();
    };

    const handleSelectUser = (profile: Profile) => {
        setSelectedUser(profile);
        setComposeText("");
        setComposeSent(false);
        setView("compose");
    };

    /* ── 메시지 작성 전송 ── */
    const handleSend = async () => {
        if (!composeText.trim() || composeSending || composeSent || !selectedUser) return;
        setComposeSending(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;
            await supabase.from("messages").insert({
                sender_id: authUser.id,
                receiver_id: selectedUser.id,
                text: composeText.trim(),
            });
            setComposeSent(true);
            setComposeText("");
        } finally {
            setComposeSending(false);
        }
    };

    /* ── 받은 메시지 클릭 (읽음 처리) ── */
    const openMessage = async (msg: Message) => {
        setActiveMsg(msg);
        setReplyText("");
        setReplySent(false);
        if (!msg.read) {
            await supabase.from("messages").update({ read: true }).eq("id", msg.id);
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
        }
    };

    /* ── 답장 전송 ── */
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

    /* ── 유저 검색 필터 ── */
    const filteredProfiles = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return profiles;
        return profiles.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.handle?.toLowerCase().includes(q) ||
            p.team?.toLowerCase().includes(q)
        );
    }, [profiles, searchQuery]);

    const unreadCount = messages.filter(m => !m.read).length;

    /* ═══════════════════════════════════════════
       뷰 1: 받은 메시지 (기본)
    ═══════════════════════════════════════════ */
    if (view === "inbox") return (
        <div className="max-w-2xl mx-auto px-4 py-6 pb-28 min-h-screen"
            style={{ background: "var(--background)" }}>

            {/* 헤더 */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => router.back()} className="p-2 rounded-xl transition-colors"
                    style={{ background: "var(--surface-2)", color: "var(--foreground)" }}>
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black" style={{ color: "var(--foreground)" }}>메시지</h1>
                    {unreadCount > 0 && (
                        <p className="text-[12px] font-semibold" style={{ color: "var(--primary)" }}>
                            읽지 않은 메시지 {unreadCount}개
                        </p>
                    )}
                </div>
                {/* 새 메시지 버튼 */}
                <button
                    onClick={handleOpenUserList}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, var(--secondary), #6B5CE7)" }}
                >
                    <PenSquare size={16} />
                    <span className="hidden sm:inline">새 메시지</span>
                </button>
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
                            <Avatar avatar={activeMsg.sender?.avatar ?? ""} name={activeMsg.sender?.name ?? "?"} size={40} />
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

                        {/* 공유된 게시물 */}
                        {activeMsg.post && (
                            <button
                                onClick={() => { setActiveMsg(null); router.push(`/post/${activeMsg.post!.id}`); }}
                                className="w-full flex items-center gap-3 px-5 py-3 hover:opacity-80 transition-opacity"
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

                        {/* 답장 */}
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

            {/* 받은 메시지 목록 */}
            {loadingInbox ? (
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
                    <p className="text-[13px] text-center" style={{ color: "var(--foreground-muted)" }}>
                        친구가 게시물을 공유하거나<br />메시지를 보내면 여기에 표시돼요
                    </p>
                    <button
                        onClick={handleOpenUserList}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm text-white"
                        style={{ background: "linear-gradient(135deg, var(--secondary), #6B5CE7)" }}
                    >
                        <PenSquare size={16} />
                        먼저 메시지 보내기
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {messages.map(msg => (
                        <button
                            key={msg.id}
                            onClick={() => openMessage(msg)}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all hover:opacity-90 w-full"
                            style={{
                                background: "var(--surface)",
                                border: msg.read ? "1px solid var(--border)" : "1.5px solid var(--secondary)",
                            }}
                        >
                            <div className="relative">
                                <Avatar avatar={msg.sender?.avatar ?? ""} name={msg.sender?.name ?? "?"} size={44} />
                                {!msg.read && (
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                                        style={{ background: "var(--secondary)", borderColor: "var(--surface)" }} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                                        {msg.sender?.name ?? "알 수 없음"}
                                    </span>
                                    <span className="text-[11px] ml-auto shrink-0" style={{ color: "var(--foreground-muted)" }}>
                                        {timeAgo(msg.created_at)}
                                    </span>
                                </div>
                                <p className="text-[12px] truncate" style={{ color: "var(--foreground-soft)" }}>
                                    {msg.post ? "📸 게시물 공유 · " : ""}{msg.text || "메시지를 보냈어요"}
                                </p>
                            </div>
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

    /* ═══════════════════════════════════════════
       뷰 2: 유저 목록 (받는 사람 선택)
    ═══════════════════════════════════════════ */
    if (view === "user-list") return (
        <div className="max-w-2xl mx-auto px-4 py-6 pb-28 min-h-screen"
            style={{ background: "var(--background)" }}>

            {/* 헤더 */}
            <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setView("inbox")} className="p-2 rounded-xl transition-colors"
                    style={{ background: "var(--surface-2)", color: "var(--foreground)" }}>
                    <ChevronLeft size={18} />
                </button>
                <h1 className="text-xl font-black flex-1" style={{ color: "var(--foreground)" }}>
                    받는 사람 선택
                </h1>
            </div>

            {/* 검색창 */}
            <div className="relative mb-4">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--foreground-muted)" }} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="이름, 핸들, 팀으로 검색..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl text-[14px] outline-none"
                    style={{
                        background: "var(--surface)",
                        color: "var(--foreground)",
                        border: "1.5px solid var(--border)",
                    }}
                    autoFocus
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full"
                        style={{ color: "var(--foreground-muted)" }}>
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* 유저 목록 */}
            {loadingProfiles ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "var(--surface-2)" }} />
                    ))}
                </div>
            ) : filteredProfiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Search size={32} style={{ color: "var(--foreground-muted)" }} />
                    <p className="text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
                        {searchQuery ? `"${searchQuery}" 검색 결과 없음` : "가입된 유저가 없어요"}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider px-1 mb-1"
                        style={{ color: "var(--foreground-muted)" }}>
                        전체 {filteredProfiles.length}명
                    </p>
                    {filteredProfiles.map(profile => (
                        <button
                            key={profile.id}
                            onClick={() => handleSelectUser(profile)}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all hover:opacity-90 w-full active:scale-[0.98]"
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            <Avatar avatar={profile.avatar} name={profile.name} size={44} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[14px] font-bold truncate" style={{ color: "var(--foreground)" }}>
                                        {profile.name}
                                    </span>
                                    {profile.role === "teacher" && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                                            style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}>
                                            선생님
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[12px]" style={{ color: "var(--foreground-muted)" }}>
                                        @{profile.handle}
                                    </span>
                                    {profile.team && (
                                        <>
                                            <span style={{ color: "var(--border)" }}>·</span>
                                            <span className="text-[12px]" style={{ color: "var(--foreground-muted)" }}>
                                                {profile.team}팀
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Send size={16} style={{ color: "var(--foreground-muted)" }} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    /* ═══════════════════════════════════════════
       뷰 3: 메시지 작성
    ═══════════════════════════════════════════ */
    return (
        <div className="max-w-2xl mx-auto px-4 py-6 pb-28 min-h-screen"
            style={{ background: "var(--background)" }}>

            {/* 헤더 */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setView("user-list")} className="p-2 rounded-xl transition-colors"
                    style={{ background: "var(--surface-2)", color: "var(--foreground)" }}>
                    <ChevronLeft size={18} />
                </button>
                <h1 className="text-xl font-black flex-1" style={{ color: "var(--foreground)" }}>새 메시지</h1>
            </div>

            {/* 받는 사람 카드 */}
            {selectedUser && (
                <div className="flex items-center gap-3 p-4 rounded-2xl mb-6"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Avatar avatar={selectedUser.avatar} name={selectedUser.name} size={48} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-[15px] font-black" style={{ color: "var(--foreground)" }}>
                                {selectedUser.name}
                            </p>
                            {selectedUser.role === "teacher" && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}>
                                    선생님
                                </span>
                            )}
                        </div>
                        <p className="text-[12px]" style={{ color: "var(--foreground-muted)" }}>
                            @{selectedUser.handle}{selectedUser.team ? ` · ${selectedUser.team}팀` : ""}
                        </p>
                    </div>
                    <button
                        onClick={() => setView("user-list")}
                        className="text-[12px] font-bold px-3 py-1.5 rounded-xl"
                        style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}
                    >
                        변경
                    </button>
                </div>
            )}

            {/* 메시지 입력 */}
            {composeSent ? (
                <div className="flex flex-col items-center gap-4 py-16">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ background: "var(--accent-light)" }}>
                        <Check size={28} style={{ color: "var(--accent)" }} />
                    </div>
                    <p className="text-[16px] font-black" style={{ color: "var(--foreground)" }}>
                        메시지를 보냈어요!
                    </p>
                    <p className="text-[13px]" style={{ color: "var(--foreground-muted)" }}>
                        {selectedUser?.name}님이 확인할 거예요
                    </p>
                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={() => { setComposeSent(false); setComposeText(""); }}
                            className="px-5 py-2.5 rounded-2xl font-bold text-sm"
                            style={{ background: "var(--surface-2)", color: "var(--foreground)" }}
                        >
                            또 보내기
                        </button>
                        <button
                            onClick={() => setView("inbox")}
                            className="px-5 py-2.5 rounded-2xl font-bold text-sm text-white"
                            style={{ background: "linear-gradient(135deg, var(--secondary), #6B5CE7)" }}
                        >
                            받은 메시지로
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <label className="text-[13px] font-bold px-1" style={{ color: "var(--foreground-muted)" }}>
                        메시지 내용
                    </label>
                    <textarea
                        value={composeText}
                        onChange={e => setComposeText(e.target.value)}
                        placeholder={`${selectedUser?.name ?? ""}에게 보낼 메시지를 작성해주세요...`}
                        rows={6}
                        className="w-full px-4 py-3.5 rounded-2xl text-[14px] outline-none resize-none leading-relaxed"
                        style={{
                            background: "var(--surface)",
                            color: "var(--foreground)",
                            border: "1.5px solid var(--border)",
                        }}
                        autoFocus
                        disabled={composeSending}
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-[12px]" style={{ color: "var(--foreground-muted)" }}>
                            {composeText.length} 자
                        </span>
                        <button
                            onClick={handleSend}
                            disabled={!composeText.trim() || composeSending}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-40 active:scale-95"
                            style={{ background: "linear-gradient(135deg, var(--secondary), #6B5CE7)" }}
                        >
                            {composeSending
                                ? <Loader2 size={16} className="animate-spin" />
                                : <Send size={16} />
                            }
                            보내기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
