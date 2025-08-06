import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/utils/supabaseClient";
import * as Dialog from "@radix-ui/react-dialog";
import FinalSubmissionPdf from "./FinalSubmissionPdf";
import axios from "axios";
import ChatModal from "@/components/ChatModal";
import { matchRuleUsingOpenAI } from "@/utils/ruleEngine";
import { updateWorkflowStatus } from "@/utils/workflowUpdater";

const IncidentReportForm: React.FC = () => {
  const { caseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialStep = queryParams.get("step") === "2" ? 2 : 1;

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    date_of_incident: "",
    type_of_incident: "",
    contact_phone: "",
    contact_email: "",
    case_description: "",
    case_number: "",
    signer_email: "",
    reviewer_email: "",
    pdf_url: "",
    status: "Draft",
    rule_applied: "",
  });

  const [documents, setDocuments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(caseId || null);
  const [loading, setLoading] = useState(!!caseId);

  // Fetch case data if caseId is provided
  useEffect(() => {
    if (caseId) {
      const fetchCaseData = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("cases")
            .select("*")
            .eq("id", caseId)
            .single();

          if (error) throw error;

          setForm({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            date_of_incident: data.date_of_incident || "",
            type_of_incident: data.type_of_incident || "",
            contact_phone: data.contact_phone || "",
            contact_email: data.contact_email || "",
            case_description: data.case_description || "",
            case_number: data.case_number || "",
            signer_email: data.signer_email || "",
            reviewer_email: data.reviewer_email || "",
            pdf_url: data.pdf_url || "",
            status: data.status || "Draft",
            rule_applied: data.rule_applied || "",
          });

          // Fetch documents (assuming stored in action_metadata or a case_documents table)
          const { data: stepsData, error: stepsError } = await supabase
            .from("case_workflow_steps")
            .select("action_metadata")
            .eq("case_id", caseId)
            .eq("step_name", "Document Preparation")
            .single();

          if (stepsError) throw stepsError;

          // Assuming documents are stored as URLs in action_metadata
          const documentUrls = stepsData?.action_metadata?.document_urls || [];
          const fetchedDocuments = await Promise.all(
            documentUrls.map(async (url: string, index: number) => {
              const response = await fetch(url);
              const blob = await response.blob();
              return new File([blob], `document-${index}.pdf`, { type: "application/pdf" });
            })
          );
          setDocuments(fetchedDocuments);
        } catch (error) {
          console.error("Failed to fetch case data:", error);
          setValidationError("Failed to load case data. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchCaseData();
    }
  }, [caseId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setValidationError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const pdfFiles = newFiles.filter((file) => file.type === "application/pdf");

      if (pdfFiles.length !== newFiles.length) {
        setValidationError("Only PDF files are allowed. Non-PDF files were filtered out.");
      } else {
        setValidationError(null);
      }

      setDocuments((prev) => [...prev, ...pdfFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setDocuments((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const generateCaseNumber = () =>
    `SF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const initializeWorkflowSteps = async (
    caseId: string,
    reviewerEmail: string,
    signerEmail: string,
    signcareDocId: string | null = null
  ) => {
    const workflowSteps = [
      {
        step_order: 1,
        step_name: "Case Assessment",
        description: "Complete the incident report form",
        estimated_duration: "15 min",
        is_active: false,
        action_type: "Approve",
        action_status: "Completed",
        tasks: JSON.stringify([
          "Fill out incident details",
          "Provide contact information",
          "Submit the form",
        ]),
        step_category: "User Action",
        is_required: true,
      },
      {
        step_order: 2,
        step_name: "Document Preparation",
        description: "Upload and preview supporting documents",
        estimated_duration: "30 min",
        is_active: true,
        action_type: "Approve",
        action_status: "In Progress",
        tasks: JSON.stringify([
          "Upload relevant PDF documents",
          "Review combined PDF",
          "Confirm submission",
        ]),
        step_category: "User Action",
        is_required: true,
      },
      {
        step_order: 3,
        step_name: "Review Process",
        description: "Reviewer evaluates the submitted documents",
        estimated_duration: "1-2 days",
        is_active: false,
        action_type: "Review",
        action_status: "In Progress",
        tasks: JSON.stringify([
          "Reviewer checks document accuracy",
          "Approve or reject submission",
        ]),
        step_category: "External Action",
        is_required: true,
        action_metadata: {
          reviewer_email: reviewerEmail,
          signcare_doc_id: signcareDocId,
        },
      },
      {
        step_order: 4,
        step_name: "Sign Process",
        description: "Signer provides electronic signature",
        estimated_duration: "1-2 days",
        is_active: false,
        action_type: "Sign",
        action_status: "In Progress",
        tasks: JSON.stringify([
          "Signer reviews document",
          "Provide electronic signature",
        ]),
        step_category: "External Action",
        is_required: true,
        action_metadata: {
          signer_email: signerEmail,
          signcare_doc_id: signcareDocId,
        },
      },
      {
        step_order: 5,
        step_name: "Court Filing",
        description: "Submit documents to the court",
        estimated_duration: "1 hour",
        is_active: false,
        action_type: "Approve",
        action_status: "In Progress",
        tasks: JSON.stringify([
          "Prepare final submission",
          "File with court system",
        ]),
        step_category: "System Action",
        is_required: true,
      },
    ];

    let previousStepId: string | null = null;
    for (const step of workflowSteps) {
      const { data, error } = await supabase
        .from("case_workflow_steps")
        .insert([
          {
            case_id: caseId,
            user_id: null,
            step_order: step.step_order,
            step_name: step.step_name,
            description: step.description,
            estimated_duration: step.estimated_duration,
            is_active: step.is_active,
            depends_on_step_id: previousStepId,
            action_type: step.action_type,
            action_status: step.action_status,
            tasks: step.tasks,
            step_category: step.step_category,
            is_required: step.is_required,
            action_metadata: step.action_metadata || {},
          },
        ])
        .select("id")
        .single();

      if (error) throw new Error(`Failed to insert step ${step.step_name}: ${error.message}`);
      previousStepId = data.id;
    }
  };

  const handleStep2 = async () => {
    if (!validateStep1()) return;

    setSubmitting(true);
    try {
      let caseIdToUse = currentCaseId;
      let generatedCaseNumber = form.case_number;

      if (!caseIdToUse) {
        generatedCaseNumber = generateCaseNumber();
        const newCase = {
          first_name: form.first_name,
          last_name: form.last_name,
          date_of_incident: form.date_of_incident,
          type_of_incident: form.type_of_incident,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email,
          case_description: form.case_description,
          case_number: generatedCaseNumber,
          signer_email: form.signer_email,
          reviewer_email: form.reviewer_email,
          pdf_url: "",
          status: "Draft",
          rule_applied: "",
        };

        const summaryCase = {
          type_of_incident: newCase.type_of_incident,
          date_of_incident: newCase.date_of_incident,
          contact_email: newCase.contact_email,
          case_description: newCase.case_description,
        };

        const { data: rules, error: rulesError } = await supabase
          .from("rules")
          .select("*")
          .eq("status", "active");

        if (rulesError || !rules) throw new Error("Failed to fetch rules");

        const ruleMatch = await matchRuleUsingOpenAI(summaryCase, rules);
        const updatedCase = {
          ...newCase,
          signer_email: ruleMatch.signer_email || newCase.signer_email || newCase.contact_email,
          reviewer_email: ruleMatch.reviewer_email || newCase.reviewer_email || "defaultreviewer@yopmail.com",
          rule_applied: ruleMatch.rule_id || newCase.rule_applied,
        };

        const { data: caseData, error: insertError } = await supabase
          .from("cases")
          .insert([updatedCase])
          .select("id")
          .single();

        if (insertError) throw insertError;

        caseIdToUse = caseData.id;
        setCurrentCaseId(caseIdToUse);
        localStorage.setItem("case_number", generatedCaseNumber);

        await initializeWorkflowSteps(caseIdToUse, updatedCase.reviewer_email, updatedCase.signer_email);
      } else {
        // Update existing case
        const { error: updateError } = await supabase
          .from("cases")
          .update({
            first_name: form.first_name,
            last_name: form.last_name,
            date_of_incident: form.date_of_incident,
            type_of_incident: form.type_of_incident,
            contact_phone: form.contact_phone,
            contact_email: form.contact_email,
            case_description: form.case_description,
            signer_email: form.signer_email,
            reviewer_email: form.reviewer_email,
          })
          .eq("id", caseIdToUse);

        if (updateError) throw updateError;
      }

      setCurrentStep(2);
      navigate(`/step1/${caseIdToUse}?step=2`);
    } catch (error: any) {
      setValidationError(error.message || "Failed to create or update case. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalSubmit = async (pdfBase64: string, pageNum: number) => {
    setSubmitting(true);
    try {
      if (!currentCaseId) throw new Error("Case ID is missing");

      // Upload documents to Supabase storage (or update action_metadata)
      // const documentUrls: string[] = [];
      // for (const file of documents) {
      //   const { data, error } = await supabase.storage
      //     .from("case-documents")
      //     .upload(`${currentCaseId}/${file.name}`, file);

      //   if (error) throw error;
      //   const publicUrl = supabase.storage.from("case-documents").getPublicUrl(data.path).data.publicUrl;
      //   documentUrls.push(publicUrl);
      // }
      // Convert documents to base64 data URLs and store in action_metadata
      const documentUrls: string[] = [];
      for (const file of documents) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        documentUrls.push(dataUrl);
      }

      // Update Document Preparation step with document URLs
      await supabase
        .from("case_workflow_steps")
        .update({
          action_metadata: { document_urls: documentUrls },
        })
        .eq("case_id", currentCaseId)
        .eq("step_name", "Document Preparation");

      // Update case with PDF and status
      const { error: updateError } = await supabase
        .from("cases")
        .update({ pdf_url: pdfBase64, status: "In Progress" })
        .eq("id", currentCaseId);

      if (updateError) throw updateError;

      // Fetch case details
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("case_number, reviewer_email, signer_email, contact_phone, type_of_incident, contact_email")
        .eq("id", currentCaseId)
        .single();

      if (caseError || !caseData) throw new Error("Failed to fetch case details");

      const { case_number, reviewer_email, signer_email, contact_phone, type_of_incident, contact_email } = caseData;

      // Fetch reviewer and signer user records
      const { data: reviewerUser, error: reviewerError } = await supabase
        .from("users")
        .select("full_name, email, role, id")
        .eq("email", reviewer_email)
        .single();

      if (reviewerError) throw new Error("Reviewer not found");

      const { data: signerUser, error: signerError } = await supabase
        .from("users")
        .select("full_name, email, role, id")
        .eq("email", signer_email)
        .single();

      if (signerError) throw new Error("Signer not found");

      const signcareResponse = await axios.post(
        `${import.meta.env.VITE_API_SC_BASE}/esign/request`,
        {
          referenceId: case_number,
          skipVerificationCode: false,
          documentInfo: {
            name: `Incident Report - ${case_number}`,
            content: pdfBase64,
          },
          supportingDocuments: [],
          sequentialSigning: true,
          userInfo: [
            {
              name: reviewerUser.full_name,
              emailId: reviewerUser.email,
              userType: reviewerUser.role,
              signatureType: "Electronic",
              electronicOptions: null,
              aadhaarInfo: null,
              aadhaarOptions: null,
              expiryDate: null,
              emailReminderDays: null,
              mobileNo: contact_phone,
              order: 1,
              userReferenceId: reviewerUser.id,
              signAppearance: 5,
              pageToBeSigned: null,
              pageNumber: null,
              pageCoordinates: [],
            },
            {
              name: signerUser.full_name,
              emailId: signerUser.email,
              userType: signerUser.role,
              signatureType: "Electronic",
              electronicOptions: {
                canDraw: true,
                canType: true,
                canUpload: true,
                captureGPSLocation: false,
                capturePhoto: false,
              },
              aadhaarInfo: null,
              aadhaarOptions: null,
              expiryDate: null,
              emailReminderDays: null,
              mobileNo: contact_phone,
              order: 2,
              userReferenceId: signerUser.id,
              signAppearance: 5,
              pageToBeSigned: null,
              pageNumber: null,
              pageCoordinates: [
                {
                  pageNumber: pageNum,
                  PDFCoordinates: [
                    {
                      X1: "360",
                      X2: "180",
                      Y1: "682",
                      Y2: "40",
                    },
                  ],
                },
              ],
            },
          ],
          descriptionForInvitee: `Incident Report for ${type_of_incident}`,
          finalCopyRecipientsEmailId: contact_email,
        },
        {
          headers: {
            "X-API-KEY": `${import.meta.env.VITE_API_SC_X_KEY}`,
            "X-API-APP-ID": `${import.meta.env.VITE_API_SC_X_ID}`,
          },
        }
      );

      if (signcareResponse.status !== 200) {
        throw new Error("Failed to create SignCare request");
      }

      const signcareDocId = signcareResponse.data.data.documentId;

      await supabase
        .from("cases")
        .update({ signcare_doc_id: signcareDocId })
        .eq("id", currentCaseId);

      // Update workflow steps with signcare_doc_id
      await supabase
        .from("case_workflow_steps")
        .update({
          action_metadata: {
            reviewer_email,
            signcare_doc_id: signcareDocId,
          },
          is_active: true,
          action_status: "In Progress",
        })
        .eq("case_id", currentCaseId)
        .eq("step_name", "Review Process");

      await supabase
        .from("case_workflow_steps")
        .update({
          action_metadata: {
            signer_email,
            signcare_doc_id: signcareDocId,
          },
        })
        .eq("case_id", currentCaseId)
        .eq("step_name", "Sign Process");

      // Update Document Preparation step to Completed
      await supabase
        .from("case_workflow_steps")
        .update({
          is_active: false,
          action_status: "Completed",
          action_timestamp: new Date().toISOString(),
        })
        .eq("case_id", currentCaseId)
        .eq("step_name", "Document Preparation");

      // Fetch initial status from SignCare
      const statusResponse = await axios.post(
        `${import.meta.env.VITE_API_SC_BASE}/esign/status`,
        {
          documentId: signcareDocId,
          documentReferenceId: case_number,
        },
        {
          headers: {
            "X-API-KEY": `${import.meta.env.VITE_API_SC_X_KEY}`,
            "X-API-APP-ID": `${import.meta.env.VITE_API_SC_X_ID}`,
          },
        }
      );

      if (statusResponse.status === 200 && statusResponse.data.success) {
        const { documentStatus, signerInfo } = statusResponse.data.data;

        const reviewer = signerInfo.find((s: any) => s.signerRefId === reviewerUser.id);
        const signer = signerInfo.find((s: any) => s.signerRefId === signerUser.id);

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

        const reviewStep = await supabase
          .from("case_workflow_steps")
          .select("id, action_metadata")
          .match({ case_id: currentCaseId, step_name: "Review Process" })
          .single();

        if (reviewStep.data && reviewer) {
          const newStatus = mapSignerStatus(reviewer.signerStatus);
          await supabase
            .from("case_workflow_steps")
            .update({
              action_status: newStatus,
              action_timestamp: new Date().toISOString(),
              failure_reason:
                newStatus === "Rejected"
                  ? reviewer.rejectReason || "Reviewer rejected the document"
                  : null,
              action_metadata: {
                ...reviewStep.data.action_metadata,
                signer_id: reviewer.signerId,
                invitation_expiry: reviewer.invitationExpireTimeStamp,
                signcare_doc_id: signcareDocId,
              },
            })
            .eq("id", reviewStep.data.id);

          if (newStatus === "Reviewed") {
            const signStep = await supabase
              .from("case_workflow_steps")
              .select("id")
              .match({ case_id: currentCaseId, step_name: "Sign Process" })
              .single();
            if (signStep.data) {
              await supabase
                .from("case_workflow_steps")
                .update({
                  is_active: true,
                })
                .eq("id", signStep.data.id);
            }
          }
        }

        const signStep = await supabase
          .from("case_workflow_steps")
          .select("id, action_metadata")
          .match({ case_id: currentCaseId, step_name: "Sign Process" })
          .single();

        if (signStep.data && signer) {
          const newStatus = mapSignerStatus(signer.signerStatus);
          await supabase
            .from("case_workflow_steps")
            .update({
              action_status: newStatus,
              action_timestamp: new Date().toISOString(),
              failure_reason:
                newStatus === "Rejected"
                  ? signer.rejectReason || "Signer rejected the document"
                  : null,
              action_metadata: {
                ...signStep.data.action_metadata,
                signer_id: signer.signerId,
                invitation_expiry: signer.invitationExpireTimeStamp,
                signcare_doc_id: signcareDocId,
              },
            })
            .eq("id", signStep.data.id);

          if (newStatus === "Signed") {
            const courtFilingStep = await supabase
              .from("case_workflow_steps")
              .select("id")
              .match({ case_id: currentCaseId, step_name: "Court Filing" })
              .single();
            if (courtFilingStep.data) {
              await supabase
                .from("case_workflow_steps")
                .update({
                  is_active: true,
                  action_status: "In Progress",
                  action_timestamp: new Date().toISOString(),
                })
                .eq("id", courtFilingStep.data.id);
            }
          }
        }

        const courtFilingStep = await supabase
          .from("case_workflow_steps")
          .select("id")
          .match({ case_id: currentCaseId, step_name: "Court Filing" })
          .single();

        if (courtFilingStep.data && documentStatus === "Signed") {
          await supabase
            .from("case_workflow_steps")
            .update({
              is_active: true,
              action_status: "Completed",
              action_timestamp: new Date().toISOString(),
            })
            .eq("id", courtFilingStep.data.id);
        }

        await supabase
          .from("cases")
          .update({
            status:
              documentStatus === "Signed"
                ? "Completed"
                : documentStatus === "Rejected"
                ? "Rejected"
                : documentStatus === "Pending"
                ? "In Progress"
                : "Draft",
          })
          .eq("id", currentCaseId);
      }

      await updateWorkflowStatus(currentCaseId, case_number);

      setIsModalOpen(true);

      setForm({
        first_name: "",
        last_name: "",
        date_of_incident: "",
        type_of_incident: "",
        contact_phone: "",
        contact_email: "",
        case_description: "",
        case_number: "",
        signer_email: "",
        reviewer_email: "",
        pdf_url: "",
        status: "Draft",
        rule_applied: "",
      });
      setDocuments([]);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const validateStep1 = () => {
    if (!form.first_name) {
      setValidationError("First name is required.");
      return false;
    }
    if (!form.last_name) {
      setValidationError("Last name is required.");
      return false;
    }
    if (!form.contact_phone) {
      setValidationError("Contact Phone Number is required.");
      return false;
    }
    if (!/^\d{10}$/.test(form.contact_phone)) {
      setValidationError("Contact phone number must be exactly 10 digits.");
      return false;
    }
    if (form.contact_phone.startsWith("0")) {
      setValidationError("Contact phone number cannot start with 0.");
      return false;
    }
    if (!form.contact_email) {
      setValidationError("Email is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.contact_email)) {
      setValidationError("Please enter a valid email address.");
      return false;
    }
    if (!form.date_of_incident) {
      setValidationError("Date of incident is required.");
      return false;
    }
    if (!form.type_of_incident) {
      setValidationError("Type of incident is required.");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
    setValidationError(null);
    navigate(`/step1/${currentCaseId}?step=1`);
  };

  const validateAndPreview = () => {
    if (!validateStep1()) return;
    setFormData(form);
    setUploadedFiles(documents);
    setPdfOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="custom-loader" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto mt-10 bg-white shadow-lg rounded-lg p-10">
        {currentStep === 1 && (
          <>
            <h2 className="text-2xl font-bold text-center mb-4 text-sky-900">
              Step 1: Incident Information
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Please complete all required fields for your incident report
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["first_name", "last_name", "contact_phone", "contact_email"].map((field) => (
                <div key={field}>
                  <label className="block text-sm mb-1 font-medium capitalize">
                    {field === "contact_phone" ? "Contact Phone Number" : field.replace("_", " ")} *
                  </label>
                  <input
                    name={field}
                    value={(form as any)[field]}
                    onChange={handleChange}
                    className="w-full p-2 rounded bg-purple-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder={`Enter ${field.replace("_", " ")}`}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm mb-1 font-medium">
                  Date of Incident *
                </label>
                <input
                  type="date"
                  name="date_of_incident"
                  value={form.date_of_incident}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-purple-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium">
                  Type of Incident *
                </label>
                <select
                  name="type_of_incident"
                  value={form.type_of_incident}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-purple-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="">Select incident type</option>
                  <option value="Theft">Theft</option>
                  <option value="Assault">Assault</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid mt-6">
              <label className="block text-sm mb-1 font-medium">
                Description *
              </label>
              <textarea
                placeholder="Describe the incident in detail"
                name="case_description"
                value={form.case_description}
                onChange={handleChange}
                className="w-full p-2 rounded bg-purple-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                rows={4}
              />
            </div>

            {validationError && (
              <p className="text-red-600 text-sm mt-4">{validationError}</p>
            )}

            <div className="flex justify-between mt-8">
              <Button onClick={() => navigate(`/wayfinder/${currentCaseId}`)} variant="outline">
                Cancel
              </Button>
              <div className="flex space-x-3">
                <Button
                  onClick={handleStep2}
                  className="bg-sky-600 hover:bg-sky-700"
                  disabled={submitting}
                >
                  {submitting ? "Creating Case..." : "Next Step →"}
                </Button>
              </div>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <h2 className="text-2xl font-bold text-center mb-4 text-sky-900">
              Step 2: Upload Supporting Documents
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Upload any supporting documents related to your incident (optional)
            </p>

            <div className="border-2 border-dashed border-sky-300 rounded-lg p-8 mb-6 bg-gradient-to-br from-sky-50 to-purple-50">
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-16 w-16 text-sky-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Upload PDF Documents
                </h3>
                <p className="text-gray-500 mb-4">
                  Select multiple Document files to include with your report
                </p>

                <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-sky-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:from-sky-600 hover:to-purple-700 transition-all duration-200 cursor-pointer transform hover:scale-105">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Choose Files
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-2">
                  Only PDF files are accepted
                </p>
              </div>
            </div>

            {documents.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex items-center mb-4">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Selected Files ({documents.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {documents.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-sky-50 p-4 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                          <svg
                            className="w-6 h-6 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{validationError}</p>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button
                onClick={handleBackToStep1}
                variant="outline"
                className="flex items-center"
              >
                ← Back
              </Button>
              <div className="flex space-x-3">
                <Button onClick={validateAndPreview} disabled={submitting}>
                  {submitting ? "Submitting..." : "Review & Submit"}
                </Button>
              </div>
            </div>
          </>
        )}

        <FinalSubmissionPdf
          open={pdfOpen}
          onOpenChange={setPdfOpen}
          formData={formData}
          uploadedFiles={uploadedFiles}
          onConfirm={async (pdfBase64, pageNum) => {
            setPdfOpen(false);
            await handleFinalSubmit(pdfBase64, pageNum);
          }}
        />

        <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <Dialog.Title className="text-xl font-bold text-sky-900 mb-2">
                Report Submitted Successfully
              </Dialog.Title>
              <Dialog.Description className="text-gray-600 mb-6">
                Your incident report (
                <strong>{localStorage.getItem("case_number")}</strong>) has been
                received by the Superior Court of San Francisco County.
              </Dialog.Description>
              <div className="flex justify-end">
                <Dialog.Close asChild>
                  <Button
                    onClick={() => {
                      navigate(`/wayfinder/${currentCaseId}`);
                      localStorage.removeItem("case_number");
                    }}
                  >
                    Proceed
                  </Button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <ChatModal open={isChatOpen} onOpenChange={setIsChatOpen} />
      </div>
    </Layout>
  );
};

export default IncidentReportForm;
