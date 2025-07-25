import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatModal from "./ChatModal";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          size="lg" 
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary-dark"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
      
      <ChatModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default ChatBot;