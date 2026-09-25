import { fmtDate } from "../../utils/format";

// ── Print view ─────────────────────────────────────────────────────────────────
const PrintView = ({ rx, clinic, onClose }) => (
  <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-8" id="print-area">
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {clinic?.name || "Dental Clinic"}
          </h1>
          <p className="text-sm text-dental-muted">
            {clinic?.address}
            {clinic?.city ? `, ${clinic.city}` : ""}
          </p>
          <p className="text-sm text-dental-muted">{clinic?.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-dental-muted">Prescription No.</p>
          <p className="font-mono font-bold text-slate-800">{rx.prescriptionNumber}</p>
          <p className="text-sm text-dental-muted mt-1">{fmtDate(rx.issueDate, "long")}</p>
        </div>
      </div>

      {/* Rx symbol */}
      <div className="flex items-start gap-8 mb-6">
        <span className="font-display text-5xl font-bold text-primary-600 leading-none">℞</span>
        <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-0.5">Patient</p>
            <p className="font-semibold text-slate-800">
              {rx.patient?.firstName} {rx.patient?.lastName}
            </p>
            <p className="text-dental-muted">{rx.patient?.patientNumber}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-0.5">
              Prescribing dentist
            </p>
            <p className="font-semibold text-slate-800">
              Dr. {rx.dentist?.firstName} {rx.dentist?.lastName}
            </p>
            {rx.dentist?.specialization && <p className="text-dental-muted">{rx.dentist.specialization}</p>}
          </div>
          {rx.diagnosis && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-0.5">
                Diagnosis
              </p>
              <p className="text-slate-700">{rx.diagnosis}</p>
            </div>
          )}
        </div>
      </div>

      {/* Medications */}
      <div className="space-y-4 mb-6">
        {rx.medications.map((med, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-bold text-slate-900">{med.name}</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 mt-1 text-sm text-dental-muted">
                  {med.dosage && (
                    <p>
                      Dosage: <span className="text-slate-700 font-medium">{med.dosage}</span>
                    </p>
                  )}
                  {med.frequency && (
                    <p>
                      Frequency: <span className="text-slate-700 font-medium">{med.frequency}</span>
                    </p>
                  )}
                  {med.duration && (
                    <p>
                      Duration: <span className="text-slate-700 font-medium">{med.duration}</span>
                    </p>
                  )}
                  {med.quantity && (
                    <p>
                      Quantity: <span className="text-slate-700 font-medium">{med.quantity}</span>
                    </p>
                  )}
                </div>
                {med.instructions && (
                  <p className="text-sm text-slate-600 mt-1 italic">⚠ {med.instructions}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {rx.notes && (
        <div className="mb-6 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-slate-700">{rx.notes}</p>
        </div>
      )}

      {/* Signature line */}
      <div className="flex justify-end mt-10 pt-6 border-t border-slate-200">
        <div className="text-center">
          <div className="w-40 border-b-2 border-slate-800 mb-1" />
          <p className="text-sm font-semibold text-slate-700">
            Dr. {rx.dentist?.firstName} {rx.dentist?.lastName}
          </p>
          <p className="text-xs text-dental-muted">{rx.dentist?.specialization || "Dentist"}</p>
        </div>
      </div>

      {/* Buttons (hidden on print) */}
      <div className="flex gap-3 justify-center mt-8 print:hidden">
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

export default PrintView;
