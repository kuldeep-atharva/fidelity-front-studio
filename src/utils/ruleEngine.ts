// File: src/utils/ruleEngine.ts

import { fetchOpenAIResponse } from './openaiClient';

export const matchRuleUsingOpenAI = async (
  caseDetails: any,
  rules: any[]
) => {
  // Reduce to 10 top priority rules and only keep short text
  const trimmedRules = rules
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10)
    .map(({ id, type_of_incident, priority, signer_email, reviewer_email }) => ({
      id,
      type_of_incident,
      priority,
      signer_email,
      reviewer_email,
    }));

  const compactPrompt = `
CASE:
${JSON.stringify({
    type_of_incident: caseDetails.type_of_incident,
    date_of_incident: caseDetails.date_of_incident,
    contact_email: caseDetails.contact_email,
  }, null, 2)}

RULES:
${trimmedRules
    .map(
      (r, i) => `Rule ${i + 1}: id=${r.id}, type=${r.type_of_incident}, priority=${r.priority}, signer=${r.signer_email}, reviewer=${r.reviewer_email}`
    )
    .join('\n')}

Return JSON: {"rule_id": "...", "priority":"...", "signer_email":"...", "reviewer_email":"..."}
`;

  const response = await fetchOpenAIResponse(compactPrompt);
  try {
    return JSON.parse(response);
  } catch {
    const fallback = trimmedRules[0];
    return {
      rule_id: fallback?.id,
      priority: fallback?.priority,
      signer_email: fallback?.signer_email,
      reviewer_email: fallback?.reviewer_email,
    };
  }
};
