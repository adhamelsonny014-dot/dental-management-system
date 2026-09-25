import { currency, fmtDate } from "../../utils/format";
import { STATUS_STYLES, METHOD_ICONS } from "./constants";

// ── Invoice print view ─────────────────────────────────────────────────────────
const InvoicePrint = ({ invoice, clinic, onClose }) => (
  <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-8">
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {clinic?.name || "Dental Clinic"}
          </h1>
          <p className="text-sm text-dental-muted">
            {clinic?.address}
            {clinic?.city ? `, ${clinic.city}` : ""}
          </p>
          <p className="text-sm text-dental-muted">{clinic?.phone}</p>
          <p className="text-sm text-dental-muted">{clinic?.email}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-bold text-slate-800">INVOICE</p>
          <p className="font-mono font-semibold text-primary-600 mt-1">{invoice.invoiceNumber}</p>
          <div
            className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[invoice.status]}`}
          >
            {invoice.status}
          </div>
        </div>
      </div>

      {/* Bill to / From */}
      <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
        <div>
          <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-2">Bill to</p>
          <p className="font-semibold text-slate-800">
            {invoice.patient?.firstName} {invoice.patient?.lastName}
          </p>
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
                <span className="font-medium">
                  Dr. {invoice.dentist.firstName} {invoice.dentist.lastName}
                </span>
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
          <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-2">
            Payment history
          </p>
          <div className="space-y-1">
            {invoice.payments.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span>{METHOD_ICONS[p.method]}</span>
                  <span className="capitalize text-dental-muted">{p.method.replace("-", " ")}</span>
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
        <button className="btn-primary px-6" onClick={() => window.print()}>
          🖨️ Print
        </button>
        <button className="btn-ghost border border-dental-border" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  </div>
);

export default InvoicePrint;
