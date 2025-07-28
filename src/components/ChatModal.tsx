import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Send, MessageCircle, Info, User as UserIcon } from "lucide-react";

const MOCK_CASES = [
  {
    id: "INC-12345",
    title: "Slip and fall incident in the cafeteria area",
    type: "Safety Incident",
    status: "Under Review",
    priority: "High",
    date: "2024-01-15",
  },
  {
    id: "INC-11892",
    title: "Printer malfunction in office workspace",
    type: "Equipment",
    status: "Resolved",
    priority: "Medium",
    date: "2024-01-10",
  },
];

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OPENAI_API_KEY = import.meta.env.VITE_API_OPENAI_API_KEY;
const OPENAI_API_URL = import.meta.env.VITE_API_OPENAI_BASE_URL;
const OPENAI_API_MODEL = import.meta.env.VITE_API_OPENAI_MODEL;

const ChatModal = ({ open, onOpenChange }: ChatModalProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "assistant",
      content:
        "Hello! I'm your Legal AI Assistant. I'm here 24/7 to help you navigate your legal journey. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const quickQuestions = [
    "How do I file a motion?",
    "What documents do I need?",
    "When is my court date?",
    "How to serve papers?",
    "What are my rights?",
    "Explain legal terms",
    "Show my cases",
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
    setMessage("");

    setIsStreaming(true);
    setStreamedResponse("");

    try {
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
              content:
                "You are a helpful and accurate legal assistant that answers questions based only on U.S. federal and California law. If the question is outside your scope, say so politely.",
            },
            ...messages.map((msg) => ({
              role: msg.type === "user" ? "user" : "assistant",
              content: msg.content,
            })),
            {
              role: "user",
              content: message,
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
                    <div className="bg-white border border-blue-100 rounded-xl rounded-bl-none px-4 py-2 text-sm text-gray-900 shadow-sm max-w-[600px] whitespace-pre-wrap font-mono">
                      {msg.content}
                    </div>
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
            <span>This AI assistant provides general guidance only, not legal advice.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;