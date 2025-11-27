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
  // default now "pending"
  const [statusFilter, setStatusFilter] = useState("pending");
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
              batch: 1,
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
    <div className="p-4 md:p-6 space-y-4 h-[90vh] flex flex-col">
      {/* Header + search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl md:text-2xl font-semibold">
          Membership Applications
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        {/* STATUS TABS – Pending is default, no All */}
        <Tabs
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="w-full md:w-auto"
        >
          <TabsList className="w-full md:w-auto flex flex-wrap">
            <TabsTrigger value="pending" className="flex-1 md:flex-none">
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex-1 md:flex-none">
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1 md:flex-none">
              Rejected
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as any)}
          className="w-full md:w-auto"
        >
          <TabsList className="w-full md:w-auto flex flex-wrap">
            <TabsTrigger value="all" className="flex-1 md:flex-none">
              All Types
            </TabsTrigger>
            <TabsTrigger value="adult" className="flex-1 md:flex-none">
              Adult
            </TabsTrigger>
            <TabsTrigger value="parent" className="flex-1 md:flex-none">
              Parent
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden md:flex flex-1 overflow-hidden border rounded-lg bg-card flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Loading...
          </div>
        ) : !filteredApplications || filteredApplications.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm text-center px-4">
            No applications found
          </div>
        ) : (
          <div className="max-h-[calc(90vh-220px)] overflow-auto">
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
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setSelectedApp(app)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {app.status === "pending" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600"
                                onClick={() => acceptMutation.mutate(app)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600"
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
          </div>
        )}
      </div>

      {/* Mobile cards list */}
      <div className="md:hidden flex-1 overflow-auto space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center text-muted-foreground text-sm h-full">
            Loading...
          </div>
        ) : !filteredApplications || filteredApplications.length === 0 ? (
          <div className="flex items-center justify-center text-muted-foreground text-sm text-center px-4 h-full">
            No applications found
          </div>
        ) : (
          filteredApplications.map((app) => {
            const linkedMember = findMemberForApp(app);
            return (
              <div
                key={`${app.type}-${app.id}`}
                className="border rounded-lg bg-card px-3 py-3 shadow-sm space-y-2"
              >
                {/* Top row: name + age */}
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">
                    {app.type === "adult"
                      ? app.name
                      : (app as ParentApplication).child_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Age:{" "}
                    {app.type === "adult"
                      ? app.age
                      : (app as ParentApplication).child_age}
                  </div>
                </div>

                {/* Contact + meta */}
                <div className="text-xs space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Contact</span>
                    <span className="font-medium">
                      {app.type === "adult"
                        ? app.contact
                        : (app as ParentApplication).parent_phone}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize">{app.type}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Status</span>
                    <span className="capitalize">{app.status}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>
                      {format(new Date(app.created_at), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>

                {/* Actions full width – preserve your order/positioning */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {app.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 min-w-[80px] bg-red-600 text-white hover:bg-red-700"
                        onClick={() => rejectMutation.mutate(app)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 min-w-[80px] bg-green-600 text-white hover:bg-green-700"
                        onClick={() => acceptMutation.mutate(app)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </>
                  )}
                  {linkedMember && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-destructive text-destructive"
                      onClick={() =>
                        removeMemberMutation.mutate(linkedMember.id)
                      }
                    >
                      Remove from members
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 min-w-[80px]"
                    onClick={() => setSelectedApp(app)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-sm sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>Full application information</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-xs uppercase text-muted-foreground">
                  Name
                </p>
                <p>
                  {selectedApp.type === "adult"
                    ? selectedApp.name
                    : (selectedApp as ParentApplication).child_name}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="font-semibold text-xs uppercase text-muted-foreground">
                    Age
                  </p>
                  <p>
                    {selectedApp.type === "adult"
                      ? selectedApp.age
                      : (selectedApp as ParentApplication).child_age}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-xs uppercase text-muted-foreground">
                    Status
                  </p>
                  <p className="capitalize">{selectedApp.status}</p>
                </div>
              </div>
              {selectedApp.type === "parent" && (
                <div>
                  <p className="font-semibold text-xs uppercase text-muted-foreground">
                    Parent Name
                  </p>
                  <p>{(selectedApp as ParentApplication).parent_name}</p>
                </div>
              )}
              <div>
                <p className="font-semibold text-xs uppercase text-muted-foreground">
                  Contact
                </p>
                <p>
                  {selectedApp.type === "adult"
                    ? selectedApp.contact
                    : (selectedApp as ParentApplication).parent_phone}
                </p>
              </div>
              <div>
                <p className="font-semibold text-xs uppercase text-muted-foreground">
                  Address
                </p>
                <p>{selectedApp.address}</p>
              </div>
              <div>
                <p className="font-semibold text-xs uppercase text-muted-foreground">
                  Facebook Account
                </p>
                <p>{selectedApp.fb_acc || "N/A"}</p>
              </div>
              <div>
                <p className="font-semibold text-xs uppercase text-muted-foreground">
                  Message
                </p>
                <p>{selectedApp.message || "No message"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
