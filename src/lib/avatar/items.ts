import type { AvatarConfig, AvatarItemDef } from "./types";

export const AVATAR_ITEMS: AvatarItemDef[] = [
    // ── 헤어 스타일 ──
    { id: "hair_shortflat",    name: "기본 단발",      category: "헤어", xpPrice: 0,    slot: "top", value: "shortFlat",           preview: "💇",    rarity: "common", isDefault: true },
    { id: "hair_long",         name: "긴 생머리",      category: "헤어", xpPrice: 300,  slot: "top", value: "longButNotTooLong",     preview: "🦱",    rarity: "common" },
    { id: "hair_curly",        name: "곱슬머리",       category: "헤어", xpPrice: 400,  slot: "top", value: "curly",                preview: "🌀",    rarity: "common" },
    { id: "hair_bun",          name: "번 머리",        category: "헤어", xpPrice: 350,  slot: "top", value: "bun",                  preview: "🎀",    rarity: "common" },
    { id: "hair_bob",          name: "보브 컷",        category: "헤어", xpPrice: 300,  slot: "top", value: "bob",                  preview: "✂️",   rarity: "common" },
    { id: "hair_shaggy",       name: "샤기 헤어",      category: "헤어", xpPrice: 400,  slot: "top", value: "shaggy",               preview: "🫧",    rarity: "common" },
    { id: "hair_fro",          name: "아프로",         category: "헤어", xpPrice: 600,  slot: "top", value: "fro",                  preview: "⭕",    rarity: "rare" },
    { id: "hair_dreads",       name: "드레드",         category: "헤어", xpPrice: 700,  slot: "top", value: "dreads01",             preview: "〰️",  rarity: "rare" },
    { id: "hair_turban",       name: "터번",           category: "헤어", xpPrice: 500,  slot: "top", value: "turban",               preview: "🌈",    rarity: "rare" },
    { id: "hair_hijab",        name: "히잡",           category: "헤어", xpPrice: 400,  slot: "top", value: "hijab",                preview: "🧕",    rarity: "common" },
    { id: "hair_winter",       name: "겨울 비니",      category: "헤어", xpPrice: 600,  slot: "top", value: "winterHat1",           preview: "🧢",    rarity: "rare" },
    { id: "hair_hat",          name: "버킷햇",         category: "헤어", xpPrice: 1000, slot: "top", value: "hat",                  preview: "🎩",    rarity: "epic" },
    { id: "hair_caesar",       name: "시저 컷",        category: "헤어", xpPrice: 500,  slot: "top", value: "theCaesar",            preview: "👑",    rarity: "rare" },
    { id: "hair_sides",        name: "투블록",         category: "헤어", xpPrice: 450,  slot: "top", value: "sides",                preview: "💈",    rarity: "common" },

    // ── 머리색 ──
    { id: "hc_black",          name: "블랙",          category: "머리색", xpPrice: 0,   slot: "hairColor", value: "black",        preview: "⚫",    rarity: "common", isDefault: true },
    { id: "hc_brown",          name: "브라운",        category: "머리색", xpPrice: 150, slot: "hairColor", value: "brown",        preview: "🟤",    rarity: "common" },
    { id: "hc_brownDark",      name: "다크 브라운",   category: "머리색", xpPrice: 150, slot: "hairColor", value: "brownDark",    preview: "🪵",    rarity: "common" },
    { id: "hc_auburn",         name: "오번",          category: "머리색", xpPrice: 300, slot: "hairColor", value: "auburn",       preview: "🍂",    rarity: "common" },
    { id: "hc_blonde",         name: "금발",          category: "머리색", xpPrice: 500, slot: "hairColor", value: "blonde",       preview: "🟡",    rarity: "rare" },
    { id: "hc_blondeGolden",   name: "골든 블론드",   category: "머리색", xpPrice: 550, slot: "hairColor", value: "blondeGolden", preview: "✨",    rarity: "rare" },
    { id: "hc_red",            name: "레드",          category: "머리색", xpPrice: 600, slot: "hairColor", value: "red",          preview: "🔴",    rarity: "rare" },
    { id: "hc_pastelPink",     name: "파스텔 핑크",   category: "머리색", xpPrice: 800, slot: "hairColor", value: "pastelPink",   preview: "🌸",    rarity: "epic" },
    { id: "hc_silverGray",     name: "실버 그레이",   category: "머리색", xpPrice: 700, slot: "hairColor", value: "silverGray",   preview: "⚡",    rarity: "rare" },
    { id: "hc_platinum",       name: "플래티넘",      category: "머리색", xpPrice: 800, slot: "hairColor", value: "platinum",     preview: "💎",    rarity: "epic" },

    // ── 눈 ──
    { id: "eyes_default",      name: "기본 눈",       category: "눈", xpPrice: 0,   slot: "eyes", value: "default",    preview: "👁️",  rarity: "common", isDefault: true },
    { id: "eyes_happy",        name: "행복한 눈",     category: "눈", xpPrice: 200, slot: "eyes", value: "happy",      preview: "😊",    rarity: "common" },
    { id: "eyes_wink",         name: "윙크",          category: "눈", xpPrice: 300, slot: "eyes", value: "wink",       preview: "😉",    rarity: "common" },
    { id: "eyes_squint",       name: "실눈",          category: "눈", xpPrice: 350, slot: "eyes", value: "squint",     preview: "😏",    rarity: "common" },
    { id: "eyes_surprised",    name: "놀란 눈",       category: "눈", xpPrice: 300, slot: "eyes", value: "surprised",  preview: "😲",    rarity: "common" },
    { id: "eyes_cry",          name: "빛나는 눈",     category: "눈", xpPrice: 400, slot: "eyes", value: "cry",        preview: "🥺",    rarity: "common" },
    { id: "eyes_hearts",       name: "하트 눈 💕",    category: "눈", xpPrice: 600, slot: "eyes", value: "hearts",     preview: "😍",    rarity: "rare" },
    { id: "eyes_tiredTired",   name: "졸린 눈",       category: "눈", xpPrice: 400, slot: "eyes", value: "tiredTired", preview: "😴",    rarity: "common" },
    { id: "eyes_side",         name: "곁눈질",        category: "눈", xpPrice: 350, slot: "eyes", value: "side",       preview: "👀",    rarity: "common" },
    { id: "eyes_xDizzy",       name: "X눈 ✖️",       category: "눈", xpPrice: 800, slot: "eyes", value: "xDizzy",     preview: "😵",    rarity: "epic" },
    { id: "eyes_winkWacky",    name: "개그 윙크",     category: "눈", xpPrice: 700, slot: "eyes", value: "winkWacky",  preview: "🤪",    rarity: "rare" },

    // ── 입 ──
    { id: "mouth_default",     name: "기본 입",       category: "입", xpPrice: 0,   slot: "mouth", value: "default",    preview: "😐",    rarity: "common", isDefault: true },
    { id: "mouth_smile",       name: "활짝 미소",     category: "입", xpPrice: 200, slot: "mouth", value: "smile",      preview: "😄",    rarity: "common" },
    { id: "mouth_serious",     name: "진지함",        category: "입", xpPrice: 200, slot: "mouth", value: "serious",    preview: "😑",    rarity: "common" },
    { id: "mouth_tongue",      name: "혀 내밀기",     category: "입", xpPrice: 400, slot: "mouth", value: "tongue",     preview: "😛",    rarity: "common" },
    { id: "mouth_twinkle",     name: "반짝 미소",     category: "입", xpPrice: 500, slot: "mouth", value: "twinkle",    preview: "✨",    rarity: "rare" },
    { id: "mouth_eating",      name: "먹는 중",       category: "입", xpPrice: 500, slot: "mouth", value: "eating",     preview: "😋",    rarity: "rare" },
    { id: "mouth_grimace",     name: "이 드러내기",   category: "입", xpPrice: 600, slot: "mouth", value: "grimace",    preview: "😬",    rarity: "rare" },
    { id: "mouth_screamOpen",  name: "소리치는 입",   category: "입", xpPrice: 700, slot: "mouth", value: "screamOpen", preview: "😱",    rarity: "epic" },

    // ── 옷 스타일 ──
    { id: "top_hoodie",        name: "후드티",        category: "옷", xpPrice: 0,   slot: "clothesType", value: "hoodie",           preview: "👕",    rarity: "common", isDefault: true },
    { id: "top_graphic",       name: "그래픽 티",     category: "옷", xpPrice: 400, slot: "clothesType", value: "graphicShirt",     preview: "🎨",    rarity: "common" },
    { id: "top_sweater",       name: "스웨터",        category: "옷", xpPrice: 300, slot: "clothesType", value: "collarAndSweater", preview: "🧶",    rarity: "common" },
    { id: "top_vneck",         name: "V넥 셔츠",      category: "옷", xpPrice: 300, slot: "clothesType", value: "shirtVNeck",       preview: "👔",    rarity: "common" },
    { id: "top_crewneck",      name: "크루넥",        category: "옷", xpPrice: 350, slot: "clothesType", value: "shirtCrewNeck",    preview: "🫧",    rarity: "common" },
    { id: "top_overall",       name: "오버롤",        category: "옷", xpPrice: 600, slot: "clothesType", value: "overall",          preview: "👖",    rarity: "rare" },
    { id: "top_blazer",        name: "블레이저",      category: "옷", xpPrice: 700, slot: "clothesType", value: "blazerAndShirt",   preview: "🧥",    rarity: "rare" },
    { id: "top_blazersweater", name: "블레이저 스웨터", category: "옷", xpPrice: 900, slot: "clothesType", value: "blazerAndSweater", preview: "🎽",   rarity: "epic" },

    // ── 옷 색상 ──
    { id: "cc_gray",           name: "그레이",        category: "옷색상", xpPrice: 0,   slot: "clothesColor", value: "gray01",       preview: "🩶",    rarity: "common", isDefault: true },
    { id: "cc_black",          name: "블랙",          category: "옷색상", xpPrice: 200, slot: "clothesColor", value: "black",        preview: "⚫",    rarity: "common" },
    { id: "cc_white",          name: "화이트",        category: "옷색상", xpPrice: 200, slot: "clothesColor", value: "white",        preview: "⬜",    rarity: "common" },
    { id: "cc_red",            name: "레드",          category: "옷색상", xpPrice: 300, slot: "clothesColor", value: "red",          preview: "🔴",    rarity: "common" },
    { id: "cc_blue01",         name: "블루",          category: "옷색상", xpPrice: 300, slot: "clothesColor", value: "blue01",       preview: "🔵",    rarity: "common" },
    { id: "cc_pink",           name: "핑크",          category: "옷색상", xpPrice: 300, slot: "clothesColor", value: "pink",         preview: "🩷",    rarity: "common" },
    { id: "cc_pastelBlue",     name: "파스텔 블루",   category: "옷색상", xpPrice: 400, slot: "clothesColor", value: "pastelBlue",   preview: "🩵",    rarity: "common" },
    { id: "cc_pastelGreen",    name: "파스텔 그린",   category: "옷색상", xpPrice: 400, slot: "clothesColor", value: "pastelGreen",  preview: "💚",    rarity: "common" },
    { id: "cc_pastelOrange",   name: "파스텔 오렌지", category: "옷색상", xpPrice: 400, slot: "clothesColor", value: "pastelOrange", preview: "🧡",    rarity: "common" },
    { id: "cc_heather",        name: "헤더 그레이",   category: "옷색상", xpPrice: 350, slot: "clothesColor", value: "heather",      preview: "🫗",    rarity: "common" },

    // ── 액세서리 ──
    { id: "acc_none",          name: "없음",          category: "액세서리", xpPrice: 0,   slot: "accessories", value: "",              preview: "😶",    rarity: "common", isDefault: true },
    { id: "acc_glasses1",      name: "안경",          category: "액세서리", xpPrice: 400, slot: "accessories", value: "prescription01", preview: "🤓",    rarity: "common" },
    { id: "acc_glasses2",      name: "처방 안경",     category: "액세서리", xpPrice: 450, slot: "accessories", value: "prescription02", preview: "🥸",    rarity: "common" },
    { id: "acc_round",         name: "동그란 안경",   category: "액세서리", xpPrice: 500, slot: "accessories", value: "round",          preview: "👓",    rarity: "common" },
    { id: "acc_kurt",          name: "커트 안경",     category: "액세서리", xpPrice: 600, slot: "accessories", value: "kurt",           preview: "🧐",    rarity: "rare" },
    { id: "acc_sunglasses",    name: "선글라스",      category: "액세서리", xpPrice: 700, slot: "accessories", value: "sunglasses",     preview: "😎",    rarity: "rare" },
    { id: "acc_wayfarers",     name: "웨이페러",      category: "액세서리", xpPrice: 900, slot: "accessories", value: "wayfarers",      preview: "🕶️",  rarity: "epic" },

    // ── 배경색 ──
    { id: "bg_white",          name: "화이트",        category: "배경색", xpPrice: 0,   slot: "backgroundColor", value: "ffffff",    preview: "⬜",    rarity: "common", isDefault: true },
    { id: "bg_mint",           name: "민트",          category: "배경색", xpPrice: 200, slot: "backgroundColor", value: "b7f0e0",    preview: "💚",    rarity: "common" },
    { id: "bg_lavender",       name: "라벤더",        category: "배경색", xpPrice: 200, slot: "backgroundColor", value: "d4b8ff",    preview: "💜",    rarity: "common" },
    { id: "bg_sky",            name: "하늘색",        category: "배경색", xpPrice: 200, slot: "backgroundColor", value: "b3d9ff",    preview: "🩵",    rarity: "common" },
    { id: "bg_peach",          name: "피치",          category: "배경색", xpPrice: 200, slot: "backgroundColor", value: "ffcba4",    preview: "🍑",    rarity: "common" },
    { id: "bg_yellow",         name: "옐로우",        category: "배경색", xpPrice: 200, slot: "backgroundColor", value: "ffeaa7",    preview: "🟡",    rarity: "common" },
    { id: "bg_pink",           name: "핑크",          category: "배경색", xpPrice: 300, slot: "backgroundColor", value: "ffc0cb",    preview: "🩷",    rarity: "common" },
    { id: "bg_darkblue",       name: "다크 블루",     category: "배경색", xpPrice: 600, slot: "backgroundColor", value: "2c3e50",    preview: "🌑",    rarity: "rare" },
    { id: "bg_darkgreen",      name: "다크 그린",     category: "배경색", xpPrice: 600, slot: "backgroundColor", value: "1a6b4a",    preview: "🌿",    rarity: "rare" },
    { id: "bg_hotpink",        name: "핫 핑크 ✨",    category: "배경색", xpPrice: 800, slot: "backgroundColor", value: "ff6b9d",    preview: "🌸",    rarity: "epic" },
    { id: "bg_gold",           name: "골드 ✨",       category: "배경색", xpPrice: 800, slot: "backgroundColor", value: "ffd700",    preview: "⭐",    rarity: "epic" },
    { id: "bg_purple",         name: "퍼플 ✨",       category: "배경색", xpPrice: 800, slot: "backgroundColor", value: "6c3483",    preview: "👾",    rarity: "epic" },
];

