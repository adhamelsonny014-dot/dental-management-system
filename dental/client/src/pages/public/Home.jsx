import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import HeroCarousel from "../../components/public/HeroCarousel";
import FeaturedDoctors from "../../components/public/FeaturedDoctors";
import SignatureServiceGallery from "../../components/public/SignatureServiceGallery";
import BeforeAfterSlider from "../../components/public/BeforeAfterSlider";
import ImageSlot from "../../components/public/ImageSlot";
import { SITE_IMAGES, HOME_STATS } from "../../config/siteImages";
import { fetchClinic, submitContact } from "../../utils/publicApi";

const Home = () => {
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchClinic().then(setClinic).catch(() => {});
  }, []);

  const handleQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setSending(true);
    try {
      await submitContact({
        name: "Website visitor",
        email: clinic?.email || "visitor@smilecare.com",
        subject: "Quick question from homepage",
        message: question.trim(),
      });
      toast.success("Question sent — we'll reply soon.");
      setQuestion("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send");
    } finally {
      setSending(false);
    }
  };

  const address = [clinic?.address, clinic?.city, clinic?.country].filter(Boolean).join(", ");

  const statToneClass = {
    blue: "from-blue-500 to-sky-600",
    teal: "from-clinic-teal to-emerald-600",
    violet: "from-clinic-violet to-indigo-500",
  };

  return (
    <article className="relative">
      <HeroCarousel hero={SITE_IMAGES.hero} />

      <section id="services" className="scroll-mt-20 py-20 sm:py-28 relative">
        <section className="max-w-6xl mx-auto px-5 sm:px-8">
          <SignatureServiceGallery cases={SITE_IMAGES.signatureCases} />
        </section>
      </section>

      <section
        id="about"
        className="scroll-mt-20 py-16 sm:py-24 border-y border-sky-200/40 bg-gradient-to-br from-sky-50/90 via-clinic-sand to-blue-50/60"
      >
        <section className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <ImageSlot
            src={SITE_IMAGES.about.src}
            alt={SITE_IMAGES.about.alt}
            className="aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-3xl shadow-[0_20px_60px_-24px_rgba(37,99,235,0.2)] ring-1 ring-sky-100"
            label="Clinic photo"
            hint="public/site/about-clinic.jpg"
          />
          <section className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-8 lg:gap-10">
            {HOME_STATS.map((s) => (
              <section
                key={s.label}
                className="relative overflow-hidden rounded-2xl bg-white/80 px-6 py-5 text-center ring-1 ring-sky-100/80 backdrop-blur-sm lg:text-left lg:flex lg:items-center lg:gap-4"
              >
                <span
                  className={`inline-block shrink-0 bg-gradient-to-br ${statToneClass[s.tone]} bg-clip-text font-display text-4xl font-bold tabular-nums text-transparent sm:text-5xl`}
                >
                  {s.value}
                </span>
                <p className="text-xs uppercase tracking-[0.18em] text-clinic-muted mt-2 lg:mt-0">
                  {s.label}
                </p>
              </section>
            ))}
          </section>
        </section>
      </section>

      <section
        id="doctors"
        className="scroll-mt-20 py-20 sm:py-28 bg-gradient-to-b from-blue-50/70 via-clinic-cream to-teal-50/50"
      >
        <section className="max-w-6xl mx-auto px-5 sm:px-8">
          <p className="text-[10px] uppercase tracking-[0.25em] text-blue-600 mb-3 font-semibold">
            Specialists
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold bg-gradient-to-r from-clinic-ink via-blue-700 to-clinic-teal bg-clip-text text-transparent mb-4">
            Book directly with our experts
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mb-12 leading-relaxed">
            Tap a doctor to explore their work, then pick an open slot from the calendar. Your request goes to admin,
            then the doctor confirms — we email you when it&apos;s locked in.
          </p>
          <FeaturedDoctors />
        </section>
      </section>

      <section className="py-20 sm:py-28 bg-gradient-to-b from-teal-50/70 via-white to-sky-50/80 border-y border-sky-100/60">
        <section className="max-w-6xl mx-auto px-5 sm:px-8">
          <header className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-[10px] uppercase tracking-[0.25em] text-clinic-muted mb-3">Transformations</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-clinic-ink leading-tight">
              Make your smile shine
              <span className="mt-1 block bg-gradient-to-r from-blue-600 via-sky-500 to-clinic-teal bg-clip-text font-medium italic text-transparent">
                all the way
              </span>
            </h2>
          </header>
          <BeforeAfterSlider
            beforeSrc={SITE_IMAGES.smileShowcase.before}
            afterSrc={SITE_IMAGES.smileShowcase.after}
            heightClass="h-[min(75vh,560px)]"
            className="max-w-4xl mx-auto"
          />
        </section>
      </section>

      <section
        id="contact"
        className="scroll-mt-20 py-20 sm:py-24 bg-gradient-to-r from-blue-50/50 via-white to-teal-50/40"
      >
        <section className="max-w-6xl mx-auto px-5 sm:px-8">
          <p className="text-[10px] uppercase tracking-[0.25em] text-clinic-muted mb-3">Got a question?</p>
          <h2 className="font-display text-3xl font-semibold text-clinic-ink mb-8">Ask us anything</h2>
          <div className="max-w-xl rounded-2xl p-[2px] bg-gradient-to-r from-blue-500 via-sky-400 to-clinic-teal shadow-lg shadow-blue-500/10">
            <form
              onSubmit={handleQuestion}
              className="flex flex-col sm:flex-row gap-3 p-2 rounded-[0.9rem] bg-white"
            >
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question here…"
                className="flex-1 bg-clinic-cream/50 border border-sky-100 rounded-xl px-4 py-3.5 text-sm text-clinic-ink placeholder:text-clinic-muted focus:outline-none focus:ring-2 focus:ring-blue-400/35"
              />
              <button
                type="submit"
                disabled={sending}
                className="bg-gradient-to-r from-blue-600 to-sky-500 text-white px-8 py-3.5 rounded-xl text-sm font-medium shadow-md hover:from-blue-700 hover:to-sky-600 transition-all disabled:opacity-60 shrink-0"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </form>
          </div>
        </section>
      </section>

      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-50/80 via-clinic-sand to-sky-100/50 border-t border-sky-200/30">
        <section className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12">
          <section>
            <p className="text-[10px] uppercase tracking-[0.25em] text-clinic-muted mb-3">Find us</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-clinic-ink mb-8">
              Location &amp; info
            </h2>
            <dl className="space-y-5">
              <Info label="Clinic" value={clinic?.name || "Dental care"} />
              <Info label="Address" value={address || "123 Dental Street — update in Settings"} />
              <Info label="Phone" value={clinic?.phone || "+20 100 000 0000"} />
              <Info label="Email" value={clinic?.email || "info@smilecare.com"} />
              <Info label="Hours" value="Sun – Thu 9:00 – 18:00 · Sat 10:00 – 14:00" />
            </dl>
            <button
              type="button"
              onClick={() => navigate("/book")}
              className="mt-8 bg-clinic-ink text-clinic-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Request by service category
            </button>
          </section>
          <section className="min-h-[280px] rounded-3xl overflow-hidden border border-sky-100 bg-clinic-stone flex items-center justify-center">
            {address ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 font-medium hover:underline px-6 text-center"
              >
                Open in Google Maps →
              </a>
            ) : (
              <p className="text-sm text-clinic-muted text-center px-6">Map embed — set address in clinic Settings</p>
            )}
          </section>
        </section>
      </section>

      <footer className="relative py-8 border-t border-sky-100 bg-gradient-to-r from-sky-50/90 via-white to-blue-50/90 text-center text-xs text-clinic-muted">
        <p>
          © {new Date().getFullYear()} Dental care ·{" "}
          <button type="button" onClick={() => navigate("/login")} className="underline hover:text-blue-700">
            Staff portal
          </button>
        </p>
      </footer>
    </article>
  );
};

const Info = ({ label, value }) => (
  <section>
    <dt className="text-[10px] uppercase tracking-widest text-clinic-muted">{label}</dt>
    <dd className="text-slate-800 mt-1">{value}</dd>
  </section>
);

export default Home;
