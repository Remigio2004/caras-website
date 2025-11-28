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
  alt_text: string; // description
  name?: string; // image name field
  created_at: string;
}

const PAGE_SIZE = 12;

export default function Gallery() {
  const [page, setPage] = useState(0);

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

  // randomize images
  const allImages = useMemo(() => {
    const combined = dbImages || [];
    return combined
      .map((img) => ({ img, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ img }) => img) as GalleryImage[];
  }, [dbImages]);

  const totalPages = Math.max(1, Math.ceil(allImages.length / PAGE_SIZE));

  const pageImages = allImages.slice(
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

  return (
    <section id="gallery" className="py-20 overflow-y-hidden">
      <div className="container">
        {/* Title only */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-3xl font-display">Gallery</h2>
        </div>

        {isLoading && !dbImages ? (
          <div className="mt-8 text-center text-muted-foreground">
            Loading gallery...
          </div>
        ) : !allImages || allImages.length === 0 ? (
          <div className="mt-8 text-center text-muted-foreground">
            No images in gallery
          </div>
        ) : (
          <>
            {/* Images – same layout as old version */}
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
                          {/* hover title bar at bottom */}
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

            {/* Pagination – unchanged behavior */}
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
