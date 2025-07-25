import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, AlertCircle, MessageSquare, Download, MoreHorizontal } from "lucide-react";

const Dashboard = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Case Progress"
            value="40%"
            subtitle="Step 2 of 5 completed"
            icon={<FileText className="w-6 h-6" />}
            iconBg="bg-success"
            trend="up"
          />
          <StatsCard
            title="Upcoming Dates"
            value="2"
            subtitle="Next: Motion Hearing in 3 days"
            icon={<Calendar className="w-6 h-6" />}
            iconBg="bg-judicial-accent"
          />
          <StatsCard
            title="Documents"
            value="8"
            subtitle="1 pending completion"
            icon={<FileText className="w-6 h-6" />}
            iconBg="bg-warning"
          />
          <StatsCard
            title="AI Assistance"
            value="24/7"
            subtitle="Always available"
            icon={<MessageSquare className="w-6 h-6" />}
            iconBg="bg-primary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Important Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Upcoming Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">Motion Hearing</span>
                    <Badge variant="destructive">10 Days!</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">March 15, 2024 at 9:00 AM</p>
                  <p className="text-sm text-muted-foreground">Courtroom 3A</p>
                </div>
                <Button variant="outline" size="sm">Add to Calendar</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">Document Deadline</span>
                  </div>
                  <p className="text-sm text-muted-foreground">March 10, 2024 at 5:00 PM</p>
                  <p className="text-sm text-muted-foreground">File with Court Clerk</p>
                </div>
                <Button variant="outline" size="sm">Add to Calendar</Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Recent Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">Motion to Dismiss</p>
                    <p className="text-sm text-muted-foreground">Modified 2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge>completed</Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-warning" />
                  <div>
                    <p className="font-medium">Statement of Facts</p>
                    <p className="text-sm text-muted-foreground">Modified 1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">in progress</Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Service of Process Form</p>
                    <p className="text-sm text-muted-foreground">Modified 5 days ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">pending</Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;