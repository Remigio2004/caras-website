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
import { Plus, Edit, Trash2, Star, X } from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  date: string;
  summary: string | null;
  banner_url: string | null;
  narrative_image_url: string | null;
  narrative_images: string[] | null;
  photo_credit: string | null;
  featured: boolean;
  narrative: string | null;
  created_at: string;
}

const PAGE_SIZE = 5;

// Every event now uses the same fixed banner image — no longer editable
// per event.
const STATIC_BANNER_URL =
  "https://djhvuzznfszzwckybkqa.supabase.co/storage/v1/object/public/gallery/uploads/hero-img%20-%20Copy.jpg";

export default function EventsView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [narrativeImages, setNarrativeImages] = useState<string[]>([""]);
  const [page, setPage] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["events", page],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("events")
        .select("*", { count: "exact" })
        .order("date", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: data as Event[], total: count ?? 0 };
    },
    keepPreviousData: true,
  });

  const events = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const createEventMutation = useMutation({
    mutationFn: async ({
      formData,
      images,
    }: {
      formData: FormData;
      images: string[];
    }) => {
      const eventData = {
        title: formData.get("title") as string,
        date: formData.get("date") as string,
        summary: (formData.get("summary") as string) || null,
        banner_url: STATIC_BANNER_URL,
        narrative_images: images,
        photo_credit: (formData.get("photo_credit") as string) || null,
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

    const filteredImages = narrativeImages
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (editingEvent) {
      updateEventMutation.mutate({
        id: editingEvent.id,
        data: {
          title: formData.get("title") as string,
          date: formData.get("date") as string,
          summary: (formData.get("summary") as string) || null,
          banner_url: STATIC_BANNER_URL,
          narrative_images: filteredImages,
          photo_credit: (formData.get("photo_credit") as string) || null,
          featured: formData.get("featured") === "true",
          narrative: (formData.get("narrative") as string) || null,
        },
      });
    } else {
      createEventMutation.mutate({ formData, images: filteredImages });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold">
            Events Management
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {total} total events
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingEvent(null);
                setNarrativeImages([""]);
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
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="photo_credit">Photo Credit</Label>
                    <Input
                      id="photo_credit"
                      name="photo_credit"
                      placeholder="e.g. Photo by Juan Dela Cruz"
                      defaultValue={editingEvent?.photo_credit || ""}
                    />
                  </div>

                  <div>
                    <Label>Narrative Images</Label>
                    <div className="space-y-2">
                      {narrativeImages.map((url, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="url"
                            placeholder="https://..."
                            value={url}
                            onChange={(e) => {
                              const updated = [...narrativeImages];
                              updated[index] = e.target.value;
                              setNarrativeImages(updated);
                            }}
                          />
                          {narrativeImages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setNarrativeImages(
                                  narrativeImages.filter((_, i) => i !== index)
                                );
                              }}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        setNarrativeImages([...narrativeImages, ""])
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Image
                    </Button>
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
      ) : events.length === 0 ? (
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
                        setNarrativeImages(
                          event.narrative_images &&
                            event.narrative_images.length > 0
                            ? event.narrative_images
                            : event.narrative_image_url
                            ? [event.narrative_image_url]
                            : [""]
                        );
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

          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/40">
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
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
        </div>
      )}
    </div>
  );
}
