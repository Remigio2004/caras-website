import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Plus,
  Pencil,
  Search,
  MoreVertical,
  CheckCircle2,
  Undo2,
  CheckSquare,
  X,
  Trash2,
  Download,
} from "lucide-react";
import ContributionsExportPreviewDialog from "./ContributionsExportPreviewDialog";
import type {
  ContributionMemberRow,
  ContributionPeriodColumn,
} from "./ContributionsPrintLayout";

interface Member {
  id: string;
  full_name: string;
}

interface Period {
  id: string;
  label: string;
  period_month: string;
  meeting_date: string | null;
  amount_due: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Contribution {
  id: string;
  period_id: string;
  member_id: string;
  status: "unpaid" | "paid";
  amount_paid: number | null;
  paid_date: string | null;
  created_at: string;
  updated_at: string;
  members: { full_name: string } | null;
}

const PAGE_SIZE = 6;

type StatusFilter = "all" | "paid" | "unpaid";

const emptyPeriodForm = {
  label: "",
  period_month: "",
  meeting_date: "",
  amount_due: "0",
};

function formatPeso(amount: number) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// "2026-08" (month input) <-> "2026-08-01" (DATE column)
function monthInputToDate(value: string): string {
  return value ? `${value}-01` : "";
}
function dateToMonthInput(value: string): string {
  return value ? value.slice(0, 7) : "";
}

// Same helper as PenaltiesView — ISO timestamp -> local datetime-local value
function toDatetimeLocalValue(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ContributionsView() {
  const { user } = useAuth();
  const canEdit = user?.role === "treasurer";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);

  const [periodFormOpen, setPeriodFormOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [periodForm, setPeriodForm] = useState(emptyPeriodForm);

  const [contributionToMarkPaid, setContributionToMarkPaid] =
    useState<Contribution | null>(null);
  const [paidDateInput, setPaidDateInput] = useState("");
  const [amountPaidInput, setAmountPaidInput] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [bulkMarkPaidOpen, setBulkMarkPaidOpen] = useState(false);
  const [bulkEditPaymentOpen, setBulkEditPaymentOpen] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportPeriods, setExportPeriods] = useState<ContributionPeriodColumn[]>([]);
  const [exportMembers, setExportMembers] = useState<ContributionMemberRow[]>([]);
  const [exportTotals, setExportTotals] = useState<Record<string, number>>({});

  const [deletePeriodOpen, setDeletePeriodOpen] = useState(false);

  // Periods, newest month first
  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ["contribution-periods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contribution_periods")
        .select("*")
        .order("period_month", { ascending: false });
      if (error) throw error;
      const rows = (data || []) as Period[];
      if (rows.length && !selectedPeriodId) {
        setSelectedPeriodId(rows[0].id);
      }
      return rows;
    },
  });

  const selectedPeriod = useMemo(
    () => (periods || []).find((p) => p.id === selectedPeriodId) || null,
    [periods, selectedPeriodId]
  );

  // Contributions for the selected period, joined with member name
  const { data: contributions, isLoading: contributionsLoading } = useQuery({
    queryKey: ["contributions", selectedPeriodId],
    queryFn: async () => {
      if (!selectedPeriodId) return [] as Contribution[];
      const { data, error } = await supabase
        .from("contributions")
        .select("*, members(full_name)")
        .eq("period_id", selectedPeriodId);
      if (error) throw error;
      return (data || []) as unknown as Contribution[];
    },
    enabled: !!selectedPeriodId,
  });

  const filteredContributions = useMemo(() => {
    let rows = contributions || [];
    if (statusFilter !== "all") {
      rows = rows.filter((c) => c.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      rows = rows.filter((c) =>
        (c.members?.full_name || "").toLowerCase().includes(term)
      );
    }
    return [...rows].sort((a, b) =>
      (a.members?.full_name || "").localeCompare(b.members?.full_name || "")
    );
  }, [contributions, searchTerm, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredContributions.length / PAGE_SIZE)
  );
  const paginatedContributions = filteredContributions.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  const totalCollected = useMemo(() => {
    return (contributions || [])
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
  }, [contributions]);

  const pendingCount = useMemo(() => {
    return (contributions || []).filter((c) => c.status === "unpaid").length;
  }, [contributions]);

  const totalTarget = (contributions || []).length * Number(
    selectedPeriod?.amount_due || 0
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["contribution-periods"] });
    queryClient.invalidateQueries({ queryKey: ["contributions"] });
  };

  // Create a new period, then auto-generate one "unpaid" contribution row
  // per active member so the treasurer has a ready checklist to work from.
  const addPeriodMutation = useMutation({
    mutationFn: async (payload: typeof emptyPeriodForm) => {
      if (!canEdit) throw new Error("Not authorized");
      const { data: period, error: periodError } = await supabase
        .from("contribution_periods")
        .insert({
          label: payload.label,
          period_month: monthInputToDate(payload.period_month),
          meeting_date: payload.meeting_date
            ? new Date(payload.meeting_date).toISOString()
            : null,
          amount_due: Number(payload.amount_due) || 0,
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (periodError) throw periodError;

      const { data: members, error: membersError } = await supabase
        .from("members")
        .select("id");
      if (membersError) throw membersError;

      if (members && members.length > 0) {
        const rows = members.map((m) => ({
          period_id: period.id,
          member_id: m.id,
          status: "unpaid" as const,
          created_by: user?.id || null,
        }));
        const { error: insertError } = await supabase
          .from("contributions")
          .insert(rows);
        if (insertError) throw insertError;
      }

      return period as Period;
    },
    onSuccess: (period) => {
      invalidateAll();
      setSelectedPeriodId(period.id);
      toast({ title: "Period added" });
      setPeriodFormOpen(false);
      setPeriodForm(emptyPeriodForm);
    },
    onError: (err) => {
      console.error("add period error:", err);
      toast({
        title: "Failed to add period",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Edit an existing period's label / amount due / meeting date only —
  // does not touch already-recorded contribution rows.
  const updatePeriodMutation = useMutation({
    mutationFn: async (payload: { id: string } & typeof emptyPeriodForm) => {
      if (!canEdit) throw new Error("Not authorized");
      const { id, ...rest } = payload;
      const { error } = await supabase
        .from("contribution_periods")
        .update({
          label: rest.label,
          period_month: monthInputToDate(rest.period_month),
          meeting_date: rest.meeting_date
            ? new Date(rest.meeting_date).toISOString()
            : null,
          amount_due: Number(rest.amount_due) || 0,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Period updated" });
      setEditingPeriod(null);
      setPeriodForm(emptyPeriodForm);
      setPeriodFormOpen(false);
    },
    onError: (err) => {
      console.error("update period error:", err);
      toast({
        title: "Failed to update period",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Mark a contribution paid (with treasurer-provided date/amount) or
  // reset it back to unpaid.
  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      contribution,
      paidDate,
      amountPaid,
    }: {
      contribution: Contribution;
      paidDate?: string | null;
      amountPaid?: number | null;
    }) => {
      if (!canEdit) throw new Error("Not authorized");
      const nextStatus = contribution.status === "paid" ? "unpaid" : "paid";
      const { error } = await supabase
        .from("contributions")
        .update({
          status: nextStatus,
          paid_date: nextStatus === "paid" ? paidDate ?? null : null,
          amount_paid: nextStatus === "paid" ? amountPaid ?? null : null,
        })
        .eq("id", contribution.id);
      if (error) throw error;
    },
    onSuccess: (_data, { contribution }) => {
      invalidateAll();
      toast({
        title:
          contribution.status === "paid" ? "Marked as unpaid" : "Marked as paid",
      });
      setContributionToMarkPaid(null);
      setPaidDateInput("");
      setAmountPaidInput("");
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

  // Saves the paid_date + amount_paid for a single already-paid
  // contribution WITHOUT flipping its status (unlike toggleStatusMutation,
  // which is only meant for the explicit "Mark as unpaid" action).
  const savePaymentMutation = useMutation({
    mutationFn: async ({
      contributionId,
      paidDate,
      amountPaid,
    }: {
      contributionId: string;
      paidDate: string;
      amountPaid: number;
    }) => {
      if (!canEdit) throw new Error("Not authorized");
      const { error } = await supabase
        .from("contributions")
        .update({
          status: "paid",
          paid_date: paidDate,
          amount_paid: amountPaid,
        })
        .eq("id", contributionId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setContributionToMarkPaid(null);
      setPaidDateInput("");
      setAmountPaidInput("");
      toast({ title: "Payment saved" });
    },
    onError: (err) => {
      console.error("save payment error:", err);
      toast({
        title: "Failed to save payment",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Bulk-revert selected contributions back to unpaid (clears paid_date +
  // amount_paid). No dialog needed since there's nothing to fill in.
  const bulkMarkUnpaidMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!canEdit) throw new Error("Not authorized");
      if (!ids.length) throw new Error("No rows selected");
      const { error } = await supabase
        .from("contributions")
        .update({ status: "unpaid", paid_date: null, amount_paid: null })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      invalidateAll();
      toast({
        title: `${ids.length} marked as unpaid`,
      });
      setSelectedIds(new Set());
      setIsSelecting(false);
    },
    onError: (err) => {
      console.error("bulk mark unpaid error:", err);
      toast({
        title: "Failed to update",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Delete several selected contribution rows at once (e.g. wrong member
  // accidentally included in a period).
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!canEdit) throw new Error("Not authorized");
      if (!ids.length) throw new Error("No rows selected");
      const { error } = await supabase
        .from("contributions")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      invalidateAll();
      toast({
        title: `${ids.length} record${ids.length !== 1 ? "s" : ""} deleted`,
      });
      setSelectedIds(new Set());
      setIsSelecting(false);
    },
    onError: (err) => {
      console.error("bulk delete error:", err);
      toast({
        title: "Failed to delete",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Apply the same paid_date + amount_paid to every selected contribution
  // in one query, instead of clicking Mark as Paid one member at a time.
  const bulkMarkPaidMutation = useMutation({
    mutationFn: async ({
      ids,
      paidDate,
      amountPaid,
    }: {
      ids: string[];
      paidDate: string;
      amountPaid: number;
    }) => {
      if (!canEdit) throw new Error("Not authorized");
      const { error } = await supabase
        .from("contributions")
        .update({
          status: "paid",
          paid_date: paidDate,
          amount_paid: amountPaid,
        })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, { ids }) => {
      invalidateAll();
      toast({ title: `${ids.length} marked as paid` });
      setSelectedIds(new Set());
      setIsSelecting(false);
      setBulkMarkPaidOpen(false);
      setPaidDateInput("");
      setAmountPaidInput("");
    },
    onError: (err) => {
      console.error("bulk mark paid error:", err);
      toast({
        title: "Failed to mark as paid",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Overwrites paid_date + amount_paid for several ALREADY-PAID
  // contributions at once, using a single date/amount for all of them.
  // Status is intentionally left untouched (they're already "paid").
  const bulkEditPaymentMutation = useMutation({
    mutationFn: async ({
      ids,
      paidDate,
      amountPaid,
    }: {
      ids: string[];
      paidDate: string;
      amountPaid: number;
    }) => {
      if (!canEdit) throw new Error("Not authorized");
      if (!ids.length) throw new Error("No rows selected");
      const { error } = await supabase
        .from("contributions")
        .update({
          paid_date: paidDate,
          amount_paid: amountPaid,
        })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, { ids }) => {
      invalidateAll();
      toast({ title: `${ids.length} payment${ids.length !== 1 ? "s" : ""} updated` });
      setSelectedIds(new Set());
      setIsSelecting(false);
      setBulkEditPaymentOpen(false);
      setPaidDateInput("");
      setAmountPaidInput("");
    },
    onError: (err) => {
      console.error("bulk edit payment error:", err);
      toast({
        title: "Failed to update payments",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Deletes every contribution row tied to this period first (foreign key),
  // then the period itself. Falls back to the next available period after.
  const deletePeriodMutation = useMutation({
    mutationFn: async (periodId: string) => {
      if (!canEdit) throw new Error("Not authorized");

      const { error: contribError } = await supabase
        .from("contributions")
        .delete()
        .eq("period_id", periodId);
      if (contribError) throw contribError;

      const { error: periodError } = await supabase
        .from("contribution_periods")
        .delete()
        .eq("id", periodId);
      if (periodError) throw periodError;
    },
    onSuccess: (_data, periodId) => {
      invalidateAll();
      toast({ title: "Period deleted" });
      setDeletePeriodOpen(false);
      if (selectedPeriodId === periodId) {
        setSelectedPeriodId(null);
      }
    },
    onError: (err) => {
      console.error("delete period error:", err);
      toast({
        title: "Failed to delete period",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const openAddPeriodForm = () => {
    setEditingPeriod(null);
    setPeriodForm({
      ...emptyPeriodForm,
      amount_due: selectedPeriod ? String(selectedPeriod.amount_due) : "0",
    });
    setPeriodFormOpen(true);
  };

  const openEditPeriodForm = () => {
    if (!selectedPeriod) return;
    setEditingPeriod(selectedPeriod);
    setPeriodForm({
      label: selectedPeriod.label,
      period_month: dateToMonthInput(selectedPeriod.period_month),
      meeting_date: selectedPeriod.meeting_date
        ? toDatetimeLocalValue(selectedPeriod.meeting_date)
        : "",
      amount_due: String(selectedPeriod.amount_due),
    });
    setPeriodFormOpen(true);
  };

  const toggleSelectMode = () => {
    setIsSelecting((prev) => {
      const next = !prev;
      if (!next) setSelectedIds(new Set());
      return next;
    });
  };

  
  const handleRowClick = (
    e: React.MouseEvent,
    contribution: Contribution,
    index: number
  ) => {
    if (!isSelecting || !canEdit) return;

    if (e.shiftKey && lastSelectedId) {
      const anchorIndex = paginatedContributions.findIndex(
        (c) => c.id === lastSelectedId
      );
      if (anchorIndex !== -1) {
        const [start, end] =
          anchorIndex < index ? [anchorIndex, index] : [index, anchorIndex];
        const rangeIds = paginatedContributions
          .slice(start, end + 1)
          .map((c) => c.id);
        setSelectedIds(new Set(rangeIds));
        return;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(contribution.id)) next.delete(contribution.id);
        else next.add(contribution.id);
        return next;
      });
      setLastSelectedId(contribution.id);
      return;
    }

    setSelectedIds(new Set([contribution.id]));
    setLastSelectedId(contribution.id);
  };

  // Ctrl/Cmd+A selects every unpaid member across ALL pages (not just the
  // current one); Esc exits selection mode entirely.
  useEffect(() => {
    if (!isSelecting || !canEdit) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedIds(new Set(filteredContributions.map((c) => c.id)));
      }
      if (e.key === "Escape") {
        setIsSelecting(false);
        setSelectedIds(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelecting, canEdit, filteredContributions]);

  const openBulkMarkPaidDialog = () => {
    setPaidDateInput(toDatetimeLocalValue(new Date().toISOString()));
    setAmountPaidInput(String(selectedPeriod?.amount_due ?? "0"));
    setBulkMarkPaidOpen(true);
  };

  const openMarkPaidDialog = (contribution: Contribution) => {
    setContributionToMarkPaid(contribution);
    setPaidDateInput(toDatetimeLocalValue(new Date().toISOString()));
    setAmountPaidInput(String(selectedPeriod?.amount_due ?? "0"));
  };

  const openEditPaymentDialog = (contribution: Contribution) => {
    setContributionToMarkPaid(contribution);
    setPaidDateInput(
      contribution.paid_date
        ? toDatetimeLocalValue(contribution.paid_date)
        : toDatetimeLocalValue(new Date().toISOString())
    );
    setAmountPaidInput(String(contribution.amount_paid ?? "0"));
  };

  // Opens the bulk Edit Payment dialog for the current selection. Every
  // selected row must already be "paid" — if any unpaid row is included,
  // this blocks with an error instead of silently skipping it.
  const openBulkEditPaymentDialog = () => {
    const selected = filteredContributions.filter((c) => selectedIds.has(c.id));
    if (selected.length === 0) return;

    const hasUnpaid = selected.some((c) => c.status !== "paid");
    if (hasUnpaid) {
      toast({
        title: "May unpaid sa selection",
        description:
          "Paid records lang ang puwedeng i-edit. Alisin muna sa selection ang mga unpaid member.",
        variant: "destructive",
      });
      return;
    }

    setPaidDateInput(toDatetimeLocalValue(new Date().toISOString()));
    setAmountPaidInput(String(selectedPeriod?.amount_due ?? "0"));
    setBulkEditPaymentOpen(true);
  };

  const handlePeriodSubmit = () => {
    if (!periodForm.label.trim() || !periodForm.period_month) {
      toast({
        title: "Missing info",
        description: "Label at buwan ay required.",
        variant: "destructive",
      });
      return;
    }
    if (editingPeriod) {
      updatePeriodMutation.mutate({ id: editingPeriod.id, ...periodForm });
    } else {
      addPeriodMutation.mutate(periodForm);
    }
  };

  const isSavingPeriod =
    addPeriodMutation.isPending || updatePeriodMutation.isPending;

  // Pulls EVERY period + EVERY contribution (not just the currently
  // selected period) and pivots them into a member-rows x period-columns
  // table for the PDF export.
  const handleExportClick = async () => {
    setIsExporting(true);
    try {
      const { data: allPeriods, error: periodsError } = await supabase
        .from("contribution_periods")
        .select("*")
        .order("period_month", { ascending: true });
      if (periodsError) throw periodsError;

      const { data: allContributions, error: contributionsError } =
        await supabase
          .from("contributions")
          .select("*, members(full_name)");
      if (contributionsError) throw contributionsError;

      const rows = (allContributions || []) as unknown as Contribution[];
      const periodRows = (allPeriods || []) as Period[];

      if (periodRows.length === 0 || rows.length === 0) {
        toast({
          title: "No data",
          description: "Wala pang periods o contributions na ma-e-export.",
        });
        return;
      }

      const columns: ContributionPeriodColumn[] = periodRows.map((p) => ({
        id: p.id,
        label: format(new Date(p.meeting_date || p.period_month), "MMM d, yyyy"),
      }));

      const memberMap = new Map<string, string>();
      rows.forEach((c) => {
        if (c.member_id && c.members?.full_name) {
          memberMap.set(c.member_id, c.members.full_name);
        }
      });

      const memberRows: ContributionMemberRow[] = Array.from(
        memberMap.entries()
      )
        .map(([member_id, full_name]) => {
          const cells: ContributionMemberRow["cells"] = {};
          rows
            .filter((c) => c.member_id === member_id)
            .forEach((c) => {
              cells[c.period_id] = {
                status: c.status,
                amount: c.amount_paid,
              };
            });
          return { member_id, full_name, cells };
        })
        .sort((a, b) => a.full_name.localeCompare(b.full_name));

      const totals: Record<string, number> = {};
      periodRows.forEach((p) => {
        totals[p.id] = rows
          .filter((c) => c.period_id === p.id && c.status === "paid")
          .reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
      });

      setExportPeriods(columns);
      setExportMembers(memberRows);
      setExportTotals(totals);
      setExportOpen(true);
    } catch (err) {
      console.error("export error:", err);
      toast({
        title: "Export error",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Contributions</h2>
          {selectedPeriod ? (
            <p className="text-xs md:text-sm text-muted-foreground">
              {formatPeso(totalCollected)} collected /{" "}
              {formatPeso(totalTarget)} target • {pendingCount} pending
            </p>
          ) : (
            <p className="text-xs md:text-sm text-muted-foreground">
              Walang period pa
            </p>
          )}
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
          <Select
            value={selectedPeriodId || undefined}
            onValueChange={(v) => {
              setSelectedPeriodId(v);
              setPage(0);
              setIsSelecting(false);
              setSelectedIds(new Set());
            }}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Piliin ang period" />
            </SelectTrigger>
            <SelectContent>
              {(periods || []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilter);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openAddPeriodForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Period
                </DropdownMenuItem>
                {selectedPeriod && (
                  <DropdownMenuItem onClick={openEditPeriodForm}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Period
                  </DropdownMenuItem>
                )}
                {selectedPeriod && (
                  <DropdownMenuItem
                    onClick={() => setDeletePeriodOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Period
                  </DropdownMenuItem>
                )}
                {selectedPeriod && (contributions || []).length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={toggleSelectMode}>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      {isSelecting ? "Cancel Selection" : "Select"}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleExportClick}
                  disabled={isExporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? "Preparing..." : "Export"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Member count + meeting info */}
      {selectedPeriod && (
        <p className="text-xs text-muted-foreground">
          {(contributions || []).length} members
          {selectedPeriod.meeting_date && (
            <>
              {" "}
              • Meeting:{" "}
              {format(
                new Date(selectedPeriod.meeting_date),
                "MMM d, yyyy • h:mm a"
              )}
            </>
          )}
        </p>
      )}

      {canEdit && isSelecting && (
        <div className="border rounded-md p-2 bg-muted/30">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                title="Clear selection"
                onClick={() => {
                  setIsSelecting(false);
                  setSelectedIds(new Set());
                }}
              >
                <X className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : "I-click ang mga unpaid member (Shift/Ctrl para sa multiple, Ctrl+A para lahat)"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Mark as Paid"
                onClick={openBulkMarkPaidDialog}
                disabled={selectedIds.size === 0}
              >
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </Button>

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Edit Payment"
                onClick={openBulkEditPaymentDialog}
                disabled={selectedIds.size === 0}
              >
                <Pencil className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Mark as Unpaid"
                onClick={() =>
                  bulkMarkUnpaidMutation.mutate(Array.from(selectedIds))
                }
                disabled={
                  selectedIds.size === 0 || bulkMarkUnpaidMutation.isPending
                }
              >
                <Undo2 className="w-4 h-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title="Delete"
                    disabled={
                      selectedIds.size === 0 || bulkDeleteMutation.isPending
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete {selectedIds.size} record
                      {selectedIds.size !== 1 ? "s" : ""}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Permanenteng mabubura ang mga contribution record na
                      ito. Hindi na ito mababawi.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() =>
                        bulkDeleteMutation.mutate(Array.from(selectedIds))
                      }
                      disabled={bulkDeleteMutation.isPending}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-hidden border rounded-lg bg-card flex flex-col">
        {periodsLoading || contributionsLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Loading contributions...
          </div>
        ) : !selectedPeriod ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm text-center px-4">
            {canEdit
              ? 'Wala pang period. I-click ang "New Period" para magsimula.'
              : "Wala pang period na nagawa."}
          </div>
        ) : filteredContributions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm text-center px-4">
            Walang member na tumugma
          </div>
        ) : (
          <>
            <div className="max-h-[calc(90vh-260px)] overflow-auto">
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead className="text-center">Paid Date</TableHead>
                      {canEdit && !isSelecting && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedContributions.map((contribution, index) => (
                      <TableRow
                        key={contribution.id}
                        onClick={(e) => handleRowClick(e, contribution, index)}
                        className={
                          isSelecting
                            ? `cursor-pointer select-none ${
                                selectedIds.has(contribution.id)
                                  ? "bg-primary/10 hover:bg-primary/10"
                                  : "hover:bg-muted/40"
                              }`
                            : ""
                        }
                      >
                        <TableCell className="font-medium">
                          {contribution.members?.full_name || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              contribution.status === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {contribution.status === "paid" ? "Paid" : "Unpaid"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {contribution.amount_paid != null
                            ? formatPeso(Number(contribution.amount_paid))
                            : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {contribution.paid_date ? (
                            <>
                              <div>
                                {format(
                                  new Date(contribution.paid_date),
                                  "MMM d, yyyy"
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(
                                  new Date(contribution.paid_date),
                                  "h:mm a"
                                )}
                              </div>
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        {canEdit && !isSelecting && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {contribution.status === "paid" ? (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => openEditPaymentDialog(contribution)}
                                    >
                                      <Pencil className="w-4 h-4 mr-2" />
                                      Edit payment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toggleStatusMutation.mutate({
                                          contribution,
                                          paidDate: null,
                                          amountPaid: null,
                                        })
                                      }
                                    >
                                      <Undo2 className="w-4 h-4 mr-2" />
                                      Mark as unpaid
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => openMarkPaidDialog(contribution)}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                    Mark as paid
                                  </DropdownMenuItem>
                                )}
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

      {/* Add / Edit period dialog */}
      {canEdit && (
        <Dialog
          open={periodFormOpen}
          onOpenChange={(open) => {
            setPeriodFormOpen(open);
            if (!open) {
              setEditingPeriod(null);
              setPeriodForm(emptyPeriodForm);
            }
          }}
        >
          <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPeriod ? "Edit Period" : "New Collection Period"}
              </DialogTitle>
              <DialogDescription>
                {editingPeriod
                  ? "Baguhin ang detalye ng period na ito."
                  : "Gagawa ito ng bagong buwan ng koleksyon at otomatikong ida-dagdag ang lahat ng members bilang unpaid."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-1">Label</p>
                <Input
                  placeholder="hal. August 2026"
                  value={periodForm.label}
                  onChange={(e) =>
                    setPeriodForm((f) => ({ ...f, label: e.target.value }))
                  }
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Buwan</p>
                <Input
                  type="month"
                  value={periodForm.period_month}
                  onChange={(e) =>
                    setPeriodForm((f) => ({
                      ...f,
                      period_month: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">
                  Meeting Date &amp; Time (optional)
                </p>
                <Input
                  type="datetime-local"
                  value={periodForm.meeting_date}
                  onChange={(e) =>
                    setPeriodForm((f) => ({
                      ...f,
                      meeting_date: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">
                  Amount Due per Member (₱)
                </p>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={periodForm.amount_due}
                  onChange={(e) =>
                    setPeriodForm((f) => ({
                      ...f,
                      amount_due: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPeriodFormOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePeriodSubmit}
                  disabled={isSavingPeriod}
                  className="w-full sm:w-auto"
                >
                  {isSavingPeriod
                    ? "Saving..."
                    : editingPeriod
                    ? "Save changes"
                    : "Create Period"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Mark as paid / edit payment dialog */}
      {canEdit && (
        <Dialog
          open={!!contributionToMarkPaid}
          onOpenChange={(open) => {
            if (!open) {
              setContributionToMarkPaid(null);
              setPaidDateInput("");
              setAmountPaidInput("");
            }
          }}
        >
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {contributionToMarkPaid?.status === "paid"
                  ? "Edit Payment"
                  : "Mark as Paid"}
              </DialogTitle>
              <DialogDescription>
                Ilagay ang petsa, oras, at halaga ng ibinayad ni{" "}
                <span className="font-semibold">
                  {contributionToMarkPaid?.members?.full_name}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-1">Amount Paid (₱)</p>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                />
              </div>
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
                  setContributionToMarkPaid(null);
                  setPaidDateInput("");
                  setAmountPaidInput("");
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!contributionToMarkPaid) return;
                  if (!paidDateInput) {
                    toast({
                      title: "Missing date",
                      description: "Ilagay ang petsa at oras ng pagbayad.",
                      variant: "destructive",
                    });
                    return;
                  }
                  savePaymentMutation.mutate({
                    contributionId: contributionToMarkPaid.id,
                    paidDate: new Date(paidDateInput).toISOString(),
                    amountPaid: Number(amountPaidInput) || 0,
                  });
                }}
                disabled={savePaymentMutation.isPending}
                className="w-full sm:w-auto"
              >
                {savePaymentMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk mark as paid dialog */}
      {canEdit && (
        <Dialog
          open={bulkMarkPaidOpen}
          onOpenChange={(open) => {
            setBulkMarkPaidOpen(open);
            if (!open) {
              setPaidDateInput("");
              setAmountPaidInput("");
            }
          }}
        >
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Mark {selectedIds.size} as Paid</DialogTitle>
              <DialogDescription>
                Ilalapat ang parehong halaga at petsa/oras sa lahat ng{" "}
                {selectedIds.size} napiling members.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-1">
                  Amount Paid (₱) — kada member
                </p>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                />
              </div>
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
                onClick={() => setBulkMarkPaidOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!paidDateInput) {
                    toast({
                      title: "Missing date",
                      description: "Ilagay ang petsa at oras ng pagbayad.",
                      variant: "destructive",
                    });
                    return;
                  }
                  bulkMarkPaidMutation.mutate({
                    ids: Array.from(selectedIds),
                    paidDate: new Date(paidDateInput).toISOString(),
                    amountPaid: Number(amountPaidInput) || 0,
                  });
                }}
                disabled={bulkMarkPaidMutation.isPending}
                className="w-full sm:w-auto"
              >
                {bulkMarkPaidMutation.isPending
                  ? "Saving..."
                  : `Mark ${selectedIds.size} as Paid`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk edit payment dialog — single date/amount applied to every
          selected PAID contribution, status untouched */}
      {canEdit && (
        <Dialog
          open={bulkEditPaymentOpen}
          onOpenChange={(open) => {
            setBulkEditPaymentOpen(open);
            if (!open) {
              setPaidDateInput("");
              setAmountPaidInput("");
            }
          }}
        >
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit {selectedIds.size} Payment{selectedIds.size !== 1 ? "s" : ""}</DialogTitle>
              <DialogDescription>
                Ilalapat ang parehong halaga at petsa/oras sa lahat ng{" "}
                {selectedIds.size} napiling paid members. Hindi magbabago ang
                status nila.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-1">
                  Amount Paid (₱) — kada member
                </p>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                />
              </div>
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
                onClick={() => setBulkEditPaymentOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!paidDateInput) {
                    toast({
                      title: "Missing date",
                      description: "Ilagay ang petsa at oras ng pagbayad.",
                      variant: "destructive",
                    });
                    return;
                  }
                  bulkEditPaymentMutation.mutate({
                    ids: Array.from(selectedIds),
                    paidDate: new Date(paidDateInput).toISOString(),
                    amountPaid: Number(amountPaidInput) || 0,
                  });
                }}
                disabled={bulkEditPaymentMutation.isPending}
                className="w-full sm:w-auto"
              >
                {bulkEditPaymentMutation.isPending
                  ? "Saving..."
                  : `Save ${selectedIds.size} Payment${selectedIds.size !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete period confirmation */}
      {canEdit && (
        <AlertDialog open={deletePeriodOpen} onOpenChange={setDeletePeriodOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete "{selectedPeriod?.label}"?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Permanenteng mabubura ang period na ito pati na ang lahat ng
                contribution records nito. Hindi na ito mababawi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (selectedPeriod) {
                    deletePeriodMutation.mutate(selectedPeriod.id);
                  }
                }}
                disabled={deletePeriodMutation.isPending}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <ContributionsExportPreviewDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        periods={exportPeriods}
        members={exportMembers}
        totals={exportTotals}
      />
    </div>
  );
}