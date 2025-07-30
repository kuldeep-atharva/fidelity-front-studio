import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Circle,
  Clock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatModal from "@/components/ChatModal";
import { supabase } from "@/utils/supabaseClient";
import { updateWorkflowStatus } from "@/utils/workflowUpdater";

const Wayfinder = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string | null>(
    localStorage.getItem("case_number") || null
  );
  const [loading, setLoading] = useState(true);
  const [caseStatus, setCaseStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  // Default workflow steps when no cases are available
  const defaultWorkflowSteps = [
    {
      id: "default-1",
      title: "Case Assessment",
      description: "Complete the initial case assessment form to start the legal process.",
      status: "current",
      duration: "1-2 days",
      tasks: [
        "Fill out the incident report form.",
        "Provide details about the case.",
        "Submit for initial review.",
      ],
      action_metadata: {},
      failure_reason: null,
    },
    {
      id: "default-2",
      title: "Document Preparation",
      description: "Prepare the necessary legal documents for the case.",
      status: "upcoming",
      duration: "2-3 days",
      tasks: [],
      action_metadata: {},
      failure_reason: null,
    },
    {
      id: "default-3",
      title: "Rule Matching",
      description: "Match the case with applicable legal rules and regulations.",
      status: "upcoming",
      duration: "1-2 days",
      tasks: [],
      action_metadata: {},
      failure_reason: null,
    },
    {
      id: "default-4",
      title: "Review Process",
      description: "The case is reviewed by an assigned reviewer.",
      status: "upcoming",
      duration: "2-3 days",
      tasks: [],
      action_metadata: {},
      failure_reason: null,
    },
    {
      id: "default-5",
      title: "Sign Process",
      description: "The case documents are sent for signing.",
      status: "upcoming",
      duration: "1-2 days",
      tasks: [],
      action_metadata: {},
      failure_reason: null,
    },
    {
      id: "default-6",
      title: "Court Filing",
      description: "The finalized documents are filed with the court.",
      status: "upcoming",
      duration: "1 day",
      tasks: [],
      action_metadata: {},
      failure_reason: null,
    },
  ];

  // Fetch all cases for the dropdown
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data, error } = await supabase
          .from("cases")
          .select("id, case_number, status")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCases(data || []);

        if (data && data.length > 0) {
          // Select the latest case (first in the ordered list)
          const latestCase = data[0];
          if (!selectedCaseNumber || !data.some((c) => c.case_number === selectedCaseNumber)) {
            setSelectedCaseNumber(latestCase.case_number);
            localStorage.setItem("case_number", latestCase.case_number);
          }
        } else {
          // No cases available, set default workflow steps
          setWorkflowSteps(defaultWorkflowSteps);
          setCaseStatus(null);
          setSelectedCaseNumber(null);
          localStorage.removeItem("case_number");
        }
      } catch (error) {
        console.error("Failed to fetch cases:", error);
        setWorkflowSteps(defaultWorkflowSteps); // Fallback to default steps on error
        setCaseStatus(null);
        setSelectedCaseNumber(null);
        localStorage.removeItem("case_number");
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  // Fetch workflow steps and case status for the selected case
  useEffect(() => {
    const fetchWorkflowSteps = async () => {
      if (cases.length === 0 || !selectedCaseNumber) {
        setWorkflowSteps(defaultWorkflowSteps); // Always show default steps when no cases
        setCaseStatus(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: caseData, error: caseError } = await supabase
          .from("cases")
          .select("id, status")
          .eq("case_number", selectedCaseNumber)
          .single();

        if (caseError || !caseData) {
          setWorkflowSteps(defaultWorkflowSteps);
          setCaseStatus(null);
          setLoading(false);
          return;
        }
        setCaseStatus(caseData.status);

        await updateWorkflowStatus(caseData.id, selectedCaseNumber);

        const { data, error } = await supabase
          .from("case_workflow_steps")
          .select("*")
          .eq("case_id", caseData.id)
          .order("step_order", { ascending: true });

        if (error) throw error;

        setWorkflowSteps(
          data.map((step) => ({
            id: step.id,
            title: step.step_name,
            description: step.description,
            status:
              step.action_status === "Completed"
                ? "completed"
                : step.action_status === "Rejected"
                ? "rejected"
                : step.is_active
                ? "current"
                : "upcoming",
            duration: step.estimated_duration,
            tasks: JSON.parse(step.tasks || "[]"),
            action_metadata: step.action_metadata || {},
            failure_reason: step.failure_reason,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch workflow steps:", error);
        setWorkflowSteps(defaultWorkflowSteps); // Fallback to default steps on error
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowSteps();
    const interval = setInterval(fetchWorkflowSteps, 30000);
    return () => clearInterval(interval);
  }, [cases, selectedCaseNumber]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!selectedCaseNumber) return;

    try {
      setLoading(true);
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("id, status")
        .eq("case_number", selectedCaseNumber)
        .single();

      if (caseError || !caseData) {
        alert("Failed to find selected case.");
        return;
      }

      await updateWorkflowStatus(caseData.id, selectedCaseNumber);

      const { data, error } = await supabase
        .from("case_workflow_steps")
        .select("*")
        .eq("case_id", caseData.id)
        .order("step_order", { ascending: true });

      if (error) throw error;

      setWorkflowSteps(
        data.map((step) => ({
          id: step.id,
          title: step.step_name,
          description: step.description,
          status:
            step.action_status === "Completed"
              ? "completed"
              : step.action_status === "Rejected"
              ? "rejected"
              : step.is_active
              ? "current"
              : "upcoming",
          duration: step.estimated_duration,
          tasks: JSON.parse(step.tasks || "[]"),
          action_metadata: step.action_metadata || {},
          failure_reason: step.failure_reason,
        }))
      );

      setCaseStatus(caseData.status);
    } catch (error) {
      console.error("Failed to refresh workflow steps:", error);
      alert("Failed to refresh case status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepHandler = (stepName: string) => {
    if (stepName === "Case Assessment") {
      navigate("/step1");
    }
  };

  const getStatusIcon = (status: string, index: number) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-8 h-8 text-success" />;
      case "current":
        return (
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{index + 1}</span>
          </div>
        );
      case "rejected":
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Circle className="w-8 h-8 text-muted-foreground" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-primary">Wayfinder</h1>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">Your Legal Journey</h2>
            {cases.length > 0 && (
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Select a case to view its workflow.
              </p>
            )}
            {caseStatus && selectedCaseNumber && (
              <p className="text-muted-foreground">Case Status: {caseStatus || "N/A"}</p>
            )}
          </div>

          <div className="flex justify-center items-center space-x-4 mt-6">
            {cases.length > 0 ? (
              <>
                <Select
                  onValueChange={(value) => {
                    setSelectedCaseNumber(value);
                    localStorage.setItem("case_number", value);
                  }}
                  value={selectedCaseNumber || undefined}
                  disabled={loading}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a case">
                      {selectedCaseNumber
                        ? cases.find((c) => c.case_number === selectedCaseNumber)
                            ?.case_number
                        : "Select a case"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.case_number}>
                        {caseItem.case_number} ({caseItem.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleRefresh}
                  disabled={loading || !selectedCaseNumber}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Status</span>
                </Button>
                <Button
                  onClick={() => navigate("/step1")}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <span>Start New Case</span>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Follow this step-by-step guide to navigate your legal process with confidence.
              </p>
            )}
          </div>

          <div className="flex justify-center space-x-8 mt-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm">Current Step</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-muted rounded-full"></div>
              <span className="text-sm">Upcoming</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span className="text-sm">Rejected</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center">Loading workflow steps...</div>
        ) : (
          <div className="space-y-6">
            {workflowSteps.map((step, index) => (
              <Card
                key={step.id || index}
                className={`${step.status === "current" ? "ring-2 ring-primary" : step.status === "rejected" ? "ring-2 ring-red-600" : ""}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">{getStatusIcon(step.status, index)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold">
                            Step {index + 1}: {step.title}
                          </h3>
                          {step.status === "current" && <Badge variant="default">Current</Badge>}
                          {step.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          {step.duration}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      {step.status === "rejected" && step.failure_reason && (
                        <p className="text-red-600 text-sm mb-4">Reason: {step.failure_reason}</p>
                      )}
                      {(step.status === "current" || step.status === "completed") && step.tasks && (
                        <div className="space-y-3">
                          <h4 className="font-medium">What you need to do:</h4>
                          <ul className="space-y-2">
                            {step.tasks.map((task: string, taskIndex: number) => (
                              <li key={taskIndex} className="flex items-start space-x-2">
                                <span className="text-primary">•</span>
                                <span className="text-sm">{task}</span>
                              </li>
                            ))}
                          </ul>
                          {(step.title === "Review Process" || step.title === "Sign Process") &&
                            step.action_metadata && (
                              <div className="mt-4 space-y-2">
                                <p className="text-sm">
                                  <strong>{step.title === "Review Process" ? "Reviewer" : "Signer"} Email:</strong>{" "}
                                  {step.action_metadata[step.title === "Review Process" ? "reviewer_email" : "signer_email"] || "N/A"}
                                </p>
                                <p className="text-sm">
                                  <strong>SignCare Document ID:</strong>{" "}
                                  {step.action_metadata.signcare_doc_id || "N/A"}
                                </p>
                                <p className="text-sm">
                                  <strong>Action Status:</strong>{" "}
                                  {step.action_status || "N/A"}
                                </p>
                                {step.action_metadata.signer_id && (
                                  <p className="text-sm">
                                    <strong>Signer ID:</strong>{" "}
                                    {step.action_metadata.signer_id}
                                  </p>
                                )}
                                {step.action_metadata.invitation_expiry && (
                                  <p className="text-sm">
                                    <strong>Invitation Expiry:</strong>{" "}
                                    {new Date(step.action_metadata.invitation_expiry).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          {step.status === "current" && step.title === "Case Assessment" && (
                            <div className="flex space-x-3 mt-4">
                              <Button onClick={() => stepHandler(step.title)}>
                                Start New Case
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                              <Button variant="outline" onClick={() => setIsOpen(true)}>
                                Get Help
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <ChatModal open={isOpen} onOpenChange={setIsOpen} />
    </Layout>
  );
};

export default Wayfinder;
