import { useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";

const ROLES = ["dentist","assistant","receptionist","hygienist","manager"];
const SPECIALIZATIONS = ["General Dentistry","Orthodontics","Endodontics","Periodontics","Oral Surgery","Pediatric Dentistry","Prosthodontics","Cosmetic Dentistry",""];
const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

const EMPTY_MEMBER = {
  firstName: "", lastName: "", role: "dentist", specialization: "",
  phone: "", email: "", nationalId: "", color: "#3b82f6", isActive: true, notes: "",
  schedule: DAYS.map((day, i) => ({
    day, open: i < 6, start: "09:00", end: i === 4 ? "17:00" : i === 5 ? "14:00" : "18:00",
  })),
};

const RoleBadge = ({ role }) => {
  const map = {
    dentist:       "bg-blue-100 text-blue-700",
    assistant:     "bg-green-100 text-green-700",
    receptionist:  "bg-amber-100 text-amber-700",
    hygienist:     "bg-purple-100 text-purple-700",
    manager:       "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${map[role] || "bg-slate-100 text-slate-600"}`}>
      {role}
    </span>
  );
};

// ── Slide-over drawer for add/edit ──────────────────────────────────────────
const StaffDrawer = ({ member, onClose, onSaved }) => {
  const isEdit = Boolean(member?._id);
  const [form, setForm]     = useState(member || EMPTY_MEMBER);
  const [saving, setSaving] = useState(false);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const setSchedule = (i, field, value) => {
    const s = [...form.schedule];
    s[i] = { ...s[i], [field]: value };
    setForm((f) => ({ ...f, schedule: s }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        const res = await api.put(`/staff/${member._id}`, form);
        onSaved(res.data, "update");
      } else {
        const res = await api.post("/staff", form);
        onSaved(res.data, "create");
      }
      toast.success(isEdit ? "Staff updated" : "Staff added");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />
      {/* Drawer */}
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dental-border">
          <h2 className="font-display font-bold text-slate-900">{isEdit ? "Edit staff member" : "Add staff member"}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Basic */}
          <div>
            <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-3">Basic information</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name *</label>
                <input className="input" name="firstName" value={form.firstName} onChange={set} required placeholder="Ahmed" />
              </div>
              <div>
                <label className="label">Last name *</label>
                <input className="input" name="lastName" value={form.lastName} onChange={set} required placeholder="Hassan" />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" name="role" value={form.role} onChange={set}>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Specialization</label>
                <select className="input" name="specialization" value={form.specialization} onChange={set}>
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s || "—"}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" name="phone" value={form.phone} onChange={set} placeholder="+20 100 000 0000" />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" name="email" value={form.email} onChange={set} placeholder="dr@clinic.com" />
              </div>
            </div>
          </div>

          {/* Calendar color */}
          <div>
            <label className="label">Calendar color</label>
            <div className="flex gap-2 mt-1">
              {COLORS.map((c) => (
                <button
                  type="button" key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-3">Working schedule</p>
            <div className="space-y-2">
              {(form.schedule || []).map((slot, i) => (
                <div key={slot.day} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer w-32">
                    <div className="relative flex-shrink-0">
                      <input type="checkbox" className="sr-only" checked={slot.open}
                        onChange={(e) => setSchedule(i, "open", e.target.checked)} />
                      <div className={`w-9 h-5 rounded-full transition-colors ${slot.open ? "bg-primary-600" : "bg-slate-200"}`} />
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${slot.open ? "translate-x-4" : ""}`} />
                    </div>
                    <span className={`text-sm capitalize ${slot.open ? "text-slate-700 font-medium" : "text-dental-muted"}`}>{slot.day}</span>
                  </label>
                  {slot.open ? (
                    <div className="flex items-center gap-2">
                      <input type="time" className="input w-24 text-sm py-1" value={slot.start} onChange={(e) => setSchedule(i, "start", e.target.value)} />
                      <span className="text-dental-muted text-xs">–</span>
                      <input type="time" className="input w-24 text-sm py-1" value={slot.end}   onChange={(e) => setSchedule(i, "end",   e.target.value)} />
                    </div>
                  ) : (
                    <span className="text-xs text-dental-muted italic">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" name="notes" value={form.notes} onChange={set} rows={2} placeholder="Optional notes..." />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded border-dental-border text-primary-600" />
              <label htmlFor="isActive" className="text-sm text-slate-700">Active staff member</label>
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-dental-border flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary px-6" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add staff"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const StaffManagement = () => {
  const [staff,        setStaff]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [drawerMember, setDrawerMember] = useState(null); // null=closed, {}=add, {_id}=edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [roleFilter,   setRoleFilter]   = useState("");
  const [creatingLogin, setCreatingLogin] = useState(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = roleFilter ? `?role=${roleFilter}` : "";
      const res = await api.get(`/staff${params}`);
      setStaff(res.data);
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, [roleFilter]);

  const handleSaved = (saved, mode) => {
    if (mode === "create") setStaff((s) => [...s, saved]);
    else setStaff((s) => s.map((m) => m._id === saved._id ? saved : m));
  };

  const handleCreateLogin = async (member) => {
    if (!member.email?.trim()) {
      toast.error("Add an email to this staff member before creating a login");
      return;
    }
    setCreatingLogin(member._id);
    try {
      const res = await api.post(`/staff/${member._id}/create-account`, {});
      setStaff((s) => s.map((m) => (m._id === member._id ? res.data.staff : m)));
      toast.success(`Login created for ${res.data.login.email}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create login");
    } finally {
      setCreatingLogin(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/staff/${deleteTarget._id}`);
      setStaff((s) => s.filter((m) => m._id !== deleteTarget._id));
      toast.success("Staff member removed");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Staff"
        subtitle={`${staff.length} team member${staff.length !== 1 ? "s" : ""}`}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={() => setDrawerMember({})}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add staff
          </button>
        }
      />

      {/* Role filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["", ...ROLES].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              roleFilter === r
                ? "bg-primary-600 text-white border-primary-600"
                : "border-dental-border text-dental-muted hover:border-primary-300 hover:text-slate-700"
            }`}
          >
            {r ? r.charAt(0).toUpperCase() + r.slice(1) : "All roles"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : staff.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="font-medium text-slate-700">No staff members yet</p>
          <p className="text-dental-muted text-sm mt-1">Add your first team member to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {staff.map((m) => (
            <div key={m._id} className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
              {/* Avatar with color dot */}
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center font-display font-bold text-primary-700">
                  {m.firstName[0]}{m.lastName[0]}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                  style={{ background: m.color }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{m.firstName} {m.lastName}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <RoleBadge role={m.role} />
                  {m.userId && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Has login
                    </span>
                  )}
                  {!m.isActive && <span className="text-xs text-dental-muted">(inactive)</span>}
                </div>
                {m.specialization && <p className="text-xs text-dental-muted mt-1 truncate">{m.specialization}</p>}
                {m.phone && <p className="text-xs text-dental-muted mt-0.5">{m.phone}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <button onClick={() => setDrawerMember(m)} className="btn-ghost text-xs px-2 py-1">Edit</button>
                {!m.userId && (m.role === "dentist" || m.role === "assistant" || m.role === "hygienist") && (
                  <button
                    type="button"
                    onClick={() => handleCreateLogin(m)}
                    disabled={creatingLogin === m._id}
                    className="text-xs px-2 py-1 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                  >
                    {creatingLogin === m._id ? "Creating…" : "Create login"}
                  </button>
                )}
                <button onClick={() => setDeleteTarget(m)} className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerMember !== null && (
        <StaffDrawer
          member={drawerMember._id ? drawerMember : null}
          onClose={() => setDrawerMember(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remove staff member"
        message={`Remove ${deleteTarget?.firstName} ${deleteTarget?.lastName} from the team?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default StaffManagement;
