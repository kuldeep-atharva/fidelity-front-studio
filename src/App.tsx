import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Wayfinder from "./pages/Wayfinder";
import Dashboard from "./pages/Dashboard";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import Rules from "./pages/Rules";
import NotFound from "./pages/NotFound";
import IncidentReportForm from "./pages/IncidentReportForm";
import "./App.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/wayfinder" element={<Wayfinder />} />
          <Route path="/wayfinder/:caseId" element={<Wayfinder />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/step1" element={<IncidentReportForm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
