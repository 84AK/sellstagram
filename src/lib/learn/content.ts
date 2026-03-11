/**
 * 학습 자료 허브 콘텐츠 데이터
 * 마케팅 개념 카드 + AI 도구 가이드 + 튜토리얼
 */

export type Difficulty = "초급" | "중급" | "고급";

/* ══════════════════════════════
   마케팅 개념 카드
══════════════════════════════ */
export interface ConceptCard {
    id: string;
    emoji: string;
    title: string;
    subtitle: string;
    color: string;
    bg: string;
    difficulty: Difficulty;
    relatedWeeks: number[];     // 관련 수업 회차
    summary: string;            // 한 줄 요약
    body: string;               // 상세 설명
    examples: string[];         // 실제 예시 3개
    keyPoints: string[];        // 핵심 포인트
}

export const CONCEPT_CARDS: ConceptCard[] = [
    {
        id: "4p",
        emoji: "🎯",
        title: "4P 마케팅믹스",
        subtitle: "Product · Price · Place · Promotion",
        color: "#4361EE",
        bg: "#EEF1FD",
        difficulty: "초급",
        relatedWeeks: [2],
        summary: "마케팅의 4가지 핵심 요소. 이 4개가 잘 맞아야 팔린다!",
        body: "마케팅의 가장 기본 프레임워크예요. 어떤 제품을, 얼마에, 어디서, 어떻게 알릴지를 결정해요.",
        examples: [
            "🍎 애플: 혁신 제품(P) × 프리미엄 가격(P) × 애플스토어(P) × 감성 광고(P)",
            "🚀 배달의민족: 음식 앱(P) × 배달비 구조(P) × 앱스토어(P) × 재미있는 광고(P)",
            "👟 나이키: Just Do It 스니커즈(P) × 다양한 가격대(P) × 전세계 매장(P) × 운동선수 모델(P)",
        ],
        keyPoints: [
            "Product: 고객이 원하는 걸 팔아야 해요",
            "Price: 너무 비싸도, 너무 싸도 문제예요",
            "Place: 고객이 있는 곳에 제품이 있어야 해요",
            "Promotion: 알려야 팔려요! 방법이 중요해요",
        ],
    },
    {
        id: "aida",
        emoji: "📣",
        title: "AIDA 공식",
        subtitle: "Attention · Interest · Desire · Action",
        color: "#FF6B35",
        bg: "#FFF0EB",
        difficulty: "초급",
        relatedWeeks: [6],
        summary: "광고 카피를 쓸 때 쓰는 마법의 4단계 공식!",
        body: "소비자가 구매하기까지 거치는 4단계 심리 과정이에요. 광고를 만들 때 이 순서대로 생각하면 훨씬 설득력이 높아져요.",
        examples: [
            "🎵 A: '지금 이 노래 아세요?'  I: '이 헤드폰으로 들으면 달라요'  D: '한정판 20개만 남았어요'  A: '지금 바로 구매하기'",
            "☕ A: '커피값으로 하루 투자'  I: '3개월 만에 수익이 났어요'  D: '나만의 브랜드 만들기'  A: '무료 상담 받기'",
            "👗 A: '이 옷 입은 사람 봤나요?'  I: '알고 보니 10만원대'  D: '벌써 3,000명 구매'  A: '품절 전 장바구니 담기'",
        ],
        keyPoints: [
            "A (주목): 스크롤을 멈추게 하는 첫 한 줄",
            "I (흥미): '오, 이거 나 얘기네' 싶게 만들기",
            "D (욕구): '갖고 싶다' '해보고 싶다' 감정 자극",
            "A (행동): 지금 당장 할 수 있는 쉬운 행동 제시",
        ],
    },
    {
        id: "persona",
        emoji: "👥",
        title: "고객 페르소나",
        subtitle: "내 고객을 한 명처럼 상상하기",
        color: "#8B5CF6",
        bg: "#F3EEFF",
        difficulty: "초급",
        relatedWeeks: [3],
        summary: "막연한 '20대 여성' 말고 '김지수 22세 대학생' 처럼 구체적으로!",
        body: "타겟 고객을 실제 인물처럼 설정하는 방법이에요. 페르소나가 구체적일수록 더 공감 가는 마케팅이 가능해요.",
        examples: [
            "✨ 지수 (22세): 인스타 즐겨봄, 트렌드에 민감, 월 용돈 30만원, '예쁜 거면 조금 비싸도 OK'",
            "🏃 민준 (28세): 헬스장 매일 감, 단백질 챙겨먹음, '효율적인 제품 좋아', 유튜브로 정보 수집",
            "👩‍💼 윤아 (35세): 직장인, 시간 없음, '빠르고 믿을 수 있는 것' 선호, 리뷰 꼼꼼히 읽음",
        ],
        keyPoints: [
            "이름, 나이, 직업, 관심사를 구체적으로 설정해요",
            "어떤 SNS를 쓰고, 어떻게 정보를 찾는지 알아야 해요",
            "구매 결정 시 가장 중요한 요소를 파악해요",
            "페르소나마다 다른 메시지와 채널이 필요해요",
        ],
    },
    {
        id: "engagement",
        emoji: "📊",
        title: "인게이지먼트율",
        subtitle: "좋아요+댓글+공유 ÷ 도달수 × 100",
        color: "#06D6A0",
        bg: "#E6FBF5",
        difficulty: "중급",
        relatedWeeks: [11],
        summary: "팔로워 수보다 인게이지먼트율이 훨씬 중요해요!",
        body: "게시물에 얼마나 많은 사람들이 반응하는지 보여주는 수치예요. 팔로워 10만인데 인게이지먼트 0.1%보다 팔로워 1천에 인게이지먼트 10%가 더 좋은 계정이에요.",
        examples: [
            "✅ 좋은 예: 팔로워 1,000명 / 게시물 좋아요 150개 = 인게이지먼트 15% (훌륭!)",
            "⚠️ 평균: 인스타그램 평균 인게이지먼트율은 약 3~6%예요",
            "❌ 문제: 팔로워 10만인데 좋아요 200개 = 인게이지먼트 0.2% (계정 상태 나쁨)",
        ],
        keyPoints: [
            "인게이지먼트율 = (좋아요+댓글+공유) ÷ 팔로워 × 100",
            "3% 이상이면 평균, 6% 이상이면 우수해요",
            "댓글과 공유가 좋아요보다 가중치가 높아요",
            "질문형 캡션이 댓글을 유도해 인게이지먼트를 높여요",
        ],
    },
    {
        id: "roas",
        emoji: "💰",
        title: "ROAS",
        subtitle: "광고비 대비 매출액 (Return On Ad Spend)",
        color: "#FFC233",
        bg: "#FFF8E0",
        difficulty: "중급",
        relatedWeeks: [11, 23],
        summary: "광고비 1원 쓸 때 얼마나 벌었는지 알 수 있는 숫자!",
        body: "광고 효율을 측정하는 가장 기본 지표예요. ROAS가 높을수록 광고비를 잘 쓴 거예요.",
        examples: [
            "💎 ROAS 5: 광고비 10만원 → 매출 50만원 (아주 좋음!)",
            "✅ ROAS 3: 광고비 10만원 → 매출 30만원 (평균)",
            "❌ ROAS 1: 광고비 10만원 → 매출 10만원 (겨우 본전, 이익 없음)",
        ],
        keyPoints: [
            "ROAS = 광고 매출 ÷ 광고비 × 100",
            "ROAS 300% = 광고비의 3배 매출 = ROAS 3x",
            "보통 ROAS 3x 이상이면 수익이 나요 (원가 고려)",
            "셀스타그램에서 직접 ROAS를 시뮬레이션할 수 있어요!",
        ],
    },
    {
        id: "hashtag",
        emoji: "#️⃣",
        title: "해시태그 전략",
        subtitle: "큰 태그 + 중간 태그 + 작은 태그 믹스",
        color: "#EF4444",
        bg: "#FEF2F2",
        difficulty: "초급",
        relatedWeeks: [7],
        summary: "해시태그는 내 게시물의 '위치 표지판'이에요!",
        body: "해시태그를 통해 내 게시물을 관심 있는 사람들에게 노출시킬 수 있어요. 무조건 많이 쓰는 것보다 전략적으로 선택하는 것이 중요해요.",
        examples: [
            "🔴 대형 (100만+): #패션 #뷰티 #먹스타그램 → 경쟁 심하지만 노출 많음",
            "🟡 중형 (1만~100만): #홍대맛집 #대학생패션 → 균형 잡힌 선택",
            "🟢 소형 (~1만): #성수동카페맛집추천 #오늘뭐입을까 → 경쟁 적고 타겟 정확",
        ],
        keyPoints: [
            "한 게시물에 해시태그 5~10개가 적당해요",
            "대형:중형:소형 = 2:4:4 비율을 추천해요",
            "경쟁이 너무 심한 대형 태그만 쓰면 묻혀요",
            "우리 브랜드만의 고유 해시태그도 만들어봐요",
        ],
    },
    {
        id: "stp",
        emoji: "🗺️",
        title: "STP 전략",
        subtitle: "Segmentation · Targeting · Positioning",
        color: "#0891B2",
        bg: "#E0F2FE",
        difficulty: "중급",
        relatedWeeks: [3, 12],
        summary: "시장을 나누고, 내 고객을 고르고, 내 위치를 잡는 것!",
        body: "마케팅 전략의 큰 그림이에요. 모두를 타겟으로 하면 아무도 타겟하지 않는 것과 같아요.",
        examples: [
            "S: '20대 여성' → '20대 초반 / 뷰티 관심 / 소득 낮음 / SNS 활발' 세분화",
            "T: 그 중 '가성비 뷰티 제품 원하는 대학생'을 타겟으로 선택",
            "P: '비싸지 않아도 예쁠 수 있어' → 포지셔닝 = 가성비 뷰티 브랜드",
        ],
        keyPoints: [
            "S: 전체 시장을 기준으로 나눠요 (나이, 지역, 관심사 등)",
            "T: 나눈 시장 중 내가 잘할 수 있는 곳을 선택해요",
            "P: 선택한 고객에게 '나는 이런 브랜드야'를 각인시켜요",
            "포지셔닝이 명확해야 고객이 기억해요",
        ],
    },
    {
        id: "viral",
        emoji: "🔥",
        title: "바이럴 마케팅",
        subtitle: "사람들이 저절로 퍼뜨리게 만드는 법",
        color: "#FF6B35",
        bg: "#FFF0EB",
        difficulty: "중급",
        relatedWeeks: [8, 9],
        summary: "광고비 0원으로 수백만 명에게 도달하는 마케팅!",
        body: "콘텐츠가 너무 재미있거나, 감동적이거나, 공유하고 싶은 이유가 있으면 사람들이 자발적으로 퍼뜨려요.",
        examples: [
            "😂 재미: 유머러스한 밈 형식 콘텐츠가 공유되기 쉬워요",
            "😢 감동: '이 할머니의 이야기'처럼 공감되는 스토리",
            "💡 유용함: '이거 몰랐으면 큰일날 뻔' 같은 꿀팁 정보",
        ],
        keyPoints: [
            "공유 버튼을 누르게 만드는 감정이 필요해요",
            "공감, 유머, 놀라움, 감동이 공유를 유발해요",
            "타겟이 공유하고 싶은 '이유'를 만들어야 해요",
            "강요하면 오히려 역효과가 나요",
        ],
    },
];

