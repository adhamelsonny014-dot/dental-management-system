import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";

const STATUS_STYLES = {
  draft:     "bg-slate-100 text-slate-600",
  sent:      "bg-blue-100 text-blue-700",
  partial:   "bg-amber-100 text-amber-700",
  paid:      "bg-emerald-100 text-emerald-700",
  overdue:   "bg-red-100 text-red-600",
  cancelled: "bg-slate-100 text-slate-400 line-through",
};

const METHODS = ["cash","card","bank-transfer","insurance","cheque","other"];
const METHOD_ICONS = {
  cash: "💵", card: "💳", "bank-transfer": "🏦",
  insurance: "🏥", cheque: "📄", other: "💰",
};

const currency = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("en-US",
  { month: "short", day: "numeric", year: "numeric" }) : "—";

// ── Payment modal ──────────────────────────────────────────────────────────────
const PaymentModal = ({ invoice, onClose, onPaid }) => {
  const [form, setForm] = useState({
    amount: Math.max(0, (invoice.amountDue || 0) - (invoice.totalPaid || 0)).toFixed(2),
    method: "cash", reference: "", notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const balance = Math.max(0, (invoice.amountDue || 0) - (invoice.totalPaid || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(form.amount) <= 0) { toast.error("Amount must be greater than 0"); return; }
    if (Number(form.amount) > balance + 0.01) {
      toast.error(`Amount exceeds balance due (${currency(balance)})`); return;
    }
    setSaving(true);
    try {
      const res = await api.post("/payments", {
        invoice: invoice._id,
        patient: invoice.patient._id,
        amount:  Number(form.amount),
        method:  form.method,
        reference: form.reference,
        notes:   form.notes,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dental-border">
          <div>
            <h2 className="font-display font-bold text-slate-900">Record payment</h2>
            <p className="text-xs text-dental-muted">{invoice.invoiceNumber} · Balance: {currency(balance)}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Amount ($) *</label>
            <input className="input text-lg font-semibold" type="number" name="amount"
              value={form.amount} onChange={set} min="0.01" step="0.01" required />
            <div className="flex gap-2 mt-1.5">
              {[25, 50, 75, 100].map((pct) => (
                <button key={pct} type="button"
                  onClick={() => setForm((f) => ({ ...f, amount: ((balance * pct) / 100).toFixed(2) }))}
                  className="text-xs px-2 py-0.5 rounded border border-dental-border text-dental-muted hover:border-primary-400 hover:text-primary-600 transition-colors">
                  {pct}%
                </button>
              ))}
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, amount: balance.toFixed(2) }))}
                className="text-xs px-2 py-0.5 rounded border border-primary-300 text-primary-600 hover:bg-primary-50 transition-colors">
                Full
              </button>
            </div>
          </div>

          <div>
            <label className="label">Payment method *</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button key={m} type="button"
                  onClick={() => setForm((f) => ({ ...f, method: m }))}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-all ${
                    form.method === m
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-dental-border text-dental-muted hover:border-primary-300"
                  }`}>
                  <span className="text-lg">{METHOD_ICONS[m]}</span>
                  {m.replace("-"," ")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" name="paymentDate" value={form.paymentDate} onChange={set} />
            </div>
            <div>
              <label className="label">Reference</label>
              <input className="input" name="reference" value={form.reference} onChange={set}
                placeholder="Card last 4, ref #…" />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <input className="input" name="notes" value={form.notes} onChange={set} placeholder="Optional notes" />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary px-6" disabled={saving}>
              {saving ? "Recording..." : "Record payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Invoice print view ─────────────────────────────────────────────────────────
const InvoicePrint = ({ invoice, clinic, onClose }) => (
  <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-8">
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{clinic?.name || "Dental Clinic"}</h1>
          <p className="text-sm text-dental-muted">{clinic?.address}{clinic?.city ? `, ${clinic.city}` : ""}</p>
          <p className="text-sm text-dental-muted">{clinic?.phone}</p>
          <p className="text-sm text-dental-muted">{clinic?.email}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-bold text-slate-800">INVOICE</p>
          <p className="font-mono font-semibold text-primary-600 mt-1">{invoice.invoiceNumber}</p>
          <div className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[invoice.status]}`}>
            {invoice.status}
          </div>
        </div>
      </div>

      {/* Bill to / From */}
      <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
        <div>
          <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-2">Bill to</p>
          <p className="font-semibold text-slate-800">{invoice.patient?.firstName} {invoice.patient?.lastName}</p>
          <p className="text-dental-muted">{invoice.patient?.patientNumber}</p>
          <p className="text-dental-muted">{invoice.patient?.phone}</p>
          <p className="text-dental-muted">{invoice.patient?.email}</p>
          {invoice.patient?.address && <p className="text-dental-muted">{invoice.patient.address}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-2">Details</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-dental-muted">Issue date:</span>
              <span className="font-medium">{fmtDate(invoice.issueDate)}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between">
                <span className="text-dental-muted">Due date:</span>
                <span className="font-medium">{fmtDate(invoice.dueDate)}</span>
              </div>
            )}
            {invoice.dentist && (
              <div className="flex justify-between">
                <span className="text-dental-muted">Dentist:</span>
                <span className="font-medium">Dr. {invoice.dentist.firstName} {invoice.dentist.lastName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line items */}
      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="border-b-2 border-slate-800">
            <th className="text-left pb-2 font-semibold text-slate-700">Description</th>
            <th className="text-center pb-2 font-semibold text-slate-700 w-16">Tooth</th>
            <th className="text-center pb-2 font-semibold text-slate-700 w-16">Qty</th>
            <th className="text-right pb-2 font-semibold text-slate-700 w-24">Unit price</th>
            <th className="text-right pb-2 font-semibold text-slate-700 w-24">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems?.map((item, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-2.5 text-slate-700">{item.description}</td>
              <td className="py-2.5 text-center text-dental-muted">{item.tooth || "—"}</td>
              <td className="py-2.5 text-center text-dental-muted">{item.quantity}</td>
              <td className="py-2.5 text-right text-dental-muted">{currency(item.unitPrice)}</td>
              <td className="py-2.5 text-right font-medium">{currency(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-dental-muted">Subtotal</span>
            <span>{currency(invoice.subtotal)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount {invoice.discountType === "percent" ? `(${invoice.discount}%)` : ""}</span>
              <span>−{currency(invoice.discountAmount)}</span>
            </div>
          )}
          {invoice.taxRate > 0 && (
            <div className="flex justify-between">
              <span className="text-dental-muted">Tax ({invoice.taxRate}%)</span>
              <span>{currency(invoice.taxAmount)}</span>
            </div>
          )}
          {invoice.insuranceCoverage > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Insurance ({invoice.insuranceProvider || "coverage"})</span>
              <span>−{currency(invoice.insuranceCoverage)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-slate-300 pt-2">
            <span>Amount due</span>
            <span className="text-primary-700">{currency(invoice.amountDue)}</span>
          </div>
          {invoice.totalPaid > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Paid</span>
              <span>−{currency(invoice.totalPaid)}</span>
            </div>
          )}
          {invoice.totalPaid < invoice.amountDue && (
            <div className="flex justify-between font-bold text-red-600 border-t border-slate-200 pt-1.5">
              <span>Balance</span>
              <span>{currency(invoice.amountDue - invoice.totalPaid)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payments history */}
      {invoice.payments?.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-2">Payment history</p>
          <div className="space-y-1">
            {invoice.payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{METHOD_ICONS[p.method]}</span>
                  <span className="capitalize text-dental-muted">{p.method.replace("-"," ")}</span>
                  {p.reference && <span className="text-xs text-slate-400">({p.reference})</span>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-dental-muted">{fmtDate(p.paymentDate)}</span>
                  <span className="font-semibold text-emerald-600">{currency(p.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invoice.notes && (
        <div className="mb-8 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
          <p className="font-medium text-slate-700 mb-0.5">Notes</p>
          {invoice.notes}
        </div>
      )}

      <div className="flex gap-3 justify-center print:hidden">
        <button className="btn-primary px-6" onClick={() => window.print()}>🖨️ Print</button>
        <button className="btn-ghost border border-dental-border" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

// ── Invoice drawer editor ──────────────────────────────────────────────────────
const EMPTY_ITEM = { description: "", tooth: "", quantity: 1, unitPrice: 0 };

const InvoiceDrawer = ({ invoice, patients, staff, onClose, onSaved }) => {
  const isEdit = Boolean(invoice?._id);
  const [form, setForm] = useState(invoice
    ? { ...invoice, lineItems: invoice.lineItems?.map((i) => ({ ...i })) || [] }
    : {
        patient: "", dentist: "", issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        status: "draft", lineItems: [{ ...EMPTY_ITEM }],
        discount: 0, discountType: "flat", taxRate: 0,
        insuranceCoverage: 0, insuranceProvider: "", notes: "",
      }
  );
  const [saving, setSaving] = useState(false);
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addItem    = () => setForm((f) => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_ITEM }] }));
  const updateItem = (i, item) => setForm((f) => {
    const items = [...f.lineItems]; items[i] = item; return { ...f, lineItems: items };
  });
  const removeItem = (i) => setForm((f) => ({ ...f, lineItems: f.lineItems.filter((_, j) => j !== i) }));

  const subtotal    = form.lineItems.reduce((s, i) => s + (i.quantity || 1) * (i.unitPrice || 0), 0);
  const discAmt     = form.discountType === "percent" ? (subtotal * Number(form.discount)) / 100 : Number(form.discount);
  const taxAmt      = ((subtotal - discAmt) * Number(form.taxRate)) / 100;
  const grandTotal  = Math.max(0, subtotal - discAmt + taxAmt);
  const amountDue   = Math.max(0, grandTotal - Number(form.insuranceCoverage));

  const handleSubmit = async () => {
    if (!form.patient) { toast.error("Patient is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.dentist) delete payload.dentist;
      let res;
      if (isEdit) {
        res = await api.put(`/invoices/${invoice._id}`, payload);
        toast.success("Invoice updated");
      } else {
        res = await api.post("/invoices", payload);
        toast.success("Invoice created");
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
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dental-border sticky top-0 bg-white z-10">
          <h2 className="font-display font-bold text-slate-900">{isEdit ? "Edit invoice" : "New invoice"}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Patient *</label>
              <select className="input" name="patient" value={form.patient} onChange={set} required>
                <option value="">— Select patient —</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.patientNumber})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Dentist</label>
              <select className="input" name="dentist" value={form.dentist || ""} onChange={set}>
                <option value="">— Select dentist —</option>
                {staff.map((s) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" name="status" value={form.status} onChange={set}>
                {["draft","sent","partial","paid","overdue","cancelled"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Issue date</label>
              <input className="input" type="date" name="issueDate"
                value={form.issueDate?.split("T")[0] || ""} onChange={set} />
            </div>
            <div>
              <label className="label">Due date</label>
              <input className="input" type="date" name="dueDate"
                value={form.dueDate?.split("T")[0] || ""} onChange={set} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Line items</h3>
              <button type="button" onClick={addItem}
                className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                Add item
              </button>
            </div>

            {form.lineItems.length === 0 ? (
              <div className="border-2 border-dashed border-dental-border rounded-xl p-6 text-center">
                <button type="button" onClick={addItem} className="text-primary-600 text-sm hover:underline">
                  Add first line item →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {form.lineItems.map((item, i) => (
                  <div key={i} className="card p-3 grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      {i === 0 && <label className="label text-xs">Description</label>}
                      <input className="input text-sm" value={item.description}
                        onChange={(e) => updateItem(i, { ...item, description: e.target.value })}
                        placeholder="Procedure / service" />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="label text-xs">Tooth</label>}
                      <input className="input text-sm" type="number" min={1} max={32}
                        value={item.tooth || ""} placeholder="—"
                        onChange={(e) => updateItem(i, { ...item, tooth: e.target.value })} />
                    </div>
                    <div className="col-span-1">
                      {i === 0 && <label className="label text-xs">Qty</label>}
                      <input className="input text-sm" type="number" min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, { ...item, quantity: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="label text-xs">Price ($)</label>}
                      <input className="input text-sm" type="number" min={0} step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, { ...item, unitPrice: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-1">
                      {i === 0 && <label className="label text-xs">Total</label>}
                      <div className="input text-sm bg-slate-50 text-slate-600 text-right">
                        {currency(item.quantity * item.unitPrice)}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button type="button" onClick={() => removeItem(i)}
                        className="text-red-400 hover:text-red-600 p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="card p-4 bg-slate-50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Discount</label>
                <div className="flex gap-2">
                  <input className="input text-sm flex-1" type="number" min={0}
                    name="discount" value={form.discount} onChange={set} />
                  <select className="input text-sm w-16" name="discountType" value={form.discountType} onChange={set}>
                    <option value="flat">$</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label text-xs">Tax rate (%)</label>
                <input className="input text-sm" type="number" min={0} max={100}
                  name="taxRate" value={form.taxRate} onChange={set} />
              </div>
              <div>
                <label className="label text-xs">Insurance coverage ($)</label>
                <input className="input text-sm" type="number" min={0}
                  name="insuranceCoverage" value={form.insuranceCoverage} onChange={set} />
              </div>
              <div>
                <label className="label text-xs">Insurance provider</label>
                <input className="input text-sm" name="insuranceProvider"
                  value={form.insuranceProvider} onChange={set} placeholder="Optional" />
              </div>
            </div>
            <div className="pt-2 border-t border-dental-border space-y-1 text-sm">
              <div className="flex justify-between text-dental-muted">
                <span>Subtotal</span><span>{currency(subtotal)}</span>
              </div>
              {discAmt > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span><span>−{currency(discAmt)}</span>
                </div>
              )}
              {taxAmt > 0 && (
                <div className="flex justify-between text-dental-muted">
                  <span>Tax</span><span>+{currency(taxAmt)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Amount due</span>
                <span className="text-primary-700">{currency(amountDue)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none text-sm" name="notes" value={form.notes}
              onChange={set} rows={2} placeholder="Payment terms, notes for patient..." />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-dental-border flex justify-end gap-3 bg-white">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary px-6" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create invoice"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────
const Invoices = () => {
  const navigate = useNavigate();

  const [invoices,     setInvoices]     = useState([]);
  const [total,        setTotal]        = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [patients,     setPatients]     = useState([]);
  const [staff,        setStaff]        = useState([]);
  const [clinic,       setClinic]       = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [drawer,       setDrawer]       = useState(null);
  const [payModal,     setPayModal]     = useState(null);
  const [printInv,     setPrintInv]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => {
    api.get("/patients?limit=200").then((r) => setPatients(r.data.patients)).catch(() => {});
    api.get("/staff?role=dentist").then((r) => setStaff(r.data)).catch(() => {});
    api.get("/clinic").then((r) => setClinic(r.data)).catch(() => {});
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

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const handleSaved = (saved, mode) => {
    if (mode === "create") { setInvoices((p) => [saved, ...p]); setTotal((t) => t + 1); }
    else setInvoices((p) => p.map((x) => x._id === saved._id ? saved : x));
  };

  const handlePaid = async (payment) => {
    // Reload invoice to get updated status + totalPaid
    try {
      const res = await api.get(`/invoices/${payment.invoice._id || payment.invoice}`);
      setInvoices((prev) => prev.map((inv) =>
        inv._id === (payment.invoice._id || payment.invoice)
          ? { ...res.data, payments: res.data.payments, totalPaid: res.data.totalPaid }
          : inv
      ));
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
  const totalDue  = invoices.filter((i) => !["paid","cancelled","draft"].includes(i.status))
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            New invoice
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total invoices",  value: total,                    color: "text-slate-800" },
          { label: "Outstanding",     value: currency(totalDue),       color: "text-red-600" },
          { label: "Collected",       value: currency(totalPaidAll),   color: "text-emerald-600" },
          { label: "Unpaid count",    value: invoices.filter((i) => ["sent","partial","overdue"].includes(i.status)).length, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-dental-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["","draft","sent","partial","paid","overdue","cancelled"].map((s) => (
          <button key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-full border capitalize transition-colors ${
              statusFilter === s
                ? "bg-primary-600 text-white border-primary-600"
                : "border-dental-border text-dental-muted hover:border-primary-300"
            }`}>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Invoice</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Paid</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Balance</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => {
                  const balance = Math.max(0, (inv.amountDue || 0) - (inv.totalPaid || 0));
                  return (
                    <tr key={inv._id}
                      className={`border-b border-dental-border last:border-0 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/40"}`}>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-600">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{inv.patient?.firstName} {inv.patient?.lastName}</p>
                        <p className="text-xs text-dental-muted">{inv.patient?.patientNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-dental-muted text-xs">{fmtDate(inv.issueDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[inv.status]}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{currency(inv.amountDue)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">{currency(inv.totalPaid)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${balance > 0 ? "text-red-500" : "text-emerald-600"}`}>
                        {balance > 0 ? currency(balance) : "Paid ✓"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {["sent","partial","overdue"].includes(inv.status) && (
                            <button onClick={() => setPayModal(inv)}
                              className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors">
                              Pay
                            </button>
                          )}
                          <button onClick={() => setPrintInv(inv)} className="btn-ghost text-xs px-2 py-1">Print</button>
                          <button onClick={() => setDrawer(inv)} className="btn-ghost text-xs px-2 py-1">Edit</button>
                          <button onClick={() => setDeleteTarget(inv)}
                            className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
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
          <p className="text-sm text-dental-muted">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Previous</button>
            <button className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {drawer !== null && (
        <InvoiceDrawer
          invoice={drawer._id ? drawer : null}
          patients={patients} staff={staff}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}

      {payModal && (
        <PaymentModal invoice={payModal} onClose={() => setPayModal(null)} onPaid={handlePaid} />
      )}

      {printInv && (
        <InvoicePrint invoice={printInv} clinic={clinic} onClose={() => setPrintInv(null)} />
      )}

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
