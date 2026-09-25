import { useState } from "react";
import { currency } from "../../utils/format";
import { PROC_STATUSES, COMMON_PROCEDURES, PROC_STATUS_STYLES } from "./constants";

// ── Procedure row editor ───────────────────────────────────────────────────────
const ProcedureRow = ({ proc, index, onChange, onRemove, isNew }) => {
  const [open, setOpen] = useState(isNew);

  return (
    <div
      className={`border border-dental-border rounded-lg overflow-hidden ${
        proc.status === "completed" ? "opacity-70" : ""
      }`}
    >
      {/* Summary row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-dental-muted hover:text-slate-700 transition-colors flex-shrink-0"
        >
          <svg
            className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <span className="w-6 h-6 rounded bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{proc.name || "Unnamed procedure"}</p>
          <div className="flex items-center gap-3 text-xs text-dental-muted">
            {proc.tooth && <span>Tooth #{proc.tooth}</span>}
            {proc.surface && <span className="capitalize">{proc.surface}</span>}
            <span>Qty: {proc.quantity}</span>
          </div>
        </div>

        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${PROC_STATUS_STYLES[proc.status] || "bg-slate-100 text-slate-500"}`}
        >
          {proc.status || "pending"}
        </span>

        <span className="text-sm font-semibold text-slate-800 flex-shrink-0 w-20 text-right">
          {currency(proc.quantity * proc.unitCost)}
        </span>

        <button
          type="button"
          onClick={onRemove}
          className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0 p-1"
        >
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
            <input
              className="input text-sm"
              list="proc-list"
              value={proc.name}
              onChange={(e) => onChange({ ...proc, name: e.target.value })}
              placeholder="Select or type procedure"
            />
            <datalist id="proc-list">
              {COMMON_PROCEDURES.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label text-xs">Status</label>
            <select
              className="input text-sm"
              value={proc.status || "pending"}
              onChange={(e) => onChange({ ...proc, status: e.target.value })}
            >
              {PROC_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Tooth # (optional)</label>
            <input
              className="input text-sm"
              type="number"
              min={1}
              max={32}
              value={proc.tooth || ""}
              onChange={(e) => onChange({ ...proc, tooth: e.target.value })}
              placeholder="1–32"
            />
          </div>
          <div>
            <label className="label text-xs">Surface</label>
            <input
              className="input text-sm"
              value={proc.surface || ""}
              onChange={(e) => onChange({ ...proc, surface: e.target.value })}
              placeholder="mesial, occlusal…"
            />
          </div>
          <div>
            <label className="label text-xs">Quantity</label>
            <input
              className="input text-sm"
              type="number"
              min={1}
              value={proc.quantity}
              onChange={(e) => onChange({ ...proc, quantity: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label text-xs">Unit cost ($)</label>
            <input
              className="input text-sm"
              type="number"
              min={0}
              step={0.01}
              value={proc.unitCost}
              onChange={(e) => onChange({ ...proc, unitCost: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label text-xs">Line total</label>
            <div className="input text-sm bg-slate-100 text-slate-600 font-medium">
              {currency(proc.quantity * proc.unitCost)}
            </div>
          </div>
          <div className="sm:col-span-3">
            <label className="label text-xs">Notes</label>
            <input
              className="input text-sm"
              value={proc.notes || ""}
              onChange={(e) => onChange({ ...proc, notes: e.target.value })}
              placeholder="Optional procedure notes"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcedureRow;
