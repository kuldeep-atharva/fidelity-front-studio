import axios from "axios";
import { supabase } from "@/utils/supabaseClient";

const getUserIdByEmail = async (email: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (error || !data) {
      console.warn(`User with email ${email} not found`);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error(`Error fetching user ID for email ${email}:`, error);
    return null;
  }
};

const getRulePriority = async (caseId: string): Promise<string> => {
  try {
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("rule_applied")
      .eq("id", caseId)
      .single();

    if (caseError || !caseData) {
      console.warn("Case not found or no rule applied, defaulting to medium priority");
      return "medium";
    }

    if (!caseData.rule_applied) {
      console.warn("No rule applied for case, defaulting to medium priority");
      return "medium";
    }

    const { data: ruleData, error: ruleError } = await supabase
      .from("rules")
      .select("priority")
      .eq("id", caseData.rule_applied)
      .single();

    if (ruleError || !ruleData) {
      console.warn("Rule not found, defaulting to medium priority");
      return "medium";
    }

    return ruleData.priority || "medium";
  } catch (error) {
    console.error("Error fetching rule priority:", error);
    return "medium";
  }
};

const createNotification = async (
  email: string,
  caseId: string,
  type: string,
  title: string,
  message: string
) => {
  const userId = await getUserIdByEmail(email);
  if (!userId) {
    console.warn(`No user found for email ${email}, skipping notification`);
    return;
  }

  // Check for existing notification to prevent duplicates
  const { data: existingNotification, error: checkError } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("case_id", caseId)
    .eq("type", type)
    .eq("title", title)
    .single();

  if (checkError && checkError.code !== "PGRST116") { // PGRST116 means no rows found
    console.error("Error checking for existing notification:", checkError);
    return;
  }

  if (existingNotification) {
    console.log(`Notification with title "${title}" already exists for user ${email}, skipping`);
    return;
  }

  const priority = await getRulePriority(caseId);

  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      case_id: caseId,
      type,
      title,
      message,
      priority,
      is_read: false,
    });

  if (error) {
    console.error("Failed to create notification:", error);
  }
};

