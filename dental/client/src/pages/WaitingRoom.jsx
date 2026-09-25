import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const STATUS_FLOW = {
  scheduled: ["confirmed", "cancelled", "no-show"],
  confirmed: ["in-progress", "cancelled", "no-show"],
  "in-progress": ["completed", "no-show"],
  completed: [],
  cancelled: [],
  "no-show": [],
};

const STATUS_ACTIONS = {
  confirmed: { label: "Confirm", color: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  "in-progress": { label: "Start", color: "bg-amber-500 hover:bg-amber-600 text-white" },
  completed: { label: "Complete", color: "bg-slate-600 hover:bg-slate-700 text-white" },
  cancelled: { label: "Cancel", color: "bg-red-500 hover:bg-red-600 text-white" },
  "no-show": { label: "No-show", color: "bg-orange-500 hover:bg-orange-600 text-white" },
};

const fmtTime = (d) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const minutesUntil = (d) => {
  const diff = new Date(d) - new Date();
  return Math.round(diff / 60000);
};

const QueueCard = ({ appointment, onStatusChange, updating }) => {
  const p = appointment.patient;
  const dr = appointment.dentist;
  const min = minutesUntil(appointment.startTime);
  const nextStatuses = STATUS_FLOW[appointment.status] || [];

  return (
    <div
      className={`card p-5 transition-all ${appointment.status === "in-progress" ? "ring-2 ring-amber-400" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Patient info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
            {p?.firstName?.[0]}
            {p?.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              {p?.firstName} {p?.lastName}
            </p>
            <p className="text-xs text-dental-muted">
              {p?.patientNumber} · {p?.phone || "No phone"}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StatusBadge status={appointment.status} />
              <span className="text-xs text-dental-muted capitalize">
                {appointment.type?.replace(/-/g, " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-slate-800 text-sm">{fmtTime(appointment.startTime)}</p>
          <p className="text-xs text-dental-muted">{fmtTime(appointment.endTime)}</p>
          {appointment.status === "scheduled" || appointment.status === "confirmed" ? (
            <p
              className={`text-xs font-medium mt-0.5 ${
                min < 0 ? "text-red-500" : min <= 15 ? "text-amber-500" : "text-dental-muted"
              }`}
            >
              {min < 0 ? `${Math.abs(min)}m late` : min === 0 ? "Now" : `in ${min}m`}
            </p>
          ) : null}
        </div>
      </div>

      {/* Dentist */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dental-border">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: dr?.color || "#3b82f6" }}
        />
        <span className="text-xs text-dental-muted">
          Dr. {dr?.firstName} {dr?.lastName}
        </span>
        {appointment.reason && (
          <span className="text-xs text-dental-muted truncate ml-auto">
            &ldquo;{appointment.reason}&rdquo;
          </span>
        )}
      </div>

      {/* Action buttons */}
      {nextStatuses.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {nextStatuses.map((s) => {
            const action = STATUS_ACTIONS[s];
            if (!action) return null;
            return (
              <button
                key={s}
                onClick={() => onStatusChange(appointment._id, s)}
                disabled={updating === appointment._id}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${action.color}`}
              >
                {updating === appointment._id ? "..." : action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Summary bar ───────────────────────────────────────────────────────────────
const SummaryBar = ({ appointments }) => {
  const counts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const items = [
    { label: "Total today", value: appointments.length, color: "text-slate-700" },
    { label: "Waiting", value: (counts.scheduled || 0) + (counts.confirmed || 0), color: "text-blue-600" },
    { label: "In progress", value: counts["in-progress"] || 0, color: "text-amber-600" },
    { label: "Completed", value: counts.completed || 0, color: "text-emerald-600" },
    { label: "No-shows", value: counts["no-show"] || 0, color: "text-orange-600" },
    { label: "Cancelled", value: counts.cancelled || 0, color: "text-red-500" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
      {items.map((item) => (
        <div key={item.label} className="card p-4 text-center">
          <p className={`text-2xl font-display font-bold ${item.color}`}>{item.value}</p>
          <p className="text-xs text-dental-muted mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const FILTER_OPTIONS = ["all", "scheduled", "confirmed", "in-progress", "completed", "cancelled", "no-show"];

const WaitingRoom = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchToday = useCallback(async () => {
    try {
      const res = await api.get("/appointments?today=true");
      setAppointments(res.data);
      setLastRefresh(new Date());
    } catch {
      toast.error("Failed to load today's appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchToday, 60000);
    return () => clearInterval(interval);
  }, [fetchToday]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id);
    try {
      const res = await api.patch(`/appointments/${id}/status`, { status: newStatus });
      setAppointments((prev) => prev.map((a) => (a._id === id ? res.data : a)));
      toast.success(`Marked as ${newStatus.replace(/-/g, " ")}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  // Sort: in-progress first, then by time
  const sorted = [...filtered].sort((a, b) => {
    const priority = {
      "in-progress": 0,
      confirmed: 1,
      scheduled: 2,
      completed: 3,
      "no-show": 4,
      cancelled: 5,
    };
    if (priority[a.status] !== priority[b.status]) return priority[a.status] - priority[b.status];
    return new Date(a.startTime) - new Date(b.startTime);
  });

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="p-8">
      <PageHeader
        title="Waiting Room"
        subtitle={today}
        action={
          <button
            onClick={fetchToday}
            className="btn-ghost flex items-center gap-2 text-sm border border-dental-border"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
            <span className="text-xs text-dental-muted">
              {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <SummaryBar appointments={appointments} />

          {/* Filter tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-sm px-3 py-1.5 rounded-full border capitalize transition-colors ${
                  filter === f
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-dental-border text-dental-muted hover:border-primary-300 hover:text-slate-700"
                }`}
              >
                {f === "all" ? "All" : f.replace(/-/g, " ")}
                {f !== "all" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    {appointments.filter((a) => a.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {sorted.length === 0 ? (
            <div className="card p-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="font-medium text-slate-700">
                {filter === "all" ? "No appointments today" : `No ${filter.replace(/-/g, " ")} appointments`}
              </p>
              <p className="text-dental-muted text-sm mt-1">
                {filter === "all" ? "Book appointments from the calendar page" : "Try a different filter"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sorted.map((appt) => (
                <QueueCard
                  key={appt._id}
                  appointment={appt}
                  onStatusChange={handleStatusChange}
                  updating={updating}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WaitingRoom;