/* ══════════════════════════════
   AI 도구 가이드
══════════════════════════════ */
export interface AIToolGuide {
    id: string;
    name: string;
    emoji: string;
    logo?: string;          // 실제 서비스 로고 이미지 URL (없으면 emoji 표시)
    tagline: string;
    color: string;
    bg: string;
    difficulty: Difficulty;
    useCases: string[];
    steps: { step: string; desc: string }[];
    promptExample?: string;
    link: string;
}

export const AI_TOOL_GUIDES: AIToolGuide[] = [
    {
        id: "chatgpt",
        name: "ChatGPT",
        emoji: "🤖",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
        tagline: "카피라이팅·기획·리서치의 만능 도구",
        color: "#10A37F",
        bg: "#E6F7F3",
        difficulty: "초급",
        useCases: ["광고 카피 작성", "페르소나 만들기", "아이디어 브레인스토밍", "경쟁사 분석", "캠페인 기획서 초안"],
        steps: [
            { step: "chat.openai.com 접속", desc: "구글 계정으로 무료 로그인해요" },
            { step: "역할 먼저 지정", desc: "'너는 마케팅 전문가야. 중학생에게 설명하듯 답해줘'" },
            { step: "구체적으로 요청", desc: "'스마트워치를 Z세대에게 파는 인스타 캡션 3개 써줘'" },
            { step: "피드백으로 개선", desc: "'더 재미있게 써줘' '해시태그 5개도 추가해줘'" },
        ],
        promptExample: "너는 Z세대 마케팅 전문가야. 친환경 스마트워치를 18~24세 학생에게 홍보하는 인스타그램 캡션을 3가지 스타일(유머/감성/정보)로 각각 2줄씩 작성해줘. 해시태그 5개도 포함해줘.",
        link: "https://chat.openai.com",
    },
    {
        id: "claude",
        name: "Claude",
        emoji: "🌀",
        logo: "https://claude.ai/apple-touch-icon.png",
        tagline: "긴 글·전략·분석에 특화된 AI",
        color: "#4361EE",
        bg: "#EEF1FD",
        difficulty: "초급",
        useCases: ["마케팅 전략 분석", "긴 기획서 작성", "경쟁사 분석 리포트", "캠페인 스토리텔링", "고객 페르소나 심화"],
        steps: [
            { step: "claude.ai 접속", desc: "무료 플랜으로 시작 가능해요" },
            { step: "상세한 배경 설명", desc: "제품, 타겟, 목적을 자세히 알려줘요" },
            { step: "구조화된 출력 요청", desc: "'표로 정리해줘', '항목별로 나눠줘' 등 형식 지정" },
            { step: "대화하며 발전", desc: "Claude는 긴 대화를 잘 기억해서 이어서 발전시킬 수 있어요" },
        ],
        promptExample: "우리 팀이 친환경 스마트워치를 마케팅하는 학생 팀이야. 타겟은 Z세대(18~24세)고 예산은 100만원(가상)이야. STP 분석을 해주고 2주 SNS 캠페인 계획을 표로 만들어줘.",
        link: "https://claude.ai",
    },
    {
        id: "canva",
        name: "Canva AI",
        emoji: "🎨",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg",
        tagline: "이미지·카드뉴스·로고 디자인 뚝딱",
        color: "#7C3AED",
        bg: "#F3EEFF",
        difficulty: "초급",
        useCases: ["SNS 게시물 디자인", "로고 만들기", "AI 이미지 생성", "카드뉴스 제작", "프레젠테이션 슬라이드"],
        steps: [
            { step: "canva.com에서 회원가입", desc: "학생 이메일로 가입하면 Canva for Education 무료!" },
            { step: "템플릿 검색", desc: "'인스타그램 게시물' 검색 → 수천 개 템플릿 중 선택" },
            { step: "AI 이미지 생성", desc: "왼쪽 'AI 도구' → 'Text to Image' → 원하는 장면을 영어로 설명" },
            { step: "텍스트와 조합", desc: "AI 이미지에 카피라이팅을 얹어 완성도 높은 광고 이미지 완성" },
        ],
        promptExample: "A modern eco-friendly smartwatch on a wooden table with green plants in the background, soft morning light, minimalist style, product photography",
        link: "https://www.canva.com",
    },
    {
        id: "gemini",
        name: "Google Gemini",
        emoji: "✨",
        logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
        tagline: "이미지 분석·실시간 정보 검색 특화",
        color: "#FF6B35",
        bg: "#FFF0EB",
        difficulty: "초급",
        useCases: ["이미지 분석", "최신 트렌드 조사", "키워드 리서치", "광고 분석", "마케팅 사례 찾기"],
        steps: [
            { step: "gemini.google.com 접속", desc: "구글 계정으로 바로 사용 가능해요" },
            { step: "이미지를 직접 업로드", desc: "경쟁사 광고 이미지를 올리고 '이 광고의 전략을 분석해줘'라고 물어봐요" },
            { step: "최신 정보 요청", desc: "'2026년 Z세대 SNS 트렌드 3가지 알려줘' - 실시간 정보 검색 가능" },
            { step: "한국어로 자연스럽게", desc: "한국어 성능이 우수해서 편하게 대화하면 돼요" },
        ],
        promptExample: "이 인스타그램 게시물을 마케팅 관점에서 분석해줘. 타겟층, 색상 전략, 카피라이팅 기법, 개선할 점을 초등학생도 이해할 수 있게 설명해줘.",
        link: "https://gemini.google.com",
    },
    {
        id: "ai-video",
        name: "AI 영상 생성",
        emoji: "🎬",
        tagline: "쇼츠·릴스용 AI 비디오 콘텐츠 제작",
        color: "#EF4444",
        bg: "#FEF2F2",
        difficulty: "고급",
        useCases: ["AI 영상 생성", "제품 영상 광고", "배경 교체", "영상 편집 자동화", "숏폼 콘텐츠"],
        steps: [
            { step: "AI 영상 도구 선택", desc: "대부분 유료이므로 무료 체험 기간을 활용하거나 학교 계정으로 확인해보세요" },
            { step: "텍스트로 영상 생성", desc: "'Text to Video' 기능 → 원하는 장면을 구체적으로 설명해요" },
            { step: "이미지에서 영상 만들기", desc: "'Image to Video' → Canva로 만든 이미지를 움직이는 영상으로 변환!" },
            { step: "짧게 클립 만들기", desc: "4~8초 클립을 여러 개 만들어 이어붙여요" },
        ],
        promptExample: "A sleek smartwatch on a person's wrist while they're jogging in a park, dynamic camera movement, cinematic style, 4K quality",
        link: "https://runwayml.com",
    },
];

