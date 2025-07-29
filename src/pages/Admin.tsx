import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  Clock,
  FileText,
  Search,
  Edit,
  Trash2,
  RefreshCcw,
} from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useEffect, useState } from "react";
import axios from "axios";

const Admin = () => {
  const [cases, setCases] = useState([]); // Cases from the database
  const [rules, setRules] = useState([]); // Rules from the database
  const [filterRole, setFilterRole] = useState("all-roles");
  const [filterStatus, setFilterStatus] = useState("all-status");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchCasesAndRules = async () => {
      try {
        // Fetch cases
        const { data: casesData, error: casesError } = await supabase
          .from("cases")
          .select("*");
        if (casesError) throw casesError;

        // Fetch rules
        const { data: rulesData, error: rulesError } = await supabase
          .from("rules")
          .select("*");
        if (rulesError) throw rulesError;

        setCases(casesData || []);
        setRules(rulesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchCasesAndRules();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("*");
        if (usersError) throw usersError;

        setUsers(usersData || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const filteredCases = cases
    .filter((caseItem) => {
      const roleMatch =
        filterRole === "all-roles" || caseItem.role === filterRole;
      const statusMatch =
        filterStatus === "all-status" || caseItem.status === filterStatus;
      return roleMatch && statusMatch;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ); // Sort by created_at in descending order

  const checkStatusHandler = async (
    id: string,
    docId: string,
    refId: string
  ) => {
    console.log("filtered cases:", filteredCases);
    const statusResponse = await axios.post(
      `${import.meta.env.VITE_API_SC_BASE}/esign/status`,
      {
        documentId: docId,
        documentReferenceId: refId,
      },
      {
        headers: {
          "X-API-KEY": `${import.meta.env.VITE_API_SC_X_KEY}`,
          "X-API-APP-ID": `${import.meta.env.VITE_API_SC_X_ID}`,
        },
      }
    );

    const updatedCase = await supabase
      .from("cases")
      .update({ status: statusResponse.data.data.documentStatus })
      .eq("id", id)
      .select();
    console.log("Updated case:", updatedCase);
    setCases((prev) =>
      prev.map((caseItem) =>
        caseItem.id === updatedCase.data[0].id ? updatedCase.data[0] : caseItem
      )
    );
  };
  const getPriorityByRuleId = (ruleId) => {
    const rule = rules.find((r) => r.id === ruleId);
    return rule ? rule.priority : "N/A"; // Return "N/A" if no matching rule is found
  };
  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) {
        console.error("Error updating role:", error);
        alert("Failed to update the role. Please try again.");
      } else {
        alert("Role updated successfully!");
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Admin Dashboard
          </h1>
        </div>

        <div className="bg-card rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Admin Dashboard
            </h2>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary"
            >
              Administrator
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Cases"
              value={cases.length.toString()}
              icon={<Users className="w-5 h-5" />}
              iconBg="bg-muted-foreground"
            />
            <StatsCard
              title="New Cases"
              value={cases.filter((c) => c.status === "New").length.toString()}
              icon={<Clock className="w-5 h-5" />}
              iconBg="bg-destructive"
            />
            <StatsCard
              title="Approved Cases"
              value={cases
                .filter((c) => c.status === "Signed")
                .length.toString()}
              icon={<UserCheck className="w-5 h-5" />}
              iconBg="bg-success"
            />
            <StatsCard
              title="Closed Cases"
              value={cases
                .filter((c) => c.status === "Closed")
                .length.toString()}
              icon={<FileText className="w-5 h-5" />}
              iconBg="bg-muted-foreground"
            />
          </div>

          <Tabs defaultValue="cases" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cases">Case Management</TabsTrigger>
              <TabsTrigger value="content">User Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">System Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="cases" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Case Management
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Manage cases, statuses, and assignments
                </p>

                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Search cases..." className="pl-10" />
                  </div>
                  <Select
                    defaultValue="all-roles"
                    onValueChange={setFilterRole}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-roles">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    defaultValue="all-status"
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-status">All Status</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case Number</TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type of Incident</TableHead>
                        <TableHead>Contact Email</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCases.map((caseItem, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {caseItem.case_number}
                          </TableCell>
                          <TableCell>{caseItem.first_name}</TableCell>
                          <TableCell>{caseItem.last_name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                caseItem.status === "New"
                                  ? "default"
                                  : caseItem.status === "Approved"
                                  ? "outline"
                                  : caseItem.status === "Rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {caseItem.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{caseItem.type_of_incident}</TableCell>
                          <TableCell>{caseItem.contact_email}</TableCell>
                          <TableCell>
                            {getPriorityByRuleId(caseItem.rule_applied)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  checkStatusHandler(
                                    caseItem.id,
                                    caseItem.signcare_doc_id,
                                    caseItem.case_number
                                  )
                                }
                              >
                                {/* <Edit className="w-4 h-4" /> */}
                                <RefreshCcw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  const confirmDelete = window.confirm(
                                    `Are you sure you want to delete case ${caseItem.case_number}?`
                                  );
                                  if (confirmDelete) {
                                    try {
                                      const { error } = await supabase
                                        .from("cases")
                                        .delete()
                                        .eq("id", caseItem.id); // Use the unique `id` field to delete the case

                                      if (error) {
                                        console.error(
                                          "Error deleting case:",
                                          error
                                        );
                                        alert(
                                          "Failed to delete the case. Please try again."
                                        );
                                      } else {
                                        // alert("Case deleted successfully!");
                                        // Remove the deleted case from the local state
                                        setCases((prevCases) =>
                                          prevCases.filter(
                                            (c) => c.id !== caseItem.id
                                          )
                                        );
                                      }
                                    } catch (err) {
                                      console.error("Unexpected error:", err);
                                      alert(
                                        "An unexpected error occurred. Please try again."
                                      );
                                    }
                                  }
                                }}
                              >
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

            <TabsContent value="content" className="space-y-6">
              <div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      User Management
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Manage users and their roles
                    </p>
                  </div>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {user.full_name}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Select
                                defaultValue={user.role}
                                onValueChange={(newRole) =>
                                  handleRoleChange(user.id, newRole)
                                }
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder={user.role} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Reviewer">
                                    Reviewer
                                  </SelectItem>
                                  <SelectItem value="Signer">Signer</SelectItem>
                                  <SelectItem value="Approver">
                                    Approver
                                  </SelectItem>
                                  <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  const confirmDelete = window.confirm(
                                    `Are you sure you want to delete user ${user.full_name}?`
                                  );
                                  if (confirmDelete) {
                                    try {
                                      const { error } = await supabase
                                        .from("users")
                                        .delete()
                                        .eq("id", user.id);

                                      if (error) {
                                        console.error(
                                          "Error deleting user:",
                                          error
                                        );
                                        alert(
                                          "Failed to delete the user. Please try again."
                                        );
                                      } else {
                                        alert("User deleted successfully!");
                                        setUsers((prevUsers) =>
                                          prevUsers.filter(
                                            (u) => u.id !== user.id
                                          )
                                        );
                                      }
                                    } catch (err) {
                                      console.error("Unexpected error:", err);
                                      alert(
                                        "An unexpected error occurred. Please try again."
                                      );
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                <p className="text-muted-foreground">
                  Analytics dashboard coming soon.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">System Settings</h3>
                <p className="text-muted-foreground">
                  System configuration options coming soon.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
