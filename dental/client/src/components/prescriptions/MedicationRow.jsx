import { COMMON_MEDS, FREQUENCIES } from "./constants";

// ── Medication row ─────────────────────────────────────────────────────────────
const MedicationRow = ({ med, index, onChange, onRemove }) => (
  <div className="card p-4 relative">
    <button
      type="button"
      onClick={onRemove}
      className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <div className="flex items-center gap-2 mb-3">
      <span className="w-6 h-6 rounded bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>
      <p className="text-sm font-semibold text-slate-700">Medication #{index + 1}</p>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div className="col-span-2">
        <label className="label text-xs">Medication name *</label>
        <input
          className="input text-sm"
          list="med-list"
          value={med.name}
          onChange={(e) => onChange({ ...med, name: e.target.value })}
          placeholder="e.g. Amoxicillin"
        />
        <datalist id="med-list">
          {COMMON_MEDS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="label text-xs">Dosage</label>
        <input
          className="input text-sm"
          value={med.dosage}
          onChange={(e) => onChange({ ...med, dosage: e.target.value })}
          placeholder="e.g. 500mg"
        />
      </div>
      <div>
        <label className="label text-xs">Frequency</label>
        <input
          className="input text-sm"
          list="freq-list"
          value={med.frequency}
          onChange={(e) => onChange({ ...med, frequency: e.target.value })}
          placeholder="e.g. 3x daily"
        />
        <datalist id="freq-list">
          {FREQUENCIES.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="label text-xs">Duration</label>
        <input
          className="input text-sm"
          value={med.duration}
          onChange={(e) => onChange({ ...med, duration: e.target.value })}
          placeholder="e.g. 5 days"
        />
      </div>
      <div>
        <label className="label text-xs">Quantity to dispense</label>
        <input
          className="input text-sm"
          value={med.quantity}
          onChange={(e) => onChange({ ...med, quantity: e.target.value })}
          placeholder="e.g. 15 tablets"
        />
      </div>
      <div className="col-span-2 sm:col-span-3">
        <label className="label text-xs">Special instructions</label>
        <input
          className="input text-sm"
          value={med.instructions}
          onChange={(e) => onChange({ ...med, instructions: e.target.value })}
          placeholder="e.g. Take after meals, avoid alcohol"
        />
      </div>
    </div>
  </div>
);

export default MedicationRow;
