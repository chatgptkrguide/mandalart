import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

async function callAI(messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || '';
}

// POST /api/ai/suggest
export async function POST(request: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'AI API가 설정되지 않았습니다' }, { status: 500 });
    }

    const { type, centerGoal, subGoal, period } = await request.json();

    // type: 'sub_goals' | 'tasks'
    if (type === 'sub_goals') {
      // 핵심 목표 → 8개 중위 목표(영역) 추천
      const content = await callAI([
        {
          role: 'system',
          content: `당신은 만다라트(Mandalart) 목표 설정 전문가입니다.

만다라트 구조:
- 중앙: 핵심 목표 (사용자가 입력)
- 중위 목표 8개: 핵심 목표를 이루기 위한 8가지 "영역/카테고리" (당신이 추천)
- 실천 항목: 각 중위 목표 아래에 구체적 행동 (다음 단계에서 별도 생성)

당신은 지금 "중위 목표 8개"를 추천해야 합니다.

핵심 규칙:
- 반드시 정확히 8개
- 2~5글자의 짧은 영역/카테고리 명칭
- 수치나 행동이 아닌 "분야/영역"이어야 함
- 서로 겹치지 않는 독립적인 영역

✅ 올바른 중위 목표 예시:
  핵심 "프로 개발자" → ["기술력", "포트폴리오", "인맥", "체력관리", "영어실력", "독서", "멘탈관리", "재무관리"]
  핵심 "실력있는 사업가" → ["재무관리", "인맥구축", "시장분석", "리더십", "마케팅", "법률지식", "제품개발", "자기관리"]
  핵심 "건강한 몸" → ["유산소", "근력운동", "식단관리", "수면관리", "스트레스관리", "유연성", "체중관리", "정기검진"]

❌ 잘못된 중위 목표 (이렇게 쓰면 안 됨):
  "주 3회 운동" (← 이건 실천 항목)
  "매일 30분 독서" (← 이건 실천 항목)
  "월 1회 네트워킹" (← 이건 실천 항목)

중위 목표는 "무엇을 한다"가 아니라 "어떤 영역을 키운다"입니다.

JSON 배열로만 응답: ["영역1", "영역2", ..., "영역8"]
다른 텍스트 없이 JSON만 출력`
        },
        {
          role: 'user',
          content: `핵심 목표: "${centerGoal}"${period ? `\n기간: ${period}` : ''}\n\n이 목표를 달성하기 위한 8가지 핵심 영역(중위 목표)을 추천해주세요. 수치/행동이 아닌 영역 이름으로 답하세요.`
        }
      ]);

      const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      let parsed: unknown;
      try { parsed = JSON.parse(cleaned); } catch { throw new Error('AI 응답 형식 오류'); }
      if (!Array.isArray(parsed) || !parsed.every(i => typeof i === 'string')) {
        throw new Error('AI 응답이 배열 형식이 아닙니다');
      }
      return NextResponse.json({ suggestions: parsed.slice(0, 8) });

    } else if (type === 'tasks') {
      // 중위 목표 → 8개 실천 항목 추천
      const content = await callAI([
        {
          role: 'system',
          content: `당신은 만다라트(Mandalart) 실천 항목 설계 전문가입니다.

만다라트 구조:
- 핵심 목표 (사용자 설정)
- 중위 목표 = 영역/카테고리 (사용자 설정)
- 실천 항목 8개 = 매주 체크할 수 있는 구체적 행동 (당신이 추천)

당신은 "실천 항목 8개"를 추천해야 합니다.

핵심 규칙 (매우 중요):
1. 반드시 정확히 8개
2. 각 항목은 12글자 이내
3. 반드시 "반복 주기 + 수치 + 행동"을 포함
4. 매주 체크 가능한 항목이어야 함 (1회성 안 됨)
5. 같은 중위 목표 안에서 서로 다른 관점의 실천

반복 주기: "매일", "주 N회", "매주", "격주"
수치: "1권", "30분", "3개", "5명", "2km"
행동: "읽기", "작성", "분석", "연습", "기록"

✅ 좋은 예시 (중위 "재무관리"):
  ["매일 가계부 기록", "주 1회 투자 분석", "매주 절약 3만원", "월 1권 재무서적", "매일 뉴스 10분", "주 1회 수입 점검", "매주 예산 계획", "주 2회 부업 1시간"]

✅ 좋은 예시 (중위 "체력관리"):
  ["주 4회 30분 러닝", "매일 스트레칭 15분", "주 3회 근력운동", "매일 물 2L 마시기", "주 1회 체중 측정", "매일 7시간 수면", "주 2회 등산", "매일 만보 걷기"]

❌ 나쁜 예시:
  "독서하기" (수치 없음)
  "운동" (행동 불명확)
  "네트워킹" (주기 없음)
  "사업계획서 작성" (1회성)

JSON 배열로만 응답: ["항목1", "항목2", ..., "항목8"]
다른 텍스트 없이 JSON만 출력`
        },
        {
          role: 'user',
          content: `핵심 목표: "${centerGoal}"\n중위 목표(영역): "${subGoal}"${period ? `\n기간: ${period}` : ''}\n\n이 영역에서 매주 체크할 수 있는 8가지 실천 항목을 추천해주세요. 반드시 "주기 + 수치 + 행동"을 포함하세요.`
        }
      ]);

      const cleaned2 = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      let parsed2: unknown;
      try { parsed2 = JSON.parse(cleaned2); } catch { throw new Error('AI 응답 형식 오류'); }
      if (!Array.isArray(parsed2) || !parsed2.every(i => typeof i === 'string')) {
        throw new Error('AI 응답이 배열 형식이 아닙니다');
      }
      return NextResponse.json({ suggestions: parsed2.slice(0, 8) });

    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (err: unknown) {
    console.error('AI suggest error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI 추천 실패' },
      { status: 500 }
    );
  }
}
