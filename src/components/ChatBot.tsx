import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChatBot = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        size="lg" 
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary-dark"
        onClick={() => {
          // Chatbot functionality would be implemented here
          console.log("Chatbot clicked");
        }}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default ChatBot;