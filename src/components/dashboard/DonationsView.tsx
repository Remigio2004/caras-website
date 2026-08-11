import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import DonationsExportPreviewDialog from "./DonationsExportPreviewDialog";
import type { DonationExportRow } from "./DonationsPrintLayout";

interface Donation {
  id: string;
  donor_name: string | null;
  is_anonymous: boolean;
  amount: number;
  date_received: string;
  note: string | null;
  proof_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  donor_name: "",
  is_anonymous: false,
  date_received: "",
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

async function uploadProofImage(file: File): Promise<string> {
  const name = file.name.split(".").slice(0, -1).join(".") || "proof";
  const safeName = name.replace(/[^a-zA-Z0-9-_]/g, "_");

  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string
  );
  formData.append("folder", "caras-finance/donations");
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

export default function DonationsView() {
  const { user } = useAuth();
  const canEdit = user?.role === "treasurer";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [donationToDelete, setDonationToDelete] = useState<Donation | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const { data: donations, isLoading } = useQuery({
    queryKey: ["donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("date_received", { ascending: false });
      if (error) throw error;
      return (data || []) as Donation[];
    },
  });

  const filteredDonations = useMemo(() => {
    let rows = donations || [];
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      rows = rows.filter((d) =>
        (d.is_anonymous ? "anonymous" : d.donor_name || "")
          .toLowerCase()
          .includes(term)
      );
    }
    return rows;
  }, [donations, searchTerm]);

  const totalDonations = useMemo(
    () => (donations || []).reduce((sum, d) => sum + Number(d.amount), 0),
    [donations]
  );

  // Full, unfiltered list used for the PDF export — exports everything,
  // not just the current search filter.
  const exportRows: DonationExportRow[] = useMemo(
    () =>
      (donations || []).map((d) => ({
        id: d.id,
        donor_display: d.is_anonymous ? "Anonymous" : d.donor_name || "—",
        date_received: d.date_received,
        amount: Number(d.amount),
        note: d.note,
      })),
    [donations]
  );

  const totalPages = Math.max(1, Math.ceil(filteredDonations.length / PAGE_SIZE));
  const paginatedDonations = filteredDonations.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  const invalidateDonations = () => {
    queryClient.invalidateQueries({ queryKey: ["donations"] });
    queryClient.invalidateQueries({ queryKey: ["treasurer-stats"] });
  };

