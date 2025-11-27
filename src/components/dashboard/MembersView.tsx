import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Search, Phone, Download, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  full_name: string;
  birthday: string;
  age: number;
  address: string;
  guardian: string;
  contact_number: string;
  batch: number;
  created_at: string;
}

const PAGE_SIZE = 10;

export default function MembersView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<Omit<Member, "id" | "created_at">>({
    full_name: "",
    birthday: "",
    age: 0,
    address: "",
    guardian: "",
    contact_number: "",
    batch: 0,
  });
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["members", page, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("members")
        .select("*", { count: "exact" })
        .order("batch", { ascending: true })
        .order("full_name", { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;

        query = query.or(
          `full_name.ilike.${term},address.ilike.${term},contact_number.ilike.${term}`
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data as Member[], total: count ?? 0 };
    },
    keepPreviousData: true,
  });

  const members = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({
        queryKey: ["members-for-applications"],
      });
      toast({ title: "Deleted", description: "Member removed." });
      setMemberToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete member.",
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (
      payload: { id: string } & Omit<Member, "created_at">
    ) => {
      const { id, ...rest } = payload;
      const { error } = await supabase
        .from("members")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({
        queryKey: ["members-for-applications"],
      });
      toast({ title: "Updated", description: "Member information updated." });
      setSelectedMember(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update member.",
        variant: "destructive",
      });
    },
  });

  const exportToCSV = () => {
    if (!members || members.length === 0) return;

    const headers = [
      "Full Name",
      "Birthday",
      "Age",
      "Address",
      "Guardian",
      "Contact Number",
      "Batch",
      "Joined",
    ];

    const rows = members.map((m) => [
      m.full_name,
      m.birthday,
      m.age,
      m.address,
      m.guardian,
      m.contact_number,
      m.batch,
      format(new Date(m.created_at), "yyyy-MM-dd"),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const handleOpenDetails = (member: Member) => {
    setSelectedMember(member);
    setEditForm({
      full_name: member.full_name,
      birthday: member.birthday,
      age: member.age,
      address: member.address,
      guardian: member.guardian,
      contact_number: member.contact_number,
      batch: member.batch,
    });
  };

  const handleSave = () => {
    if (!selectedMember) return;
    if (
      Number.isNaN(Number(editForm.age)) ||
      Number.isNaN(Number(editForm.batch))
    ) {
      toast({
        title: "Invalid input",
        description: "Age and batch must be numbers.",
        variant: "destructive",
      });
      return;
    }
    updateMemberMutation.mutate({
      id: selectedMember.id,
      full_name: editForm.full_name,
      birthday: editForm.birthday,
      age: Number(editForm.age),
      address: editForm.address,
      guardian: editForm.guardian,
      contact_number: editForm.contact_number,
      batch: Number(editForm.batch),
    });
  };

  return (
    <div className="p-6 space-y-4 h-[90vh] flex flex-col">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">{total} total members</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => {
                setPage(0);
                setSearchTerm(e.target.value);
              }}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden border rounded-lg bg-card flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No members found
          </div>
        ) : (
          <>
            <div className="max-h-[calc(90vh-220px)] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Birthday</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.full_name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(member.birthday), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{member.age}</TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {member.address}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {member.contact_number}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(member)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setMemberToDelete(member)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/40">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
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
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit member dialog */}
      <Dialog
        open={!!selectedMember}
        onOpenChange={() => setSelectedMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member information and save changes.
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium">Full Name</p>
                <Input
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium">Birthday</p>
                  <Input
                    value={editForm.birthday}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, birthday: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <p className="text-xs font-medium">Age</p>
                  <Input
                    type="number"
                    value={editForm.age}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        age: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium">Address</p>
                <Input
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </div>
              <div>
                <p className="text-xs font-medium">Guardian</p>
                <Input
                  value={editForm.guardian}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, guardian: e.target.value }))
                  }
                />
              </div>
              <div>
                <p className="text-xs font-medium">Contact Number</p>
                <Input
                  value={editForm.contact_number}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      contact_number: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <p className="text-xs font-medium">Batch</p>
                <Input
                  type="number"
                  value={editForm.batch}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      batch: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMember(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMemberMutation.isLoading}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog
        open={!!memberToDelete}
        onOpenChange={() => setMemberToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete member</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to permanently
              delete{" "}
              <span className="font-semibold">{memberToDelete?.full_name}</span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setMemberToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                memberToDelete && deleteMutation.mutate(memberToDelete.id)
              }
              disabled={deleteMutation.isLoading}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
