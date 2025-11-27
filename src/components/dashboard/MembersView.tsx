import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Phone, Download } from "lucide-react";
import { format } from "date-fns";

interface Member {
  id: string;
  full_name: string;
  birthday: string;
  age: number;
  address: string;
  guardian: string;
  contact_number: string;
  batch: string | null;
  created_at: string;
}

export default function MembersView() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Member[];
    },
  });

  const filteredMembers =
    members?.filter((member) => {
      const term = searchTerm.toLowerCase();
      return (
        member.full_name.toLowerCase().includes(term) ||
        member.contact_number.toLowerCase().includes(term) ||
        (member.batch || "").toLowerCase().includes(term)
      );
    }) || [];

  const exportToCSV = () => {
    if (!filteredMembers || filteredMembers.length === 0) return;

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

    const rows = filteredMembers.map((m) => [
      m.full_name,
      m.birthday,
      m.age,
      m.address,
      m.guardian,
      m.contact_number,
      m.batch || "",
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

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">
            {filteredMembers.length} total members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, contact, batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading members...</div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No members found
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {member.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    {member.full_name}
                  </TableCell>
                  <TableCell>{member.age}</TableCell>
                  <TableCell className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {member.contact_number}
                  </TableCell>
                  <TableCell>{member.batch || "N/A"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {member.address}
                  </TableCell>
                  <TableCell>{member.guardian}</TableCell>
                  <TableCell>
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
