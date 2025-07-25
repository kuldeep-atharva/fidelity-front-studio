import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Shield, Clock, Database, Search, Edit, Trash2, FileText, Bell, Lock, CheckCircle, Code } from "lucide-react";

const Rules = () => {
  const rules = [
    {
      name: "Auto-approve simple name changes",
      description: "Automatically approve name change petitions for simple cases",
      category: "workflow",
      status: "active",
      priority: "medium",
      executions: 142,
      lastModified: "15/01/2024",
      modifiedBy: "admin@sfcourts.org",
      icon: <FileText className="w-4 h-4" />
    },
    {
      name: "Flag high-risk cases",
      description: "Flag cases that meet high-risk criteria for manual review",
      category: "security",
      status: "active",
      priority: "high",
      executions: 23,
      lastModified: "14/01/2024",
      modifiedBy: "security@sfcourts.org",
      icon: <Lock className="w-4 h-4" />
    },
    {
      name: "Send deadline reminders",
      description: "Send email reminders 3 days before deadline",
      category: "notification",
      status: "active",
      priority: "medium",
      executions: 89,
      lastModified: "12/01/2024",
      modifiedBy: "notifications@sfcourts.org",
      icon: <Bell className="w-4 h-4" />
    },
    {
      name: "Validate document completeness",
      description: "Check if all required documents are submitted",
      category: "validation",
      status: "testing",
      priority: "high",
      executions: 5,
      lastModified: "10/01/2024",
      modifiedBy: "validation@sfcourts.org",
      icon: <CheckCircle className="w-4 h-4" />
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "workflow": return <FileText className="w-4 h-4" />;
      case "security": return <Lock className="w-4 h-4" />;
      case "notification": return <Bell className="w-4 h-4" />;
      case "validation": return <CheckCircle className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Rule Management</h1>
        </div>

        <div className="bg-card rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Rule Management System</h2>
            <Button variant="outline" className="text-primary border-primary">
              <Code className="w-4 h-4 mr-2" />
              Dynamic Configuration
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Rules"
              value="4"
              icon={<Settings className="w-5 h-5" />}
              iconBg="bg-muted-foreground"
            />
            <StatsCard
              title="Active Rules"
              value="3"
              icon={<Shield className="w-5 h-5" />}
              iconBg="bg-success"
            />
            <StatsCard
              title="Testing"
              value="1"
              icon={<Clock className="w-5 h-5" />}
              iconBg="bg-destructive"
            />
            <StatsCard
              title="Configurations"
              value="4"
              icon={<Database className="w-5 h-5" />}
              iconBg="bg-muted-foreground"
            />
          </div>

          <Tabs defaultValue="business" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="business">Business Rules</TabsTrigger>
              <TabsTrigger value="system">System Configuration</TabsTrigger>
              <TabsTrigger value="templates">Rule Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="business" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Business Rules Engine</h3>
                <p className="text-muted-foreground text-sm mb-6">Create and manage dynamic business rules that control application behavior</p>

                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Search rules..." className="pl-10" />
                  </div>
                  <Select defaultValue="all-categories">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-categories">All Categories</SelectItem>
                      <SelectItem value="workflow">Workflow</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="validation">Validation</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all-status">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-status">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Executions</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{rule.name}</div>
                              <div className="text-sm text-muted-foreground">{rule.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(rule.category)}
                              <span className="text-sm">{rule.category}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={rule.status === "active" ? "default" : "secondary"}>
                                {rule.status}
                              </Badge>
                              <Switch checked={rule.status === "active"} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={rule.priority === "high" ? "destructive" : "outline"}
                              className={rule.priority === "medium" ? "bg-primary text-primary-foreground" : ""}
                            >
                              {rule.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{rule.executions}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">{rule.lastModified}</div>
                              <div className="text-xs text-muted-foreground">{rule.modifiedBy}</div>
                            </div>
                          </TableCell>
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

            <TabsContent value="system">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">System Configuration</h3>
                <p className="text-muted-foreground">System configuration settings coming soon.</p>
              </div>
            </TabsContent>

            <TabsContent value="templates">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Rule Templates</h3>
                <p className="text-muted-foreground">Rule template library coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Rules;