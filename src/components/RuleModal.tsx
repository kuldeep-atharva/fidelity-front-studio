// RuleModal.tsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/utils/supabaseClient";

interface RuleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialRule?: any | null;
}

export default function RuleModal({ open, onClose, onSuccess, initialRule }: RuleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [category, setCategory] = useState("workflow");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("active");
  const [signerEmail, setSignerEmail] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [users, setUsers] = useState<{ email: string; role: string }[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("email, role")
        .in("role", ["Signer", "Reviewer"]);

      if (!error && data) setUsers(data);
    };

    if (open) fetchUsers();
  }, [open]);

  useEffect(() => {
    if (initialRule) {
      setName(initialRule.name || "");
      setDescription(initialRule.description || "");
      setCondition(initialRule.condition || "");
      setCategory(initialRule.category || "workflow");
      setPriority(initialRule.priority || "medium");
      setSignerEmail(initialRule.signer_email || "");
      setReviewerEmail(initialRule.reviewer_email || "");
      setStatus(initialRule.status || "active");
    } else {
      resetForm();
    }
  }, [initialRule]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCondition("");
    setCategory("workflow");
    setPriority("medium");
    setSignerEmail("");
    setReviewerEmail("");
    setStatus("active");
  };

  const handleSubmit = async () => {
    const payload = {
      name,
      description,
      condition,
      category,
      priority,
      signer_email: signerEmail,
      reviewer_email: reviewerEmail,
      status,
    };

    let result;
    if (initialRule) {
      result = await supabase.from("rules").update(payload).eq("id", initialRule.id);
    } else {
      result = await supabase.from("rules").insert([payload]);
    }

    if (!result.error) {
      onSuccess();
      onClose();
      resetForm();
    } else {
      console.error("Error saving rule:", result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initialRule ? "Edit Rule" : "Create New Rule"}</DialogTitle>
          <DialogDescription>
            {initialRule ? "Update rule configuration" : "Define and configure a new rule"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>Condition</Label>
            <Textarea value={condition} onChange={(e) => setCondition(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="validation">Validation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Signer</Label>
              <Select value={signerEmail} onValueChange={setSignerEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Select signer" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.role === "Signer")
                    .map((user) => (
                      <SelectItem key={user.email} value={user.email}>
                        {user.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Reviewer</Label>
              <Select value={reviewerEmail} onValueChange={setReviewerEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reviewer" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.role === "Reviewer")
                    .map((user) => (
                      <SelectItem key={user.email} value={user.email}>
                        {user.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSubmit}>
              {initialRule ? "Update Rule" : "Create Rule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
