// Updated Rules.tsx with Edit and Pagination functionality

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import StatsCard from '@/components/StatsCard';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Settings, Shield, Clock, Database, Search, Edit, Trash2, FileText, Bell, Lock, CheckCircle, Code,
} from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import RuleModal from '@/components/RuleModal';

const PAGE_SIZE = 5;

const Rules = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all-status');
  const [categoryFilter, setCategoryFilter] = useState('all-categories');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRule, setEditRule] = useState<any>(null);

  const [page, setPage] = useState(1);

  const fetchRules = async () => {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRules(data);
      const cats = Array.from(new Set(data.map((r) => r.category))).filter(Boolean);
      setCategories(cats);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'testing' : 'active';
    await supabase.from('rules').update({ status: newStatus }).eq('id', id);
    fetchRules();
  };

  const deleteRule = async (id: string) => {
    await supabase.from('rules').delete().eq('id', id);
    fetchRules();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workflow': return <FileText className="w-4 h-4" />;
      case 'security': return <Lock className="w-4 h-4" />;
      case 'notification': return <Bell className="w-4 h-4" />;
      case 'validation': return <CheckCircle className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  const filtered = rules.filter((r) => {
    const matchStatus = statusFilter === 'all-status' || r.status === statusFilter;
    const matchCategory = categoryFilter === 'all-categories' || r.category === categoryFilter;
    const matchSearch = search === '' || r.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchCategory && matchSearch;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Rule Management</h1>
        </div>

        <div className="bg-card rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Rule Management System</h2>
            <Button onClick={() => { setEditRule(null); setModalOpen(true); }}>
              <Code className="w-4 h-4 mr-2" /> Create Rule
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard title="Total Rules" value={rules.length.toString()} icon={<Settings className="w-5 h-5" />} iconBg="bg-muted-foreground" />
            <StatsCard title="Active Rules" value={rules.filter((r) => r.status === 'active').length.toString()} icon={<Shield className="w-5 h-5" />} iconBg="bg-success" />
            <StatsCard title="Testing" value={rules.filter((r) => r.status === 'testing').length.toString()} icon={<Clock className="w-5 h-5" />} iconBg="bg-destructive" />
            <StatsCard title="Configurations" value={rules.length.toString()} icon={<Database className="w-5 h-5" />} iconBg="bg-muted-foreground" />
          </div>

          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search rules..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  <TableHead>Condition</TableHead>
                  <TableHead>Signer</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((rule) => (
                  <TableRow key={rule.id}>
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
                        <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>{rule.status}</Badge>
                        <Switch checked={rule.status === 'active'} onCheckedChange={() => toggleStatus(rule.id, rule.status)} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.priority === 'high' ? 'destructive' : 'outline'} className={rule.priority === 'medium' ? 'bg-primary text-primary-foreground' : ''}>{rule.priority}</Badge>
                    </TableCell>
                    <TableCell>{rule.condition}</TableCell>
                    <TableCell>{rule.signer_email}</TableCell>
                    <TableCell>{rule.reviewer_email}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditRule(rule); setModalOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span>Page {page}</span>
            <Button variant="ghost" disabled={page * PAGE_SIZE >= filtered.length} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      </div>

      <RuleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchRules}
        initialRule={editRule}
      />
    </Layout>
  );
};

export default Rules;