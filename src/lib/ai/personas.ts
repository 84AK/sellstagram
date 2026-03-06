/**
 * 2026 Sellstagram Virtual Customer Personas
 */

export interface Persona {
    id: string;
    name: string;
    age: string;
    description: string;
    interests: string[];
    style: "slang" | "polite" | "enthusiastic" | "skeptical";
    reactionProbability: number;
}

export const CUSTOMER_PERSONAS: Persona[] = [
    {
        id: "p1",
        name: "민지(Minji)",
        age: "18",
        description: "트렌드에 민감한 고등학생, 숏폼 콘텐츠를 좋아함.",
        interests: ["패션", "테크", "K-POP"],
        style: "slang",
        reactionProbability: 0.8
    },
    {
        id: "p2",
        name: "재현(Jaehyun)",
        age: "24",
        description: "환경 보호에 관심이 많은 대학생 얼리어답터.",
        interests: ["환경", "지속가능성", "비건"],
        style: "enthusiastic",
        reactionProbability: 0.6
    },
    {
        id: "p3",
        name: "서준(Seojun)",
        age: "30",
        description: "꼼꼼한 리뷰어, 가성비를 중요하게 생각함.",
        interests: ["테크", "리뷰", "가성비"],
        style: "skeptical",
        reactionProbability: 0.4
    },
    {
        id: "p4",
        name: "유진(Yujin)",
        age: "17",
        description: "예쁜 디자인을 선호하는 고등학생.",
        interests: ["디자인", "미술", "다이어리 꾸미기"],
        style: "polite",
        reactionProbability: 0.7
    }
];
