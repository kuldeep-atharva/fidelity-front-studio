-- Quick Demo Setup for ChatBot
-- Run this to add test cases and see the ChatBot in action

-- First, let's add some test cases including assault cases
INSERT INTO cases (
    case_number, first_name, last_name, date_of_incident, type_of_incident,
    contact_phone, contact_email, case_description, signer_email, reviewer_email, status
) VALUES 
    -- Assault case assigned to admin@fidelity.com
    (
        'CASE-DEMO-001', 
        'John', 
        'Doe', 
        '2025-01-15', 
        'Assault', 
        '555-0123', 
        'admin@fidelity.com', 
        'Workplace assault incident in the parking lot', 
        'signer@fidelity.com', 
        'reviewer@fidelity.com', 
        'In Progress'
    ),
    -- Another assault case
    (
        'CASE-DEMO-002', 
        'Alice', 
        'Brown', 
        '2025-01-12', 
        'Assault', 
        '555-0126', 
        'admin@fidelity.com', 
        'Physical altercation between employees', 
        'admin@fidelity.com', 
        'reviewer@fidelity.com', 
        'Reviewed'
    ),
    -- Some other case types for variety
    (
        'CASE-DEMO-003', 
        'Bob', 
        'Smith', 
        '2025-01-10', 
        'Safety Incident', 
        '555-0124', 
        'admin@fidelity.com', 
        'Slip and fall in cafeteria', 
        'signer@fidelity.com', 
        'reviewer@fidelity.com', 
        'Completed'
    )
ON CONFLICT (case_number) DO NOTHING;

-- Add workflow steps for the first assault case
INSERT INTO case_workflow_steps (
    case_id, step_name, step_order, description, estimated_duration,
    action_type, action_status, is_active, step_category, is_required, tasks
) 
SELECT 
    c.id,
    'Case Assessment',
    1,
    'Initial assessment and documentation of assault incident',
    '30 minutes',
    'Approve',
    'Completed',
    false,
    'User Action',
    true,
    '["Document incident details", "Interview witnesses", "Collect evidence"]'
FROM cases c WHERE c.case_number = 'CASE-DEMO-001'

UNION ALL

SELECT 
    c.id,
    'Investigation',
    2,
    'Detailed investigation of the assault',
    '2-3 days',
    'Review',
    'In Progress',
    true,
    'External Action',
    true,
    '["Interview all parties", "Review security footage", "Gather statements"]'
FROM cases c WHERE c.case_number = 'CASE-DEMO-001'

UNION ALL

SELECT 
    c.id,
    'Legal Review',
    3,
    'Legal team reviews evidence and determines next steps',
    '1-2 days',
    'Review',
    'Pending',
    false,
    'External Action',
    true,
    '["Review legal implications", "Determine charges", "Prepare documentation"]'
FROM cases c WHERE c.case_number = 'CASE-DEMO-001';

-- Verify the demo data
SELECT 
    'Demo cases created:' as message,
    count(*) as case_count
FROM cases 
WHERE case_number LIKE 'CASE-DEMO-%';

SELECT 
    case_number,
    type_of_incident,
    status,
    contact_email,
    first_name || ' ' || last_name as client_name
FROM cases 
WHERE case_number LIKE 'CASE-DEMO-%'
ORDER BY case_number;
