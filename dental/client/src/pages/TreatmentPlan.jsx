import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import usePatient from "../hooks/usePatient";
import useDentists from "../hooks/useDentists";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";
import PlanCard from "../components/treatmentPlans/PlanCard";
import PlanDrawer from "../components/treatmentPlans/PlanDrawer";

// ── Main page ──────────────────────────────────────────────────────────────────
const TreatmentPlan = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const patient = usePatient(patientId);
  const staff = useDentists();
  const [drawer, setDrawer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/treatment-plans?patient=${patientId}`);
      setPlans(res.data.plans);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load treatment plans");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSaved = (saved, mode) => {
    if (mode === "create") setPlans((p) => [saved, ...p]);
    else setPlans((p) => p.map((x) => (x._id === saved._id ? saved : x)));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/treatment-plans/${deleteTarget._id}`);
      setPlans((p) => p.filter((x) => x._id !== deleteTarget._id));
      toast.success("Plan deleted");
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
        title="Treatment Plans"
        subtitle={
          patient
            ? `${patient.firstName} ${patient.lastName} · ${patient.patientNumber} · ${total} plan${total !== 1 ? "s" : ""}`
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
              onClick={() => navigate(`/clinical-notes/${patientId}`)}
            >
              Notes
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setDrawer({})}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New plan
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <p className="font-medium text-slate-700">No treatment plans yet</p>
          <p className="text-dental-muted text-sm mt-1">Create the first plan for this patient</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <PlanCard key={plan._id} plan={plan} onOpen={(p) => setDrawer(p)} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {drawer !== null && (
        <PlanDrawer
          plan={drawer._id ? drawer : null}
          patientId={patientId}
          patient={patient}
          staff={staff}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete treatment plan"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default TreatmentPlan;
