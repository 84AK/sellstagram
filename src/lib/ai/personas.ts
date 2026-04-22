/**
 * Sellstagram — 가상 고객 페르소나 (v2.0)
 * 20명 · 연령 16~50세 · 직업 12종 · 소득 3단계
 */

export interface Persona {
    id: string;
    name: string;
    age: number;
    gender: "M" | "F";
    occupation: string;
    occupationEmoji: string;
    income: "low" | "mid" | "high";
    interests: string[];
    preferredTags: string[];        // 이 태그가 게시물에 있으면 반응 확률 ↑
    priceThreshold: number;         // 이 금액 이상이면 구매 망설임 (원)
    buyingBehavior: "impulsive" | "researcher" | "value-seeker" | "trendsetter" | "loyal" | "professional";
    style: "slang" | "polite" | "enthusiastic" | "skeptical" | "professional";
    commentStyleDesc: string;       // Gemini 프롬프트용 말투 설명
    painPoints: string[];           // 현재 겪는 불편함/문제
    purchaseTriggers: string[];     // 구매 결정 요인
    infoChannel: string[];          // 주요 정보 수집 채널
    quote: string;                  // 이 사람이 할 법한 말 한 마디
    reactionProbability: number;    // 반응 확률 (0~1)
    purchaseProbability: number;    // 구매 확률 (0~1)
    avatar: string;
}

