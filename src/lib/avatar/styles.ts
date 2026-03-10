// ── Types ─────────────────────────────────────────────────────
export type OptionType = "avatar" | "color";

export interface StyleOptionValue {
    value: string;
    label: string;
    color?: string; // CSS color with # for swatch display
}

export interface StyleOption {
    key: string;
    label: string;
    type: OptionType;
    values: StyleOptionValue[];
    /** When true: selecting any value auto-sets {key}Probability=100 in URL */
    hasProbability?: boolean;
}

export interface DiceBearStyle {
    id: string;
    nameKo: string;
    description: string;
    xpCost: number;
    emoji: string;
    options: StyleOption[];
    defaultOptions: Record<string, string>;
}

// ── Shorthand helpers ─────────────────────────────────────────
const c = (v: string, l: string): StyleOptionValue => ({ value: v, label: l, color: `#${v}` });
const e = (v: string, l: string): StyleOptionValue => ({ value: v, label: l });

function variants(n: number, label: string): StyleOptionValue[] {
    return Array.from({ length: n }, (_, i) =>
        e(`variant${String(i + 1).padStart(2, "0")}`, `${label} ${i + 1}`)
    );
}
function numbered(prefix: string, n: number, label: string): StyleOptionValue[] {
    return Array.from({ length: n }, (_, i) =>
        e(`${prefix}${String(i + 1).padStart(2, "0")}`, `${label} ${i + 1}`)
    );
}
function happySad(h: number, s: number): StyleOptionValue[] {
    return [
        ...Array.from({ length: h }, (_, i) => e(`happy${String(i + 1).padStart(2, "0")}`, `행복 ${i + 1}`)),
        ...Array.from({ length: s }, (_, i) => e(`sad${String(i + 1).padStart(2, "0")}`, `슬픔 ${i + 1}`)),
    ];
}
// big-ears mouth: row 01-04 × 8cols + row05 × 6cols = 38
function bigEarsMouth(): StyleOptionValue[] {
    const result: StyleOptionValue[] = [];
    let count = 0;
    for (let r = 1; r <= 5; r++) {
        const cols = r <= 4 ? 8 : 6;
        for (let c2 = 1; c2 <= cols; c2++) {
            result.push(e(
                `variant${String(r).padStart(2,"0")}${String(c2).padStart(2,"0")}`,
                `입 ${++count}`
            ));
        }
    }
    return result;
}

// ── Common color palettes (real DiceBear schema values) ────────

// Background colors (common to all styles)
const BG: StyleOptionValue[] = [
    c("b6e3f4","하늘"), c("c0aede","라벤더"), c("d1d4f9","퍼플"), c("ffd5dc","핑크"),
    c("ffdfbf","피치"), c("b5ead7","민트"), c("ffeaa7","옐로우"), c("ffffff","화이트"),
    c("f7f6f3","아이보리"), c("2d3436","다크"), c("fd79a8","핫핑크"), c("00b894","에메랄드"),
    c("6c5ce7","바이올렛"), c("e17055","코랄"), c("fdcb6e","골드"), c("00cec9","틸"),
];
const BG_OPT: StyleOption = { key: "backgroundColor", label: "배경색", type: "color", values: BG };

// Adventurer skin/hair (from schema)
const SKIN_ADV: StyleOptionValue[] = [
    c("f2d3b1","라이트"), c("ecad80","피치"), c("9e5622","갈색"), c("763900","다크"),
];
const HAIR_ADV: StyleOptionValue[] = [
    c("0e0e0e","블랙"), c("562306","다크 브라운"), c("6a4e35","브라운"), c("796a45","탄"),
    c("b9a05f","라이트"), c("e5d7a3","블론드"), c("ac6511","오렌지"), c("cb6820","버닝"),
    c("ab2a18","레드"), c("3eac2c","그린"), c("85c2c6","블루"), c("dba3be","핑크"),
    c("592454","퍼플"), c("afafaf","실버"),
];

// Avataaars skin/hair/clothes (from schema)
const SKIN_AV: StyleOptionValue[] = [
    c("ffdbb4","아이보리"), c("f8d25c","골드"), c("fd9841","오렌지"), c("edb98a","베이지"),
    c("d08b5b","탄"), c("ae5d29","갈색"), c("614335","다크"),
];
const HAIR_AV: StyleOptionValue[] = [
    c("2c1b18","블랙"), c("4a312c","다크 브라운"), c("724133","브라운"), c("b58143","라이트"),
    c("d6b370","블론드"), c("a55728","오렌지"), c("f59797","핑크"), c("c93305","레드"),
    c("ecdcbf","플래티넘"), c("e8e1e1","실버"),
];
const CLOTHES_AV: StyleOptionValue[] = [
    c("262e33","다크"), c("3c4f5c","차콜"), c("5199e4","블루"), c("25557c","네이비"),
    c("929598","그레이"), c("e6e6e6","라이트 그레이"), c("ffffff","화이트"),
    c("ff5c5c","레드"), c("ff488e","핑크"), c("ffafb9","핑크2"), c("ffffb1","옐로우"),
    c("a7ffc4","민트"), c("b1e2ff","스카이"), c("65c9ff","블루2"),
];

// Big-ears skin/hair (from schema)
const SKIN_BIGEARS: StyleOptionValue[] = [
    c("f8b788","피치"), c("da9969","탄"), c("c07f50","갈색1"), c("a66637","갈색2"), c("89532c","다크"),
];
const HAIR_BIGEARS: StyleOptionValue[] = [
    c("2c1b18","블랙"), c("4a312c","다크 브라운"), c("724133","브라운"), c("b58143","라이트"),
    c("a55728","오렌지"), c("f59797","핑크"), c("c93305","레드"), c("ecdcbf","플래티넘"),
    c("d6b370","블론드"), c("e8e1e1","실버"),
];

// Big-smile skin/hair (from schema)
const SKIN_BIGSMILE: StyleOptionValue[] = [
    c("ffe4c0","라이트"), c("f5d7b1","피치"), c("efcc9f","베이지"), c("e2ba87","탄"),
    c("c99c62","갈색"), c("a47539","다크1"), c("8c5a2b","다크2"), c("643d19","딥"),
];
const HAIR_BIGSMILE: StyleOptionValue[] = [
    c("220f00","블랙"), c("3a1a00","다크 브라운"), c("71472d","브라운"), c("e2ba87","블론드"),
    c("d56c0c","오렌지"), c("605de4","퍼플"), c("238d80","틸"), c("e9b729","골드"),
];

// Open-peeps skin/clothes (from schema)
const SKIN_OPENPEEPS: StyleOptionValue[] = [
    c("ffdbb4","아이보리"), c("edb98a","베이지"), c("d08b5b","탄"), c("ae5d29","갈색"), c("694d3d","다크"),
];
const CLOTHES_OPENPEEPS: StyleOptionValue[] = [
    c("e78276","코랄"), c("ffcf77","옐로우"), c("fdea6b","골드"),
    c("78e185","그린"), c("9ddadb","틸"), c("8fa7df","블루"), c("e279c7","핑크"),
];

// Personas skin/hair/clothes (from schema)
const SKIN_PERSONAS: StyleOptionValue[] = [
    c("eeb4a4","라이트"), c("e7a391","피치"), c("e5a07e","베이지"), c("d78774","탄"),
    c("b16a5b","갈색"), c("92594b","다크"), c("623d36","딥"),
];
const HAIR_PERSONAS: StyleOptionValue[] = [
    c("362c47","다크"), c("6c4545","브라운"), c("e15c66","레드"), c("e16381","핑크1"),
    c("f27d65","오렌지"), c("f29c65","피치"), c("dee1f5","라이트"),
];
const CLOTHES_PERSONAS: StyleOptionValue[] = [
    c("456dff","블루"), c("54d7c7","틸"), c("7555ca","퍼플"), c("6dbb58","그린"),
    c("e24553","레드"), c("f3b63a","오렌지"), c("f55d81","핑크"),
];

