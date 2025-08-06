import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, AlertCircle, MessageSquare, Download, Loader2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { format, formatDistanceToNow, isAfter, addDays, addHours } from "date-fns";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types
interface CaseWorkflowStep {
  id: string;
  step_name: string;
  step_order: number;
  action_status: string;
  action_timestamp: string | null;
  estimated_duration: string | null;
  case_id: string;
  description: string | null;
  action_type: string | null;
  step_category: string | null;
  is_required: boolean;
  user_id: string | null;
}

interface Rule {
  id: string;
  name: string;
  description: string | null;
  priority: string | null;
}

interface Case {
  id: string;
  case_number: string;
  status: string;
  created_at: string;
  case_description: string;
  pdf_url: string | null;
  date_of_incident: string;
  first_name: string;
  last_name: string;
  type_of_incident: string;
  contact_email: string;
  signer_email: string | null;
  reviewer_email: string | null;
  rule_applied: string | null;
  user_id: string | null;
  rule?: Rule;
}

interface ImportantDate {
  id: string;
  title: string;
  date: Date;
  location?: string;
  type: 'hearing' | 'deadline' | 'other';
  case_id: string;
  description?: string;
  rule_id?: string;
}

interface Document {
  id: string;
  name: string;
  modified_at: string;
  status: 'completed' | 'in progress' | 'pending';
  url: string;
  case_id: string;
}

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  url?: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'Reviewer' | 'Signer' | 'Approver' | 'Admin';
}

