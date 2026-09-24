import { Link } from "react-router-dom";
import SectionHeading from "../../components/public/SectionHeading";

const VALUES = [
  { title: "Patient-first", text: "Every decision starts with your comfort, clarity, and long-term oral health." },
  { title: "Evidence-based", text: "We use modern diagnostics and proven techniques — never unnecessary treatment." },
  { title: "Transparent", text: "Clear estimates, honest timelines, and open communication at every visit." },
];

const About = () => (
  <>
    <section className="bg-clinic-sand border-b border-clinic-border py-16 sm:py-20">
      <section className="max-w-6xl mx-auto px-5 sm:px-8">
        <SectionHeading
          eyebrow="About SmileCare"
          title="A clinic built around your smile"
          description="For over fifteen years we have helped families across the community achieve healthier, more confident smiles — combining clinical excellence with a warm, unhurried experience."
        />
      </section>
    </section>

    <section className="py-16 sm:py-20">
      <section className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-start">
        <section>
          <h2 className="font-display text-2xl font-semibold text-clinic-ink mb-4">Our story</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            SmileCare began with a simple belief: dental visits should feel calm, not stressful.
            Today our team of dentists, hygienists, and care coordinators work together under one
            digital system so your records, charts, and treatment history are always at hand.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Whether you need a routine cleaning or a full treatment plan, you will always know
            what to expect — and why we recommend each step.
          </p>
        </section>
        <section className="bg-clinic-sand border border-clinic-border rounded-2xl p-8">
          <h3 className="font-display text-lg font-semibold mb-6">What patients appreciate</h3>
          <ul className="space-y-4 text-slate-700">
            <li>• Same-day emergency slots when available</li>
            <li>• Digital X-rays with lower radiation exposure</li>
            <li>• Treatment plans you can review at home</li>
            <li>• Kid-friendly first-visit introductions</li>
          </ul>
        </section>
      </section>
    </section>

    <section className="py-16 bg-clinic-cream border-y border-clinic-border">
      <section className="max-w-6xl mx-auto px-5 sm:px-8">
        <SectionHeading eyebrow="Our values" title="How we practice" align="center" />
        <section className="mt-12 grid md:grid-cols-3 gap-6">
          {VALUES.map((v) => (
            <article key={v.title} className="bg-white border border-clinic-border rounded-2xl p-6 text-center">
              <h3 className="font-display text-lg font-semibold text-clinic-ink">{v.title}</h3>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{v.text}</p>
            </article>
          ))}
        </section>
      </section>
    </section>

    <section className="py-16 text-center">
      <section className="max-w-6xl mx-auto px-5 sm:px-8">
        <p className="text-slate-600 mb-6">Ready to meet the team?</p>
        <p className="flex flex-wrap justify-center gap-4">
          <Link to="/doctors" className="bg-clinic-ink text-clinic-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-clinic-accent transition-colors">
            Meet our doctors
          </Link>
          <Link to="/book" className="border border-clinic-border px-6 py-3 rounded-full text-sm font-medium hover:border-clinic-accent transition-colors">
            Book a visit
          </Link>
        </p>
      </section>
    </section>
  </>
);

export default About;
