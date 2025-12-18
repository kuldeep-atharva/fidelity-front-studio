-- Supabase Schema for Fidelity Front Studio
-- Generated based on current implementation analysis

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Signer', 'Reviewer', 'Admin', 'User')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rules table
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    condition TEXT,
    category TEXT NOT NULL CHECK (category IN ('workflow', 'security', 'notification', 'validation')),
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    signer_email TEXT,
    reviewer_email TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing', 'disabled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cases table
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_incident DATE,
    type_of_incident TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT NOT NULL,
    case_description TEXT,
    pdf_url TEXT,
    signer_email TEXT,
    reviewer_email TEXT,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN (
        'New', 'Draft', 'Submitted', 'Pending', 'In Progress', 'Reviewed', 'Signed', 
        'Completed', 'Rejected', 'Rejected by Reviewer', 'Rejected by Signer'
    )),
    rule_applied UUID REFERENCES rules(id),
    signcare_doc_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case workflow steps table
CREATE TABLE case_workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    step_name TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    description TEXT,
    estimated_duration TEXT,
    depends_on_step_id UUID REFERENCES case_workflow_steps(id),
    action_type TEXT CHECK (action_type IN ('Approve', 'Review', 'Sign', 'Submit', 'Process')),
    action_status TEXT NOT NULL DEFAULT 'Pending' CHECK (action_status IN ('Pending', 'Completed', 'Rejected', 'In Progress')),
    action_timestamp TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    tasks TEXT, -- JSON string array
    step_category TEXT CHECK (step_category IN ('User Action', 'External Action', 'System Action')),
    is_required BOOLEAN DEFAULT TRUE,
    action_metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Rules indexes
CREATE INDEX idx_rules_status ON rules(status);
CREATE INDEX idx_rules_category ON rules(category);
CREATE INDEX idx_rules_priority ON rules(priority);
CREATE INDEX idx_rules_signer_email ON rules(signer_email);
CREATE INDEX idx_rules_reviewer_email ON rules(reviewer_email);

-- Cases indexes
CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_type_of_incident ON cases(type_of_incident);
CREATE INDEX idx_cases_contact_email ON cases(contact_email);
CREATE INDEX idx_cases_signer_email ON cases(signer_email);
CREATE INDEX idx_cases_reviewer_email ON cases(reviewer_email);
CREATE INDEX idx_cases_created_at ON cases(created_at);
CREATE INDEX idx_cases_rule_applied ON cases(rule_applied);
CREATE INDEX idx_cases_signcare_doc_id ON cases(signcare_doc_id);

-- Case workflow steps indexes
CREATE INDEX idx_case_workflow_steps_case_id ON case_workflow_steps(case_id);
CREATE INDEX idx_case_workflow_steps_user_id ON case_workflow_steps(user_id);
CREATE INDEX idx_case_workflow_steps_step_name ON case_workflow_steps(step_name);
CREATE INDEX idx_case_workflow_steps_action_status ON case_workflow_steps(action_status);
CREATE INDEX idx_case_workflow_steps_step_order ON case_workflow_steps(step_order);
CREATE INDEX idx_case_workflow_steps_is_active ON case_workflow_steps(is_active);
CREATE INDEX idx_case_workflow_steps_depends_on ON case_workflow_steps(depends_on_step_id);
CREATE INDEX idx_case_workflow_steps_action_type ON case_workflow_steps(action_type);
CREATE INDEX idx_case_workflow_steps_step_category ON case_workflow_steps(step_category);

-- Composite indexes for common queries
CREATE INDEX idx_cases_status_created_at ON cases(status, created_at);
CREATE INDEX idx_workflow_case_step_order ON case_workflow_steps(case_id, step_order);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_workflow_steps_updated_at BEFORE UPDATE ON case_workflow_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- OPTION 1: DISABLE RLS (for current table-based auth approach)
-- Since your app uses direct table queries instead of Supabase Auth,
-- we'll disable RLS for now. You can enable it later when you migrate to Supabase Auth.

-- Uncomment these lines to disable RLS entirely:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE rules DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE case_workflow_steps DISABLE ROW LEVEL SECURITY;

-- OPTION 2: PERMISSIVE POLICIES (current default)
-- Enable RLS but with permissive policies that allow your current auth approach

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_workflow_steps ENABLE ROW LEVEL SECURITY;

-- Permissive policies for current implementation
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on rules" ON rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on cases" ON cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on case_workflow_steps" ON case_workflow_steps FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- FUTURE: SUPABASE AUTH INTEGRATION
-- =============================================
-- When you're ready to use Supabase Auth, replace the above policies with these:

