import { useEffect, useState } from "react";
import ImageSlot from "./ImageSlot";
import DoctorPortfolioModal from "./DoctorPortfolioModal";
import DoctorBookModal from "./DoctorBookModal";
import { SITE_IMAGES } from "../../config/siteImages";
import { fetchFeaturedDoctors } from "../../utils/publicApi";

const FeaturedDoctors = () => {
  const [doctors, setDoctors] = useState(SITE_IMAGES.featuredDoctors);
  const [portfolioDoctor, setPortfolioDoctor] = useState(null);
  const [bookDoctor, setBookDoctor] = useState(null);

  useEffect(() => {
    fetchFeaturedDoctors()
      .then((apiDocs) => {
        if (!apiDocs?.length) return;
        const merged = apiDocs.map((api) => {
          const local = SITE_IMAGES.featuredDoctors.find((d) => d.slug === api.slug);
          return {
            ...local,
            ...api,
            photo: local?.photo || api.photo,
            portfolio: api.portfolio?.length ? api.portfolio : local?.portfolio,
          };
        });
        setDoctors(merged);
      })
      .catch(() => {});
  }, []);

  const openBook = (doc) => setBookDoctor(doc);
  const openPortfolio = (doc) => setPortfolioDoctor(doc);

  return (
    <>
      <section className="grid md:grid-cols-2 gap-8 lg:gap-10">
        {doctors.map((doc, idx) => (
          <article
            key={doc.slug || doc.name}
            className={`group relative rounded-3xl overflow-hidden bg-white shadow-xl ring-2 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl cursor-pointer ${
              idx === 0
                ? "ring-blue-200/80 hover:ring-blue-400/60"
                : "ring-teal-200/80 hover:ring-teal-400/60"
            }`}
          >
            <button type="button" className="w-full text-left" onClick={() => openPortfolio(doc)}>
              <div className="relative h-72 sm:h-80 overflow-hidden">
                <ImageSlot
                  src={doc.photo}
                  alt={doc.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  label="Doctor photo"
                  hint={doc.photo?.split("/").pop()}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-clinic-ink/75 via-blue-900/20 to-transparent opacity-90" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.25),transparent_55%)]" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sky-200/90 mb-1">
                    Featured specialist
                  </p>
                  <h3 className="font-display text-2xl font-semibold text-white">{doc.name}</h3>
                  <p className={`text-sm font-medium mt-1 ${idx === 0 ? "text-sky-200" : "text-teal-200"}`}>
                    {doc.role}
                  </p>
                </div>
              </div>
            </button>

            <footer className="flex items-center justify-between gap-3 px-6 py-4 bg-gradient-to-r from-sky-50/90 to-white border-t border-sky-100/80">
              <p className="text-xs text-slate-600">{doc.experience}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openPortfolio(doc)}
                  className="text-xs font-medium text-blue-700 hover:underline"
                >
                  View work
                </button>
                <button
                  type="button"
                  onClick={() => openBook(doc)}
                  className="text-xs font-semibold bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
                >
                  Book now
                </button>
              </div>
            </footer>
          </article>
        ))}
      </section>

      <DoctorPortfolioModal
        doctor={portfolioDoctor}
        onClose={() => setPortfolioDoctor(null)}
        onBook={(doc) => {
          setPortfolioDoctor(null);
          openBook(doc);
        }}
      />
      <DoctorBookModal doctor={bookDoctor} onClose={() => setBookDoctor(null)} />
    </>
  );
};

export default FeaturedDoctors;
