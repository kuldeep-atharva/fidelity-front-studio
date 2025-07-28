// src/utils/ruleEngine.ts
import { fetchOpenAIResponse } from './openaiClient';

export const matchRuleUsingOpenAI = async (caseDetails: any, rules: any[]) => {
  const prompt = `You are a rule engine. From the following rules, choose the most appropriate rule based on the given case details. Return JSON with {rule_id, priority, signer_email, reviewer_email}.

CASE:\n${JSON.stringify(caseDetails, null, 2)}

RULES:\n${rules
    .map(
      (rule, i) => `Rule ${i + 1}: ${rule.name}\nCondition: ${rule.condition}\nPriority: ${rule.priority}\nSigner: ${rule.signer_email}, Reviewer: ${rule.reviewer_email}`
    )
    .join('\n\n')}

Return only JSON.`;

  try {
    const data = await fetchOpenAIResponse(prompt);
    const content = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to fetch OpenAI rule match response', e);
    // fallback default rule (optional)
    const fallback = rules.find((r) => r.priority === 'high') || rules[0];
    return {
      rule_id: fallback?.id || null,
      priority: fallback?.priority || 'low',
      signer_email: fallback?.signer_email || '',
      reviewer_email: fallback?.reviewer_email || '',
    };
  }
};
