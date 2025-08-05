import axios from "axios";
import { supabase } from "@/utils/supabaseClient";

export const updateWorkflowStatus = async (caseId: string, caseNumber: string) => {
  try {
    // Fetch case details
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("reviewer_email, signer_email, id, signcare_doc_id")
      .eq("id", caseId)
      .single();

    if (caseError || !caseData) throw new Error("Failed to fetch case details");

    const { reviewer_email: reviewerEmail, signer_email: signerEmail, signcare_doc_id: signcareDocId } = caseData;

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
            is_active: newStatus === "Reviewed" ? false : reviewStep.is_active, // Deactivate when Reviewed
          })
          .eq("id", reviewStep.id);

        caseStatus =
          newStatus === "Reviewed"
            ? "Reviewed"
            : newStatus === "Rejected"
            ? "Rejected by Reviewer"
            : "In Progress";

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
            is_active: newStatus === "Signed" ? false : signStep.is_active, // Deactivate when Signed
          })
          .eq("id", signStep.id);

        caseStatus =
          newStatus === "Signed"
            ? "Signed"
            : newStatus === "Rejected"
            ? "Rejected by Signer"
            : caseStatus;

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
          caseStatus = "Signed"; // Keep case status as Signed until Court Filing is completed
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
