"use client";

import React, { useState, useEffect, useRef } from "react";
import GlassCard from "../common/GlassCard";
import {
    X,
    Image as ImageIcon,
    Hash,
    Send,
    Sparkles,
    Loader2,
    CheckCircle,
    Eye,
    FileText,
    ArrowRight,
    Upload,
    Trash2,
    TrendingUp,
    Users,
    Zap,
    BarChart2,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { supabase } from "@/lib/supabase/client";
import { simulateMarketingEffect } from "@/lib/simulation/engine";
import { getTodayChallenge } from "@/lib/challenges/dailyChallenges";

export default function UploadModal() {
    const {
        isUploadModalOpen,
        setUploadModalOpen,
        uploadContext,
        addPost,
        addInsight,
        setAIReportModal,
        addPoints,
        addSkillXP,
        startCampaign,
        user
    } = useGameStore();
    const [uploadType, setUploadType] = useState<"post" | "video">("post");
    const [challengeMode, setChallengeMode] = useState(false);
    const todayChallenge = getTodayChallenge();
    const [caption, setCaption] = useState("");
    const [tags, setTags] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [aiPreview, setAiPreview] = useState<string>("");
    const [showResult, setShowResult] = useState(false);
    const [simResult, setSimResult] = useState<{ impressions: number; engagementRate: number; clicks: number; revenue: number } | null>(null);
    const [personaReactions, setPersonaReactions] = useState<{ name: string; comment: string; personaId: string }[]>([]);
    const [loadingResult, setLoadingResult] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 이미지 업로드 관련
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isUploadModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isUploadModalOpen]);

    const onClose = () => {
        setUploadModalOpen(false);
        setCaption("");
        setTags("");
        setAiPreview("");
        setSelectedFile(null);
        setPreviewUrl(null);
        setShowResult(false);
        setSimResult(null);
        setPersonaReactions([]);
        setChallengeMode(false);
    };

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith("image/")) return;
        if (file.size > 10 * 1024 * 1024) { alert("10MB 이하 이미지만 업로드 가능해요"); return; }
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const uploadImageToStorage = async (file: File): Promise<string | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || "anon";
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${Date.now()}.${ext}`;

        const { error } = await supabase.storage.from("posts").upload(path, file, { cacheControl: "3600" });
        if (error) { console.error("Storage upload error:", error.message); return null; }

        const { data: { publicUrl } } = supabase.storage.from("posts").getPublicUrl(path);
        return publicUrl;
    };

    if (!isUploadModalOpen) return null;

    const isMissionMode = uploadContext === "mission";

    const handleAnalyze = async () => {
        if (!caption || isAnalyzing) return;
        setIsAnalyzing(true);
        try {
            const response = await fetch("/api/ai/analyze", {
                method: "POST",
                body: JSON.stringify({ type: "coach", caption, engagement: "Predictions" }),
                headers: { "Content-Type": "application/json" }
            });
            const data = await response.json();
            setAiPreview(data.insight);
        } catch (err) {
            setAiPreview("분석 중 오류가 발생했습니다.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleViewReport = () => {
        if (!aiPreview) return;

        const newInsight = {
            id: Math.random().toString(36).substr(2, 9),
            type: "coach" as const,
            title: isMissionMode ? "주간 미션 마케팅 리포트" : "일반 게시물 마케팅 분석",
            content: aiPreview,
            date: new Date().toISOString().split('T')[0]
        };

        addInsight(newInsight);
        setAIReportModal(true, newInsight);
    };

    const handleUpload = async () => {
        if (!caption.trim()) return;
        setIsUploading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id ?? localStorage.getItem("sellstagram_user_id");
            const tagList = uploadType === "post" ? tags.split(",").map(t => t.trim()).filter(Boolean) : [];

            // 이미지 Storage 업로드
            let imageUrl: string | null = null;
            if (selectedFile && uploadType === "post") {
                imageUrl = await uploadImageToStorage(selectedFile);
            }

            // Supabase에 저장 (실패 시 로컬 fallback)
            const { data: inserted, error } = await supabase.from("posts").insert({
                user_id: userId ?? null,
                user_name: user.name,
                user_handle: user.handle,
                user_avatar: user.avatar,
                type: uploadType,
                caption: uploadType === "post" ? caption : null,
                image_url: imageUrl,
                description: uploadType === "video" ? caption : null,
                music_name: uploadType === "video" ? "Original Audio" : null,
                tags: tagList,
                likes: 0,
                comments: 0,
                shares: 0,
                engagement_rate: "0%",
                sales: uploadType === "post" ? "₩0" : null,
            }).select().single();

            if (error || !inserted) {
                // Supabase 미연결 시 로컬에만 저장
                addPost({
                    id: Math.random().toString(36).substr(2, 9),
                    type: uploadType,
                    user: { name: user.name, handle: user.handle, avatar: user.avatar },
                    content: uploadType === "post" ? { image: imageUrl ?? "", caption, tags: tagList } : undefined,
                    description: uploadType === "video" ? caption : undefined,
                    musicName: uploadType === "video" ? "Original Audio" : undefined,
                    stats: { likes: 0, engagement: "0%", sales: "₩0", comments: "0", shares: "0" },
                    timeAgo: "방금 전",
                } as any);
            }
            // Supabase 성공 시 realtime이 자동으로 addPost 호출 (page.tsx 구독)

            // 포인트 지급: 게시물 +10 XP, 미션 모드 +20 XP, 챌린지 참여 추가 보너스
            const xp = (isMissionMode ? 20 : 10) + (challengeMode ? todayChallenge.bonusXP : 0);
            addPoints(xp);

            // 스킬 XP 적립
            addSkillXP("copywriting", isMissionMode ? 20 : 15);
            addSkillXP("creative", selectedFile ? 20 : 10);
            if (challengeMode) addSkillXP("analytics", 15);

            setIsUploading(false);
            setIsSuccess(true);
            setLoadingResult(true);

            // 시뮬레이션 + 페르소나 반응 병렬 실행
            const tagList2 = tags.split(",").map(t => t.trim()).filter(Boolean);
            const sim = simulateMarketingEffect({
                caption,
                hashtags: tagList2,
                visualQuality: selectedFile ? 0.9 : 0.6,
                baseFollowers: 500,
            }, 30000);
            setSimResult(sim);

            // 시뮬레이션 결과 자동으로 campaign + insight 저장
            startCampaign({
                id: Math.random().toString(36).substr(2, 9),
                productId: "uploaded",
                spent: 0,
                revenue: sim.revenue,
                efficiency: parseFloat((sim.revenue > 0 ? sim.revenue / Math.max(sim.impressions * 0.01, 1) : 0).toFixed(2)),
                engagement: sim.engagementRate,
            });
            const coachMsg = sim.engagementRate >= 8
                ? "인게이지먼트가 높아요! 이미지 퀄리티와 해시태그 전략이 잘 맞았어요. 다음엔 업로드 시간도 최적화해보세요."
                : sim.engagementRate >= 4
                    ? "괜찮은 출발이에요. 더 구체적인 혜택을 캡션에 담으면 클릭률을 높일 수 있어요."
                    : "캡션을 조금 더 다듬어 보세요. 질문형 문장이나 감성적인 표현이 반응을 높여줘요.";
            addInsight({
                id: Math.random().toString(36).substr(2, 9),
                type: "coach" as const,
                title: challengeMode
                    ? `[챌린지] ${todayChallenge.theme} 분석`
                    : isMissionMode ? "미션 게시물 마케팅 분석" : "게시물 마케팅 분석",
                content: `## 시뮬레이션 결과\n\n- **예상 노출**: ${sim.impressions.toLocaleString()}명\n- **인게이지먼트**: ${sim.engagementRate.toFixed(1)}%\n- **예상 클릭**: ${sim.clicks.toLocaleString()}회\n${challengeMode ? `\n## 오늘의 챌린지: ${todayChallenge.theme}\n\n**전략**: ${todayChallenge.strategy}\n\n${todayChallenge.tip}\n` : ""}\n## 코치의 한마디\n\n${coachMsg}\n\n> 캡션: "${caption.slice(0, 80)}..."`,
                date: new Date().toISOString().split("T")[0],
            });

            try {
                const res = await fetch("/api/ai/reactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ product: caption.slice(0, 40), tags: tagList2, caption }),
                });
                const data = await res.json();
                const reactions = data.reactions ?? [];
                setPersonaReactions(reactions);

                // AI 반응을 comments 테이블에 저장 (피드에서 항상 표시)
                if (inserted?.id && reactions.length > 0) {
                    const inserts = reactions.slice(0, 4).map((r: {
                        name: string; personaId: string; comment: string; personaEmoji?: string;
                    }) => ({
                        post_id: inserted.id,
                        user_name: r.name,
                        user_handle: `ai_${r.personaId}`,
                        text: r.comment,
                        is_ai_reaction: true,
                        persona_emoji: r.personaEmoji ?? "👤",
                    }));
                    await supabase.from("comments").insert(inserts);
                }
            } catch {
                setPersonaReactions([]);
            }

            setLoadingResult(false);
            setShowResult(true);
        } catch {
            setIsUploading(false);
        }
    };

    // 업로드 결과 화면
    if (showResult && simResult) {
        const xpGained = (isMissionMode ? 20 : 10) + (challengeMode ? todayChallenge.bonusXP : 0);
        const personaEmojis: Record<string, string> = { p1: "🛍️", p2: "💚", p3: "🔍", p4: "✨" };
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <GlassCard className="w-full max-w-lg p-0 overflow-hidden border-foreground/10 shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="p-6 overflow-y-auto flex flex-col gap-5">
                        {/* 성공 헤더 */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center">
                                <CheckCircle size={20} className="text-accent" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black italic tracking-tighter">게시물 올라갔어요!</h3>
                                <p className="text-[11px] text-foreground/50">+{xpGained} XP 획득 · 시뮬레이션 결과를 확인하세요</p>
                            </div>
                            {challengeMode && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black text-white"
                                    style={{ background: "linear-gradient(135deg,#FF6B35,#FFC233)" }}>
                                    {todayChallenge.icon} 챌린지 완료!
                                </div>
                            )}
                        </div>

                        {/* 시뮬레이션 수치 */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: TrendingUp, label: "예상 노출", value: simResult.impressions.toLocaleString(), unit: "명", color: "var(--primary)" },
                                { icon: BarChart2, label: "인게이지먼트", value: simResult.engagementRate.toFixed(1), unit: "%", color: "var(--secondary)" },
                                { icon: Zap, label: "예상 클릭", value: simResult.clicks.toLocaleString(), unit: "회", color: "var(--accent)" },
                            ].map(({ icon: Icon, label, value, unit, color }) => (
                                <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                                    <Icon size={16} style={{ color }} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/40">{label}</span>
                                    <span className="text-xl font-black" style={{ color }}>{value}<span className="text-sm">{unit}</span></span>
                                </div>
                            ))}
                        </div>

                        {/* AI 페르소나 반응 */}
                        {loadingResult ? (
                            <div className="flex items-center gap-2 py-2">
                                <Loader2 size={14} className="animate-spin text-foreground/40" />
                                <span className="text-xs text-foreground/40">고객 반응 시뮬레이션 중...</span>
                            </div>
                        ) : personaReactions.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <Users size={14} className="text-foreground/40" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">첫 고객 반응</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {personaReactions.slice(0, 3).map((r, i) => (
                                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                                            <span className="text-base mt-0.5">{personaEmojis[r.personaId] ?? "👤"}</span>
                                            <div>
                                                <span className="text-[10px] font-black text-foreground/60">{r.name}</span>
                                                <p className="text-xs text-foreground/80 mt-0.5">{r.comment}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 코칭 한마디 */}
                        <div className="flex items-start gap-2.5 p-4 rounded-2xl" style={{ background: "var(--primary-light)", border: "1px solid rgba(255,107,53,0.2)" }}>
                            <Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
                            <p className="text-[11px] text-foreground/70 leading-relaxed">
                                {simResult.engagementRate >= 8
                                    ? "인게이지먼트가 높아요! 이미지 퀄리티와 해시태그 전략이 잘 맞았어요. 다음엔 업로드 시간도 최적화해보세요."
                                    : simResult.engagementRate >= 4
                                        ? "괜찮은 출발이에요. 더 구체적인 혜택을 캡션에 담으면 클릭률을 높일 수 있어요."
                                        : "캡션을 조금 더 다듬어 보세요. 질문형 문장이나 감성적인 표현이 반응을 높여줘요."}
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-2xl font-black text-sm text-background transition-all hover:opacity-90"
                            style={{ background: "var(--foreground)" }}
                        >
                            확인
                        </button>
                    </div>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <GlassCard className="w-full max-w-lg p-0 overflow-hidden border-foreground/10 shadow-2xl flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-foreground/5 flex-shrink-0">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-black italic tracking-tighter flex items-center gap-2 text-foreground">
                            <Sparkles size={20} className="text-primary" />
                            {isMissionMode ? "주간 미션 게시물 생성" : "새 게시물 생성"}
                        </h3>
                        {isMissionMode && (
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Weekly Mission Mode</span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
                        <X size={20} className="text-foreground/40" />
                    </button>
                </div>

                {/* Upload Format Toggle */}
                <div className="flex p-1 bg-foreground/5 rounded-xl mx-6 mt-4 flex-shrink-0">
                    <button
                        onClick={() => setUploadType("post")}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${uploadType === "post" ? "bg-background shadow-sm text-primary" : "text-foreground/40 hover:text-foreground/60"}`}
                    >
                        Photo Post
                    </button>
                    <button
                        onClick={() => setUploadType("video")}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${uploadType === "video" ? "bg-background shadow-sm text-primary" : "text-foreground/40 hover:text-foreground/60"}`}
                    >
                        Video Reels
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 pb-24 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* Image/Video Upload Area */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                    />
                    {previewUrl && uploadType === "post" ? (
                        <div className="relative w-full rounded-2xl overflow-hidden flex-shrink-0 group/preview">
                            <img src={previewUrl} alt="preview" className="w-full object-cover max-h-[300px]" />
                            <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/30 transition-colors duration-300" />
                            <button
                                onClick={() => { setSelectedFile(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors opacity-0 group-hover/preview:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 rounded-lg flex items-center gap-1.5">
                                <Upload size={10} className="text-white/70" />
                                <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">이미지 선택됨</span>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`min-h-[200px] w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 group cursor-pointer relative overflow-hidden flex-shrink-0 transition-all duration-300 ${isDragging ? "border-primary bg-primary/10 scale-[0.99]" : "bg-foreground/5 border-foreground/10 hover:border-primary/50"}`}
                        >
                            <div className={`p-5 bg-background rounded-3xl shadow-xl transition-transform z-10 border border-foreground/5 ${isDragging ? "scale-110" : "group-hover:scale-110"}`}>
                                {uploadType === "post" ? <ImageIcon size={40} className="text-primary" /> : <Eye size={40} className="text-primary" />}
                            </div>
                            <div className="flex flex-col items-center gap-1 z-10">
                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">
                                    {isDragging ? "여기에 놓으세요!" : (uploadType === "post" ? "Upload Marketing Image" : "Upload Vertical Video")}
                                </span>
                                <span className="text-[8px] font-bold text-foreground/20 uppercase tracking-tight">Drag and drop or click to browse • Max 10MB</span>
                            </div>
                            <div className={`absolute inset-0 bg-primary/5 transition-opacity ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                        </div>
                    )}

                    {/* Inputs */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest ml-1">
                                {uploadType === "post" ? "Caption" : "Video Description"}
                            </label>
                            <textarea
                                placeholder={uploadType === "post" ? "Z세대를 사로잡을 매력적인 카피를 작성하세요..." : "릴스 알고리즘을 타기 위한 핵심 설명과 키워드를 입력하세요..."}
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl p-4 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none italic font-medium"
                            />
                        </div>

                        {uploadType === "post" && (
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest ml-1">Hashtags</label>
                                <div className="relative">
                                    <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                                    <input
                                        type="text"
                                        placeholder="태그를 입력하세요 (쉼표로 구분)"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium italic"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 오늘의 챌린지 참여 토글 */}
                    <div
                        className="rounded-2xl overflow-hidden"
                        style={{ border: challengeMode ? "1.5px solid #FF6B35" : "1px solid var(--border)" }}
                    >
                        <button
                            onClick={() => setChallengeMode(v => !v)}
                            className="w-full flex items-center gap-3 p-4 transition-all text-left"
                            style={{ background: challengeMode ? "rgba(255,107,53,0.07)" : "var(--surface)" }}
                        >
                            <span className="text-2xl shrink-0">{todayChallenge.icon}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest"
                                        style={{ color: challengeMode ? "var(--primary)" : "var(--foreground-muted)" }}>
                                        오늘의 챌린지 참여
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                        style={{ background: "rgba(255,107,53,0.12)", color: "var(--primary)" }}>
                                        +{todayChallenge.bonusXP} XP
                                    </span>
                                </div>
                                <p className="text-xs font-bold truncate" style={{ color: "var(--foreground)" }}>
                                    {todayChallenge.theme}
                                </p>
                                <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                    {todayChallenge.strategy}
                                </p>
                            </div>
                            {/* 토글 스위치 */}
                            <div className="shrink-0 w-10 h-6 rounded-full relative transition-colors"
                                style={{ background: challengeMode ? "var(--primary)" : "var(--border)" }}>
                                <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                                    style={{ left: challengeMode ? "calc(100% - 22px)" : "2px" }} />
                            </div>
                        </button>
                        {challengeMode && (
                            <div className="px-4 pb-4 pt-0 flex flex-col gap-1.5"
                                style={{ background: "rgba(255,107,53,0.04)" }}>
                                <p className="text-[11px] font-semibold leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                                    {todayChallenge.description}
                                </p>
                                <div className="flex items-start gap-2 p-2.5 rounded-xl"
                                    style={{ background: "rgba(255,107,53,0.08)" }}>
                                    <span className="text-sm shrink-0">💡</span>
                                    <p className="text-[10px] leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                                        {todayChallenge.tip}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Coaching Action Card */}
                    <div className={`p-6 rounded-3xl border transition-all duration-500 overflow-hidden flex-shrink-0 ${aiPreview ? "bg-primary/5 border-primary/20 shadow-xl shadow-primary/5" : "bg-foreground/[0.02] border-foreground/5"}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl transition-colors ${aiPreview ? "bg-primary text-white" : "bg-foreground/10 text-foreground/20"}`}>
                                    <Sparkles size={18} className={isAnalyzing ? "animate-spin" : ""} />
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${aiPreview ? "text-primary" : "text-foreground/40"}`}>Star Coach Engine</span>
                                    <span className="text-xs font-bold text-foreground/60">리얼타임 마케팅 분석</span>
                                </div>
                            </div>
                            {!aiPreview && !isAnalyzing && (
                                <button
                                    onClick={handleAnalyze}
                                    disabled={!caption}
                                    className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 disabled:opacity-30 transition-all active:scale-95"
                                >
                                    AI 분석하기
                                </button>
                            )}
                        </div>

                        {isAnalyzing ? (
                            <div className="flex items-center gap-2 py-2">
                                <Loader2 size={16} className="animate-spin text-primary" />
                                <span className="text-xs font-bold text-primary italic">AI 코치가 당신의 카피를 분석 중입니다...</span>
                            </div>
                        ) : aiPreview ? (
                            <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-500">
                                <div className="p-4 bg-background/50 rounded-2xl border border-primary/10">
                                    <p className="text-xs text-foreground/60 leading-relaxed font-medium italic">
                                        "분석이 완료되었습니다! 전문 마케팅 보고서가 준비되었어요. 럭키!🚀"
                                    </p>
                                </div>
                                <button
                                    onClick={handleViewReport}
                                    className="w-full py-4 bg-primary text-white rounded-2xl flex items-center justify-center gap-3 font-black italic text-sm transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:translate-y-0"
                                >
                                    <FileText size={18} /> 상세 리포트 확인하기 <ArrowRight size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <p className="text-[11px] text-foreground/30 font-medium italic">
                                    캡션을 작성하고 AI 분석하기 버튼을 누르면 정교한 피드백을 받을 수 있습니다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 pt-2 border-t border-foreground/5 bg-background/80 backdrop-blur-md flex-shrink-0">
                    <button
                        disabled={isUploading || isSuccess || !caption}
                        onClick={handleUpload}
                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black italic text-sm transition-all active:scale-[0.98] shadow-xl ${isSuccess
                            ? "bg-green-500 text-white"
                            : isUploading
                                ? "bg-foreground/10 text-foreground/40"
                                : "bg-foreground text-background hover:bg-foreground/90"
                            }`}
                    >
                        {isSuccess ? (
                            <>업로드 완료! <CheckCircle size={20} /></>
                        ) : isUploading ? (
                            <><Loader2 size={18} className="animate-spin" /> 성과 시뮬레이션 중...</>
                        ) : (
                            <>실세계 피드에 게시하기 <Send size={18} /></>
                        )}
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}
