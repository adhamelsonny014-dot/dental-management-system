import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";
import InteractiveMouth from "../components/InteractiveMouth";
import TreatmentPlanReport from "../components/TreatmentPlanReport";

const PLAN_STATUSES  = ["draft","proposed","approved","in-progress","completed","cancelled"];
const PROC_STATUSES  = ["pending","approved","in-progress","completed","cancelled"];

const COMMON_PROCEDURES = [
  "Examination","X-ray (Periapical)","X-ray (Panoramic)","Prophylaxis / Cleaning",
  "Scaling & Root Planing","Composite Filling","Amalgam Filling","Tooth Extraction",
  "Surgical Extraction","Root Canal Treatment","Crown (Ceramic)","Crown (Metal)",
  "Crown (PFM)","Bridge (per unit)","Implant Placement","Implant Crown",
  "Partial Denture","Complete Denture","Teeth Whitening","Orthodontic Consultation",
  "Orthodontic Bracket Placement","Orthodontic Monthly Adjustment","Veneer","Inlay / Onlay",
];

const STATUS_STYLES = {
  draft:        "bg-slate-100 text-slate-600",
  proposed:     "bg-blue-100 text-blue-700",
  approved:     "bg-emerald-100 text-emerald-700",
  "in-progress":"bg-amber-100 text-amber-700",
  completed:    "bg-teal-100 text-teal-700",
  cancelled:    "bg-red-100 text-red-600",
  pending:      "bg-slate-100 text-slate-500",
};

const PROC_STATUS_STYLES = {
  pending:      "bg-slate-100 text-slate-500",
  approved:     "bg-blue-100 text-blue-700",
  "in-progress":"bg-amber-100 text-amber-700",
  completed:    "bg-emerald-100 text-emerald-700",
  cancelled:    "bg-red-100 text-red-600",
};

const currency = (n) => `$${Number(n || 0).toFixed(2)}`;

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US",
  { month: "short", day: "numeric", year: "numeric" }) : "—";

// ── Empty procedure ────────────────────────────────────────────────────────────
const EMPTY_PROC = { name: "", tooth: "", surface: "", quantity: 1, unitCost: 0, notes: "" };

