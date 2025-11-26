import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const images = Object.entries(
  import.meta.glob("/src/assets/gallery/**/*.{jpg,jpeg,png}", {
    eager: true,
  })
).map(([path, file]: any) => {
  const parts = path.split("/");
  const category = parts[parts.length - 2];
  const fullFileName = parts[parts.length - 1];
  const fileName = fullFileName.replace(/\.[^/.]+$/, "");

  return {
    src: file.default,
    category,
    filename: fileName,
  };
});

const cats = ["All", "Mass", "Procession", "Parish", "Devotion"] as const;
const PAGE_SIZE = 12;

export default function Gallery() {
  const [filter, setFilter] = useState<(typeof cats)[number]>("All");
  const [page, setPage] = useState(0);

  const scrollToGallery = () => {
    document
      .getElementById("gallery")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filtered = images.filter(
    (i) => filter === "All" || i.category === filter
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const pageImages = filtered.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  const handleFilterClick = (c: (typeof cats)[number]) => {
    setFilter(c);
    setPage(0);

    setTimeout(scrollToGallery, 50);
  };

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
        {/* Title + Filter */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-3xl font-display">Gallery</h2>
          <div className="flex gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => handleFilterClick(c)}
                className={`px-3 py-1 rounded-md border transition ${
                  filter === c ? "bg-accent/20 border-accent" : "hover:bg-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="mt-8 columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
          <div className="grid gap-4">
            {pageImages.map((img, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <img
                    src={img.src}
                    alt={img.filename}
                    loading="lazy"
                    className="w-full rounded-lg border shadow-sm cursor-pointer hover:scale-[1.02] transition"
                  />
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <img
                    src={img.src}
                    alt={img.filename}
                    className="w-full rounded"
                  />
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {img.filename}
                  </p>
                </DialogContent>
              </Dialog>
            ))}
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
      </div>
    </section>
  );
}