/* ══════════════════════════════
   단계별 튜토리얼
══════════════════════════════ */
export interface Tutorial {
    id: string;
    emoji: string;
    title: string;
    desc: string;
    color: string;
    bg: string;
    difficulty: Difficulty;
    duration: string;           // 예상 소요 시간
    relatedWeeks: number[];
    steps: {
        title: string;
        desc: string;
        tip?: string;
    }[];
}

export const TUTORIALS: Tutorial[] = [
    {
        id: "first-post",
        emoji: "📸",
        title: "첫 게시물 올리기",
        desc: "셀스타그램에 마케팅 게시물을 처음 올리는 방법을 알아봐요",
        color: "#FF6B35",
        bg: "#FFF0EB",
        difficulty: "초급",
        duration: "5분",
        relatedWeeks: [1],
        steps: [
            { title: "화면 왼쪽 하단 + 버튼 클릭", desc: "업로드 모달이 열려요", tip: "모바일에서는 하단 중앙의 주황 버튼이에요" },
            { title: "제품 설명 캡션 작성", desc: "우리 팀의 제품을 소개하는 2~3줄 문장을 써요. 감성적이거나 재미있게!", tip: "AIDA 공식을 기억하나요? 주목 → 흥미 → 욕구 → 행동 순서로 써봐요" },
            { title: "해시태그 3~5개 추가", desc: "#제품카테고리 #타겟층 #브랜드명 형식으로 달아요" },
            { title: "AI 성과 미리보기 확인", desc: "업로드 전 AI가 예상 성과를 알려줘요. 캡션을 수정하면 점수가 달라져요!" },
            { title: "업로드 후 AI 코치 피드백", desc: "게시물 업로드 후 댓글 버튼을 누르면 AI 고객 반응을 볼 수 있어요" },
        ],
    },
    {
        id: "ai-image",
        emoji: "🎨",
        title: "AI로 마케팅 이미지 만들기",
        desc: "Canva AI를 활용해 제품 광고 이미지를 무료로 제작하는 방법",
        color: "#7C3AED",
        bg: "#F3EEFF",
        difficulty: "초급",
        duration: "15분",
        relatedWeeks: [5, 13],
        steps: [
            { title: "canva.com에서 '인스타그램 게시물' 검색", desc: "1080×1080 정사각형 템플릿을 선택해요", tip: "교육용으로 등록하면 프리미엄 요소 무료!" },
            { title: "마음에 드는 템플릿 선택", desc: "우리 제품의 분위기와 맞는 템플릿을 골라요" },
            { title: "왼쪽 패널에서 'AI 이미지 생성' 선택", desc: "Apps → AI Image Generator 또는 'Text to Image'를 클릭해요" },
            { title: "영어로 원하는 이미지 설명", desc: "'eco-friendly smartwatch on wooden desk, natural light, minimalist style'처럼 구체적으로 써요", tip: "영어가 더 잘 나와요! ChatGPT에게 프롬프트 번역을 부탁해도 돼요" },
            { title: "텍스트와 브랜드 색상 적용", desc: "생성된 이미지에 제품명, 카피, 해시태그를 추가하고 팀 컬러로 맞춰요" },
        ],
    },
    {
        id: "copywriting",
        emoji: "✍️",
        title: "팔리는 카피 쓰는 법",
        desc: "AI와 함께 클릭율을 높이는 광고 문구 작성하기",
        color: "#4361EE",
        bg: "#EEF1FD",
        difficulty: "초급",
        duration: "10분",
        relatedWeeks: [1, 6],
        steps: [
            { title: "제품의 핵심 혜택 1가지 고르기", desc: "수십 가지 기능 말고, 딱 한 가지만. 뭐가 가장 좋아요?", tip: "고객 입장에서 생각해요. '빠르다'가 아닌 '아침에 10분 더 잘 수 있어요'" },
            { title: "ChatGPT에게 카피 3가지 요청", desc: "'유머형, 감성형, 정보형으로 각각 인스타 캡션 써줘'라고 요청해요" },
            { title: "마음에 드는 것 골라서 수정", desc: "AI 글을 그대로 쓰지 말고 내 스타일로 조금 바꿔요. 더 자연스러워요" },
            { title: "질문으로 마무리", desc: "'여러분은 어떻게 생각하나요?' 같은 질문으로 끝내면 댓글이 늘어요!", tip: "댓글이 많으면 알고리즘이 더 많이 노출시켜줘요" },
        ],
    },
    {
        id: "hashtag-research",
        emoji: "#️⃣",
        title: "해시태그 리서치 하기",
        desc: "AI로 우리 제품에 딱 맞는 해시태그 30개 찾는 방법",
        color: "#06D6A0",
        bg: "#E6FBF5",
        difficulty: "초급",
        duration: "10분",
        relatedWeeks: [7],
        steps: [
            { title: "ChatGPT에게 키워드 요청", desc: "'친환경 스마트워치 인스타그램 해시태그 30개 추천해줘. 대형/중형/소형으로 나눠줘'", tip: "제품 카테고리와 타겟층을 같이 알려주면 더 좋아요" },
            { title: "인스타에서 검색량 확인", desc: "인스타그램에서 태그를 검색하면 게시물 수가 나와요. 100만+이면 대형이에요" },
            { title: "대형 2개 + 중형 4개 + 소형 4개 선택", desc: "총 10개를 전략적으로 조합해요" },
            { title: "팀 고유 태그 1개 만들기", desc: "#우리팀이름챌린지 처럼 우리만의 태그를 만들어 팀 콘텐츠를 묶어요" },
        ],
    },
    {
        id: "team-campaign",
        emoji: "🚀",
        title: "팀 캠페인 기획하기",
        desc: "2주짜리 SNS 캠페인을 처음부터 기획하는 방법",
        color: "#FFC233",
        bg: "#FFF8E0",
        difficulty: "중급",
        duration: "30분",
        relatedWeeks: [8],
        steps: [
            { title: "캠페인 목표 1개 정하기", desc: "'팔로워 늘리기'보다 '스마트워치 인게이지먼트 5% 달성'처럼 구체적으로", tip: "목표가 구체적이어야 성공/실패를 알 수 있어요" },
            { title: "2주 콘텐츠 캘린더 작성", desc: "월: 제품 소개 / 수: 고객 후기 / 금: 이벤트 공지 등 패턴 잡기" },
            { title: "팀원 역할 분담", desc: "디자이너 / 카피라이터 / 데이터 분석가 / 스케줄 관리자로 나눠요" },
            { title: "AI로 초안 콘텐츠 5개 만들기", desc: "Claude나 ChatGPT로 2주치 게시물 아이디어를 한 번에 뽑아내요" },
            { title: "셀스타그램에 업로드 + 성과 트래킹", desc: "매 게시물 업로드 후 AI 피드백과 ROAS 데이터를 기록해요" },
        ],
    },
    {
        id: "data-analysis",
        emoji: "📊",
        title: "내 마케팅 성과 분석하기",
        desc: "셀스타그램 데이터로 뭐가 잘됐는지 파악하는 방법",
        color: "#0891B2",
        bg: "#E0F2FE",
        difficulty: "중급",
        duration: "15분",
        relatedWeeks: [11, 23],
        steps: [
            { title: "우측 대시보드에서 ROAS 확인", desc: "셀스타그램 오른쪽 패널의 ROAS와 총 도달수를 확인해요" },
            { title: "게시물별 인게이지먼트 비교", desc: "어떤 게시물이 가장 반응이 좋았나요? 공통점을 찾아봐요" },
            { title: "잘 된 게시물 패턴 분석", desc: "길이, 해시태그 수, 시간대, 주제 등 공통점을 적어봐요", tip: "ChatGPT에게 '이 데이터에서 패턴을 찾아줘'라고 분석을 맡길 수 있어요" },
            { title: "개선 포인트 3가지 도출", desc: "데이터 기반으로 다음 게시물에서 바꿀 것을 구체적으로 정해요" },
        ],
    },
];
