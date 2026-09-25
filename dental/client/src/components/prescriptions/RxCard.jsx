import { fmtDate } from "../../utils/format";

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
          <p className="text-xs text-dental-muted">{fmtDate(rx.issueDate, "long")}</p>
          {rx.dentist && (
            <p className="text-xs text-dental-muted">
              Dr. {rx.dentist.firstName} {rx.dentist.lastName}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {rx.medications.map((m, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {m.name}
                {m.dosage ? ` ${m.dosage}` : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
        {rx.isDispensed ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            Dispensed
          </span>
        ) : (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Not dispensed
          </span>
        )}
      </div>
    </div>

    <div className="flex gap-2 mt-3 pt-3 border-t border-dental-border">
      <button className="btn-ghost text-xs px-2 py-1" onClick={() => onPrint(rx)}>
        Print
      </button>
      <button className="btn-ghost text-xs px-2 py-1" onClick={() => onEdit(rx)}>
        Edit
      </button>
      {!rx.isDispensed && (
        <button
          onClick={() => onDispense(rx._id)}
          className="text-xs px-2 py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 font-medium transition-colors"
        >
          Mark dispensed
        </button>
      )}
      <button
        onClick={() => onDelete(rx)}
        className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors ml-auto"
      >
        Delete
      </button>
    </div>
  </div>
);

export default RxCard;
