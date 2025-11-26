import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Mail, Phone } from "lucide-react";

interface Member {
  id: string;
  name: string;
  age: number;
  contact: string;
  created_at: string;
}

export default function MembersView() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_applications")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Member[];
    },
  });

  const filteredMembers = members?.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-semibold">Members</h2>
        <p className="text-muted-foreground">
          {filteredMembers?.length || 0} total members
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading members...</div>
      ) : !filteredMembers || filteredMembers.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No members found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="p-6 hover:border-accent transition-colors">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12 bg-accent">
                  <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                    {member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">Age: {member.age}</p>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span className="truncate">{member.contact}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
