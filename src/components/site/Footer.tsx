import { useLocation, useNavigate } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();
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

  return (
    <footer className="border-t py-10">
      <div className="container grid gap-6 md:grid-cols-3 items-start">
        <div>
          <div className="font-display text-lg">CARAS</div>
          <p className="text-sm text-muted-foreground">
            Confraternity of Augustinian Recollect Altar Servers
          </p>
        </div>

        <nav className="grid gap-2 text-sm">
          <button
            type="button"
            onClick={() => handleNavClick("about")}
            className="hover:underline text-left"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("ministries")}
            className="hover:underline text-left"
          >
            Ministries
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("events")}
            className="hover:underline text-left"
          >
            Events
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("join")}
            className="hover:underline text-left"
          >
            Join
          </button>
        </nav>

        <div className="text-sm text-muted-foreground md:text-right">
          © {year} CARAS • All rights reserved
          <div>
            <button
              type="button"
              onClick={() => handleNavClick("home")}
              className="underline"
            >
              Back to top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
