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

export default function Events() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
        a.date.localeCompare(b.date)
    );

  const handleOpenNarrative = (id: string) => {
    setSelectedId(id);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" }); // or "smooth"
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
            {sorted.map((ev) => (
              <div
                key={ev.id}
                className={`rounded-lg border bg-card p-5 shadow-sm ${
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

                <div className="mt-3">
                  <Button
                    variant="link"
                    className="px-0"
                    onClick={() => handleOpenNarrative(ev.id)}
                  >
                    View narrative
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
