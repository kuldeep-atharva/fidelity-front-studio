import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Send, MessageCircle, Info } from "lucide-react";

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChatModal = ({ open, onOpenChange }: ChatModalProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "assistant",
      content: "Hello! I'm your Legal AI Assistant. I'm here 24/7 to help you navigate your legal journey. How can I assist you today?",
      timestamp: "13:01:13"
    }
  ]);

  const quickQuestions = [
    "How do I file a motion?",
    "What documents do I need?",
    "When is my court date?",
    "How to serve papers?",
    "What are my rights?"
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, {
        type: "user",
        content: message,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setMessage("");
      
      // Simulate AI response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: "assistant",
          content: "Thank you for your question. I'm processing your request and will provide guidance based on California court procedures.",
          timestamp: new Date().toLocaleTimeString()
        }]);
      }, 1000);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[600px] p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-primary">
              AI Legal Assistant
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col">
          {/* Assistant Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium">Legal AI Assistant</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Available 24/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Questions */}
          <div className="p-4 border-b">
            <div className="text-sm font-medium mb-3">Quick Questions:</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="text-xs h-8">
              Explain legal terms
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.type === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-muted text-foreground'
                  }`}>
                    <div className="text-sm">{msg.content}</div>
                    <div className={`text-xs mt-1 ${
                      msg.type === 'user' ? 'text-white/70' : 'text-muted-foreground'
                    }`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Ask your legal question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} className="px-3">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Disclaimer */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>This AI assistant provides general guidance only, not legal advice.</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;