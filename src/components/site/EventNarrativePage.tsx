import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "./Header";
import Footer from "./Footer"; // <– add this

type Event = {
  id: string;
  title: string;
  date: string;
  summary: string | null;
  banner_url: string | null;
  narrative_image_url: string | null;
  narrative: string | null;
};

export default function EventNarrativePage() {
  const { id } = useParams<{ id: string }>();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-narrative", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id,title,date,summary,banner_url,narrative_image_url,narrative"
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Event | null;
    },
  });

  if (!id || isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-muted/40">
          <p className="text-muted-foreground">Loading event...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-muted/40">
          <p className="text-muted-foreground">Event not found.</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen h-auto bg-muted/30">
        {event.banner_url && (
          <div className="w-full max-h-[120px] overflow-hidden bg-black shadow-md">
            <img
              src={event.banner_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <section className="container max-w-[960px] py-10 px-6 mt-6 mb-6 bg-white rounded-2xl shadow-lg border border-black-100">
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-semibold text-primary leading-tight">
              {event.title}
            </h1>

            <div className="mt-6 flex flex-wrap gap-8 text-sm text-muted-foreground border-y py-4">
              <div>
                <div className="font-semibold uppercase tracking-wide text-xs">
                  Date
                </div>
                <div>
                  {event.date ? new Date(event.date).toLocaleDateString() : "—"}
                </div>
              </div>

              {event.summary && (
                <div className="flex-1 min-w-[200px]">
                  <div className="font-semibold uppercase tracking-wide text-xs">
                    Description
                  </div>
                  <p className="mt-1">{event.summary}</p>
                </div>
              )}
            </div>
          </header>

          {event.narrative_image_url && (
            <div className="mt-8 w-full flex justify-center">
              <img
                src={event.narrative_image_url}
                alt={event.title}
                className="max-h-[400px] w-auto object-contain rounded-md shadow-sm"
              />
            </div>
          )}

          <article className="mt-8">
            <div className="text-justify text-[15px] leading-relaxed whitespace-pre-line">
              {event.narrative ||
                "Narrative report for this event will be available soon."}
            </div>
          </article>
        </section>
      </main>

      <Footer />
    </>
  );
}
