"use client";

import React, { useEffect, useState } from "react";
import { Trophy, X, Coins } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";

interface ToastItem {
    id: string;
    title: string;
    reward: number;
}

export default function MissionCompleteToast() {
    const { missionCompletionQueue, clearMissionCompletionQueue } = useGameStore();
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        if (missionCompletionQueue.length === 0) return;

        const newToasts = missionCompletionQueue.map(m => ({
            id: m.id,
            title: m.title,
            reward: m.reward,
        }));
        setToasts(prev => [...prev, ...newToasts]);
        clearMissionCompletionQueue();
    }, [missionCompletionQueue]);

    const dismiss = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        if (toasts.length === 0) return;
        const timer = setTimeout(() => {
            setToasts(prev => prev.slice(1));
        }, 4000);
        return () => clearTimeout(timer);
    }, [toasts]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-3 lg:bottom-6">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="flex items-start gap-3 bg-background border border-green-500/30 shadow-2xl shadow-green-500/10 rounded-2xl p-4 w-72 animate-in slide-in-from-right-4 duration-400"
                >
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                        <Trophy size={20} className="text-white" />
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-500">미션 완료!</span>
                        <span className="text-sm font-black italic truncate">{toast.title}</span>
                        <div className="flex items-center gap-1 mt-1">
                            <Coins size={12} className="text-amber-500" />
                            <span className="text-[11px] font-bold text-amber-500">+{toast.reward.toLocaleString()}P 지급됨</span>
                        </div>
                    </div>
                    <button
                        onClick={() => dismiss(toast.id)}
                        className="p-1 hover:bg-foreground/10 rounded-full transition-colors shrink-0"
                    >
                        <X size={14} className="text-foreground/40" />
                    </button>
                </div>
            ))}
        </div>
    );
}
