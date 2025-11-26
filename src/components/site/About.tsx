import caras from "../../assets/caras-1.jfif";
import orgChart from "../../assets/Org Chart.png";

export default function About() {
  return (
    <section
      id="about"
      className="py-20 min-h-[80vh] max-h-[300vh] bg-neutral-50"
    >
      {/* Main container for two rows */}
      <div className="container mx-auto px-[4-rem] flex flex-col gap-10">
        {/* ROW 1: 2 columns */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* LEFT: IMAGE */}
          <div className="relative">
            <div className="rounded-lg overflow-hidden bg-gradient-emerald shadow-elegant">
              <img
                className="px-2 py-2 rounded-2xl w-full h-auto object-cover"
                src={caras}
                alt="caras-photo"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 hidden md:block w-40 h-40 rounded-full bg-gradient-altar opacity-80 shadow-glow" />
          </div>
          {/* RIGHT: ABOUT CARAS */}
          <div>
            <h2 className="text-3xl md:text-4xl font-display">About CARAS</h2>
            <p className="mt-4 text-muted-foreground text-justify">
              Rooted in Augustinian Recollect spirituality,&nbsp;
              <strong>
                Confraternity of Augustinian Recollect Altar Server (CARAS)
              </strong>
              &nbsp;serves the liturgy with reverence and dignity. Our members
              are formed to love the Eucharist, grow in community, and witness
              to Christ through service.
            </p>
            {/* Mission / Vision */}
            <div className="mt-6 grid gap-4">
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: "hsl(var(--brand-gold))" }}
              >
                <h3 className="font-semibold">Mission</h3>
                <p className="text-sm text-muted-foreground">
                  To sanctify the liturgy through faithful service at the altar
                  and to form young hearts in love and discipline.
                </p>
              </div>
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: "hsl(var(--brand-gold))" }}
              >
                <h3 className="font-semibold">Vision</h3>
                <p className="text-sm text-muted-foreground">
                  A brotherhood of altar servers embodying humility, charity and
                  excellence in the worship of God.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: 2 columns */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* LEFT: Content */}
          <div>
            <h2 className="text-2xl md:text-3xl font-display">
              CARAS Organizational Chart
            </h2>
            <p className="mt-4 text-muted-foreground text-justify">
              The&nbsp;
              <strong>
                Confraternity of Augustinian Recollect Altar Servers (CARAS)
              </strong>
              &nbsp;is a ministry dedicated to assisting in liturgical
              celebrations and parish activities. The organizational chart shows
              the hierarchy and roles within the ministry, ensuring clear
              communication, proper coordination, and effective service.
            </p>
            <div className="mt-6 grid gap-4">
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: "hsl(var(--brand-gold))" }}
              >
                <div className="text-center">
                  <h4 className="officers italic">Sacristan Mayor</h4>
                  <p className="text-sm text-muted-foreground mb-[.5rem]">
                    <strong>Jojo Mecisamente</strong> - 15 years in service
                  </p>
                  <h4 className="officers italic">President</h4>
                  <p className="text-sm text-muted-foreground mb-[.5rem]">
                    <strong>Arturo Cerillo</strong> - 8 years in service
                  </p>
                  <h4 className="officers italic">Vice President</h4>
                  <p className="text-sm text-muted-foreground mb-[.5rem]">
                    <strong>Carlo San Miguel</strong> - 5 years in service
                  </p>
                  <h4 className="officers italic">Treasurer</h4>
                  <p className="text-sm text-muted-foreground mb-[.5rem]">
                    <strong>Mario Ledres</strong> - 10 years in service
                  </p>
                  <h4 className="officers italic">Media Relation Officer</h4>
                  <p className="text-sm text-muted-foreground mb-[.5rem]">
                    <strong>Mark Adrian Remigio</strong> - 6 years in service
                  </p>
                  <h4 className="officers italic">
                    Head Committee on Training and Development
                  </h4>
                  <p className="text-sm text-muted-foreground mb-[.5rem]">
                    <strong>John Patrick Flores</strong> - 2 years in service
                  </p>
                  <h4 className="officers italic">
                    Assistant Committee on Training and Development
                  </h4>
                  <p className="text-sm text-muted-foreground mb-[.5rem]">
                    <strong>Matthew Gavin Vidallon</strong> - 8 years in service
                  </p>
                  <h4 className="officers italic">
                    Head Committee on Liturgical Services
                  </h4>
                  <p className="text-sm text-muted-foreground mb-[.5rem]">
                    <strong>Rainier Buison</strong> - 3 years in service
                  </p>
                  <h4 className="officers italic">
                    Assistant Committee on Liturgical Services
                  </h4>
                  <p className="text-sm text-muted-foreground mb-[.5rem]">
                    <strong>Glen Ledres</strong> - 10 years in service
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* RIGHT: ORG CHART IMAGE */}
          <div className="relative">
            <div className="rounded-lg overflow-hidden bg-gradient-emerald shadow-elegant">
              <img
                className="px-2 py-2 rounded-2xl w-full h-auto object-cover"
                src={orgChart}
                alt="org-chart"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden md:block w-40 h-40 rounded-full bg-gradient-altar opacity-80 shadow-glow" />
          </div>
        </div>
      </div>
    </section>
  );
}
