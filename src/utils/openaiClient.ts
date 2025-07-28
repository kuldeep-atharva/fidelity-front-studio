// src/utils/openaiClient.ts
export const OPENAI_API_KEY = import.meta.env.VITE_API_OPENAI_API_KEY;
export const OPENAI_API_URL = import.meta.env.VITE_API_OPENAI_BASE_URL;
export const OPENAI_API_MODEL = import.meta.env.VITE_API_OPENAI_MODEL;

export const fetchOpenAIResponse = async (
  message: string,
  messages: { type: 'user' | 'assistant'; content: string }[] = [],
  stream: boolean = false
): Promise<any> => {
  const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
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
            'You are an intelligent rule engine. You must evaluate case details against a set of business rules and return a JSON with rule_id, priority, signer_email, and reviewer_email based on the best match. Be concise and deterministic.',
        },
        ...messages.map((msg) => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0,
      stream,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.statusText}`);
  }

  if (stream && response.body) {
    // For advanced use: handle ReadableStream here if needed
    return response.body;
  } else {
    const data = await response.json();
    return data;
  }
};