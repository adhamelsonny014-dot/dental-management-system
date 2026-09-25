import { useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import MedicationRow from "./MedicationRow";
import { EMPTY_MED } from "./constants";

// ── Rx drawer ──────────────────────────────────────────────────────────────────
const RxDrawer = ({ rx, patientId, staff, onClose, onSaved }) => {
  const isEdit = Boolean(rx?._id);
  const [form, setForm] = useState(
    rx
      ? { ...rx, medications: rx.medications?.map((m) => ({ ...m })) || [] }
      : {
          issueDate: new Date().toISOString().split("T")[0],
          dentist: "",
          diagnosis: "",
          notes: "",
          medications: [{ ...EMPTY_MED }],
        },
  );
  const [saving, setSaving] = useState(false);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addMed = () => setForm((f) => ({ ...f, medications: [...f.medications, { ...EMPTY_MED }] }));
  const updateMed = (i, m) =>
    setForm((f) => {
      const meds = [...f.medications];
      meds[i] = m;
      return { ...f, medications: meds };
    });
  const removeMed = (i) => setForm((f) => ({ ...f, medications: f.medications.filter((_, j) => j !== i) }));

  const handleSubmit = async () => {
    if (!form.medications.length || !form.medications[0].name) {
      toast.error("At least one medication with a name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, patient: patientId };
      if (!payload.dentist) delete payload.dentist;
      let res;
      if (isEdit) {
        res = await api.put(`/prescriptions/${rx._id}`, payload);
        toast.success("Prescription updated");
      } else {
        res = await api.post("/prescriptions", payload);
        toast.success("Prescription created");
      }
      onSaved(res.data, isEdit ? "update" : "create");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dental-border sticky top-0 bg-white z-10">
          <h2 className="font-display font-bold text-slate-900">
            {isEdit ? "Edit prescription" : "New prescription"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Issue date</label>
              <input
                className="input"
                type="date"
                name="issueDate"
                value={form.issueDate?.split("T")[0] || ""}
                onChange={set}
              />
            </div>
            <div>
              <label className="label">Dentist</label>
              <select className="input" name="dentist" value={form.dentist || ""} onChange={set}>
                <option value="">— Select —</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Diagnosis</label>
              <input
                className="input"
                name="diagnosis"
                value={form.diagnosis}
                onChange={set}
                placeholder="e.g. Post-extraction pain management"
              />
            </div>
          </div>

          {/* Medications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Medications</h3>
              <button
                type="button"
                onClick={addMed}
                className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add medication
              </button>
            </div>
            <div className="space-y-3">
              {form.medications.map((med, i) => (
                <MedicationRow
                  key={i}
                  med={med}
                  index={i}
                  onChange={(m) => updateMed(i, m)}
                  onRemove={() => removeMed(i)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-none text-sm"
              name="notes"
              value={form.notes}
              onChange={set}
              rows={2}
              placeholder="Additional instructions or notes..."
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-dental-border flex justify-end gap-3 bg-white">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary px-6" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create prescription"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RxDrawer;
