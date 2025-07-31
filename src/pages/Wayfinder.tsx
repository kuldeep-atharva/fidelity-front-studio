import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import ChatModal from "@/components/ChatModal";
import { supabase } from "@/utils/supabaseClient";
import { updateWorkflowStatus } from "@/utils/workflowUpdater";

const Wayfinder = () => {
  const { caseId } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string | null>(
    null
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [caseStatus, setCaseStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  // Default workflow steps
  const defaultWorkflowSteps = [
    {
      id: "default-1",
      title: "Case Assessment",
      description:
        "Complete the initial case assessment form to start the legal process.",
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
    // {
    //   id: "default-3",
    //   title: "Rule Matching",
    //   description: "Match the case with applicable legal rules and regulations.",
    //   status: "upcoming",
    //   duration: "1-2 days",
    //   tasks: [],
    //   action_metadata: {},
    //   failure_reason: null,
    // },
    {
      id: "default-3",
      title: "Review Process",
      description: "The case is reviewed by an assigned reviewer.",
      status: "upcoming",
      duration: "2-3 days",
      tasks: [],
      action_metadata: {},
      failure_reason: null,
    },
    {
      id: "default-4",
      title: "Sign Process",
      description: "The case documents are sent for signing.",
      status: "upcoming",
      duration: "1-2 days",
      tasks: [],
      action_metadata: {},
      failure_reason: null,
    },
    {
      id: "default-5",
      title: "Court Filing",
      description: "The finalized documents are filed with the court.",
      status: "upcoming",
      duration: "1 day",
      tasks: [],
      action_metadata: {},
      failure_reason: null,
    },
  ];

  // Fetch cases and initialize state based on URL
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        // Fetch cases
        const { data: casesData, error: casesError } = await supabase
          .from("cases")
          .select("id, case_number, status")
          .order("created_at", { ascending: false });

        if (casesError) throw casesError;
        setCases(casesData || []);

        // Check if caseId is present in URL
        if (caseId) {
          const caseFromUrl = casesData?.find((c) => c.id === caseId);
          if (caseFromUrl) {
            setSelectedCaseNumber(caseFromUrl.case_number);
            setSelectedCaseId(caseFromUrl.id);
            localStorage.setItem("case_number", caseFromUrl.case_number);
            setCaseStatus(caseFromUrl.status);

            // Fetch workflow steps for the selected case
            await updateWorkflowStatus(caseFromUrl.id, caseFromUrl.case_number);
            const { data: stepsData, error: stepsError } = await supabase
              .from("case_workflow_steps")
              .select("*")
              .eq("case_id", caseFromUrl.id)
              .order("step_order", { ascending: true });

            if (stepsError) throw stepsError;

            setWorkflowSteps(
              stepsData.map((step, index) => {
                if (step.step_name === "Court Filing" && index === 4) {
                  const signProcessStep = stepsData.find(
                    (s) => s.step_name === "Sign Process"
                  );
                  if (
                    signProcessStep &&
                    signProcessStep.action_status === "Completed"
                  ) {
                    return {
                      id: step.id,
                      title: step.step_name,
                      description: step.description,
                      status: "current",
                      duration: step.estimated_duration,
                      tasks: JSON.parse(step.tasks || "[]"),
                      action_metadata: step.action_metadata || {},
                      failure_reason: step.failure_reason,
                    };
                  }
                }
                return {
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
                };
              })
            );
          } else {
            // Invalid caseId, fallback to "Select none"
            setSelectedCaseNumber(null);
            setSelectedCaseId(null);
            setWorkflowSteps(defaultWorkflowSteps);
            setCaseStatus(null);
            localStorage.removeItem("case_number");
            navigate("/wayfinder");
          }
        } else {
          // No caseId in URL, default to "Select none"
          setSelectedCaseNumber(null);
          setSelectedCaseId(null);
          setWorkflowSteps(defaultWorkflowSteps);
          setCaseStatus(null);
          localStorage.removeItem("case_number");
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setWorkflowSteps(defaultWorkflowSteps);
        setCaseStatus(null);
        setSelectedCaseNumber(null);
        setSelectedCaseId(null);
        localStorage.removeItem("case_number");
        navigate("/wayfinder");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [caseId, navigate]);

  // Fetch workflow steps when a case is selected via dropdown
  useEffect(() => {
    if (!selectedCaseId || caseId === selectedCaseId) {
      // Skip if no case selected or if caseId from URL already handled
      return;
    }

    const fetchWorkflowSteps = async () => {
      setLoading(true);
      try {
        const { data: caseData, error: caseError } = await supabase
          .from("cases")
          .select("id, status")
          .eq("id", selectedCaseId)
          .single();

        if (caseError || !caseData) {
          setWorkflowSteps(defaultWorkflowSteps);
          setCaseStatus(null);
          setSelectedCaseNumber(null);
          setSelectedCaseId(null);
          localStorage.removeItem("case_number");
          navigate("/wayfinder");
          setLoading(false);
          return;
        }

        setCaseStatus(caseData.status);
        await updateWorkflowStatus(selectedCaseId, selectedCaseNumber || "");

        const { data, error } = await supabase
          .from("case_workflow_steps")
          .select("*")
          .eq("case_id", selectedCaseId)
          .order("step_order", { ascending: true });

        if (error) throw error;

        setWorkflowSteps(
          data.map((step, index) => {
            if (step.step_name === "Court Filing" && index === 4) {
              const signProcessStep = data.find(
                (s) => s.step_name === "Sign Process"
              );
              if (
                signProcessStep &&
                signProcessStep.action_status === "Completed"
              ) {
                return {
                  id: step.id,
                  title: step.step_name,
                  description: step.description,
                  status: "current",
                  duration: step.estimated_duration,
                  tasks: JSON.parse(step.tasks || "[]"),
                  action_metadata: step.action_metadata || {},
                  failure_reason: step.failure_reason,
                };
              }
            }
            return {
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
            };
          })
        );
      } catch (error) {
        console.error("Failed to fetch workflow steps:", error);
        setWorkflowSteps(defaultWorkflowSteps);
        setCaseStatus(null);
        setSelectedCaseNumber(null);
        setSelectedCaseId(null);
        localStorage.removeItem("case_number");
        navigate("/wayfinder");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowSteps();
  }, [selectedCaseId, selectedCaseNumber, caseId, navigate]);

  // Memoize workflow steps to optimize rendering
  const memoizedWorkflowSteps = useMemo(() => {
    return workflowSteps.length > 0 ? workflowSteps : defaultWorkflowSteps;
  }, [workflowSteps]);

  const handleRefresh = async () => {
    if (!selectedCaseId) return;

    try {
      setLoading(true);
      await updateWorkflowStatus(selectedCaseId, selectedCaseNumber || "");

      const { data, error } = await supabase
        .from("case_workflow_steps")
        .select("*")
        .eq("case_id", selectedCaseId)
        .order("step_order", { ascending: true });

      if (error) throw error;

      setWorkflowSteps(
        data.map((step, index) => {
          if (step.step_name === "Court Filing" && index === 4) {
            const signProcessStep = data.find(
              (s) => s.step_name === "Sign Process"
            );
            if (
              signProcessStep &&
              signProcessStep.action_status === "Completed"
            ) {
              return {
                id: step.id,
                title: step.step_name,
                description: step.description,
                status: "current",
                duration: step.estimated_duration,
                tasks: JSON.parse(step.tasks || "[]"),
                action_metadata: step.action_metadata || {},
                failure_reason: step.failure_reason,
              };
            }
          }
          return {
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
          };
        })
      );

      const { data: caseData } = await supabase
        .from("cases")
        .select("status")
        .eq("id", selectedCaseId)
        .single();

      setCaseStatus(caseData?.status || null);
    } catch (error) {
      console.error("Failed to refresh workflow steps:", error);
      alert("Failed to refresh case status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCaseChange = (value: string) => {
    if (value === "none") {
      setSelectedCaseNumber(null);
      setSelectedCaseId(null);
      setWorkflowSteps(defaultWorkflowSteps);
      setCaseStatus(null);
      localStorage.removeItem("case_number");
      navigate("/wayfinder");
    } else {
      const selectedCase = cases.find((c) => c.case_number === value);
      if (selectedCase) {
        setSelectedCaseNumber(value);
        setSelectedCaseId(selectedCase.id);
        localStorage.setItem("case_number", value);
        navigate(`/wayfinder/${selectedCase.id}`);
      }
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
            <h2 className="text-xl font-semibold text-primary">
              Your Legal Journey
            </h2>
            {cases.length > 0 && (
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Select a case to view its workflow.
              </p>
            )}
            {caseStatus && selectedCaseNumber && (
              <p className="text-muted-foreground">
                Case Status: {caseStatus || "N/A"}
              </p>
            )}
          </div>

          <div className="flex justify-center items-center space-x-4 mt-6">
            <Select
              onValueChange={handleCaseChange}
              value={selectedCaseNumber || "none"}
              disabled={loading}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a case">
                  {selectedCaseNumber
                    ? cases.find((c) => c.case_number === selectedCaseNumber)
                        ?.case_number
                    : "Select none"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select none</SelectItem>
                {cases.map((caseItem) => (
                  <SelectItem key={caseItem.id} value={caseItem.case_number}>
                    {caseItem.case_number}
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
            {selectedCaseNumber && (
              <Button
                onClick={() => navigate("/step1")}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <span>Start New Case</span>
              </Button>
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
          // <div className="text-center">Loading case details...</div>
          <div className="flex justify-center items-center h-64">
            <div className="custom-loader" />
          </div>
        ) : (
          <div className="space-y-6">
            {memoizedWorkflowSteps.map((step, index) => (
              <Card
                key={step.id || index}
                className={`${
                  step.status === "current"
                    ? "ring-2 ring-primary"
                    : step.status === "rejected"
                    ? "ring-2 ring-red-600"
                    : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(step.status, index)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold">
                            Step {index + 1}: {step.title}
                          </h3>
                          {step.status === "current" && (
                            <Badge variant="default">Current</Badge>
                          )}
                          {step.status === "rejected" && (
                            <Badge variant="destructive">Rejected</Badge>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          {step.duration}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        {step.description}
                      </p>
                      {step.status === "rejected" && step.failure_reason && (
                        <p className="text-red-600 text-sm mb-4">
                          Reason: {step.failure_reason}
                        </p>
                      )}
                      {(step.status === "current" ||
                        step.status === "completed") &&
                        step.tasks && (
                          <div className="space-y-3">
                            <h4 className="font-medium">
                              What you need to do:
                            </h4>
                            <ul className="space-y-2">
                              {step.tasks.map(
                                (task: string, taskIndex: number) => (
                                  <li
                                    key={taskIndex}
                                    className="flex items-start space-x-2"
                                  >
                                    <span className="text-primary">•</span>
                                    <span className="text-sm">{task}</span>
                                  </li>
                                )
                              )}
                            </ul>
                            {(step.title === "Review Process" ||
                              step.title === "Sign Process") &&
                              step.action_metadata && (
                                <div className="mt-4 space-y-2">
                                  <p className="text-sm">
                                    <strong>
                                      {step.title === "Review Process"
                                        ? "Reviewer"
                                        : "Signer"}{" "}
                                      Email:
                                    </strong>{" "}
                                    {step.action_metadata[
                                      step.title === "Review Process"
                                        ? "reviewer_email"
                                        : "signer_email"
                                    ] || "N/A"}
                                  </p>
                                  <p className="text-sm">
                                    <strong>SignCare Document ID:</strong>{" "}
                                    {step.action_metadata.signcare_doc_id ||
                                      "N/A"}
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
                                      {new Date(
                                        step.action_metadata.invitation_expiry
                                      ).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              )}
                            {step.status === "current" &&
                              step.title === "Case Assessment" && (
                                <div className="flex space-x-3 mt-4">
                                  <Button
                                    onClick={() => stepHandler(step.title)}
                                  >
                                    Start New Case
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsOpen(true)}
                                  >
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
