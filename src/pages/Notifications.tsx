import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Calendar, FileText, AlertCircle, Info, Trash2, MoreHorizontal } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";

interface Notification {
  id: string;
  user_id: string;
  case_id: string | null;
  type: 'court' | 'document' | 'deadline' | 'system';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  is_read: boolean;
  created_at: string;
  case_number?: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, full_name, email")
          .order("full_name", { ascending: true });

        if (error) throw error;

        setUsers(data || []);
        if (data && data.length > 0) {
          setSelectedUserId(data[0].id); // Default to the first user
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch users");
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  // Fetch notifications for the selected user
  useEffect(() => {
    if (!selectedUserId) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("notifications")
          .select(`
            id,
            user_id,
            case_id,
            type,
            title,
            message,
            priority,
            is_read,
            created_at,
            cases(case_number)
          `)
          .eq("user_id", selectedUserId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedNotifications = data.map((notification: any) => ({
          id: notification.id,
          user_id: notification.user_id,
          case_id: notification.case_id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          is_read: notification.is_read,
          created_at: new Date(notification.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
          case_number: notification.cases?.case_number || null,
        }));

        setNotifications(formattedNotifications);
      } catch (err: any) {
        setError(err.message || "Failed to fetch notifications");
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [selectedUserId]);

  // Handle marking a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (err: any) {
      console.error("Error marking notification as read:", err);
      alert("Failed to mark notification as read");
    }
  };

  // Handle deleting a notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err: any) {
      console.error("Error deleting notification:", err);
      alert("Failed to delete notification");
    }
  };

  // Handle marking all notifications as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", selectedUserId)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err: any) {
      console.error("Error marking all notifications as read:", err);
      alert("Failed to mark all notifications as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Group notifications by type for tabs
  const notificationTypes = ["all", "court", "deadlines", "documents", "system"];
  const groupedNotifications = notificationTypes.reduce(
    (acc, type) => {
      if (type === "all") {
        acc[type] = notifications;
      } else {
        acc[type] = notifications.filter((n) => n.type === type);
      }
      return acc;
    },
    {} as Record<string, Notification[]>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="custom-loader" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-primary">Notifications</h1>
          <div className="text-red-600">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Notifications</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Select
              value={selectedUserId || ""}
              onValueChange={setSelectedUserId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || !selectedUserId}
            >
              Mark All as Read
            </Button>
          </div>
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
            {notificationTypes.map((type) => (
              <TabsTrigger key={type} value={type} className="capitalize">
                {type} ({groupedNotifications[type].length})
              </TabsTrigger>
            ))}
          </TabsList>

          {notificationTypes.map((type) => (
            <TabsContent key={type} value={type} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {type === "all" ? "All Notifications" : `${type.charAt(0).toUpperCase() + type.slice(1)} Notifications`}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    View {type === "all" ? "all notifications" : `${type} notifications`} in chronological order
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupedNotifications[type].length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No {type} notifications available for the selected user.
                    </p>
                  ) : (
                    groupedNotifications[type].map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start space-x-4 p-4 rounded-lg border ${
                          !notification.is_read ? "bg-muted/50 border-primary/20" : "bg-background"
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
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-primary rounded-full" />
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {notification.created_at}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                            {notification.case_number && (
                              <span> (Case: {notification.case_number})</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Notifications;
