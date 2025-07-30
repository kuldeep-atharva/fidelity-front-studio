// File: src/utils/ruleEngine.ts

import { fetchOpenAIResponse } from './openaiClient';

export const matchRuleUsingOpenAI = async (
  caseDetails: any,
  rules: any[]
) => {
  const priorityMap: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
  const trimmedRules = rules
    .filter((r) => r.status === 'active')
    .sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority])
    .slice(0, 10)
    .map(({ id, name, description, type_of_incident, priority, condition, signer_email, reviewer_email }) => ({
      id,
      name,
      description,
      type_of_incident,
      priority,
      condition,
      signer_email,
      reviewer_email,
    }));

  const compactPrompt = `
I’m sorry you’ve faced issues with rule matching, and I want to get this right for you. This is a critical task, so please follow these steps with care:

CASE DETAILS:
${JSON.stringify({
    type_of_incident: caseDetails.type_of_incident,
    date_of_incident: caseDetails.date_of_incident,
    contact_email: caseDetails.contact_email,
  }, null, 2)}

AVAILABLE RULES:
${trimmedRules
    .map(
      (r, i) => `Rule ${i + 1}: id=${r.id}, name="${r.name}", description="${r.description}", type_of_incident="${r.type_of_incident}", condition="${r.condition}", priority=${r.priority}, signer_email="${r.signer_email}", reviewer_email="${r.reviewer_email}"`
    )
    .join('\n')}

INSTRUCTIONS:
1. FIRST, find the rule where the type_of_incident exactly matches the case’s type_of_incident. This is the top priority—do not proceed unless this match is found.
2. If multiple rules have the same type_of_incident, use the name, description, and condition to pick the most relevant one. Look for keywords that align with the case context.
3. If no exact type_of_incident match exists, select the rule with the highest priority that has a partially related type_of_incident or condition, but log this as a fallback.
4. Verify your choice: ensure the selected rule’s type_of_incident matches the case’s type_of_incident. If it doesn’t, reconsider and pick the closest match by type_of_incident.
5. Return ONLY the JSON: {"rule_id": "...", "priority": "...", "signer_email": "...", "reviewer_email": "..."} with the chosen rule’s details.

Thank you for your precision—this accuracy is vital for the user’s confidence!
`;

  const response = await fetchOpenAIResponse(compactPrompt);
  try {
    const result = JSON.parse(response);
    console.log('OpenAI Response:', response); // Debug log
    // const matchedRule = trimmedRules.find((r) => r.id === result.rule_id);
    // if (!matchedRule) {
    //   console.warn('No valid rule found, falling back to type-based match');
    //   const fallback = trimmedRules.find((r) => r.type_of_incident === caseDetails.type_of_incident) || trimmedRules[0];
    //   return {
    //     rule_id: fallback.id,
    //     priority: fallback.priority,
    //     signer_email: fallback.signer_email,
    //     reviewer_email: fallback.reviewer_email,
    //   };
    // }
    // if (matchedRule.type_of_incident !== caseDetails.type_of_incident) {
    //   console.warn('Type mismatch detected, overriding with type-based match');
    //   const fallback = trimmedRules.find((r) => r.type_of_incident === caseDetails.type_of_incident) || trimmedRules[0];
    //   return {
    //     rule_id: fallback.id,
    //     priority: fallback.priority,
    //     signer_email: fallback.signer_email,
    //     reviewer_email: fallback.reviewer_email,
    //   };
    // }
    return result;
  } catch (e) {
    const fallback = trimmedRules.find((r) => r.type_of_incident === caseDetails.type_of_incident) || trimmedRules[0];
    return {
      rule_id: fallback?.id,
      priority: fallback?.priority,
      signer_email: fallback?.signer_email,
      reviewer_email: fallback?.reviewer_email,
    };
  }
};
