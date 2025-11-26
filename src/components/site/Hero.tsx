import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// Import multiple images
import img1 from "../../assets/hero-basilica.jpg";
import img2 from "../../assets/CARAS.png";
import img3 from "../../assets/hero-bg.jpg";
import img4 from "../../assets/hero-img.jpg"
import img5 from "../../assets/hero-img2.jpg"
import img6 from "../../assets/hero-img3.jpg"


import { useEffect, useState } from "react";

export default function Hero() {
  const images = [img1, img2, img3, img4, img5, img6];   // <-- Add as many as you want
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);          // 4 seconds per image
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
    >
      {/* Image Fade Slideshow */}
      <AnimatePresence>
        <motion.img
          key={index}
          src={images[index]}
          alt="Slideshow Image"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        />
      </AnimatePresence>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background/70" />

      {/* Content */}
      <div className="relative container py-24 text-center animate-enter">
        <h1 className="font-display text-4xl md:text-6xl tracking-tight text-primary-foreground drop-shadow-md">
          <span className="text-[hsl(var(--brand-gold))]">Serving the Lord</span> at His Altar
        </h1>

        <p className="mt-4 text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
          The Confraternity of Augustinian Recollect Altar Servers of the Minor Basilica and Parish of San Sebastian – Shrine of Our Lady of Mt. Carmel.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="#about"><Button variant="hero" size="lg">Learn More</Button></a>
          <a href="#join"><Button variant="outline" size="lg">Join Us</Button></a>
        </div>
      </div>
    </section>
  );
}
