import { useEffect, useRef } from "react";

export default function Parish() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const y = window.scrollY;
      el.style.backgroundPosition = `center ${-y * 0.2}px`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-display">Our Parish</h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          The Minor Basilica and Parish of San Sebastian – Shrine of Our Lady of
          Mt. Carmel, a beacon of Gothic revival faith and Filipino devotion.
        </p>
      </div>
    </section>
  );
}
