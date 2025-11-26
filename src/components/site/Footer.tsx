export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t py-10">
      <div className="container grid gap-6 md:grid-cols-3 items-start">
        <div>
          <div className="font-display text-lg">CARAS</div>
          <p className="text-sm text-muted-foreground">Confraternity of Augustinian Recollect Altar Servers</p>
        </div>
        <nav className="grid gap-2 text-sm">
          <a href="#about" className="hover:underline">About</a>
          <a href="#ministries" className="hover:underline">Ministries</a>
          <a href="#events" className="hover:underline">Events</a>
          <a href="#join" className="hover:underline">Join</a>
        </nav>
        <div className="text-sm text-muted-foreground md:text-right">
          © {year} CARAS • All rights reserved
          <div>
            <a href="#home" className="underline">Back to top</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
