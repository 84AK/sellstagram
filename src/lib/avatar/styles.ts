export type OptionType = "avatar" | "color";

export interface StyleOptionValue {
    value: string;
    label: string;
    color?: string; // for type="color": CSS color with #
}

export interface StyleOption {
    key: string;
    label: string;
    type: OptionType;
    values: StyleOptionValue[];
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

// ── 공통 배경색 팔레트 ──────────────────────────────
const COMMON_BG: StyleOptionValue[] = [
    { value: "b6e3f4", label: "하늘",     color: "#b6e3f4" },
    { value: "c0aede", label: "라벤더",   color: "#c0aede" },
    { value: "d1d4f9", label: "퍼플",     color: "#d1d4f9" },
    { value: "ffd5dc", label: "핑크",     color: "#ffd5dc" },
    { value: "ffdfbf", label: "피치",     color: "#ffdfbf" },
    { value: "b5ead7", label: "민트",     color: "#b5ead7" },
    { value: "ffeaa7", label: "옐로우",   color: "#ffeaa7" },
    { value: "ffffff", label: "화이트",   color: "#ffffff" },
    { value: "f7f6f3", label: "아이보리", color: "#f7f6f3" },
    { value: "2d3436", label: "다크",     color: "#2d3436" },
    { value: "fd79a8", label: "핫핑크",   color: "#fd79a8" },
    { value: "00b894", label: "에메랄드", color: "#00b894" },
    { value: "6c5ce7", label: "바이올렛", color: "#6c5ce7" },
    { value: "e17055", label: "코랄",     color: "#e17055" },
    { value: "fdcb6e", label: "골드",     color: "#fdcb6e" },
    { value: "00cec9", label: "틸",       color: "#00cec9" },
];

const BG_OPTION: StyleOption = {
    key: "backgroundColor",
    label: "배경색",
    type: "color",
    values: COMMON_BG,
};

// ── 공통 피부톤 ──────────────────────────────
const SKIN_TONES: StyleOptionValue[] = [
    { value: "f8d5c2", label: "라이트",   color: "#f8d5c2" },
    { value: "eec9a3", label: "베이지",   color: "#eec9a3" },
    { value: "d4a373", label: "탄",       color: "#d4a373" },
    { value: "c68642", label: "갈색",     color: "#c68642" },
    { value: "8d4925", label: "다크",     color: "#8d4925" },
    { value: "5c3317", label: "딥다크",   color: "#5c3317" },
];

// ── 공통 머리색 ──────────────────────────────
const HAIR_COLORS: StyleOptionValue[] = [
    { value: "0e0e0e", label: "블랙",       color: "#0e0e0e" },
    { value: "3c2415", label: "다크 브라운", color: "#3c2415" },
    { value: "71472d", label: "브라운",      color: "#71472d" },
    { value: "e2ba87", label: "라이트 브라운", color: "#e2ba87" },
    { value: "e9b729", label: "블론드",      color: "#e9b729" },
    { value: "d56c0c", label: "오렌지",      color: "#d56c0c" },
    { value: "c0392b", label: "레드",        color: "#c0392b" },
    { value: "605de4", label: "퍼플",        color: "#605de4" },
    { value: "238d80", label: "틸",          color: "#238d80" },
    { value: "ff6b9d", label: "핑크",        color: "#ff6b9d" },
    { value: "c0c0c0", label: "실버",        color: "#c0c0c0" },
    { value: "ffffff", label: "화이트",      color: "#f0f0f0" },
];

function variants(n: number, label: string): StyleOptionValue[] {
    return Array.from({ length: n }, (_, i) => ({
        value: `variant${String(i + 1).padStart(2, "0")}`,
        label: `${label} ${i + 1}`,
    }));
}
function numbered(prefix: string, n: number, label: string): StyleOptionValue[] {
    return Array.from({ length: n }, (_, i) => ({
        value: `${prefix}${String(i + 1).padStart(2, "0")}`,
        label: `${label} ${i + 1}`,
    }));
}

// ════════════════════════════════════════════
// 스타일 목록
// ════════════════════════════════════════════
export const DICEBEAR_STYLES: DiceBearStyle[] = [

    // ── 무료 ──────────────────────────────────
    {
        id: "fun-emoji",
        nameKo: "펀 이모지",
        description: "귀엽고 표정이 풍부한 이모지 스타일",
        xpCost: 0,
        emoji: "😊",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            {
                key: "eyes",
                label: "눈",
                type: "avatar",
                values: [
                    { value: "closed",     label: "감은 눈" },
                    { value: "closed2",    label: "감은 눈2" },
                    { value: "crying",     label: "울음" },
                    { value: "cute",       label: "귀여움" },
                    { value: "glasses",    label: "안경" },
                    { value: "love",       label: "하트" },
                    { value: "pissed",     label: "화남" },
                    { value: "plain",      label: "기본" },
                    { value: "sad",        label: "슬픔" },
                    { value: "shades",     label: "선글라스" },
                    { value: "sleepClose", label: "졸림" },
                    { value: "stars",      label: "별" },
                    { value: "tearDrop",   label: "눈물" },
                    { value: "wink",       label: "윙크" },
                    { value: "wink2",      label: "윙크2" },
                ],
            },
            {
                key: "mouth",
                label: "입",
                type: "avatar",
                values: [
                    { value: "cute",       label: "귀여움" },
                    { value: "drip",       label: "침흘림" },
                    { value: "faceMask",   label: "마스크" },
                    { value: "kissHeart",  label: "키스" },
                    { value: "lilSmile",   label: "미소" },
                    { value: "pissed",     label: "화남" },
                    { value: "plain",      label: "기본" },
                    { value: "sad",        label: "슬픔" },
                    { value: "shout",      label: "소리침" },
                    { value: "shy",        label: "수줍음" },
                    { value: "sick",       label: "아픔" },
                    { value: "smileLol",   label: "크게 웃음" },
                    { value: "smileTeeth", label: "이 드러냄" },
                    { value: "tongueOut",  label: "혀 내밀기" },
                    { value: "wideSmile",  label: "활짝" },
                ],
            },
            BG_OPTION,
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
                key: "eyes",
                label: "눈",
                type: "avatar",
                values: [
                    { value: "bulging",      label: "툭 튀어나온" },
                    { value: "dizzy",        label: "빙글빙글" },
                    { value: "eva",          label: "에바" },
                    { value: "frame1",       label: "프레임1" },
                    { value: "frame2",       label: "프레임2" },
                    { value: "glow",         label: "빛나는" },
                    { value: "happy",        label: "행복" },
                    { value: "hearts",       label: "하트" },
                    { value: "robocop",      label: "로보캅" },
                    { value: "round",        label: "동그란" },
                    { value: "roundFrame01", label: "라운드1" },
                    { value: "roundFrame02", label: "라운드2" },
                    { value: "sensor",       label: "센서" },
                    { value: "shade01",      label: "셰이드" },
                ],
            },
            {
                key: "mouth",
                label: "입",
                type: "avatar",
                values: [
                    { value: "bite",     label: "물기" },
                    { value: "diagram",  label: "다이어그램" },
                    { value: "grill01",  label: "그릴1" },
                    { value: "grill02",  label: "그릴2" },
                    { value: "grill03",  label: "그릴3" },
                    { value: "smile01",  label: "미소1" },
                    { value: "smile02",  label: "미소2" },
                    { value: "square01", label: "사각1" },
                    { value: "square02", label: "사각2" },
                ],
            },
            BG_OPTION,
        ],
    },

    // ── 유료 ──────────────────────────────────
    {
        id: "notionists-neutral",
        nameKo: "노셔니스트",
        description: "노션 스타일의 미니멀 일러스트",
        xpCost: 300,
        emoji: "📝",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            { key: "eyes",   label: "눈",   type: "avatar", values: variants(5, "눈") },
            { key: "brows",  label: "눈썹", type: "avatar", values: variants(13, "눈썹") },
            { key: "lips",   label: "입",   type: "avatar", values: variants(30, "입") },
            { key: "nose",   label: "코",   type: "avatar", values: variants(20, "코") },
            { key: "glasses", label: "안경", type: "avatar", values: variants(11, "안경") },
            BG_OPTION,
        ],
    },

    {
        id: "pixel-art",
        nameKo: "픽셀 아트",
        description: "레트로 픽셀 감성의 8비트 아바타",
        xpCost: 400,
        emoji: "🎮",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            {
                key: "hair",
                label: "헤어",
                type: "avatar",
                values: [
                    ...numbered("long",  15, "롱"),
                    ...numbered("short", 15, "숏"),
                ],
            },
            { key: "eyes",  label: "눈",  type: "avatar", values: variants(12, "눈") },
            {
                key: "mouth",
                label: "입",
                type: "avatar",
                values: [
                    ...numbered("happy", 10, "행복"),
                    ...numbered("sad",    6, "슬픔"),
                ],
            },
            { key: "clothing", label: "의상", type: "avatar", values: variants(23, "의상") },
            { key: "accessories", label: "액세서리", type: "avatar", values: variants(4, "액세서리") },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_TONES },
            BG_OPTION,
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
                key: "eyes",
                label: "눈",
                type: "avatar",
                values: [
                    { value: "angry",      label: "화남" },
                    { value: "cheery",     label: "밝음" },
                    { value: "confused",   label: "당황" },
                    { value: "normal",     label: "기본" },
                    { value: "sad",        label: "슬픔" },
                    { value: "sleepy",     label: "졸림" },
                    { value: "starstruck", label: "별눈" },
                    { value: "winking",    label: "윙크" },
                ],
            },
            {
                key: "mouth",
                label: "입",
                type: "avatar",
                values: [
                    { value: "awkwardSmile", label: "어색한 미소" },
                    { value: "braces",       label: "교정기" },
                    { value: "gapSmile",     label: "틈새 미소" },
                    { value: "kawaii",       label: "카와이" },
                    { value: "openedSmile",  label: "활짝 미소" },
                    { value: "openSad",      label: "슬픈 입" },
                    { value: "teethSmile",   label: "이 드러내기" },
                    { value: "unimpressed",  label: "무감동" },
                ],
            },
            {
                key: "hair",
                label: "헤어",
                type: "avatar",
                values: [
                    { value: "bangs",          label: "앞머리" },
                    { value: "bowlCutHair",    label: "볼컷" },
                    { value: "braids",         label: "땋은 머리" },
                    { value: "bunHair",        label: "번 머리" },
                    { value: "curlyBob",       label: "곱슬 보브" },
                    { value: "curlyShortHair", label: "곱슬 단발" },
                    { value: "froBun",         label: "아프로 번" },
                    { value: "halfShavedHead", label: "반삭" },
                    { value: "mohawk",         label: "모히칸" },
                    { value: "shavedHead",     label: "삭발" },
                    { value: "shortHair",      label: "단발" },
                    { value: "straightHair",   label: "생머리" },
                    { value: "wavyBob",        label: "웨이브 보브" },
                ],
            },
            {
                key: "accessories",
                label: "액세서리",
                type: "avatar",
                values: [
                    { value: "catEars",        label: "고양이 귀" },
                    { value: "clownNose",      label: "광대 코" },
                    { value: "faceMask",       label: "마스크" },
                    { value: "glasses",        label: "안경" },
                    { value: "mustache",       label: "콧수염" },
                    { value: "sailormoonCrown", label: "왕관" },
                    { value: "sleepMask",      label: "수면 마스크" },
                    { value: "sunglasses",     label: "선글라스" },
                ],
            },
            {
                key: "hairColor",
                label: "머리색",
                type: "color",
                values: [
                    { value: "3a1a00", label: "다크 브라운", color: "#3a1a00" },
                    { value: "220f00", label: "블랙",       color: "#220f00" },
                    { value: "238d80", label: "틸",         color: "#238d80" },
                    { value: "605de4", label: "퍼플",       color: "#605de4" },
                    { value: "71472d", label: "브라운",     color: "#71472d" },
                    { value: "d56c0c", label: "오렌지",     color: "#d56c0c" },
                    { value: "e2ba87", label: "라이트",     color: "#e2ba87" },
                    { value: "e9b729", label: "블론드",     color: "#e9b729" },
                ],
            },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_TONES },
            BG_OPTION,
        ],
    },

    {
        id: "lorelei",
        nameKo: "로렐레이",
        description: "부드러운 일러스트 캐릭터 스타일",
        xpCost: 600,
        emoji: "🌸",
        defaultOptions: { backgroundColor: "ffd5dc", skinColor: "f8d5c2" },
        options: [
            { key: "hair",     label: "헤어",   type: "avatar", values: variants(24, "헤어") },
            { key: "eyes",     label: "눈",     type: "avatar", values: variants(16, "눈") },
            { key: "eyebrows", label: "눈썹",   type: "avatar", values: variants(13, "눈썹") },
            {
                key: "mouth",
                label: "입",
                type: "avatar",
                values: [
                    ...numbered("happy", 12, "행복"),
                    ...numbered("sad",    6, "슬픔"),
                ],
            },
            { key: "nose", label: "코", type: "avatar", values: variants(6, "코") },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_TONES },
            { key: "hairColor", label: "머리색", type: "color", values: HAIR_COLORS },
            BG_OPTION,
        ],
    },

    {
        id: "adventurer",
        nameKo: "어드벤처러",
        description: "모험심 넘치는 캐릭터 스타일",
        xpCost: 700,
        emoji: "⚔️",
        defaultOptions: { backgroundColor: "b6e3f4", skinColor: "f8d5c2" },
        options: [
            {
                key: "hair",
                label: "헤어",
                type: "avatar",
                values: [
                    ...numbered("long",  20, "롱"),
                    ...numbered("short", 15, "숏"),
                ],
            },
            { key: "eyes",     label: "눈",   type: "avatar", values: variants(20, "눈") },
            { key: "eyebrows", label: "눈썹", type: "avatar", values: variants(15, "눈썹") },
            { key: "mouth",    label: "입",   type: "avatar", values: variants(20, "입") },
            { key: "skinColor", label: "피부톤", type: "color", values: SKIN_TONES },
            { key: "hairColor", label: "머리색", type: "color", values: HAIR_COLORS },
            BG_OPTION,
        ],
    },

    {
        id: "micah",
        nameKo: "미카",
        description: "깔끔한 평면 일러스트 스타일",
        xpCost: 700,
        emoji: "🎨",
        defaultOptions: { backgroundColor: "b6e3f4", baseColor: "f8d5c2" },
        options: [
            {
                key: "hair",
                label: "헤어",
                type: "avatar",
                values: [
                    { value: "fonze",        label: "폰즈" },
                    { value: "mrT",          label: "Mr.T" },
                    { value: "dougFunny",    label: "더그 파니" },
                    { value: "mrClean",      label: "Mr.클린" },
                    { value: "dannyPhantom", label: "대니 팬텀" },
                    { value: "full",         label: "풀" },
                    { value: "turban",       label: "터번" },
                    { value: "pixie",        label: "픽시" },
                ],
            },
            { key: "eyes",     label: "눈",   type: "avatar", values: variants(5, "눈") },
            {
                key: "eyebrows",
                label: "눈썹",
                type: "avatar",
                values: [
                    { value: "up",            label: "올라간" },
                    { value: "down",          label: "내려간" },
                    { value: "eyelashesUp",   label: "속눈썹 업" },
                    { value: "eyelashesDown", label: "속눈썹 다운" },
                ],
            },
            {
                key: "mouth",
                label: "입",
                type: "avatar",
                values: [
                    { value: "surprised", label: "놀람" },
                    { value: "laughing",  label: "웃음" },
                    { value: "nervous",   label: "긴장" },
                    { value: "smile",     label: "미소" },
                    { value: "sad",       label: "슬픔" },
                    { value: "pucker",    label: "뾰족" },
                    { value: "frown",     label: "찡그림" },
                    { value: "smirk",     label: "비웃음" },
                ],
            },
            {
                key: "nose",
                label: "코",
                type: "avatar",
                values: [
                    { value: "curve",   label: "곡선" },
                    { value: "pointed", label: "뾰족" },
                    { value: "round",   label: "둥근" },
                ],
            },
            {
                key: "shirt",
                label: "상의",
                type: "avatar",
                values: [
                    { value: "open",     label: "오픈" },
                    { value: "crew",     label: "크루넥" },
                    { value: "collared", label: "카라" },
                ],
            },
            { key: "hairColor", label: "머리색", type: "color", values: HAIR_COLORS },
            {
                key: "baseColor",
                label: "피부톤",
                type: "color",
                values: SKIN_TONES,
            },
            BG_OPTION,
        ],
    },

    {
        id: "avataaars-neutral",
        nameKo: "아바타아즈",
        description: "가장 다양한 커스터마이징의 SNS 아바타",
        xpCost: 1000,
        emoji: "🧑",
        defaultOptions: { backgroundColor: "b6e3f4" },
        options: [
            {
                key: "top",
                label: "헤어/모자",
                type: "avatar",
                values: [
                    { value: "shortFlat",          label: "단발" },
                    { value: "longButNotTooLong",   label: "긴 머리" },
                    { value: "curly",              label: "곱슬" },
                    { value: "bun",                label: "번 머리" },
                    { value: "dreads01",           label: "드레드" },
                    { value: "fro",                label: "아프로" },
                    { value: "shortCurly",         label: "숏 곱슬" },
                    { value: "shortRound",         label: "숏 라운드" },
                    { value: "sides",              label: "사이드" },
                    { value: "theCaesar",          label: "시저 컷" },
                    { value: "turban",             label: "터번" },
                    { value: "hijab",              label: "히잡" },
                    { value: "winterHat1",         label: "겨울 비니" },
                    { value: "hat",                label: "버킷햇" },
                ],
            },
            {
                key: "eyes",
                label: "눈",
                type: "avatar",
                values: [
                    { value: "closed",    label: "감은 눈" },
                    { value: "cry",       label: "눈물" },
                    { value: "default",   label: "기본" },
                    { value: "eyeRoll",   label: "눈 굴리기" },
                    { value: "happy",     label: "행복" },
                    { value: "hearts",    label: "하트" },
                    { value: "side",      label: "곁눈질" },
                    { value: "squint",    label: "실눈" },
                    { value: "surprised", label: "놀람" },
                    { value: "wink",      label: "윙크" },
                    { value: "winkWacky", label: "개그 윙크" },
                    { value: "xDizzy",   label: "X눈" },
                ],
            },
            {
                key: "eyebrows",
                label: "눈썹",
                type: "avatar",
                values: [
                    { value: "angry",                  label: "화남" },
                    { value: "default",                label: "기본" },
                    { value: "defaultNatural",         label: "자연스러운" },
                    { value: "flatNatural",            label: "평평한" },
                    { value: "raisedExcited",          label: "들린" },
                    { value: "raisedExcitedNatural",   label: "들린 자연" },
                    { value: "sadConcerned",           label: "슬픔" },
                    { value: "unibrowNatural",         label: "일자 눈썹" },
                    { value: "upDown",                 label: "업다운" },
                ],
            },
            {
                key: "mouth",
                label: "입",
                type: "avatar",
                values: [
                    { value: "concerned",  label: "걱정" },
                    { value: "default",    label: "기본" },
                    { value: "disbelief",  label: "불신" },
                    { value: "eating",     label: "먹는 중" },
                    { value: "grimace",    label: "이 드러내기" },
                    { value: "sad",        label: "슬픔" },
                    { value: "screamOpen", label: "소리침" },
                    { value: "serious",    label: "진지" },
                    { value: "smile",      label: "미소" },
                    { value: "tongue",     label: "혀 내밀기" },
                    { value: "twinkle",    label: "반짝 미소" },
                ],
            },
            {
                key: "accessories",
                label: "액세서리",
                type: "avatar",
                values: [
                    { value: "kurt",           label: "커트 안경" },
                    { value: "prescription01", label: "안경1" },
                    { value: "prescription02", label: "안경2" },
                    { value: "round",          label: "동그란 안경" },
                    { value: "sunglasses",     label: "선글라스" },
                    { value: "wayfarers",      label: "웨이페러" },
                ],
            },
            {
                key: "clothesType",
                label: "의상",
                type: "avatar",
                values: [
                    { value: "blazerAndShirt",   label: "블레이저+셔츠" },
                    { value: "blazerAndSweater", label: "블레이저+스웨터" },
                    { value: "collarAndSweater", label: "카라+스웨터" },
                    { value: "graphicShirt",     label: "그래픽 티" },
                    { value: "hoodie",           label: "후드티" },
                    { value: "overall",          label: "오버롤" },
                    { value: "shirtCrewNeck",    label: "크루넥" },
                    { value: "shirtVNeck",       label: "V넥" },
                ],
            },
            {
                key: "hairColor",
                label: "머리색",
                type: "color",
                values: [
                    { value: "2c1b18", label: "블랙",       color: "#2c1b18" },
                    { value: "4a312c", label: "다크 브라운", color: "#4a312c" },
                    { value: "724133", label: "브라운",      color: "#724133" },
                    { value: "b58143", label: "라이트 브라운", color: "#b58143" },
                    { value: "daa520", label: "블론드",      color: "#daa520" },
                    { value: "c0392b", label: "레드",        color: "#c0392b" },
                    { value: "ff69b4", label: "핑크",        color: "#ff69b4" },
                    { value: "a0a0a0", label: "실버",        color: "#a0a0a0" },
                    { value: "4a90d9", label: "블루",        color: "#4a90d9" },
                    { value: "7b68ee", label: "퍼플",        color: "#7b68ee" },
                ],
            },
            BG_OPTION,
        ],
    },
];

