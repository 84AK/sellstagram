/**
 * Sellstagram 29회 마케팅 수업 커리큘럼
 * 1학기: 15회 | 2학기: 14회 | 회당 2시간
 */

export interface Activity {
    time: string;       // "0~40분"
    title: string;
    desc: string;
    type: "warmup" | "learn" | "practice" | "present" | "wrap";
    tip?: string;       // 교사 팁
}

export interface Session {
    week: number;
    semester: 1 | 2;
    title: string;
    subtitle: string;
    theme: "intro" | "concept" | "skill" | "campaign" | "review" | "advanced" | "project";
    goals: string[];
    activities: Activity[];
    keywords: string[];
    difficultyLevel: 1 | 2 | 3;    // 1=쉬움, 2=보통, 3=어려움
    aiTool?: string;                // 사용하는 AI 도구
    completed?: boolean;
}

export const CURRICULUM: Session[] = [
    /* ══════════════ 1학기 ══════════════ */
    {
        week: 1, semester: 1,
        title: "우리의 마케팅 어드벤처 시작!",
        subtitle: "오리엔테이션 + 나는 어떤 마케터?",
        theme: "intro",
        difficultyLevel: 1,
        goals: [
            "셀스타그램 앱 사용법 익히기",
            "팀원들과 인사하고 팀 이름 정하기",
            "내 마케터 스타일 발견하기",
            "첫 번째 마케팅 콘텐츠 업로드",
        ],
        keywords: ["마케팅", "셀스타그램", "팀빌딩", "SNS"],
        activities: [
            {
                time: "0 ~ 30분",
                title: "앱 셋업 + 마케터 카드 만들기",
                desc: "셀스타그램 앱을 처음 열고 마케터 온보딩을 완료해요. 성향 테스트로 나만의 포지션을 발견하고, 팀 코드를 입력해 팀에 합류하세요.",
                type: "warmup",
                tip: "미리 팀 코드(A팀, B팀...)를 배정해 두고 수업 시작 전 칠판에 적어두세요.",
            },
            {
                time: "30 ~ 60분",
                title: "팀 이름 + 팀 로고 아이디어 브레인스토밍",
                desc: "팀원들과 함께 팀 이름과 콘셉트를 정해요. 어떤 마케팅 전문 팀이 될지 5분 토론 후 팀 소개를 발표해요.",
                type: "learn",
                tip: "각 팀이 1분 안에 팀 소개를 해주도록 유도하세요. 짧고 재미있게!",
            },
            {
                time: "60 ~ 95분",
                title: "1분 카피라이팅 배틀 ⚡",
                desc: "선생님이 제품 이미지를 보여주면, 2분 안에 가장 끌리는 광고 문구를 작성해요. 팀별로 발표하고 반 전체 투표로 최고의 카피를 선정!",
                type: "practice",
                tip: "제품 이미지는 스마트워치, 텀블러, 운동화 등 학생들에게 친숙한 것으로 준비하세요.",
            },
            {
                time: "95 ~ 120분",
                title: "첫 마케팅 콘텐츠 업로드",
                desc: "아까 만든 카피로 첫 번째 셀스타그램 게시물을 올려요. AI 코치의 즉각 피드백을 받고, 팀 피드에서 서로 좋아요를 눌러봐요.",
                type: "wrap",
                tip: "AI 피드백이 나오면 화면에 공유하고 '왜 이런 평가가 나왔을까?' 함께 이야기해보세요.",
            },
        ],
    },
    {
        week: 2, semester: 1,
        title: "마케팅이 뭐길래?",
        subtitle: "마케팅 기본 개념 + 4P 전략",
        theme: "concept",
        difficultyLevel: 1,
        goals: [
            "마케팅과 광고의 차이 이해",
            "4P (제품, 가격, 유통, 프로모션) 개념 학습",
            "실제 브랜드 사례 분석하기",
        ],
        keywords: ["4P", "마케팅믹스", "타겟", "브랜드"],
        activities: [
            {
                time: "0 ~ 25분",
                title: "퀴즈! 이게 마케팅일까 광고일까?",
                desc: "5개의 사례를 보고 마케팅인지 광고인지 팀별로 답을 맞혀봐요. 틀린 팀에게는 선생님의 설명이 이어져요.",
                type: "warmup",
            },
            {
                time: "25 ~ 70분",
                title: "4P 마케팅믹스 탐험",
                desc: "애플, 배달의민족, 나이키의 4P를 분석해요. 각 팀은 자신이 좋아하는 브랜드의 4P를 직접 정리하고 공유해요.",
                type: "learn",
                tip: "학생들이 직접 좋아하는 브랜드를 선택할 수 있도록 해주세요. 참여도가 올라가요!",
            },
            {
                time: "70 ~ 120분",
                title: "우리 팀 가상 제품의 4P 만들기",
                desc: "이번 학기에 함께 마케팅할 가상 제품을 선정하고, 팀만의 4P 전략을 셀스타그램에 첫 캠페인 기획서로 업로드해요.",
                type: "practice",
            },
        ],
    },
    {
        week: 3, semester: 1,
        title: "우리 고객은 누구야?",
        subtitle: "타겟 설정 + 고객 페르소나 만들기",
        theme: "concept",
        difficultyLevel: 1,
        goals: [
            "타겟 마케팅의 중요성 이해",
            "고객 페르소나 개념 학습",
            "우리 팀 제품의 페르소나 3명 완성",
        ],
        keywords: ["타겟팅", "페르소나", "세그멘테이션", "Z세대"],
        aiTool: "ChatGPT / Claude",
        activities: [
            {
                time: "0 ~ 30분",
                title: "나는 어떤 소비자? 나를 페르소나로 만들어봐",
                desc: "자기 자신을 페르소나 카드로 작성해봐요. 나이, 관심사, 자주 보는 SNS, 구매 결정 방법 등을 정리해요.",
                type: "warmup",
            },
            {
                time: "30 ~ 75분",
                title: "AI로 페르소나 생성하기",
                desc: "ChatGPT나 Claude에게 '우리 제품의 주요 타겟 페르소나 3명을 만들어줘'라고 요청해봐요. AI의 답변을 함께 분석하고 수정해요.",
                type: "learn",
                tip: "AI 처음 사용하는 학생을 위해 '프롬프트 작성 팁' 칠판에 미리 써주세요.",
            },
            {
                time: "75 ~ 120분",
                title: "팀 페르소나 카드 완성 + 공유",
                desc: "팀만의 페르소나 3명을 완성하고, 각 페르소나에 이름과 스토리를 붙여요. 셀스타그램 피드에 우리 팀 페르소나를 소개하는 게시물 작성!",
                type: "practice",
            },
        ],
    },
    {
        week: 4, semester: 1,
        title: "SNS 마케팅의 세계",
        subtitle: "인스타그램, 틱톡, 유튜브 쇼츠 분석",
        theme: "skill",
        difficultyLevel: 1,
        goals: [
            "주요 SNS 플랫폼 특성 비교",
            "알고리즘 기초 이해",
            "플랫폼별 콘텐츠 형식 이해",
        ],
        keywords: ["알고리즘", "인스타그램", "틱톡", "쇼츠", "바이럴"],
        activities: [
            {
                time: "0 ~ 30분",
                title: "나는 어떤 SNS 사람? 플랫폼 선호도 조사",
                desc: "각자 가장 많이 쓰는 SNS와 이유를 공유해요. 우리 반의 SNS 현황을 실시간 차트로 만들어봐요.",
                type: "warmup",
            },
            {
                time: "30 ~ 80분",
                title: "플랫폼 알고리즘 탐정단",
                desc: "같은 제품을 인스타그램용, 틱톡용, 유튜브용으로 각각 다르게 기획해봐요. 어떻게 다르게 만들어야 할까요?",
                type: "learn",
            },
            {
                time: "80 ~ 120분",
                title: "우리 팀의 플랫폼 전략 선택",
                desc: "우리 제품에 가장 잘 맞는 메인 SNS 플랫폼을 결정하고, 그 이유를 셀스타그램에 업로드해요.",
                type: "practice",
            },
        ],
    },
    {
        week: 5, semester: 1,
        title: "AI로 콘텐츠 뚝딱!",
        subtitle: "AI 이미지 + 텍스트 생성 기초",
        theme: "skill",
        difficultyLevel: 2,
        goals: [
            "AI 이미지 생성 도구 사용법",
            "프롬프트 작성 기술 향상",
            "AI 콘텐츠의 윤리적 활용",
        ],
        keywords: ["프롬프트", "생성AI", "Midjourney", "DALL-E", "Canva"],
        aiTool: "Canva AI / ChatGPT",
        activities: [
            {
                time: "0 ~ 20분",
                title: "AI가 만든 광고 vs 사람이 만든 광고",
                desc: "두 개의 광고를 보고 어떤 것이 AI가 만든 건지 맞혀봐요! 정답을 공개하고 AI 마케팅의 장단점을 이야기해요.",
                type: "warmup",
            },
            {
                time: "20 ~ 75분",
                title: "Canva AI로 마케팅 이미지 만들기",
                desc: "Canva의 AI 도구를 활용해 팀 제품 광고 이미지를 만들어봐요. 좋은 프롬프트 → 좋은 이미지 실습!",
                type: "learn",
                tip: "학교 컴퓨터에서 Canva 무료 계정을 사전에 만들어 두세요. 로그인 시간 절약!",
            },
            {
                time: "75 ~ 120분",
                title: "AI 콘텐츠 피드에 올리고 평가받기",
                desc: "만든 AI 이미지를 셀스타그램에 올리고 AI 코치의 평가를 받아요. 가장 높은 점수를 받은 팀의 비결을 함께 분석!",
                type: "practice",
            },
        ],
    },
    {
        week: 6, semester: 1,
        title: "팔리는 문장의 비밀",
        subtitle: "카피라이팅 전략",
        theme: "skill",
        difficultyLevel: 2,
        goals: [
            "AIDA 공식 학습",
            "감정을 자극하는 카피 기술",
            "플랫폼별 최적 문구 길이 이해",
        ],
        keywords: ["AIDA", "카피라이팅", "헤드라인", "CTA", "스토리텔링"],
        activities: [
            { time: "0 ~ 25분", title: "최강 광고 카피 분석", desc: "역대 유명 광고 카피 10개를 보고 왜 끌리는지 분석해요.", type: "warmup" },
            { time: "25 ~ 75분", title: "AIDA 공식으로 카피 쓰기", desc: "주의(A)-흥미(I)-욕구(D)-행동(A) 4단계 공식으로 팀 제품 카피를 작성해요.", type: "learn" },
            { time: "75 ~ 120분", title: "카피라이팅 배틀 라운드 2", desc: "다른 팀의 카피를 보고 피드백하는 시간. 셀스타그램에 최종 카피 업로드!", type: "practice" },
        ],
    },
    {
        week: 7, semester: 1,
        title: "해시태그 전략 마스터",
        subtitle: "검색 최적화 + 해시태그 리서치",
        theme: "skill",
        difficultyLevel: 2,
        goals: ["해시태그 알고리즘 이해", "니치/트렌딩/브랜드 태그 분류", "팀 해시태그 세트 완성"],
        keywords: ["해시태그", "SEO", "트렌딩", "검색"],
        activities: [
            { time: "0 ~ 30분", title: "해시태그 퀴즈! 이게 좋은 태그야?", desc: "5가지 해시태그 전략의 좋고 나쁨을 팀별로 맞혀봐요.", type: "warmup" },
            { time: "30 ~ 80분", title: "팀 제품 해시태그 30개 수집", desc: "AI 도움을 받아 우리 제품에 맞는 해시태그 30개를 대형/중형/소형으로 분류해요.", type: "learn" },
            { time: "80 ~ 120분", title: "해시태그 적용 게시물 업로드", desc: "전략적으로 선택한 해시태그 10개를 달아 게시물을 올리고, 효과를 비교해봐요.", type: "practice" },
        ],
    },
    {
        week: 8, semester: 1,
        title: "팀 캠페인 대작전 기획",
        subtitle: "마케팅 캠페인 기획서 작성",
        theme: "campaign",
        difficultyLevel: 2,
        goals: ["캠페인 기획 프레임워크 이해", "팀 역할 분담", "2주짜리 캠페인 로드맵 수립"],
        keywords: ["캠페인", "기획서", "KPI", "로드맵", "역할분담"],
        activities: [
            { time: "0 ~ 20분", title: "성공한 바이럴 캠페인 케이스 분석", desc: "실제 성공 캠페인 2개를 분석하고 성공 요인을 뽑아내요.", type: "warmup" },
            { time: "20 ~ 80분", title: "우리 팀 캠페인 기획서 작성", desc: "목표 고객, 핵심 메시지, 콘텐츠 계획, 2주 일정표를 작성해요.", type: "learn", tip: "기획서 템플릿을 미리 만들어 배포하면 시간을 절약할 수 있어요." },
            { time: "80 ~ 120분", title: "팀별 기획서 3분 발표", desc: "각 팀이 캠페인 핵심을 3분 안에 발표하고, 다른 팀에서 한 가지 피드백을 줘요.", type: "present" },
        ],
    },
    {
        week: 9, semester: 1,
        title: "콘텐츠 제작 마라톤!",
        subtitle: "팀 캠페인 콘텐츠 제작 주간",
        theme: "campaign",
        difficultyLevel: 2,
        goals: ["계획한 콘텐츠 실제 제작", "AI 도구 활용 콘텐츠 다양화", "팀원 역할 실행"],
        keywords: ["콘텐츠제작", "릴스", "카드뉴스", "AI생성"],
        aiTool: "Canva AI / ChatGPT / 셀스타그램 AI",
        activities: [
            { time: "0 ~ 15분", title: "오늘의 콘텐츠 목표 설정", desc: "오늘 각 팀이 만들 콘텐츠 수량을 칠판에 공언해요. 책임감 UP!", type: "warmup" },
            { time: "15 ~ 100분", title: "집중 콘텐츠 제작 타임", desc: "기획서대로 사진 게시물, 영상, 카드뉴스 등 다양한 형식의 콘텐츠를 AI 도구를 활용해 만들어요.", type: "practice", tip: "순회하며 막히는 학생을 도와주세요. 잘하는 학생을 '팀 AI 전문가'로 임명하면 효과적!" },
            { time: "100 ~ 120분", title: "오늘의 업로드 현황 공유", desc: "각 팀이 오늘 만든 콘텐츠를 셀스타그램에 업로드하고 피드를 함께 감상해요.", type: "wrap" },
        ],
    },
    {
        week: 10, semester: 1,
        title: "중간 캠페인 발표회",
        subtitle: "팀 캠페인 성과 공유 + 피드백",
        theme: "review",
        difficultyLevel: 2,
        goals: ["캠페인 성과 데이터 분석", "발표 능력 향상", "피어 피드백 능력"],
        keywords: ["발표", "성과분석", "피드백", "데이터"],
        activities: [
            { time: "0 ~ 20분", title: "성과 데이터 최종 정리", desc: "셀스타그램 데이터를 보고 가장 잘된 게시물을 찾아요. 왜 잘됐을까?", type: "warmup" },
            { time: "20 ~ 90분", title: "팀별 5분 발표", desc: "어떤 캠페인을 기획했고, 무엇이 잘됐고, 다음엔 어떻게 개선할지 발표해요.", type: "present" },
            { time: "90 ~ 120분", title: "반 투표 + 어워즈", desc: "최고의 캠페인, 최고의 카피, 최고의 비주얼을 반 전체 투표로 선정해요!", type: "wrap" },
        ],
    },
    {
        week: 11, semester: 1,
        title: "숫자로 보는 마케팅",
        subtitle: "데이터 분석 기초",
        theme: "skill",
        difficultyLevel: 2,
        goals: ["인게이지먼트율, ROAS, CTR 개념 이해", "셀스타그램 데이터 해석", "데이터 기반 의사결정"],
        keywords: ["ROAS", "CTR", "인게이지먼트", "전환율", "KPI"],
        activities: [
            { time: "0 ~ 25분", title: "마케팅 숫자 용어 빙고!", desc: "ROAS, CTR, CPC, CPM 등 용어로 빙고를 해요. 이기려면 뜻을 알아야 해요!", type: "warmup" },
            { time: "25 ~ 80분", title: "우리 팀 데이터 대시보드 해석", desc: "셀스타그램 인사이트 패널을 보며 우리 팀의 마케팅 효율을 분석해요.", type: "learn" },
            { time: "80 ~ 120분", title: "데이터 기반 개선 계획 세우기", desc: "데이터가 보여주는 문제점을 찾고, 다음 콘텐츠를 어떻게 개선할지 계획해요.", type: "practice" },
        ],
    },
    {
        week: 12, semester: 1,
        title: "경쟁사 스파이 작전",
        subtitle: "벤치마킹 + 경쟁 분석",
        theme: "skill",
        difficultyLevel: 2,
        goals: ["경쟁 분석 프레임워크 이해", "벤치마킹 방법론", "차별화 전략 수립"],
        keywords: ["벤치마킹", "경쟁분석", "차별화", "포지셔닝"],
        activities: [
            { time: "0 ~ 20분", title: "탐정 게임: 경쟁사를 분석하라!", desc: "실제 브랜드의 SNS를 5분간 보고 전략을 분석해요.", type: "warmup" },
            { time: "20 ~ 80분", title: "우리 경쟁사 분석 리포트", desc: "가상 경쟁사 3개를 선정하고 강점/약점을 분석해 우리만의 차별화 포인트를 찾아요.", type: "learn" },
            { time: "80 ~ 120분", title: "차별화 전략 셀스타그램 게시물로!", desc: "우리만의 차별화 포인트를 강조한 게시물을 만들어 업로드해요.", type: "practice" },
        ],
    },
    {
        week: 13, semester: 1,
        title: "우리 팀 브랜드 만들기",
        subtitle: "브랜드 아이덴티티 + 로고 제작",
        theme: "skill",
        difficultyLevel: 2,
        goals: ["브랜드 아이덴티티 개념", "AI 로고 디자인 도구 활용", "브랜드 가이드라인 기초"],
        keywords: ["브랜드", "로고", "아이덴티티", "색상", "폰트"],
        aiTool: "Canva / Looka / ChatGPT",
        activities: [
            { time: "0 ~ 20분", title: "브랜드 성격 퀴즈", desc: "5개의 로고를 보고 브랜드의 성격을 맞혀봐요. 로고 하나에 모든 게 담겨있어요!", type: "warmup" },
            { time: "20 ~ 80분", title: "AI로 우리 팀 브랜드 로고 만들기", desc: "Canva AI로 팀 브랜드의 색상, 폰트, 로고를 완성해요.", type: "practice" },
            { time: "80 ~ 120분", title: "브랜드 카드 발표", desc: "로고 + 브랜드 키워드 3개 + 브랜드 컬러를 담은 브랜드 카드를 발표해요.", type: "present" },
        ],
    },
    {
        week: 14, semester: 1,
        title: "1학기 최종 발표",
        subtitle: "팀 마케팅 포트폴리오 발표",
        theme: "review",
        difficultyLevel: 3,
        goals: ["1학기 학습 내용 종합 발표", "팀 성장 스토리 공유", "개인 성장 반성"],
        keywords: ["발표", "포트폴리오", "성장", "피드백"],
        activities: [
            { time: "0 ~ 15분", title: "1학기 하이라이트 영상 시청", desc: "지금까지 만든 콘텐츠들을 모아 함께 돌아봐요.", type: "warmup" },
            { time: "15 ~ 90분", title: "팀 포트폴리오 7분 발표", desc: "1학기 동안 배운 것, 만든 것, 성장한 것을 발표해요.", type: "present" },
            { time: "90 ~ 120분", title: "상장 수여 + 피드백 편지", desc: "팀별, 개인별 어워즈 수여. 선생님의 개별 피드백 편지 배부.", type: "wrap" },
        ],
    },
    {
        week: 15, semester: 1,
        title: "1학기 마무리 + 2학기 미리보기",
        subtitle: "회고 + 방학 과제 안내",
        theme: "review",
        difficultyLevel: 1,
        goals: ["1학기 내용 정리", "방학 중 마케팅 관찰 과제", "2학기 예고"],
        keywords: ["회고", "방학과제", "다짐"],
        activities: [
            { time: "0 ~ 40분", title: "나만의 마케팅 노트 만들기", desc: "1학기 배운 핵심 개념을 나만의 방식으로 정리해요.", type: "learn" },
            { time: "40 ~ 80분", title: "방학 미션 설명", desc: "방학 중 마음에 드는 광고 3개 수집, 마케팅 성공/실패 사례 1개 분석 과제 안내", type: "wrap" },
            { time: "80 ~ 120분", title: "자유 실습 + 게임 시간", desc: "셀스타그램 자유 실습 또는 마케팅 관련 퀴즈 게임으로 즐겁게 마무리!", type: "wrap" },
        ],
    },

    /* ══════════════ 2학기 ══════════════ */
    {
        week: 16, semester: 2,
        title: "스토리가 브랜드를 만든다",
        subtitle: "스토리텔링 마케팅",
        theme: "advanced",
        difficultyLevel: 2,
        goals: ["브랜드 스토리텔링 기법", "영웅의 여정 구조", "감동 마케팅 사례 분석"],
        keywords: ["스토리텔링", "감성마케팅", "브랜드스토리"],
        activities: [
            { time: "0 ~ 30분", title: "광고에 숨겨진 이야기 찾기", desc: "감동적인 광고 영상을 보고 어떤 이야기 구조를 썼는지 분석해요.", type: "warmup" },
            { time: "30 ~ 80분", title: "우리 브랜드 기원 이야기 만들기", desc: "우리 팀 제품이 왜 탄생했는지 이야기를 만들어요. AI와 함께 스토리 완성!", type: "learn" },
            { time: "80 ~ 120분", title: "스토리 콘텐츠 업로드", desc: "브랜드 스토리를 감성적인 게시물로 만들어 셀스타그램에 올려요.", type: "practice" },
        ],
    },
    {
        week: 17, semester: 2,
        title: "영상 콘텐츠 마케팅",
        subtitle: "쇼츠 + 릴스 + 틱톡 전략",
        theme: "advanced",
        difficultyLevel: 2,
        goals: ["숏폼 콘텐츠 트렌드 이해", "후킹 첫 3초 기법", "스마트폰으로 영상 촬영/편집"],
        keywords: ["쇼츠", "릴스", "틱톡", "숏폼", "후킹"],
        activities: [
            { time: "0 ~ 25분", title: "첫 3초의 마법!", desc: "10개의 쇼츠 영상의 첫 3초를 보고 왜 계속 보게 되는지 분석해요.", type: "warmup" },
            { time: "25 ~ 90분", title: "우리 팀 숏폼 영상 촬영", desc: "스마트폰으로 제품 소개 15~30초 영상을 촬영하고 간단하게 편집해봐요.", type: "practice" },
            { time: "90 ~ 120분", title: "영상 셀스타그램 업로드 + 반응 보기", desc: "완성한 영상을 올리고 AI 고객 반응을 함께 감상해요.", type: "wrap" },
        ],
    },
    {
        week: 18, semester: 2,
        title: "AI 마케팅 도구 완전 정복",
        subtitle: "최신 AI 툴 활용 심화",
        theme: "advanced",
        difficultyLevel: 3,
        goals: ["AI 도구 에코시스템 이해", "이미지/영상/텍스트 AI 심화 활용", "AI 프롬프트 최적화"],
        keywords: ["생성AI", "워크플로우", "자동화", "프롬프트엔지니어링"],
        aiTool: "Claude / GPT-4o / Sora / Runway",
        activities: [
            { time: "0 ~ 20분", title: "AI 도구 지도 그리기", desc: "지금 쓸 수 있는 AI 도구들을 카테고리별로 정리해봐요. 어떤 걸 써봤나요?", type: "warmup" },
            { time: "20 ~ 80분", title: "나만의 AI 마케팅 워크플로우 실습", desc: "주제 → AI 텍스트 → AI 이미지 → 최종 게시물까지 전체 플로우를 직접 실습해요.", type: "practice" },
            { time: "80 ~ 120분", title: "AI 활용 꿀팁 공유회", desc: "각자가 발견한 AI 활용 꿀팁을 공유하고, 가장 유용한 팁을 뽑아요!", type: "wrap" },
        ],
    },
    {
        week: 19, semester: 2,
        title: "인플루언서 마케팅",
        subtitle: "크리에이터 협업 전략",
        theme: "advanced",
        difficultyLevel: 2,
        goals: ["인플루언서 유형 분류", "브랜드 콜라보 전략", "마이크로 vs 매크로 인플루언서"],
        keywords: ["인플루언서", "크리에이터", "협업", "UGC", "마이크로"],
        activities: [
            { time: "0 ~ 30분", title: "내가 좋아하는 인플루언서 분석", desc: "좋아하는 크리에이터의 마케팅 방식을 분석해요. 어떤 브랜드와 협업했나요?", type: "warmup" },
            { time: "30 ~ 80분", title: "우리 제품 인플루언서 섭외 기획", desc: "우리 제품에 맞는 가상 인플루언서를 선정하고, 협업 제안서를 작성해봐요.", type: "learn" },
            { time: "80 ~ 120분", title: "직접 인플루언서가 되어보자!", desc: "각 팀원이 1분짜리 제품 홍보 영상을 찍어봐요. 우리가 직접 마이크로 인플루언서!", type: "practice" },
        ],
    },
    {
        week: 20, semester: 2,
        title: "고객 여정을 따라가보자",
        subtitle: "Customer Journey Map",
        theme: "advanced",
        difficultyLevel: 3,
        goals: ["고객 여정 5단계 이해", "각 접점 최적화 전략", "구매 결정 심리"],
        keywords: ["고객여정", "접점", "AIDA", "전환", "리텐션"],
        activities: [
            { time: "0 ~ 25분", title: "나의 최근 구매 여정 돌아보기", desc: "최근에 뭔가를 구매했을 때 어떤 경로로 알게 되고 구매했는지 거슬러 올라가봐요.", type: "warmup" },
            { time: "25 ~ 85분", title: "우리 제품 고객 여정 지도 그리기", desc: "인지 → 관심 → 고려 → 구매 → 재구매 단계별 마케팅 전략을 시각화해요.", type: "learn" },
            { time: "85 ~ 120분", title: "여정의 각 단계에 맞는 콘텐츠 기획", desc: "단계별로 다른 콘텐츠가 필요해요. 우리 팀의 단계별 콘텐츠 계획을 세워요.", type: "practice" },
        ],
    },
    {
        week: 21, semester: 2,
        title: "검색에서 발견되는 마케팅",
        subtitle: "SEO + 검색 마케팅 기초",
        theme: "advanced",
        difficultyLevel: 2,
        goals: ["SEO 기초 개념", "키워드 리서치 방법", "콘텐츠 SEO 최적화"],
        keywords: ["SEO", "키워드", "검색엔진", "네이버SEO", "유튜브SEO"],
        activities: [
            { time: "0 ~ 20분", title: "검색해봐! 우리 제품 찾아지나?", desc: "우리 제품 관련 키워드를 검색하고 어떤 결과가 나오는지 분석해요.", type: "warmup" },
            { time: "20 ~ 80분", title: "키워드 리서치 실습", desc: "우리 제품의 검색 키워드 20개를 발굴하고 경쟁도와 검색량을 분석해요.", type: "learn" },
            { time: "80 ~ 120분", title: "SEO 최적화 게시물 작성", desc: "핵심 키워드를 포함한 게시물을 작성하고 셀스타그램에 올려요.", type: "practice" },
        ],
    },
    {
        week: 22, semester: 2,
        title: "팬을 만드는 뉴스레터",
        subtitle: "이메일 마케팅 + 커뮤니티 빌딩",
        theme: "advanced",
        difficultyLevel: 2,
        goals: ["이메일 마케팅 기초", "오픈율 높이는 제목 작성", "팬덤 커뮤니티 구축 전략"],
        keywords: ["뉴스레터", "이메일", "오픈율", "커뮤니티", "팬덤"],
        activities: [
            { time: "0 ~ 25분", title: "내가 구독하는 뉴스레터 분석", desc: "좋아하는 뉴스레터나 구독 서비스를 소개하고 왜 계속 보는지 이야기해요.", type: "warmup" },
            { time: "25 ~ 80분", title: "우리 브랜드 뉴스레터 첫 호 작성", desc: "브랜드 소식, 마케팅 팁, 프로모션을 담은 뉴스레터 초안을 작성해봐요.", type: "practice" },
            { time: "80 ~ 120분", title: "제목 배틀! 어떤 제목이 클릭될까?", desc: "팀별로 만든 뉴스레터 제목을 공유하고 어떤 게 더 클릭될지 투표해요.", type: "wrap" },
        ],
    },
    {
        week: 23, semester: 2,
        title: "마케팅 예산 전쟁",
        subtitle: "ROAS + 광고 예산 배분 전략",
        theme: "advanced",
        difficultyLevel: 3,
        goals: ["ROAS, CPA, ROMI 심화 이해", "예산 배분 전략", "A/B 테스트 기초"],
        keywords: ["ROAS", "예산", "광고비", "A/B테스트", "ROI"],
        activities: [
            { time: "0 ~ 20분", title: "100만원이 생겼다! 어떻게 쓸까?", desc: "마케팅 예산 100만원을 어디에 얼마씩 쓸지 직관적으로 나눠봐요. 나중에 정답 공개!", type: "warmup" },
            { time: "20 ~ 85분", title: "셀스타그램 ROAS 시뮬레이션", desc: "다양한 예산 배분으로 게시물을 올리고, 어떤 배분이 최고 ROAS를 냈는지 비교해요.", type: "practice" },
            { time: "85 ~ 120분", title: "우리 팀 최적 예산 전략 발표", desc: "시뮬레이션 결과를 바탕으로 최적 예산 전략을 발표해요.", type: "present" },
        ],
    },
    {
        week: 24, semester: 2,
        title: "크리에이터 이코노미의 미래",
        subtitle: "1인 브랜드 + 유튜브 채널 전략",
        theme: "advanced",
        difficultyLevel: 2,
        goals: ["크리에이터 이코노미 이해", "1인 브랜드 구축 방법", "수익화 모델"],
        keywords: ["크리에이터이코노미", "1인미디어", "수익화", "채널전략"],
        activities: [
            { time: "0 ~ 30분", title: "좋아하는 유튜버의 비즈니스 모델 분석", desc: "어떻게 수익을 내는지, 브랜드와 어떻게 협업하는지 분석해봐요.", type: "warmup" },
            { time: "30 ~ 85분", title: "나만의 채널 컨셉 기획", desc: "만약 내가 유튜브/틱톡 채널을 만든다면? 컨셉, 주제, 타겟, 업로드 주기를 기획해봐요.", type: "practice" },
            { time: "85 ~ 120분", title: "채널 기획서 발표 + 구독 투표", desc: "기획서를 발표하고 반 친구들이 구독할 것 같은 채널에 투표해요.", type: "present" },
        ],
    },
    {
        week: 25, semester: 2,
        title: "최종 프로젝트 킥오프",
        subtitle: "2학기 팀 프로젝트 기획",
        theme: "project",
        difficultyLevel: 3,
        goals: ["최종 프로젝트 주제 선정", "발표 형식 및 평가 기준 이해", "역할 분담 확정"],
        keywords: ["최종프로젝트", "기획", "역할분담", "로드맵"],
        activities: [
            { time: "0 ~ 20분", title: "역대 최고의 마케팅 캠페인은?", desc: "지금까지 배운 것 중 가장 인상적인 마케팅 사례를 나눠봐요.", type: "warmup" },
            { time: "20 ~ 80분", title: "최종 프로젝트 기획서 작성", desc: "제품/서비스 선정, 전체 캠페인 전략, 3주 제작 로드맵을 완성해요.", type: "learn" },
            { time: "80 ~ 120분", title: "기획서 발표 + 선생님 피드백", desc: "팀별 기획서를 발표하고 선생님과 함께 방향을 확정해요.", type: "present" },
        ],
    },
    {
        week: 26, semester: 2,
        title: "최종 프로젝트 제작 I",
        subtitle: "캠페인 콘텐츠 집중 제작",
        theme: "project",
        difficultyLevel: 3,
        goals: ["최종 캠페인 콘텐츠 제작 시작", "브랜드 일관성 유지", "퀄리티 업그레이드"],
        keywords: ["제작", "퀄리티", "브랜딩", "캠페인"],
        aiTool: "Claude / Canva / Runway",
        activities: [
            { time: "0 ~ 10분", title: "오늘 목표 선언", desc: "팀별로 오늘 완성할 콘텐츠를 칠판에 써요.", type: "warmup" },
            { time: "10 ~ 110분", title: "최종 프로젝트 집중 제작", desc: "AI 도구를 총동원해 최고 퀄리티의 마케팅 콘텐츠를 제작해요.", type: "practice", tip: "팀 간 협력을 장려하세요. 잘하는 팀이 막히는 팀을 도와줄 수 있어요." },
            { time: "110 ~ 120분", title: "오늘 완성한 것 체크", desc: "오늘 목표 달성 여부를 확인하고 남은 일정을 재조정해요.", type: "wrap" },
        ],
    },
    {
        week: 27, semester: 2,
        title: "최종 프로젝트 제작 II",
        subtitle: "완성 + 최종 점검",
        theme: "project",
        difficultyLevel: 3,
        goals: ["모든 콘텐츠 완성", "발표 자료 준비", "팀 포트폴리오 완성"],
        keywords: ["완성", "발표준비", "포트폴리오"],
        activities: [
            { time: "0 ~ 80분", title: "최종 마무리 제작", desc: "부족한 콘텐츠를 채우고, 발표 자료를 완성해요.", type: "practice" },
            { time: "80 ~ 120분", title: "팀 내 리허설", desc: "발표 연습을 해보고 서로 피드백을 줘요. 최종 발표 전 마지막 점검!", type: "present" },
        ],
    },
    {
        week: 28, semester: 2,
        title: "최종 발표회",
        subtitle: "팀 마케팅 캠페인 최종 발표",
        theme: "project",
        difficultyLevel: 3,
        goals: ["최종 캠페인 발표", "Q&A 대응", "2년 성장 스토리 공유"],
        keywords: ["최종발표", "QA", "성과"],
        activities: [
            { time: "0 ~ 10분", title: "발표 환경 세팅", desc: "발표 순서 확인, 화면 연결, 최종 준비", type: "warmup" },
            { time: "10 ~ 90분", title: "팀별 10분 최종 발표", desc: "마케팅 전략, 캠페인 성과, 배운 점을 발표해요. Q&A 포함!", type: "present" },
            { time: "90 ~ 120분", title: "수료 어워즈", desc: "최고의 팀, 최고의 성장상, 최고의 AI 활용상 등 시상! 모두가 주인공이에요.", type: "wrap" },
        ],
    },
    {
        week: 29, semester: 2,
        title: "마케터로서 나의 미래",
        subtitle: "수료식 + 포트폴리오 완성",
        theme: "review",
        difficultyLevel: 1,
        goals: ["1년 성장 돌아보기", "마케팅 포트폴리오 완성", "앞으로의 방향 설정"],
        keywords: ["수료", "포트폴리오", "미래", "성장"],
        activities: [
            { time: "0 ~ 40분", title: "1년의 여정 하이라이트", desc: "1회차부터 지금까지 만든 최고의 콘텐츠들을 모아 함께 감상해요.", type: "warmup" },
            { time: "40 ~ 90분", title: "내 마케터 포트폴리오 완성", desc: "1년 동안 만든 최고의 작품 5개를 골라 개인 포트폴리오를 완성해요.", type: "practice" },
            { time: "90 ~ 120분", title: "수료증 + 미래 다짐 편지", desc: "수료증을 받고, 1년 뒤의 나에게 편지를 써봐요. 정말 뿌듯한 순간!", type: "wrap" },
        ],
    },
];

export const getSessionByWeek = (week: number): Session | undefined =>
    CURRICULUM.find((s) => s.week === week);

export const THEME_LABELS: Record<Session["theme"], string> = {
    intro:    "오리엔테이션",
    concept:  "개념 학습",
    skill:    "스킬 업",
    campaign: "캠페인 실습",
    review:   "발표·회고",
    advanced: "심화 학습",
    project:  "최종 프로젝트",
};

export const THEME_COLORS: Record<Session["theme"], { color: string; bg: string }> = {
    intro:    { color: "#FF6B35", bg: "#FFF0EB" },
    concept:  { color: "#4361EE", bg: "#EEF1FD" },
    skill:    { color: "#06D6A0", bg: "#E6FBF5" },
    campaign: { color: "#8B5CF6", bg: "#F3EEFF" },
    review:   { color: "#FFC233", bg: "#FFF8E0" },
    advanced: { color: "#EF4444", bg: "#FEF2F2" },
    project:  { color: "#0891B2", bg: "#E0F2FE" },
};

export const ACTIVITY_ICONS: Record<Activity["type"], string> = {
    warmup:  "🔥",
    learn:   "📖",
    practice:"✏️",
    present: "🎤",
    wrap:    "✅",
};
