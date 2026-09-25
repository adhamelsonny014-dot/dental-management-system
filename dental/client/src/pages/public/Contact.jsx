import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import SectionHeading from "../../components/public/SectionHeading";
import { fetchClinic, submitContact } from "../../utils/publicApi";

const DAY_LABEL = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const formatHours = (hours = []) =>
  hours
    .filter((h) => h.open)
    .map((h) => `${DAY_LABEL[h.day] || h.day}: ${h.start} – ${h.end}`)
    .join(" · ") || "Contact us for hours";

const Contact = () => {
  const [clinic, setClinic] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClinic()
      .then(setClinic)
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitContact(form);
      toast.success(res.message);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send message");
    } finally {
      setLoading(false);
    }
  };

  const address = [clinic?.address, clinic?.city, clinic?.country].filter(Boolean).join(", ");

  return (
    <>
      <section className="bg-clinic-sand border-b border-clinic-border py-16 sm:py-20">
        <section className="max-w-6xl mx-auto px-5 sm:px-8">
          <SectionHeading
            eyebrow="Contact"
            title="We are here to help"
            description="Questions about treatment, insurance, or scheduling? Send us a message and we will respond within one business day."
          />
        </section>
      </section>

      <section className="py-16 sm:py-20">
        <section className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12">
          <section className="space-y-6">
            <InfoRow label="Clinic" value={clinic?.name || "SmileCare Dental"} />
            {address && <InfoRow label="Address" value={address} />}
            <InfoRow label="Phone" value={clinic?.phone || "+20 100 000 0000"} />
            <InfoRow label="Email" value={clinic?.email || "info@smilecare.com"} />
            <InfoRow label="Hours" value={formatHours(clinic?.workingHours)} />
            <section className="h-56 rounded-2xl bg-clinic-stone border border-clinic-border flex items-center justify-center text-clinic-muted text-sm p-6 text-center">
              {address ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-clinic-accent hover:underline"
                >
                  Open in Google Maps →
                </a>
              ) : (
                "Map link available once clinic address is set in Settings"
              )}
            </section>
          </section>

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-clinic-border rounded-2xl p-6 sm:p-8 space-y-4"
          >
            <Field label="Name" name="name" value={form.name} onChange={handleChange} required />
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
            <Field label="Subject" name="subject" value={form.subject} onChange={handleChange} />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Message</span>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                className="mt-1 w-full border border-clinic-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-accent/40"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-clinic-ink text-clinic-cream py-3 rounded-full text-sm font-medium hover:bg-clinic-accent transition-colors disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send message"}
            </button>
          </form>
        </section>
      </section>
    </>
  );
};

const InfoRow = ({ label, value }) => (
  <section>
    <p className="text-xs uppercase tracking-wider text-clinic-muted">{label}</p>
    <p className="text-slate-800 mt-1">{value}</p>
  </section>
);

const Field = ({ label, name, value, onChange, type = "text", required }) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 w-full border border-clinic-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-accent/40"
    />
  </label>
);

export default Contact;
