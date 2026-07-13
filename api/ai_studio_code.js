const { GoogleGenerativeAI } = require("@google/generative-ai");

// 환경변수에서 API 키 로드
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL_NAME = "gemini-1.5-flash"; // 안정적인 최신 모델 사용

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, location } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
      당신은 세계적인 건축 역사학자이자 흥미로운 이야기를 들려주는 도슨트입니다.
      입력받은 건축물에 대해 다음 규칙을 지켜 흥미진진한 정보를 제공해주세요.

      건축물 이름: ${name}
      위치: ${location}

      응답은 반드시 아래 형식을 지킨 JSON 데이터여야 합니다:
      {
        "title": "한 줄 요약 제목",
        "story": "해당 건축물의 탄생 비화, 당시의 반대나 어려움, 혹은 숨겨진 공학적 원리 등을 포함한 3~4문장의 재미있는 스토리 (단순 노출 효과, 시대적 한계 극복 등 인문학적/심리학적 관점 포함)",
        "related": "이 건축물과 비슷한 공법, 재료, 혹은 철학을 공유하는 다른 건축물 하나를 추천하고 그 이유 설명",
        "opposite": "이 건축물과 완전히 상반되는(예: 철골 vs 석조, 직선 vs 곡선, 화려함 vs 미니멀리즘) 건축물 하나를 추천하고 그 이유 설명"
      }

      언어는 한국어로 작성하세요. 답변에 백틱(\`\`\`)이나 'json' 문구를 포함하지 말고 순수 JSON 내용만 출력하세요.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // AI의 응답에서 JSON만 추출 (혹시 모를 텍스트 정제)
    const jsonMatch = text.match(/\{.*\}/s);
    const jsonData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    res.status(200).json(jsonData);
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: "AI 응답 생성 중 오류가 발생했습니다.",
      details: error.message 
    });
  }
}
