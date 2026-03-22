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
      // 핵심 목표 → 8개 하위 목표 추천
      const content = await callAI([
        {
          role: 'system',
          content: `당신은 만다라트(Mandalart) 목표 설정 전문가입니다.
사용자가 핵심 목표를 제시하면, 그 목표를 달성하기 위한 8가지 핵심 영역(하위 목표)을 추천합니다.

규칙:
- 반드시 정확히 8개를 추천
- 각 항목은 10글자 이내로 간결하게
- 서로 겹치지 않는 독립적인 영역
- 구체적이고 측정 가능한 영역으로 (예: "체력" → "주 4회 운동")
- 숫자/수치를 포함할 수 있으면 포함
- JSON 배열로만 응답: ["항목1", "항목2", ..., "항목8"]
- 다른 텍스트 없이 JSON만 출력`
        },
        {
          role: 'user',
          content: `핵심 목표: "${centerGoal}"${period ? `\n기간: ${period}` : ''}\n\n이 목표를 달성하기 위한 8가지 하위 목표를 추천해주세요.`
        }
      ]);

      const parsed = JSON.parse(content.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      return NextResponse.json({ suggestions: parsed });

    } else if (type === 'tasks') {
      // 하위 목표 → 8개 실천 항목 추천
      const content = await callAI([
        {
          role: 'system',
          content: `당신은 만다라트(Mandalart) 실천 항목 설계 전문가입니다.
사용자가 핵심 목표와 하위 목표를 제시하면, 해당 하위 목표에 대한 8가지 구체적 실천 항목을 추천합니다.

핵심 규칙 (매우 중요):
1. 반드시 정확히 8개를 추천
2. 각 항목은 15글자 이내
3. 반드시 수치/횟수를 포함 (예: "3권", "주 5회", "매일 30분", "5명에게")
4. 반드시 구체적 행동을 포함 (예: "읽기", "작성하기", "질문하기", "기록하기")
5. "매주" 또는 "매일" 등 반복 주기를 포함할 수 있으면 포함
6. 모호한 표현 금지 (❌ "독서하기" → ✅ "매주 책 1권 완독")
7. 측정 가능해야 함 (체크할 수 있는 항목)

나쁜 예시: "독서하기", "운동하기", "공부하기", "네트워킹"
좋은 예시: "매주 책 1권 완독", "주 4회 30분 러닝", "매일 알고리즘 2문제", "매주 새로운 3명과 대화"

JSON 배열로만 응답: ["항목1", "항목2", ..., "항목8"]
다른 텍스트 없이 JSON만 출력`
        },
        {
          role: 'user',
          content: `핵심 목표: "${centerGoal}"\n하위 목표: "${subGoal}"${period ? `\n기간: ${period}` : ''}\n\n이 하위 목표를 달성하기 위한 8가지 구체적 실천 항목을 추천해주세요. 반드시 수치와 행동이 포함되어야 합니다.`
        }
      ]);

      const parsed = JSON.parse(content.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      return NextResponse.json({ suggestions: parsed });

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
