import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import SectionHeading from "../../components/public/SectionHeading";
import { registerPatient } from "../../utils/publicApi";

const PatientRegister = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerPatient(form);
      setDone(res);
      toast.success(res.message);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        message: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="bg-gradient-to-br from-sky-50 to-blue-50 border-b border-sky-100 py-16 sm:py-20">
        <section className="max-w-6xl mx-auto px-5 sm:px-8">
          <SectionHeading
            eyebrow="New patient"
            title="Register with our clinic"
            description="Your details are saved to our system and a dental chart is created automatically — visible to our team in the admin portal."
          />
        </section>
      </section>

      <section className="py-16 sm:py-20">
        <section className="max-w-xl mx-auto px-5 sm:px-8">
          {done ? (
            <article className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
              <p className="font-display text-xl font-semibold text-emerald-900">You&apos;re registered</p>
              <p className="text-sm text-emerald-800 mt-2">{done.message}</p>
              {done.patient?.patientNumber ? (
                <p className="text-sm font-mono mt-3 text-emerald-700">Patient ID: {done.patient.patientNumber}</p>
              ) : null}
              <Link to="/book" className="inline-block mt-6 text-sm font-medium text-blue-700 underline">
                Request an appointment →
              </Link>
            </article>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-sky-100 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <section className="grid sm:grid-cols-2 gap-4">
                <Field label="First name" name="firstName" value={form.firstName} onChange={handleChange} required />
                <Field label="Last name" name="lastName" value={form.lastName} onChange={handleChange} required />
              </section>
              <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
              <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required />
              <section className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Date of birth</span>
                  <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Gender</span>
                  <select name="gender" value={form.gender} onChange={handleChange} className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </section>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Notes (optional)</span>
                <textarea name="message" value={form.message} onChange={handleChange} rows={2} className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm" placeholder="Allergies, concerns…" />
              </label>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-60">
                {loading ? "Registering…" : "Register"}
              </button>
            </form>
          )}
        </section>
      </section>
    </>
  );
};

const Field = ({ label, name, value, onChange, type = "text", required }) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <input type={type} name={name} value={value} onChange={onChange} required={required} className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400/40" />
  </label>
);

export default PatientRegister;