/*
-- Users policies with proper auth
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Service role can manage all users
CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Rules policies
CREATE POLICY "Users can view active rules" ON rules
    FOR SELECT USING (status = 'active');

CREATE POLICY "Service role can manage all rules" ON rules
    FOR ALL USING (auth.role() = 'service_role');

-- Cases policies  
CREATE POLICY "Users can view cases assigned to them" ON cases
    FOR SELECT USING (
        signer_email = (SELECT email FROM users WHERE id = auth.uid()) OR
        reviewer_email = (SELECT email FROM users WHERE id = auth.uid()) OR
        contact_email = (SELECT email FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can create cases" ON cases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage all cases" ON cases
    FOR ALL USING (auth.role() = 'service_role');

-- Case workflow steps policies
CREATE POLICY "Users can view workflow steps for accessible cases" ON case_workflow_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE id = case_id AND (
                signer_email = (SELECT email FROM users WHERE id = auth.uid()) OR
                reviewer_email = (SELECT email FROM users WHERE id = auth.uid()) OR
                contact_email = (SELECT email FROM users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Service role can manage all workflow steps" ON case_workflow_steps
    FOR ALL USING (auth.role() = 'service_role');
*/

-- =============================================
-- SAMPLE DATA (Optional - for development)
-- =============================================

-- Insert sample users
INSERT INTO users (full_name, email, role) VALUES
('Admin User', 'admin@fidelity.com', 'Admin'),
('John Signer', 'signer@fidelity.com', 'Signer'),
('Jane Reviewer', 'reviewer@fidelity.com', 'Reviewer');

-- Insert sample rules
INSERT INTO rules (name, description, category, priority, signer_email, reviewer_email, status) VALUES
('Default Assignment Rule', 'Default rule for case assignment', 'workflow', 'medium', 'signer@fidelity.com', 'reviewer@fidelity.com', 'active'),
('High Priority Security Rule', 'Rule for high priority security incidents', 'security', 'high', 'signer@fidelity.com', 'reviewer@fidelity.com', 'active');

-- =============================================
-- VIEWS (Optional - for reporting)
-- =============================================

-- Cases with rule information
CREATE VIEW cases_with_rules AS
SELECT 
    c.*,
    r.name as rule_name,
    r.description as rule_description,
    r.category as rule_category,
    r.priority as rule_priority
FROM cases c
LEFT JOIN rules r ON c.rule_applied = r.id;

-- Case workflow summary
CREATE VIEW case_workflow_summary AS
SELECT 
    c.id as case_id,
    c.case_number,
    c.status as case_status,
    COUNT(cws.id) as total_steps,
    COUNT(CASE WHEN cws.action_status = 'Completed' THEN 1 END) as completed_steps,
    COUNT(CASE WHEN cws.action_status = 'Pending' THEN 1 END) as pending_steps,
    COUNT(CASE WHEN cws.action_status = 'Rejected' THEN 1 END) as rejected_steps
FROM cases c
LEFT JOIN case_workflow_steps cws ON c.id = cws.case_id
GROUP BY c.id, c.case_number, c.status;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE users IS 'User accounts with role-based access';
COMMENT ON TABLE rules IS 'Business rules for case assignment and workflow';
COMMENT ON TABLE cases IS 'Incident cases with workflow management';
COMMENT ON TABLE case_workflow_steps IS 'Individual workflow steps for each case with dependencies and detailed metadata';

COMMENT ON COLUMN cases.signcare_doc_id IS 'External SignCare document ID for e-signature workflow';
COMMENT ON COLUMN case_workflow_steps.user_id IS 'User assigned to perform this workflow step';
COMMENT ON COLUMN case_workflow_steps.description IS 'Detailed description of what this step involves';
COMMENT ON COLUMN case_workflow_steps.estimated_duration IS 'Estimated time to complete this step (e.g., "15 min", "1-2 days")';
COMMENT ON COLUMN case_workflow_steps.depends_on_step_id IS 'Step that must be completed before this one can begin';
COMMENT ON COLUMN case_workflow_steps.action_type IS 'Type of action required (Approve, Review, Sign, Submit, Process)';
COMMENT ON COLUMN case_workflow_steps.tasks IS 'JSON string array of specific tasks within this step';
COMMENT ON COLUMN case_workflow_steps.step_category IS 'Category of step: User Action, External Action, or System Action';
COMMENT ON COLUMN case_workflow_steps.is_required IS 'Whether this step is mandatory for case completion';
COMMENT ON COLUMN case_workflow_steps.action_metadata IS 'JSON metadata for workflow actions, including external service references';
COMMENT ON COLUMN case_workflow_steps.is_active IS 'Indicates if this workflow step is currently active/available for action';