// ── Procedure row editor ───────────────────────────────────────────────────────
const ProcedureRow = ({ proc, index, onChange, onRemove, isNew }) => {
  const [open, setOpen] = useState(isNew);

  return (
    <div className={`border border-dental-border rounded-lg overflow-hidden ${
      proc.status === "completed" ? "opacity-70" : ""
    }`}>
      {/* Summary row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
        <button type="button" onClick={() => setOpen((o) => !o)}
          className="text-dental-muted hover:text-slate-700 transition-colors flex-shrink-0">
          <svg className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <span className="w-6 h-6 rounded bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{proc.name || "Unnamed procedure"}</p>
          <div className="flex items-center gap-3 text-xs text-dental-muted">
            {proc.tooth  && <span>Tooth #{proc.tooth}</span>}
            {proc.surface && <span className="capitalize">{proc.surface}</span>}
            <span>Qty: {proc.quantity}</span>
          </div>
        </div>

        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${PROC_STATUS_STYLES[proc.status] || "bg-slate-100 text-slate-500"}`}>
          {proc.status || "pending"}
        </span>

        <span className="text-sm font-semibold text-slate-800 flex-shrink-0 w-20 text-right">
          {currency(proc.quantity * proc.unitCost)}
        </span>

        <button type="button" onClick={onRemove}
          className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0 p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Expanded editor */}
      {open && (
        <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-dental-border grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="label text-xs">Procedure name *</label>
            <input className="input text-sm" list="proc-list"
              value={proc.name}
              onChange={(e) => onChange({ ...proc, name: e.target.value })}
              placeholder="Select or type procedure" />
            <datalist id="proc-list">
              {COMMON_PROCEDURES.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>
          <div>
            <label className="label text-xs">Status</label>
            <select className="input text-sm" value={proc.status || "pending"}
              onChange={(e) => onChange({ ...proc, status: e.target.value })}>
              {PROC_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Tooth # (optional)</label>
            <input className="input text-sm" type="number" min={1} max={32}
              value={proc.tooth || ""}
              onChange={(e) => onChange({ ...proc, tooth: e.target.value })}
              placeholder="1–32" />
          </div>
          <div>
            <label className="label text-xs">Surface</label>
            <input className="input text-sm"
              value={proc.surface || ""}
              onChange={(e) => onChange({ ...proc, surface: e.target.value })}
              placeholder="mesial, occlusal…" />
          </div>
          <div>
            <label className="label text-xs">Quantity</label>
            <input className="input text-sm" type="number" min={1}
              value={proc.quantity}
              onChange={(e) => onChange({ ...proc, quantity: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label text-xs">Unit cost ($)</label>
            <input className="input text-sm" type="number" min={0} step={0.01}
              value={proc.unitCost}
              onChange={(e) => onChange({ ...proc, unitCost: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label text-xs">Line total</label>
            <div className="input text-sm bg-slate-100 text-slate-600 font-medium">
              {currency(proc.quantity * proc.unitCost)}
            </div>
          </div>
          <div className="sm:col-span-3">
            <label className="label text-xs">Notes</label>
            <input className="input text-sm"
              value={proc.notes || ""}
              onChange={(e) => onChange({ ...proc, notes: e.target.value })}
              placeholder="Optional procedure notes" />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Plan card (list view) ──────────────────────────────────────────────────────
const PlanCard = ({ plan, onOpen, onDelete }) => (
  <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onOpen(plan)}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-semibold text-slate-800 truncate">{plan.title}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[plan.status]}`}>
            {plan.status}
          </span>
        </div>
        <p className="text-xs text-dental-muted">
          {plan.procedures?.length || 0} procedure{plan.procedures?.length !== 1 ? "s" : ""}
          {plan.dentist ? ` · Dr. ${plan.dentist.firstName} ${plan.dentist.lastName}` : ""}
          {" · "}Created {fmtDate(plan.createdAt)}
        </p>
        {plan.approvedAt && (
          <p className="text-xs text-emerald-600 mt-0.5">Approved {fmtDate(plan.approvedAt)}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-display font-bold text-slate-900">{currency(plan.grandTotal)}</p>
        {plan.discount > 0 && (
          <p className="text-xs text-dental-muted line-through">{currency(plan.subtotal)}</p>
        )}
      </div>
    </div>

    {/* Procedure progress bar */}
    {plan.procedures?.length > 0 && (
      <div className="mt-3">
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
          {plan.procedures.map((p) => (
            <div key={p._id} className={`flex-1 ${
              p.status === "completed"  ? "bg-emerald-400" :
              p.status === "in-progress"? "bg-amber-400"  :
              p.status === "cancelled"  ? "bg-red-300"    : "bg-slate-200"
            }`} />
          ))}
        </div>
        <p className="text-xs text-dental-muted mt-1">
          {plan.procedures.filter((p) => p.status === "completed").length} / {plan.procedures.length} completed
        </p>
      </div>
    )}

    <div className="flex gap-2 mt-3 pt-3 border-t border-dental-border" onClick={(e) => e.stopPropagation()}>
      <button className="btn-ghost text-xs px-2 py-1" onClick={() => onOpen(plan)}>Edit</button>
      <button className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
        onClick={() => onDelete(plan)}>Delete</button>
    </div>
  </div>
);

// ── Plan editor drawer ─────────────────────────────────────────────────────────
const PlanDrawer = ({ plan, patientId, patient, staff, onClose, onSaved }) => {
  const { user } = useAuth();
  const isEdit = Boolean(plan?._id);
  const defaultDentist =
    user?.role === "dentist"
      ? staff.find((s) => s.email === user.email || s.userId === user._id)?._id || ""
      : "";

  const [form, setForm] = useState(plan
    ? { ...plan, procedures: plan.procedures?.map((p) => ({ ...p })) || [] }
    : {
        title: "Treatment Plan",
        description: "",
        status: "draft",
        dentist: defaultDentist,
        procedures: [],
        discount: 0,
        discountType: "flat",
        notes: "",
      }
  );
  const [saving, setSaving] = useState(false);
  const [chartTeeth, setChartTeeth] = useState([]);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    api.get(`/dental-chart/${patientId}`).then((r) => setChartTeeth(r.data.teeth || [])).catch(() => {});
  }, [patientId]);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addProcedure = (toothNum = selectedTooth) =>
    setForm((f) => ({
      ...f,
      procedures: [
        ...f.procedures,
        { ...EMPTY_PROC, tooth: toothNum || "", _isNew: true },
      ],
    }));

  const handleToothClick = (num) => {
    setSelectedTooth(num);
    const existing = form.procedures.findIndex((p) => Number(p.tooth) === num);
    if (existing === -1) {
      addProcedure(num);
      toast.success(`Procedure added for tooth #${num}`);
    }
  };

  const updateProc = (i, updated) =>
    setForm((f) => {
      const procs = [...f.procedures];
      procs[i] = updated;
      return { ...f, procedures: procs };
    });

  const removeProc = (i) =>
    setForm((f) => ({ ...f, procedures: f.procedures.filter((_, idx) => idx !== i) }));

  const subtotal   = form.procedures.reduce((s, p) => s + (p.quantity || 1) * (p.unitCost || 0), 0);
  const discount   = Number(form.discount) || 0;
  const grandTotal = form.discountType === "percent"
    ? subtotal - (subtotal * discount) / 100
    : subtotal - discount;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = { ...form, patient: patientId };
      if (!payload.dentist) delete payload.dentist;
      // strip _isNew helper flag
      payload.procedures = payload.procedures.map(({ _isNew, ...p }) => p);

      let res;
      if (isEdit) {
        res = await api.put(`/treatment-plans/${plan._id}`, payload);
        toast.success("Treatment plan updated");
      } else {
        res = await api.post("/treatment-plans", payload);
        toast.success("Treatment plan created");
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
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dental-border sticky top-0 bg-white z-10">
          <h2 className="font-display font-bold text-slate-900">
            {isEdit ? "Edit treatment plan" : "New treatment plan"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Plan title</label>
              <input className="input" name="title" value={form.title} onChange={set} placeholder="Treatment Plan" />
            </div>
            <div>
              <label className="label">Dentist</label>
              <select className="input" name="dentist" value={form.dentist || ""} onChange={set}>
                <option value="">— Select dentist —</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" name="status" value={form.status} onChange={set}>
                {PLAN_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input resize-none text-sm" name="description" value={form.description}
                onChange={set} rows={2} placeholder="Brief overview of the treatment plan..." />
            </div>
          </div>

          <section className="card p-4 bg-slate-50/80">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Interactive mouth — tap teeth to add treatment</h3>
            <InteractiveMouth
              mode="plan"
              chartTeeth={chartTeeth}
              procedures={form.procedures}
              selectedToothNumber={selectedTooth}
              onToothClick={handleToothClick}
              compact
            />
          </section>

          {/* Procedures */}
          <article>
            <header className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Procedures</h3>
              <button type="button" onClick={() => addProcedure()}
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                Add procedure
              </button>
            </header>

            {form.procedures.length === 0 ? (
              <div className="border-2 border-dashed border-dental-border rounded-xl p-8 text-center">
                <p className="text-dental-muted text-sm">No procedures yet</p>
                <button type="button" onClick={addProcedure}
                  className="text-primary-600 text-sm hover:underline mt-1">Add first procedure →</button>
              </div>
            ) : (
              <div className="space-y-2">
                {form.procedures.map((proc, i) => (
                  <ProcedureRow
                    key={i}
                    proc={proc}
                    index={i}
                    isNew={proc._isNew}
                    onChange={(updated) => updateProc(i, updated)}
                    onRemove={() => removeProc(i)}
                  />
                ))}
              </div>
            )}
          </article>

          {/* Pricing summary */}
          {form.procedures.length > 0 && (
            <div className="card p-4 bg-slate-50">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-dental-muted">Subtotal</span>
                <span className="font-medium">{currency(subtotal)}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-dental-muted">Discount</span>
                <input className="input text-sm w-24" type="number" min={0}
                  name="discount" value={form.discount} onChange={set} />
                <select className="input text-sm w-20" name="discountType" value={form.discountType} onChange={set}>
                  <option value="flat">$</option>
                  <option value="percent">%</option>
                </select>
              </div>
              <div className="flex justify-between font-bold border-t border-dental-border pt-2">
                <span>Total</span>
                <span className="text-lg font-display text-primary-700">{currency(Math.max(0, grandTotal))}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none text-sm" name="notes" value={form.notes}
              onChange={set} rows={2} placeholder="Internal notes about this plan..." />
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-dental-border flex justify-between gap-3 bg-white">
          {isEdit ? (
            <button type="button" className="btn-ghost text-sm" onClick={() => setShowReport(true)}>
              Generate report
            </button>
          ) : (
            <span />
          )}
          <section className="flex gap-3">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-primary px-6" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create plan"}
            </button>
          </section>
        </footer>

        {showReport && isEdit ? (
          <TreatmentPlanReport
            plan={form}
            patient={patient}
            chartTeeth={chartTeeth}
            onClose={() => setShowReport(false)}
          />
        ) : null}
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────
const TreatmentPlan = () => {
  const { patientId } = useParams();
  const navigate      = useNavigate();

  const [plans,        setPlans]        = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [patient,      setPatient]      = useState(null);
  const [staff,        setStaff]        = useState([]);
  const [drawer,       setDrawer]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => {
    api.get(`/patients/${patientId}`).then((r) => setPatient(r.data)).catch(() => {});
    api.get("/staff?role=dentist").then((r) => setStaff(r.data)).catch(() => {});
  }, [patientId]);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/treatment-plans?patient=${patientId}`);
      setPlans(res.data.plans);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load treatment plans");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleSaved = (saved, mode) => {
    if (mode === "create") setPlans((p) => [saved, ...p]);
    else setPlans((p) => p.map((x) => x._id === saved._id ? saved : x));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/treatment-plans/${deleteTarget._id}`);
      setPlans((p) => p.filter((x) => x._id !== deleteTarget._id));
      toast.success("Plan deleted");
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
        title="Treatment Plans"
        subtitle={patient
          ? `${patient.firstName} ${patient.lastName} · ${patient.patientNumber} · ${total} plan${total !== 1 ? "s" : ""}`
          : ""}
        action={
          <div className="flex gap-2">
            <button className="btn-ghost text-sm border border-dental-border"
              onClick={() => navigate(`/patients/${patientId}`)}>← Profile</button>
            <button className="btn-ghost text-sm border border-dental-border"
              onClick={() => navigate(`/clinical-notes/${patientId}`)}>Notes</button>
            <button className="btn-primary flex items-center gap-2 text-sm"
              onClick={() => setDrawer({})}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              New plan
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <p className="font-medium text-slate-700">No treatment plans yet</p>
          <p className="text-dental-muted text-sm mt-1">Create the first plan for this patient</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <PlanCard key={plan._id} plan={plan}
              onOpen={(p) => setDrawer(p)}
              onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {drawer !== null && (
        <PlanDrawer
          plan={drawer._id ? drawer : null}
          patientId={patientId}
          patient={patient}
          staff={staff}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete treatment plan"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default TreatmentPlan;
