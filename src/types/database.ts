// Database type definitions for Supabase schema
// Auto-generated types based on the database schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: 'Signer' | 'Reviewer' | 'Admin' | 'User';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          role: 'Signer' | 'Reviewer' | 'Admin' | 'User';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: 'Signer' | 'Reviewer' | 'Admin' | 'User';
          created_at?: string;
          updated_at?: string;
        };
      };
      rules: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          condition: string | null;
          category: 'workflow' | 'security' | 'notification' | 'validation';
          priority: 'high' | 'medium' | 'low';
          signer_email: string | null;
          reviewer_email: string | null;
          status: 'active' | 'inactive' | 'testing' | 'disabled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          condition?: string | null;
          category: 'workflow' | 'security' | 'notification' | 'validation';
          priority: 'high' | 'medium' | 'low';
          signer_email?: string | null;
          reviewer_email?: string | null;
          status?: 'active' | 'inactive' | 'testing' | 'disabled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          condition?: string | null;
          category?: 'workflow' | 'security' | 'notification' | 'validation';
          priority?: 'high' | 'medium' | 'low';
          signer_email?: string | null;
          reviewer_email?: string | null;
          status?: 'active' | 'inactive' | 'testing' | 'disabled';
          created_at?: string;
          updated_at?: string;
        };
      };
      cases: {
        Row: {
          id: string;
          case_number: string;
          first_name: string;
          last_name: string;
          date_of_incident: string | null;
          type_of_incident: string;
          contact_phone: string | null;
          contact_email: string;
          case_description: string | null;
          pdf_url: string | null;
          signer_email: string | null;
          reviewer_email: string | null;
          status: 'New' | 'Draft' | 'Submitted' | 'Pending' | 'In Progress' | 'Reviewed' | 'Signed' | 'Completed' | 'Rejected' | 'Rejected by Reviewer' | 'Rejected by Signer';
          rule_applied: string | null;
          signcare_doc_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_number: string;
          first_name: string;
          last_name: string;
          date_of_incident?: string | null;
          type_of_incident: string;
          contact_phone?: string | null;
          contact_email: string;
          case_description?: string | null;
          pdf_url?: string | null;
          signer_email?: string | null;
          reviewer_email?: string | null;
          status?: 'New' | 'Draft' | 'Submitted' | 'Pending' | 'In Progress' | 'Reviewed' | 'Signed' | 'Completed' | 'Rejected' | 'Rejected by Reviewer' | 'Rejected by Signer';
          rule_applied?: string | null;
          signcare_doc_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_number?: string;
          first_name?: string;
          last_name?: string;
          date_of_incident?: string | null;
          type_of_incident?: string;
          contact_phone?: string | null;
          contact_email?: string;
          case_description?: string | null;
          pdf_url?: string | null;
          signer_email?: string | null;
          reviewer_email?: string | null;
          status?: 'New' | 'Draft' | 'Submitted' | 'Pending' | 'In Progress' | 'Reviewed' | 'Signed' | 'Completed' | 'Rejected' | 'Rejected by Reviewer' | 'Rejected by Signer';
          rule_applied?: string | null;
          signcare_doc_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      case_workflow_steps: {
        Row: {
          id: string;
          case_id: string;
          user_id: string | null;
          step_name: string;
          step_order: number;
          description: string | null;
          estimated_duration: string | null;
          depends_on_step_id: string | null;
          action_type: 'Approve' | 'Review' | 'Sign' | 'Submit' | 'Process' | null;
          action_status: 'Pending' | 'Completed' | 'Rejected' | 'In Progress';
          action_timestamp: string | null;
          failure_reason: string | null;
          tasks: string | null; // JSON string array
          step_category: 'User Action' | 'External Action' | 'System Action' | null;
          is_required: boolean;
          action_metadata: Record<string, any>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id?: string | null;
          step_name: string;
          step_order: number;
          description?: string | null;
          estimated_duration?: string | null;
          depends_on_step_id?: string | null;
          action_type?: 'Approve' | 'Review' | 'Sign' | 'Submit' | 'Process' | null;
          action_status?: 'Pending' | 'Completed' | 'Rejected' | 'In Progress';
          action_timestamp?: string | null;
          failure_reason?: string | null;
          tasks?: string | null;
          step_category?: 'User Action' | 'External Action' | 'System Action' | null;
          is_required?: boolean;
          action_metadata?: Record<string, any>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          user_id?: string | null;
          step_name?: string;
          step_order?: number;
          description?: string | null;
          estimated_duration?: string | null;
          depends_on_step_id?: string | null;
          action_type?: 'Approve' | 'Review' | 'Sign' | 'Submit' | 'Process' | null;
          action_status?: 'Pending' | 'Completed' | 'Rejected' | 'In Progress';
          action_timestamp?: string | null;
          failure_reason?: string | null;
          tasks?: string | null;
          step_category?: 'User Action' | 'External Action' | 'System Action' | null;
          is_required?: boolean;
          action_metadata?: Record<string, any>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      cases_with_rules: {
        Row: {
          id: string;
          case_number: string;
          first_name: string;
          last_name: string;
          date_of_incident: string | null;
          type_of_incident: string;
          contact_phone: string | null;
          contact_email: string;
          case_description: string | null;
          pdf_url: string | null;
          signer_email: string | null;
          reviewer_email: string | null;
          status: string;
          rule_applied: string | null;
          signcare_doc_id: string | null;
          created_at: string;
          updated_at: string;
          rule_name: string | null;
          rule_description: string | null;
          rule_category: string | null;
          rule_priority: string | null;
        };
      };
      case_workflow_summary: {
        Row: {
          case_id: string;
          case_number: string;
          case_status: string;
          total_steps: number;
          completed_steps: number;
          pending_steps: number;
          rejected_steps: number;
        };
      };
    };
  };
}

// Utility types for easier usage
export type User = Database['public']['Tables']['users']['Row'];
export type NewUser = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Rule = Database['public']['Tables']['rules']['Row'];
export type NewRule = Database['public']['Tables']['rules']['Insert'];
export type RuleUpdate = Database['public']['Tables']['rules']['Update'];

export type Case = Database['public']['Tables']['cases']['Row'];
export type NewCase = Database['public']['Tables']['cases']['Insert'];
export type CaseUpdate = Database['public']['Tables']['cases']['Update'];

export type WorkflowStep = Database['public']['Tables']['case_workflow_steps']['Row'];
export type NewWorkflowStep = Database['public']['Tables']['case_workflow_steps']['Insert'];
export type WorkflowStepUpdate = Database['public']['Tables']['case_workflow_steps']['Update'];

export type CaseWithRule = Database['public']['Views']['cases_with_rules']['Row'];
export type CaseWorkflowSummary = Database['public']['Views']['case_workflow_summary']['Row'];

// Enums for better type safety
export enum UserRole {
  SIGNER = 'Signer',
  REVIEWER = 'Reviewer',
  ADMIN = 'Admin',
  USER = 'User'
}

export enum RuleCategory {
  WORKFLOW = 'workflow',
  SECURITY = 'security',
  NOTIFICATION = 'notification',
  VALIDATION = 'validation'
}

export enum RulePriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum RuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TESTING = 'testing',
  DISABLED = 'disabled'
}

export enum CaseStatus {
  NEW = 'New',
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  REVIEWED = 'Reviewed',
  SIGNED = 'Signed',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
  REJECTED_BY_REVIEWER = 'Rejected by Reviewer',
  REJECTED_BY_SIGNER = 'Rejected by Signer'
}

export enum WorkflowStepStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
  IN_PROGRESS = 'In Progress'
}

export enum WorkflowActionType {
  APPROVE = 'Approve',
  REVIEW = 'Review',
  SIGN = 'Sign',
  SUBMIT = 'Submit',
  PROCESS = 'Process'
}

export enum WorkflowStepCategory {
  USER_ACTION = 'User Action',
  EXTERNAL_ACTION = 'External Action',
  SYSTEM_ACTION = 'System Action'
}

// Metadata types for workflow steps
export interface SignCareMetadata {
  signcare_doc_id?: string;
  signer_id?: string;
  invitation_expiry?: string;
  document_url?: string;
  signature_page?: number;
  reviewer_email?: string;
  signer_email?: string;
}

export interface WorkflowStepMetadata extends SignCareMetadata {
  [key: string]: any;
}

// Helper type for workflow step tasks (JSON string array)
export type WorkflowStepTasks = string[]; // When parsing the tasks JSON string
