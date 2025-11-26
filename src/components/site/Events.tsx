import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Event = {
  id: string;
  title: string;
  date: string; // ISO
  featured?: boolean;
  description: string;
};

const events: Event[] = [
  {
    id: "1",
    title: "Investiture and Renewal",
    date: "2025-08-16",
    featured: true,
    description: "Mass, and solemn celebrations.",
  },
  {
    id: "2",
    title: "Month of St. Tarcicius & Recruitment",
    date: "2025-08-10",
    description: "Updated serving schedule for all teams.",
  },
  {
    id: "3",
    title: "Ang Pagtitipon ng mga Gabay",
    date: "2025-11-29",
    description: "General assembly along with the parents of the CARAS",
  },
];

export default function Events() {
  const [openId, setOpenId] = useState<string | null>(null);
  const sorted = [...events].sort(
    (a, b) =>
      (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
      a.date.localeCompare(b.date)
  );

  return (
    <section id="events" className="py-20 bg-muted/40">
      <div className="container">
        <h2 className="text-3xl font-display">Events & Activities</h2>
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
              <h3 className="mt-1 font-semibold">{ev.title}</h3>
              <div className="mt-3">
                <Dialog
                  open={openId === ev.id}
                  onOpenChange={(o) => setOpenId(o ? ev.id : null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="link">View details</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{ev.title}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      {ev.description}
                    </p>
                    <a className="mt-4 inline-block" href="#" download>
                      <Button variant="outline">Download PDF Schedule</Button>
                    </a>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
