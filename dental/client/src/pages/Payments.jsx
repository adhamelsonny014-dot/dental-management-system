import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { currency, fmtDate } from "../utils/format";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";

const METHOD_ICONS = {
  cash: "💵",
  card: "💳",
  "bank-transfer": "🏦",
  insurance: "🏥",
  cheque: "📄",
  other: "💰",
};

const METHOD_STYLES = {
  cash: "bg-green-100 text-green-700",
  card: "bg-blue-100 text-blue-700",
  "bank-transfer": "bg-purple-100 text-purple-700",
  insurance: "bg-teal-100 text-teal-700",
  cheque: "bg-amber-100 text-amber-700",
  other: "bg-slate-100 text-slate-600",
};

const METHODS = ["", "cash", "card", "bank-transfer", "insurance", "cheque", "other"];

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (methodFilter) params.set("method", methodFilter);
      const res = await api.get(`/payments?${params}`);
      setPayments(res.data.payments);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [page, methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);
  useEffect(() => {
    setPage(1);
  }, [methodFilter]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/payments/${deleteTarget._id}`);
      setPayments((p) => p.filter((x) => x._id !== deleteTarget._id));
      setTotal((t) => t - 1);
      toast.success("Payment reversed");
      setDeleteTarget(null);
      setConfirmText("");
    } catch {
      toast.error("Failed to reverse payment");
    } finally {
      setDeleting(false);
    }
  };

  // Summary stats from current page
  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
  const byMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {});

  return (
    <div className="p-8">
      <PageHeader title="Payments" subtitle={`${total} payment record${total !== 1 ? "s" : ""}`} />

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 sm:col-span-1">
          <p className="text-2xl font-display font-bold text-emerald-600">{currency(totalAmount)}</p>
          <p className="text-xs text-dental-muted mt-0.5">Total collected (page)</p>
        </div>
        {Object.entries(byMethod)
          .slice(0, 3)
          .map(([method, amt]) => (
            <div key={method} className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{METHOD_ICONS[method]}</span>
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded capitalize ${METHOD_STYLES[method]}`}
                >
                  {method.replace("-", " ")}
                </span>
              </div>
              <p className="text-lg font-display font-bold text-slate-800">{currency(amt)}</p>
            </div>
          ))}
      </div>

      {/* Method filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {METHODS.map((m) => (
          <button
            key={m}
            onClick={() => setMethodFilter(m)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border capitalize transition-colors ${
              methodFilter === m
                ? "bg-primary-600 text-white border-primary-600"
                : "border-dental-border text-dental-muted hover:border-primary-300"
            }`}
          >
            {m ? (
              <>
                {METHOD_ICONS[m]} {m.replace("-", " ")}
              </>
            ) : (
              "All methods"
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3 text-2xl">
            💳
          </div>
          <p className="font-medium text-slate-700">No payments recorded yet</p>
          <p className="text-dental-muted text-sm mt-1">Record payments from the Invoices page</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-dental-border">
                  {["Receipt", "Patient", "Invoice", "Date", "Method", "Reference", "Amount", ""].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide ${
                        h === "Amount" || h === "" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr
                    key={p._id}
                    className={`border-b border-dental-border last:border-0 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/40"}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.receiptNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">
                        {p.patient?.firstName} {p.patient?.lastName}
                      </p>
                      <p className="text-xs text-dental-muted">{p.patient?.patientNumber}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-primary-600">
                      {p.invoice?.invoiceNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-dental-muted whitespace-nowrap">
                      {fmtDate(p.paymentDate, "dateTime")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full capitalize w-fit ${METHOD_STYLES[p.method]}`}
                      >
                        {METHOD_ICONS[p.method]} {p.method.replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-dental-muted">{p.reference || "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{currency(p.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="text-xs px-2 py-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Reverse payment"
                      >
                        Reverse
                      </button>
                    </td>
                  </tr>
                ))}
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

      {/* Reverse confirm modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div className="card w-full max-w-sm p-6">
            <h3 className="font-display font-bold text-slate-900 text-lg mb-1">Reverse payment</h3>
            <p className="text-sm text-dental-muted mb-1">
              This will reverse{" "}
              <span className="font-semibold text-red-600">{currency(deleteTarget.amount)}</span> from invoice{" "}
              <span className="font-mono">{deleteTarget.invoice?.invoiceNumber}</span> and update its status.
            </p>
            <p className="text-xs text-dental-muted mb-4">
              Type <span className="font-mono font-semibold">REVERSE</span> to confirm.
            </p>
            <input
              className="input mb-4 font-mono"
              placeholder="REVERSE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button
                className="btn-ghost"
                onClick={() => {
                  setDeleteTarget(null);
                  setConfirmText("");
                }}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                onClick={handleDelete}
                disabled={confirmText !== "REVERSE" || deleting}
              >
                {deleting ? "Reversing..." : "Reverse payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