const Dashboard = () => {
  const [workflowSteps, setWorkflowSteps] = useState<CaseWorkflowStep[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [rules, setRules] = useState<Record<string, Rule>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Fetch all users from Supabase
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, email, role');
        if (usersError) throw usersError;

        const fetchedUsers = usersData || [];
        setUsers(fetchedUsers);

        // Set initial user only if not already set
        if (!user && fetchedUsers.length > 0) {
          const initialUser = fetchedUsers.find(u => u.role === "Reviewer") || fetchedUsers[0];
          setUser(initialUser);
        }

        if (fetchedUsers.length === 0) {
          setError("No users found in the system");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []); // Empty dependency array to run only on mount

  useEffect(() => {
    if (!user) return; // Skip if no user is selected

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch cases based on user role
        let casesQuery = supabase
          .from('cases')
          .select('*')
          .order('created_at', { ascending: false });

        if (user.role !== 'Admin') {
          casesQuery = casesQuery.or(
            `signer_email.eq.${user.email},reviewer_email.eq.${user.email},user_id.eq.${user.id}`
          );
        }

        const { data: userCases, error: casesError } = await casesQuery.limit(10);
        if (casesError) throw casesError;

        // Fetch rules for cases with rule_applied
        const ruleIds = userCases?.filter(c => c.rule_applied).map(c => c.rule_applied) || [];
        let rulesData: Rule[] = [];
        if (ruleIds.length > 0) {
          const { data: rulesResult, error: rulesError } = await supabase
            .from('rules')
            .select('id, name, description, priority')
            .in('id', ruleIds);
          if (rulesError) throw rulesError;
          rulesData = rulesResult || [];
        }

        // Map rules to a lookup object
        const rulesMap = rulesData.reduce((acc, rule) => ({
          ...acc,
          [rule.id]: rule
        }), {} as Record<string, Rule>);

        setRules(rulesMap);

        // Attach rule data to cases
        const casesWithRules = userCases?.map(caseItem => ({
          ...caseItem,
          rule: caseItem.rule_applied ? rulesMap[caseItem.rule_applied] : undefined
        })) || [];
        setCases(casesWithRules);

        // Fetch workflow steps
        const caseIds = userCases?.map(c => c.id) || [];
        if (caseIds.length > 0) {
          const { data: steps, error: stepsError } = await supabase
            .from('case_workflow_steps')
            .select('*')
            .in('case_id', caseIds)
            .order('step_order', { ascending: true });

          if (stepsError) throw stepsError;
          setWorkflowSteps(steps || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]); // Run when user changes

  const downloadPdf = async (pdfData: string, fileName: string, docId: string) => {
    setDownloading(docId);
    try {
      if (pdfData.startsWith('http')) {
        const secureUrl = window.location.protocol === 'https:' && pdfData.startsWith('http:')
          ? pdfData.replace('http:', 'https:')
          : pdfData;
        
        const response = await fetch(secureUrl, {
          mode: 'cors',
          credentials: 'same-origin'
        });
        if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        
        const blob = await response.blob();
        secureDownload(blob, fileName);
        return;
      }

      if (pdfData.startsWith('data:application/pdf;base64,') || isValidBase64(pdfData)) {
        const base64Data = pdfData.startsWith('data:') ? pdfData.split(',')[1] : pdfData;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        secureDownload(blob, fileName);
        return;
      }

      throw new Error('Unsupported PDF format');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloading(null);
    }
  };

  const secureDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    link.rel = 'noopener noreferrer';
    
    if (window.isSecureContext) {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        toast.error('Please allow popups for downloads');
      }
    }

    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const isValidBase64 = (str: string) => {
    try {
      return btoa(atob(str)) === str;
    } catch (e) {
      return false;
    }
  };

  const addToCalendar = (event: CalendarEvent) => {
    try {
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      };

      const escapeICSText = (text: string = '') => {
        return text.replace(/[\\;,\n]/g, (match) => `\\${match}`);
      };

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//LegalCaseManager//EN',
        'BEGIN:VEVENT',
        `UID:${event.start.getTime()}@legalcasemanager`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(event.start)}`,
        `DTEND:${formatDate(event.end)}`,
        `SUMMARY:${escapeICSText(event.title)}`,
        event.description && `DESCRIPTION:${escapeICSText(event.description)}`,
        event.location && `LOCATION:${escapeICSText(event.location)}`,
        event.url && `URL:${event.url}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].filter(Boolean).join('\r\n');

      if (window.isSecureContext) {
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        const file = new File([icsContent], `${event.title}.ics`, { 
          type: 'text/calendar;charset=utf-8' 
        });
        const url = URL.createObjectURL(file);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (error) {
      console.error('Calendar error:', error);
      toast.error('Failed to create calendar event');
    }
  };

  const calculateCaseProgress = (caseId: string) => {
    const caseSteps = workflowSteps
      .filter(step => step.case_id === caseId)
      .sort((a, b) => a.step_order - b.step_order);
    
    const totalSteps = caseSteps.length;
    const completedSteps = caseSteps.filter(step => step.action_status === 'Completed').length;
    
    return {
      percent: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      currentStep: completedSteps + 1,
      totalSteps,
      currentStepName: caseSteps[completedSteps]?.step_name || "Not Started"
    };
  };

  const getImportantDates = (): ImportantDate[] => {
    if (!cases.length || !user) return [];

    // Filter cases based on user role
    const filteredCases = cases.filter(caseItem => {
      if (user.role === 'Admin') return true;
      if (user.role === 'Signer' && caseItem.signer_email === user.email) return true;
      if (user.role === 'Reviewer' && caseItem.reviewer_email === user.email) return true;
      if (user.role === 'Approver' && workflowSteps.some(step => step.case_id === caseItem.id && step.user_id === user.id)) return true;
      return caseItem.user_id === user.id;
    });

    const dates: ImportantDate[] = [];

    filteredCases.forEach(caseItem => {
      // Incident Date
      dates.push({
        id: `${caseItem.id}-incident`,
        title: `Incident: ${caseItem.case_number}`,
        date: new Date(caseItem.date_of_incident),
        type: 'other',
        case_id: caseItem.id,
        description: `Type: ${caseItem.type_of_incident}, ${caseItem.first_name} ${caseItem.last_name}`
      });

      // Workflow step deadlines
      const caseSteps = workflowSteps
        .filter(step => step.case_id === caseItem.id && step.estimated_duration && step.is_required)
        .sort((a, b) => a.step_order - b.step_order)
        .filter(step => {
          if (user.role === 'Signer' && caseItem.signer_email !== user.email) return false;
          if (user.role === 'Reviewer' && caseItem.reviewer_email !== user.email) return false;
          if (user.role === 'Approver' && step.user_id !== user.id) return false;
          if (user.role === 'Reviewer' && step.action_type !== 'Review') return false;
          if (user.role === 'Signer' && step.action_type !== 'Sign') return false;
          if (user.role === 'Approver' && step.action_type !== 'Approve') return false;
          return true;
        });

      caseSteps.forEach(step => {
        const estimatedDays = parseInt(step.estimated_duration || '0');
        if (!isNaN(estimatedDays)) {
          dates.push({
            id: step.id,
            title: `${step.step_name} (${caseItem.case_number})`,
            date: addDays(new Date(caseItem.created_at), estimatedDays),
            type: 'deadline',
            case_id: caseItem.id,
            description: step.description || `Action: ${step.action_type || 'N/A'}`,
            rule_id: caseItem.rule_applied
          });
        }
      });
    });

    const now = new Date();
    return dates
      .filter(date => isAfter(date.date, now))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 8);
  };

  const getRecentDocuments = (): Document[] => {
    return cases
      .filter(caseItem => caseItem.pdf_url)
      .map(caseItem => ({
        id: caseItem.id,
        name: `Case ${caseItem.case_number} - ${caseItem.first_name} ${caseItem.last_name}`,
        modified_at: caseItem.created_at,
        status: caseItem.status === 'Draft' ? 'pending' : 
                caseItem.status === 'In Progress' ? 'in progress' : 'completed',
        url: caseItem.pdf_url as string,
        case_id: caseItem.id
      }))
      .sort((a, b) => new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime())
      .slice(0, 5);
  };

  const getUserSpecificMetrics = () => {
    if (!user) return { assignedCases: 0, pendingActions: 0, urgentCases: 0 };

    const assignedCases = cases.filter(c => 
      c.signer_email === user.email || 
      c.reviewer_email === user.email || 
      c.user_id === user.id
    ).length;

    const pendingActions = workflowSteps.filter(s => 
      s.action_status === 'Pending' && 
      s.user_id === user.id &&
      s.is_required
    ).length;

    const urgentCases = cases.filter(c => {
      const steps = workflowSteps.filter(s => s.case_id === c.id);
      return steps.some(s => 
        s.estimated_duration && 
        isAfter(new Date(), addDays(new Date(c.created_at), parseInt(s.estimated_duration)))
      );
    }).length;

    return { assignedCases, pendingActions, urgentCases };
  };

  const progressData = cases.length > 0 ? calculateCaseProgress(cases[0].id) : { percent: 0, currentStep: 0, totalSteps: 0, currentStepName: 'Not Started' };
  const importantDates = getImportantDates();
  const recentDocuments = getRecentDocuments();
  const userMetrics = getUserSpecificMetrics();

  const handleUserChange = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser && selectedUser.id !== user?.id) {
      setUser(selectedUser);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back{user ? `, ${user.full_name}` : ''}! Here's your case management overview.
            </p>
          </div>
          <Select onValueChange={handleUserChange} defaultValue={user?.id} disabled={users.length === 0}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select User" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name} ({u.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Case Progress"
            value={`${progressData.percent}%`}
            subtitle={`${progressData.currentStepName} (${progressData.currentStep}/${progressData.totalSteps})`}
            icon={<FileText className="w-6 h-6" />}
            iconBg="bg-success"
            trend={progressData.percent > 50 ? "up" : "down"}
          />
          <StatsCard
            title="Assigned Cases"
            value={userMetrics.assignedCases.toString()}
            subtitle={user ? `${user.role} assigned cases` : 'No assignments'}
            icon={<User className="w-6 h-6" />}
            iconBg="bg-primary"
          />
          <StatsCard
            title="Pending Actions"
            value={userMetrics.pendingActions.toString()}
            subtitle={userMetrics.pendingActions > 0 ? `${userMetrics.pendingActions} actions require your attention` : 'No pending actions'}
            icon={<AlertCircle className="w-6 h-6" />}
            iconBg="bg-warning"
          />
          <StatsCard
            title="Urgent Cases"
            value={userMetrics.urgentCases.toString()}
            subtitle={userMetrics.urgentCases > 0 ? 'Cases past due dates' : 'No urgent cases'}
            icon={<MessageSquare className="w-6 h-6" />}
            iconBg="bg-destructive"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Upcoming Deadlines & Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {importantDates.length > 0 ? (
                importantDates.map((date) => (
                  <div key={date.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{date.title}</span>
                        <Badge variant={date.type === 'deadline' ? 'destructive' : 'secondary'}>
                          {formatDistanceToNow(date.date, { addSuffix: true })}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(date.date, 'MMMM d, yyyy \'at\' h:mm a')}
                      </p>
                      {date.description && (
                        <p className="text-sm text-muted-foreground mt-1">{date.description}</p>
                      )}
                      {date.rule_id && rules[date.rule_id] && (
                        <p className="text-sm text-muted-foreground">
                          Rule: {rules[date.rule_id].name}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const calendarEvent: CalendarEvent = {
                          title: date.title,
                          start: date.date,
                          end: addHours(date.date, 1),
                          description: date.description || `Case ${cases.find(c => c.id === date.case_id)?.case_number}`,
                          location: date.location
                        };
                        addToCalendar(calendarEvent);
                      }}
                    >
                      Add to Calendar
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>No upcoming deadlines or events</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Recent Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentDocuments.length > 0 ? (
                recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(doc.modified_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Status: {doc.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          doc.status === 'completed' 
                            ? 'default' 
                            : doc.status === 'in progress' 
                              ? 'secondary' 
                              : 'outline'
                        }
                      >
                        {doc.status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => downloadPdf(doc.url, doc.name, doc.id)}
                        disabled={!doc.url || downloading === doc.id}
                      >
                        {downloading === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>No recent documents</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
