import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US",
  { month: "long", day: "numeric", year: "numeric" }) : "—";

const EMPTY_MED = { name: "", dosage: "", frequency: "", duration: "", instructions: "", quantity: "" };

const COMMON_MEDS = [
  "Amoxicillin","Augmentin (Amoxicillin/Clavulanate)","Metronidazole",
  "Clindamycin","Ibuprofen","Paracetamol / Acetaminophen","Naproxen",
  "Diclofenac","Dexamethasone","Prednisolone","Chlorhexidine Mouthwash",
  "Benzydamine Mouthwash","Lidocaine Gel","Nystatin","Aciclovir",
];

const FREQUENCIES = [
  "Once daily","Twice daily (every 12h)","3x daily (every 8h)",
  "4x daily (every 6h)","Every 4–6 hours as needed","At bedtime","With meals",
];

// ── Medication row ─────────────────────────────────────────────────────────────
const MedicationRow = ({ med, index, onChange, onRemove }) => (
  <div className="card p-4 relative">
    <button type="button" onClick={onRemove}
      className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>

    <div className="flex items-center gap-2 mb-3">
      <span className="w-6 h-6 rounded bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>
      <p className="text-sm font-semibold text-slate-700">Medication #{index + 1}</p>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div className="col-span-2">
        <label className="label text-xs">Medication name *</label>
        <input className="input text-sm" list="med-list"
          value={med.name}
          onChange={(e) => onChange({ ...med, name: e.target.value })}
          placeholder="e.g. Amoxicillin" />
        <datalist id="med-list">
          {COMMON_MEDS.map((m) => <option key={m} value={m} />)}
        </datalist>
      </div>
      <div>
        <label className="label text-xs">Dosage</label>
        <input className="input text-sm"
          value={med.dosage}
          onChange={(e) => onChange({ ...med, dosage: e.target.value })}
          placeholder="e.g. 500mg" />
      </div>
      <div>
        <label className="label text-xs">Frequency</label>
        <input className="input text-sm" list="freq-list"
          value={med.frequency}
          onChange={(e) => onChange({ ...med, frequency: e.target.value })}
          placeholder="e.g. 3x daily" />
        <datalist id="freq-list">
          {FREQUENCIES.map((f) => <option key={f} value={f} />)}
        </datalist>
      </div>
      <div>
        <label className="label text-xs">Duration</label>
        <input className="input text-sm"
          value={med.duration}
          onChange={(e) => onChange({ ...med, duration: e.target.value })}
          placeholder="e.g. 5 days" />
      </div>
      <div>
        <label className="label text-xs">Quantity to dispense</label>
        <input className="input text-sm"
          value={med.quantity}
          onChange={(e) => onChange({ ...med, quantity: e.target.value })}
          placeholder="e.g. 15 tablets" />
      </div>
      <div className="col-span-2 sm:col-span-3">
        <label className="label text-xs">Special instructions</label>
        <input className="input text-sm"
          value={med.instructions}
          onChange={(e) => onChange({ ...med, instructions: e.target.value })}
          placeholder="e.g. Take after meals, avoid alcohol" />
      </div>
    </div>
  </div>
);

