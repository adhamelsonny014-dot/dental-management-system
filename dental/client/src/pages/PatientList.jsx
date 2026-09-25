import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import PatientTable from "../components/PatientTable";
import ConfirmModal from "../components/ConfirmModal";

const PatientList = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);

      const res = await api.get(`/patients?${params}`);
      setPatients(res.data.patients);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/patients/${deleteTarget._id}`);
      toast.success("Patient deleted");
      setDeleteTarget(null);
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Patients"
        subtitle={`${total} patient${total !== 1 ? "s" : ""} registered`}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate("/patients/new")}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add patient
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dental-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search by name, phone, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-full sm:w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <PatientTable patients={patients} onDelete={setDeleteTarget} />
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

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete patient"
        message={`Delete ${deleteTarget?.firstName} ${deleteTarget?.lastName}? Their appointments, dental chart, clinical notes, treatment plans, prescriptions, invoices and payments will also be deleted. This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default PatientList;