export const updateWorkflowStatus = async (caseId: string, caseNumber: string) => {
  try {
    // Fetch case details
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("reviewer_email, signer_email, contact_email, id, signcare_doc_id")
      .eq("id", caseId)
      .single();

    if (caseError || !caseData) throw new Error("Failed to fetch case details");

    const { reviewer_email: reviewerEmail, signer_email: signerEmail, contact_email: contactEmail, signcare_doc_id: signcareDocId } = caseData;

    if (!reviewerEmail || !signerEmail || !signcareDocId) throw new Error("Required case information missing");

    // Fetch workflow steps
    const { data: steps, error: stepsError } = await supabase
      .from("case_workflow_steps")
      .select("id, step_name, action_status, action_metadata, is_active")
      .eq("case_id", caseId)
      .order("step_order", { ascending: true });

    if (stepsError || !steps) throw new Error("Failed to fetch workflow steps");

    const reviewStep = steps.find((s) => s.step_name === "Review Process");
    const signStep = steps.find((s) => s.step_name === "Sign Process");
    const courtFilingStep = steps.find((s) => s.step_name === "Court Filing");

    if (!reviewStep?.action_metadata?.signcare_doc_id) return;

    // Fetch SignCare status
    const statusResponse = await axios.post(
      `${import.meta.env.VITE_API_SC_BASE}/esign/status`,
      {
        documentId: signcareDocId,
        documentReferenceId: caseNumber,
        signerInfo: [
          { email: reviewerEmail, userType: "Reviewer" },
          { email: signerEmail, userType: "Signer" },
        ],
      },
      {
        headers: {
          "X-API-KEY": `${import.meta.env.VITE_API_SC_X_KEY}`,
          "X-API-APP-ID": `${import.meta.env.VITE_API_SC_X_ID}`,
        },
      }
    );

    if (statusResponse.status !== 200 || !statusResponse.data.success) {
      throw new Error("Failed to fetch SignCare status");
    }

    const { documentStatus, signerInfo } = statusResponse.data.data;

    // Fetch user IDs for reviewer and signer
    const { data: reviewerUser, error: reviewerError } = await supabase
      .from("users")
      .select("id")
      .eq("email", reviewerEmail)
      .single();

    const { data: signerUser, error: signerError } = await supabase
      .from("users")
      .select("id")
      .eq("email", signerEmail)
      .single();

    if (reviewerError || !reviewerUser || signerError || !signerUser) {
      throw new Error("Reviewer or signer not found");
    }

    // Match signers based on user IDs
    const reviewer = signerInfo.find((s: any) => s.signerRefId === reviewerUser.id);
    const signer = signerInfo.find((s: any) => s.signerRefId === signerUser.id);

    let caseStatus: string | null = null;

    // Map SignCare signerStatus to database status
    const mapSignerStatus = (status: string): string => {
      switch (status) {
        case "Pending":
          return "In Progress";
        case "Approved":
          return "Reviewed";
        case "Rejected":
          return "Rejected";
        case "Signed":
          return "Signed";
        default:
          return "In Progress";
      }
    };

    // Update Review Process
    if (reviewer && reviewStep) {
      const newStatus = mapSignerStatus(reviewer.signerStatus);

      if (newStatus !== reviewStep.action_status) {
        await supabase
          .from("case_workflow_steps")
          .update({
            action_status: newStatus,
            action_timestamp: new Date().toISOString(),
            failure_reason: newStatus === "Rejected" ? reviewer.rejectReason || "Reviewer rejected the document" : null,
            action_metadata: {
              ...reviewStep.action_metadata,
              signer_id: reviewer.signerId,
              invitation_expiry: reviewer.invitationExpireTimeStamp,
            },
            is_active: newStatus === "Reviewed" ? false : reviewStep.is_active,
          })
          .eq("id", reviewStep.id);

        caseStatus =
          newStatus === "Reviewed"
            ? "Reviewed"
            : newStatus === "Rejected"
            ? "Rejected by Reviewer"
            : "In Progress";

        // Send notifications when status changes to Reviewed
        if (newStatus === "Reviewed") {
          await createNotification(
            signerEmail,
            caseId,
            "document",
            "Documents Ready for Signing",
            `Documents for case ${caseNumber} are ready for your signature.`
          );
          await createNotification(
            contactEmail,
            caseId,
            "document",
            "Documents Reviewed",
            `Your documents for case ${caseNumber} have been reviewed.`
          );
        }

        // Activate Sign Process if Review is Reviewed
        if (newStatus === "Reviewed" && signStep) {
          await supabase
            .from("case_workflow_steps")
            .update({
              is_active: true,
              action_metadata: {
                ...signStep.action_metadata,
                signcare_doc_id: signcareDocId,
              },
            })
            .eq("id", signStep.id);
        }
      }
    }

    // Update Sign Process
    if (signer && signStep && (reviewStep?.action_status === "Reviewed" || documentStatus === "Signed")) {
      const newStatus = mapSignerStatus(signer.signerStatus);

      if (newStatus !== signStep.action_status) {
        await supabase
          .from("case_workflow_steps")
          .update({
            action_status: newStatus,
            action_timestamp: new Date().toISOString(),
            failure_reason: newStatus === "Rejected" ? signer.rejectReason || "Signer rejected the document" : null,
            action_metadata: {
              ...signStep.action_metadata,
              signer_id: signer.signerId,
              invitation_expiry: signer.invitationExpireTimeStamp,
            },
            is_active: newStatus === "Signed" ? false : signStep.is_active,
          })
          .eq("id", signStep.id);

        caseStatus =
          newStatus === "Signed"
            ? "Signed"
            : newStatus === "Rejected"
            ? "Rejected by Signer"
            : caseStatus;

        // Send notification when status changes to Signed
        if (newStatus === "Signed") {
          await createNotification(
            contactEmail,
            caseId,
            "document",
            "Documents Signed",
            `Your documents for case ${caseNumber} have been signed.`
          );
        }

        // Activate Court Filing if Sign Process is Signed
        if (newStatus === "Signed" && courtFilingStep) {
          await supabase
            .from("case_workflow_steps")
            .update({
              is_active: true,
              action_status: "In Progress",
              action_timestamp: new Date().toISOString(),
            })
            .eq("id", courtFilingStep.id);
          caseStatus = "Signed";
        }
      }
    }

    // Update case status based on document status
    if (documentStatus === "Signed" && courtFilingStep && signStep?.action_status === "Signed") {
      await supabase
        .from("case_workflow_steps")
        .update({
          is_active: true,
          action_status: "Completed",
          action_timestamp: new Date().toISOString(),
        })
        .eq("id", courtFilingStep.id);
      caseStatus = "Completed";
    } else if (documentStatus === "Rejected") {
      caseStatus = "Rejected";
    } else if (documentStatus === "Pending" && caseStatus === null) {
      caseStatus = "In Progress";
    }

    if (caseStatus) {
      await supabase
        .from("cases")
        .update({ status: caseStatus })
        .eq("id", caseId);
    }
  } catch (error) {
    console.error("Failed to update workflow status:", error);
  }
};