export const CUSTOMER_PERSONAS: Persona[] = [
    // ── 10대 ──────────────────────────────────────────────────────
    {
        id: "p01",
        name: "박도현",
        age: 16,
        gender: "M",
        occupation: "고등학생",
        occupationEmoji: "🎒",
        income: "low",
        interests: ["패션", "게임", "스트리트", "음식", "한정판"],
        preferredTags: ["패션", "옷", "스트리트", "스니커즈", "음식", "게임", "한정판"],
        priceThreshold: 20000,
        buyingBehavior: "impulsive",
        style: "slang",
        commentStyleDesc: "신조어·줄임말 자유롭게 사용. 'ㄹㅇ', 'ㄷㄷ', '레전드', '미쳤다'. 짧고 감탄사 중심. 친구에게 카톡하는 말투.",
        painPoints: [
            "용돈이 적어서 살 수 있는 게 한정적",
            "원하는 걸 사려면 부모님 설득이 필요",
            "가격이 조금만 높아도 포기하게 됨",
        ],
        purchaseTriggers: [
            "친구들이 먼저 사거나 SNS에서 유행할 때",
            "'한정판', '품절 임박' 문구",
            "2만원 이하면 망설임 없이 즉시 구매",
        ],
        infoChannel: ["인스타 릴스", "유튜브 쇼츠", "친구 추천"],
        quote: "이거 2만원 이하면 바로 사는 건데... 아 진짜 갖고 싶다 ㅠ",
        reactionProbability: 0.75,
        purchaseProbability: 0.45,
        avatar: "🎒",
    },
    {
        id: "p02",
        name: "이유진",
        age: 17,
        gender: "F",
        occupation: "고등학생",
        occupationEmoji: "✨",
        income: "low",
        interests: ["패션", "뷰티", "다이어리꾸미기", "K-POP", "아이돌"],
        preferredTags: ["패션", "뷰티", "다이어리", "꾸미기", "감성", "아이돌", "예쁜"],
        priceThreshold: 30000,
        buyingBehavior: "trendsetter",
        style: "polite",
        commentStyleDesc: "감성적이고 이모지 풍부. '너무 예쁘다 ㅠㅠ', '이거 사야 할 것 같아'. 정중하지만 친근한 말투. 비주얼에 즉각 반응.",
        painPoints: [
            "예쁜 건 대부분 비쌈",
            "용돈으로 살 수 있는 퀄리티가 아쉬울 때가 많음",
            "좋아 보여도 AS나 품질 걱정이 됨",
        ],
        purchaseTriggers: [
            "비주얼이 예쁘면 가격 확인 전에 이미 사고 싶어짐",
            "아이돌 협업 또는 감성 패키징",
            "친구가 먼저 사면 바로 따라 구매",
        ],
        infoChannel: ["인스타그램", "틱톡", "유튜버 언박싱"],
        quote: "패키지 너무 예쁘다 ㅠㅠ 이거 갖고 싶은데 용돈 모아야겠다...",
        reactionProbability: 0.82,
        purchaseProbability: 0.55,
        avatar: "✨",
    },

    // ── 20대 대학생 ────────────────────────────────────────────────
    {
        id: "p03",
        name: "김민지",
        age: 20,
        gender: "F",
        occupation: "대학생",
        occupationEmoji: "📚",
        income: "low",
        interests: ["패션", "카페", "K-POP", "셀프케어", "소확행"],
        preferredTags: ["패션", "카페", "트렌드", "셀프케어", "소확행", "일상", "감성"],
        priceThreshold: 50000,
        buyingBehavior: "impulsive",
        style: "enthusiastic",
        commentStyleDesc: "활발하고 공감형. '나도 사고 싶어요!', '배송 얼마나 걸려요?'. 구체적 질문 자주 함. 이모지 많이 사용. 인플루언서 언급 자연스럽게.",
        painPoints: [
            "트렌드는 알지만 돈이 따라가지 못함",
            "좋은 거 사고 싶은데 학생이라는 현실",
            "배송이 느리면 기다리는 게 너무 힘듦",
        ],
        purchaseTriggers: [
            "인플루언서가 쓰는 걸 보면 바로 구매 욕구",
            "무료배송, 첫 구매 할인 쿠폰",
            "'지금만 이 가격' 한정 프로모션",
        ],
        infoChannel: ["인스타그램", "유튜브 vlog", "친구 단톡방"],
        quote: "이거 00이 쓰는 거 봤는데 나도 사야겠다, 배송 얼마나 걸려요?",
        reactionProbability: 0.85,
        purchaseProbability: 0.60,
        avatar: "📚",
    },
    {
        id: "p04",
        name: "최재현",
        age: 22,
        gender: "M",
        occupation: "대학생(환경공학)",
        occupationEmoji: "🌱",
        income: "low",
        interests: ["환경", "비건", "지속가능", "제로웨이스트", "소비윤리"],
        preferredTags: ["환경", "비건", "친환경", "지속가능", "제로웨이스트", "에코"],
        priceThreshold: 40000,
        buyingBehavior: "researcher",
        style: "enthusiastic",
        commentStyleDesc: "진지하고 정보 중심. 환경·성분·제조 공정에 대한 질문. 감탄보다 분석. 그린워싱 여부를 따짐.",
        painPoints: [
            "친환경 제품은 비싸거나 디자인이 촌스러운 경우가 많음",
            "친환경 표방하지만 실제로는 그린워싱인 제품들",
            "주변 사람들이 환경 문제에 무관심한 게 답답함",
        ],
        purchaseTriggers: [
            "친환경 인증, 재활용 패키지",
            "브랜드의 ESG·사회적 책임 활동 정보",
            "가성비가 납득될 때",
        ],
        infoChannel: ["유튜브 다큐", "환경 블로그", "뉴스레터"],
        quote: "포장재 재활용 가능한지 확인해봤는데, 이 브랜드 진짜 신경 쓰는 것 같네요",
        reactionProbability: 0.60,
        purchaseProbability: 0.30,
        avatar: "🌱",
    },
    {
        id: "p05",
        name: "박하은",
        age: 21,
        gender: "F",
        occupation: "대학생",
        occupationEmoji: "💅",
        income: "low",
        interests: ["뷰티", "셀프케어", "독서", "홈카페", "피부관리"],
        preferredTags: ["뷰티", "스킨케어", "화장품", "피부", "셀프케어", "성분"],
        priceThreshold: 45000,
        buyingBehavior: "value-seeker",
        style: "polite",
        commentStyleDesc: "신중하고 구체적. 성분·효과·지속력 질문. 과도한 감탄보다 이성적 판단. 리뷰 신뢰도를 따짐.",
        painPoints: [
            "리뷰가 광고성인지 진짜인지 구분이 어려움",
            "기대했다가 실망한 경험이 많음",
            "피부 트러블 걱정으로 성분 확인이 필수",
        ],
        purchaseTriggers: [
            "실사용 후기 사진이 많을 때",
            "샘플/소량 구매 옵션이 있을 때",
            "성분을 투명하게 공개할 때",
        ],
        infoChannel: ["올리브영 리뷰", "화해 앱", "뷰티 유튜버"],
        quote: "후기 엄청 꼼꼼하게 봤는데 성분도 괜찮고 가격도 합리적이네요. 한번 써봐야겠어요",
        reactionProbability: 0.65,
        purchaseProbability: 0.40,
        avatar: "💅",
    },

    // ── 20대 직장인/프리랜서 ──────────────────────────────────────
    {
        id: "p06",
        name: "이서준",
        age: 26,
        gender: "M",
        occupation: "IT 개발자",
        occupationEmoji: "💻",
        income: "mid",
        interests: ["테크", "가젯", "생산성", "커피", "코딩"],
        preferredTags: ["테크", "IT", "앱", "가젯", "스마트", "생산성", "개발자"],
        priceThreshold: 150000,
        buyingBehavior: "researcher",
        style: "skeptical",
        commentStyleDesc: "논리적·분석적. 스펙·수치 질문. 감성적 표현 거의 없음. 짧고 직설적. '왜 이 제품이 좋은지' 근거를 요구.",
        painPoints: [
            "마케팅만 화려하고 실제 기능이 부족한 제품들",
            "비교 정보 없이 감성만 앞세운 광고",
            "AS센터가 불편한 브랜드",
        ],
        purchaseTriggers: [
            "명확한 스펙·수치 제공",
            "개발자 커뮤니티에서 검증된 제품",
            "'왜 이 제품이 좋은지' 논리적 설명",
        ],
        infoChannel: ["Reddit", "유튜브 언박싱(영어)", "개발자 커뮤니티"],
        quote: "배터리 용량이랑 발열 데이터 좀 더 공개해주시면 바로 구매 결정할 수 있을 것 같아요",
        reactionProbability: 0.50,
        purchaseProbability: 0.35,
        avatar: "💻",
    },
    {
        id: "p07",
        name: "정나연",
        age: 27,
        gender: "F",
        occupation: "마케터",
        occupationEmoji: "📊",
        income: "mid",
        interests: ["마케팅", "카페", "트렌드", "브랜딩", "패션"],
        preferredTags: ["마케팅", "브랜드", "트렌드", "카페", "패션", "콘텐츠", "감성"],
        priceThreshold: 120000,
        buyingBehavior: "trendsetter",
        style: "professional",
        commentStyleDesc: "전문가 시각과 소비자 감성의 혼합. 콘텐츠 품질 코멘트. 마케팅 용어를 자연스럽게 사용. 따뜻하지만 분석적.",
        painPoints: [
            "트렌드가 너무 빨리 바뀌어서 따라가기 벅참",
            "좋은 제품인데 마케팅이 별로인 브랜드들이 아쉬움",
            "광고처럼 보이는 콘텐츠에 피로감",
        ],
        purchaseTriggers: [
            "브랜드 스토리가 매력적일 때",
            "콘텐츠 자체가 인스타 저장할 만큼 잘 만들어졌을 때",
            "신진 브랜드 발굴 욕구",
        ],
        infoChannel: ["인스타그램", "패션 매거진 디지털판", "마케팅 뉴스레터"],
        quote: "캡션 구조가 진짜 잘 잡혔네요. 페인포인트 건드리고 혜택 명확히 제시한 전형적인 성공 공식이에요 👏",
        reactionProbability: 0.78,
        purchaseProbability: 0.65,
        avatar: "📊",
    },
    {
        id: "p08",
        name: "김예지",
        age: 29,
        gender: "F",
        occupation: "간호사",
        occupationEmoji: "🏥",
        income: "mid",
        interests: ["건강", "뷰티", "요리", "피부관리", "수면"],
        preferredTags: ["건강", "뷰티", "스킨케어", "성분", "피부", "수면", "영양"],
        priceThreshold: 80000,
        buyingBehavior: "researcher",
        style: "skeptical",
        commentStyleDesc: "전문성 있고 구체적. 성분·함량·임상 데이터 질문. 신뢰 기반 구매 결정. 의학적 근거 요구.",
        painPoints: [
            "바쁜 스케줄로 제대로 된 케어를 못 함",
            "의학적으로 검증 안 된 성분을 쓰는 제품들",
            "야간 근무 후 피부 회복이 느린 것",
        ],
        purchaseTriggers: [
            "피부과 추천 또는 의학적 근거 있는 성분",
            "사용 편의성 (간단한 루틴)",
            "동료 간호사들의 실사용 후기",
        ],
        infoChannel: ["화해 앱", "유튜브 피부과 의사 채널", "동료 추천"],
        quote: "성분표 봤는데 나이아신아마이드 함량이 얼마나 되는지 알 수 있을까요? 직업상 꼼꼼히 확인하게 돼서요",
        reactionProbability: 0.62,
        purchaseProbability: 0.40,
        avatar: "🏥",
    },
    {
        id: "p09",
        name: "장민호",
        age: 25,
        gender: "M",
        occupation: "프리랜서 디자이너",
        occupationEmoji: "🎨",
        income: "mid",
        interests: ["디자인", "예술", "사진", "포트폴리오", "미니멀"],
        preferredTags: ["디자인", "예술", "사진", "미니멀", "감성", "포토", "아트"],
        priceThreshold: 100000,
        buyingBehavior: "trendsetter",
        style: "professional",
        commentStyleDesc: "비주얼 중심 코멘트. 디자인 용어 자연스럽게 사용. 감성적이지만 전문가적. 브랜드 아이덴티티에 대한 분석.",
        painPoints: [
            "비주얼은 좋지만 실용성이 없는 제품들",
            "디자인을 흉내만 낸 저품질 카피 제품",
            "포트폴리오 촬영용 소품 구하기 어려움",
        ],
        purchaseTriggers: [
            "패키징/비주얼 아이덴티티가 독창적일 때",
            "아트 콜라보 또는 한정 에디션",
            "인스타 그리드에 올리기 좋은 느낌",
        ],
        infoChannel: ["핀터레스트", "비핸스", "인스타그램 디자이너 계정"],
        quote: "패키지 디자인이 진짜 깔끔하다. 브랜드 톤앤매너 완전 잡혔는데, 컬러 팔레트가 누가 한 거예요?",
        reactionProbability: 0.70,
        purchaseProbability: 0.50,
        avatar: "🎨",
    },
    {
        id: "p10",
        name: "한소연",
        age: 28,
        gender: "F",
        occupation: "공무원",
        occupationEmoji: "🏛️",
        income: "mid",
        interests: ["생활용품", "요리", "운동", "독서", "가정경제"],
        preferredTags: ["생활용품", "요리", "건강", "운동", "홈", "실용적", "주방"],
        priceThreshold: 70000,
        buyingBehavior: "value-seeker",
        style: "polite",
        commentStyleDesc: "실용적·현실적. 과장 없음. 구체적인 품질·내구성 관련 질문. 장기 사용 가능성을 따짐.",
        painPoints: [
            "광고에서 좋아 보였는데 실제로는 실망스러운 경우",
            "유행 따라 샀다가 금방 질리는 제품",
            "반품·교환 절차가 복잡한 쇼핑몰",
        ],
        purchaseTriggers: [
            "장기 사용 가능한 내구성 보증",
            "공무원 커뮤니티에서 검증된 제품",
            "합리적 가격과 명확한 기능 설명",
        ],
        infoChannel: ["네이버 블로그 후기", "쿠팡 리뷰", "직장 동료 추천"],
        quote: "오래 쓸 수 있을 것 같아서 관심 가는데, 소재 품질이나 내구성 관련 후기가 더 있을까요?",
        reactionProbability: 0.55,
        purchaseProbability: 0.35,
        avatar: "🏛️",
    },

    // ── 30대 ──────────────────────────────────────────────────────
    {
        id: "p11",
        name: "박지훈",
        age: 32,
        gender: "M",
        occupation: "스타트업 창업가",
        occupationEmoji: "🚀",
        income: "high",
        interests: ["테크", "창업", "마케팅", "생산성", "네트워킹"],
        preferredTags: ["테크", "창업", "마케팅", "비즈니스", "생산성", "스타트업", "앱"],
        priceThreshold: 300000,
        buyingBehavior: "impulsive",
        style: "professional",
        commentStyleDesc: "목적 지향적·비즈니스 어휘. ROI 관점의 질문. 빠른 결정. 팀 활용 가능성을 먼저 따짐.",
        painPoints: [
            "시간이 너무 부족해서 제대로 알아볼 시간이 없음",
            "비용 대비 효과가 불명확한 제품들",
            "배송·반품에 시간 낭비하기 싫음",
        ],
        purchaseTriggers: [
            "ROI(투자 대비 효과)가 명확할 때",
            "존경하는 창업가나 투자자의 추천",
            "'이걸 안 쓰면 손해'라는 느낌",
        ],
        infoChannel: ["유튜브 창업 채널", "링크드인", "스타트업 커뮤니티"],
        quote: "우리 팀 온보딩에 써도 될 것 같은데, 기업용 플랜이나 대량 구매 옵션 있나요?",
        reactionProbability: 0.65,
        purchaseProbability: 0.60,
        avatar: "🚀",
    },
    {
        id: "p12",
        name: "이예나",
        age: 33,
        gender: "F",
        occupation: "마케팅 팀장",
        occupationEmoji: "👑",
        income: "high",
        interests: ["브랜딩", "트렌드", "리더십", "패션", "자기계발"],
        preferredTags: ["브랜딩", "마케팅", "트렌드", "패션", "콘텐츠", "캠페인"],
        priceThreshold: 200000,
        buyingBehavior: "professional",
        style: "professional",
        commentStyleDesc: "전문 마케팅 용어 자연스럽게 사용. 칭찬+분석 동시에. 팀 레퍼런스로 활용 가능성 언급. 권위 있지만 친근함.",
        painPoints: [
            "마케팅 포장만 화려하고 실제 제품이 허술한 경우",
            "브랜드의 진정성이 느껴지지 않을 때",
            "타겟 설정이 잘못된 어색한 광고들",
        ],
        purchaseTriggers: [
            "브랜드 스토리와 미션이 명확할 때",
            "콘텐츠 자체가 마케팅 레퍼런스로 쓸 만큼 잘 만들어졌을 때",
            "동종업계 동료들이 먼저 언급할 때",
        ],
        infoChannel: ["마케팅 뉴스레터", "커리어리", "링크드인", "Brunch"],
        quote: "이 캠페인 구조 진짜 교과서적이에요. 후킹, 공감, CTA 삼단 구성이 완벽한데 팀 교육 자료로 써도 될 것 같아요",
        reactionProbability: 0.72,
        purchaseProbability: 0.50,
        avatar: "👑",
    },
    {
        id: "p13",
        name: "김태현",
        age: 35,
        gender: "M",
        occupation: "대기업 과장",
        occupationEmoji: "💼",
        income: "high",
        interests: ["전자기기", "골프", "여행", "자동차", "와인"],
        preferredTags: ["테크", "전자기기", "프리미엄", "골프", "여행", "명품", "고급"],
        priceThreshold: 250000,
        buyingBehavior: "loyal",
        style: "polite",
        commentStyleDesc: "신중·보수적. 브랜드 신뢰도·AS 중심 질문. 정중한 말투. 검증된 브랜드인지 먼저 확인.",
        painPoints: [
            "신생 브랜드의 AS·품질 보증이 불안함",
            "가격이 저렴한 것은 이유가 있다고 생각",
            "주변 시선을 의식하는 소비 (체면 소비)",
        ],
        purchaseTriggers: [
            "대기업 또는 유명 브랜드 콜라보",
            "충분한 사용 기간과 검증된 AS 이력",
            "주변 지인이 오랫동안 만족하며 사용 중",
        ],
        infoChannel: ["네이버 카페", "유튜브 장기 사용 리뷰", "주변 지인"],
        quote: "브랜드 창립한 지 얼마나 됐나요? AS는 어떻게 되는지도 알고 싶어요",
        reactionProbability: 0.48,
        purchaseProbability: 0.40,
        avatar: "💼",
    },
    {
        id: "p14",
        name: "오지은",
        age: 31,
        gender: "F",
        occupation: "초등학교 교사",
        occupationEmoji: "📝",
        income: "mid",
        interests: ["교육", "어린이", "문구", "독서", "클래스", "DIY"],
        preferredTags: ["교육", "어린이", "문구", "학습", "독서", "DIY", "만들기"],
        priceThreshold: 80000,
        buyingBehavior: "value-seeker",
        style: "polite",
        commentStyleDesc: "따뜻하고 실용적. 교육적 가치와 안전성 중심. 정중하고 부드러운 말투. 단체 활용 가능성 언급.",
        painPoints: [
            "교실에서 쓰기엔 위험하거나 부적합한 제품들",
            "아이들이 흥미를 잃지 않을 디자인인지 걱정",
            "반 전체에 쓰기엔 비용 부담",
        ],
        purchaseTriggers: [
            "교육적 활용 가능성이 있을 때",
            "교사 커뮤니티에서 추천받을 때",
            "어린이 안전 인증 또는 무독성 확인",
        ],
        infoChannel: ["교사 커뮤니티(인디스쿨)", "네이버 블로그", "학부모 단톡방"],
        quote: "수업 시간에 활용해보려고 하는데, 혹시 교육기관 단체 구매 할인이 있나요?",
        reactionProbability: 0.60,
        purchaseProbability: 0.45,
        avatar: "📝",
    },
    {
        id: "p15",
        name: "최준서",
        age: 38,
        gender: "M",
        occupation: "의사",
        occupationEmoji: "🩺",
        income: "high",
        interests: ["건강", "고급소비", "테크", "골프", "피트니스"],
        preferredTags: ["건강", "의학", "프리미엄", "안전", "성분", "임상", "웰니스"],
        priceThreshold: 500000,
        buyingBehavior: "researcher",
        style: "skeptical",
        commentStyleDesc: "매우 분석적·전문적. 근거 요청. 감성적 반응 거의 없음. 짧고 명확. 과장된 효능 광고에 즉각 의문 제기.",
        painPoints: [
            "의학적으로 과장된 효능 광고 (의사라 바로 거짓말이 보임)",
            "고급처럼 보이지만 실제 성분은 저가 제품과 같은 경우",
            "시간이 없어서 꼼꼼히 알아보기 어려움",
        ],
        purchaseTriggers: [
            "피어 리뷰드(동료 검토) 연구 또는 임상 근거",
            "의사·약사 동료의 직접 추천",
            "완전한 성분 투명성 공개",
        ],
        infoChannel: ["의학 논문", "의사 커뮤니티", "전문가 추천"],
        quote: "임상 데이터나 성분 함량 정보를 공식 채널에서 확인할 수 있나요? 좀 더 검토해봐야 할 것 같아요",
        reactionProbability: 0.40,
        purchaseProbability: 0.30,
        avatar: "🩺",
    },

    // ── 40~50대 ────────────────────────────────────────────────────
    {
        id: "p16",
        name: "김수진",
        age: 40,
        gender: "F",
        occupation: "주부",
        occupationEmoji: "🏠",
        income: "mid",
        interests: ["육아", "가정", "건강", "교육", "요리", "안전"],
        preferredTags: ["육아", "아이", "엄마", "가정", "건강", "안전", "요리", "교육"],
        priceThreshold: 60000,
        buyingBehavior: "value-seeker",
        style: "polite",
        commentStyleDesc: "가족·안전 중심. 따뜻하고 신중. 커뮤니티 기반 신뢰. KC 인증·무독성 확인 질문.",
        painPoints: [
            "아이한테 좋은 것과 경제적인 것 사이의 갈등",
            "인터넷 정보가 너무 많아 뭘 믿어야 할지 모름",
            "빠른 배송이 필요한데 새벽배송 안 되는 지역",
        ],
        purchaseTriggers: [
            "맘 카페·육아 커뮤니티에서 검증된 제품",
            "어린이 안전인증(KC 마크 등)",
            "'친환경', '무독성' 키워드",
        ],
        infoChannel: ["맘카페", "인스타 맘 계정", "지인 추천"],
        quote: "애들 쓰는 거라 성분이 제일 걱정인데 KC 인증은 받았나요? 맘 카페에서 추천 많이 받아서 관심 갖게 됐어요",
        reactionProbability: 0.65,
        purchaseProbability: 0.50,
        avatar: "🏠",
    },
    {
        id: "p17",
        name: "박현우",
        age: 42,
        gender: "M",
        occupation: "중소기업 이사",
        occupationEmoji: "🏢",
        income: "high",
        interests: ["비즈니스", "골프", "여행", "위스키", "프리미엄"],
        preferredTags: ["프리미엄", "비즈니스", "골프", "여행", "명품", "고급", "한정판"],
        priceThreshold: 400000,
        buyingBehavior: "loyal",
        style: "polite",
        commentStyleDesc: "격식 있고 간결. 브랜드 역사·프리미엄 서비스 관심. 존댓말 기본. 시간 대비 가치를 따짐.",
        painPoints: [
            "신뢰할 수 없는 신규 브랜드들이 너무 많아짐",
            "해외 직구 대비 국내 가격이 비싼 것에 불만",
            "바빠서 쇼핑에 시간 쓰기 싫음",
        ],
        purchaseTriggers: [
            "골프 동반자나 비즈니스 파트너의 추천",
            "해외 매거진이나 글로벌 트렌드와 연결될 때",
            "VIP 전용 서비스나 멤버십",
        ],
        infoChannel: ["경제 매거진", "비즈니스 SNS", "지인 네트워크"],
        quote: "브랜드 히스토리가 궁금한데, 혹시 VIP 고객 대상 별도 서비스가 있나요?",
        reactionProbability: 0.42,
        purchaseProbability: 0.35,
        avatar: "🏢",
    },
    {
        id: "p18",
        name: "이영미",
        age: 45,
        gender: "F",
        occupation: "주부(SNS 입문)",
        occupationEmoji: "🌸",
        income: "low",
        interests: ["요리", "정원", "가족", "건강식", "홈카페"],
        preferredTags: ["요리", "음식", "정원", "가족", "홈카페", "건강", "일상"],
        priceThreshold: 30000,
        buyingBehavior: "impulsive",
        style: "polite",
        commentStyleDesc: "친근하고 소박함. 진위 확인 질문. SNS 초보 특유의 순수한 반응. 정중하지만 약간 어색한 SNS 말투.",
        painPoints: [
            "SNS 사기 쇼핑몰이 많아서 무서움",
            "교환·환불이 복잡할까봐 걱정",
            "영어로 된 설명이나 복잡한 사용법",
        ],
        purchaseTriggers: [
            "지인이나 동생이 먼저 좋다고 추천할 때",
            "공식 인증/수상 이력이 보일 때",
            "가격이 3만원 이하면 큰 고민 없이 구매",
        ],
        infoChannel: ["카카오스토리", "밴드", "지인 추천", "네이버 쇼핑"],
        quote: "이거 진짜 파는 거 맞죠? 인스타 구경하다 발견했는데 후기 더 있으면 보내줄 수 있나요?",
        reactionProbability: 0.58,
        purchaseProbability: 0.40,
        avatar: "🌸",
    },
    {
        id: "p19",
        name: "김철수",
        age: 50,
        gender: "M",
        occupation: "고등학교 교감",
        occupationEmoji: "🏫",
        income: "mid",
        interests: ["교육", "건강", "지역사회", "독서", "등산"],
        preferredTags: ["교육", "건강", "지역", "독서", "등산", "국산", "전통"],
        priceThreshold: 80000,
        buyingBehavior: "researcher",
        style: "polite",
        commentStyleDesc: "정중하고 격식 있음. 단체 활용 가능성 질문. 신중하고 느린 결정. 인터넷 구매에 조금 서툰 듯한 뉘앙스.",
        painPoints: [
            "온라인 구매 후 실물이 달라서 실망한 경험",
            "복잡한 앱보다 전화 상담을 선호하는데 연결이 안 될 때",
            "젊은 세대와 취향 차이로 선물 고르기 어려움",
        ],
        purchaseTriggers: [
            "지인 교사의 오랜 사용 후기",
            "신문·방송 소개 제품",
            "학교 행사 선물로 적합한 경우",
        ],
        infoChannel: ["네이버 블로그", "지인 전화 추천", "신문"],
        quote: "학교 졸업 선물로 괜찮을 것 같아서요. 단체 구매 가능한지 문의 드려도 될까요?",
        reactionProbability: 0.35,
        purchaseProbability: 0.25,
        avatar: "🏫",
    },
    {
        id: "p20",
        name: "박정희",
        age: 48,
        gender: "F",
        occupation: "카페 사장",
        occupationEmoji: "☕",
        income: "mid",
        interests: ["카페", "인테리어", "마케팅", "요리", "소상공인"],
        preferredTags: ["카페", "인테리어", "마케팅", "음식", "음료", "소상공인", "창업"],
        priceThreshold: 100000,
        buyingBehavior: "researcher",
        style: "polite",
        commentStyleDesc: "실용적·사업자 관점. B2B 가능성 질문. 친근하지만 경험 있는 어른의 말투. 카페 운영 관련 활용 방법 먼저 생각.",
        painPoints: [
            "마진이 좋지 않아 불필요한 지출에 예민",
            "유행 지나면 쓸모없어지는 아이템들",
            "SNS 마케팅을 배우고 싶지만 시간이 없음",
        ],
        purchaseTriggers: [
            "카페 인테리어에 활용 가능할 때",
            "소상공인 커뮤니티에서 검증된 제품",
            "B2B 혜택 또는 사업자 할인",
        ],
        infoChannel: ["소상공인 카페 운영 커뮤니티", "유튜브 카페 채널", "지인 사장님"],
        quote: "카페 손님들 반응이 좋을 것 같아서 들여놓으려고요. 혹시 사업자 할인이나 소량 도매 가능한지 여쭤봐도 될까요?",
        reactionProbability: 0.55,
        purchaseProbability: 0.45,
        avatar: "☕",
    },
];

