const COMMON_PROCEDURES = [
  "Examination",
  "X-ray",
  "Cleaning",
  "Scaling",
  "Root planing",
  "Composite filling",
  "Amalgam filling",
  "Crown preparation",
  "Crown fitting",
  "Root canal",
  "Extraction",
  "Implant placement",
  "Whitening",
  "Orthodontic adjustment",
];

const SOAPForm = ({ data, onChange }) => {
  const set = (e) => onChange({ ...data, [e.target.name]: e.target.value });

  const setVital = (e) => onChange({ ...data, vitals: { ...data.vitals, [e.target.name]: e.target.value } });

  const toggleProcedure = (proc) => {
    const procs = data.procedures || [];
    onChange({
      ...data,
      procedures: procs.includes(proc) ? procs.filter((p) => p !== proc) : [...procs, proc],
    });
  };

  const SoapSection = ({ label, name, placeholder, color }) => (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${color}`}
        >
          {label[0]}
        </span>
        <label className="text-sm font-semibold text-slate-700">{label}</label>
      </div>
      <textarea
        className="input resize-none text-sm w-full"
        name={name}
        value={data[name] || ""}
        onChange={set}
        rows={3}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <SoapSection
        label="Subjective"
        name="subjective"
        color="bg-blue-500"
        placeholder="Chief complaint, patient-reported symptoms, pain level (1-10)..."
      />
      <SoapSection
        label="Objective"
        name="objective"
        color="bg-emerald-500"
        placeholder="Clinical findings, examination results, X-ray observations..."
      />
      <SoapSection
        label="Assessment"
        name="assessment"
        color="bg-amber-500"
        placeholder="Diagnosis, differential diagnosis..."
      />
      <SoapSection
        label="Plan"
        name="plan"
        color="bg-purple-500"
        placeholder="Treatment plan, procedures recommended, referrals..."
      />

      {/* Procedures performed */}
      <div>
        <label className="label">Procedures performed</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {COMMON_PROCEDURES.map((proc) => (
            <button
              key={proc}
              type="button"
              onClick={() => toggleProcedure(proc)}
              className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors ${
                (data.procedures || []).includes(proc)
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-dental-border text-dental-muted hover:border-primary-400"
              }`}
            >
              {proc}
            </button>
          ))}
        </div>
      </div>

      {/* Vitals (collapsible) */}
      <div>
        <label className="label">Vitals (optional)</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-dental-muted mb-1 block">Blood pressure</label>
            <input
              className="input text-sm"
              name="bloodPressure"
              value={data.vitals?.bloodPressure || ""}
              onChange={setVital}
              placeholder="120/80"
            />
          </div>
          <div>
            <label className="text-xs text-dental-muted mb-1 block">Pulse (bpm)</label>
            <input
              className="input text-sm"
              name="pulse"
              value={data.vitals?.pulse || ""}
              onChange={setVital}
              placeholder="72"
            />
          </div>
          <div>
            <label className="text-xs text-dental-muted mb-1 block">Temperature (°C)</label>
            <input
              className="input text-sm"
              name="temperature"
              value={data.vitals?.temperature || ""}
              onChange={setVital}
              placeholder="37.0"
            />
          </div>
        </div>
      </div>

      {/* Follow-up */}
      <div>
        <label className="label">Follow-up date</label>
        <input
          className="input"
          type="date"
          name="followUpDate"
          value={data.followUpDate ? data.followUpDate.split("T")[0] : ""}
          onChange={set}
        />
      </div>
    </div>
  );
};

export default SOAPForm;
