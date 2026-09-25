import { useState } from "react";
import api from "../../utils/api";
import { currency } from "../../utils/format";
import toast from "react-hot-toast";
import { EMPTY_ITEM } from "./constants";

const InvoiceDrawer = ({ invoice, patients, staff, onClose, onSaved }) => {
  const isEdit = Boolean(invoice?._id);
  const [form, setForm] = useState(
    invoice
      ? { ...invoice, lineItems: invoice.lineItems?.map((i) => ({ ...i })) || [] }
      : {
          patient: "",
          dentist: "",
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          status: "draft",
          lineItems: [{ ...EMPTY_ITEM }],
          discount: 0,
          discountType: "flat",
          taxRate: 0,
          insuranceCoverage: 0,
          insuranceProvider: "",
          notes: "",
        },
  );
  const [saving, setSaving] = useState(false);
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addItem = () => setForm((f) => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_ITEM }] }));
  const updateItem = (i, item) =>
    setForm((f) => {
      const items = [...f.lineItems];
      items[i] = item;
      return { ...f, lineItems: items };
    });
  const removeItem = (i) => setForm((f) => ({ ...f, lineItems: f.lineItems.filter((_, j) => j !== i) }));

  const subtotal = form.lineItems.reduce((s, i) => s + (i.quantity || 1) * (i.unitPrice || 0), 0);
  const discAmt =
    form.discountType === "percent" ? (subtotal * Number(form.discount)) / 100 : Number(form.discount);
  const taxAmt = ((subtotal - discAmt) * Number(form.taxRate)) / 100;
  const grandTotal = Math.max(0, subtotal - discAmt + taxAmt);
  const amountDue = Math.max(0, grandTotal - Number(form.insuranceCoverage));

  const handleSubmit = async () => {
    if (!form.patient) {
      toast.error("Patient is required");
      return;
    }
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                  <option key={p._id} value={p._id}>
                    {p.firstName} {p.lastName} ({p.patientNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Dentist</label>
              <select className="input" name="dentist" value={form.dentist || ""} onChange={set}>
                <option value="">— Select dentist —</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" name="status" value={form.status} onChange={set}>
                {["draft", "sent", "partial", "paid", "overdue", "cancelled"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Issue date</label>
              <input
                className="input"
                type="date"
                name="issueDate"
                value={form.issueDate?.split("T")[0] || ""}
                onChange={set}
              />
            </div>
            <div>
              <label className="label">Due date</label>
              <input
                className="input"
                type="date"
                name="dueDate"
                value={form.dueDate?.split("T")[0] || ""}
                onChange={set}
              />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Line items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
                      <input
                        className="input text-sm"
                        value={item.description}
                        onChange={(e) => updateItem(i, { ...item, description: e.target.value })}
                        placeholder="Procedure / service"
                      />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="label text-xs">Tooth</label>}
                      <input
                        className="input text-sm"
                        type="number"
                        min={1}
                        max={32}
                        value={item.tooth || ""}
                        placeholder="—"
                        onChange={(e) => updateItem(i, { ...item, tooth: e.target.value })}
                      />
                    </div>
                    <div className="col-span-1">
                      {i === 0 && <label className="label text-xs">Qty</label>}
                      <input
                        className="input text-sm"
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, { ...item, quantity: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="label text-xs">Price ($)</label>}
                      <input
                        className="input text-sm"
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, { ...item, unitPrice: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-1">
                      {i === 0 && <label className="label text-xs">Total</label>}
                      <div className="input text-sm bg-slate-50 text-slate-600 text-right">
                        {currency(item.quantity * item.unitPrice)}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
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
                  <input
                    className="input text-sm flex-1"
                    type="number"
                    min={0}
                    name="discount"
                    value={form.discount}
                    onChange={set}
                  />
                  <select
                    className="input text-sm w-16"
                    name="discountType"
                    value={form.discountType}
                    onChange={set}
                  >
                    <option value="flat">$</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label text-xs">Tax rate (%)</label>
                <input
                  className="input text-sm"
                  type="number"
                  min={0}
                  max={100}
                  name="taxRate"
                  value={form.taxRate}
                  onChange={set}
                />
              </div>
              <div>
                <label className="label text-xs">Insurance coverage ($)</label>
                <input
                  className="input text-sm"
                  type="number"
                  min={0}
                  name="insuranceCoverage"
                  value={form.insuranceCoverage}
                  onChange={set}
                />
              </div>
              <div>
                <label className="label text-xs">Insurance provider</label>
                <input
                  className="input text-sm"
                  name="insuranceProvider"
                  value={form.insuranceProvider}
                  onChange={set}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="pt-2 border-t border-dental-border space-y-1 text-sm">
              <div className="flex justify-between text-dental-muted">
                <span>Subtotal</span>
                <span>{currency(subtotal)}</span>
              </div>
              {discAmt > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>−{currency(discAmt)}</span>
                </div>
              )}
              {taxAmt > 0 && (
                <div className="flex justify-between text-dental-muted">
                  <span>Tax</span>
                  <span>+{currency(taxAmt)}</span>
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
            <textarea
              className="input resize-none text-sm"
              name="notes"
              value={form.notes}
              onChange={set}
              rows={2}
              placeholder="Payment terms, notes for patient..."
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-dental-border flex justify-end gap-3 bg-white">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary px-6" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create invoice"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDrawer;
