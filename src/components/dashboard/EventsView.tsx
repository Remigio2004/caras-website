import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  date: string;
  summary: string | null;
  banner_url: string | null;
  narrative_image_url: string | null;
  featured: boolean;
  narrative: string | null;
  created_at: string;
}

export default function EventsView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const eventData = {
        title: formData.get("title") as string,
        date: formData.get("date") as string,
        summary: (formData.get("summary") as string) || null,
        banner_url: (formData.get("banner_url") as string) || null,
        narrative_image_url:
          (formData.get("narrative_image_url") as string) || null,
        featured: formData.get("featured") === "true",
        narrative: (formData.get("narrative") as string) || null,
      };

      const { error } = await supabase.from("events").insert(eventData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event created successfully" });
      setIsDialogOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Failed to create event",
        description: String(err),
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Event> }) => {
      const { error } = await supabase.from("events").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event updated successfully" });
      setEditingEvent(null);
      setIsDialogOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Failed to update event",
        description: String(err),
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event deleted successfully" });
    },
    onError: (err) => {
      toast({
        title: "Failed to delete event",
        description: String(err),
        variant: "destructive",
      });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase
        .from("events")
        .update({ featured })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err) => {
      toast({
        title: "Failed to toggle featured",
        description: String(err),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const featuredChecked =
      (e.currentTarget.elements.namedItem("featured") as HTMLInputElement)
        ?.checked ?? false;
    formData.set("featured", featuredChecked ? "true" : "false");

    if (editingEvent) {
      updateEventMutation.mutate({
        id: editingEvent.id,
        data: {
          title: formData.get("title") as string,
          date: formData.get("date") as string,
          summary: (formData.get("summary") as string) || null,
          banner_url: (formData.get("banner_url") as string) || null,
          narrative_image_url:
            (formData.get("narrative_image_url") as string) || null,
          featured: formData.get("featured") === "true",
          narrative: (formData.get("narrative") as string) || null,
        },
      });
    } else {
      createEventMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-semibold">
          Events Management
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingEvent(null);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl w-full">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Edit Event" : "Create New Event"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      defaultValue={editingEvent?.title}
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      required
                      defaultValue={
                        editingEvent?.date
                          ? editingEvent.date.slice(0, 10)
                          : undefined
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      name="summary"
                      rows={3}
                      placeholder="Short summary shown in the events list"
                      defaultValue={editingEvent?.summary || ""}
                    />
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="banner_url">Banner URL</Label>
                    <Input
                      id="banner_url"
                      name="banner_url"
                      type="url"
                      placeholder="https://..."
                      defaultValue={editingEvent?.banner_url || ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor="narrative_image_url">
                      Narrative Image URL
                    </Label>
                    <Input
                      id="narrative_image_url"
                      name="narrative_image_url"
                      type="url"
                      placeholder="https://..."
                      defaultValue={editingEvent?.narrative_image_url || ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor="narrative">Narrative Report</Label>
                    <Textarea
                      id="narrative"
                      name="narrative"
                      rows={5}
                      placeholder="Full narrative for this event."
                      defaultValue={editingEvent?.narrative || ""}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Switch
                      id="featured"
                      name="featured"
                      defaultChecked={editingEvent?.featured}
                    />
                    <Label htmlFor="featured">Featured Event</Label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingEvent ? "Update Event" : "Create Event"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading events...</div>
      ) : !events || events.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No events yet</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    {format(new Date(event.date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() =>
                        toggleFeaturedMutation.mutate({
                          id: event.id,
                          featured: !event.featured,
                        })
                      }
                    >
                      <Star
                        className={`w-5 h-5 ${
                          event.featured
                            ? "fill-accent text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingEvent(event);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete event “{event.title}”?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this event and its
                            details. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteEventMutation.mutate(event.id)}
                            disabled={deleteEventMutation.isLoading}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