// Micah skin/hair (from schema)
const SKIN_MICAH: StyleOptionValue[] = [
    c("f9c9b6","라이트"), c("ac6651","탄"), c("77311d","다크"),
];
const HAIR_MICAH: StyleOptionValue[] = [
    c("000000","블랙"), c("77311d","다크 브라운"), c("ac6651","브라운"), c("f4d150","블론드"),
    c("9287ff","퍼플"), c("6bd9e9","블루"), c("fc909f","핑크"), c("f9c9b6","피치"),
    c("d2eff3","아쿠아"), c("ffeba4","옐로우"), c("e0ddff","라벤더"), c("ffffff","화이트"),
];
const SHIRT_MICAH: StyleOptionValue[] = HAIR_MICAH;

// Lorelei — accepts any hex, so use curated palettes
const SKIN_LORELEI: StyleOptionValue[] = [
    c("fde8d8","라이트"), c("f5c5a3","피치"), c("e8a87c","베이지"), c("c68642","탄"),
    c("8d4925","다크"), c("5c3317","딥"),
];
const HAIR_LORELEI: StyleOptionValue[] = [
    c("000000","블랙"), c("3c2415","다크 브라운"), c("71472d","브라운"), c("c68642","캐러멜"),
    c("e9b729","블론드"), c("d56c0c","오렌지"), c("c0392b","레드"), c("605de4","퍼플"),
    c("238d80","틸"), c("ff6b9d","핑크"), c("c0c0c0","실버"), c("ffffff","화이트"),
];

// Croodles (from schema)
const SKIN_CROODLES: StyleOptionValue[] = [
    c("ffcb7e","라이트"), c("f5d0c5","피치"), c("836055","다크"),
];
const HAIR_CROODLES: StyleOptionValue[] = [
    c("47280b","다크 브라운"), c("1b0b47","다크 퍼플"), c("ad3a20","레드 브라운"),
];

// Pixel-art (exact schema values)
const SKIN_PIXEL: StyleOptionValue[] = [
    c("eeb4a4","라이트"), c("e7a391","피치"), c("e5a07e","베이지"), c("d78774","탄"),
    c("b16a5b","갈색"), c("92594b","다크"), c("623d36","딥"),
];
const HAIR_PIXEL: StyleOptionValue[] = [
    c("362c47","다크"), c("6c4545","브라운"), c("e15c66","레드"), c("e16381","핑크"),
    c("f27d65","오렌지"), c("f29c65","피치"), c("dee1f5","라이트"),
];
const CLOTHES_PIXEL: StyleOptionValue[] = [
    c("456dff","블루"), c("54d7c7","틸"), c("7555ca","퍼플"), c("6dbb58","그린"),
    c("e24553","레드"), c("f3b63a","오렌지"), c("f55d81","핑크"),
];

// Thumbs top colors (exact schema values)
const THUMBS_TOP_COLORS: StyleOptionValue[] = [
    c("ffc700","옐로우"), c("9747ff","퍼플"), c("f24e1e","레드"), c("699bf7","블루"),
    c("0fa958","그린"), c("000000","블랙"),
];

// Bottts base colors (exact schema values)
const BOTTTS_BASE: StyleOptionValue[] = [
    c("ffb300","골드"), c("1e88e5","블루"), c("546e7a","그레이"), c("6d4c41","브라운"),
    c("00acc1","시안"), c("f4511e","오렌지"), c("5e35b1","퍼플"), c("43a047","그린"),
    c("757575","다크 그레이"), c("3949ab","인디고"), c("039be5","스카이"), c("7cb342","라임"),
    c("c0ca33","옐로우 그린"), c("fb8c00","앰버"), c("d81b60","핑크"), c("8e24aa","바이올렛"),
    c("e53935","레드"), c("00897b","틸"), c("fdd835","옐로우"),
];

// Identicon row values
const IDENTICON_ROW: StyleOptionValue[] = [
    e("xooox","XOOOX"), e("xxoxx","XXOXX"), e("xoxox","XOXOX"), e("oxxxo","OXXXO"),
    e("xxxxx","XXXXX"), e("oxoxo","OXOXO"), e("ooxoo","OOXOO"),
];
const IDENTICON_COLORS: StyleOptionValue[] = [
    c("3949ab","인디고"), c("e53935","레드"), c("43a047","그린"), c("ffb300","옐로우"),
    c("8e24aa","퍼플"), c("00897b","틸"), c("f4511e","오렌지"), c("1e88e5","블루"),
    c("757575","그레이"), c("d81b60","핑크"),
];

// Rings colors (exact schema)
const RING_COLORS: StyleOptionValue[] = [
    c("ffd54f","골드"), c("64b5f6","블루"), c("4dd0e1","시안"), c("ff8a65","오렌지"),
    c("9575cd","퍼플"), c("81c784","그린"), c("7986cb","인디고"), c("4fc3f7","스카이"),
    c("aed581","라임"), c("dce775","옐로우그린"), c("ffb74d","앰버"), c("f06292","핑크"),
    c("ba68c8","바이올렛"), c("e57373","레드"), c("4db6ac","틸"), c("fff176","옐로우"),
];

// Icons list (Bootstrap Icons — full set from schema)
const ICONS_LIST: StyleOptionValue[] = [
    "alarm","archive","award","bag","bandaid","bank","basket","basket2","basket3","bell",
    "bicycle","binoculars","book","bookshelf","boombox","boxSeam","box","boxes","bricks",
    "briefcase","brightnessHigh","brush","bucket","bug","building","calculator","cameraReels",
    "camera","cart2","cashCoin","clock","cloudDrizzle","cloudMoon","cloudSnow","cloud",
    "clouds","coin","compass","controller","cupStraw","cup","dice5","disc","display",
    "doorClosed","doorOpen","dpad","droplet","easel","eggFried","egg","emojiHeartEyes",
    "emojiLaughing","emojiSmileUpsideDown","emojiSmile","emojiSunglasses","emojiWink",
    "envelope","eyeglasses","flag","flower1","flower2","flower3","gem","gift","globe","globe2",
    "handThumbsUp","handbag","hdd","heart","hourglassSplit","hourglass","houseDoor","house",
    "inbox","inboxes","key","keyboard","ladder","lamp","laptop","lightbulb","lightningCharge",
    "lightning","lock","magic","mailbox","map","megaphone","minecartLoaded","minecart",
    "moonStars","moon","mortarboard","mouse","mouse2","newspaper","paintBucket","palette",
    "palette2","paperclip","pen","pencil","phone","piggyBank","pinAngle","plug","printer",
    "projector","puzzle","router","scissors","sdCard","search","send","shopWindow","shop",
    "signpost2","signpostSplit","signpost","smartwatch","snow","snow2","snow3","speaker",
    "star","stoplights","stopwatch","sun","tablet","thermometer","ticketPerforated","tornado",
    "trash","trash2","tree","trophy","truckFlatbed","truck","tsunami","umbrella","wallet",
    "wallet2","watch","webcam",
].map(v => e(v, v));