// ── 유틸리티 함수 ────────────────────────────────────

export function buildStyleUrl(
    styleId: string,
    options: Record<string, string>,
    seed: string,
    size = 200
): string {
    const params = new URLSearchParams({ seed, size: String(size) });
    Object.entries(options).forEach(([k, v]) => { if (v) params.set(k, v); });
    return `https://api.dicebear.com/9.x/${styleId}/svg?${params}`;
}

export function buildOptionPreviewUrl(
    styleId: string,
    optKey: string,
    optValue: string,
    defaults: Record<string, string>,
    size = 80
): string {
    const params = new URLSearchParams({ seed: `p-${optKey}-${optValue}`, size: String(size) });
    Object.entries(defaults).forEach(([k, v]) => { if (v) params.set(k, v); });
    if (optValue) params.set(optKey, optValue);
    return `https://api.dicebear.com/9.x/${styleId}/svg?${params}`;
}

// ── localStorage 헬퍼 ─────────────────────────────────

export const UNLOCKED_STYLES_KEY   = "sellstagram_unlocked_styles";
export const CURRENT_STYLE_KEY     = "sellstagram_current_style";
export const CURRENT_OPTIONS_KEY   = "sellstagram_current_options";

export function getUnlockedStyleIds(): string[] {
    const base = ["fun-emoji", "bottts-neutral"];
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
