import caras from "../../assets/caras-1.jfif";
import officers from "../../assets/officers.png";

export default function About() {
  return (
    <section
      id="about"
      className="py-[105px] min-h-[80vh] max-h-auto bg-neutral-50"
    >
      <div className="container mx-auto px-[4-rem] flex flex-col gap-10">
        {/* ROW 1: About + photo */}
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
                  CARAS de San Sebastian forms altar servers who live the
                  Augustinian Recollect spirit by praying and growing closer to
                  God, building a loving and united community, serving at the
                  altar with humility and joy, continually learning about their
                  faith and vocation, and showing Christ’s love through simple,
                  pure, and compassionate lives.
                </p>
              </div>
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: "hsl(var(--brand-gold))" }}
              >
                <h3 className="font-semibold">Vision</h3>
                <p className="text-sm text-muted-foreground">
                  CARAS de San Sebastian dreams of a community of altar servers
                  who follow the Augustinian Recollect spirit—united, prayerful,
                  loving, and ready to serve. Inspired by the Order’s example,
                  we aim to guide young people toward holiness by teaching them
                  to pray, live simply, and joyfully serve the Church and God’s
                  people
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Org chart */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* LEFT: Content */}
          <div>
            <h2 className="text-2xl md:text-3xl font-display">
              CARAS Officers Chart
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
                  {/* <h4 className="officers italic">Sacristan Mayor</h4>
                  <p className="text-sm text-muted-foreground mb-[.5rem]">
                    <strong>Jojo Mecisamente</strong> - 15 years in service
                  </p> */}
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
                    <strong>Matthew Gavin Vidallon</strong> - 1 year in service
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
                src={officers}
                alt="org-chart"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden md:block w-40 h-40 rounded-full bg-gradient-altar opacity-80 shadow-glow" />
          </div>
        </div>

        {/* ROW 3: History subsection */}
        <div className="mt-10">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-display text-center mb-8">
              History of CARAS de San Sebastian
            </h3>

            <div className="space-y-6 text-muted-foreground leading-relaxed text-justify">
              <p>
                On <strong>September 8, 1985</strong>, the{" "}
                <em>
                  Confraternity of Augustinian Recollect Altar Servers (CARAS)
                </em>{" "}
                was officially founded at the historic{" "}
                <strong>San Sebastian Basilica in Manila</strong>. Established
                under the guidance of the Augustinian Recollect Fathers, CARAS
                was born on the Feast of the Nativity of the Blessed Virgin
                Mary—a fitting day to dedicate a ministry rooted in humility,
                service, and devotion.
              </p>

              <p>
                From its earliest days, CARAS sought to provide structure and
                spiritual formation for young altar servers, ensuring that their
                role in assisting at the altar was not only functional but
                deeply rooted in the Augustinian Recollect charism. What began
                as a small group of dedicated servers quickly grew into a
                recognized confraternity, giving identity and purpose to those
                who offered their time and talent in liturgical celebrations.
              </p>

              <p>
                Over the years, CARAS expanded beyond San Sebastian Basilica,
                reaching other Augustinian Recollect institutions and parishes
                across the country. Its members have become familiar faces in
                Eucharistic celebrations, vocation festivals, and national
                church events—always carrying the values of{" "}
                <strong>service, humility, and devotion</strong>.
              </p>

              <p>
                Today, CARAS continues to inspire generations of altar servers,
                reminding them that their ministry is more than just assisting
                at Mass—it is a calling to live out the Gospel through faithful
                service at the altar of the Lord.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
