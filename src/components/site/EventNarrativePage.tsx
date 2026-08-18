import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "./Header";
import Footer from "./Footer"; 

type Event = {
  id: string;
  title: string;
  date: string;
  summary: string | null;
  banner_url: string | null;
  narrative_image_url: string | null;
  narrative_images: string[] | null;
  photo_credit: string | null;
  narrative: string | null;
};

type EventListItem = {
  id: string;
  title: string;
  date: string;
  featured: boolean;
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
          "id,title,date,summary,banner_url,narrative_image_url,narrative_images,photo_credit,narrative"
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Event | null;
    },
  });

  const { data: eventList } = useQuery({
    queryKey: ["event-narrative-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,title,date,featured");
      if (error) throw error;
      return (data || []) as EventListItem[];
    },
  });

  const sortedList = (eventList || [])
    .slice()
    .sort(
      (a, b) =>
        (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
        b.date.localeCompare(a.date)
    );

  const currentIndex = sortedList.findIndex((ev) => ev.id === id);
  const prevEvent = currentIndex > 0 ? sortedList[currentIndex - 1] : null;
  const nextEvent =
    currentIndex >= 0 && currentIndex < sortedList.length - 1
      ? sortedList[currentIndex + 1]
      : null;

  const [imageIndex, setImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  const handleSwipeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.clientX;
    touchDeltaXRef.current = 0;
    setIsDragging(true);
  };

  const handleSwipeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    touchDeltaXRef.current = e.clientX - touchStartXRef.current;
  };

  const handleSwipeEnd = (imagesLength: number) => {
    const SWIPE_THRESHOLD = 50;
    if (touchDeltaXRef.current > SWIPE_THRESHOLD) {
      setImageIndex((prev) => Math.max(0, prev - 1));
    } else if (touchDeltaXRef.current < -SWIPE_THRESHOLD) {
      setImageIndex((prev) => Math.min(imagesLength - 1, prev + 1));
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    setIsDragging(false);
  };

  useEffect(() => {
    setImageIndex(0);
  }, [id]);

  useEffect(() => {
    document
      .getElementById("event-header")
      ?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [id, event]);

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
          <header id="event-header" className="mb-8 scroll-mt-24">
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

          {(() => {
            const images =
              event.narrative_images && event.narrative_images.length > 0
                ? event.narrative_images
                : event.narrative_image_url
                ? [event.narrative_image_url]
                : [];

            if (images.length === 0) return null;

            return (
              <div className="mt-8 w-full flex flex-col items-center">
                <div
                  className={`select-none ${
                    isDragging ? "cursor-grabbing" : images.length > 1 ? "cursor-grab" : ""
                  }`}
                  style={{ touchAction: "pan-y" }}
                  onPointerDown={handleSwipeStart}
                  onPointerMove={handleSwipeMove}
                  onPointerUp={() => handleSwipeEnd(images.length)}
                  onPointerLeave={() => handleSwipeEnd(images.length)}
                >
                  <img
                    src={images[imageIndex] ?? images[0]}
                    alt={event.title}
                    className="max-h-[400px] w-auto object-contain rounded-md shadow-sm pointer-events-none"
                    draggable={false}
                  />
                </div>

                {event.photo_credit && (
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    {event.photo_credit}
                  </p>
                )}

                {images.length > 1 && (
                  <div className="mt-4 flex items-center gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setImageIndex(index)}
                        aria-label={`Show image ${index + 1}`}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          index === imageIndex
                            ? "bg-primary"
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          <article className="mt-8">
            <div className="text-justify text-[15px] leading-relaxed whitespace-pre-line">
              {event.narrative ||
                "Narrative report for this event will be available soon."}
            </div>
          </article>

          {(prevEvent || nextEvent) && (
            <nav className="mt-10 pt-6 border-t flex items-start justify-between gap-4">
              <div className="flex-1">
                {prevEvent && (
                  <Link
                    to={`/event/${prevEvent.id}`}
                    className="group block max-w-[280px]"
                  >
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      &larr; Previous
                    </div>
                    <div className="mt-1 text-sm font-semibold text-primary group-hover:underline line-clamp-2 italic">
                      {prevEvent.title}
                    </div>
                  </Link>
                )}
              </div>

              <div className="flex-1 text-right">
                {nextEvent && (
                  <Link
                    to={`/event/${nextEvent.id}`}
                    className="group block max-w-[280px] ml-auto"
                  >
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Next &rarr;
                    </div>
                    <div className="mt-1 text-sm font-semibold text-primary group-hover:underline line-clamp-2 italic">
                      {nextEvent.title}
                    </div>
                  </Link>
                )}
              </div>
            </nav>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
