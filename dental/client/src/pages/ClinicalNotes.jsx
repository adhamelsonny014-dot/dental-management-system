import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { fmtDate } from "../utils/format";
import usePatient from "../hooks/usePatient";
import useDentists from "../hooks/useDentists";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import SOAPForm from "../components/SOAPForm";
import ConfirmModal from "../components/ConfirmModal";

const EMPTY_NOTE = {
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
  procedures: [],
  vitals: { bloodPressure: "", pulse: "", temperature: "" },
  followUpDate: "",
  visitDate: new Date().toISOString().split("T")[0],
  dentist: "",
};

// ── Note card (collapsed view) ────────────────────────────────────────────────
const NoteCard = ({ note, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const hasSoap = note.subjective || note.objective || note.assessment || note.plan;

  return (
    <div className="card p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm">{fmtDate(note.visitDate, "weekday")}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {note.dentist && (
                <span className="text-xs text-dental-muted">
                  Dr. {note.dentist.firstName} {note.dentist.lastName}
                </span>
              )}
              {note.procedures?.length > 0 && (
                <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {note.procedures.length} procedure{note.procedures.length !== 1 ? "s" : ""}
                </span>
              )}
              {note.followUpDate && (
                <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                  Follow-up: {fmtDate(note.followUpDate, "weekday")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => setExpanded((e) => !e)} className="btn-ghost text-xs px-2 py-1">
            {expanded ? "Collapse" : "View"}
          </button>
          <button onClick={() => onEdit(note)} className="btn-ghost text-xs px-2 py-1">
            Edit
          </button>
          <button
            onClick={() => onDelete(note)}
            className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Quick preview line */}
      {!expanded && note.assessment && (
        <p className="text-xs text-dental-muted mt-2 ml-12 truncate">
          <span className="font-medium text-slate-600">Assessment:</span> {note.assessment}
        </p>
      )}

      {/* Expanded SOAP view */}
      {expanded && hasSoap && (
        <div className="mt-4 ml-12 space-y-3">
          {[
            { label: "S", title: "Subjective", value: note.subjective, color: "bg-blue-500" },
            { label: "O", title: "Objective", value: note.objective, color: "bg-emerald-500" },
            { label: "A", title: "Assessment", value: note.assessment, color: "bg-amber-500" },
            { label: "P", title: "Plan", value: note.plan, color: "bg-purple-500" },
          ].map(({ label, title, value, color }) =>
            value ? (
              <div key={label} className="flex gap-2">
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5 ${color}`}
                >
                  {label}
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">{title}</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{value}</p>
                </div>
              </div>
            ) : null,
          )}

          {note.procedures?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {note.procedures.map((p) => (
                <span key={p} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                  {p}
                </span>
              ))}
            </div>
          )}

          {(note.vitals?.bloodPressure || note.vitals?.pulse) && (
            <div className="flex gap-4 text-xs text-dental-muted pt-1">
              {note.vitals.bloodPressure && <span>BP: {note.vitals.bloodPressure}</span>}
              {note.vitals.pulse && <span>Pulse: {note.vitals.pulse} bpm</span>}
              {note.vitals.temperature && <span>Temp: {note.vitals.temperature}°C</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Note editor drawer ────────────────────────────────────────────────────────
const NoteDrawer = ({ note, patientId, staff, onClose, onSaved }) => {
  const isEdit = Boolean(note?._id);
  const [form, setForm] = useState(note || { ...EMPTY_NOTE });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = { ...form, patient: patientId };
      if (!payload.dentist) delete payload.dentist;
      let res;
      if (isEdit) {
        res = await api.put(`/clinical-notes/${note._id}`, payload);
        toast.success("Note updated");
      } else {
        res = await api.post("/clinical-notes", payload);
        toast.success("Note created");
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
      <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dental-border">
          <h2 className="font-display font-bold text-slate-900">
            {isEdit ? "Edit clinical note" : "New clinical note"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 overflow-y-auto space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Visit date</label>
              <input
                className="input"
                type="date"
                value={form.visitDate ? form.visitDate.split("T")[0] : ""}
                onChange={(e) => setForm((f) => ({ ...f, visitDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Dentist</label>
              <select
                className="input"
                value={form.dentist || ""}
                onChange={(e) => setForm((f) => ({ ...f, dentist: e.target.value }))}
              >
                <option value="">— Select dentist —</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <SOAPForm data={form} onChange={setForm} />
        </div>

        <div className="px-6 py-4 border-t border-dental-border flex justify-end gap-3">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary px-6" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create note"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const ClinicalNotes = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const patient = usePatient(patientId);
  const staff = useDentists();
  const [drawer, setDrawer] = useState(null); // null | {} | note
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load patient info + dentists

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/clinical-notes?patient=${patientId}&page=${page}&limit=10`);
      setNotes(res.data.notes);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [patientId, page]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSaved = (saved, mode) => {
    if (mode === "create") {
      setNotes((prev) => [saved, ...prev]);
      setTotal((t) => t + 1);
    } else {
      setNotes((prev) => prev.map((n) => (n._id === saved._id ? saved : n)));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/clinical-notes/${deleteTarget._id}`);
      setNotes((prev) => prev.filter((n) => n._id !== deleteTarget._id));
      setTotal((t) => t - 1);
      toast.success("Note deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="Clinical Notes"
        subtitle={
          patient
            ? `${patient.firstName} ${patient.lastName} · ${patient.patientNumber} · ${total} note${total !== 1 ? "s" : ""}`
            : ""
        }
        action={
          <div className="flex gap-2">
            <button
              className="btn-ghost text-sm border border-dental-border"
              onClick={() => navigate(`/patients/${patientId}`)}
            >
              ← Profile
            </button>
            <button
              className="btn-ghost text-sm border border-dental-border"
              onClick={() => navigate(`/dental-chart/${patientId}`)}
            >
              Dental chart
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setDrawer({})}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New note
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="font-medium text-slate-700">No clinical notes yet</p>
          <p className="text-dental-muted text-sm mt-1">Add the first note for this patient</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <NoteCard key={n._id} note={n} onEdit={(note) => setDrawer(note)} onDelete={setDeleteTarget} />
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
              className="btn-ghost text-sm disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <button
              className="btn-ghost text-sm disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Drawer */}
      {drawer !== null && (
        <NoteDrawer
          note={drawer._id ? drawer : null}
          patientId={patientId}
          staff={staff}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete clinical note"
        message={`Delete note from ${deleteTarget ? fmtDate(deleteTarget.visitDate, "weekday") : ""}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default ClinicalNotes;