// ════════════════════════════════════════════
// All 30 DiceBear v9.x Styles
// ════════════════════════════════════════════
export const DICEBEAR_STYLES: DiceBearStyle[] = [

    // ─── FREE (0 XP) ───────────────────────────────────────────

    {
        id: "fun-emoji",
        nameKo: "펀 이모지",
        description: "귀엽고 표정이 풍부한 이모지 스타일",
        xpCost: 0,
        emoji: "😊",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            {
                key: "eyes", label: "눈", type: "avatar",
                values: [
                    e("closed","감은 눈"), e("closed2","감은 눈2"), e("crying","울음"),
                    e("cute","귀여움"), e("glasses","안경"), e("love","하트"),
                    e("pissed","화남"), e("plain","기본"), e("sad","슬픔"),
                    e("shades","선글라스"), e("sleepClose","졸림"), e("stars","별"),
                    e("tearDrop","눈물"), e("wink","윙크"), e("wink2","윙크2"),
                ],
            },
            {
                key: "mouth", label: "입", type: "avatar",
                values: [
                    e("cute","귀여움"), e("drip","침흘림"), e("faceMask","마스크"),
                    e("kissHeart","키스"), e("lilSmile","미소"), e("pissed","화남"),
                    e("plain","기본"), e("sad","슬픔"), e("shout","소리침"),
                    e("shy","수줍음"), e("sick","아픔"), e("smileLol","크게 웃음"),
                    e("smileTeeth","이 드러냄"), e("tongueOut","혀 내밀기"), e("wideSmile","활짝"),
                ],
            },
            BG_OPT,
        ],
    },

    {
        id: "bottts-neutral",
        nameKo: "로봇",
        description: "귀여운 로봇 아바타 스타일",
        xpCost: 0,
        emoji: "🤖",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            {
                key: "eyes", label: "눈", type: "avatar",
                values: [
                    e("bulging","툭 튀어나온"), e("dizzy","빙글빙글"), e("eva","에바"),
                    e("frame1","프레임1"), e("frame2","프레임2"), e("glow","빛나는"),
                    e("happy","행복"), e("hearts","하트"), e("robocop","로보캅"),
                    e("round","동그란"), e("roundFrame01","라운드1"), e("roundFrame02","라운드2"),
                    e("sensor","센서"), e("shade01","셰이드"),
                ],
            },
            {
                key: "mouth", label: "입", type: "avatar",
                values: [
                    e("bite","물기"), e("diagram","다이어그램"), e("grill01","그릴1"),
                    e("grill02","그릴2"), e("grill03","그릴3"), e("smile01","미소1"),
                    e("smile02","미소2"), e("square01","사각1"), e("square02","사각2"),
                ],
            },
            BG_OPT,
        ],
    },

    {
        id: "identicon",
        nameKo: "이덴티콘",
        description: "Git 스타일 추상 격자 패턴 아바타",
        xpCost: 0,
        emoji: "🔲",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            { key: "rowColor", label: "색상", type: "color", values: IDENTICON_COLORS },
            { key: "row1", label: "1행 패턴", type: "avatar", values: IDENTICON_ROW },
            { key: "row2", label: "2행 패턴", type: "avatar", values: IDENTICON_ROW },
            { key: "row3", label: "3행 패턴", type: "avatar", values: IDENTICON_ROW },
            BG_OPT,
        ],
    },

    {
        id: "initials",
        nameKo: "이니셜",
        description: "이름 이니셜로 만드는 심플 아바타",
        xpCost: 0,
        emoji: "🔤",
        defaultOptions: { backgroundColor: "4361ee" },
        options: [
            {
                key: "textColor", label: "글자색", type: "color",
                values: [c("ffffff","화이트"), c("000000","블랙"), c("f7f6f3","아이보리"),
                         c("ff6b35","오렌지"), c("ffc233","골드"), c("06d6a0","민트"),
                         c("4361ee","인디고"), c("c0392b","레드")],
            },
            {
                key: "fontFamily", label: "폰트", type: "avatar",
                values: [
                    e("Arial","Arial"), e("Verdana","Verdana"), e("Helvetica","Helvetica"),
                    e("Georgia","Georgia"), e("Courier New","Courier"), e("serif","Serif"),
                    e("sans-serif","Sans-serif"),
                ],
            },
            {
                key: "fontWeight", label: "폰트 굵기", type: "avatar",
                values: [e("400","기본"), e("700","굵게"), e("900","매우 굵게"),
                         e("300","얇게"), e("100","매우 얇게")],
            },
            BG_OPT,
        ],
    },

    // ─── 200 XP (Abstract/Geometric) ───────────────────────────

    {
        id: "rings",
        nameKo: "링",
        description: "컬러풀한 원형 링으로 만드는 기하학 아바타",
        xpCost: 200,
        emoji: "💍",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            { key: "ringColor", label: "링 색상", type: "color", values: RING_COLORS },
            {
                key: "ringOne", label: "링1 크기", type: "avatar",
                values: [e("eighth","1/8"), e("quarter","1/4"), e("half","1/2"), e("full","전체")],
            },
            {
                key: "ringTwo", label: "링2 크기", type: "avatar",
                values: [e("eighth","1/8"), e("quarter","1/4"), e("half","1/2"), e("full","전체")],
            },
            {
                key: "ringThree", label: "링3 크기", type: "avatar",
                values: [e("eighth","1/8"), e("quarter","1/4"), e("half","1/2"), e("full","전체")],
            },
            BG_OPT,
        ],
    },

    {
        id: "shapes",
        nameKo: "셰이프",
        description: "도형을 조합해 만드는 추상 아바타",
        xpCost: 200,
        emoji: "🔷",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            {
                key: "shape1", label: "도형1 모양", type: "avatar",
                values: [
                    e("rectangle","직사각형"), e("rectangleFilled","직사각형(채움)"),
                    e("ellipse","타원"), e("ellipseFilled","타원(채움)"),
                    e("polygon","다각형"), e("polygonFilled","다각형(채움)"), e("line","선"),
                ],
            },
            {
                key: "shape1Color", label: "도형1 색상", type: "color",
                values: [
                    c("ff6b35","오렌지"), c("4361ee","인디고"), c("06d6a0","민트"),
                    c("ffc233","골드"), c("e63946","레드"), c("a8dadc","스카이"),
                    c("c77dff","퍼플"), c("000000","블랙"), c("ffffff","화이트"),
                ],
            },
            {
                key: "shape2", label: "도형2 모양", type: "avatar",
                values: [
                    e("rectangle","직사각형"), e("rectangleFilled","직사각형(채움)"),
                    e("ellipse","타원"), e("ellipseFilled","타원(채움)"),
                    e("polygon","다각형"), e("polygonFilled","다각형(채움)"), e("line","선"),
                ],
            },
            {
                key: "shape2Color", label: "도형2 색상", type: "color",
                values: [
                    c("ff6b35","오렌지"), c("4361ee","인디고"), c("06d6a0","민트"),
                    c("ffc233","골드"), c("e63946","레드"), c("a8dadc","스카이"),
                    c("c77dff","퍼플"), c("000000","블랙"), c("ffffff","화이트"),
                ],
            },
            BG_OPT,
        ],
    },

    {
        id: "icons",
        nameKo: "아이콘",
        description: "부트스트랩 아이콘 100종+ 중 원하는 아이콘 선택",
        xpCost: 200,
        emoji: "🎯",
        defaultOptions: { backgroundColor: "4361ee" },
        options: [
            { key: "icon", label: "아이콘", type: "avatar", values: ICONS_LIST },
            BG_OPT,
        ],
    },

    // ─── 300 XP (Neutral / Simplified variants) ─────────────────

    {
        id: "croodles-neutral",
        nameKo: "낙서 (단색)",
        description: "낙서 스타일의 심플 흑백 아바타",
        xpCost: 300,
        emoji: "✏️",
        defaultOptions: { backgroundColor: "ffeaa7" },
        options: [BG_OPT],
    },

    {
        id: "pixel-art-neutral",
        nameKo: "픽셀 (심플)",
        description: "8비트 픽셀 감성의 얼굴 아바타",
        xpCost: 300,
        emoji: "👾",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            {
                key: "eyes", label: "눈", type: "avatar",
                values: [
                    e("open","기본"), e("sleep","졸림"), e("wink","윙크"),
                    e("glasses","안경"), e("happy","행복"), e("sunglasses","선글라스"),
                ],
            },
            {
                key: "mouth", label: "입", type: "avatar",
                values: [
                    e("smile","미소"), e("frown","찡그림"), e("surprise","놀람"),
                    e("pacifier","공갈 젖꼭지"), e("bigSmile","활짝"), e("smirk","비웃음"),
                    e("lips","립스"),
                ],
            },
            {
                key: "nose", label: "코", type: "avatar",
                values: [e("mediumRound","중간"), e("smallRound","작은"), e("wrinkles","주름")],
            },
            BG_OPT,
        ],
    },

    {
        id: "avataaars-neutral",
        nameKo: "아바타아즈 (심플)",
        description: "아바타아즈 얼굴 부분만 (헤어 없는 심플 버전)",
        xpCost: 300,
        emoji: "😶",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            {
                key: "eyebrows", label: "눈썹", type: "avatar",
                values: [
                    e("angryNatural","화남(자연)"), e("defaultNatural","기본(자연)"),
                    e("flatNatural","평평(자연)"), e("frownNatural","찡그림(자연)"),
                    e("raisedExcitedNatural","들린(자연)"), e("sadConcernedNatural","슬픔(자연)"),
                    e("unibrowNatural","일자"), e("upDownNatural","업다운(자연)"),
                    e("angry","화남"), e("default","기본"), e("raisedExcited","들린"),
                    e("sadConcerned","슬픔"), e("upDown","업다운"),
                ],
            },
            {
                key: "eyes", label: "눈", type: "avatar",
                values: [
                    e("closed","감은 눈"), e("cry","눈물"), e("default","기본"),
                    e("eyeRoll","눈 굴리기"), e("happy","행복"), e("hearts","하트"),
                    e("side","곁눈질"), e("squint","실눈"), e("surprised","놀람"),
                    e("wink","윙크"), e("winkWacky","개그 윙크"), e("xDizzy","X눈"),
                ],
            },
            {
                key: "mouth", label: "입", type: "avatar",
                values: [
                    e("concerned","걱정"), e("default","기본"), e("disbelief","불신"),
                    e("eating","먹는 중"), e("grimace","이 드러내기"), e("sad","슬픔"),
                    e("screamOpen","소리침"), e("serious","진지"), e("smile","미소"),
                    e("tongue","혀 내밀기"), e("twinkle","반짝 미소"), e("vomit","헤롱"),
                ],
            },
            BG_OPT,
        ],
    },

    {
        id: "adventurer-neutral",
        nameKo: "어드벤처러 (심플)",
        description: "어드벤처러 얼굴 부분 (배경 없는 심플 버전)",
        xpCost: 300,
        emoji: "⚔️",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            { key: "eyebrows", label: "눈썹", type: "avatar", values: variants(15, "눈썹") },
            { key: "eyes", label: "눈", type: "avatar", values: variants(26, "눈") },
            {
                key: "glasses", label: "안경", type: "avatar", hasProbability: true,
                values: variants(5, "안경"),
            },
            { key: "mouth", label: "입", type: "avatar", values: variants(30, "입") },
            BG_OPT,
        ],
    },

    {
        id: "big-ears-neutral",
        nameKo: "빅 이어스 (심플)",
        description: "큰 귀 캐릭터 얼굴만 (심플 버전)",
        xpCost: 300,
        emoji: "👂",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            { key: "cheek", label: "볼", type: "avatar", hasProbability: true, values: variants(6, "볼") },
            { key: "eyes", label: "눈", type: "avatar", values: variants(32, "눈") },
            { key: "mouth", label: "입", type: "avatar", values: bigEarsMouth() },
            { key: "nose", label: "코", type: "avatar", values: variants(12, "코") },
            BG_OPT,
        ],
    },

    {
        id: "lorelei-neutral",
        nameKo: "로렐레이 (심플)",
        description: "로렐레이 얼굴 부분만 (헤어 없는 심플 버전)",
        xpCost: 300,
        emoji: "🌸",
        defaultOptions: { backgroundColor: "ffd5dc" },
        options: [
            { key: "eyebrows", label: "눈썹", type: "avatar", values: variants(13, "눈썹") },
            { key: "eyebrowsColor", label: "눈썹 색상", type: "color", values: HAIR_LORELEI },
            { key: "eyes", label: "눈", type: "avatar", values: variants(24, "눈") },
            { key: "eyesColor", label: "눈 색상", type: "color", values: [c("000000","블랙"),c("3c2415","다크 브라운"),c("4361ee","블루"),c("06d6a0","그린"),c("6c5ce7","퍼플")] },
            { key: "glasses", label: "안경", type: "avatar", hasProbability: true, values: variants(5, "안경") },
            { key: "glassesColor", label: "안경 색상", type: "color", values: [c("000000","블랙"),c("c68642","골드"),c("4361ee","블루"),c("c0392b","레드"),c("silver","실버")] },
            { key: "mouth", label: "입", type: "avatar", values: happySad(18, 9) },
            { key: "nose", label: "코", type: "avatar", values: variants(6, "코") },
            BG_OPT,
        ],
    },

    {
        id: "notionists-neutral",
        nameKo: "노셔니스트 (심플)",
        description: "노션 스타일 미니멀 얼굴 (심플 버전)",
        xpCost: 300,
        emoji: "📝",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            { key: "brows", label: "눈썹", type: "avatar", values: variants(13, "눈썹") },
            { key: "eyes", label: "눈", type: "avatar", values: variants(5, "눈") },
            { key: "glasses", label: "안경", type: "avatar", hasProbability: true, values: variants(11, "안경") },
            { key: "lips", label: "입", type: "avatar", values: variants(30, "입") },
            { key: "nose", label: "코", type: "avatar", values: variants(20, "코") },
            BG_OPT,
        ],
    },

    // ─── 500 XP (Character styles) ──────────────────────────────

    {
        id: "thumbs",
        nameKo: "썸즈",
        description: "엄지손가락 캐릭터 귀여운 아바타",
        xpCost: 500,
        emoji: "👍",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            { key: "eyes", label: "눈", type: "avatar", values: variants(16, "눈") },
            { key: "face", label: "얼굴형", type: "avatar", values: variants(8, "얼굴") },
            { key: "mouth", label: "입", type: "avatar", values: variants(18, "입") },
            { key: "mustache", label: "콧수염", type: "avatar", hasProbability: true, values: variants(4, "콧수염") },
            { key: "nose", label: "코", type: "avatar", values: variants(9, "코") },
            { key: "top", label: "헤어/모자", type: "avatar", values: variants(29, "헤어") },
            { key: "topColor", label: "헤어 색상", type: "color", values: THUMBS_TOP_COLORS },
            BG_OPT,
        ],
    },

    {
        id: "bottts",
        nameKo: "보츠 (풀)",
        description: "액세서리를 완전히 꾸밀 수 있는 풀 로봇 아바타",
        xpCost: 500,
        emoji: "🦾",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            { key: "baseColor", label: "몸 색상", type: "color", values: BOTTTS_BASE },
            {
                key: "face", label: "얼굴형", type: "avatar",
                values: [
                    e("round01","라운드1"), e("round02","라운드2"),
                    e("square01","사각1"), e("square02","사각2"),
                    e("square03","사각3"), e("square04","사각4"),
                ],
            },
            {
                key: "eyes", label: "눈", type: "avatar",
                values: [
                    e("bulging","툭 튀어나온"), e("dizzy","빙글빙글"), e("eva","에바"),
                    e("frame1","프레임1"), e("frame2","프레임2"), e("glow","빛나는"),
                    e("happy","행복"), e("hearts","하트"), e("robocop","로보캅"),
                    e("round","동그란"), e("roundFrame01","라운드1"), e("roundFrame02","라운드2"),
                    e("sensor","센서"), e("shade01","셰이드"),
                ],
            },
            {
                key: "mouth", label: "입", type: "avatar", hasProbability: true,
                values: [
                    e("bite","물기"), e("diagram","다이어그램"), e("grill01","그릴1"),
                    e("grill02","그릴2"), e("grill03","그릴3"), e("smile01","미소1"),
                    e("smile02","미소2"), e("square01","사각1"), e("square02","사각2"),
                ],
            },
            {
                key: "top", label: "탑 장식", type: "avatar", hasProbability: true,
                values: [
                    e("antenna","안테나"), e("antennaCrooked","구부러진 안테나"),
                    e("bulb01","전구"), e("glowingBulb01","빛나는 전구1"),
                    e("glowingBulb02","빛나는 전구2"), e("horns","뿔"),
                    e("lights","조명"), e("pyramid","피라미드"), e("radar","레이더"),
                ],
            },
            {
                key: "texture", label: "텍스처", type: "avatar", hasProbability: true,
                values: [
                    e("camo01","카모1"), e("camo02","카모2"), e("circuits","회로"),
                    e("dirty01","더티1"), e("dirty02","더티2"), e("dots","점"),
                    e("grunge01","그런지1"), e("grunge02","그런지2"),
                ],
            },
            BG_OPT,
        ],
    },

    {
        id: "croodles",
        nameKo: "낙서 (컬러)",
        description: "헤어와 피부색이 있는 낙서 스타일 아바타",
        xpCost: 500,
        emoji: "✏️",
        defaultOptions: { backgroundColor: "ffeaa7", skinColor: "ffcb7e" },
        options: [
            {
                key: "hair", label: "헤어", type: "avatar",
                values: [
                    e("plain","민머리"), e("wavy","웨이브"), e("shortCurls","짧은 곱슬"),
                    e("parting","가르마"), e("spiky","스파이크"), e("roundBob","둥근 보브"),
                    e("longCurls","긴 곱슬"), e("buns","번 머리"), e("bangs","앞머리"),
                    e("fluffy","폭신폭신"), e("flatTop","플랫탑"), e("shaggy","덥수룩"),
                ],
            },
            { key: "hairColor", label: "헤어 색상", type: "color", values: HAIR_CROODLES },
            {
                key: "mood", label: "표정", type: "avatar",
                values: [
                    e("happy","행복"), e("angry","화남"), e("neutral","무표정"),
                    e("superHappy","매우 행복"), e("sad","슬픔"),
                    e("hopeful","희망"), e("confused","당황"),
                ],
            },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_CROODLES },
            BG_OPT,
        ],
    },

    {
        id: "miniavs",
        nameKo: "미니아브스",
        description: "미니멀한 귀여운 픽셀 캐릭터 아바타",
        xpCost: 500,
        emoji: "🎮",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            {
                key: "hair", label: "헤어", type: "avatar",
                values: [
                    e("balndess","민머리"), e("slaughter","슬로터"), e("ponyTail","포니테일"),
                    e("long","롱"), e("curly","곱슬"), e("stylish","스타일리시"),
                    e("elvis","엘비스"), e("classic02","클래식2"), e("classic01","클래식1"),
                ],
            },
            { key: "hairColor", label: "헤어 색상", type: "color", values: [c("000000","블랙"),c("4a312c","브라운"),c("e9b729","블론드"),c("c0392b","레드"),c("c0c0c0","실버"),c("ff6b9d","핑크"),c("6c5ce7","퍼플")] },
            {
                key: "head", label: "얼굴형", type: "avatar",
                values: [e("normal","기본"), e("wide","넓은"), e("thin","좁은")],
            },
            {
                key: "eyes", label: "눈", type: "avatar",
                values: [e("normal","기본"), e("confident","자신감"), e("happy","행복")],
            },
            {
                key: "mouth", label: "입", type: "avatar",
                values: [e("default","기본"), e("missingTooth","빠진 이")],
            },
            {
                key: "body", label: "옷", type: "avatar",
                values: [e("tShirt","티셔츠"), e("golf","골프 셔츠")],
            },
            { key: "bodyColor", label: "옷 색상", type: "color", values: [c("ffc700","옐로우"),c("9747ff","퍼플"),c("f24e1e","레드"),c("699bf7","블루"),c("0fa958","그린"),c("000000","블랙"),c("ffffff","화이트")] },
            {
                key: "mustache", label: "콧수염", type: "avatar", hasProbability: true,
                values: [
                    e("pencilThinBeard","가는 수염"), e("pencilThin","매우 가는"),
                    e("horshoe","말굽"), e("freddy","프레디"),
                ],
            },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_PERSONAS },
            BG_OPT,
        ],
    },

    {
        id: "big-smile",
        nameKo: "빅 스마일",
        description: "활짝 웃는 밝은 캐릭터 스타일",
        xpCost: 500,
        emoji: "😁",
        defaultOptions: { backgroundColor: "ffd5dc" },
        options: [
            {
                key: "hair", label: "헤어", type: "avatar",
                values: [
                    e("shortHair","단발"), e("mohawk","모히칸"), e("wavyBob","웨이브 보브"),
                    e("bowlCutHair","볼컷"), e("curlyBob","곱슬 보브"), e("straightHair","생머리"),
                    e("braids","땋은 머리"), e("shavedHead","삭발"), e("bunHair","번 머리"),
                    e("froBun","아프로 번"), e("bangs","앞머리"),
                    e("halfShavedHead","반삭"), e("curlyShortHair","곱슬 단발"),
                ],
            },
            { key: "hairColor", label: "헤어 색상", type: "color", values: HAIR_BIGSMILE },
            {
                key: "eyes", label: "눈", type: "avatar",
                values: [
                    e("cheery","밝음"), e("normal","기본"), e("confused","당황"),
                    e("starstruck","별눈"), e("winking","윙크"), e("sleepy","졸림"),
                    e("sad","슬픔"), e("angry","화남"),
                ],
            },
            {
                key: "mouth", label: "입", type: "avatar",
                values: [
                    e("openedSmile","활짝 미소"), e("unimpressed","무감동"), e("gapSmile","틈새 미소"),
                    e("openSad","슬픈 입"), e("teethSmile","이 드러내기"),
                    e("awkwardSmile","어색한 미소"), e("braces","교정기"), e("kawaii","카와이"),
                ],
            },
            {
                key: "accessories", label: "액세서리", type: "avatar", hasProbability: true,
                values: [
                    e("catEars","고양이 귀"), e("glasses","안경"), e("sailormoonCrown","왕관"),
                    e("clownNose","광대 코"), e("sleepMask","수면 마스크"),
                    e("sunglasses","선글라스"), e("faceMask","마스크"), e("mustache","콧수염"),
                ],
            },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_BIGSMILE },
            BG_OPT,
        ],
    },

    {
        id: "micah",
        nameKo: "미카",
        description: "깔끔한 평면 일러스트 스타일",
        xpCost: 500,
        emoji: "🎨",
        defaultOptions: { backgroundColor: "b6e3f4", baseColor: "f9c9b6" },
        options: [
            {
                key: "hair", label: "헤어", type: "avatar", hasProbability: true,
                values: [
                    e("fonze","폰즈"), e("mrT","Mr.T"), e("dougFunny","더그 파니"),
                    e("mrClean","Mr.클린"), e("dannyPhantom","대니 팬텀"),
                    e("full","풀"), e("turban","터번"), e("pixie","픽시"),
                ],
            },
            { key: "hairColor", label: "헤어 색상", type: "color", values: HAIR_MICAH },
            {
                key: "eyebrows", label: "눈썹", type: "avatar",
                values: [
                    e("up","올라간"), e("down","내려간"),
                    e("eyelashesUp","속눈썹 업"), e("eyelashesDown","속눈썹 다운"),
                ],
            },
            {
                key: "eyes", label: "눈", type: "avatar",
                values: [
                    e("eyes","기본"), e("round","동그란"), e("eyesShadow","쉐도우"),
                    e("smiling","웃는"), e("smilingShadow","웃는 쉐도우"),
                ],
            },
            {
                key: "mouth", label: "입", type: "avatar",
                values: [
                    e("surprised","놀람"), e("laughing","웃음"), e("nervous","긴장"),
                    e("smile","미소"), e("sad","슬픔"), e("pucker","뾰족"),
                    e("frown","찡그림"), e("smirk","비웃음"),
                ],
            },
            {
                key: "nose", label: "코", type: "avatar",
                values: [e("curve","곡선"), e("pointed","뾰족"), e("tound","둥근")],
            },
            {
                key: "ears", label: "귀 형태", type: "avatar",
                values: [e("attached","붙은 귀"), e("detached","떨어진 귀")],
            },
            {
                key: "shirt", label: "상의", type: "avatar",
                values: [e("open","오픈 셔츠"), e("crew","크루넥"), e("collared","카라")],
            },
            { key: "shirtColor", label: "상의 색상", type: "color", values: SHIRT_MICAH },
            {
                key: "facialHair", label: "수염", type: "avatar", hasProbability: true,
                values: [e("beard","수염"), e("scruff","짧은 수염")],
            },
            {
                key: "glasses", label: "안경", type: "avatar", hasProbability: true,
                values: [e("round","둥근 안경"), e("square","사각 안경")],
            },
            {
                key: "earrings", label: "귀걸이", type: "avatar", hasProbability: true,
                values: [e("hoop","후프"), e("stud","스터드")],
            },
            { key: "baseColor", label: "피부톤", type: "color", values: SKIN_MICAH },
            BG_OPT,
        ],
    },

    {
        id: "pixel-art",
        nameKo: "픽셀 아트",
        description: "레트로 픽셀 감성의 8비트 풀 캐릭터",
        xpCost: 500,
        emoji: "👾",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            {
                key: "hair", label: "헤어", type: "avatar",
                values: [
                    e("long","롱"), e("sideShave","사이드 쉐이브"), e("shortCombover","숏 콤보버"),
                    e("curlyHighTop","곱슬 하이탑"), e("bobCut","보브 컷"), e("curly","곱슬"),
                    e("pigtails","양갈래"), e("curlyBun","곱슬 번"), e("buzzcut","버즈컷"),
                    e("bobBangs","보브 앞머리"), e("bald","민머리"), e("balding","탈모"),
                    e("cap","모자"), e("bunUndercut","번 언더컷"), e("fade","페이드"),
                    e("beanie","비니"), e("straightBun","스트레이트 번"), e("extraLong","매우 긴"),
                    e("shortComboverChops","숏 콤보버2"), e("mohawk","모히칸"),
                ],
            },
            { key: "hairColor", label: "헤어 색상", type: "color", values: HAIR_PIXEL },
            {
                key: "eyes", label: "눈", type: "avatar",
                values: [
                    e("open","기본"), e("sleep","졸림"), e("wink","윙크"),
                    e("glasses","안경"), e("happy","행복"), e("sunglasses","선글라스"),
                ],
            },
            {
                key: "mouth", label: "입", type: "avatar",
                values: [
                    e("smile","미소"), e("frown","찡그림"), e("surprise","놀람"),
                    e("pacifier","공갈 젖꼭지"), e("bigSmile","활짝"), e("smirk","비웃음"),
                    e("lips","립스"),
                ],
            },
            {
                key: "nose", label: "코", type: "avatar",
                values: [e("mediumRound","중간"), e("smallRound","작은"), e("wrinkles","주름")],
            },
            {
                key: "body", label: "체형", type: "avatar",
                values: [e("squared","사각"), e("rounded","라운드"), e("small","스몰"), e("checkered","체크")],
            },
            { key: "clothingColor", label: "옷 색상", type: "color", values: CLOTHES_PIXEL },
            {
                key: "facialHair", label: "수염", type: "avatar", hasProbability: true,
                values: [
                    e("beardMustache","수염+콧수염"), e("pyramid","피라미드"),
                    e("walrus","왈러스"), e("goatee","턱수염"),
                    e("shadow","쉐도우"), e("soulPatch","소울패치"),
                ],
            },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_PIXEL },
            BG_OPT,
        ],
    },

    // ─── 700 XP (Detailed character styles) ─────────────────────

    {
        id: "big-ears",
        nameKo: "빅 이어스",
        description: "귀여운 큰 귀의 풀 캐릭터 일러스트",
        xpCost: 700,
        emoji: "👂",
        defaultOptions: { backgroundColor: "b6e3f4", skinColor: "f8b788" },
        options: [
            { key: "hair", label: "헤어", type: "avatar", values: [...numbered("long", 20, "롱"), ...numbered("short", 20, "숏")] },
            { key: "hairColor", label: "헤어 색상", type: "color", values: HAIR_BIGEARS },
            { key: "frontHair", label: "앞머리", type: "avatar", hasProbability: true, values: variants(12, "앞머리") },
            { key: "sideburn", label: "구레나룻", type: "avatar", hasProbability: true, values: variants(7, "구레나룻") },
            { key: "ear", label: "귀", type: "avatar", values: variants(8, "귀") },
            { key: "face", label: "얼굴형", type: "avatar", values: variants(10, "얼굴형") },
            { key: "eyes", label: "눈", type: "avatar", values: variants(32, "눈") },
            { key: "mouth", label: "입", type: "avatar", values: bigEarsMouth() },
            { key: "nose", label: "코", type: "avatar", values: variants(12, "코") },
            { key: "cheek", label: "볼", type: "avatar", hasProbability: true, values: variants(6, "볼터치") },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_BIGEARS },
            BG_OPT,
        ],
    },

    {
        id: "lorelei",
        nameKo: "로렐레이",
        description: "부드러운 일러스트 스타일 풀 캐릭터",
        xpCost: 700,
        emoji: "🌸",
        defaultOptions: { backgroundColor: "ffd5dc", skinColor: "fde8d8" },
        options: [
            { key: "hair", label: "헤어", type: "avatar", values: variants(48, "헤어") },
            { key: "hairColor", label: "헤어 색상", type: "color", values: HAIR_LORELEI },
            { key: "head", label: "얼굴형", type: "avatar", values: variants(4, "얼굴형") },
            { key: "eyebrows", label: "눈썹", type: "avatar", values: variants(13, "눈썹") },
            { key: "eyebrowsColor", label: "눈썹 색상", type: "color", values: HAIR_LORELEI },
            { key: "eyes", label: "눈", type: "avatar", values: variants(24, "눈") },
            { key: "eyesColor", label: "눈 색상", type: "color", values: [c("000000","블랙"),c("3c2415","브라운"),c("4361ee","블루"),c("06d6a0","그린"),c("6c5ce7","퍼플"),c("c0392b","레드")] },
            { key: "mouth", label: "입", type: "avatar", values: happySad(18, 9) },
            { key: "mouthColor", label: "입술 색상", type: "color", values: [c("000000","블랙"),c("c0392b","레드"),c("e91e8c","핑크"),c("ff6b9d","연핑크")] },
            { key: "nose", label: "코", type: "avatar", values: variants(6, "코") },
            { key: "glasses", label: "안경", type: "avatar", hasProbability: true, values: variants(5, "안경") },
            { key: "glassesColor", label: "안경 색상", type: "color", values: [c("000000","블랙"),c("c68642","골드"),c("4361ee","블루"),c("c0392b","레드")] },
            { key: "earrings", label: "귀걸이", type: "avatar", hasProbability: true, values: variants(3, "귀걸이") },
            { key: "earringsColor", label: "귀걸이 색상", type: "color", values: [c("c68642","골드"),c("c0c0c0","실버"),c("ff6b9d","핑크"),c("4361ee","블루")] },
            { key: "beard", label: "수염", type: "avatar", hasProbability: true, values: variants(2, "수염") },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_LORELEI },
            BG_OPT,
        ],
    },

    {
        id: "notionists",
        nameKo: "노셔니스트",
        description: "노션 스타일 풀 캐릭터 (제스처 포함)",
        xpCost: 700,
        emoji: "🎭",
        defaultOptions: { backgroundColor: "b6e3f4", gestureProbability: "0" },
        options: [
            { key: "hair", label: "헤어/모자", type: "avatar", values: [...variants(63, "헤어"), e("hat","모자")] },
            { key: "brows", label: "눈썹", type: "avatar", values: variants(13, "눈썹") },
            { key: "eyes", label: "눈", type: "avatar", values: variants(5, "눈") },
            { key: "lips", label: "입", type: "avatar", values: variants(30, "입") },
            { key: "nose", label: "코", type: "avatar", values: variants(20, "코") },
            { key: "beard", label: "수염", type: "avatar", hasProbability: true, values: variants(12, "수염") },
            { key: "glasses", label: "안경", type: "avatar", hasProbability: true, values: variants(11, "안경") },
            { key: "body", label: "상체", type: "avatar", values: variants(25, "상체") },
            {
                key: "gesture", label: "제스처", type: "avatar", hasProbability: true,
                values: [
                    e("wavePointLongArms","손흔들기+가리킴"), e("waveOkLongArms","OK+손흔들기"),
                    e("waveLongArms","손흔들기"), e("waveLongArm","한손 흔들기"),
                    e("pointLongArm","한손 가리킴"), e("okLongArm","OK 한손"),
                    e("point","가리킴"), e("ok","OK"), e("hand","손"), e("handPhone","전화"),
                ],
            },
            BG_OPT,
        ],
    },

    {
        id: "dylan",
        nameKo: "딜런",
        description: "노션과 유사한 일러스트 풀 캐릭터 (다른 화풍)",
        xpCost: 700,
        emoji: "🧑‍🎨",
        defaultOptions: { backgroundColor: "b6e3f4", gestureProbability: "0" },
        options: [
            { key: "hair", label: "헤어/모자", type: "avatar", values: [...variants(63, "헤어"), e("hat","모자")] },
            { key: "brows", label: "눈썹", type: "avatar", values: variants(13, "눈썹") },
            { key: "eyes", label: "눈", type: "avatar", values: variants(5, "눈") },
            { key: "lips", label: "입", type: "avatar", values: variants(30, "입") },
            { key: "nose", label: "코", type: "avatar", values: variants(20, "코") },
            { key: "beard", label: "수염", type: "avatar", hasProbability: true, values: variants(12, "수염") },
            { key: "glasses", label: "안경", type: "avatar", hasProbability: true, values: variants(11, "안경") },
            { key: "body", label: "상체", type: "avatar", values: variants(25, "상체") },
            {
                key: "gesture", label: "제스처", type: "avatar", hasProbability: true,
                values: [
                    e("wavePointLongArms","손흔들기+가리킴"), e("waveOkLongArms","OK+손흔들기"),
                    e("waveLongArms","손흔들기"), e("waveLongArm","한손 흔들기"),
                    e("pointLongArm","한손 가리킴"), e("okLongArm","OK 한손"),
                    e("point","가리킴"), e("ok","OK"), e("hand","손"), e("handPhone","전화"),
                ],
            },
            BG_OPT,
        ],
    },

    // ─── 900 XP (Most detailed) ──────────────────────────────────

    {
        id: "adventurer",
        nameKo: "어드벤처러",
        description: "모험심 넘치는 풀 일러스트 캐릭터",
        xpCost: 900,
        emoji: "⚔️",
        defaultOptions: { backgroundColor: "b6e3f4", skinColor: "f2d3b1" },
        options: [
            { key: "hair", label: "헤어", type: "avatar", values: [...numbered("short", 19, "숏"), ...numbered("long", 26, "롱")] },
            { key: "hairColor", label: "헤어 색상", type: "color", values: HAIR_ADV },
            { key: "eyebrows", label: "눈썹", type: "avatar", values: variants(15, "눈썹") },
            { key: "eyes", label: "눈", type: "avatar", values: variants(26, "눈") },
            { key: "mouth", label: "입", type: "avatar", values: variants(30, "입") },
            { key: "glasses", label: "안경", type: "avatar", hasProbability: true, values: variants(5, "안경") },
            {
                key: "features", label: "특징", type: "avatar", hasProbability: true,
                values: [e("mustache","콧수염"), e("blush","볼 터치"), e("birthmark","점"), e("freckles","주근깨")],
            },
            { key: "earrings", label: "귀걸이", type: "avatar", hasProbability: true, values: variants(6, "귀걸이") },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_ADV },
            BG_OPT,
        ],
    },

    {
        id: "avataaars",
        nameKo: "아바타아즈",
        description: "가장 다양한 커스터마이징의 SNS 인기 아바타",
        xpCost: 900,
        emoji: "🧑",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            {
                key: "top", label: "헤어/모자", type: "avatar", hasProbability: true,
                values: [
                    e("shortFlat","단발"), e("longButNotTooLong","긴 머리"), e("curly","곱슬"),
                    e("bun","번 머리"), e("dreads01","드레드1"), e("dreads02","드레드2"),
                    e("fro","아프로"), e("froBand","아프로 밴드"), e("shortCurly","숏 곱슬"),
                    e("shortRound","숏 라운드"), e("shortWaved","숏 웨이브"),
                    e("sides","사이드"), e("theCaesar","시저 컷"),
                    e("theCaesarAndSidePart","시저+사이드"), e("bigHair","빅 헤어"),
                    e("bob","보브"), e("curvy","커비"), e("frida","프리다"),
                    e("miaWallace","미아 월리스"), e("shaggy","샤기"),
                    e("shaggyMullet","샤기 멀렛"), e("shavedSides","양쪽 삭발"),
                    e("straight01","스트레이트1"), e("straight02","스트레이트2"),
                    e("straightAndStrand","스트레이트+스트랜드"),
                    e("turban","터번"), e("hijab","히잡"),
                    e("hat","버킷햇"), e("winterHat1","겨울 비니1"),
                    e("winterHat02","겨울 비니2"), e("winterHat03","겨울 비니3"),
                    e("winterHat04","겨울 비니4"),
                ],
            },
            { key: "hairColor", label: "헤어 색상", type: "color", values: HAIR_AV },
            { key: "hatColor", label: "모자 색상", type: "color", values: CLOTHES_AV },
            {
                key: "eyebrows", label: "눈썹", type: "avatar",
                values: [
                    e("angryNatural","화남(자연)"), e("defaultNatural","기본(자연)"),
                    e("flatNatural","평평(자연)"), e("frownNatural","찡그림(자연)"),
                    e("raisedExcitedNatural","들린(자연)"), e("sadConcernedNatural","슬픔(자연)"),
                    e("unibrowNatural","일자"), e("upDownNatural","업다운(자연)"),
                    e("angry","화남"), e("default","기본"), e("raisedExcited","들린"),
                    e("sadConcerned","슬픔"), e("upDown","업다운"),
                ],
            },
            {
                key: "eyes", label: "눈", type: "avatar",
                values: [
                    e("closed","감은 눈"), e("cry","눈물"), e("default","기본"),
                    e("eyeRoll","눈 굴리기"), e("happy","행복"), e("hearts","하트"),
                    e("side","곁눈질"), e("squint","실눈"), e("surprised","놀람"),
                    e("wink","윙크"), e("winkWacky","개그 윙크"), e("xDizzy","X눈"),
                ],
            },
            {
                key: "mouth", label: "입", type: "avatar",
                values: [
                    e("concerned","걱정"), e("default","기본"), e("disbelief","불신"),
                    e("eating","먹는 중"), e("grimace","이 드러내기"), e("sad","슬픔"),
                    e("screamOpen","소리침"), e("serious","진지"), e("smile","미소"),
                    e("tongue","혀 내밀기"), e("twinkle","반짝 미소"), e("vomit","헤롱"),
                ],
            },
            {
                key: "accessories", label: "액세서리", type: "avatar", hasProbability: true,
                values: [
                    e("kurt","커트 안경"), e("prescription01","안경1"), e("prescription02","안경2"),
                    e("round","동그란 안경"), e("sunglasses","선글라스"),
                    e("wayfarers","웨이페러"), e("eyepatch","안대"),
                ],
            },
            { key: "accessoriesColor", label: "안경 색상", type: "color", values: CLOTHES_AV },
            {
                key: "facialHair", label: "수염", type: "avatar", hasProbability: true,
                values: [
                    e("beardLight","가는 수염"), e("beardMajestic","풍성한 수염"),
                    e("beardMedium","중간 수염"), e("moustacheFancy","화려한 콧수염"),
                    e("moustacheMagnum","매그넘 콧수염"),
                ],
            },
            { key: "facialHairColor", label: "수염 색상", type: "color", values: HAIR_AV },
            {
                key: "clothing", label: "의상", type: "avatar",
                values: [
                    e("blazerAndShirt","블레이저+셔츠"), e("blazerAndSweater","블레이저+스웨터"),
                    e("collarAndSweater","카라+스웨터"), e("graphicShirt","그래픽 티"),
                    e("hoodie","후드티"), e("overall","오버롤"),
                    e("shirtCrewNeck","크루넥"), e("shirtScoopNeck","스쿱넥"), e("shirtVNeck","V넥"),
                ],
            },
            { key: "clothesColor", label: "옷 색상", type: "color", values: CLOTHES_AV },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_AV },
            BG_OPT,
        ],
    },

    {
        id: "open-peeps",
        nameKo: "오픈 핍스",
        description: "다양한 포즈와 표정의 오픈소스 캐릭터",
        xpCost: 900,
        emoji: "🧍",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            {
                key: "head", label: "헤어/두상", type: "avatar",
                values: [
                    e("afro","아프로"), e("bangs","앞머리"), e("bangs2","앞머리2"),
                    e("bantuKnots","반투 매듭"), e("bear","곰"), e("bun","번"),
                    e("bun2","번2"), e("buns","번 두개"), e("cornrows","콘로우"),
                    e("cornrows2","콘로우2"), e("dreads1","드레드1"), e("dreads2","드레드2"),
                    e("flatTop","플랫탑"), e("flatTopLong","플랫탑 롱"),
                    e("grayBun","그레이 번"), e("grayMedium","그레이 미디움"),
                    e("grayShort","그레이 숏"), e("hatBeanie","비니"), e("hatHip","힙합 모자"),
                    e("hijab","히잡"), e("long","롱"), e("longAfro","롱 아프로"),
                    e("longBangs","롱 앞머리"), e("longCurly","롱 곱슬"),
                    e("medium1","미디움1"), e("medium2","미디움2"), e("medium3","미디움3"),
                    e("mediumBangs","미디움 앞머리"), e("mediumBangs2","미디움 앞머리2"),
                    e("mediumBangs3","미디움 앞머리3"), e("mediumStraight","미디움 직모"),
                    e("mohawk","모히칸"), e("mohawk2","모히칸2"),
                    e("noHair1","민머리1"), e("noHair2","민머리2"), e("noHair3","민머리3"),
                    e("pomp","퐁파두르"), e("shaved1","삭발1"), e("shaved2","삭발2"),
                    e("shaved3","삭발3"), e("short1","숏1"), e("short2","숏2"),
                    e("short3","숏3"), e("short4","숏4"), e("short5","숏5"),
                    e("turban","터번"), e("twists","트위스트"), e("twists2","트위스트2"),
                ],
            },
            {
                key: "face", label: "표정", type: "avatar",
                values: [
                    e("angryWithFang","화남+이빨"), e("awe","경외"), e("blank","무표정"),
                    e("calm","침착"), e("cheeky","건방짐"), e("concerned","걱정"),
                    e("concernedFear","두려운 걱정"), e("contempt","경멸"), e("cute","귀여움"),
                    e("cyclops","눈 하나"), e("driven","열정"), e("eatingHappy","먹는 행복"),
                    e("explaining","설명"), e("eyesClosed","눈 감음"), e("fear","두려움"),
                    e("hectic","혼란"), e("lovingGrin1","사랑스러운 미소1"),
                    e("lovingGrin2","사랑스러운 미소2"), e("monster","괴물"),
                    e("old","노인"), e("rage","분노"), e("serious","진지"),
                    e("smile","미소"), e("smileBig","큰 미소"), e("smileLOL","LOL"),
                    e("smileTeethGap","앞니 벌어짐"), e("solemn","엄숙"),
                    e("suspicious","의심"), e("tired","피곤"), e("veryAngry","매우 화남"),
                ],
            },
            {
                key: "accessories", label: "액세서리", type: "avatar", hasProbability: true,
                values: [
                    e("eyepatch","안대"), e("glasses","안경"), e("glasses2","안경2"),
                    e("glasses3","안경3"), e("glasses4","안경4"), e("glasses5","안경5"),
                    e("sunglasses","선글라스"), e("sunglasses2","선글라스2"),
                ],
            },
            {
                key: "facialHair", label: "수염", type: "avatar", hasProbability: true,
                values: [
                    e("chin","턱수염"), e("full","풍성한 수염"), e("full2","풍성한2"),
                    e("full3","풍성한3"), e("full4","풍성한4"),
                    e("goatee1","고티1"), e("goatee2","고티2"),
                    e("moustache1","콧수염1"), e("moustache2","콧수염2"),
                    e("moustache3","콧수염3"), e("moustache4","콧수염4"),
                    e("moustache5","콧수염5"), e("moustache6","콧수염6"),
                    e("moustache7","콧수염7"), e("moustache8","콧수염8"), e("moustache9","콧수염9"),
                ],
            },
            {
                key: "mask", label: "마스크", type: "avatar", hasProbability: true,
                values: [e("medicalMask","의료 마스크"), e("respirator","방호 마스크")],
            },
            { key: "clothingColor", label: "옷 색상", type: "color", values: CLOTHES_OPENPEEPS },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_OPENPEEPS },
            BG_OPT,
        ],
    },

    {
        id: "personas",
        nameKo: "페르소나",
        description: "다양한 헤어·옷·액세서리의 고품질 캐릭터",
        xpCost: 900,
        emoji: "🧑‍💼",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            { key: "hair", label: "헤어", type: "avatar", values: [...numbered("short", 24, "숏"), ...numbered("long", 21, "롱")] },
            { key: "hairColor", label: "헤어 색상", type: "color", values: HAIR_PERSONAS },
            { key: "eyes", label: "눈", type: "avatar", values: variants(12, "눈") },
            { key: "eyesColor", label: "눈 색상", type: "color", values: [c("000000","블랙"),c("4361ee","블루"),c("06d6a0","그린"),c("c0392b","레드"),c("6c5ce7","퍼플")] },
            { key: "mouth", label: "입", type: "avatar", values: happySad(13, 10) },
            { key: "mouthColor", label: "입술 색상", type: "color", values: [c("000000","블랙"),c("c0392b","레드"),c("e91e8c","핑크"),c("ff6b9d","연핑크")] },
            { key: "clothing", label: "의상", type: "avatar", values: variants(23, "의상") },
            { key: "clothingColor", label: "옷 색상", type: "color", values: CLOTHES_PERSONAS },
            { key: "beard", label: "수염", type: "avatar", hasProbability: true, values: variants(8, "수염") },
            {
                key: "glasses", label: "안경", type: "avatar", hasProbability: true,
                values: [
                    ...numbered("light", 7, "라이트 안경"),
                    ...numbered("dark", 7, "다크 안경"),
                ],
            },
            { key: "glassesColor", label: "안경 색상", type: "color", values: [c("000000","블랙"),c("c68642","골드"),c("4361ee","블루"),c("c0392b","레드"),c("c0c0c0","실버")] },
            { key: "accessories", label: "액세서리", type: "avatar", hasProbability: true, values: variants(4, "액세서리") },
            { key: "accessoriesColor", label: "액세서리 색상", type: "color", values: CLOTHES_PERSONAS },
            { key: "hat", label: "모자", type: "avatar", hasProbability: true, values: variants(10, "모자") },
            { key: "hatColor", label: "모자 색상", type: "color", values: CLOTHES_PERSONAS },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_PERSONAS },
            BG_OPT,
        ],
    },
];

