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
            'You are a highly accurate rule matching engine. Your task is to select the best rule based on the case type_of_incident, strictly prioritizing an exact match with the rule\'s type_of_incident. Use name, description, and condition only as secondary context if multiple rules match the type_of_incident. Return ONLY a JSON object with rule_id, priority, signer_email, and reviewer_email.',
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
