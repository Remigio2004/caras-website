import { useState, useMemo, DragEvent } from "react";
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
import { Plus, Trash2, UploadCloud } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface GalleryImage {
  id?: string;
  image_url: string;
  alt_text: string;
  name?: string;
  created_at?: string;
  album?: string | null;
  album_description?: string | null;
}

const BUCKET = "gallery";

export default function GalleryView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
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

  // Helper: upload single file
  const uploadSingleImage = async (
    file: File,
    album: string,
    album_description: string
  ) => {
    const name = file.name.split(".").slice(0, -1).join(".") || "image";
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
      alt_text: name,
      name,
      album,
      album_description,
    };

    const { error: insertError } = await supabase
      .from("gallery")
      .insert(imageData);
    if (insertError) throw insertError;
  };

  // Normal form upload (multi-file)
  const createImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!isAdmin) throw new Error("Not authorized");

      const album = (formData.get("album") as string) || "General";
      const album_description =
        (formData.get("album_description") as string) || "";

      const files = formData.getAll("files") as File[];
      const singleFile = formData.get("file") as File | null;

      const uploadFiles: File[] = [];

      if (files && files.length > 0) {
        uploadFiles.push(...files);
      } else if (singleFile) {
        uploadFiles.push(singleFile);
      }

      if (!uploadFiles.length) throw new Error("No files provided");

      for (const file of uploadFiles) {
        await uploadSingleImage(file, album, album_description);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast({ title: "Images added successfully" });
      setIsDialogOpen(false);
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

  // Drag & drop upload for current album
  const dropUploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!isAdmin) throw new Error("Not authorized");
      if (!selectedAlbum) throw new Error("No album selected");

      const existing = allImages.find(
        (img) => (img.album || "General") === selectedAlbum
      );
      const album_description = existing?.album_description || "";

      for (const file of files) {
        await uploadSingleImage(file, selectedAlbum, album_description);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast({ title: "Images added to album" });
    },
    onError: (err) => {
      console.error("drop upload error:", err);
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

  const updateNameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!isAdmin) throw new Error("Not authorized");
      const trimmed = name.trim() || "Untitled image";

      const { error } = await supabase
        .from("gallery")
        .update({ name: trimmed })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      setEditingImageId(null);
      toast({ title: "Image name updated" });
    },
    onError: (err) => {
      console.error("update name error:", err);
      toast({
        title: "Update failed",
        description: String(err),
        variant: "destructive",
      });
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
    return combined.map((img) => ({
      ...img,
      album: img.album || "General",
    })) as GalleryImage[];
  }, [dbImages]);

  const albums = useMemo(() => {
    const map = new Map<string, GalleryImage>();
    for (const img of allImages) {
      const albumName = img.album || "General";
      if (!map.has(albumName)) {
        map.set(albumName, img);
      }
    }
    return Array.from(map.entries()).map(([name, cover]) => ({
      name,
      cover,
      count: allImages.filter((i) => (i.album || "General") === name).length,
      description: cover.album_description || "",
    }));
  }, [allImages]);

  const imagesInSelectedAlbum = useMemo(() => {
    if (!selectedAlbum) return [];
    return allImages.filter(
      (img) => (img.album || "General") === selectedAlbum
    );
  }, [allImages, selectedAlbum]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsDropping(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(false);
    if (!isAdmin || !selectedAlbum) return;

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (!files.length) {
      toast({
        title: "No images detected",
        description: "Please drop image files only.",
        variant: "destructive",
      });
      return;
    }
    dropUploadMutation.mutate(files);
  };

  const startEditingName = (image: GalleryImage) => {
    if (!isAdmin || !image.id) return;
    setEditingImageId(image.id);
    setEditingName(image.name || "");
  };

  const finishEditingName = () => {
    if (!editingImageId) return;
    updateNameMutation.mutate({ id: editingImageId, name: editingName });
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finishEditingName();
    } else if (e.key === "Escape") {
      setEditingImageId(null);
    }
  };

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
                Create Album
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Images</DialogTitle>
                <DialogDescription className="sr-only">
                  Upload images to an album
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="album">Album</Label>
                    <Input
                      id="album"
                      name="album"
                      placeholder="Album name"
                      defaultValue={selectedAlbum || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="album_description">Album description</Label>
                    <Input
                      id="album_description"
                      name="album_description"
                      placeholder="Short description for this album"
                    />
                  </div>
                </div>

                <div>
                  <Label>Upload images</Label>
                  <div className="mt-1 grid gap-2">
                    <Input
                      id="files"
                      name="files"
                      type="file"
                      accept="image/*"
                      multiple
                      className="cursor-pointer file:cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      You can select multiple images at once.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createImageMutation.isLoading}
                >
                  Add Images
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Albums list */}
      <div className="flex-1 flex flex-col">
        {isLoading && !dbImages ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Loading gallery...</p>
          </div>
        ) : !albums.length ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8 border-2 border-dashed rounded-lg w-full">
              <p className="text-muted-foreground">No albums yet</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {albums.map((album) => (
                <Dialog
                  key={album.name}
                  open={selectedAlbum === album.name}
                  onOpenChange={(open) =>
                    setSelectedAlbum(open ? album.name : null)
                  }
                >
                  <DialogTrigger asChild>
                    <button className="group text-left rounded-lg overflow-hidden border bg-card hover:shadow-lg transition flex flex-col h-full">
                      <div className="relative w-full aspect-[4/3] overflow-hidden">
                        {album.cover?.image_url && (
                          <img
                            src={album.cover.image_url}
                            alt={album.cover.alt_text}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex items-end">
                          <div className="p-3 w-full">
                            <p className="font-semibold text-white truncate">
                              {album.name}
                            </p>
                            <p className="text-xs text-white/80">
                              {album.count} photo
                              {album.count !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  </DialogTrigger>

                  <DialogContent className="max-w-5xl">
                    <DialogHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <DialogTitle>{album.name}</DialogTitle>
                        {album.description && (
                          <DialogDescription>
                            {album.description}
                          </DialogDescription>
                        )}
                        {!album.description && (
                          <DialogDescription>
                            {album.count} photo
                            {album.count !== 1 ? "s" : ""} in this album.
                          </DialogDescription>
                        )}
                      </div>

                      {isAdmin && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAlbum(album.name);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add images
                        </Button>
                      )}
                    </DialogHeader>

                    <div
                      className={`mt-4 max-h-[70vh] overflow-y-auto rounded-lg border border-dashed ${
                        isDropping
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {isAdmin && (
                        <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground border-b bg-muted/40">
                          <UploadCloud className="w-4 h-4" />
                          <span>
                            Drag & drop images here to add them to this album.
                          </span>
                        </div>
                      )}

                      <div className="p-3">
                        {imagesInSelectedAlbum.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No images in this album yet.
                          </p>
                        ) : (
                          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
                            {imagesInSelectedAlbum.map((image) => {
                              const isDb = Boolean(image.id);
                              const title = image.name || "Untitled image";
                              const isEditing =
                                editingImageId === image.id && isAdmin && isDb;

                              return (
                                <div
                                  key={image.id}
                                  className="mb-4 break-inside-avoid"
                                >
                                  <div className="relative w-full overflow-hidden rounded-lg">
                                    <img
                                      src={image.image_url}
                                      alt={image.alt_text}
                                      loading="lazy"
                                      className="w-full h-auto object-cover"
                                      title={title}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-end">
                                      <div className="w-full px-2 py-1 bg-black/40">
                                        {isEditing ? (
                                          <Input
                                            value={editingName}
                                            autoFocus
                                            onChange={(e) =>
                                              setEditingName(e.target.value)
                                            }
                                            onBlur={finishEditingName}
                                            onKeyDown={handleNameKeyDown}
                                            className="h-7 text-xs text-white bg-black/40 border-white/40"
                                          />
                                        ) : (
                                          <p
                                            className="w-full text-xs text-white/90 line-clamp-2 cursor-text"
                                            onDoubleClick={() =>
                                              startEditingName(image)
                                            }
                                            title="Double-click to edit name"
                                          >
                                            {title}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {isAdmin && isDb && (
                                    <div className="flex justify-end mt-1">
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          image.id &&
                                          deleteImageMutation.mutate(
                                            image.id as string
                                          )
                                        }
                                        disabled={deleteImageMutation.isLoading}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