// ── URL Builder ───────────────────────────────────────────────

/**
 * Build DiceBear API URL.
 * probabilityKeys: option keys that need {key}Probability=100 when a value is selected.
 */
export function buildStyleUrl(
    styleId: string,
    options: Record<string, string>,
    seed: string,
    size = 200,
    probabilityKeys: string[] = []
): string {
    const params = new URLSearchParams({ seed, size: String(size) });
    Object.entries(options).forEach(([k, v]) => { if (v) params.set(k, v); });
    probabilityKeys.forEach(key => {
        if (options[key] && !options[`${key}Probability`]) {
            params.set(`${key}Probability`, "100");
        }
    });
    return `https://api.dicebear.com/9.x/${styleId}/svg?${params}`;
}

/**
 * Build a preview URL for a single option value.
 * hasProbability: if true, also sets {optKey}Probability=100 so the element shows.
 */
export function buildOptionPreviewUrl(
    styleId: string,
    optKey: string,
    optValue: string,
    defaults: Record<string, string>,
    hasProbability = false,
    size = 72
): string {
    const params = new URLSearchParams({ seed: `p-${optKey}-${optValue}`, size: String(size) });
    Object.entries(defaults).forEach(([k, v]) => { if (v) params.set(k, v); });
    if (optValue) params.set(optKey, optValue);
    if (hasProbability) params.set(`${optKey}Probability`, "100");
    return `https://api.dicebear.com/9.x/${styleId}/svg?${params}`;
}

