import caras from "../../assets/caras-1.jfif";
import officers from "../../assets/officers.png";

const currentYear = new Date().getFullYear();

const officersList = [
  {
    position: "President",
    name: "Arturo Cerillo",
    yearStarted: 2017,
  },
  {
    position: "Vice President",
    name: "Carlo San Miguel",
    yearStarted: 2019,
  },
  {
    position: "Treasurer",
    name: "Mario Ledres",
    yearStarted: 2016,
  },
  {
    position: "Media Relation Officer",
    name: "Mark Adrian Remigio",
    yearStarted: 2018,
  },
  {
    position: "Head Committee on Training and Development",
    name: "John Patrick Flores",
    yearStarted: 2024,
  },
  {
    position: "Assistant Committee on Training and Development",
    name: "Matthew Gavin Vidallon",
    yearStarted: 2023,
  },
  {
    position: "Head Committee on Liturgical Services",
    name: "Rainier Buison",
    yearStarted: 2019,
  },
  {
    position: "Assistant Committee on Liturgical Services",
    name: "Glen Ledres",
    yearStarted: 2016,
  },
];

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
                <strong>Confraternity of Augustinian Recollect Altar Servers de San Sebastian</strong> is a united community of altar servers formed by prayer, learning, community, and reverent service at the altar. 
                Inspired by the charism of St. Augustine and the spirit of Recollection, we help young people grow closer to Jesus, serve with humility and gladness, 
                and become faithful witnesses of the Gospel in the Church and in daily life. 
            </p>

            {/* Mission / Vision */}
            <div className="mt-6 grid gap-4">
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: "hsl(var(--brand-gold))" }}
              >
                <h3 className="font-semibold">Mission</h3>
                <p className="text-sm text-muted-foreground text-justify">
                 CARAS de San Sebastian lives its vocation 
                 to proclaim Christ and bring people closer to Him. Seeking first the Kingdom of 
                 God and His righteousness, CARAS forms altar servers through the charism of St. Augustine 
                 and the spirit of Recollection. Through prayer, learning, community, and service at the altar, 
                 we help our members grow closer to God, serve with humility and gladness, and witness to Christ’s 
                 love through simple, pure, and compassionate lives. 
                </p>
              </div>
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: "hsl(var(--brand-gold))" }}
              >
                <h3 className="font-semibold">Vision</h3>
                <p className="text-sm text-muted-foreground">
                  CARAS de San Sebastian envisions a united and well-formed community of altar 
                  servers who grow close to Jesus, ready to serve with humility and gladness, 
                  live the Augustinian Recollect spirit, and witness to the Gospel in the 
                  Church and in daily life. 
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
                  {officersList.map((officer) => {
                    const yearsInService = currentYear - officer.yearStarted;
                    return (
                      <div key={officer.name}>
                        <h4 className="officers italic">
                          {officer.position}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-[.5rem]">
                          <strong>{officer.name}</strong> - {yearsInService}{" "}
                          {yearsInService === 1 ? "year" : "years"} in service
                        </p>
                      </div>
                    );
                  })}
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
              <p className="indent-8">
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

              <p className="indent-8">
                From its earliest days, CARAS sought to provide structure and
                spiritual formation for young altar servers, ensuring that their
                role in assisting at the altar was not only functional but
                deeply rooted in the Augustinian Recollect charism. What began
                as a small group of dedicated servers quickly grew into a
                recognized confraternity, giving identity and purpose to those
                who offered their time and talent in liturgical celebrations.
              </p>

              <p className="indent-8">
                Over the years, CARAS expanded beyond San Sebastian Basilica,
                reaching other Augustinian Recollect institutions and parishes
                across the country. Its members have become familiar faces in
                Eucharistic celebrations, vocation festivals, and national
                church events—always carrying the values of
                <strong> service, humility, and devotion</strong>.
              </p>

              <p className="indent-8">
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
