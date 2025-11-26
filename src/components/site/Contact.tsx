import { MapPin, Phone, Mail } from "lucide-react";

export default function Contact() {
  return (
    <section id="contact" className="py-20">
      <div className="container grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-display">Contact & Location</h2>
          <p className="mt-2 text-muted-foreground">
            We’d love to hear from you. Reach out for inquiries, schedule, or
            how to support our ministry.
          </p>
          <div className="mt-6 grid gap-3">
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 hover-scale"
            >
              <MapPin className="text-[hsl(var(--brand-gold))]" />
              <span>Minor Basilica and Parish of San Sebastian, Manila</span>
            </a>
            <a
              href="tel:+639566243009"
              className="flex items-center gap-3 hover-scale"
            >
              <Phone className="text-[hsl(var(--brand-gold))]" />
              <span>+63 9566243009</span>
            </a>
            <a
              href="mailto:caras@example.com"
              className="flex items-center gap-3 hover-scale"
            >
              <Mail className="text-[hsl(var(--brand-gold))]" />
              <span>official.caras2025@gmail.com</span>
            </a>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border shadow-sm min-h-64">
          <iframe
            title="San Sebastian Basilica Map"
            src="https://www.google.com/maps?q=San%20Sebastian%20Basilica%20Manila&output=embed"
            className="w-full h-80"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
