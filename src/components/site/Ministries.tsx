import { useState } from "react";
import Acolyte from "../../assets/icons/acolyte.svg?react";
import Server from "../../assets/icons/altar server.svg?react";
import MC from "../../assets/icons/mc.svg?react";
import Banner from "../../assets/icons/banner.svg?react";
import Candle from "../../assets/icons/candle.svg?react";
import Cross from "../../assets/icons/cross.svg?react";
import Thurible from "../../assets/icons/thurible.svg?react";
import Boat from "../../assets/icons/boat.svg?react";

const ALL = "All" as const;
const categories = [ALL, "Mass", "Procession", "Special Events"] as const;

type Category = (typeof categories)[number];

type Item = {
  title: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  desc: string;
  category: Category;
};

const items: Item[] = [
  {
    title: "Acolytes",
    icon: Acolyte,
    desc: "Assist at the altar and care for sacred vessels.",
    category: "Mass",
  },
  {
    title: "Crucifers",
    icon: Cross,
    desc: "Carry the processional cross with dignity.",
    category: "Procession",
  },
  {
    title: "Thurifers",
    icon: Thurible,
    desc: "Prepare and handle incense for solemn rites.",
    category: "Mass",
  },
  {
    title: "Masters of Ceremonies",
    icon: MC,
    desc: "Coordinate liturgical flow for reverence and order.",
    category: "Special Events",
  },
  {
    title: "Altar Servers",
    icon: Server,
    desc: "Assist the priest and liturgical ministers during Mass.",
    category: "Mass",
  },
  {
    title: "Boat Bearers",
    icon: Boat,
    desc: "Carry the incense boat during the celebration of Mass.",
    category: "Mass",
  },
  {
    title: "Banner Bearers",
    icon: Banner,
    desc: "Lead processions with ceremonial banners.",
    category: "Procession",
  },
  {
    title: "Candle Bearers",
    icon: Candle,
    desc: "Carry candles during processions and assist at the altar as needed.",
    category: "Procession",
  },
];

export default function Ministries() {
  const [filter, setFilter] = useState<Category>(ALL);
  const filtered = items.filter((i) => filter === ALL || i.category === filter);

  return (
    <section id="ministries" className="py-20">
      <div className="container">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-3xl font-display">Ministries & Services</h2>
          <div className="flex gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-3 py-1 rounded-md border transition ${
                  filter === c ? "bg-accent/20 border-accent" : "hover:bg-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map(({ title, icon: Icon, desc }) => (
            <div key={title} className="group perspective">
              <div className="relative h-48 rounded-xl border bg-card shadow-elegant transition-transform duration-300 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                {/* FRONT */}
                <div className="p-5 absolute inset-0 flex flex-col items-start justify-center gap-2 [backface-visibility:hidden]">
                  {Icon && (
                    <div className="w-full flex justify-center">
                      <Icon className="h-[70px] w-[70px] text-yellow-600 mt-[-20px]" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>

                {/* BACK */}
                <div className="absolute inset-0 rounded-xl bg-gradient-emerald p-5 text-white [transform:rotateY(180deg)] [backface-visibility:hidden]">
                  <p className="text-sm">
                    More information coming soon. Training schedules and
                    responsibilities are managed by the MCs.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
