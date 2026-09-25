import { useState, useEffect } from "react";
import api from "../../utils/api";
import { currency } from "../../utils/format";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import InteractiveMouth from "../../components/InteractiveMouth";
import TreatmentPlanReport from "../../components/TreatmentPlanReport";
import ProcedureRow from "./ProcedureRow";
import { PLAN_STATUSES, EMPTY_PROC } from "./constants";

// ── Plan editor drawer ─────────────────────────────────────────────────────────
const PlanDrawer = ({ plan, patientId, patient, staff, onClose, onSaved }) => {
  const { user } = useAuth();
  const isEdit = Boolean(plan?._id);
  const defaultDentist =
    user?.role === "dentist"
      ? staff.find((s) => s.email === user.email || s.userId === user._id)?._id || ""
      : "";

  const [form, setForm] = useState(
    plan
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
        },
  );
  const [saving, setSaving] = useState(false);
  const [chartTeeth, setChartTeeth] = useState([]);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    api
      .get(`/dental-chart/${patientId}`)
      .then((r) => setChartTeeth(r.data.teeth || []))
      .catch(() => {});
  }, [patientId]);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addProcedure = (toothNum = selectedTooth) =>
    setForm((f) => ({
      ...f,
      procedures: [...f.procedures, { ...EMPTY_PROC, tooth: toothNum || "", _isNew: true }],
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

  const subtotal = form.procedures.reduce((s, p) => s + (p.quantity || 1) * (p.unitCost || 0), 0);
  const discount = Number(form.discount) || 0;
  const grandTotal =
    form.discountType === "percent" ? subtotal - (subtotal * discount) / 100 : subtotal - discount;

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Plan title</label>
              <input
                className="input"
                name="title"
                value={form.title}
                onChange={set}
                placeholder="Treatment Plan"
              />
            </div>
            <div>
              <label className="label">Dentist</label>
              <select className="input" name="dentist" value={form.dentist || ""} onChange={set}>
                <option value="">— Select dentist —</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" name="status" value={form.status} onChange={set}>
                {PLAN_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input resize-none text-sm"
                name="description"
                value={form.description}
                onChange={set}
                rows={2}
                placeholder="Brief overview of the treatment plan..."
              />
            </div>
          </div>

          <section className="card p-4 bg-slate-50/80">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Interactive mouth — tap teeth to add treatment
            </h3>
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
              <button
                type="button"
                onClick={() => addProcedure()}
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add procedure
              </button>
            </header>

            {form.procedures.length === 0 ? (
              <div className="border-2 border-dashed border-dental-border rounded-xl p-8 text-center">
                <p className="text-dental-muted text-sm">No procedures yet</p>
                <button
                  type="button"
                  onClick={addProcedure}
                  className="text-primary-600 text-sm hover:underline mt-1"
                >
                  Add first procedure →
                </button>
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
                <input
                  className="input text-sm w-24"
                  type="number"
                  min={0}
                  name="discount"
                  value={form.discount}
                  onChange={set}
                />
                <select
                  className="input text-sm w-20"
                  name="discountType"
                  value={form.discountType}
                  onChange={set}
                >
                  <option value="flat">$</option>
                  <option value="percent">%</option>
                </select>
              </div>
              <div className="flex justify-between font-bold border-t border-dental-border pt-2">
                <span>Total</span>
                <span className="text-lg font-display text-primary-700">
                  {currency(Math.max(0, grandTotal))}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-none text-sm"
              name="notes"
              value={form.notes}
              onChange={set}
              rows={2}
              placeholder="Internal notes about this plan..."
            />
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
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
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

export default PlanDrawer;
