import { useEffect, useMemo, useState } from "react";
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
import { useTreasurerStats } from "@/hooks/useTreasurerStats";
import { format } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  MoreVertical,
  ImageIcon,
  CheckSquare,
  X,
  Download,
} from "lucide-react";
import ExpensesExportPreviewDialog from "./ExpensesExportPreviewDialog";
import type { ExpenseExportRow } from "./ExpensesPrintLayout";

interface Expense {
  id: string;
  item_description: string;
  amount: number;
  date_spent: string;
  note: string | null;
  receipt_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  item_description: "",
  date_spent: "",
  amount: "0",
  note: "",
};

const PAGE_SIZE = 6;

function formatPeso(amount: number) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function uploadReceiptImage(file: File): Promise<string> {
  const name = file.name.split(".").slice(0, -1).join(".") || "receipt";
  const safeName = name.replace(/[^a-zA-Z0-9-_]/g, "_");

  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string
  );
  formData.append("folder", "caras-finance/expenses");
  formData.append("public_id", `${safeName}_${Date.now()}`);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Cloudinary upload error", err);
    throw new Error("Cloudinary upload failed");
  }

  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}

function toDateInputValue(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ExpensesView() {
  const { user } = useAuth();
  const canEdit = user?.role === "treasurer";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const { data: treasurerStats } = useTreasurerStats();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date_spent", { ascending: false });
      if (error) throw error;
      return (data || []) as Expense[];
    },
  });

  const filteredExpenses = useMemo(() => {
    let rows = expenses || [];
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      rows = rows.filter((e) => e.item_description.toLowerCase().includes(term));
    }
    return rows;
  }, [expenses, searchTerm]);

  const totalExpenses = useMemo(
    () => (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  );

  // Full, unfiltered list used for the PDF export — exports everything,
  // not just the current search filter.
  const exportRows: ExpenseExportRow[] = useMemo(
    () =>
      (expenses || []).map((e) => ({
        id: e.id,
        item_description: e.item_description,
        date_spent: e.date_spent,
        amount: Number(e.amount),
        note: e.note,
      })),
    [expenses]
  );

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const paginatedExpenses = filteredExpenses.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  const invalidateExpenses = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["treasurer-stats"] });
  };

  const addMutation = useMutation({
    mutationFn: async (payload: typeof emptyForm & { file: File | null }) => {
      if (!canEdit) throw new Error("Not authorized");
      if (!payload.file) throw new Error("Receipt image is required");
      const receipt_image_url = await uploadReceiptImage(payload.file);
      const { error } = await supabase.from("expenses").insert({
        item_description: payload.item_description.trim(),
        amount: Number(payload.amount) || 0,
        date_spent: new Date(payload.date_spent).toISOString(),
        note: payload.note.trim() || null,
        receipt_image_url,
        created_by: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateExpenses();
      toast({ title: "Expense added" });
      setFormOpen(false);
      setForm(emptyForm);
      setReceiptFile(null);
    },
    onError: (err) => {
      console.error("add expense error:", err);
      toast({
        title: "Failed to add expense",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (
      payload: { id: string; existingReceiptUrl: string | null } & typeof emptyForm & {
        file: File | null;
      }
    ) => {
      if (!canEdit) throw new Error("Not authorized");
      let receipt_image_url = payload.existingReceiptUrl;
      if (payload.file) {
        receipt_image_url = await uploadReceiptImage(payload.file);
      }
      if (!receipt_image_url) throw new Error("Receipt image is required");
      const { error } = await supabase
        .from("expenses")
        .update({
          item_description: payload.item_description.trim(),
          amount: Number(payload.amount) || 0,
          date_spent: new Date(payload.date_spent).toISOString(),
          note: payload.note.trim() || null,
          receipt_image_url,
        })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateExpenses();
      toast({ title: "Expense updated" });
      setEditingExpense(null);
      setForm(emptyForm);
      setReceiptFile(null);
      setFormOpen(false);
    },
    onError: (err) => {
      console.error("update expense error:", err);
      toast({
        title: "Failed to update expense",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!canEdit) throw new Error("Not authorized");
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateExpenses();
      toast({ title: "Expense deleted" });
      setExpenseToDelete(null);
    },
    onError: (err) => {
      console.error("delete expense error:", err);
      toast({
        title: "Failed to delete expense",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Delete several selected expense rows at once.
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!canEdit) throw new Error("Not authorized");
      if (!ids.length) throw new Error("No rows selected");
      const { error } = await supabase.from("expenses").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      invalidateExpenses();
      toast({
        title: `${ids.length} record${ids.length !== 1 ? "s" : ""} deleted`,
      });
      setSelectedIds(new Set());
      setIsSelecting(false);
    },
    onError: (err) => {
      console.error("bulk delete expenses error:", err);
      toast({
        title: "Failed to delete",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const handleExportClick = () => {
    if (exportRows.length === 0) {
      toast({
        title: "No data",
        description: "Wala pang expense records na ma-e-export.",
      });
      return;
    }
    setExportOpen(true);
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
    expense: Expense,
    index: number
  ) => {
    if (!isSelecting || !canEdit) return;

    if (e.shiftKey && lastSelectedId) {
      const anchorIndex = paginatedExpenses.findIndex(
        (x) => x.id === lastSelectedId
      );
      if (anchorIndex !== -1) {
        const [start, end] =
          anchorIndex < index ? [anchorIndex, index] : [index, anchorIndex];
        const rangeIds = paginatedExpenses
          .slice(start, end + 1)
          .map((x) => x.id);
        setSelectedIds(new Set(rangeIds));
        return;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(expense.id)) next.delete(expense.id);
        else next.add(expense.id);
        return next;
      });
      setLastSelectedId(expense.id);
      return;
    }

    setSelectedIds(new Set([expense.id]));
    setLastSelectedId(expense.id);
  };

  // Ctrl/Cmd+A selects every expense across ALL pages; Esc exits selection mode.
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
        setSelectedIds(new Set(filteredExpenses.map((x) => x.id)));
      }
      if (e.key === "Escape") {
        setIsSelecting(false);
        setSelectedIds(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelecting, canEdit, filteredExpenses]);

  const openAddForm = () => {
    setForm({ ...emptyForm, date_spent: toDateInputValue(new Date().toISOString()) });
    setReceiptFile(null);
    setEditingExpense(null);
    setFormOpen(true);
  };

  const openEditForm = (expense: Expense) => {
    setForm({
      item_description: expense.item_description,
      date_spent: toDateInputValue(expense.date_spent),
      amount: String(expense.amount),
      note: expense.note || "",
    });
    setReceiptFile(null);
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.item_description.trim() || !form.date_spent) {
      toast({
        title: "Missing info",
        description: "Item and date are required.",
        variant: "destructive",
      });
      return;
    }
    if (!editingExpense && !receiptFile) {
      toast({
        title: "Missing receipt",
        description: "A receipt image is required as proof of the expense.",
        variant: "destructive",
      });
      return;
    }
    if (editingExpense) {
      updateMutation.mutate({
        id: editingExpense.id,
        existingReceiptUrl: editingExpense.receipt_image_url,
        file: receiptFile,
        ...form,
      });
    } else {
      addMutation.mutate({ file: receiptFile, ...form });
    }
  };

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Expenses</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {formatPeso(treasurerStats?.totalFunds ?? 0)} total funds • {formatPeso(totalExpenses)} total spent
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search item"
              value={searchTerm}
              onChange={(e) => {
                setPage(0);
                setSearchTerm(e.target.value);
              }}
              className="pl-10"
            />
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openAddForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </DropdownMenuItem>
                {(expenses || []).length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={toggleSelectMode}>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      {isSelecting ? "Cancel Selection" : "Select"}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportClick}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

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
                  : "I-click ang mga expense (Shift/Ctrl para sa multiple, Ctrl+A para lahat)"}
              </span>
            </div>
            <div className="flex items-center gap-1">
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
                      Permanenteng mabubura ang mga expense record na ito.
                      Hindi na ito mababawi.
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
      <div className="border rounded-lg bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No expense records found</div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-center">Receipt</TableHead>
                    {canEdit && !isSelecting && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpenses.map((expense, index) => (
                    <TableRow
                      key={expense.id}
                      onClick={(e) => handleRowClick(e, expense, index)}
                      className={
                        isSelecting
                          ? `cursor-pointer select-none ${
                              selectedIds.has(expense.id)
                                ? "bg-primary/10 hover:bg-primary/10"
                                : "hover:bg-muted/40"
                            }`
                          : ""
                      }
                    >
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {expense.item_description}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        {format(new Date(expense.date_spent), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatPeso(Number(expense.amount))}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {expense.note || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {expense.receipt_image_url ? (
                        <a
                            href={expense.receipt_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center text-primary hover:underline"
                         >
                            <ImageIcon className="w-4 h-4" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      {canEdit && !isSelecting && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditForm(expense)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setExpenseToDelete(expense)}
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 md:px-4 py-2 border-t bg-muted/40">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="px-3">
                  Prev
                </Button>
                <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))} className="px-3">
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
              setEditingExpense(null);
              setForm(emptyForm);
              setReceiptFile(null);
            }
          }}
        >
          <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
              <DialogDescription>
                Record what was purchased and attach a receipt as proof.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-1">Item / Description</p>
                <Input
                  value={form.item_description}
                  onChange={(e) => setForm((f) => ({ ...f, item_description: e.target.value }))}
                  placeholder="e.g. Sound system rental"
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Date Spent</p>
                <Input
                  type="date"
                  value={form.date_spent}
                  onChange={(e) => setForm((f) => ({ ...f, date_spent: e.target.value }))}
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Amount (₱)</p>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Note (optional)</p>
                <Textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Additional details"
                  rows={2}
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">
                  Receipt Image {editingExpense ? "" : "(required)"}
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
                {editingExpense?.receipt_image_url && !receiptFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    A receipt is already attached. Upload a new one to replace it.
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setFormOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? "Saving..." : editingExpense ? "Save changes" : "Add Expense"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirm */}
      {canEdit && (
        <Dialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete expense record?</DialogTitle>
              <DialogDescription>
                This record will be permanently deleted. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setExpenseToDelete(null)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => expenseToDelete && deleteMutation.mutate(expenseToDelete.id)}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ExpensesExportPreviewDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        rows={exportRows}
        total={totalExpenses}
      />
    </div>
  );
}