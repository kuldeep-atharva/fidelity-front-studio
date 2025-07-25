import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Clock, FileText, Search, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useEffect, useState } from "react";

const Admin = () => {
  const users = [
    {
      first_name: "John Doe",
      email: "john.doe@email.com",
      role: "user",
      status: "active",
      case_number: "SF-2024-001234",
      lastLogin: "15/01/2024"
    },
    {
      first_name: "Jane Smith",
      email: "jane.smith@email.com",
      role: "admin",
      status: "active",
      case_number: "-",
      lastLogin: "15/01/2024"
    },
    {
      first_name: "Mike Johnson",
      email: "mike.johnson@email.com",
      role: "user",
      status: "pending",
      case_number: "SF-2024-001235",
      lastLogin: "10/01/2024"
    }
  ];

  const [userList, setUserList] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('incident_reports').select('*');
      if (error) {
        console.error("Error fetching users:", error);
      } else {
        console.log("Fetched users:", data);
        setUserList(data);
      }
    };

    fetchUsers();
  }, [])

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Admin Dashboard</h1>
        </div>

        <div className="bg-card rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Admin Dashboard</h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
              Administrator
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Users"
              value="3"
              icon={<Users className="w-5 h-5" />}
              iconBg="bg-muted-foreground"
            />
            <StatsCard
              title="Active Users"
              value="2"
              icon={<UserCheck className="w-5 h-5" />}
              iconBg="bg-success"
            />
            <StatsCard
              title="Pending Approval"
              value="1"
              icon={<Clock className="w-5 h-5" />}
              iconBg="bg-destructive"
            />
            <StatsCard
              title="Published Content"
              value="2"
              icon={<FileText className="w-5 h-5" />}
              iconBg="bg-muted-foreground"
            />
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="content">Content Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">System Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">User Management</h3>
                <p className="text-muted-foreground text-sm mb-6">Manage user accounts, roles, and permissions</p>

                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Search users..." className="pl-10" />
                  </div>
                  <Select defaultValue="all-roles">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-roles">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all-status">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-status">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Case Number</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {userList.map((user, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{user.first_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "active" ? "default" : "secondary"}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.case_number}</TableCell>
                          <TableCell>{user.incident_date}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.map((user, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{user.first_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "active" ? "default" : "secondary"}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.case_number}</TableCell>
                          <TableCell>{user.lastLogin}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Content Management</h3>
                <p className="text-muted-foreground">Content management features coming soon.</p>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                <p className="text-muted-foreground">Analytics dashboard coming soon.</p>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">System Settings</h3>
                <p className="text-muted-foreground">System configuration options coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
