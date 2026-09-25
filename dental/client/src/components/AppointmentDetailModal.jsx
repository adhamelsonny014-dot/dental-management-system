import { useState } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";

const STATUSES = ["scheduled", "confirmed", "in-progress", "completed", "cancelled", "no-show"];

const statusStyle = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  "in-progress": "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-600",
  "no-show": "bg-orange-100 text-orange-700",
};

const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const AppointmentDetailModal = ({ appointment, onClose, onUpdated, onDeleted }) => {
  const [status, setStatus] = useState(appointment.status);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      const res = await api.patch(`/appointments/${appointment._id}/status`, { status: newStatus });
      setStatus(newStatus);
      onUpdated(res.data);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this appointment?")) return;
    setDeleting(true);
    try {
      await api.delete(`/appointments/${appointment._id}`);
      toast.success("Appointment deleted");
      onDeleted(appointment._id);
      onClose();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const p = appointment.patient;
  const d = appointment.dentist;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dental-border">
          <h2 className="font-display font-bold text-slate-900">Appointment</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Status badge */}
          <span
            className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${statusStyle[status]}`}
          >
            {status.replace("-", " ")}
          </span>

          {/* Patient */}
          <div>
            <p className="text-xs text-dental-muted mb-0.5">Patient</p>
            <p className="font-medium text-slate-800">
              {p?.firstName} {p?.lastName}
            </p>
            <p className="text-xs text-dental-muted">
              {p?.patientNumber} · {p?.phone}
            </p>
          </div>

          {/* Dentist */}
          <div>
            <p className="text-xs text-dental-muted mb-0.5">Dentist</p>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: d?.color || "#3b82f6" }}
              />
              <p className="font-medium text-slate-800">
                {d?.firstName} {d?.lastName}
              </p>
            </div>
          </div>

          {/* Times */}
          <div>
            <p className="text-xs text-dental-muted mb-0.5">Time</p>
            <p className="text-sm text-slate-800">{fmtDateTime(appointment.startTime)}</p>
            <p className="text-xs text-dental-muted">to {fmtDateTime(appointment.endTime)}</p>
          </div>

          {appointment.type && (
            <div>
              <p className="text-xs text-dental-muted mb-0.5">Type</p>
              <p className="text-sm text-slate-800 capitalize">{appointment.type.replace("-", " ")}</p>
            </div>
          )}

          {appointment.reason && (
            <div>
              <p className="text-xs text-dental-muted mb-0.5">Reason</p>
              <p className="text-sm text-slate-800">{appointment.reason}</p>
            </div>
          )}

          {/* Status change */}
          <div>
            <p className="text-xs text-dental-muted mb-1.5">Update status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={saving || s === status}
                  className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors ${
                    s === status
                      ? "bg-primary-600 text-white border-primary-600"
                      : "border-dental-border text-dental-muted hover:border-primary-400 hover:text-primary-600"
                  }`}
                >
                  {s.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-dental-border flex justify-between">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
          <button className="btn-ghost text-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailModal;
