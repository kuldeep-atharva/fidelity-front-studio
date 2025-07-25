import Layout from "@/components/Layout";
import ServiceCard from "@/components/ServiceCard";
import { MapPin, BarChart3, Bell, Shield, Settings, Clock } from "lucide-react";

const Index = () => {
  return (
    <Layout>
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">Your Legal Command Center</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Navigate your legal journey with confidence using our comprehensive suite of tools and resources.
          </p>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <ServiceCard
            title="Wayfinder"
            description="Navigate your legal journey with step-by-step guidance"
            icon={<MapPin />}
            iconBg="bg-primary"
            href="/wayfinder"
          />
          <ServiceCard
            title="Dashboard"
            description="View your case status, documents, and important deadlines"
            icon={<BarChart3 />}
            iconBg="bg-judicial-accent"
            href="/dashboard"
          />
          <ServiceCard
            title="Notifications"
            description="Stay updated with important alerts and reminders"
            icon={<Bell />}
            iconBg="bg-success"
            href="/notifications"
          />
          <ServiceCard
            title="Admin"
            description="Manage users, content, and system settings"
            icon={<Shield />}
            iconBg="bg-judicial-accent"
            href="/admin"
          />
          <ServiceCard
            title="Rules"
            description="Configure and modify application rules dynamically"
            icon={<Settings />}
            iconBg="bg-primary"
            href="/rules"
          />
        </div>

        {/* Security & Features Section */}
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-primary text-center mb-8">
            Built for Your Security & Success
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Shield className="text-white w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your personal information is encrypted and protected with bank-level security.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-judicial-accent rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Settings className="text-white w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Expert Reviewed</h3>
              <p className="text-muted-foreground">
                All guidance and templates are reviewed by legal professionals for accuracy.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-success rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Clock className="text-white w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Always Available</h3>
              <p className="text-muted-foreground">
                Get support whenever you need it, day or night, throughout your legal journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
