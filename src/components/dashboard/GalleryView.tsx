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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface GalleryImage {
  id?: string;
  image_url: string;
  alt_text: string;
  category?: string;
  created_at?: string;
}

// local images same as public Gallery
const localImages = Object.entries(
  import.meta.glob("/src/assets/gallery/**/*.{jpg,jpeg,png}", {
    eager: true,
  })
).map(([path, file]: any) => {
  const parts = path.split("/");
  const fullFileName = parts[parts.length - 1];
  const fileName = fullFileName.replace(/\.[^/.]+$/, "");

  return {
    image_url: file.default as string,
    alt_text: fileName,
  } satisfies GalleryImage;
});

const categories = ["Liturgy", "Community", "Youth", "Special Events"];
const PAGE_SIZE = 6;

export default function GalleryView() {
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
      const imageData = {
        image_url: formData.get("image_url") as string,
        alt_text: formData.get("alt_text") as string,
        category: formData.get("category") as string,
      };
      const { error } = await supabase.from("gallery").insert(imageData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast({ title: "Image added successfully" });
      setIsDialogOpen(false);
      setPage(0);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
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
    const formData = new FormData(e.currentTarget);
    createImageMutation.mutate(formData);
  };

  // combine local + db
  const allImages = useMemo(
    () => [...localImages, ...(dbImages || [])],
    [dbImages]
  );

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
        <h2 className="text-2xl font-display font-semibold">
          Gallery Management
        </h2>
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
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  required
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="alt_text">Alt Text</Label>
                <Input
                  id="alt_text"
                  name="alt_text"
                  required
                  placeholder="Describe the image"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select name="category" required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            {/* Images wrapper -> inner Pinterest layout; pagination stays fixed */}
            <div className="flex-1 flex items-stretch overflow-hidden">
              <div className="w-full mt-2">
                <div className="h-full overflow-hidden">
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
                    {pageImages.map((image, idx) => {
                      const isDb = Boolean(image.id);
                      return (
                        <Dialog key={image.id ?? `local-${idx}`}>
                          <DialogTrigger asChild>
                            <div className="mb-4 break-inside-avoid cursor-pointer">
                              <div className="relative w-full overflow-hidden rounded-lg">
                                <img
                                  src={image.image_url}
                                  alt={image.alt_text}
                                  loading="lazy"
                                  className="w-full h-auto object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-end">
                                  <p className="w-full text-xs text-white/90 px-2 py-1 bg-black/40 line-clamp-2">
                                    {image.alt_text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>{image.alt_text}</DialogTitle>
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
                                {isDb && (
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

            {/* Fixed footer for pagination */}
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
