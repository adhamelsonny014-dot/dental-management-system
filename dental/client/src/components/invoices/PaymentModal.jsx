import { useState } from "react";
import api from "../../utils/api";
import { currency } from "../../utils/format";
import toast from "react-hot-toast";
import { METHODS, METHOD_ICONS } from "./constants";

// ── Payment modal ──────────────────────────────────────────────────────────────
const PaymentModal = ({ invoice, onClose, onPaid }) => {
  const [form, setForm] = useState({
    amount: Math.max(0, (invoice.amountDue || 0) - (invoice.totalPaid || 0)).toFixed(2),
    method: "cash",
    reference: "",
    notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const balance = Math.max(0, (invoice.amountDue || 0) - (invoice.totalPaid || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(form.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (Number(form.amount) > balance + 0.01) {
      toast.error(`Amount exceeds balance due (${currency(balance)})`);
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/payments", {
        invoice: invoice._id,
        patient: invoice.patient._id,
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference,
        notes: form.notes,
        paymentDate: form.paymentDate,
      });
      toast.success("Payment recorded");
      onPaid(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dental-border">
          <div>
            <h2 className="font-display font-bold text-slate-900">Record payment</h2>
            <p className="text-xs text-dental-muted">
              {invoice.invoiceNumber} · Balance: {currency(balance)}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Amount ($) *</label>
            <input
              className="input text-lg font-semibold"
              type="number"
              name="amount"
              value={form.amount}
              onChange={set}
              min="0.01"
              step="0.01"
              required
            />
            <div className="flex gap-2 mt-1.5">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, amount: ((balance * pct) / 100).toFixed(2) }))}
                  className="text-xs px-2 py-0.5 rounded border border-dental-border text-dental-muted hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  {pct}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, amount: balance.toFixed(2) }))}
                className="text-xs px-2 py-0.5 rounded border border-primary-300 text-primary-600 hover:bg-primary-50 transition-colors"
              >
                Full
              </button>
            </div>
          </div>

          <div>
            <label className="label">Payment method *</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, method: m }))}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-all ${
                    form.method === m
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-dental-border text-dental-muted hover:border-primary-300"
                  }`}
                >
                  <span className="text-lg">{METHOD_ICONS[m]}</span>
                  {m.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                name="paymentDate"
                value={form.paymentDate}
                onChange={set}
              />
            </div>
            <div>
              <label className="label">Reference</label>
              <input
                className="input"
                name="reference"
                value={form.reference}
                onChange={set}
                placeholder="Card last 4, ref #…"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <input
              className="input"
              name="notes"
              value={form.notes}
              onChange={set}
              placeholder="Optional notes"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary px-6" disabled={saving}>
              {saving ? "Recording..." : "Record payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