// ── localStorage helpers ──────────────────────────────────────

export const UNLOCKED_STYLES_KEY = "sellstagram_unlocked_styles";
export const CURRENT_STYLE_KEY   = "sellstagram_current_style";
export const CURRENT_OPTIONS_KEY = "sellstagram_current_options";

export function getUnlockedStyleIds(): string[] {
    const base = ["fun-emoji", "bottts-neutral", "identicon", "initials"];
    if (typeof window === "undefined") return base;
    try {
        const saved = JSON.parse(localStorage.getItem(UNLOCKED_STYLES_KEY) || "[]") as string[];
        return [...new Set([...base, ...saved])];
    } catch { return base; }
}

export function addUnlockedStyle(id: string): void {
    const current = getUnlockedStyleIds();
    if (!current.includes(id))
        localStorage.setItem(UNLOCKED_STYLES_KEY, JSON.stringify([...current, id]));
}

export function getSavedAvatarStyle(): { styleId: string; options: Record<string, string> } | null {
    if (typeof window === "undefined") return null;
    try {
        const styleId = localStorage.getItem(CURRENT_STYLE_KEY);
        const options = localStorage.getItem(CURRENT_OPTIONS_KEY);
        if (styleId && options) return { styleId, options: JSON.parse(options) };
        return null;
    } catch { return null; }
}

export function saveAvatarStyle(styleId: string, options: Record<string, string>): void {
    localStorage.setItem(CURRENT_STYLE_KEY, styleId);
    localStorage.setItem(CURRENT_OPTIONS_KEY, JSON.stringify(options));
}
