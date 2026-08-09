import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Undo2,
  Search,
  MoreVertical,
} from "lucide-react";

interface Member {
  id: string;
  full_name: string;
}

interface Penalty {
  id: string;
  member_id: string;
  date_absent: string;
  reason: string | null;
  penalty_amount: number;
  status: "unpaid" | "paid";
  paid_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  members: { full_name: string } | null;
}

type StatusFilter = "all" | "unpaid" | "paid";

const emptyForm = {
  member_id: "",
  date_absent: "",
  reason: "",
  penalty_amount: "0",
};

const PAGE_SIZE = 6;

function formatPeso(amount: number) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Converts a stored ISO timestamp into the "yyyy-MM-ddTHH:mm" shape that
// an <input type="datetime-local"> expects for its value, in local time.
function toDatetimeLocalValue(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PenaltiesView() {
  const { user } = useAuth();
  const canEdit = user?.role === "treasurer";

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPenalty, setEditingPenalty] = useState<Penalty | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [penaltyToDelete, setPenaltyToDelete] = useState<Penalty | null>(
    null
  );
  const [penaltyToMarkPaid, setPenaltyToMarkPaid] = useState<Penalty | null>(
    null
  );
  const [paidDateInput, setPaidDateInput] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Penalties joined with the member's name via the member_id FK.
  const { data: penalties, isLoading } = useQuery({
    queryKey: ["penalties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("penalties")
        .select("*, members(full_name)")
        .order("date_absent", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Penalty[];
    },
  });

  // Lightweight members list for the "Member" dropdown in the form.
  const { data: members } = useQuery({
    queryKey: ["members-for-penalties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("id, full_name")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data as Member[];
    },
  });

  const filteredPenalties = useMemo(() => {
    let rows = penalties || [];
    if (statusFilter !== "all") {
      rows = rows.filter((p) => p.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      rows = rows.filter((p) =>
        (p.members?.full_name || "").toLowerCase().includes(term)
      );
    }
    return rows;
  }, [penalties, statusFilter, searchTerm]);

  const totalUnpaidAmount = useMemo(() => {
    return (penalties || [])
      .filter((p) => p.status === "unpaid")
      .reduce((sum, p) => sum + Number(p.penalty_amount), 0);
  }, [penalties]);

  const totalPaidAmount = useMemo(() => {
    return (penalties || [])
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.penalty_amount), 0);
  }, [penalties]);

  const totalPages = Math.max(1, Math.ceil(filteredPenalties.length / PAGE_SIZE));
  const paginatedPenalties = filteredPenalties.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  const invalidatePenalties = () => {
    queryClient.invalidateQueries({ queryKey: ["penalties"] });
  };

  const addMutation = useMutation({
    mutationFn: async (payload: typeof emptyForm) => {
      if (!canEdit) throw new Error("Not authorized");
      const { error } = await supabase.from("penalties").insert({
        member_id: payload.member_id,
        date_absent: new Date(payload.date_absent).toISOString(),
        reason: payload.reason.trim() || null,
        penalty_amount: Number(payload.penalty_amount) || 0,
        created_by: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidatePenalties();
      toast({ title: "Penalty added" });
      setFormOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => {
      console.error("add penalty error:", err);
      toast({
        title: "Failed to add penalty",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string } & typeof emptyForm) => {
      if (!canEdit) throw new Error("Not authorized");
      const { id, ...rest } = payload;
      const { error } = await supabase
        .from("penalties")
        .update({
          member_id: rest.member_id,
          date_absent: new Date(rest.date_absent).toISOString(),
          reason: rest.reason.trim() || null,
          penalty_amount: Number(rest.penalty_amount) || 0,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidatePenalties();
      toast({ title: "Penalty updated" });
      setEditingPenalty(null);
      setForm(emptyForm);
      setFormOpen(false);
    },
    onError: (err) => {
      console.error("update penalty error:", err);
      toast({
        title: "Failed to update penalty",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      penalty,
      paidDate,
    }: {
      penalty: Penalty;
      paidDate?: string | null;
    }) => {
      if (!canEdit) throw new Error("Not authorized");
      const nextStatus = penalty.status === "paid" ? "unpaid" : "paid";
      const { error } = await supabase
        .from("penalties")
        .update({
          status: nextStatus,
          paid_date: nextStatus === "paid" ? paidDate ?? null : null,
        })
        .eq("id", penalty.id);
      if (error) throw error;
    },
    onSuccess: (_data, { penalty }) => {
      invalidatePenalties();
      toast({
        title: penalty.status === "paid" ? "Marked as unpaid" : "Marked as paid",
      });
      setPenaltyToMarkPaid(null);
      setPaidDateInput("");
    },
    onError: (err) => {
      console.error("toggle status error:", err);
      toast({
        title: "Failed to update status",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!canEdit) throw new Error("Not authorized");
      const { error } = await supabase
        .from("penalties")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidatePenalties();
      toast({ title: "Penalty deleted" });
      setPenaltyToDelete(null);
    },
    onError: (err) => {
      console.error("delete penalty error:", err);
      toast({
        title: "Failed to delete penalty",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingPenalty(null);
    setFormOpen(true);
  };

  const openMarkPaidDialog = (penalty: Penalty) => {
    setPenaltyToMarkPaid(penalty);
    setPaidDateInput(toDatetimeLocalValue(new Date().toISOString()));
  };

  const openEditForm = (penalty: Penalty) => {
    setForm({
      member_id: penalty.member_id,
      date_absent: toDatetimeLocalValue(penalty.date_absent),
      reason: penalty.reason || "",
      penalty_amount: String(penalty.penalty_amount),
    });
    setEditingPenalty(penalty);
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.member_id || !form.date_absent) {
      toast({
        title: "Missing info",
        description: "Member at petsa ng pagkawala ay required.",
        variant: "destructive",
      });
      return;
    }
    if (Number.isNaN(Number(form.penalty_amount))) {
      toast({
        title: "Invalid amount",
        description: "Penalty amount must be a number.",
        variant: "destructive",
      });
      return;
    }

    if (editingPenalty) {
      updateMutation.mutate({ id: editingPenalty.id, ...form });
    } else {
      addMutation.mutate(form);
    }
  };

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 md:p-6 space-y-4 h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Penalties</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {(penalties || []).length} total records •{" "}
            {formatPeso(totalUnpaidAmount)} total unpaid •{" "}
            {formatPeso(totalPaidAmount)} total collected
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search member"
              value={searchTerm}
              onChange={(e) => {
                setPage(0);
                setSearchTerm(e.target.value);
              }}
              className="pl-10"
            />
          </div>
          {canEdit && (
            <Button onClick={openAddForm} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Penalty
            </Button>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => {
          setPage(0);
          setStatusFilter(v as StatusFilter);
        }}
      >
        <TabsList className="flex flex-wrap w-full sm:w-auto">
          <TabsTrigger value="all" className="flex-1 sm:flex-none">
            All
          </TabsTrigger>
          <TabsTrigger value="unpaid" className="flex-1 sm:flex-none">
            Unpaid
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex-1 sm:flex-none">
            Paid
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="flex-1 overflow-hidden border rounded-lg bg-card flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Loading penalties...
          </div>
        ) : filteredPenalties.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm text-center px-4">
            No penalty records found
          </div>
        ) : (
          <>
          <div className="max-h-[calc(90vh-260px)] overflow-auto">
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-center">Date Absent</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Paid Date</TableHead>
                    {canEdit && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPenalties.map((penalty) => (
                    <TableRow key={penalty.id}>
                      <TableCell className="font-medium">
                        {penalty.members?.full_name || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        <div>
                          {format(new Date(penalty.date_absent), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(penalty.date_absent), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {penalty.reason || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatPeso(Number(penalty.penalty_amount))}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            penalty.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {penalty.status === "paid" ? "Paid" : "Unpaid"}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        {penalty.paid_date ? (
                          <>
                            <div>
                              {format(new Date(penalty.paid_date), "MMM d, yyyy")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(penalty.paid_date), "h:mm a")}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  penalty.status === "paid"
                                    ? toggleStatusMutation.mutate({
                                        penalty,
                                        paidDate: null,
                                      })
                                    : openMarkPaidDialog(penalty)
                                }
                              >
                                {penalty.status === "paid" ? (
                                  <>
                                    <Undo2 className="w-4 h-4 mr-2" />
                                    Mark as unpaid
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                    Mark as paid
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditForm(penalty)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setPenaltyToDelete(penalty)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 md:px-4 py-2 border-t bg-muted/40">
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3"
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page + 1 >= totalPages}
                onClick={() =>
                  setPage((p) => (p + 1 < totalPages ? p + 1 : p))
                }
                className="px-3"
              >
                Next
              </Button>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Add/Edit dialog */}
      {canEdit && (
        <Dialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) {
              setEditingPenalty(null);
              setForm(emptyForm);
            }
          }}
        >
          <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPenalty ? "Edit Penalty" : "Add Penalty"}
              </DialogTitle>
              <DialogDescription>
                I-record ang araw na hindi nag-serve ang member at ang
                kaukulang penalty.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-1">Member</p>
                <Select
                  value={form.member_id}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, member_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Piliin ang member" />
                  </SelectTrigger>
                  <SelectContent>
                    {(members || []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Date &amp; Time Absent</p>
                <Input
                  type="datetime-local"
                  value={form.date_absent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date_absent: e.target.value }))
                  }
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Reason</p>
                <Textarea
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  placeholder="Optional na dahilan"
                  rows={3}
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Penalty Amount (₱)</p>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.penalty_amount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      penalty_amount: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving
                    ? "Saving..."
                    : editingPenalty
                    ? "Save changes"
                    : "Add Penalty"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirm dialog */}
      {canEdit && (
        <Dialog
          open={!!penaltyToDelete}
          onOpenChange={() => setPenaltyToDelete(null)}
        >
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete penalty record?</DialogTitle>
              <DialogDescription>
                Permanenteng mabubura ito para kay{" "}
                <span className="font-semibold">
                  {penaltyToDelete?.members?.full_name}
                </span>
                . Hindi na ito mababawi.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setPenaltyToDelete(null)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  penaltyToDelete && deleteMutation.mutate(penaltyToDelete.id)
                }
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Mark as paid dialog */}
      {canEdit && (
        <Dialog
          open={!!penaltyToMarkPaid}
          onOpenChange={(open) => {
            if (!open) {
              setPenaltyToMarkPaid(null);
              setPaidDateInput("");
            }
          }}
        >
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Mark as Paid</DialogTitle>
              <DialogDescription>
                Insert the payment date and time for{" "}
                <span className="font-semibold">
                  {penaltyToMarkPaid?.members?.full_name}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-1">Paid Date &amp; Time</p>
                <Input
                  type="datetime-local"
                  value={paidDateInput}
                  onChange={(e) => setPaidDateInput(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setPenaltyToMarkPaid(null);
                  setPaidDateInput("");
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!penaltyToMarkPaid) return;
                  if (!paidDateInput) {
                    toast({
                      title: "Missing date",
                      description: "Ilagay ang petsa at oras ng pagbayad.",
                      variant: "destructive",
                    });
                    return;
                  }
                  toggleStatusMutation.mutate({
                    penalty: penaltyToMarkPaid,
                    paidDate: new Date(paidDateInput).toISOString(),
                  });
                }}
                disabled={toggleStatusMutation.isPending}
                className="w-full sm:w-auto"
              >
                {toggleStatusMutation.isPending ? "Saving..." : "Mark as Paid"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}