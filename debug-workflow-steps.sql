-- Debug Workflow Steps - Find issues with active step detection
-- Run this in your Supabase SQL editor to analyze workflow step problems

-- 1. Check all workflow steps with their current states
SELECT 
    'WORKFLOW STEPS ANALYSIS' as section,
    NULL as case_number,
    NULL as step_order,
    NULL as step_name,
    NULL as action_status,
    NULL as is_active,
    NULL as estimated_duration

UNION ALL

SELECT 
    '---',
    c.case_number,
    cws.step_order::text,
    cws.step_name,
    cws.action_status,
    cws.is_active::text,
    cws.estimated_duration
FROM cases c
JOIN case_workflow_steps cws ON c.id = cws.case_id
ORDER BY c.case_number, cws.step_order;

-- 2. Find cases with multiple active steps (PROBLEM!)
SELECT 
    'CASES WITH MULTIPLE ACTIVE STEPS:' as issue_type,
    c.case_number,
    count(*) as active_steps_count,
    string_agg(cws.step_name, ', ') as active_step_names
FROM cases c
JOIN case_workflow_steps cws ON c.id = cws.case_id
WHERE cws.is_active = true
GROUP BY c.case_number, c.id
HAVING count(*) > 1
ORDER BY c.case_number;

-- 3. Find cases with NO active steps
SELECT 
    'CASES WITH NO ACTIVE STEPS:' as issue_type,
    c.case_number,
    c.status as case_status,
    count(cws.id) as total_steps,
    count(CASE WHEN cws.action_status = 'Completed' THEN 1 END) as completed_steps
FROM cases c
LEFT JOIN case_workflow_steps cws ON c.id = cws.case_id
WHERE c.id NOT IN (
    SELECT DISTINCT case_id 
    FROM case_workflow_steps 
    WHERE is_active = true
)
GROUP BY c.case_number, c.id, c.status
ORDER BY c.case_number;

-- 4. Check step ordering issues
SELECT 
    'STEP ORDERING CHECK:' as check_type,
    c.case_number,
    cws.step_order,
    cws.step_name,
    cws.action_status,
    cws.is_active,
    CASE 
        WHEN cws.step_order != ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY cws.step_order) 
        THEN 'ORDER_ISSUE' 
        ELSE 'OK' 
    END as order_status
FROM cases c
JOIN case_workflow_steps cws ON c.id = cws.case_id
ORDER BY c.case_number, cws.step_order;

-- 5. Suggested fixes for common issues
SELECT 
    'SUGGESTED FIXES:' as section,
    NULL as issue,
    NULL as fix_sql

UNION ALL

SELECT 
    'Multiple Active Steps',
    'Set only first incomplete step as active',
    'UPDATE case_workflow_steps SET is_active = false; -- Reset all first'

UNION ALL

SELECT 
    'No Active Steps',
    'Set first incomplete step as active',
    'See individual case fixes below'

UNION ALL

SELECT 
    'Wrong Step Active',
    'Use status-based logic instead of is_active flag',
    'Use getCurrentStep() method in code';

-- 6. Generate fix SQL for each case with issues
SELECT 
    'FIX SQL FOR CASE: ' || c.case_number as fix_section,
    'UPDATE case_workflow_steps SET is_active = false WHERE case_id = ''' || c.id || ''';' as reset_sql
FROM cases c
WHERE c.id IN (
    SELECT case_id 
    FROM case_workflow_steps 
    WHERE is_active = true 
    GROUP BY case_id 
    HAVING count(*) > 1
)

UNION ALL

SELECT 
    'THEN SET CORRECT ACTIVE STEP:',
    'UPDATE case_workflow_steps SET is_active = true WHERE case_id = ''' || c.id || ''' AND step_order = ' || min_incomplete.step_order || ';'
FROM cases c
JOIN (
    SELECT 
        case_id,
        MIN(step_order) as step_order
    FROM case_workflow_steps 
    WHERE action_status != 'Completed'
    GROUP BY case_id
) min_incomplete ON c.id = min_incomplete.case_id
WHERE c.id IN (
    SELECT case_id 
    FROM case_workflow_steps 
    WHERE is_active = true 
    GROUP BY case_id 
    HAVING count(*) > 1
);

-- 7. Quick diagnostic summary
SELECT 
    'DIAGNOSTIC SUMMARY:' as summary,
    count(DISTINCT c.id) as total_cases,
    count(DISTINCT cws.case_id) as cases_with_steps,
    count(*) as total_steps,
    count(CASE WHEN cws.is_active THEN 1 END) as active_steps,
    count(CASE WHEN cws.action_status = 'Completed' THEN 1 END) as completed_steps
FROM cases c
LEFT JOIN case_workflow_steps cws ON c.id = cws.case_id;

