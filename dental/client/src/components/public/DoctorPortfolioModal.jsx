import { useState, useEffect, useCallback } from "react";
import ImageSlot from "./ImageSlot";

const DoctorPortfolioModal = ({ doctor, onClose, onBook }) => {
  const images = doctor?.portfolio || [];
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const go = useCallback(
    (next) => {
      if (images.length <= 1) return;
      setTransitioning(true);
      setTimeout(() => {
        setIndex((next + images.length) % images.length);
        setTransitioning(false);
      }, 280);
    },
    [images.length],
  );

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => go(index + 1), 5000);
    return () => clearInterval(t);
  }, [index, go, images.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, onClose]);

  if (!doctor) return null;

  const slide = images[index] || doctor.photo;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`${doctor.name} portfolio`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-clinic-ink/60 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close backdrop"
      />

      <article className="relative z-10 w-full max-w-4xl rounded-3xl overflow-hidden bg-white shadow-2xl ring-1 ring-sky-200/60">
        <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white">
          <div>
            <h3 className="font-display text-2xl font-semibold text-clinic-ink">{doctor.name}</h3>
            <p className="text-sm text-blue-600 font-medium mt-0.5">{doctor.role}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <section className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
          <div
            className={`absolute inset-0 transition-all duration-500 ease-out ${
              transitioning ? "opacity-0 blur-xl scale-105" : "opacity-100 blur-0 scale-100"
            }`}
          >
            <ImageSlot
              src={slide}
              alt={`${doctor.name} work ${index + 1}`}
              className="h-full w-full object-cover"
              label="Portfolio"
            />
          </div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-clinic-ink shadow-lg hover:bg-white"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-clinic-ink shadow-lg hover:bg-white"
                aria-label="Next"
              >
                ›
              </button>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index ? "w-8 bg-sky-400" : "w-3 bg-white/50"
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>

        <footer className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-5 bg-gradient-to-r from-sky-50/80 to-teal-50/50">
          <p className="text-sm text-slate-600 max-w-md">
            {doctor.experience || doctor.headline || "Selected cases from our practice."}
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onBook?.(doctor);
            }}
            className="shrink-0 bg-gradient-to-r from-blue-600 to-sky-500 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-md hover:from-blue-700 hover:to-sky-600 transition-all"
          >
            Book with {doctor.name.split(" ").slice(-2).join(" ")}
          </button>
        </footer>
      </article>
    </div>
  );
};

export default DoctorPortfolioModal;
