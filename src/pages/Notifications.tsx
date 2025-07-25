import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Calendar, FileText, AlertCircle, Info, Trash2, MoreHorizontal } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "court",
    title: "Court Date Scheduled",
    message: "Your hearing has been scheduled for March 15, 2024 at 9:00 AM in Department 302.",
    date: "16/01/2024",
    priority: "high",
    unread: true
  },
  {
    id: 2,
    type: "document",
    title: "Document Deadline Approaching",
    message: "You have 3 days to submit your response to the court.",
    date: "14/01/2024",
    priority: "high",
    unread: true
  },
  {
    id: 3,
    type: "document",
    title: "Document Received",
    message: "The court has received your petition. Case number: SF-2024-001234",
    date: "12/01/2024",
    priority: "medium",
    unread: false
  },
  {
    id: 4,
    type: "system",
    title: "Profile Updated",
    message: "Your contact information has been successfully updated.",
    date: "10/01/2024",
    priority: "low",
    unread: false
  },
  {
    id: 5,
    type: "deadline",
    title: "Filing Fee Due",
    message: "Your filing fee of $435 is due within 30 days.",
    date: "08/01/2024",
    priority: "medium",
    unread: false
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "court":
      return <Calendar className="w-5 h-5" />;
    case "document":
      return <FileText className="w-5 h-5" />;
    case "deadline":
      return <AlertCircle className="w-5 h-5" />;
    default:
      return <Info className="w-5 h-5" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "text-destructive";
    case "medium":
      return "text-warning";
    default:
      return "text-muted-foreground";
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive">High</Badge>;
    case "medium":
      return <Badge className="bg-warning text-warning-foreground">Medium</Badge>;
    default:
      return <Badge variant="outline">Low</Badge>;
  }
};

const Notifications = () => {
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Notifications</h1>
          </div>
          <Button variant="outline">Mark All as Read</Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span className="font-medium">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} unread</Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All (5)</TabsTrigger>
            <TabsTrigger value="court">Court (1)</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines (2)</TabsTrigger>
            <TabsTrigger value="documents">Documents (1)</TabsTrigger>
            <TabsTrigger value="system">System (1)</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Notifications</CardTitle>
                <p className="text-sm text-muted-foreground">
                  View all your notifications in chronological order
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-4 p-4 rounded-lg border ${
                      notification.unread ? 'bg-muted/50 border-primary/20' : 'bg-background'
                    }`}
                  >
                    <div className={getPriorityColor(notification.priority)}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{notification.title}</h4>
                          {getPriorityBadge(notification.priority)}
                          {notification.unread && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{notification.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Notifications;