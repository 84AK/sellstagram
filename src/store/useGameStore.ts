import { create } from "zustand";
import { SkillXP, DEFAULT_SKILL_XP, SkillKey } from "@/lib/skills/skillTree";
import type { AvatarConfig } from "@/lib/avatar/types";
import { supabase } from "@/lib/supabase/client";

interface Product {
    id: string;
    name: string;
    price: number;
    cost: number;
    category: string;
    stock: number;
    image: string;
}

interface Campaign {
    id: string;
    productId: string;
    spent: number;
    revenue: number;
    efficiency: number;
    engagement: number;
}

interface Mission {
    id: string;
    title: string;
    description: string;
    type: "revenue" | "posts" | "engagement" | "likes";
    targetRevenue: number;
    targetCount?: number;       // posts 타입: 업로드 수, engagement 타입: 조건 충족 게시물 수
    targetEngagement?: number;  // engagement 타입: 최소 인게이지먼트율 (%)
    reward: number;
    isCompleted: boolean;
    isActive: boolean;  // 교사가 ON/OFF
}

interface UserProfile {
    name: string;
    handle: string;
    avatar: string;
    rank: string;
    team: string;
    points: number;
    role: "student" | "teacher" | "admin" | "";
    skillXP: SkillXP;
    avatarConfig?: AvatarConfig;
    marketerType?: string;
    selectedCharId: string;   // 선택된 캐릭터 변형 ID
    activeSkin: string;       // 적용된 스킨 ID
}

interface Post {
    id: string;
    type: "post" | "video";
    user: {
        name: string;
        handle: string;
        avatar: string;
    };
    content?: {
        image: string;
        caption: string;
        tags: string[];
    };
    description?: string;
    musicName?: string;
    stats: {
        likes: number | string;
        engagement?: string;
        sales?: string;
        comments?: string;
        shares?: string;
    };
    timeAgo: string;
    createdAt?: string;
    sellingPrice?: number;
    landingImages?: string[];
    images?: string[];
    adBudget?: number;
}

interface AIInsight {
    id: string;
    postId?: string;
    type: "coach" | "vision";
    title: string;
    content: string;
    date: string;
}

interface GameState {
    balance: number;
    inventory: Product[];
    campaigns: Campaign[];
    missions: Mission[];
    posts: Post[];
    insights: AIInsight[];
    user: UserProfile;
    week: number;
    isUploadModalOpen: boolean;
    isGuideModalOpen: boolean;
    isAIReportModalOpen: boolean;
    activeInsight: AIInsight | null;
    uploadContext: "general" | "mission";
    uploadPreFillProduct: { id: string; name: string; detailImages: string[]; price: number; } | null;
    isAIStudioOpen: boolean;
    aiStudioDraftCaption: string;
    aiStudioDraftTags: string;
    globalToast: { message: string; type: "error" | "info" | "success" } | null;
    setGlobalToast: (toast: { message: string; type: "error" | "info" | "success" } | null) => void;

    missionCompletionQueue: Mission[];  // 방금 완료된 미션 토스트용

    // Actions
    setSelectedChar: (charId: string) => void;
    setActiveSkin: (skinId: string) => void;
    addFunds: (amount: number) => void;
    purchaseProduct: (product: Product) => void;
    startCampaign: (campaign: Campaign) => void;
    completeMission: (missionId: string) => void;
    toggleMissionActive: (missionId: string) => void;
    addMission: (mission: Mission) => void;
    deleteMission: (missionId: string) => void;
    setMissions: (missions: Mission[]) => void;
    addPost: (post: Post) => void;
    addInsight: (insight: AIInsight) => void;
    updateProfile: (data: Partial<UserProfile>) => void;
    addPoints: (amount: number) => void;
    addSkillXP: (skill: SkillKey, amount: number) => void;
    setAvatarConfig: (config: AvatarConfig) => void;
    clearMissionCompletionQueue: () => void;
    setUploadModalOpen: (open: boolean, context?: "general" | "mission") => void;
    setUploadPreFillProduct: (product: { id: string; name: string; detailImages: string[]; price: number; } | null) => void;
    setGuideModalOpen: (open: boolean) => void;
    setAIReportModal: (open: boolean, insight?: AIInsight | null) => void;
    setAIStudioOpen: (open: boolean) => void;
    setAIStudioDraft: (caption: string, tags: string) => void;
    nextWeek: () => void;
    prevWeek: () => void;
    setWeek: (week: number) => void;
    resetPosts: () => void;
    setBalance: (amount: number) => void;
    spendBalance: (amount: number) => void;

