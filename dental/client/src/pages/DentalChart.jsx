import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import ToothSVG from "../components/ToothSVG";
import { CONDITION_COLORS, CONDITION_LABELS, UPPER_TEETH, LOWER_TEETH } from "../constants/teeth";
import ToothConditionPanel from "../components/ToothConditionPanel";

const TOOTH_W = 28; // px per tooth slot
const TOOTH_H = 40; // viewBox height
const GAP = 2; // px gap between teeth
const MIDLINE_X = (UPPER_TEETH.length / 2) * (TOOTH_W + GAP); // midline after tooth 8/9

// Legend component
const Legend = () => (
  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
    {Object.entries(CONDITION_COLORS).map(([key, color]) => (
      <span key={key} className="flex items-center gap-1.5 text-xs text-dental-muted">
        <span
          className="w-3 h-3 rounded border border-slate-300 flex-shrink-0"
          style={{ background: color }}
        />
        {CONDITION_LABELS[key]}
      </span>
    ))}
  </div>
);

// Quadrant label
const QuadrantLabel = ({ label }) => (
  <span className="text-xs font-semibold text-dental-muted uppercase tracking-wide">{label}</span>
);

const DentalChart = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTooth, setSelectedTooth] = useState(null); // tooth object
  const [saving, setSaving] = useState(false);
  const [chartNotes, setChartNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchChart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dental-chart/${patientId}`);
      setChart(res.data);
      setChartNotes(res.data.notes || "");
      // Default select tooth 8
      setSelectedTooth(res.data.teeth.find((t) => t.number === 8));
    } catch {
      toast.error("Failed to load dental chart");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  const handleToothClick = (toothNumber) => {
    if (!chart) return;
    setSelectedTooth(chart.teeth.find((t) => t.number === toothNumber));
  };

  const handleUpdateTooth = async (toothNumber, updates) => {
    setSaving(true);
    try {
      const res = await api.patch(`/dental-chart/${patientId}/tooth`, {
        number: toothNumber,
        ...updates,
      });
      setChart(res.data);
      // Keep selected tooth in sync
      setSelectedTooth(res.data.teeth.find((t) => t.number === toothNumber));
      toast.success(`Tooth #${toothNumber} updated`);
    } catch {
      toast.error("Failed to update tooth");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.patch(`/dental-chart/${patientId}/notes`, { notes: chartNotes });
      toast.success("Chart notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const getTooth = (number) => chart?.teeth.find((t) => t.number === number);

  // Stats summary
  const conditionCounts =
    chart?.teeth.reduce((acc, t) => {
      acc[t.condition] = (acc[t.condition] || 0) + 1;
      return acc;
    }, {}) || {};

  const svgWidth = UPPER_TEETH.length * (TOOTH_W + GAP);

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!chart) return <div className="p-8 text-center text-dental-muted">Chart not found.</div>;

  const patient = chart.patient;

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title="Dental Chart"
        subtitle={patient ? `${patient.firstName} ${patient.lastName} · ${patient.patientNumber}` : ""}
        action={
          <div className="flex gap-2">
            <button
              className="btn-ghost text-sm border border-dental-border"
              onClick={() => navigate(`/patients/${patientId}`)}
            >
              ← Patient profile
            </button>
            <button
              className="btn-ghost text-sm border border-dental-border"
              onClick={() => navigate(`/clinical-notes/${patientId}`)}
            >
              Clinical notes →
            </button>
          </div>
        }
      />

      {/* Condition stats bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        {Object.entries(conditionCounts)
          .filter(([k]) => k !== "healthy")
          .sort((a, b) => b[1] - a[1])
          .map(([cond, count]) => (
            <span
              key={cond}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-dental-border bg-white"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CONDITION_COLORS[cond] }} />
              {CONDITION_LABELS[cond]}: {count}
            </span>
          ))}
        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-dental-border bg-white">
          <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300" />
          Healthy: {conditionCounts.healthy || 0}
        </span>
      </div>

      <div className="flex gap-5 flex-col xl:flex-row">
        {/* ── Chart SVG panel ─────────────────────────────────── */}
        <div className="card p-5 flex-1 min-w-0">
          {/* Upper jaw */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <QuadrantLabel label="Upper right (1–8)" />
              <QuadrantLabel label="Upper left (9–16)" />
            </div>

            <svg viewBox={`0 0 ${svgWidth} ${TOOTH_H + 8}`} className="w-full" style={{ maxHeight: 80 }}>
              {/* Midline */}
              <line
                x1={MIDLINE_X}
                y1={0}
                x2={MIDLINE_X}
                y2={TOOTH_H + 8}
                stroke="#e2e8f0"
                strokeWidth={1.5}
                strokeDasharray="4,3"
              />

              {UPPER_TEETH.map((num, i) => {
                const tooth = getTooth(num);
                if (!tooth) return null;
                const x = i * (TOOTH_W + GAP) + TOOTH_W / 2;
                return (
                  <g key={num} transform={`translate(${x - 12}, 4)`}>
                    <ToothSVG
                      tooth={tooth}
                      isSelected={selectedTooth?.number === num}
                      onClick={() => handleToothClick(num)}
                      isUpper={true}
                    />
                    {/* Tooth number label */}
                    <text
                      x={12}
                      y={TOOTH_H + 2}
                      textAnchor="middle"
                      fontSize={8}
                      fill={selectedTooth?.number === num ? "#2563eb" : "#94a3b8"}
                      fontWeight={selectedTooth?.number === num ? "700" : "400"}
                    >
                      {num}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Jaw divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-dental-border" />
            <span className="text-xs text-dental-muted font-medium px-2">Occlusal plane</span>
            <div className="flex-1 h-px bg-dental-border" />
          </div>

          {/* Lower jaw */}
          <div className="mt-6">
            <svg viewBox={`0 0 ${svgWidth} ${TOOTH_H + 8}`} className="w-full" style={{ maxHeight: 80 }}>
              {/* Midline */}
              <line
                x1={MIDLINE_X}
                y1={0}
                x2={MIDLINE_X}
                y2={TOOTH_H + 8}
                stroke="#e2e8f0"
                strokeWidth={1.5}
                strokeDasharray="4,3"
              />

              {LOWER_TEETH.map((num, i) => {
                const tooth = getTooth(num);
                if (!tooth) return null;
                const x = i * (TOOTH_W + GAP) + TOOTH_W / 2;
                return (
                  <g key={num} transform={`translate(${x - 12}, 0)`}>
                    {/* Tooth number label */}
                    <text
                      x={12}
                      y={10}
                      textAnchor="middle"
                      fontSize={8}
                      fill={selectedTooth?.number === num ? "#2563eb" : "#94a3b8"}
                      fontWeight={selectedTooth?.number === num ? "700" : "400"}
                    >
                      {num}
                    </text>
                    <g transform="translate(0, 12)">
                      <ToothSVG
                        tooth={tooth}
                        isSelected={selectedTooth?.number === num}
                        onClick={() => handleToothClick(num)}
                        isUpper={false}
                      />
                    </g>
                  </g>
                );
              })}
            </svg>
            <div className="flex justify-between mt-2">
              <QuadrantLabel label="Lower left (17–24)" />
              <QuadrantLabel label="Lower right (25–32)" />
            </div>
          </div>

          {/* Legend */}
          <div className="mt-5 pt-4 border-t border-dental-border">
            <Legend />
          </div>

          {/* Chart-level notes */}
          <div className="mt-4 pt-4 border-t border-dental-border">
            <p className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-2">
              General chart notes
            </p>
            <textarea
              className="input resize-none text-sm w-full"
              rows={2}
              value={chartNotes}
              onChange={(e) => setChartNotes(e.target.value)}
              placeholder="Overall chart observations..."
            />
            <button
              className="btn-primary text-sm mt-2 px-4 py-1.5"
              onClick={handleSaveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? "Saving..." : "Save notes"}
            </button>
          </div>
        </div>

        {/* ── Tooth detail panel ───────────────────────────────── */}
        <div className="w-full xl:w-64 flex-shrink-0">
          {selectedTooth ? (
            <ToothConditionPanel
              key={selectedTooth.number}
              tooth={selectedTooth}
              onUpdate={handleUpdateTooth}
              saving={saving}
            />
          ) : (
            <div className="card p-5 text-center text-dental-muted text-sm">
              Click any tooth to edit its condition
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DentalChart;
