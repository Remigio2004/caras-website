import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface HeroContent {
  id: string;
  headline: string;
  subtext: string;
  background_url: string;
}

export default function HeroContentView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: heroContent, isLoading } = useQuery({
    queryKey: ["hero-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_content")
        .select("*")
        .single();

      if (error) throw error;
      return data as HeroContent;
    },
  });

  const updateHeroMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const updates = {
        headline: formData.get("headline") as string,
        subtext: formData.get("subtext") as string,
        background_url: formData.get("background_url") as string,
      };

      const { error } = await supabase
        .from("hero_content")
        .update(updates)
        .eq("id", heroContent!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      toast({ title: "Hero content updated successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateHeroMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-semibold">Hero Content Management</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                name="headline"
                required
                defaultValue={heroContent?.headline}
                placeholder="Main headline text"
              />
            </div>
            <div>
              <Label htmlFor="subtext">Subtext</Label>
              <Textarea
                id="subtext"
                name="subtext"
                required
                rows={4}
                defaultValue={heroContent?.subtext}
                placeholder="Supporting text"
              />
            </div>
            <div>
              <Label htmlFor="background_url">Background Image URL</Label>
              <Input
                id="background_url"
                name="background_url"
                type="url"
                required
                defaultValue={heroContent?.background_url}
                placeholder="https://..."
              />
            </div>
            <Button type="submit" className="w-full">
              Update Hero Content
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Preview</h3>
          <div className="relative aspect-video rounded-lg overflow-hidden">
            {heroContent?.background_url && (
              <img
                src={heroContent.background_url}
                alt="Hero background preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70 flex items-center justify-center">
              <div className="text-center px-4 text-white">
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                  {heroContent?.headline}
                </h1>
                <p className="text-sm md:text-base opacity-90">
                  {heroContent?.subtext}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
