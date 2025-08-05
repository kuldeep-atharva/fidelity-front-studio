import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, AlertCircle, MessageSquare, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { format, formatDistanceToNow, isAfter, addDays, addHours } from "date-fns";
import { toast } from "sonner"; // or your preferred toast library

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
}

interface ImportantDate {
  id: string;
  title: string;
  date: Date;
  location?: string;
  type: 'hearing' | 'deadline' | 'other';
  case_id: string;
  description?: string;
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

const Dashboard = () => {
  const [workflowSteps, setWorkflowSteps] = useState<CaseWorkflowStep[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const { data: userCases, error: casesError } = await supabase
          .from('cases')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (casesError) throw casesError;
        setCases(userCases || []);

        const caseIds = userCases?.map(c => c.id) || [];
        if (caseIds.length > 0) {
          const { data: steps, error: stepsError } = await supabase
            .from('case_workflow_steps')
            .select('*')
            .in('case_id', caseIds);

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
  }, []);

  // Secure PDF download handler
  const downloadPdf = async (pdfData: string, fileName: string, docId: string) => {
    setDownloading(docId);
    try {
      // Case 1: Direct URL
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

      // Case 2: Base64 data
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

  // Secure calendar event download
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
        // Secure context - download directly
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
        // Insecure context (development) - open in new tab
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

  const calculateCaseProgress = () => {
    if (!cases.length || !workflowSteps.length) return { percent: 0, currentStep: 0, totalSteps: 0, currentStepName: 'Not Started' };
    
    const activeCase = cases[0];
    const caseSteps = workflowSteps
      .filter(step => step.case_id === activeCase.id)
      .sort((a, b) => a.step_order - b.step_order);
    
    const totalSteps = caseSteps.length;
    const completedSteps = caseSteps.filter(step => step.action_status === 'Completed').length;
    
    return {
      percent: Math.round((completedSteps / totalSteps) * 100),
      currentStep: completedSteps + 1,
      totalSteps,
      currentStepName: caseSteps[completedSteps]?.step_name || "Completed"
    };
  };

  const getImportantDates = (): ImportantDate[] => {
    if (!cases.length) return [];
    
    const dates: ImportantDate[] = [];

    cases.forEach(caseItem => {
      dates.push({
        id: `${caseItem.id}-incident`,
        title: `Incident Date - ${caseItem.first_name} ${caseItem.last_name}`,
        date: new Date(caseItem.date_of_incident),
        type: 'other',
        case_id: caseItem.id,
        description: `Type: ${caseItem.type_of_incident}`
      });

      const caseSteps = workflowSteps
        .filter(step => step.case_id === caseItem.id)
        .filter(step => step.estimated_duration);
        
      caseSteps.forEach(step => {
        const estimatedDays = parseInt(step.estimated_duration || '0');
        if (!isNaN(estimatedDays)) {
          dates.push({
            id: step.id,
            title: `Deadline: ${step.step_name}`,
            date: addDays(new Date(caseItem.created_at), estimatedDays),
            type: 'deadline',
            case_id: caseItem.id,
            description: step.description || undefined
          });
        }
      });
    });

    const now = new Date();
    return dates
      .filter(date => isAfter(date.date, now))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  };

  const getRecentDocuments = (): Document[] => {
    return cases
      .filter(caseItem => caseItem.pdf_url)
      .map(caseItem => ({
        id: caseItem.id,
        name: `Case ${caseItem.case_number} - ${caseItem.first_name} ${caseItem.last_name}`,
        modified_at: caseItem.created_at,
        status: caseItem.status === 'New' ? 'pending' : 
               caseItem.status === 'In Progress' ? 'in progress' : 'completed',
        url: caseItem.pdf_url as string,
        case_id: caseItem.id
      }))
      .sort((a, b) => new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime())
      .slice(0, 3);
  };

  const progressData = calculateCaseProgress();
  const importantDates = getImportantDates();
  const recentDocuments = getRecentDocuments();

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
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your cases.
          </p>
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
            title="Upcoming Dates"
            value={importantDates.length.toString()}
            subtitle={
              importantDates.length > 0 
                ? `Next: ${importantDates[0].title} in ${formatDistanceToNow(importantDates[0].date, { addSuffix: true })}`
                : "No upcoming dates"
            }
            icon={<Calendar className="w-6 h-6" />}
            iconBg="bg-judicial-accent"
          />
          <StatsCard
            title="Documents"
            value={recentDocuments.length.toString()}
            subtitle={
              recentDocuments.filter(d => d.status === 'pending').length > 0
                ? `${recentDocuments.filter(d => d.status === 'pending').length} pending completion`
                : cases.length > 0 ? "All documents complete" : "No documents"
            }
            icon={<FileText className="w-6 h-6" />}
            iconBg="bg-warning"
          />
          <StatsCard
            title="Active Cases"
            value={cases.length.toString()}
            subtitle={
              cases.filter(c => c.status === 'New').length > 0
                ? `${cases.filter(c => c.status === 'New').length} new cases`
                : cases.length > 0 ? "No new cases" : "No cases"
            }
            icon={<MessageSquare className="w-6 h-6" />}
            iconBg="bg-primary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Upcoming Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {importantDates.length > 0 ? (
                importantDates.map((date) => (
                  <div key={date.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{date.title}</span>
                        {date.type === 'hearing' && (
                          <Badge variant="destructive">
                            {formatDistanceToNow(date.date, { addSuffix: true })}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(date.date, 'MMMM d, yyyy \'at\' h:mm a')}
                      </p>
                      {date.location && (
                        <p className="text-sm text-muted-foreground">{date.location}</p>
                      )}
                      {date.description && (
                        <p className="text-sm text-muted-foreground mt-1">{date.description}</p>
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
                          description: date.description || `Related to case ${cases.find(c => c.id === date.case_id)?.case_number}`,
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
                  <p>No upcoming important dates</p>
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
