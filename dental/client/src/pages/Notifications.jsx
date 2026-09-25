import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { fmtDate } from "../utils/format";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const CHANNELS = ["", "email", "sms", "in-app"];
const STATUSES = ["", "pending", "sent", "failed", "read"];
const NOTIF_TYPES = [
  "appointment_reminder",
  "appointment_confirmed",
  "appointment_cancelled",
  "appointment_rescheduled",
  "general",
];

const TYPE_ICONS = {
  appointment_reminder: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  appointment_confirmed: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  appointment_cancelled: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  appointment_rescheduled:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  general:
    "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
};

const CHANNEL_ICONS = {
  email:
    "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  sms: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  "in-app":
    "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
};

// ── Compose Modal ─────────────────────────────────────────────────────────────
const ComposeModal = ({ onClose, onSent }) => {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    type: "general",
    channel: "in-app",
    subject: "",
    body: "",
    "recipient.name": "",
    "recipient.contact": "",
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = patientSearch.trim() ? `?search=${patientSearch}&limit=20` : "?limit=30";
    api
      .get(`/patients${q}`)
      .then((r) => setPatients(r.data.patients))
      .catch(() => {});
  }, [patientSearch]);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.body.trim()) {
      toast.error("Message body is required");
      return;
    }
    setSending(true);
    try {
      const payload = {
        type: form.type,
        channel: form.channel,
        subject: form.subject,
        body: form.body,
        recipient: {
          name: form["recipient.name"],
          contact: form["recipient.contact"],
        },
      };
      const res = await api.post("/notifications", payload);
      // The server records whether the message was really delivered
      if (res.data.status === "sent") toast.success("Notification sent");
      else toast.error(`Saved but not delivered: ${res.data.error || res.data.status}`);
      onSent(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dental-border">
          <h2 className="font-display font-bold text-slate-900">New notification</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSend} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" name="type" value={form.type} onChange={set}>
                {NOTIF_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Channel</label>
              <select className="input" name="channel" value={form.channel} onChange={set}>
                {["email", "sms", "in-app"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label className="label">Recipient — search patient</label>
            <input
              className="input mb-1.5"
              placeholder="Search patient..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            <select
              className="input"
              onChange={(e) => {
                const p = patients.find((x) => x._id === e.target.value);
                if (p)
                  setForm((f) => ({
                    ...f,
                    "recipient.name": `${p.firstName} ${p.lastName}`,
                    "recipient.contact": form.channel === "email" ? p.email : p.phone,
                  }));
              }}
            >
              <option value="">— or pick from list —</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Recipient name</label>
              <input
                className="input"
                name="recipient.name"
                value={form["recipient.name"]}
                onChange={set}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="label">
                {form.channel === "email" ? "Email" : form.channel === "sms" ? "Phone" : "Identifier"}
              </label>
              <input
                className="input"
                name="recipient.contact"
                value={form["recipient.contact"]}
                onChange={set}
                placeholder={form.channel === "email" ? "email@example.com" : "+20 100 000 0000"}
              />
            </div>
          </div>

          {form.channel === "email" && (
            <div>
              <label className="label">Subject</label>
              <input
                className="input"
                name="subject"
                value={form.subject}
                onChange={set}
                placeholder="Email subject"
              />
            </div>
          )}

          <div>
            <label className="label">Message *</label>
            <textarea
              className="input resize-none"
              name="body"
              value={form.body}
              onChange={set}
              rows={4}
              required
              placeholder="Type your message here..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary px-6" disabled={sending}>
              {sending ? "Sending..." : "Send notification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [compose, setCompose] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (channelFilter) params.set("channel", channelFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/notifications?${params}`);
      setNotifications(res.data.notifications);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page, channelFilter, statusFilter]);

  useEffect(() => {
    fetch();
  }, [fetch]);
  useEffect(() => {
    setPage(1);
  }, [channelFilter, statusFilter]);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, status: "read" } : n)));
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setTotal((t) => t - 1);
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleSent = (notif) => {
    setNotifications((prev) => [notif, ...prev]);
    setTotal((t) => t + 1);
  };

  const unread = notifications.filter((n) => n.status !== "read").length;

  return (
    <div className="p-8">
      <PageHeader
        title={
          <span>
            Notifications{" "}
            {unread > 0 && (
              <span className="ml-2 text-sm font-normal bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                {unread} unread
              </span>
            )}
          </span>
        }
        subtitle={`${total} total notifications`}
        action={
          <div className="flex gap-2">
            {unread > 0 && (
              <button className="btn-ghost text-sm border border-dental-border" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
            <button className="btn-primary flex items-center gap-2" onClick={() => setCompose(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New notification
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select
          className="input w-36 text-sm"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
        >
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c ? c.charAt(0).toUpperCase() + c.slice(1) : "All channels"}
            </option>
          ))}
        </select>
        <select
          className="input w-36 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All statuses"}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <p className="font-medium text-slate-700">No notifications yet</p>
          <p className="text-dental-muted text-sm mt-1">
            Send your first notification using the button above
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`card p-4 flex items-start gap-4 transition-all ${n.status !== "read" ? "border-primary-200 bg-primary-50/30" : ""}`}
            >
              {/* Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.status === "read" ? "bg-slate-100" : "bg-primary-100"
                }`}
              >
                <svg
                  className={`w-4 h-4 ${n.status === "read" ? "text-slate-400" : "text-primary-600"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={TYPE_ICONS[n.type] || TYPE_ICONS.general}
                  />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-medium text-slate-700 capitalize">
                    {n.type?.replace(/_/g, " ")}
                  </span>
                  <StatusBadge status={n.status} />
                  <span className="flex items-center gap-1 text-xs text-dental-muted">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={CHANNEL_ICONS[n.channel] || CHANNEL_ICONS["in-app"]}
                      />
                    </svg>
                    {n.channel}
                  </span>
                </div>
                {n.subject && <p className="text-sm font-medium text-slate-800 mb-0.5">{n.subject}</p>}
                <p className="text-sm text-slate-600 line-clamp-2">{n.body}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-dental-muted">{fmtDate(n.createdAt, "shortDateTime")}</span>
                  {n.recipient?.name && (
                    <span className="text-xs text-dental-muted">→ {n.recipient.name}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                {n.status !== "read" && (
                  <button
                    onClick={() => handleMarkRead(n._id)}
                    className="btn-ghost text-xs px-2 py-1 whitespace-nowrap"
                  >
                    Mark read
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n._id)}
                  className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-dental-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Previous
            </button>
            <button
              className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {compose && <ComposeModal onClose={() => setCompose(false)} onSent={handleSent} />}
    </div>
  );
};

export default Notifications;
