import { useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";

const ROLES = ["dentist", "admin", "receptionist", "assistant"];

const ROLE_STYLES = {
  dentist:      "bg-blue-100 text-blue-700",
  admin:        "bg-rose-100 text-rose-700",
  receptionist: "bg-amber-100 text-amber-700",
  assistant:    "bg-green-100 text-green-700",
};

const RoleBadge = ({ role }) => (
  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_STYLES[role] || "bg-slate-100 text-slate-600"}`}>
    {role}
  </span>
);

const EMPTY_FORM = { name: "", email: "", password: "", role: "dentist" };

// ── Slide-over Drawer ──────────────────────────────────────────────────────────
const AccountDrawer = ({ account, onClose, onSaved }) => {
  const isEdit = Boolean(account?._id);
  const [form, setForm]     = useState(
    isEdit
      ? { name: account.name, email: account.email, role: account.role, isActive: account.isActive, password: "" }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        const payload = { name: form.name, email: form.email, role: form.role, isActive: form.isActive };
        if (form.password?.length >= 6) payload.password = form.password;
        const res = await api.put(`/auth/admin/accounts/${account._id}`, payload);
        onSaved(res.data, "update");
        toast.success("Account updated");
      } else {
        const res = await api.post("/auth/admin/create-account", form);
        onSaved(res.data, "create");
        toast.success(`Account created for ${res.data.name}`);
      }
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
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dental-border">
          <div>
            <h2 className="font-display font-bold text-slate-900">
              {isEdit ? "Edit account" : "Create login account"}
            </h2>
            <p className="text-xs text-dental-muted mt-0.5">
              {isEdit ? "Update credentials or role" : "Create a portal login for a staff member"}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="label">Full name *</label>
            <input
              className="input" name="name" value={form.name} onChange={set}
              required placeholder="Dr. Ahmed Hassan"
            />
          </div>
          <div>
            <label className="label">Email *</label>
            <input
              className="input" type="email" name="email" value={form.email} onChange={set}
              required placeholder="doctor@clinic.com"
            />
          </div>
          <div>
            <label className="label">Role *</label>
            <select className="input" name="role" value={form.role} onChange={set}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">
              {isEdit ? "New password (leave blank to keep current)" : "Password *"}
            </label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPw ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={set}
                placeholder={isEdit ? "••••••••" : "Min. 6 characters"}
                required={!isEdit}
                minLength={isEdit ? undefined : 6}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dental-muted hover:text-slate-600"
              >
                {showPw ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox" id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded border-dental-border text-primary-600"
              />
              <label htmlFor="isActive" className="text-sm text-slate-700">Account active</label>
            </div>
          )}

          {!isEdit && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
              <strong>Tip:</strong> Share the email and password directly with the staff member. They can log in immediately at <span className="font-mono">/login</span>.
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-dental-border flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary px-6" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const DoctorAccounts = () => {
  const [accounts,     setAccounts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [drawer,       setDrawer]       = useState(null); // null=closed, {}=new, {_id}=edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [roleFilter,   setRoleFilter]   = useState("");
  const [search,       setSearch]       = useState("");

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/admin/accounts");
      setAccounts(res.data);
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSaved = (saved, mode) => {
    if (mode === "create") setAccounts((a) => [saved, ...a]);
    else setAccounts((a) => a.map((u) => u._id === saved._id ? saved : u));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/auth/admin/accounts/${deleteTarget._id}`);
      setAccounts((a) => a.filter((u) => u._id !== deleteTarget._id));
      toast.success("Account deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = accounts.filter((u) => {
    const matchRole = roleFilter ? u.role === roleFilter : true;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Login Accounts"
        subtitle={`${accounts.length} account${accounts.length !== 1 ? "s" : ""} · admin-managed portals`}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={() => setDrawer({})}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New account
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dental-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9 text-sm"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Role chips */}
        <div className="flex gap-2 flex-wrap">
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
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <p className="font-medium text-slate-700">No accounts found</p>
          <p className="text-dental-muted text-sm mt-1">
            {search || roleFilter ? "Try clearing your filters" : "Create the first login account above"}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dental-border bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-dental-muted uppercase text-xs tracking-wide">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-dental-muted uppercase text-xs tracking-wide hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-dental-muted uppercase text-xs tracking-wide">Role</th>
                <th className="text-left px-5 py-3 font-semibold text-dental-muted uppercase text-xs tracking-wide hidden lg:table-cell">Last login</th>
                <th className="text-left px-5 py-3 font-semibold text-dental-muted uppercase text-xs tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-dental-border">
              {filtered.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center font-display font-bold text-primary-700 text-xs flex-shrink-0">
                        {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900 truncate max-w-[160px]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-dental-muted truncate max-w-[200px] hidden sm:table-cell">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-5 py-3.5 text-dental-muted hidden lg:table-cell">{formatDate(u.lastLogin)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setDrawer(u)}
                        className="btn-ghost text-xs px-2.5 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="text-xs px-2.5 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      {drawer !== null && (
        <AccountDrawer
          account={drawer._id ? drawer : null}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete account"
        message={`Permanently delete the login account for ${deleteTarget?.name}? They will no longer be able to sign in.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default DoctorAccounts;
