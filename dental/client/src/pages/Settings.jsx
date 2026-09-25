import { useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";

const CURRENCIES = ["USD", "EUR", "GBP", "EGP", "SAR", "AED", "KWD"];

const SectionCard = ({ title, children }) => (
  <div className="card p-6 mb-5">
    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">{title}</h2>
    {children}
  </div>
);

const Settings = () => {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/clinic")
      .then((r) => setClinic(r.data))
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setClinic({ ...clinic, [e.target.name]: e.target.value });
  };

  const handleHoursChange = (index, field, value) => {
    const updated = [...clinic.workingHours];
    updated[index] = { ...updated[index], [field]: value };
    setClinic({ ...clinic, workingHours: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/clinic", clinic);
      setClinic(res.data);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!clinic) return null;

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="Manage your clinic information and working hours"
        action={
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        }
      />

      {/* Clinic info */}
      <SectionCard title="Clinic information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Clinic name</label>
            <input
              className="input"
              name="name"
              value={clinic.name}
              onChange={handleChange}
              placeholder="My Dental Clinic"
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              name="phone"
              value={clinic.phone}
              onChange={handleChange}
              placeholder="+1 555 000 0000"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              name="email"
              value={clinic.email}
              onChange={handleChange}
              placeholder="clinic@example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input
              className="input"
              name="address"
              value={clinic.address}
              onChange={handleChange}
              placeholder="123 Main St"
            />
          </div>
          <div>
            <label className="label">City</label>
            <input
              className="input"
              name="city"
              value={clinic.city}
              onChange={handleChange}
              placeholder="Cairo"
            />
          </div>
          <div>
            <label className="label">Country</label>
            <input
              className="input"
              name="country"
              value={clinic.country}
              onChange={handleChange}
              placeholder="Egypt"
            />
          </div>
          <div>
            <label className="label">Tax / VAT number</label>
            <input
              className="input"
              name="taxNumber"
              value={clinic.taxNumber}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input" name="currency" value={clinic.currency} onChange={handleChange}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Default appointment duration (minutes)</label>
            <input
              className="input"
              type="number"
              name="appointmentDuration"
              value={clinic.appointmentDuration}
              onChange={handleChange}
              min={10}
              max={120}
              step={5}
            />
          </div>
        </div>
      </SectionCard>

      {/* Working hours */}
      <SectionCard title="Working hours">
        <div className="space-y-3">
          {(clinic.workingHours || []).map((wh, i) => (
            <div key={wh.day} className="flex items-center gap-4">
              {/* Toggle */}
              <label className="flex items-center gap-2 cursor-pointer w-36">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={wh.open}
                    onChange={(e) => handleHoursChange(i, "open", e.target.checked)}
                  />
                  <div
                    className={`w-10 h-5 rounded-full transition-colors ${wh.open ? "bg-primary-600" : "bg-slate-200"}`}
                  />
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${wh.open ? "translate-x-5" : ""}`}
                  />
                </div>
                <span
                  className={`text-sm font-medium capitalize ${wh.open ? "text-slate-800" : "text-dental-muted"}`}
                >
                  {wh.day}
                </span>
              </label>

              {wh.open ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    className="input w-28 text-sm"
                    value={wh.start}
                    onChange={(e) => handleHoursChange(i, "start", e.target.value)}
                  />
                  <span className="text-dental-muted text-sm">to</span>
                  <input
                    type="time"
                    className="input w-28 text-sm"
                    value={wh.end}
                    onChange={(e) => handleHoursChange(i, "end", e.target.value)}
                  />
                </div>
              ) : (
                <span className="text-sm text-dental-muted italic">Closed</span>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default Settings;