  const addMutation = useMutation({
    mutationFn: async (payload: typeof emptyForm & { file: File | null }) => {
      if (!canEdit) throw new Error("Not authorized");
      let proof_image_url: string | null = null;
      if (payload.file) {
        proof_image_url = await uploadProofImage(payload.file);
      }
      const { error } = await supabase.from("donations").insert({
        donor_name: payload.is_anonymous ? null : payload.donor_name.trim() || null,
        is_anonymous: payload.is_anonymous,
        amount: Number(payload.amount) || 0,
        date_received: new Date(payload.date_received).toISOString(),
        note: payload.note.trim() || null,
        proof_image_url,
        created_by: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateDonations();
      toast({ title: "Donation added" });
      setFormOpen(false);
      setForm(emptyForm);
      setProofFile(null);
    },
    onError: (err) => {
      console.error("add donation error:", err);
      toast({
        title: "Failed to add donation",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (
      payload: { id: string; existingProofUrl: string | null } & typeof emptyForm & {
        file: File | null;
      }
    ) => {
      if (!canEdit) throw new Error("Not authorized");
      let proof_image_url = payload.existingProofUrl;
      if (payload.file) {
        proof_image_url = await uploadProofImage(payload.file);
      }
      const { error } = await supabase
        .from("donations")
        .update({
          donor_name: payload.is_anonymous ? null : payload.donor_name.trim() || null,
          is_anonymous: payload.is_anonymous,
          amount: Number(payload.amount) || 0,
          date_received: new Date(payload.date_received).toISOString(),
          note: payload.note.trim() || null,
          proof_image_url,
        })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateDonations();
      toast({ title: "Donation updated" });
      setEditingDonation(null);
      setForm(emptyForm);
      setProofFile(null);
      setFormOpen(false);
    },
    onError: (err) => {
      console.error("update donation error:", err);
      toast({
        title: "Failed to update donation",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!canEdit) throw new Error("Not authorized");
      const { error } = await supabase.from("donations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateDonations();
      toast({ title: "Donation deleted" });
      setDonationToDelete(null);
    },
    onError: (err) => {
      console.error("delete donation error:", err);
      toast({
        title: "Failed to delete donation",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Delete several selected donation rows at once.
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!canEdit) throw new Error("Not authorized");
      if (!ids.length) throw new Error("No rows selected");
      const { error } = await supabase.from("donations").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      invalidateDonations();
      toast({
        title: `${ids.length} record${ids.length !== 1 ? "s" : ""} deleted`,
      });
      setSelectedIds(new Set());
      setIsSelecting(false);
    },
    onError: (err) => {
      console.error("bulk delete donations error:", err);
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
        description: "Wala pang donation records na ma-e-export.",
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
    donation: Donation,
    index: number
  ) => {
    if (!isSelecting || !canEdit) return;

    if (e.shiftKey && lastSelectedId) {
      const anchorIndex = paginatedDonations.findIndex(
        (d) => d.id === lastSelectedId
      );
      if (anchorIndex !== -1) {
        const [start, end] =
          anchorIndex < index ? [anchorIndex, index] : [index, anchorIndex];
        const rangeIds = paginatedDonations
          .slice(start, end + 1)
          .map((d) => d.id);
        setSelectedIds(new Set(rangeIds));
        return;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(donation.id)) next.delete(donation.id);
        else next.add(donation.id);
        return next;
      });
      setLastSelectedId(donation.id);
      return;
    }

    setSelectedIds(new Set([donation.id]));
    setLastSelectedId(donation.id);
  };

  // Ctrl/Cmd+A selects every donation across ALL pages; Esc exits selection mode.
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
        setSelectedIds(new Set(filteredDonations.map((d) => d.id)));
      }
      if (e.key === "Escape") {
        setIsSelecting(false);
        setSelectedIds(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelecting, canEdit, filteredDonations]);

  const openAddForm = () => {
    setForm({ ...emptyForm, date_received: toDateInputValue(new Date().toISOString()) });
    setProofFile(null);
    setEditingDonation(null);
    setFormOpen(true);
  };

  const openEditForm = (donation: Donation) => {
    setForm({
      donor_name: donation.donor_name || "",
      is_anonymous: donation.is_anonymous,
      date_received: toDateInputValue(donation.date_received),
      amount: String(donation.amount),
      note: donation.note || "",
    });
    setProofFile(null);
    setEditingDonation(donation);
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.is_anonymous && !form.donor_name.trim()) {
      toast({
        title: "Missing info",
        description: "Ilagay ang pangalan ng donor o markahan bilang Anonymous.",
        variant: "destructive",
      });
      return;
    }
    if (!form.date_received) {
      toast({
        title: "Missing info",
        description: "Petsa ng donation ay required.",
        variant: "destructive",
      });
      return;
    }
    if (editingDonation) {
      updateMutation.mutate({
        id: editingDonation.id,
        existingProofUrl: editingDonation.proof_image_url,
        file: proofFile,
        ...form,
      });
    } else {
      addMutation.mutate({ file: proofFile, ...form });
    }
  };

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Donations</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {(donations || []).length} total records • {formatPeso(totalDonations)} total received
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search donor"
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
                  Add Donation
                </DropdownMenuItem>
                {(donations || []).length > 0 && (
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
                  : "I-click ang mga donation (Shift/Ctrl para sa multiple, Ctrl+A para lahat)"}
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
                      Permanenteng mabubura ang mga donation record na ito.
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
          <div className="p-8 text-center text-muted-foreground text-sm">Loading donations...</div>
        ) : filteredDonations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No donation records found</div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-center">Proof</TableHead>
                    {canEdit && !isSelecting && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDonations.map((donation, index) => (
                    <TableRow
                      key={donation.id}
                      onClick={(e) => handleRowClick(e, donation, index)}
                      className={
                        isSelecting
                          ? `cursor-pointer select-none ${
                              selectedIds.has(donation.id)
                                ? "bg-primary/10 hover:bg-primary/10"
                                : "hover:bg-muted/40"
                            }`
                          : ""
                      }
                    >
                      <TableCell className="font-medium">
                        {donation.is_anonymous ? "Anonymous" : donation.donor_name || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        {format(new Date(donation.date_received), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatPeso(Number(donation.amount))}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {donation.note || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {donation.proof_image_url ? (
                          <a
                            href={donation.proof_image_url}
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
                              <DropdownMenuItem onClick={() => openEditForm(donation)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDonationToDelete(donation)}
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
              setEditingDonation(null);
              setForm(emptyForm);
              setProofFile(null);
            }
          }}
        >
          <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDonation ? "Edit Donation" : "Add Donation"}</DialogTitle>
              <DialogDescription>
                Record a donation received. Pwedeng markahan bilang Anonymous kung walang gustong ipangalan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_anonymous"
                  checked={form.is_anonymous}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, is_anonymous: checked === true }))
                  }
                />
                <Label htmlFor="is_anonymous" className="text-sm font-normal cursor-pointer">
                  Anonymous donor
                </Label>
              </div>
              {!form.is_anonymous && (
                <div>
                  <p className="text-xs font-medium mb-1">Donor Name</p>
                  <Input
                    value={form.donor_name}
                    onChange={(e) => setForm((f) => ({ ...f, donor_name: e.target.value }))}
                    placeholder="Pangalan ng donor"
                  />
                </div>
              )}
              <div>
                <p className="text-xs font-medium mb-1">Date Received</p>
                <Input
                  type="date"
                  value={form.date_received}
                  onChange={(e) => setForm((f) => ({ ...f, date_received: e.target.value }))}
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
                  placeholder="Layunin o karagdagang detalye"
                  rows={2}
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Proof Image (optional)</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
                {editingDonation?.proof_image_url && !proofFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    May existing image na. Mag-upload ng bago para palitan.
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setFormOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? "Saving..." : editingDonation ? "Save changes" : "Add Donation"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirm */}
      {canEdit && (
        <Dialog open={!!donationToDelete} onOpenChange={() => setDonationToDelete(null)}>
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete donation record?</DialogTitle>
              <DialogDescription>
                Permanenteng mabubura ang record na ito. Hindi na ito mababawi.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDonationToDelete(null)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => donationToDelete && deleteMutation.mutate(donationToDelete.id)}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <DonationsExportPreviewDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        rows={exportRows}
        total={totalDonations}
      />
    </div>
  );
}