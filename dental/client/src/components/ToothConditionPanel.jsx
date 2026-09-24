import { useState, useEffect } from "react";
import { CONDITION_COLORS, CONDITION_LABELS } from "./ToothSVG";

const CONDITIONS   = Object.keys(CONDITION_COLORS);
const SURFACES_ALL = ["mesial","distal","buccal","lingual","occlusal","incisal"];

// Standard dental tooth names
const TOOTH_NAMES = {
  1:"Upper Right 3rd Molar",2:"Upper Right 2nd Molar",3:"Upper Right 1st Molar",
  4:"Upper Right 2nd Premolar",5:"Upper Right 1st Premolar",6:"Upper Right Canine",
  7:"Upper Right Lateral Incisor",8:"Upper Right Central Incisor",
  9:"Upper Left Central Incisor",10:"Upper Left Lateral Incisor",
  11:"Upper Left Canine",12:"Upper Left 1st Premolar",13:"Upper Left 2nd Premolar",
  14:"Upper Left 1st Molar",15:"Upper Left 2nd Molar",16:"Upper Left 3rd Molar",
  17:"Lower Left 3rd Molar",18:"Lower Left 2nd Molar",19:"Lower Left 1st Molar",
  20:"Lower Left 2nd Premolar",21:"Lower Left 1st Premolar",22:"Lower Left Canine",
  23:"Lower Left Lateral Incisor",24:"Lower Left Central Incisor",
  25:"Lower Right Central Incisor",26:"Lower Right Lateral Incisor",
  27:"Lower Right Canine",28:"Lower Right 1st Premolar",29:"Lower Right 2nd Premolar",
  30:"Lower Right 1st Molar",31:"Lower Right 2nd Molar",32:"Lower Right 3rd Molar",
};

const ToothConditionPanel = ({ tooth, onUpdate, saving }) => {
  const [condition, setCondition] = useState(tooth.condition);
  const [surfaces,  setSurfaces]  = useState(tooth.surfaces || []);
  const [notes,     setNotes]     = useState(tooth.notes || "");
  const [dirty,     setDirty]     = useState(false);

  // Reset when a different tooth is selected
  useEffect(() => {
    setCondition(tooth.condition);
    setSurfaces(tooth.surfaces || []);
    setNotes(tooth.notes || "");
    setDirty(false);
  }, [tooth.number]);

  const toggleSurface = (s) => {
    setSurfaces((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setDirty(true);
  };

  const handleConditionChange = (c) => {
    setCondition(c);
    setDirty(true);
  };

  const handleSave = () => {
    onUpdate(tooth.number, { condition, surfaces, notes });
    setDirty(false);
  };

  const color = CONDITION_COLORS[condition] || "#fff";

  return (
    <div className="card p-5 h-full flex flex-col">
      {/* Tooth header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center font-display font-bold text-slate-700 text-sm flex-shrink-0"
          style={{ background: color }}
        >
          {tooth.number}
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm leading-tight">Tooth #{tooth.number}</p>
          <p className="text-xs text-dental-muted leading-tight">{TOOTH_NAMES[tooth.number]}</p>
        </div>
      </div>

      {/* Condition picker */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-2">Condition</p>
        <div className="grid grid-cols-2 gap-1.5">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => handleConditionChange(c)}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                condition === c
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-dental-border text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0"
                style={{ background: CONDITION_COLORS[c] }}
              />
              {CONDITION_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Surface selector (only relevant when not missing/implant) */}
      {!["missing","implant"].includes(condition) && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-2">Affected surfaces</p>
          <div className="flex flex-wrap gap-1.5">
            {SURFACES_ALL.map((s) => (
              <button
                key={s}
                onClick={() => toggleSurface(s)}
                className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors ${
                  surfaces.includes(s)
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-dental-border text-dental-muted hover:border-primary-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="mb-4 flex-1">
        <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-2">Notes</p>
        <textarea
          className="input resize-none text-sm w-full"
          rows={3}
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
          placeholder="Clinical notes for this tooth..."
        />
      </div>

      {/* Save button */}
      <button
        className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
          dirty
            ? "btn-primary"
            : "bg-slate-100 text-slate-400 cursor-default"
        }`}
        onClick={handleSave}
        disabled={!dirty || saving}
      >
        {saving ? "Saving..." : dirty ? "Save tooth" : "No changes"}
      </button>
    </div>
  );
};

export default ToothConditionPanel;
