import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import SectionHeading from "../../components/public/SectionHeading";
import { SERVICE_OPTIONS } from "../../data/publicServices";
import { submitBooking } from "../../utils/publicApi";

const TIMES = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

const Book = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    serviceType: searchParams.get("service") || "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const service = searchParams.get("service");
    if (service) setForm((f) => ({ ...f, serviceType: service }));
  }, [searchParams]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.serviceType) {
      toast.error("Please select a service category");
      return;
    }
    setLoading(true);
    try {
      const res = await submitBooking(form);
      toast.success(res.message);
      setForm({
        name: "",
        email: "",
        phone: "",
        preferredDate: "",
        preferredTime: "",
        serviceType: "",
        message: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit request");
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <>
      <section className="bg-gradient-to-br from-sky-50 to-blue-50/80 border-b border-sky-100 py-16 sm:py-20">
        <section className="max-w-6xl mx-auto px-5 sm:px-8">
          <SectionHeading
            eyebrow="Appointments"
            title="Request by service"
            description="Choose checkup, whitening, cosmetic dentistry, and more. Admin assigns a dentist, the doctor confirms, then you receive confirmation by email — or a reschedule notice if needed."
          />
          <p className="mt-4 text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 max-w-2xl">
            Want a specific doctor? Go to the{" "}
            <a href="/#doctors" className="font-semibold underline">
              homepage specialists
            </a>{" "}
            section to book Dr. Tala El Serysy or Dr. Omar El Antary directly with a calendar.
          </p>
        </section>
      </section>

      <section className="py-16 sm:py-20">
        <section className="max-w-xl mx-auto px-5 sm:px-8">
          <form onSubmit={handleSubmit} className="bg-white border border-sky-100 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
            <Field label="Full name" name="name" value={form.name} onChange={handleChange} required />
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
            <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required />

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Service category</span>
              <select
                name="serviceType"
                value={form.serviceType}
                onChange={handleChange}
                required
                className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              >
                <option value="">Select a service</option>
                {SERVICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
                <option value="gum">Gum treatment</option>
                <option value="retainers">Retainers</option>
                <option value="other">Other</option>
              </select>
            </label>

            <section className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Preferred date</span>
                <input
                  type="date"
                  name="preferredDate"
                  value={form.preferredDate}
                  onChange={handleChange}
                  min={minDate}
                  className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Preferred time</span>
                <select
                  name="preferredTime"
                  value={form.preferredTime}
                  onChange={handleChange}
                  className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                >
                  <option value="">Any time</option>
                  {TIMES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Notes (optional)</span>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={3}
                placeholder="Describe your concern…"
                className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white py-3.5 rounded-full text-sm font-medium hover:from-blue-700 hover:to-sky-600 transition-all disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Submit request"}
            </button>

            <p className="text-xs text-clinic-muted text-center leading-relaxed">
              Flow: your request → admin assigns a dentist → doctor confirms → email &amp; profile notification.
            </p>
          </form>
        </section>
      </section>
    </>
  );
};

const Field = ({ label, name, value, onChange, type = "text", required }) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
    />
  </label>
);

export default Book;
