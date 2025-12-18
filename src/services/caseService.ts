// Case service for ChatBot integration with Supabase
import { supabase } from "@/utils/supabaseClient";
import { Case, WorkflowStep } from "@/types/database";

export interface CaseWithWorkflow extends Case {
  workflow_steps?: WorkflowStep[];
  rule_name?: string;
}

export class CaseService {
  /**
   * Search cases by case number, email, or keywords
   */
  static async searchCases(query: string, userEmail?: string): Promise<CaseWithWorkflow[]> {
    console.log("🔍 CaseService.searchCases called with:", { query, userEmail });
    
    try {
      let supabaseQuery = supabase
        .from("cases")
        .select(`
          *,
          rules:rule_applied(name),
          case_workflow_steps(*)
        `);

      // If searching by email, filter by user's associated cases
      if (userEmail) {
        console.log("📧 Filtering cases by user email:", userEmail);
        supabaseQuery = supabaseQuery.or(
          `contact_email.eq.${userEmail},signer_email.eq.${userEmail},reviewer_email.eq.${userEmail}`
        );
      } else {
        console.log("⚠️ No user email provided - searching all cases");
      }

      // Search by case number or keywords in description
      if (query) {
        const isCaseNumberQuery = query.includes("CASE-") || query.includes("INC-") || query.includes("SF-");
        console.log("🔍 Query type:", isCaseNumberQuery ? "Case Number" : "Keyword Search");
        
        if (isCaseNumberQuery) {
          supabaseQuery = supabaseQuery.ilike("case_number", `%${query}%`);
          console.log("🔢 Searching by case number pattern:", query);
        } else {
          supabaseQuery = supabaseQuery.or(
            `case_number.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,case_description.ilike.%${query}%,type_of_incident.ilike.%${query}%`
          );
          console.log("🔍 Searching by keywords:", query);
        }
      }

      console.log("📊 Executing database query...");
      const { data, error } = await supabaseQuery
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("❌ Database query error:", error);
        throw error;
      }

      console.log("✅ Database query successful. Found", data?.length || 0, "cases");
      console.log("📋 Case numbers found:", data?.map(c => c.case_number) || []);

      const results = (data || []).map(case_item => ({
        ...case_item,
        workflow_steps: case_item.case_workflow_steps || [],
        rule_name: case_item.rules?.name || null
      }));

      console.log("🎯 Returning", results.length, "processed cases");
      return results;
    } catch (error) {
      console.error("💥 Error in searchCases:", error);
      return [];
    }
  }

  /**
   * Get case details by case number
   */
  static async getCaseByNumber(caseNumber: string): Promise<CaseWithWorkflow | null> {
    console.log("🔍 getCaseByNumber called with:", caseNumber);
    
    try {
      console.log("📊 Searching for exact case number:", caseNumber);
      
      const { data, error } = await supabase
        .from("cases")
        .select(`
          *,
          rules:rule_applied(name, description, category, priority),
          case_workflow_steps(*)
        `)
        .eq("case_number", caseNumber)
        .single();

      if (error) {
        console.error("❌ Database error in getCaseByNumber:", error);
        
        // Try a broader search if exact match fails
        console.log("🔄 Trying partial match search...");
        const partialResult = await supabase
          .from("cases")
          .select(`
            *,
            rules:rule_applied(name, description, category, priority),
            case_workflow_steps(*)
          `)
          .ilike("case_number", `%${caseNumber}%`)
          .limit(1);
          
        if (partialResult.data && partialResult.data.length > 0) {
          console.log("✅ Found via partial match:", partialResult.data[0].case_number);
          const case_item = partialResult.data[0];
          return {
            ...case_item,
            workflow_steps: case_item.case_workflow_steps || [],
            rule_name: case_item.rules?.name || null
          };
        }
        
        return null;
      }

      if (!data) {
        console.log("⚠️ No data returned for case:", caseNumber);
        return null;
      }

      console.log("✅ Found case:", data.case_number, "Status:", data.status);
      console.log("👤 Case contacts:", {
        contact_email: data.contact_email,
        signer_email: data.signer_email,
        reviewer_email: data.reviewer_email
      });

      return {
        ...data,
        workflow_steps: data.case_workflow_steps || [],
        rule_name: data.rules?.name || null
      };
    } catch (error) {
      console.error("💥 Error in getCaseByNumber:", error);
      return null;
    }
  }

  /**
   * Get case status summary
   */
  static async getCaseStatus(caseNumber: string): Promise<string> {
    try {
      const caseData = await this.getCaseByNumber(caseNumber);
      if (!caseData) return "Case not found";

      const workflowSteps = caseData.workflow_steps || [];
      const completedSteps = workflowSteps.filter(step => step.action_status === "Completed").length;
      const totalSteps = workflowSteps.length;

      // Better logic to find the actual current step
      const currentStep = this.getCurrentStep(workflowSteps);
      
      console.log("📊 Case status analysis:", {
        caseNumber,
        totalSteps,
        completedSteps,
        currentStep: currentStep ? currentStep.step_name : 'none',
        allSteps: workflowSteps.map(s => ({ name: s.step_name, status: s.action_status, is_active: s.is_active, order: s.step_order }))
      });

      let statusSummary = `**Case ${caseNumber}**\n`;
      statusSummary += `Status: ${caseData.status}\n`;
      statusSummary += `Type: ${caseData.type_of_incident}\n`;
      statusSummary += `Progress: ${completedSteps}/${totalSteps} steps completed\n`;
      
      if (currentStep) {
        statusSummary += `Current Step: ${currentStep.step_name} (${currentStep.action_status})\n`;
        if (currentStep.estimated_duration) {
          statusSummary += `Estimated Duration: ${currentStep.estimated_duration}\n`;
        }
      }

      return statusSummary;
    } catch (error) {
      console.error("Error getting case status:", error);
      return "Unable to retrieve case status";
    }
  }

  /**
   * Get all cases for a user (by email)
   */
  static async getUserCases(userEmail: string): Promise<CaseWithWorkflow[]> {
    return this.searchCases("", userEmail);
  }

  /**
   * Get recent cases (last 10)
   */
  static async getRecentCases(): Promise<CaseWithWorkflow[]> {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select(`
          *,
          rules:rule_applied(name),
          case_workflow_steps!inner(*)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map(case_item => ({
        ...case_item,
        workflow_steps: case_item.case_workflow_steps || [],
        rule_name: case_item.rules?.name || null
      }));
    } catch (error) {
      console.error("Error fetching recent cases:", error);
      return [];
    }
  }

  /**
   * Format case data for AI assistant
   */
  static formatCaseForAI(caseData: CaseWithWorkflow): string {
    const workflowSteps = caseData.workflow_steps || [];
    const currentStep = this.getCurrentStep(workflowSteps);
    
    let formatted = `**Case ${caseData.case_number}**\n`;
    formatted += `- Name: ${caseData.first_name} ${caseData.last_name}\n`;
    formatted += `- Type: ${caseData.type_of_incident}\n`;
    formatted += `- Status: ${caseData.status}\n`;
    formatted += `- Date: ${new Date(caseData.created_at).toLocaleDateString()}\n`;
    
    if (caseData.rule_name) {
      formatted += `- Applied Rule: ${caseData.rule_name}\n`;
    }
    
    if (currentStep) {
      formatted += `- Current Step: ${currentStep.step_name} (${currentStep.action_status})\n`;
      if (currentStep.estimated_duration) {
        formatted += `- ETA: ${currentStep.estimated_duration}\n`;
      }
    }
    
    const completedSteps = workflowSteps.filter(step => step.action_status === "Completed").length;
    formatted += `- Progress: ${completedSteps}/${workflowSteps.length} steps completed\n`;

    return formatted;
  }

  /**
   * Check if query is case-related
   */
  static isCaseQuery(message: string): boolean {
    const caseKeywords = [
      "case", "status", "INC-", "CASE-", "SF-", "my cases", "show cases",
      "incident", "workflow", "step", "progress", "signer", "reviewer"
    ];
    
    const isMatch = caseKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
    
    console.log("🤔 isCaseQuery check:", { message, isMatch });
    return isMatch;
  }

  /**
   * Extract case number from message
   */
  static extractCaseNumber(message: string): string | null {
    // Updated regex to capture full case numbers with multiple parts
    const caseNumberRegex = /(SF-\d+(?:-\d+)*|CASE-\d+(?:-\d+)*|INC-\d+(?:-\d+)*)/i;
    const match = message.match(caseNumberRegex);
    return match ? match[1] : null;
  }

  /**
   * Determine the actual current step with better logic
   */
  static getCurrentStep(workflowSteps: WorkflowStep[]): WorkflowStep | null {
    if (!workflowSteps || workflowSteps.length === 0) return null;

    // Sort steps by order to ensure proper sequence
    const sortedSteps = [...workflowSteps].sort((a, b) => a.step_order - b.step_order);
    
    console.log("🔍 Analyzing workflow steps:", sortedSteps.map(s => ({
      order: s.step_order,
      name: s.step_name,
      status: s.action_status,
      is_active: s.is_active
    })));

    // Method 1: Check if there's exactly one step marked as active
    const activeSteps = sortedSteps.filter(step => step.is_active);
    if (activeSteps.length === 1) {
      console.log("✅ Found single active step:", activeSteps[0].step_name);
      return activeSteps[0];
    }

    if (activeSteps.length > 1) {
      console.log("⚠️ Multiple steps marked as active, using status-based logic");
    }

    // Method 2: Find the first non-completed step in order
    const firstIncompleteStep = sortedSteps.find(step => 
      step.action_status !== "Completed"
    );
    
    if (firstIncompleteStep) {
      console.log("✅ Found first incomplete step:", firstIncompleteStep.step_name);
      return firstIncompleteStep;
    }

    // Method 3: If all steps are completed, return the last one
    if (sortedSteps.every(step => step.action_status === "Completed")) {
      const lastStep = sortedSteps[sortedSteps.length - 1];
      console.log("✅ All steps completed, returning last step:", lastStep.step_name);
      return lastStep;
    }

    // Method 4: Fallback - return step with "In Progress" status
    const inProgressStep = sortedSteps.find(step => 
      step.action_status === "In Progress"
    );
    
    if (inProgressStep) {
      console.log("✅ Found step in progress:", inProgressStep.step_name);
      return inProgressStep;
    }

    // Method 5: Final fallback - return first step
    console.log("⚠️ Using fallback - returning first step");
    return sortedSteps[0];
  }
}
