import { NextResponse } from "next/server";
import { askGemini, GeminiError } from "@/lib/ai/gemini";

type Platform = "instagram" | "blog" | "youtube" | "twitter";

function buildPrompt(platform: Platform, topic: string, content: string): string {
    const base = `주제: ${topic}\n내용: ${content}`;

    switch (platform) {
        case "instagram":
            return `당신은 인스타그램 콘텐츠 전문가입니다. 아래 내용을 매력적인 인스타그램 캡션으로 변환해주세요.

${base}

요구사항:
- 이모지를 풍부하게 사용
- 2-3줄의 짧고 감성적인 메인 캡션
- 관련 해시태그 10개 포함
- 친근하고 트렌디한 한국어 톤

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"converted": "캡션 전체 텍스트 (해시태그 포함)", "tips": "인스타그램 최적화 팁 1-2줄"}`;

        case "blog":
            return `당신은 블로그 콘텐츠 전문가입니다. 아래 내용을 네이버 블로그 포스팅 초안으로 변환해주세요.

${base}

요구사항:
- 제목 1개 (눈에 띄는 제목)
- 소제목 2-3개 포함
- 총 500자 내외의 본문
- 마크다운 형식 (## 소제목, **강조** 등)
- 정보성 있고 읽기 쉬운 한국어

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"converted": "마크다운 블로그 포스팅 전체", "tips": "블로그 SEO 및 가독성 팁 1-2줄"}`;

        case "youtube":
            return `당신은 유튜브 쇼츠 스크립트 전문가입니다. 아래 내용을 유튜브 쇼츠 스크립트로 변환해주세요.

${base}

요구사항:
- 훅(Hook) → 본문 → CTA(콜투액션) 3단계 구조
- 60초 분량 (약 150-200단어)
- 말하는 톤, 자연스러운 구어체
- 시청자를 끌어당기는 오프닝
- 구독/좋아요 유도로 마무리

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"converted": "스크립트 전체 (단계 구분 포함)", "tips": "쇼츠 성과 높이는 팁 1-2줄"}`;

        case "twitter":
            return `당신은 X(트위터) 콘텐츠 전문가입니다. 아래 내용을 X 최적화 게시글로 변환해주세요.

${base}

요구사항:
- 280자 이내 (반드시 준수)
- 핵심 메시지만 담아 임팩트 있게
- 트렌디하고 반응 유도하는 톤
- 해시태그 3개 이내
- 질문이나 의견 유도로 참여 촉진

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"converted": "트위터 게시글 전체 (해시태그 포함)", "tips": "X 알고리즘 활용 팁 1-2줄"}`;
    }
}

export async function POST(request: Request) {
    try {
        const { content, topic, platform } = await request.json() as {
            content: string;
            topic: string;
            platform: Platform;
        };

        if (!content || !platform) {
            return NextResponse.json({ error: "content와 platform은 필수입니다." }, { status: 400 });
        }

        const prompt = buildPrompt(platform, topic ?? "", content);
        const raw = await askGemini(prompt);

        // JSON 코드블록 제거 후 파싱
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned) as { converted: string; tips: string };

        return NextResponse.json({ ok: true, converted: parsed.converted, tips: parsed.tips });
    } catch (error) {
        if (error instanceof GeminiError) {
            const status = error.type === "quota" ? 429 : error.type === "invalid_key" ? 403 : 500;
            return NextResponse.json({ ok: false, error: error.userMessage, errorType: error.type }, { status });
        }
        if (error instanceof SyntaxError) {
            return NextResponse.json({ ok: false, error: "AI 응답을 파싱하는 데 실패했어요. 다시 시도해주세요." }, { status: 500 });
        }
        console.error("Convert API Error:", error);
        return NextResponse.json({ ok: false, error: "AI가 잠시 쉬고 있어요. 조금 후에 다시 시도해주세요." }, { status: 500 });
    }
}
