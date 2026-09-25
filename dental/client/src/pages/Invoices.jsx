import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { currency, fmtDate } from "../utils/format";
import useClinic from "../hooks/useClinic";
import useDentists from "../hooks/useDentists";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";
import PaymentModal from "../components/invoices/PaymentModal";
import InvoicePrint from "../components/invoices/InvoicePrint";
import InvoiceDrawer from "../components/invoices/InvoiceDrawer";
import { STATUS_STYLES } from "../components/invoices/constants";

// ── Main page ──────────────────────────────────────────────────────────────────
const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const staff = useDentists();
  const clinic = useClinic();
  const [statusFilter, setStatusFilter] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [printInv, setPrintInv] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get("/patients?limit=200")
      .then((r) => setPatients(r.data.patients))
      .catch(() => {});
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/invoices?${params}`);
      setInvoices(res.data.invoices);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleSaved = (saved, mode) => {
    if (mode === "create") {
      setInvoices((p) => [saved, ...p]);
      setTotal((t) => t + 1);
    } else setInvoices((p) => p.map((x) => (x._id === saved._id ? saved : x)));
  };

  const handlePaid = async (payment) => {
    // Reload invoice to get updated status + totalPaid
    try {
      const res = await api.get(`/invoices/${payment.invoice._id || payment.invoice}`);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv._id === (payment.invoice._id || payment.invoice)
            ? { ...res.data, payments: res.data.payments, totalPaid: res.data.totalPaid }
            : inv,
        ),
      );
    } catch {
      fetchInvoices();
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/invoices/${deleteTarget._id}`);
      setInvoices((p) => p.filter((x) => x._id !== deleteTarget._id));
      setTotal((t) => t - 1);
      toast.success("Invoice deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // Summary stats
  const totalDue = invoices
    .filter((i) => !["paid", "cancelled", "draft"].includes(i.status))
    .reduce((s, i) => s + Math.max(0, (i.amountDue || 0) - (i.totalPaid || 0)), 0);
  const totalPaidAll = invoices.reduce((s, i) => s + (i.totalPaid || 0), 0);

  return (
    <div className="p-8">
      <PageHeader
        title="Invoices"
        subtitle={`${total} invoice${total !== 1 ? "s" : ""}`}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={() => setDrawer({})}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New invoice
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total invoices", value: total, color: "text-slate-800" },
          { label: "Outstanding", value: currency(totalDue), color: "text-red-600" },
          { label: "Collected", value: currency(totalPaidAll), color: "text-emerald-600" },
          {
            label: "Unpaid count",
            value: invoices.filter((i) => ["sent", "partial", "overdue"].includes(i.status)).length,
            color: "text-amber-600",
          },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-dental-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["", "draft", "sent", "partial", "paid", "overdue", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-full border capitalize transition-colors ${
              statusFilter === s
                ? "bg-primary-600 text-white border-primary-600"
                : "border-dental-border text-dental-muted hover:border-primary-300"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
              />
            </svg>
          </div>
          <p className="font-medium text-slate-700">No invoices found</p>
          <p className="text-dental-muted text-sm mt-1">Create your first invoice or change filters</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-dental-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Invoice
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Patient
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Total
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Paid
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Balance
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => {
                  const balance = Math.max(0, (inv.amountDue || 0) - (inv.totalPaid || 0));
                  return (
                    <tr
                      key={inv._id}
                      className={`border-b border-dental-border last:border-0 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/40"}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-600">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {inv.patient?.firstName} {inv.patient?.lastName}
                        </p>
                        <p className="text-xs text-dental-muted">{inv.patient?.patientNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-dental-muted text-xs">{fmtDate(inv.issueDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[inv.status]}`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{currency(inv.amountDue)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                        {currency(inv.totalPaid)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${balance > 0 ? "text-red-500" : "text-emerald-600"}`}
                      >
                        {balance > 0 ? currency(balance) : "Paid ✓"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {["sent", "partial", "overdue"].includes(inv.status) && (
                            <button
                              onClick={() => setPayModal(inv)}
                              className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
                            >
                              Pay
                            </button>
                          )}
                          <button onClick={() => setPrintInv(inv)} className="btn-ghost text-xs px-2 py-1">
                            Print
                          </button>
                          <button onClick={() => setDrawer(inv)} className="btn-ghost text-xs px-2 py-1">
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(inv)}
                            className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

      {/* Modals */}
      {drawer !== null && (
        <InvoiceDrawer
          invoice={drawer._id ? drawer : null}
          patients={patients}
          staff={staff}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}

      {payModal && <PaymentModal invoice={payModal} onClose={() => setPayModal(null)} onPaid={handlePaid} />}

      {printInv && <InvoicePrint invoice={printInv} clinic={clinic} onClose={() => setPrintInv(null)} />}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete invoice"
        message={`Delete ${deleteTarget?.invoiceNumber}? All associated payments will also be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default Invoices;
