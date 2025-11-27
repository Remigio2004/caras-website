import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, Check, X, Search, Download } from "lucide-react";
import { format } from "date-fns";

interface AdultApplication {
  id: string;
  name: string;
  age: number;
  address: string;
  contact: string;
  fb_acc: string;
  message: string | null;
  status: string;
  created_at: string;
  birthday: string;
  guardian: string;
  type: "adult";
}

interface ParentApplication {
  id: string;
  child_name: string;
  child_age: number;
  address: string;
  parent_name: string;
  parent_phone: string;
  fb_acc: string;
  message: string | null;
  status: string;
  created_at: string;
  birthday: string;
  guardian: string;
  type: "parent";
}

type Application = AdultApplication | ParentApplication;

interface Member {
  id: string;
  full_name: string;
  birthday: string;
}

export default function ApplicationsView() {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "adult" | "parent">(
    "all"
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ADULT APPLICATIONS
  const { data: adultApps, isLoading: loadingAdult } = useQuery({
    queryKey: ["adult-applications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("adult_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((d) => ({ ...d, type: "adult" as const }));
    },
  });

  // PARENT APPLICATIONS
  const { data: parentApps, isLoading: loadingParent } = useQuery({
    queryKey: ["parent-applications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("parent_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((d) => ({ ...d, type: "parent" as const }));
    },
  });

  const allApplications: Application[] = [
    ...(adultApps || []),
    ...(parentApps || []),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // minimal members list for "Remove" button
  const { data: members } = useQuery({
    queryKey: ["members-for-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("id, full_name, birthday");
      if (error) throw error;
      return data as Member[];
    },
  });

  const findMemberForApp = (app: Application): Member | undefined => {
    if (!members) return undefined;
    const name =
      app.type === "adult" ? app.name : (app as ParentApplication).child_name;
    const birthday =
      app.type === "adult" ? app.birthday : (app as ParentApplication).birthday;

    return members.find(
      (m) =>
        m.full_name.toLowerCase() === name.toLowerCase() &&
        m.birthday === birthday
    );
  };

  // APPROVE (update status + insert to members)
  const acceptMutation = useMutation({
    mutationFn: async (app: Application) => {
      const table =
        app.type === "adult" ? "adult_applications" : "parent_applications";

      const { error: updateError } = await supabase
        .from(table)
        .update({ status: "approved" })
        .eq("id", app.id);
      if (updateError) throw updateError;

      const memberData =
        app.type === "adult"
          ? {
              full_name: app.name,
              birthday: app.birthday,
              age: app.age,
              address: app.address,
              guardian: app.guardian,
              contact_number: app.contact,
              batch: 1, // or keep existing logic if dynamic
              created_at: new Date().toISOString(),
            }
          : {
              full_name: (app as ParentApplication).child_name,
              birthday: (app as ParentApplication).birthday,
              age: (app as ParentApplication).child_age,
              address: (app as ParentApplication).address,
              guardian: (app as ParentApplication).guardian,
              contact_number: (app as ParentApplication).parent_phone,
              batch: 1,
              created_at: new Date().toISOString(),
            };

      const { error: insertError } = await supabase
        .from("members")
        .insert([memberData]);
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adult-applications"] });
      queryClient.invalidateQueries({ queryKey: ["parent-applications"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({
        queryKey: ["members-for-applications"],
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Success",
        description: "Application approved and member added.",
      });
      setSelectedApp(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve application.",
        variant: "destructive",
      });
    },
  });

  // REJECT
  const rejectMutation = useMutation({
    mutationFn: async (app: Application) => {
      const table =
        app.type === "adult" ? "adult_applications" : "parent_applications";

      const { error } = await supabase
        .from(table)
        .update({ status: "rejected" })
        .eq("id", app.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adult-applications"] });
      queryClient.invalidateQueries({ queryKey: ["parent-applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Success", description: "Application rejected" });
      setSelectedApp(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
    },
  });

  // REMOVE MEMBER (only if already accepted)
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({
        queryKey: ["members-for-applications"],
      });
      toast({
        title: "Removed",
        description: "Member removed from members list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove member.",
        variant: "destructive",
      });
    },
  });

  const filteredApplications = allApplications.filter((app) => {
    const matchesType = typeFilter === "all" || app.type === typeFilter;
    const name =
      app.type === "adult" ? app.name : (app as ParentApplication).child_name;
    const contact =
      app.type === "adult"
        ? app.contact
        : (app as ParentApplication).parent_phone;
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const exportToCSV = () => {
    if (!filteredApplications || filteredApplications.length === 0) return;

    const headers = [
      "Name",
      "Age",
      "Contact",
      "Type",
      "Status",
      "Date Submitted",
    ];

    const rows = filteredApplications.map((app) => [
      app.type === "adult" ? app.name : (app as ParentApplication).child_name,
      app.type === "adult" ? app.age : (app as ParentApplication).child_age,
      app.type === "adult"
        ? app.contact
        : (app as ParentApplication).parent_phone,
      app.type,
      app.status,
      format(new Date(app.created_at), "yyyy-MM-dd"),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const isLoading = loadingAdult || loadingParent;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Membership Applications</h2>
        <div className="flex gap-3 items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, address, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={setStatusFilter}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs
        value={typeFilter}
        onValueChange={(v) => setTypeFilter(v as any)}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="all">All Types</TabsTrigger>
          <TabsTrigger value="adult">Adult</TabsTrigger>
          <TabsTrigger value="parent">Parent</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : !filteredApplications || filteredApplications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No applications found
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((app) => {
              const linkedMember = findMemberForApp(app);
              return (
                <TableRow key={`${app.type}-${app.id}`}>
                  <TableCell>
                    {app.type === "adult"
                      ? app.name
                      : (app as ParentApplication).child_name}
                  </TableCell>
                  <TableCell>
                    {app.type === "adult"
                      ? app.age
                      : (app as ParentApplication).child_age}
                  </TableCell>
                  <TableCell>
                    {app.type === "adult"
                      ? app.contact
                      : (app as ParentApplication).parent_phone}
                  </TableCell>
                  <TableCell className="capitalize">{app.type}</TableCell>
                  <TableCell className="capitalize">{app.status}</TableCell>
                  <TableCell>
                    {format(new Date(app.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedApp(app)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {app.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600"
                            onClick={() => acceptMutation.mutate(app)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => rejectMutation.mutate(app)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {linkedMember && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive"
                          onClick={() =>
                            removeMemberMutation.mutate(linkedMember.id)
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>Full application information</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">Name</label>
                <p>
                  {selectedApp.type === "adult"
                    ? selectedApp.name
                    : (selectedApp as ParentApplication).child_name}
                </p>
              </div>
              <div>
                <label className="font-semibold">Age</label>
                <p>
                  {selectedApp.type === "adult"
                    ? selectedApp.age
                    : (selectedApp as ParentApplication).child_age}
                </p>
              </div>
              <div>
                <label className="font-semibold">Contact</label>
                <p>
                  {selectedApp.type === "adult"
                    ? selectedApp.contact
                    : (selectedApp as ParentApplication).parent_phone}
                </p>
              </div>
              {selectedApp.type === "parent" && (
                <div>
                  <label className="font-semibold">Parent Name</label>
                  <p>{(selectedApp as ParentApplication).parent_name}</p>
                </div>
              )}
              <div>
                <label className="font-semibold">Address</label>
                <p>{selectedApp.address}</p>
              </div>
              <div>
                <label className="font-semibold">Facebook Account</label>
                <p>{selectedApp.fb_acc || "N/A"}</p>
              </div>
              <div>
                <label className="font-semibold">Status</label>
                <p className="capitalize">{selectedApp.status}</p>
              </div>
              <div>
                <label className="font-semibold">Message</label>
                <p>{selectedApp.message || "No message"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
