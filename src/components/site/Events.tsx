import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Event = {
  id: string;
  title: string;
  date: string;
  summary: string | null;
  banner_url: string | null;
  featured: boolean;
  narrative: string | null;
};

const PAGE_SIZE = 6; // 2 rows x 3 columns

export default function Events() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const { data: events, isLoading } = useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,title,date,summary,banner_url,featured,narrative")
        .order("date", { ascending: false });
      if (error) throw error;
      return (data || []) as Event[];
    },
  });

  const sorted = (events || [])
    .slice()
    .sort(
      (a, b) =>
        (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
        b.date.localeCompare(a.date)
    );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const pageEvents = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const scrollToEvents = () => {
    document
      .getElementById("events")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePrevClick = () => {
    setPage((p) => Math.max(p - 1, 0));
    setTimeout(scrollToEvents, 50);
  };

  const handleNextClick = () => {
    setPage((p) => Math.min(p + 1, totalPages - 1));
    setTimeout(scrollToEvents, 50);
  };

  const handleOpenNarrative = (id: string) => {
    setSelectedId(id);
    navigate(`/event/${id}`);
  };

  return (
    <section id="events" className="py-20 bg-muted/40">
      <div className="container">
        <h2 className="text-3xl font-display">Events & Activities</h2>

        {isLoading && !events ? (
          <div className="mt-6 text-muted-foreground">Loading events...</div>
        ) : !sorted.length ? (
          <div className="mt-6 text-muted-foreground">
            No events have been posted yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pageEvents.map((ev) => (
              <div
                key={ev.id}
                className={`flex flex-col h-full rounded-lg border bg-card p-5 shadow-sm ${
                  ev.featured ? "ring-2 ring-[hsl(var(--brand-gold))]" : ""
                }`}
              >
                <div className="text-sm text-muted-foreground">
                  {new Date(ev.date).toLocaleDateString()}
                </div>
                <h3 className="mt-1 font-semibold line-clamp-2">{ev.title}</h3>
                {ev.summary && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                    {ev.summary}
                  </p>
                )}

                <div className="mt-auto pt-3">
                  <Button
                    variant="link"
                    className="px-0"
                    onClick={() => handleOpenNarrative(ev.id)}
                  >
                    Read more »
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sorted.length > PAGE_SIZE && (
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
        )}
      </div>
    </section>
  );
}
