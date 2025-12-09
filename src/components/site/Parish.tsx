import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Clergy = {
  id: string;
  name: string;
  description: string;
  category:
    | "rector_parish_priest"
    | "parochial_vicar"
    | "assisting_priest"
    | "other";
  photo_url: string | null;
};

const CATEGORY_LABELS: Record<Clergy["category"], string> = {
  rector_parish_priest: "Rector and Parish Priest",
  parochial_vicar: "Parochial Vicar",
  assisting_priest: "Assisting Priest",
  other: "Clergy",
};

export default function Parish() {
  const ref = useRef<HTMLDivElement>(null);
  const [clergy, setClergy] = useState<Clergy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      // adjust 0.15 kung gusto mo mas malakas/mahina
      el.style.backgroundPosition = `center ${-y * 0.15}px`;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchClergy = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("parish_clergy")
        .select("id, name, description, category, photo_url")
        .order("display_order", { ascending: true });

      if (!error && data) {
        setClergy(data as Clergy[]);
      } else {
        console.error(error);
      }
      setLoading(false);
    };

    fetchClergy();
  }, []);

  return (
    <section
      id="parish"
      ref={ref}
      className="relative py-24 bg-fixed bg-cover bg-center mb-12"
      style={{
        backgroundImage:
          "radial-gradient(60% 60% at 50% 0%, hsl(var(--brand-gold)/0.15), transparent), linear-gradient(to bottom, hsl(var(--background)), hsl(var(--background)))",
      }}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-display">Our Parish</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            The Minor Basilica and Parish of San Sebastian – Shrine of Our Lady
            of Mt. Carmel, a beacon of Gothic revival faith and Filipino
            devotion.
          </p>
        </div>

        {/* Parish Clergy Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-display text-center mb-8">
            Parish Clergy
          </h3>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading clergy…</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-3">
              {clergy.map((priest) => (
                <div
                  key={priest.id}
                  className="group p-6 rounded-lg border bg-card/80 backdrop-blur-sm text-center transition-all duration-300 hover:shadow-elegant hover:border-accent"
                  style={{ borderColor: "hsl(var(--brand-gold)/0.3)" }}
                >
                  {/* Photo */}
                  <div className="mx-auto w-[130px] h-[130px] rounded-full flex items-center justify-center mb-4 shadow-glow overflow-hidden">
                    {priest.photo_url ? (
                      <img
                        src={priest.photo_url}
                        alt={priest.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-white/80" />
                    )}
                  </div>

                  {/* Title from category */}
                  <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-accent/20 text-accent mb-3">
                    {CATEGORY_LABELS[priest.category] ?? "Clergy"}
                  </span>

                  {/* Name */}
                  <h4 className="text-lg font-display text-foreground mb-2">
                    {priest.name}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {priest.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
