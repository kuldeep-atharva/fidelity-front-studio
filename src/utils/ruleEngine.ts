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
    .map(({ id, name, description, priority, condition, signer_email, reviewer_email }) => ({
      id,
      name,
      description,
      priority,
      condition,
      signer_email,
      reviewer_email,
    }));

  const compactPrompt = `
Hey there! I’m helping a team match a case to the best rule, and I need your sharp instincts to make it happen. The case has a type_of_incident, and we’ll use the rules’ name, description, and condition to find the best fit. Let’s dive in!

CASE DETAILS:
${JSON.stringify({
    type_of_incident: caseDetails.type_of_incident,
    date_of_incident: caseDetails.date_of_incident,
    contact_email: caseDetails.contact_email,
    case_description: caseDetails.case_description,
  }, null, 2)}

AVAILABLE RULES:
${trimmedRules
    .map(
      (r, i) => `Rule ${i + 1}: id=${r.id}, name="${r.name}", description="${r.description}", condition="${r.condition}", priority=${r.priority}, signer_email="${r.signer_email}", reviewer_email="${r.reviewer_email}"`
    )
    .join('\n')}

INSTRUCTIONS:
1. Find the rule where the name, description, or condition best aligns with the case’s type_of_incident and case_description. Look for keywords or themes in the rule’s name, description, or condition that match the case’s type_of_incident (e.g., if the case’s type_of_incident is "data breach," favor rules with "breach" or "security" in the name, description, or condition).
2. If multiple rules seem relevant, pick the one with the strongest keyword or thematic match to the case’s type_of_incident and description. Use your judgment like you’re helping a teammate choose the best option.
3. If no rules align well with the case’s type_of_incident and case_description, select the highest-priority rule as a fallback. If that still doesn’t feel right, pick any rule to keep things moving.
4. Double-check your choice: does the rule’s name, description, or condition reasonably relate to the case’s type_of_incident and case_description? If not, note why you chose a fallback.
5. Return ONLY this JSON format:
   {
     "rule_id": "...",
     "priority": "...",
     "signer_email": "...",
     "reviewer_email": "...",
     "reason": "Explain why you chose this rule, e.g., 'Name and description strongly match type_of_incident and case_description' or 'No strong match, so I picked a random rule.'"
   }

Thanks for your help—let’s make this quick and accurate!
`;

  const response = await fetchOpenAIResponse(compactPrompt);
  try {
    const result = JSON.parse(response);
    console.log('OpenAI Response:', response);
    return result;
  } catch (e) {
    // If no match is found, pick any rule from trimmedRules (randomly) and include a reason
    const fallback = trimmedRules[Math.floor(Math.random() * trimmedRules.length)] || trimmedRules[0];
    return {
      rule_id: fallback?.id,
      priority: fallback?.priority,
      signer_email: fallback?.signer_email,
      reviewer_email: fallback?.reviewer_email,
      reason: 'No strong match found for type_of_incident in name, description, or condition, so I picked a random rule as a fallback.',
    };
  }
};
