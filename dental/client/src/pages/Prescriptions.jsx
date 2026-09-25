import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import useClinic from "../hooks/useClinic";
import usePatient from "../hooks/usePatient";
import useDentists from "../hooks/useDentists";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";
import PrintView from "../components/prescriptions/PrintView";
import RxCard from "../components/prescriptions/RxCard";
import RxDrawer from "../components/prescriptions/RxDrawer";

// ── Main page ──────────────────────────────────────────────────────────────────
const Prescriptions = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const patient = usePatient(patientId);
  const clinic = useClinic();
  const staff = useDentists();
  const [drawer, setDrawer] = useState(null);
  const [printRx, setPrintRx] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRx = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/prescriptions?patient=${patientId}`);
      setPrescriptions(res.data.prescriptions);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchRx();
  }, [fetchRx]);

  const handleSaved = (saved, mode) => {
    if (mode === "create") setPrescriptions((p) => [saved, ...p]);
    else setPrescriptions((p) => p.map((x) => (x._id === saved._id ? saved : x)));
  };

  const handleDispense = async (id) => {
    try {
      const res = await api.patch(`/prescriptions/${id}/dispense`);
      setPrescriptions((p) => p.map((x) => (x._id === id ? res.data : x)));
      toast.success("Marked as dispensed");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/prescriptions/${deleteTarget._id}`);
      setPrescriptions((p) => p.filter((x) => x._id !== deleteTarget._id));
      toast.success("Prescription deleted");
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
        title="Prescriptions"
        subtitle={
          patient
            ? `${patient.firstName} ${patient.lastName} · ${patient.patientNumber} · ${total} prescription${total !== 1 ? "s" : ""}`
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
            <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setDrawer({})}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New prescription
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <span className="font-display text-slate-400 font-bold text-2xl leading-none">℞</span>
          </div>
          <p className="font-medium text-slate-700">No prescriptions yet</p>
          <p className="text-dental-muted text-sm mt-1">Issue the first prescription for this patient</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <RxCard
              key={rx._id}
              rx={rx}
              onEdit={(r) => setDrawer(r)}
              onDelete={setDeleteTarget}
              onPrint={setPrintRx}
              onDispense={handleDispense}
            />
          ))}
        </div>
      )}

      {drawer !== null && (
        <RxDrawer
          rx={drawer._id ? drawer : null}
          patientId={patientId}
          staff={staff}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}

      {printRx && <PrintView rx={printRx} clinic={clinic} onClose={() => setPrintRx(null)} />}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete prescription"
        message={`Delete ${deleteTarget?.prescriptionNumber}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default Prescriptions;
