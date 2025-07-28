// File: src/utils/openaiClient.ts

export const OPENAI_API_KEY = import.meta.env.VITE_API_OPENAI_API_KEY;
export const OPENAI_API_URL = import.meta.env.VITE_API_OPENAI_BASE_URL;
export const OPENAI_API_MODEL = import.meta.env.VITE_API_OPENAI_MODEL;

export const fetchOpenAIResponse = async (
  prompt: string,
  stream = false
): Promise<any> => {
  const resp = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_API_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a deterministic rule matching engine. Given a short summary of rules and case details, return ONLY JSON with rule_id, priority, signer_email, reviewer_email.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0,
      stream,
    }),
  });

  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}`);
  if (stream && resp.body) return resp.body;
  const data = await resp.json();
  return data.choices?.[0]?.message?.content;
};