export function buildAvatarUrl(config: AvatarConfig, seed: string, size = 200): string {
    const base = "https://api.dicebear.com/9.x/avataaars-neutral/svg";
    const p = new URLSearchParams({ seed, size: String(size) });
    if (config.top) p.set("top", config.top);
    if (config.hairColor) p.set("hairColor", config.hairColor);
    if (config.eyes) p.set("eyes", config.eyes);
    if (config.eyebrows) p.set("eyebrows", config.eyebrows);
    if (config.mouth) p.set("mouth", config.mouth);
    if (config.clothesType) p.set("clothesType", config.clothesType);
    if (config.clothesColor) p.set("clothesColor", config.clothesColor);
    if (config.accessories) p.set("accessories", config.accessories);
    if (config.backgroundColor) p.set("backgroundColor", config.backgroundColor);
    return `${base}?${p}`;
}

export const RARITY_LABEL: Record<string, string> = {
    common: "일반",
    rare: "레어",
    epic: "에픽",
};

export const CATEGORY_ICONS: Record<string, string> = {
    "헤어": "💇",
    "머리색": "🎨",
    "눈": "👁️",
    "입": "👄",
    "옷": "👕",
    "옷색상": "🎨",
    "액세서리": "👓",
    "배경색": "🖼️",
};

