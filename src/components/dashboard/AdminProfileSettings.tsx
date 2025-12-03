import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AdminProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function AdminProfileSettings() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin-profile", user?.id],
    enabled: !!user && !authLoading,
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!data) {
        const { error: insertError } = await supabase
          .from("admin_profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: "",
            avatar_url: "",
            bio: "",
          });

        if (insertError) throw insertError;

        const { data: newData, error: fetchError } = await supabase
          .from("admin_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        return newData as AdminProfile;
      }

      if (error) throw error;
      return data as AdminProfile;
    },
  });

  const combinedMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user) throw new Error("Not authenticated");

      // profile fields
      const full_name = (formData.get("full_name") as string) || "";
      const avatar_url = (formData.get("avatar_url") as string) || "";
      const bio = (formData.get("bio") as string) || "";

      // password fields (optional)
      const newPassword = (formData.get("new_password") as string) || "";
      const confirmPassword =
        (formData.get("confirm_password") as string) || "";

      // 1) update profile
      const { error: profileError } = await supabase
        .from("admin_profiles")
        .update({ full_name, avatar_url, bio })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 2) update password only if filled
      if (newPassword || confirmPassword) {
        if (!newPassword || newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        if (newPassword !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const { error: pwError } = await supabase.auth.updateUser({
          password: newPassword,
        }); // change password for current user [web:80]

        if (pwError) throw pwError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profile", user?.id] });
      toast({ title: "Profile and password updated successfully" });
    },
    onError: (err) => {
      console.error("combined update error:", err);
      toast({
        title: "Update failed",
        description: String(err),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    combinedMutation.mutate(formData);
  };

  if (authLoading || isLoading || !profile) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">
          Admin Profile Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Update your personal information and password for your admin account.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview */}
        <Card className="p-6 flex flex-col items-center text-center gap-2">
          <h3 className="font-semibold mb-2">Preview</h3>
          <div className="w-[150px] h-[150px] rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? "Avatar"}
                className="w-auto h-auto object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold">
                {profile.full_name?.charAt(0).toUpperCase() ??
                  user?.email?.charAt(0).toUpperCase() ??
                  "A"}
              </span>
            )}
          </div>
          <div className="mt-[-10px]">
            <p className="font-semibold text-lg">
              {profile.full_name || "Your Name"}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.email || profile.email}
            </p>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            {profile.bio || "Your bio will appear here."}
          </p>
        </Card>

        {/* Combined profile + password form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Name</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={profile.full_name ?? ""}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email (from account)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={user?.email || profile.email || ""}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email is managed via authentication and cannot be changed here.
              </p>
            </div>
            <div>
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                name="avatar_url"
                type="url"
                defaultValue={profile.avatar_url ?? ""}
                placeholder="https://your-avatar-url.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use a square image for best results (e.g. 400×400).
              </p>
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                rows={2}
                defaultValue={profile.bio ?? ""}
                placeholder="Short description about you"
              />
            </div>

            <div className="pt-2 border-t">
              <h3 className="font-semibold mb-2 text-sm">
                Change Password (optional)
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="new_password">New password</Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm_password">Confirm password</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Leave password fields blank if you do not want to change it.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={combinedMutation.isLoading}
            >
              Save Changes
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
