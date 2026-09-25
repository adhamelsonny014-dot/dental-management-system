const STATUS_STYLES = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  "in-progress": "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-600",
  "no-show": "bg-orange-100 text-orange-700",
  sent: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-600",
  read: "bg-slate-100 text-slate-500",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
};

const StatusBadge = ({ status, className = "" }) => (
  <span
    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600"} ${className}`}
  >
    {status?.replace(/-/g, " ")}
  </span>
);

export default StatusBadge;