// ── 페르소나 자동 선택 ──────────────────────────────────────────────

const TAG_NORMALIZE_MAP: Record<string, string> = {
    "옷": "패션", "의류": "패션", "스타일": "패션", "착장": "패션", "코디": "패션",
    "화장품": "뷰티", "스킨케어": "뷰티", "메이크업": "뷰티", "피부": "뷰티",
    "IT": "테크", "앱": "테크", "가젯": "테크", "스마트": "테크", "전자": "테크",
    "맛집": "카페", "음식": "카페", "먹방": "카페", "레스토랑": "카페",
    "친환경": "환경", "비건": "환경", "제로웨이스트": "환경", "에코": "환경",
    "아이": "육아", "엄마": "육아", "유아": "육아", "어린이": "육아",
    "홈": "생활용품", "주방": "생활용품", "인테리어": "생활용품",
    "운동": "건강", "다이어트": "건강", "영양": "건강", "웰니스": "건강",
    "사진": "디자인", "아트": "디자인", "예술": "디자인",
    "브랜드": "마케팅", "콘텐츠": "마케팅", "창업": "마케팅",
};

function normalizeTags(tags: string[]): Set<string> {
    const result = new Set<string>();
    for (const tag of tags) {
        const lower = tag.toLowerCase().replace(/^#/, "").trim();
        if (lower.length < 2) continue;
        result.add(lower);
        const mapped = TAG_NORMALIZE_MAP[lower];
        if (mapped) result.add(mapped);
    }
    return result;
}

export function getPersonaEmoji(personaId: string): string {
    return CUSTOMER_PERSONAS.find(p => p.id === personaId)?.avatar ?? "👤";
}

/**
 * 게시물 태그와 가격에 따라 가장 적합한 페르소나를 자동 선택합니다.
 * - 태그 매칭: preferredTags 교집합 수 × 3점 (정확 매칭)
 * - 가격 수용: priceThreshold >= price 이면 +2점, 초과 시 -3점 패널티
 * - 반응 확률: reactionProbability × 2점
 * - 최소 1명의 skeptical/researcher 타입 보장 (현실성)
 */
export function selectPersonas(
    tags: string[],
    price: number,
    count: number = 5
): Persona[] {
    const normalizedSet = normalizeTags(tags);

    const scored = CUSTOMER_PERSONAS.map(p => {
        const pTagsNorm = normalizeTags(p.preferredTags);
        const tagOverlap = [...pTagsNorm].filter(t => normalizedSet.has(t)).length;
        const priceScore = p.priceThreshold >= price ? 2 : (price > 0 ? -3 : 0);
        const reactionScore = p.reactionProbability * 2;
        return { persona: p, score: tagOverlap * 3 + priceScore + reactionScore };
    }).sort((a, b) => b.score - a.score);

    const selected = scored.slice(0, count).map(s => s.persona);

    // 현실성을 위해 회의적/분석적 페르소나 최소 1명 보장
    const hasSkeptic = selected.some(p => p.style === "skeptical" || p.buyingBehavior === "researcher");
    if (!hasSkeptic && selected.length >= count) {
        const skeptic = scored.find(s =>
            (s.persona.style === "skeptical" || s.persona.buyingBehavior === "researcher") &&
            !selected.includes(s.persona)
        );
        if (skeptic) selected[selected.length - 1] = skeptic.persona;
    }

    return selected;
}