    sidebarExpanded: boolean;
    setSidebarExpanded: (expanded: boolean) => void;

    unreadCount: number;
    setUnreadCount: (count: number) => void;

    pageLoading: boolean;
    setPageLoading: (loading: boolean) => void;
}

// 미션 조건 충족 여부 판단
function checkMissionAchieved(mission: Mission, posts: Post[]): boolean {
    if (mission.isCompleted || !mission.isActive) return false;

    if (mission.type === "posts") {
        return posts.length >= (mission.targetCount ?? 1);
    }

    if (mission.type === "revenue") {
        const total = posts.reduce((sum, p) => {
            const raw = typeof p.stats.sales === "string"
                ? parseInt(p.stats.sales.replace(/[₩,]/g, "") || "0")
                : 0;
            return sum + raw;
        }, 0);
        return total >= mission.targetRevenue;
    }

    if (mission.type === "engagement") {
        const qualified = posts.filter(p => {
            const eng = parseFloat(
                typeof p.stats.engagement === "string"
                    ? p.stats.engagement.replace("%", "")
                    : "0"
            );
            return eng >= (mission.targetEngagement ?? 10);
        });
        return qualified.length >= (mission.targetCount ?? 1);
    }

    if (mission.type === "likes") {
        const total = posts.reduce((sum, p) => {
            const raw = typeof p.stats.likes === "number"
                ? p.stats.likes
                : parseInt(String(p.stats.likes).replace(/[k,]/gi, "000") || "0");
            return sum + raw;
        }, 0);
        return total >= mission.targetRevenue;
    }

    return false;
}

