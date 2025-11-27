import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, Check, X } from "lucide-react";
import { format } from "date-fns";

interface Application {
  id: string;
  name: string;
  age: number;
  contact: string;
  message: string | null;
  created_at: string;
  status: string;
  source: "adult" | "parent";
}

// merge adult + parent pending into a flat list with source info
async function fetchPendingApplications(): Promise<Application[]> {
  const { data: adultData, error: adultError } = await supabase
    .from("adult_applications")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  if (adultError) throw adultError;

  const { data: parentData, error: parentError } = await supabase
    .from("parent_applications")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  if (parentError) throw parentError;

  const adults: Application[] = (adultData || []).map((a) => ({
    id: a.id,
    name: a.name,
    age: a.age,
    contact: a.contact,
    message: a.message,
    created_at: a.created_at,
    status: a.status,
    source: "adult" as const,
  }));

  const parents: Application[] = (parentData || []).map((p) => ({
    id: p.id,
    name: p.child_name,
    age: p.child_age,
    contact: p.parent_phone,
    message: p.message,
    created_at: p.created_at,
    status: p.status,
    source: "parent" as const,
  }));

  return [...adults, ...parents].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export default function PendingApplicationsTable() {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["pending-applications"],
    queryFn: fetchPendingApplications,
  });

  // admin-controlled status update
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      source,
    }: {
      id: string;
      status: "approved" | "rejected";
      source: "adult" | "parent";
    }) => {
      const table =
        source === "adult" ? "adult_applications" : "parent_applications";

      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pending-applications"] });
      queryClient.invalidateQueries({ queryKey: ["adult-applications"] });
      queryClient.invalidateQueries({ queryKey: ["parent-applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Success",
        description: `Application ${
          variables.status === "approved" ? "approved" : "rejected"
        }`,
      });
      setSelectedApp(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading applications...
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No pending applications</p>
      </div>
    );
  }

  const handleUpdate = (app: Application, status: "approved" | "rejected") => {
    updateStatusMutation.mutate({
      id: app.id,
      status,
      source: app.source,
    });
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Date Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={`${app.source}-${app.id}`}>
                <TableCell className="font-medium">{app.name}</TableCell>
                <TableCell>{app.contact}</TableCell>
                <TableCell>{app.age}</TableCell>
                <TableCell>
                  {format(new Date(app.created_at), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedApp(app)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => handleUpdate(app, "approved")}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleUpdate(app, "rejected")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>Review membership application</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-sm text-muted-foreground">
                  {selectedApp.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Age</label>
                <p className="text-sm text-muted-foreground">
                  {selectedApp.age}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Contact</label>
                <p className="text-sm text-muted-foreground">
                  {selectedApp.contact}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <p className="text-sm text-muted-foreground">
                  {selectedApp.message || "No message provided"}
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => handleUpdate(selectedApp, "approved")}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleUpdate(selectedApp, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
