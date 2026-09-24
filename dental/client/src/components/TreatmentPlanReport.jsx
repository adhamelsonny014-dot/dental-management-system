import { useRef } from "react";
import InteractiveMouth from "./InteractiveMouth";

const currency = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";

const TreatmentPlanReport = ({ plan, patient, chartTeeth, onClose }) => {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Treatment Plan — ${patient?.firstName} ${patient?.lastName}</title>
      <style>
        body{font-family:Georgia,serif;padding:32px;color:#1e293b;max-width:800px;margin:0 auto}
        h1{font-size:22px;margin:0 0 8px} table{width:100%;border-collapse:collapse;margin:16px 0}
        th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;font-size:13px}
        th{background:#f8fafc}.total{font-size:18px;font-weight:bold;text-align:right;margin-top:16px}
        .meta{color:#64748b;font-size:13px}
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.print();
  };

  if (!plan) return null;

  const subtotal = plan.procedures?.reduce((s, p) => s + (p.quantity || 1) * (p.unitCost || 0), 0) || 0;
  const discount = Number(plan.discount) || 0;
  const grandTotal =
    plan.discountType === "percent" ? subtotal - (subtotal * discount) / 100 : subtotal - discount;

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <article className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-dental-border">
          <h2 className="font-display text-lg font-semibold">Treatment plan report</h2>
          <section className="flex gap-2">
            <button type="button" className="btn-primary text-sm" onClick={handlePrint}>
              Print / PDF
            </button>
            <button type="button" className="btn-ghost text-sm" onClick={onClose}>
              Close
            </button>
          </section>
        </header>

        <section ref={printRef} className="overflow-y-auto p-6 space-y-6">
          <header>
            <h1 className="font-display text-2xl font-bold">{plan.title}</h1>
            <p className="meta text-sm text-dental-muted mt-1">
              Patient: {patient?.firstName} {patient?.lastName} · {patient?.patientNumber}
              <br />
              Dentist: {plan.dentist ? `Dr. ${plan.dentist.firstName} ${plan.dentist.lastName}` : "—"}
              <br />
              Status: {plan.status} · Created {fmtDate(plan.createdAt)}
            </p>
          </header>

          {plan.description ? <p className="text-sm text-slate-700">{plan.description}</p> : null}

          <InteractiveMouth
            mode="plan"
            chartTeeth={chartTeeth || []}
            procedures={plan.procedures || []}
            compact
          />

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Procedure</th>
                <th>Tooth</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(plan.procedures || []).map((p, i) => (
                <tr key={p._id || i}>
                  <td>{i + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.tooth || "—"}</td>
                  <td>{p.quantity}</td>
                  <td>{currency(p.unitCost)}</td>
                  <td>{currency((p.quantity || 1) * (p.unitCost || 0))}</td>
                  <td className="capitalize">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="total">
            Subtotal: {currency(subtotal)}
            {discount > 0 ? ` · Discount: ${plan.discountType === "percent" ? `${discount}%` : currency(discount)}` : ""}
            <br />
            Grand total: {currency(Math.max(0, grandTotal))}
          </p>

          {plan.notes ? (
            <section>
              <p className="text-xs font-semibold uppercase text-dental-muted">Notes</p>
              <p className="text-sm mt-1">{plan.notes}</p>
            </section>
          ) : null}
        </section>
      </article>
    </section>
  );
};

export default TreatmentPlanReport;
