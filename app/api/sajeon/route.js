import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 문화재청 공공데이터 API 호출
async function fetchHeritageData(keyword) {
  const apiKey = process.env.HERITAGE_API_KEY;
  if (!apiKey || apiKey === "your_heritage_api_key_here") return [];

  try {
    const url = `http://www.cha.go.kr/cha/SearchKindOpenapiList.do?ccbaKdcd=&ccbaCtcd=&pageUnit=5&pageIndex=1&ccbaMnm1=${encodeURIComponent(keyword)}&apiKey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const text = await res.text();

    // XML 파싱 (간단 정규식)
    const items = [];
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of itemMatches) {
      const item = match[1];
      const name = item.match(/<ccbaMnm1>(.*?)<\/ccbaMnm1>/)?.[1] || "";
      const type = item.match(/<ccbaKdcd>(.*?)<\/ccbaKdcd>/)?.[1] || "";
      const location = item.match(/<ccbaLcad>(.*?)<\/ccbaLcad>/)?.[1] || "";
      const sn = item.match(/<ccbaCpno>(.*?)<\/ccbaCpno>/)?.[1] || "";
      if (name) items.push({ name, type, location, sn });
    }
    return items.slice(0, 3);
  } catch {
    return [];
  }
}

export async function POST(request) {
  try {
    const { question, era, category } = await request.json();

    if (!question?.trim()) {
      return Response.json({ error: "질문을 입력해주세요." }, { status: 400 });
    }

    // 문화재 데이터 병렬 조회
    const keywords = extractKeywords(question, category);
    const heritageData = await Promise.all(
      keywords.map((kw) => fetchHeritageData(kw))
    ).then((results) => results.flat().slice(0, 4));

    const heritageContext =
      heritageData.length > 0
        ? `\n\n[문화재청 공공데이터 연동 결과]\n${heritageData
            .map(
              (h) =>
                `- ${h.name}${h.location ? ` (소재지: ${h.location})` : ""}`
            )
            .join("\n")}`
        : "";

    const systemPrompt = `당신은 '사관AI'입니다. 한국 역사 웹소설 창작자를 위한 전문 고증 어시스턴트로, 문화재청과 국립중앙박물관의 공공데이터를 기반으로 신뢰할 수 있는 역사 정보를 제공합니다.

역할:
- 복식, 관직, 제도, 건축, 음식, 예절 등 역사적 고증 정보 제공
- 웹소설 창작에 즉시 활용 가능한 구체적 묘사 예시 제공
- 시대적 맥락과 사회구조를 쉽게 설명
- 정확하지 않은 부분은 솔직하게 인정

답변 형식:
1. **핵심 고증 정보** (3~5줄 요약)
2. **창작 활용 예시** (실제 웹소설 문장 1~2개)
3. **주의사항** (자주 틀리는 오류 1가지)

언어: 한국어, 친근하고 명확하게
${era ? `\n설정 시대: ${era}` : ""}${heritageContext}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
    });

    const answer = response.content[0].text;

    return Response.json({
      answer,
      heritageItems: heritageData,
      usedData: heritageData.length > 0,
    });
  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      { error: error?.message || "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}

function extractKeywords(question, category) {
  const keywords = [];
  // 복식 관련
  if (
    question.includes("옷") ||
    question.includes("복식") ||
    question.includes("관복") ||
    question.includes("의복")
  ) {
    keywords.push("복식");
  }
  // 관직 관련
  if (
    question.includes("관직") ||
    question.includes("벼슬") ||
    question.includes("대감") ||
    question.includes("영의정")
  ) {
    keywords.push("관복");
  }
  // 건축 관련
  if (
    question.includes("궁") ||
    question.includes("전") ||
    question.includes("집") ||
    question.includes("건물")
  ) {
    keywords.push("궁궐");
  }
  // 카테고리 기반
  if (category === "복식") keywords.push("복식");
  if (category === "건축") keywords.push("궁궐");
  if (category === "무기") keywords.push("무기");

  return keywords.length > 0 ? keywords : ["조선"];
}
