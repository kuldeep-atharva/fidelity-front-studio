import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Send, MessageCircle, Info, User as UserIcon, FileText, Clock } from "lucide-react";
import { CaseService, CaseWithWorkflow } from "@/services/caseService";
import { Badge } from "./ui/badge";

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  type: "user" | "assistant";
  content: string;
  timestamp: string;
  cases?: CaseWithWorkflow[];
}

const OPENAI_API_KEY = import.meta.env.VITE_API_OPENAI_API_KEY;
const OPENAI_API_URL = import.meta.env.VITE_API_OPENAI_BASE_URL;
const OPENAI_API_MODEL = import.meta.env.VITE_API_OPENAI_MODEL;

const ChatModal = ({ open, onOpenChange }: ChatModalProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: "assistant",
      content:
        "Hello! I'm your Legal AI Assistant with access to your case data. I can help you with legal questions and provide updates on your cases. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [userEmail, setUserEmail] = useState<string>("admin@fidelity.com"); // In real app, get from auth context
  const [caseData, setCaseData] = useState<CaseWithWorkflow[]>([]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const quickQuestions = [
    "Show my cases",
    "Check case status",
    "What's my case progress?",
    "How do I file a motion?",
    "What documents do I need?",
    "When is my court date?",
    "What are my rights?",
    "Explain legal terms",
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const now = new Date().toLocaleTimeString();
    const userMessage = {
      type: "user",
      content: message,
      timestamp: now,
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");

    setIsStreaming(true);
    setStreamedResponse("");

    try {
      // Check if this is a case-related query
      let caseContext = "";
      let caseInfoMessage = "";

      console.log("💬 Processing message:", currentMessage);
      console.log("👤 Current user email:", userEmail);

      if (CaseService.isCaseQuery(currentMessage)) {
        console.log("✅ Detected as case-related query");
        // Handle specific case queries
        if (currentMessage.toLowerCase().includes("show my cases") || 
            currentMessage.toLowerCase().includes("my cases")) {
          // Show user's cases
          const userCases = await CaseService.getUserCases(userEmail || "admin@fidelity.com");
          setCaseData(userCases);
          
          if (userCases.length > 0) {
            caseInfoMessage = "Here are your current cases:\n\n";
            userCases.forEach(caseItem => {
              caseInfoMessage += CaseService.formatCaseForAI(caseItem) + "\n";
            });
            caseContext = `User has ${userCases.length} cases: ${userCases.map(c => `${c.case_number} (${c.status})`).join(", ")}`;
          } else {
            caseInfoMessage = "You don't have any cases assigned to you currently.";
          }
        } else {
          // Check for specific case number
          const caseNumber = CaseService.extractCaseNumber(currentMessage);
          console.log("🔢 Extracted case number:", caseNumber);
          
          if (caseNumber) {
            console.log("🔍 Searching for case:", caseNumber);
            const caseDetails = await CaseService.getCaseByNumber(caseNumber);
            if (caseDetails) {
              console.log("✅ Found case details for:", caseNumber);
              caseInfoMessage = CaseService.formatCaseForAI(caseDetails);
              caseContext = `Case ${caseNumber}: ${caseDetails.status}, Type: ${caseDetails.type_of_incident}`;
            } else {
              console.log("❌ Case not found:", caseNumber);
              caseInfoMessage = `Case ${caseNumber} not found or you don't have access to it.`;
            }
          } else {
            // General case search
            const searchResults = await CaseService.searchCases(currentMessage, userEmail || "admin@fidelity.com");
            if (searchResults.length > 0) {
              setCaseData(searchResults);
              caseInfoMessage = "Here are the relevant cases I found:\n\n";
              searchResults.slice(0, 3).forEach(caseItem => {
                caseInfoMessage += CaseService.formatCaseForAI(caseItem) + "\n";
              });
              caseContext = `Found ${searchResults.length} relevant cases`;
            }
          }
        }
      }

      // If we have case information, show it immediately
      if (caseInfoMessage) {
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: caseInfoMessage,
            timestamp: new Date().toLocaleTimeString(),
            cases: caseData,
          },
        ]);
        setIsStreaming(false);
        return;
      }

      // Continue with OpenAI API call for general questions
      const systemPrompt = `You are a helpful and accurate legal assistant that answers questions based on U.S. federal and California law. You also have access to case management data.

${caseContext ? `Current case context: ${caseContext}` : ""}

CRITICAL RULES:
- NEVER make up case information, numbers, or details
- If asked about specific cases without database context, say "I don't have access to that case information"
- For case-related queries, ONLY use the provided case context above
- If no case context is provided for a case query, explain you cannot access that information
- For legal questions, provide accurate information based on law
- Keep responses concise but comprehensive
- Always mention if legal advice from a qualified attorney is recommended

If a user asks about a specific case and no case context is provided above, respond with: "I don't have access to case information in my current context. Please use the case-specific queries like 'Show my cases' or 'Status of CASE-123' to get accurate case information from the database."`;

      const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_API_MODEL,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...messages.slice(-5).map((msg) => ({
              role: msg.type === "user" ? "user" : "assistant",
              content: msg.content,
            })),
            {
              role: "user",
              content: currentMessage,
            },
          ],
          temperature: 0.3,
          stream: true,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let fullText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          chunk.split("\n").forEach((line) => {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") return;
              try {
                const data = JSON.parse(dataStr);
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  fullText += content;
                  setStreamedResponse(fullText);
                }
              } catch {}
            }
          });
        }
      }

      setIsStreaming(false);
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: fullText,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setStreamedResponse("");
    } catch (error) {
      setIsStreaming(false);
      setStreamedResponse("");
      console.error("OpenAI API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "Sorry, I couldn't get an answer at the moment. Please try again.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
  };

  // Component to display case cards
  const CaseCard = ({ caseItem }: { caseItem: CaseWithWorkflow }) => {
    const currentStep = CaseService.getCurrentStep(caseItem.workflow_steps || []);
    const completedSteps = caseItem.workflow_steps?.filter(step => step.action_status === "Completed").length || 0;
    const totalSteps = caseItem.workflow_steps?.length || 0;

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'in progress': return 'bg-blue-100 text-blue-800';
        case 'reviewed': return 'bg-purple-100 text-purple-800';
        case 'signed': return 'bg-indigo-100 text-indigo-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="border rounded-lg p-4 mb-3 bg-gray-50 max-w-md">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-sm">{caseItem.case_number}</span>
          </div>
          <Badge variant="secondary" className={`text-xs ${getStatusColor(caseItem.status)}`}>
            {caseItem.status}
          </Badge>
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span>{caseItem.first_name} {caseItem.last_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span>{caseItem.type_of_incident}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Progress:</span>
            <span>{completedSteps}/{totalSteps} steps</span>
          </div>
          {currentStep?.estimated_duration && (
            <div className="flex items-center gap-1 text-gray-500 mt-2">
              <Clock className="w-3 h-3" />
              <span className="text-xs">ETA: {currentStep.estimated_duration}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[1100px] max-w-[90vw] h-[700px] p-0 rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-white">
        <DialogHeader className="p-4 pb-0 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-primary">
              AI Legal Assistant
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm">Legal AI Assistant</div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Available 24/7
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b bg-[#f9f9f9]">
          <div className="text-sm font-medium mb-2">Quick Questions:</div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="rounded-full text-xs px-3 py-1 border border-blue-100 bg-white transition-colors hover:bg-blue-500 hover:text-white hover:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium"
                onClick={() => handleQuickQuestion(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.type === "assistant" ? (
                <div className="flex items-end gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="bg-white border border-blue-100 rounded-xl rounded-bl-none px-4 py-2 text-sm text-gray-900 shadow-sm max-w-[600px] whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    {/* Display case cards if message contains case data */}
                    {msg.cases && msg.cases.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.cases.slice(0, 3).map((caseItem, idx) => (
                          <CaseCard key={`${caseItem.id}-${idx}`} caseItem={caseItem} />
                        ))}
                        {msg.cases.length > 3 && (
                          <div className="text-xs text-gray-500 pl-2">
                            ... and {msg.cases.length - 3} more cases
                          </div>
                        )}
                      </div>
                    )}
                    <div className="text-xs mt-1 text-gray-400 pl-2">{msg.timestamp}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-end gap-2 flex-row-reverse">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="bg-blue-500 text-white rounded-xl rounded-br-none px-4 py-2 text-sm max-w-[600px] shadow-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    <div className="text-xs mt-1 text-gray-200 pr-2 text-right">{msg.timestamp}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="bg-white border border-blue-100 rounded-xl rounded-bl-none px-4 py-2 text-sm text-gray-900 shadow-sm max-w-[600px] whitespace-pre-wrap font-mono">
                    {streamedResponse}
                    <span className="animate-pulse text-blue-400 ml-1">|</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="text-sm rounded-md"
            />
            <Button onClick={handleSendMessage} className="bg-blue-600 text-white px-3">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>This AI assistant provides general guidance only, not legal advice. Case data is fetched from your database in real-time.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;