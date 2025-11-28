import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // adjust path if different

interface GalleryImage {
  id?: string;
  image_url: string;
  alt_text: string; // description
  name?: string; // image name field
  created_at?: string;
}

const PAGE_SIZE = 6;
const BUCKET = "gallery";

export default function GalleryView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dbImages, isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as GalleryImage[];
    },
  });

  const createImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!isAdmin) throw new Error("Not authorized");

      const file = formData.get("file") as File | null;
      const name = (formData.get("file_name") as string) || "image";
      const description = (formData.get("description") as string) || name;

      if (!file) throw new Error("No file provided");

      const ext = file.name.split(".").pop();
      const safeName = name.replace(/[^a-zA-Z0-9-_]/g, "_");
      const path = `uploads/${Date.now()}-${safeName}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const imageData = {
        image_url: publicUrl,
        alt_text: description, // description
        name, // image name field
      };

      const { error: insertError } = await supabase
        .from("gallery")
        .insert(imageData);
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast({ title: "Image added successfully" });
      setIsDialogOpen(false);
      setPage(0);
    },
    onError: (err) => {
      console.error("createImage error:", err);
      toast({
        title: "Upload failed",
        description: String(err),
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isAdmin) throw new Error("Not authorized");

      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast({ title: "Image deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        title: "Not allowed",
        description: "Only admins can upload images.",
        variant: "destructive",
      });
      return;
    }
    const formData = new FormData(e.currentTarget);
    createImageMutation.mutate(formData);
  };

  const allImages = useMemo(() => {
    const combined = dbImages || [];
    return combined
      .map((img) => ({ img, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ img }) => img) as GalleryImage[];
  }, [dbImages]);

  const total = allImages.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageImages = allImages.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div className="h-auto flex flex-col space-y-4">
      {/* Header + Add image */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-display font-semibold">
            Gallery Management
          </h2>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">
              View only – only admins can upload or delete images.
            </p>
          )}
        </div>

        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Image</DialogTitle>
                <DialogDescription className="sr-only">
                  Upload a new image to the gallery
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="file_name">Name</Label>
                  <Input
                    id="file_name"
                    name="file_name"
                    placeholder="Image name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Short description for this image"
                  />
                </div>
                <div>
                  <Label htmlFor="file">Upload file</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept="image/*"
                    required
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createImageMutation.isLoading}
                >
                  Add Image
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Main content + fixed footer */}
      <div className="flex-1 flex flex-col">
        {isLoading && !dbImages ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Loading gallery...</p>
          </div>
        ) : total === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8 border-2 border-dashed rounded-lg w-full">
              <p className="text-muted-foreground">No images in gallery</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-stretch overflow-hidden">
              <div className="w-full mt-2">
                <div className="h-full overflow-hidden">
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
                    {pageImages.map((image, idx) => {
                      const isDb = Boolean(image.id);
                      const title = image.name || "Untitled image";
                      return (
                        <Dialog key={image.id ?? `db-${idx}`}>
                          <DialogTrigger asChild>
                            <div className="mb-4 break-inside-avoid cursor-pointer">
                              <div className="relative w-full overflow-hidden rounded-lg">
                                <img
                                  src={image.image_url}
                                  alt={image.alt_text}
                                  loading="lazy"
                                  className="w-full h-auto object-cover"
                                  title={title} // tooltip (hover title)
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-end">
                                  <p className="w-full text-xs text-white/90 px-2 py-1 bg-black/40 line-clamp-2">
                                    {title}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>{title}</DialogTitle>
                              <DialogDescription className="sr-only">
                                Image preview dialog
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                              <img
                                src={image.image_url}
                                alt={image.alt_text}
                                className="w-full h-auto rounded-lg"
                              />
                              <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">
                                  {image.alt_text}
                                </p>
                                {isAdmin && isDb && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      image.id &&
                                      deleteImageMutation.mutate(
                                        image.id as string
                                      )
                                    }
                                    disabled={deleteImageMutation.isLoading}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-3 mt-2">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={page + 1 >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
