import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  name?: string;
  created_at: string;
  album?: string | null;
}

const PAGE_SIZE = 12;

export default function Gallery() {
  const [page, setPage] = useState(0);
  const [selectedAlbum, setSelectedAlbum] = useState<string>("Bible Verse");

  const { data: dbImages, isLoading } = useQuery({
    queryKey: ["public-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as GalleryImage[];
    },
  });

  const scrollToGallery = () => {
    document
      .getElementById("gallery")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // normalize + randomize images
  const allImages = useMemo(() => {
    const combined = dbImages || [];
    return combined
      .map((img) => ({
        ...img,
        album: img.album || "General",
      }))
      .map((img) => ({ img, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ img }) => img) as GalleryImage[];
  }, [dbImages]);

  // get list of albums for dropdown
  const albumOptions = useMemo(() => {
    const set = new Set<string>();
    allImages.forEach((img) => set.add(img.album || "General"));
    return ["All", ...Array.from(set).sort()];
  }, [allImages]);

  // apply album filter
  const filteredImages = useMemo(() => {
    if (selectedAlbum === "All") return allImages;
    return allImages.filter(
      (img) => (img.album || "General") === selectedAlbum
    );
  }, [allImages, selectedAlbum]);

  const totalPages = Math.max(1, Math.ceil(filteredImages.length / PAGE_SIZE));

  const pageImages = filteredImages.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  const handlePrevClick = () => {
    setPage((p) => Math.max(p - 1, 0));
    setTimeout(scrollToGallery, 50);
  };

  const handleNextClick = () => {
    setPage((p) => Math.min(p + 1, totalPages - 1));
    setTimeout(scrollToGallery, 50);
  };

  const handleAlbumChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAlbum(e.target.value);
    setPage(0);
  };

  return (
    <section id="gallery" className="py-20 overflow-y-hidden">
      <div className="container">
        {/* Title + album filter */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-3xl font-display">Gallery</h2>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Album:</span>
            <select
              value={selectedAlbum}
              onChange={handleAlbumChange}
              className="border rounded-md px-3 py-1 text-sm bg-background"
            >
              {albumOptions.map((album) => (
                <option key={album} value={album}>
                  {album}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && !dbImages ? (
          <div className="mt-8 text-center text-muted-foreground">
            Loading gallery...
          </div>
        ) : !filteredImages || filteredImages.length === 0 ? (
          <div className="mt-8 text-center text-muted-foreground">
            No images in gallery
          </div>
        ) : (
          <>
            {/* Images */}
            <div className="mt-6 columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
              <div className="grid gap-4">
                {pageImages.map((img, index) => {
                  const title = img.name || "Untitled image";
                  return (
                    <Dialog key={img.id ?? index}>
                      <DialogTrigger asChild>
                        <div className="relative w-full overflow-hidden rounded-lg cursor-pointer">
                          <img
                            src={img.image_url}
                            alt={img.alt_text}
                            loading="lazy"
                            className="w-full rounded-lg border shadow-sm hover:scale-[1.02] transition"
                            title={title}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-end">
                            <p className="w-full text-xs text-white/90 px-2 py-1 bg-black/40 line-clamp-2">
                              {title}
                            </p>
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
                        <img
                          src={img.image_url}
                          alt={img.alt_text}
                          className="w-full rounded"
                        />
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          {img.alt_text}
                        </p>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-4 mt-10">
              <button
                onClick={handlePrevClick}
                disabled={page === 0}
                className="px-4 py-2 rounded-md border bg-muted-foreground/10 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 font-semibold text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={handleNextClick}
                disabled={page + 1 === totalPages}
                className="px-4 py-2 rounded-md border bg-muted-foreground/10 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