// ── Print view ─────────────────────────────────────────────────────────────────
const PrintView = ({ rx, clinic, onClose }) => (
  <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-8" id="print-area">
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{clinic?.name || "Dental Clinic"}</h1>
          <p className="text-sm text-dental-muted">{clinic?.address}{clinic?.city ? `, ${clinic.city}` : ""}</p>
          <p className="text-sm text-dental-muted">{clinic?.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-dental-muted">Prescription No.</p>
          <p className="font-mono font-bold text-slate-800">{rx.prescriptionNumber}</p>
          <p className="text-sm text-dental-muted mt-1">{fmtDate(rx.issueDate)}</p>
        </div>
      </div>

      {/* Rx symbol */}
      <div className="flex items-start gap-8 mb-6">
        <span className="font-display text-5xl font-bold text-primary-600 leading-none">℞</span>
        <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-0.5">Patient</p>
            <p className="font-semibold text-slate-800">{rx.patient?.firstName} {rx.patient?.lastName}</p>
            <p className="text-dental-muted">{rx.patient?.patientNumber}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-0.5">Prescribing dentist</p>
            <p className="font-semibold text-slate-800">
              Dr. {rx.dentist?.firstName} {rx.dentist?.lastName}
            </p>
            {rx.dentist?.specialization && (
              <p className="text-dental-muted">{rx.dentist.specialization}</p>
            )}
          </div>
          {rx.diagnosis && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-0.5">Diagnosis</p>
              <p className="text-slate-700">{rx.diagnosis}</p>
            </div>
          )}
        </div>
      </div>

      {/* Medications */}
      <div className="space-y-4 mb-6">
        {rx.medications.map((med, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-bold text-slate-900">{med.name}</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 mt-1 text-sm text-dental-muted">
                  {med.dosage    && <p>Dosage: <span className="text-slate-700 font-medium">{med.dosage}</span></p>}
                  {med.frequency && <p>Frequency: <span className="text-slate-700 font-medium">{med.frequency}</span></p>}
                  {med.duration  && <p>Duration: <span className="text-slate-700 font-medium">{med.duration}</span></p>}
                  {med.quantity  && <p>Quantity: <span className="text-slate-700 font-medium">{med.quantity}</span></p>}
                </div>
                {med.instructions && (
                  <p className="text-sm text-slate-600 mt-1 italic">⚠ {med.instructions}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {rx.notes && (
        <div className="mb-6 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-slate-700">{rx.notes}</p>
        </div>
      )}

      {/* Signature line */}
      <div className="flex justify-end mt-10 pt-6 border-t border-slate-200">
        <div className="text-center">
          <div className="w-40 border-b-2 border-slate-800 mb-1" />
          <p className="text-sm font-semibold text-slate-700">
            Dr. {rx.dentist?.firstName} {rx.dentist?.lastName}
          </p>
          <p className="text-xs text-dental-muted">{rx.dentist?.specialization || "Dentist"}</p>
        </div>
      </div>

      {/* Buttons (hidden on print) */}
      <div className="flex gap-3 justify-center mt-8 print:hidden">
        <button className="btn-primary px-6" onClick={() => window.print()}>
          🖨️ Print
        </button>
        <button className="btn-ghost border border-dental-border" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  </div>
);

// ── Rx card ────────────────────────────────────────────────────────────────────
const RxCard = ({ rx, onEdit, onDelete, onPrint, onDispense }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="font-display text-emerald-700 font-bold text-lg leading-none">℞</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800">{rx.prescriptionNumber}</p>
          <p className="text-xs text-dental-muted">{fmtDate(rx.issueDate)}</p>
          {rx.dentist && (
            <p className="text-xs text-dental-muted">Dr. {rx.dentist.firstName} {rx.dentist.lastName}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {rx.medications.map((m, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {m.name}{m.dosage ? ` ${m.dosage}` : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
        {rx.isDispensed ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Dispensed</span>
        ) : (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Not dispensed</span>
        )}
      </div>
    </div>

    <div className="flex gap-2 mt-3 pt-3 border-t border-dental-border">
      <button className="btn-ghost text-xs px-2 py-1" onClick={() => onPrint(rx)}>Print</button>
      <button className="btn-ghost text-xs px-2 py-1" onClick={() => onEdit(rx)}>Edit</button>
      {!rx.isDispensed && (
        <button onClick={() => onDispense(rx._id)}
          className="text-xs px-2 py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 font-medium transition-colors">
          Mark dispensed
        </button>
      )}
      <button onClick={() => onDelete(rx)}
        className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors ml-auto">
        Delete
      </button>
    </div>
  </div>
);

// ── Rx drawer ──────────────────────────────────────────────────────────────────
const RxDrawer = ({ rx, patientId, staff, onClose, onSaved }) => {
  const isEdit = Boolean(rx?._id);
  const [form, setForm] = useState(rx
    ? { ...rx, medications: rx.medications?.map((m) => ({ ...m })) || [] }
    : {
        issueDate: new Date().toISOString().split("T")[0],
        dentist: "", diagnosis: "", notes: "",
        medications: [{ ...EMPTY_MED }],
      }
  );
  const [saving, setSaving] = useState(false);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addMed    = () => setForm((f) => ({ ...f, medications: [...f.medications, { ...EMPTY_MED }] }));
  const updateMed = (i, m) => setForm((f) => {
    const meds = [...f.medications]; meds[i] = m; return { ...f, medications: meds };
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Issue date</label>
              <input className="input" type="date" name="issueDate"
                value={form.issueDate?.split("T")[0] || ""}
                onChange={set} />
            </div>
            <div>
              <label className="label">Dentist</label>
              <select className="input" name="dentist" value={form.dentist || ""} onChange={set}>
                <option value="">— Select —</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Diagnosis</label>
              <input className="input" name="diagnosis" value={form.diagnosis} onChange={set}
                placeholder="e.g. Post-extraction pain management" />
            </div>
          </div>

          {/* Medications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Medications</h3>
              <button type="button" onClick={addMed}
                className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                Add medication
              </button>
            </div>
            <div className="space-y-3">
              {form.medications.map((med, i) => (
                <MedicationRow key={i} med={med} index={i}
                  onChange={(m) => updateMed(i, m)}
                  onRemove={() => removeMed(i)} />
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none text-sm" name="notes" value={form.notes}
              onChange={set} rows={2} placeholder="Additional instructions or notes..." />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-dental-border flex justify-end gap-3 bg-white">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary px-6" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create prescription"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────
const Prescriptions = () => {
  const { patientId } = useParams();
  const navigate      = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [patient,       setPatient]       = useState(null);
  const [clinic,        setClinic]        = useState(null);
  const [staff,         setStaff]         = useState([]);
  const [drawer,        setDrawer]        = useState(null);
  const [printRx,       setPrintRx]       = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    api.get(`/patients/${patientId}`).then((r) => setPatient(r.data)).catch(() => {});
    api.get("/staff?role=dentist").then((r) => setStaff(r.data)).catch(() => {});
    api.get("/clinic").then((r) => setClinic(r.data)).catch(() => {});
  }, [patientId]);

  const fetchRx = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/prescriptions?patient=${patientId}`);
      setPrescriptions(res.data.prescriptions);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchRx(); }, [fetchRx]);

  const handleSaved = (saved, mode) => {
    if (mode === "create") setPrescriptions((p) => [saved, ...p]);
    else setPrescriptions((p) => p.map((x) => x._id === saved._id ? saved : x));
  };

  const handleDispense = async (id) => {
    try {
      const res = await api.patch(`/prescriptions/${id}/dispense`);
      setPrescriptions((p) => p.map((x) => x._id === id ? res.data : x));
      toast.success("Marked as dispensed");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/prescriptions/${deleteTarget._id}`);
      setPrescriptions((p) => p.filter((x) => x._id !== deleteTarget._id));
      toast.success("Prescription deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="Prescriptions"
        subtitle={patient
          ? `${patient.firstName} ${patient.lastName} · ${patient.patientNumber} · ${total} prescription${total !== 1 ? "s" : ""}`
          : ""}
        action={
          <div className="flex gap-2">
            <button className="btn-ghost text-sm border border-dental-border"
              onClick={() => navigate(`/patients/${patientId}`)}>← Profile</button>
            <button className="btn-primary flex items-center gap-2 text-sm"
              onClick={() => setDrawer({})}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              New prescription
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <span className="font-display text-slate-400 font-bold text-2xl leading-none">℞</span>
          </div>
          <p className="font-medium text-slate-700">No prescriptions yet</p>
          <p className="text-dental-muted text-sm mt-1">Issue the first prescription for this patient</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <RxCard key={rx._id} rx={rx}
              onEdit={(r) => setDrawer(r)}
              onDelete={setDeleteTarget}
              onPrint={setPrintRx}
              onDispense={handleDispense} />
          ))}
        </div>
      )}

      {drawer !== null && (
        <RxDrawer
          rx={drawer._id ? drawer : null}
          patientId={patientId}
          staff={staff}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}

      {printRx && (
        <PrintView rx={printRx} clinic={clinic} onClose={() => setPrintRx(null)} />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete prescription"
        message={`Delete ${deleteTarget?.prescriptionNumber}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default Prescriptions;
