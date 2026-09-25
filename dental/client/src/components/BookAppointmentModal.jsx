import { useState, useEffect } from "react";
import api from "../utils/api";
import useDentists from "../hooks/useDentists";
import toast from "react-hot-toast";

const TYPES = [
  "checkup",
  "cleaning",
  "filling",
  "extraction",
  "root-canal",
  "crown",
  "whitening",
  "orthodontics",
  "cosmetic",
  "gum",
  "retainers",
  "consultation",
  "other",
];

// Value for <input type="datetime-local"> in the user's local time
// (toISOString() would give UTC and shift the time by the timezone offset)
const fmt = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const BookAppointmentModal = ({ defaultStart, defaultDentistId, onClose, onBooked }) => {
  const [patients, setPatients] = useState([]);
  const staff = useDentists({ activeOnly: true });
  const [form, setForm] = useState({
    patient: "",
    dentist: defaultDentistId || "",
    startTime: fmt(defaultStart) || "",
    endTime: fmt(defaultStart ? new Date(new Date(defaultStart).getTime() + 30 * 60000) : null) || "",
    type: "checkup",
    reason: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  useEffect(() => {
    api
      .get("/patients?limit=50")
      .then((r) => setPatients(r.data.patients))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!patientSearch.trim()) {
      api
        .get("/patients?limit=50")
        .then((r) => setPatients(r.data.patients))
        .catch(() => {});
    } else {
      api
        .get(`/patients?search=${patientSearch}&limit=20`)
        .then((r) => setPatients(r.data.patients))
        .catch(() => {});
    }
  }, [patientSearch]);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient || !form.dentist || !form.startTime || !form.endTime) {
      toast.error("Patient, dentist, start and end times are required");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/appointments", {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });
      toast.success("Appointment booked");
      onBooked(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dental-border">
          <h2 className="font-display font-bold text-slate-900">Book appointment</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Patient */}
          <div>
            <label className="label">Patient *</label>
            <input
              className="input mb-1.5"
              placeholder="Search patient..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            <select className="input" name="patient" value={form.patient} onChange={set} required>
              <option value="">— Select patient —</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName} ({p.patientNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Dentist */}
          <div>
            <label className="label">Dentist *</label>
            <select className="input" name="dentist" value={form.dentist} onChange={set} required>
              <option value="">— Select dentist —</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.firstName} {s.lastName}
                  {s.specialization ? ` — ${s.specialization}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start *</label>
              <input
                className="input"
                type="datetime-local"
                name="startTime"
                value={form.startTime}
                onChange={set}
                required
              />
            </div>
            <div>
              <label className="label">End *</label>
              <input
                className="input"
                type="datetime-local"
                name="endTime"
                value={form.endTime}
                onChange={set}
                required
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="label">Appointment type</label>
            <select className="input" name="type" value={form.type} onChange={set}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="label">Reason for visit</label>
            <input
              className="input"
              name="reason"
              value={form.reason}
              onChange={set}
              placeholder="e.g. Tooth pain, routine checkup"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-none"
              name="notes"
              value={form.notes}
              onChange={set}
              rows={2}
              placeholder="Internal notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary px-6" disabled={saving}>
              {saving ? "Booking..." : "Book appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
