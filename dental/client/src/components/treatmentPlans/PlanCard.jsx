import { currency, fmtDate } from "../../utils/format";
import { STATUS_STYLES } from "./constants";

// ── Plan card (list view) ──────────────────────────────────────────────────────
const PlanCard = ({ plan, onOpen, onDelete }) => (
  <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onOpen(plan)}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-semibold text-slate-800 truncate">{plan.title}</h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[plan.status]}`}
          >
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
            <div
              key={p._id}
              className={`flex-1 ${
                p.status === "completed"
                  ? "bg-emerald-400"
                  : p.status === "in-progress"
                    ? "bg-amber-400"
                    : p.status === "cancelled"
                      ? "bg-red-300"
                      : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-dental-muted mt-1">
          {plan.procedures.filter((p) => p.status === "completed").length} / {plan.procedures.length}{" "}
          completed
        </p>
      </div>
    )}

    <div className="flex gap-2 mt-3 pt-3 border-t border-dental-border" onClick={(e) => e.stopPropagation()}>
      <button className="btn-ghost text-xs px-2 py-1" onClick={() => onOpen(plan)}>
        Edit
      </button>
      <button
        className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
        onClick={() => onDelete(plan)}
      >
        Delete
      </button>
    </div>
  </div>
);

export default PlanCard;
