import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageSlot from "./ImageSlot";
import { HERO_SERVICES } from "../../config/siteImages";

const HeroCarousel = ({ hero }) => {
  const navigate = useNavigate();
  const [activeService, setActiveService] = useState(0);

  return (
    <section className="relative overflow-hidden">
      <div className="hero-blur-layer relative">
        <ImageSlot
          src={hero?.src}
          alt={hero?.alt || "Clinic"}
          className="w-full h-[min(82vh,680px)] rounded-none object-cover scale-105"
          label="Hero image"
          hint="public/site/hero-01.jpg"
        />
      </div>

      <section className="absolute inset-0 bg-gradient-to-t from-clinic-ink/70 via-clinic-blue/20 to-sky-100/30 pointer-events-none" />
      <section className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.18),transparent_55%)] pointer-events-none" />
      <section className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(13,148,136,0.12),transparent_50%)] pointer-events-none" />

      <section className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-10 pt-24 pointer-events-auto">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white drop-shadow-lg max-w-2xl leading-tight mb-4">
            Care that feels calm.
            <span className="block text-sky-200/95 font-medium italic text-2xl sm:text-3xl mt-2">
              Smiles that feel like you.
            </span>
          </h1>

          <section className="flex flex-wrap gap-2 mb-6">
            {HERO_SERVICES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveService(i)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium backdrop-blur-md transition-all duration-500 ${
                  activeService === i
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-white/25"
                    : "bg-white/85 text-clinic-ink border border-sky-100/80 hover:bg-sky-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </section>

          <section className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/book?service=${HERO_SERVICES[activeService]?.id || "checkup"}`)}
              className="bg-white text-blue-900 px-8 py-3 rounded-full text-sm font-semibold shadow-lg hover:bg-sky-50 transition-colors"
            >
              Book {HERO_SERVICES[activeService]?.label?.toLowerCase()}
            </button>
            <button
              type="button"
              onClick={() => {
                document.getElementById("doctors")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-white/90 text-sm underline-offset-4 hover:underline"
            >
              Meet our specialists
            </button>
          </section>
        </section>
      </section>
    </section>
  );
};

export default HeroCarousel;
