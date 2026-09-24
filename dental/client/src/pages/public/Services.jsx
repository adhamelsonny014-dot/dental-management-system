import { Link } from "react-router-dom";
import SectionHeading from "../../components/public/SectionHeading";
import { SERVICES } from "../../data/publicServices";

const Services = () => (
  <>
    <section className="bg-clinic-sand border-b border-clinic-border py-16 sm:py-20">
      <section className="max-w-6xl mx-auto px-5 sm:px-8">
        <SectionHeading
          eyebrow="Services"
          title="Complete dental care"
          description="Preventive, restorative, and cosmetic treatments — tailored to your goals and schedule."
        />
      </section>
    </section>

    <section className="py-16 sm:py-20">
      <section className="max-w-6xl mx-auto px-5 sm:px-8 space-y-8">
        {SERVICES.map((s) => (
          <article
            key={s.id}
            id={s.id}
            className="grid md:grid-cols-[auto_1fr_auto] gap-6 items-center bg-white border border-clinic-border rounded-2xl p-6 sm:p-8"
          >
            <p className="w-14 h-14 rounded-2xl bg-clinic-sand flex items-center justify-center text-clinic-accent">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={s.icon} />
              </svg>
            </p>
            <section>
              <h2 className="font-display text-xl font-semibold text-clinic-ink">{s.title}</h2>
              <p className="text-slate-600 mt-2 leading-relaxed">{s.description}</p>
            </section>
            <Link
              to={`/book?service=${s.id}`}
              className="text-sm font-medium text-clinic-accent hover:underline whitespace-nowrap"
            >
              Book →
            </Link>
          </article>
        ))}
      </section>
    </section>
  </>
);

export default Services;
