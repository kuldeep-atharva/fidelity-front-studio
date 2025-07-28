// src/components/RuleMatcher.tsx
import { useEffect, useState } from 'react';
import { matchRuleUsingOpenAI } from '@/utils/ruleEngine';
import { supabase } from '@/utils/supabaseClient';

interface Props {
  caseData: any;
  onAssigned: (result: any) => void;
}

const RuleMatcher = ({ caseData, onAssigned }: Props) => {
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null);

  useEffect(() => {
    const fetchAndMatch = async () => {
      const { data: rules, error } = await supabase.from('rules').select('*');
      if (error || !rules) return;
      const result = await matchRuleUsingOpenAI(caseData, rules);
      setAssignment(result);
      onAssigned(result);
      setLoading(false);
    };
    fetchAndMatch();
  }, []);

  if (loading) return <p>Evaluating rule match using AI…</p>;
  if (!assignment) return <p>No matching rule found.</p>;

  return (
    <div className="p-4 border rounded bg-green-100 text-green-800 mt-4">
      <p><strong>Assigned Rule:</strong> {assignment.rule_id}</p>
      <p><strong>Priority:</strong> {assignment.priority}</p>
      <p><strong>Signer:</strong> {assignment.signer_email}</p>
      <p><strong>Reviewer:</strong> {assignment.reviewer_email}</p>
    </div>
  );
};

export default RuleMatcher;
