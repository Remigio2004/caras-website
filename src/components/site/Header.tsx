import { Menu, Facebook, Instagram, Youtube } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import carasLogo from "../../assets/caras-logo.png";

const nav = [
  { id: "home", label: "Home" },
  { id: "about", label: "About Us" },
  { id: "parish", label: "Our Parish" },
  { id: "ministries", label: "Services" },
  { id: "events", label: "Events" },
  { id: "gallery", label: "Gallery" },
  { id: "join", label: "Join Us" },
  { id: "contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNavClick = (id: string) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToSection(id), 150);
    } else {
      scrollToSection(id);
    }
  };

  const NavLinks = () => (
    <nav className="hidden md:flex items-center gap-6 text-sm">
      {nav.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => handleNavClick(n.id)}
          className="story-link"
        >
          {n.label}
        </button>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 font-display">
      <div className="container flex h-16 items-center justify-between">
        <button
          type="button"
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-full shadow-glow" aria-hidden>
            <img className="h-10 w-10" src={carasLogo} alt="CARAS logo" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg text-left">CARAS</div>
            <div className="text-xs text-muted-foreground">
              de San Sebastian
            </div>
          </div>
        </button>

        <NavLinks />

        <div className="hidden md:flex items-center gap-2">
          <a
            href="https://www.facebook.com/profile.php?id=61572579823497"
            aria-label="Facebook"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost" size="icon">
              <Facebook />
            </Button>
          </a>
          <a
            href="https://instagram.com"
            aria-label="Instagram"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost" size="icon">
              <Instagram />
            </Button>
          </a>
          <a
            href="https://youtube.com"
            aria-label="YouTube"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost" size="icon">
              <Youtube />
            </Button>
          </a>
          {user ? (
            <Link to="/dashboard">
              <Button variant="gold">Dashboard</Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="outline">Admin Login</Button>
            </Link>
          )}
        </div>

        {/* Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="mt-6 grid gap-4">
              {nav.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    handleNavClick(n.id);
                    setOpen(false);
                  }}
                  className="text-base text-left"
                >
                  {n.label}
                </button>
              ))}
              <div className="flex gap-2 pt-2">
                <a
                  href="https://facebook.com"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <Button variant="ghost" size="icon">
                    <Facebook />
                  </Button>
                </a>
                <a
                  href="https://instagram.com"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <Button variant="ghost" size="icon">
                    <Instagram />
                  </Button>
                </a>
                <a
                  href="https://youtube.com"
                  aria-label="YouTube"
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <Button variant="ghost" size="icon">
                    <Youtube />
                  </Button>
                </a>
              </div>
              {user ? (
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  <Button variant="gold" className="w-full">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Admin Login
                  </Button>
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
