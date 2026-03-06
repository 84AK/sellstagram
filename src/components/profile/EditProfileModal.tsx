"use client";

import React, { useState } from "react";
import { X, Loader2, CheckCircle2, Save } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { useGameStore } from "@/store/useGameStore";

const AVATAR_OPTIONS = ["🦊", "🐺", "🦋", "🐬", "🦄", "🐉", "🦅", "🦁", "🐙", "🌟"];

interface EditProfileModalProps {
    onClose: () => void;
}

export default function EditProfileModal({ onClose }: EditProfileModalProps) {
    const { user, updateProfile } = useGameStore();

    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState(user.avatar || "🦊");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        setError("");

        try {
            if (isSupabaseConfigured) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { error: dbError } = await supabase
                        .from("profiles")
                        .update({ name: name.trim(), avatar })
                        .eq("id", session.user.id);
                    if (dbError) throw dbError;
                }
            }
            // Zustand 동기화
            updateProfile({ name: name.trim(), avatar });
            setSaved(true);
            setTimeout(() => onClose(), 900);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "저장에 실패했어요. 다시 시도해주세요.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-sm rounded-3xl overflow-hidden"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="text-base font-black italic" style={{ color: "var(--foreground)" }}>
                        프로필 편집
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-foreground/10"
                        style={{ color: "var(--foreground-muted)" }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* 바디 */}
                <div className="px-6 py-6 flex flex-col gap-5">
                    {/* 현재 아바타 미리보기 */}
                    <div className="flex justify-center">
                        <div
                            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
                            style={{ background: "var(--primary-light)", border: "2px solid var(--primary)" }}
                        >
                            {avatar}
                        </div>
                    </div>

                    {/* 아바타 선택 */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block"
                            style={{ color: "var(--foreground-muted)" }}>
                            아바타 선택
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVATAR_OPTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => setAvatar(emoji)}
                                    className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative"
                                    style={{
                                        background: avatar === emoji ? "var(--primary-light)" : "var(--surface-2)",
                                        border: avatar === emoji ? "2px solid var(--primary)" : "2px solid transparent",
                                    }}
                                >
                                    {emoji}
                                    {avatar === emoji && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                            style={{ background: "var(--primary)" }}>
                                            <CheckCircle2 size={10} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 이름 */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block"
                            style={{ color: "var(--foreground-muted)" }}>
                            이름
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={20}
                            placeholder="이름을 입력하세요"
                            className="w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all"
                            style={{
                                background: "var(--surface-2)",
                                border: name.trim() ? "2px solid var(--primary)" : "2px solid transparent",
                                color: "var(--foreground)",
                            }}
                        />
                    </div>

                    {error && (
                        <p className="text-xs font-semibold text-center" style={{ color: "#EF4444" }}>
                            {error}
                        </p>
                    )}
                </div>

                {/* 하단 버튼 */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-3 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                        style={{ background: "var(--surface-2)", color: "var(--foreground-soft)" }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || saving || saved}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                            background: saved
                                ? "var(--accent)"
                                : "linear-gradient(135deg, var(--primary), #FF9A72)",
                            boxShadow: saved ? "none" : "0 4px 14px var(--primary-glow)",
                        }}
                    >
                        {saving ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : saved ? (
                            <CheckCircle2 size={14} />
                        ) : (
                            <Save size={14} />
                        )}
                        {saving ? "저장 중..." : saved ? "저장 완료!" : "저장하기"}
                    </button>
                </div>
            </div>
        </div>
    );
}
