import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchSlots, submitDirectBooking } from "../../utils/publicApi";

const DoctorBookModal = ({ doctor, onClose }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const minDate = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!doctor?.id || !selectedDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetchSlots(doctor.id, selectedDate)
      .then((data) => setSlots(data.slots || []))
      .catch(() => {
        toast.error("Could not load available times");
        setSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [doctor?.id, selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      toast.error("Please choose a date and time");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitDirectBooking({
        dentistId: doctor.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        date: selectedDate,
        slotStart: selectedSlot.start,
        slotEnd: selectedSlot.end,
        message: form.message,
      });
      toast.success(res.message);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!doctor) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-clinic-ink/55 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <article className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-sky-200/70">
        <header className="sticky top-0 bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-5 border-b border-sky-100">
          <h3 className="font-display text-xl font-semibold text-clinic-ink">Book {doctor.name}</h3>
          <p className="text-xs text-blue-600 mt-1">
            Choose an open slot — admin forwards to the doctor, then you receive email confirmation.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Date</span>
            <input
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="mt-1 w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400/40"
            />
          </label>

          {selectedDate ? (
            <fieldset>
              <legend className="text-sm font-medium text-slate-700 mb-2">Available times</legend>
              {loadingSlots ? (
                <p className="text-sm text-slate-500">Loading slots…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  No open slots this day — try another date.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => setSelectedSlot(s)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                        selectedSlot?.start === s.start
                          ? "bg-blue-600 text-white border-blue-600 shadow-md"
                          : "border-sky-200 text-slate-700 hover:border-blue-300 hover:bg-sky-50"
                      }`}
                    >
                      {s.start}
                    </button>
                  ))}
                </div>
              )}
            </fieldset>
          ) : null}

          <input
            className="w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="email"
            className="w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="tel"
            className="w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <textarea
            className="w-full border border-sky-200 rounded-lg px-3 py-2.5 text-sm"
            rows={2}
            placeholder="Notes (optional)"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-white text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Request booking"}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
};

export default DoctorBookModal;
