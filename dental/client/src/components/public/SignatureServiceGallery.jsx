import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BeforeAfterSlider from "./BeforeAfterSlider";

const SignatureServiceGallery = ({ cases }) => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const selected = cases[active];

  return (
    <section className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-start">
      <section>
        <p className="text-[10px] uppercase tracking-[0.25em] text-clinic-muted mb-3">What we offer</p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-clinic-ink leading-tight">
          Discover our Signature Services
        </h2>
        <p className="mt-4 text-slate-600 leading-relaxed">
          Tap a transformation to explore the story behind the smile — real results, explained clearly.
        </p>
        {selected && (
          <section className="mt-6 p-5 rounded-2xl bg-clinic-sand border border-clinic-border animate-fade-in">
            <h3 className="font-display text-xl font-semibold text-clinic-ink">{selected.title}</h3>
            <p className="text-sm text-clinic-accent mt-1">{selected.summary}</p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">{selected.detail}</p>
            <button
              type="button"
              onClick={() => navigate("/book")}
              className="mt-4 text-sm font-medium bg-clinic-ink text-clinic-cream px-5 py-2.5 rounded-full hover:bg-clinic-accent transition-colors"
            >
              Book this service
            </button>
          </section>
        )}
      </section>

      <section className="flex gap-3 sm:gap-4 justify-end">
        {cases.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(i)}
            className={`group relative flex-shrink-0 w-[72px] sm:w-[88px] transition-all duration-500 ${
              active === i ? "scale-105" : "opacity-70 hover:opacity-100"
            }`}
          >
            <span
              className={`block h-[200px] sm:h-[280px] rounded-2xl overflow-hidden border-2 transition-colors ${
                active === i ? "border-clinic-accent shadow-lg" : "border-clinic-border"
              }`}
            >
              <MiniCompare before={c.before} after={c.after} active={active === i} />
            </span>
            <span className="absolute -bottom-6 left-0 right-0 text-[9px] text-center text-clinic-muted uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
              View
            </span>
          </button>
        ))}
      </section>

      <section className="lg:col-span-2 mt-4 lg:mt-0">
        <BeforeAfterSlider
          beforeSrc={selected?.before}
          afterSrc={selected?.after}
          beforeAlt={`${selected?.title} before`}
          afterAlt={`${selected?.title} after`}
          heightClass="h-[320px] sm:h-[400px]"
          className="w-full"
        />
      </section>
    </section>
  );
};

const MiniCompare = ({ before, after, active }) => {
  const [pos] = useState(45);
  return (
    <span className="relative block w-full h-full bg-clinic-stone">
      <img src={after} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
      <span className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
      </span>
      {!before && !after && (
        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-clinic-muted uppercase tracking-wider p-1 text-center">
          {active ? "Selected" : "Before / After"}
        </span>
      )}
      <span className="absolute bottom-1 left-1 right-1 h-0.5 bg-white/80" />
    </span>
  );
};

export default SignatureServiceGallery;