/** 아이템 카드에 보여줄 DiceBear 미리보기 URL (해당 옵션만 적용한 기본 아바타) */
export function getItemPreviewUrl(item: AvatarItemDef, seed = "preview"): string {
    const base: AvatarConfig = {
        top: "shortFlat",
        hairColor: "black",
        eyes: "default",
        eyebrows: "default",
        mouth: "smile",
        clothesType: "hoodie",
        clothesColor: "gray01",
        accessories: "",
        backgroundColor: "f7f6f3",
    };
    // 해당 슬롯에 이 아이템의 값을 적용
    const preview: AvatarConfig = { ...base, [item.slot]: item.value };
    return buildAvatarUrl(preview, `${seed}-${item.id}`, 120);
}

export const OWNED_ITEMS_KEY = "sellstagram_avatar_owned";

export function getOwnedItems(): string[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(OWNED_ITEMS_KEY) || "[]");
    } catch {
        return [];
    }
}

export function addOwnedItem(id: string): void {
    const current = getOwnedItems();
    if (!current.includes(id)) {
        localStorage.setItem(OWNED_ITEMS_KEY, JSON.stringify([...current, id]));
    }
}

export const AVATAR_CONFIG_KEY = "sellstagram_avatar_config";

export function getSavedAvatarConfig(): AvatarConfig | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(AVATAR_CONFIG_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function saveAvatarConfig(config: AvatarConfig): void {
    localStorage.setItem(AVATAR_CONFIG_KEY, JSON.stringify(config));
}
