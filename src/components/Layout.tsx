import Header from "./Header";
import Navigation from "./Navigation";
import ChatBot from "./ChatBot";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <ChatBot />
    </div>
  );
};

export default Layout;