export const useGameStore = create<GameState>((set) => ({
    balance: 500000,
    inventory: [],
    campaigns: [],
    missionCompletionQueue: [],
    posts: [],
    insights: [],
    week: 1,
    isUploadModalOpen: false,
    isGuideModalOpen: false,
    sidebarExpanded: false,
    unreadCount: 0,
    isAIReportModalOpen: false,
    activeInsight: null,
    uploadContext: "general",
    uploadPreFillProduct: null,
    isAIStudioOpen: false,
    aiStudioDraftCaption: "",
    aiStudioDraftTags: "",
    globalToast: null,
    user: {
        name: "",
        handle: "",
        avatar: "",
        rank: "Beginner",
        team: "",
        points: 0,
        role: "",
        skillXP: DEFAULT_SKILL_XP,
        selectedCharId: typeof window !== "undefined"
            ? (localStorage.getItem("sellstagram_char") ?? "")
            : "",
        activeSkin: typeof window !== "undefined"
            ? (localStorage.getItem("sellstagram_skin") ?? "default")
            : "default",
    },
    missions: [],

    setSelectedChar: (charId) => {
        if (typeof window !== "undefined") localStorage.setItem("sellstagram_char", charId);
        set((state) => ({ user: { ...state.user, selectedCharId: charId } }));
    },
    setActiveSkin: (skinId) => {
        if (typeof window !== "undefined") localStorage.setItem("sellstagram_skin", skinId);
        set((state) => ({ user: { ...state.user, activeSkin: skinId } }));
    },

    addFunds: (amount) => set((state) => ({ balance: state.balance + amount })),

    purchaseProduct: (product) => set((state) => {
        if (state.balance < product.price) return state;
        return {
            balance: state.balance - product.price,
            inventory: [...state.inventory, product]
        };
    }),

    startCampaign: (campaign) => set((state) => ({
        campaigns: [...state.campaigns, campaign]
    })),

    completeMission: (missionId) => set((state) => ({
        missions: state.missions.map(m =>
            m.id === missionId ? { ...m, isCompleted: true } : m
        )
    })),

    addPost: (post) => set((state) => {
        // 동일 ID가 이미 있으면 무시 (Realtime 중복 방지)
        if (state.posts.some(p => p.id === post.id)) return state;
        const newPosts = [post, ...state.posts];

        // 미션 자동 감지
        const newlyCompleted: Mission[] = [];
        const updatedMissions = state.missions.map(m => {
            if (m.isCompleted || !m.isActive) return m;
            if (checkMissionAchieved(m, newPosts)) {
                newlyCompleted.push(m);
                return { ...m, isCompleted: true };
            }
            return m;
        });

        // 완료된 미션의 보상 합산
        const rewardTotal = newlyCompleted.reduce((sum, m) => sum + m.reward, 0);

        return {
            posts: newPosts,
            missions: updatedMissions,
            balance: state.balance + rewardTotal,
            missionCompletionQueue: [...state.missionCompletionQueue, ...newlyCompleted],
        };
    }),

    addInsight: (insight) => set((state) => ({
        insights: [insight, ...state.insights]
    })),

    updateProfile: (data) => set((state) => ({
        user: { ...state.user, ...data }
    })),

    addPoints: (amount) => {
        const safeAmount = Math.max(1, Math.min(Math.floor(amount), 500));
        // 낙관적 UI — set()은 순수하게 상태만 변경
        set((state) => ({ user: { ...state.user, points: state.user.points + safeAmount } }));
        // 서버 동기화는 set() 밖에서 실행
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session?.user?.id) return;
            supabase.rpc("increment_user_points", {
                p_user_id: session.user.id,
                p_amount: safeAmount,
            }).then(({ error }) => {
                if (error) {
                    console.warn("[addPoints RPC]", error.message);
                    // 서버 실패 시 롤백
                    set((state) => ({ user: { ...state.user, points: Math.max(0, state.user.points - safeAmount) } }));
                }
            });
        });
    },

    setAvatarConfig: (config) => set((state) => ({
        user: { ...state.user, avatarConfig: config },
    })),

    addSkillXP: (skill, amount) => {
        set((state) => {
            const newSkillXP = {
                ...state.user.skillXP,
                [skill]: (state.user.skillXP[skill] ?? 0) + amount,
            };
            // Supabase에 비동기 저장 (fire-and-forget)
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user?.id) {
                    supabase.from("profiles")
                        .update({ skill_xp: newSkillXP })
                        .eq("id", session.user.id)
                        .then(({ error }) => {
                            if (error) console.warn("[addSkillXP]", error.message);
                        });
                }
            });
            return { user: { ...state.user, skillXP: newSkillXP } };
        });
    },

    clearMissionCompletionQueue: () => set({ missionCompletionQueue: [] }),

    setBalance: (amount) => set({ balance: amount }),
    spendBalance: (amount) => set((state) => ({ balance: Math.max(0, state.balance - amount) })),

    setUploadModalOpen: (open, context = "general") => set({
        isUploadModalOpen: open,
        uploadContext: context,
        ...(open === false ? { uploadPreFillProduct: null } : {}),
    }),
    setUploadPreFillProduct: (product) => set({ uploadPreFillProduct: product }),
    setGuideModalOpen: (open) => set({ isGuideModalOpen: open }),
    setAIReportModal: (open, insight = null) => set({
        isAIReportModalOpen: open,
        activeInsight: insight
    }),

    toggleMissionActive: (missionId) => set((state) => ({
        missions: state.missions.map(m =>
            m.id === missionId ? { ...m, isActive: !m.isActive } : m
        )
    })),

    addMission: (mission) => set((state) => ({
        missions: [...state.missions, mission],
    })),

    deleteMission: (missionId) => set((state) => ({
        missions: state.missions.filter(m => m.id !== missionId),
    })),

    setMissions: (missions) => set({ missions }),

    setAIStudioOpen: (open) => set({ isAIStudioOpen: open }),
    setAIStudioDraft: (caption, tags) => set({ aiStudioDraftCaption: caption, aiStudioDraftTags: tags }),
    setGlobalToast: (toast) => set({ globalToast: toast }),

    nextWeek: () => set((state) => ({ week: Math.min(29, state.week + 1) })),
    prevWeek: () => set((state) => ({ week: Math.max(1, state.week - 1) })),
    setWeek: (week) => set({ week: Math.max(1, Math.min(29, week)) }),
    resetPosts: () => set({ posts: [] }),
    setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
    setUnreadCount: (count) => set({ unreadCount: count }),
    pageLoading: false,
    setPageLoading: (loading) => set({ pageLoading: loading }),
}));
