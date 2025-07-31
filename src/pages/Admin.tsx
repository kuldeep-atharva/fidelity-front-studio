// admin.tsx
import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Trash2,
  RefreshCcw,
} from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const Admin = () => {
  const [cases, setCases] = useState([]);
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all-status");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const casesPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [casesRes, rulesRes, usersRes] = await Promise.all([
          supabase.from("cases").select(
            "id, case_number, first_name, last_name, status, created_at, contact_email, type_of_incident, rule_applied, signcare_doc_id"
          ).neq('status', 'New')          ,
          supabase.from("rules").select("id, priority"),
          supabase.from("users").select("id, full_name, email, role, created_at"),
        ]);

        if (casesRes.error || rulesRes.error || usersRes.error)
          throw casesRes.error || rulesRes.error || usersRes.error;

        setCases(casesRes.data || []);
        setRules(rulesRes.data || []);
        setUsers(usersRes.data || []);
      } catch (error) {
        console.error("Data fetch error:", error);
        alert("Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredCases = useMemo(() => {
    return cases
      .filter((caseItem) => {
        const statusMatch =
          (filterStatus === "all-status" || ((caseItem.status === "Completed" ? "Signed" : caseItem.status) === filterStatus));
        const searchMatch =
          searchQuery === "" ||
          [
            caseItem.case_number,
            caseItem.contact_email,
            caseItem.first_name,
            caseItem.last_name,
          ]
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        return statusMatch && searchMatch;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
  }, [cases, filterStatus, searchQuery]);

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * casesPerPage;
    return filteredCases.slice(start, start + casesPerPage);
  }, [filteredCases, currentPage]);

  const totalPages = Math.ceil(filteredCases.length / casesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const checkStatusHandler = async (id, docId, refId) => {
    try {
      const { data: res } = await axios.post(
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

      const signerInfo = res.data.signerInfo || [];

      const reviewerApproved = signerInfo.some((signer) => {
        const user = users.find((u) => u.id === signer.signerRefId);
        return user?.role === "Reviewer" && signer.signerStatus === "Approved";
      });

      const signerApproved = signerInfo.some((signer) => {
        const user = users.find((u) => u.id === signer.signerRefId);
        return user?.role === "Signer" && signer.signerStatus === "Signed";
      });

      let finalStatus = res.data.documentStatus;

      if (finalStatus === "Pending" && reviewerApproved) finalStatus = "Reviewed";
      else if (finalStatus === "Pending" && signerApproved) finalStatus = "Signed";
      else if (finalStatus === "Pending") finalStatus = "In Progress";

      const { data: updated } = await supabase
        .from("cases")
        .update({ status: finalStatus })
        .eq("id", id)
        .select();

      if (updated && updated.length)
        setCases((prev) =>
          prev.map((c) => (c.id === id ? updated[0] : c))
        );
    } catch (err) {
      console.error("Status check error:", err);
    }
  };

  const getPriorityByRuleId = (ruleId) => {
    const priority = rules.find((r) => r.id === ruleId)?.priority;
    let color: "default" | "destructive" | "secondary" | "outline" = "secondary";

    console.log("Priority:", priority);

    if (priority === "high") color = "destructive";
    else if (priority === "medium") color = "default";
    else if (priority === "low") color = "outline";

    return priority ? <Badge variant={color}>{priority}</Badge> : <Badge variant="secondary">N/A</Badge>;
  };

  const getStatusBadge = (status: string) => {
    let variant: "default" | "destructive" | "secondary" | "outline" = "secondary";

    if (status === "New") variant = "default";
    else if (status === "Signed" || status === "Completed") variant = "outline";
    else if (status === "Rejected") variant = "destructive";
    else if (status === "Reviewed") variant = "default"; // change to 'default' if 'success' is invalid
    else if (status === "In Progress") variant = "secondary";

    return <Badge variant={variant}>{status === "Completed" ? "Signed" : status}</Badge>;
  };


  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("Role update error:", err);
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
              title="Pending Cases"
              value={cases
                .filter((c) => c.status === "In Progress" || c.status === "Reviewed" || c.status === "Pending")
                .length.toString()}
              icon={<Clock className="w-5 h-5" />}
              iconBg="bg-destructive"
            />
            <StatsCard
              title="Signed Cases"
              value={cases
                .filter((c) => c.status === "Completed" || c.status === "Signed")
                .length.toString()}
              icon={<UserCheck className="w-5 h-5" />}
              iconBg="bg-success"
            />
            <StatsCard
              title="Rejected Cases"
              value={cases
                .filter((c) => c.status === "Rejected")
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
                    <Input
                      placeholder="Search cases..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
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
                      <SelectItem value="Reviewed">Reviewed</SelectItem>
                      <SelectItem value="Signed">Signed</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="custom-loader" />
                  </div>
                ) : paginatedCases.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      No cases found.
                    </p>
                  </div>
                ) : (
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
                        {paginatedCases.map((caseItem, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {caseItem.case_number}
                            </TableCell>
                            <TableCell>{caseItem.first_name}</TableCell>
                            <TableCell>{caseItem.last_name}</TableCell>
                            <TableCell>
                              {getStatusBadge(caseItem.status === "Completed" ? "Signed" : caseItem.status)}
                            </TableCell>
                            <TableCell>{caseItem.type_of_incident}</TableCell>
                            <TableCell>{caseItem.contact_email}</TableCell>
                            <TableCell>
                              {getPriorityByRuleId(caseItem.rule_applied)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  disabled={!caseItem.signcare_doc_id}
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
                                          .eq("id", caseItem.id);

                                        if (error) {
                                          console.error(
                                            "Error deleting case:",
                                            error
                                          );
                                          alert(
                                            "Failed to delete the case. Please try again."
                                          );
                                        } else {
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
                )}

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
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
