"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    Heart,
    MessageCircle,
    Share2,
    Music2,
    Play,
    Pause,
    ShoppingCart
} from "lucide-react";

interface VideoPlayerProps {
    id: string;
    user: {
        name: string;
        handle: string;
        avatar: string;
    };
    description: string;
    musicName: string;
    stats: {
        likes: string;
        comments: string;
        shares: string;
    };
}

export default function VideoPlayer({ id, user, description, musicName, stats }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const videoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsPlaying(true);
                    } else {
                        setIsPlaying(false);
                    }
                });
            },
            { threshold: 0.6 }
        );

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={videoRef}
            className="relative w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl group"
            onClick={() => setIsPlaying(!isPlaying)}
        >
            {/* Video Content Placeholder (Dark Gradient for now) */}
            <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 transition-opacity duration-500 ${isPlaying ? "opacity-100" : "opacity-80"}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                    {!isPlaying && <Play size={64} className="text-white/50" fill="currentColor" />}
                    <span className="text-white/5 font-black text-8xl italic select-none">REELS #{id}</span>
                </div>
            </div>

            {/* Right Action Sidebar */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-20">
                <div className="relative mb-2">
                    <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-foreground/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{user.name[0]}</span>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary rounded-full px-1 py-0.5">
                        <Plus size={10} className="text-white" strokeWidth={4} />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
                        className={`transition-all duration-300 ${isLiked ? "text-primary scale-125" : "text-white"}`}
                    >
                        <Heart size={32} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
                    </button>
                    <span className="text-white text-xs font-bold">{stats.likes}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button className="text-white transition-transform hover:scale-110">
                        <MessageCircle size={32} strokeWidth={2.5} />
                    </button>
                    <span className="text-white text-xs font-bold">{stats.comments}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button className="text-white transition-transform hover:scale-110">
                        <Share2 size={32} strokeWidth={2.5} />
                    </button>
                    <span className="text-white text-xs font-bold">{stats.shares}</span>
                </div>

                {/* Dynamic Shop Link */}
                <div className="mt-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center animate-bounce duration-[2000ms]">
                        <ShoppingCart size={24} className="text-secondary" />
                    </div>
                </div>

                {/* Music Record Spin */}
                <div className={`mt-4 w-12 h-12 rounded-full bg-foreground/30 border-4 border-foreground/50 flex items-center justify-center ${isPlaying ? "animate-spin-slow" : ""}`}>
                    <Music2 size={24} className="text-white/50" />
                </div>
            </div>

            {/* Bottom Content Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pt-20 bg-gradient-to-t from-black via-black/40 to-transparent">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-bold">@{user.handle}</span>
                        <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold text-white uppercase tracking-widest">Follow</span>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed max-w-[85%]">
                        {description} <span className="font-bold text-secondary">#데일리 #추천 #테크</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Music2 size={14} className="text-white" />
                        <div className="overflow-hidden w-48">
                            <div className="inline-block whitespace-nowrap text-white text-xs font-medium animate-marquee">
                                {musicName} • Original Sound - {user.handle}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div className={`h-full bg-primary transition-all duration-[3000ms] ease-linear ${isPlaying ? "w-full" : "w-0"}`} />
            </div>
        </div>
    );
}

function Plus({ size, className, strokeWidth }: { size: number, className: string, strokeWidth: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}
