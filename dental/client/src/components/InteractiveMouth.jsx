import ToothSVG from "./ToothSVG";
import { CONDITION_COLORS, CONDITION_LABELS, UPPER_TEETH, LOWER_TEETH } from "../constants/teeth";

const TOOTH_W = 28;
const TOOTH_H = 40;
const GAP = 2;
const MIDLINE_X = (UPPER_TEETH.length / 2) * (TOOTH_W + GAP);
const PLAN_TOOTH_COLOR = "#3b82f6";

const InteractiveMouth = ({
  mode = "plan",
  chartTeeth = [],
  procedures = [],
  selectedToothNumber,
  onToothClick,
  compact = false,
}) => {
  const getChartTooth = (num) => chartTeeth.find((t) => t.number === num);
  const proceduresOnTooth = (num) => procedures.filter((p) => Number(p.tooth) === num);

  const renderTooth = (num, isUpper) => {
    const chartTooth = getChartTooth(num) || { number: num, condition: "healthy", surfaces: [], notes: "" };
    const planned = proceduresOnTooth(num);
    const isSelected = selectedToothNumber === num;
    const hasPlan = planned.length > 0;

    const displayTooth =
      mode === "plan" && hasPlan
        ? { ...chartTooth, condition: chartTooth.condition === "healthy" ? "filled" : chartTooth.condition }
        : chartTooth;

    return (
      <g key={num} className="cursor-pointer" onClick={() => onToothClick?.(num)}>
        {hasPlan && mode === "plan" ? (
          <circle
            cx={12}
            cy={isUpper ? TOOTH_H / 2 + 4 : TOOTH_H / 2 + 8}
            r={14}
            fill="none"
            stroke={PLAN_TOOTH_COLOR}
            strokeWidth={isSelected ? 3 : 2}
            strokeDasharray={isSelected ? "0" : "3 2"}
          />
        ) : null}
        <ToothSVG
          tooth={displayTooth}
          isSelected={isSelected}
          onClick={() => onToothClick?.(num)}
          isUpper={isUpper}
        />
        {hasPlan && mode === "plan" ? (
          <text
            x={12}
            y={isUpper ? -2 : TOOTH_H + 18}
            textAnchor="middle"
            fontSize={7}
            fill={PLAN_TOOTH_COLOR}
            fontWeight="700"
          >
            {planned.length}
          </text>
        ) : null}
      </g>
    );
  };

  const svgWidth = UPPER_TEETH.length * (TOOTH_W + GAP);
  const maxH = compact ? 60 : 80;

  return (
    <section className="select-none">
      <section className={compact ? "mb-3" : "mb-5"}>
        <svg viewBox={`0 0 ${svgWidth} ${TOOTH_H + 12}`} className="w-full" style={{ maxHeight: maxH }}>
          <line
            x1={MIDLINE_X}
            y1={0}
            x2={MIDLINE_X}
            y2={TOOTH_H + 12}
            stroke="#e2e8f0"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
          {UPPER_TEETH.map((num, i) => {
            const x = i * (TOOTH_W + GAP) + TOOTH_W / 2;
            return (
              <g key={num} transform={`translate(${x - 12}, 4)`}>
                {renderTooth(num, true)}
                <text
                  x={12}
                  y={TOOTH_H + 10}
                  textAnchor="middle"
                  fontSize={8}
                  fill={selectedToothNumber === num ? "#2563eb" : "#94a3b8"}
                  fontWeight={selectedToothNumber === num ? "700" : "400"}
                >
                  {num}
                </text>
              </g>
            );
          })}
        </svg>
      </section>

      <section className="flex items-center gap-2 my-2">
        <span className="flex-1 h-px bg-dental-border" />
        <span className="text-[10px] text-dental-muted">Occlusal</span>
        <span className="flex-1 h-px bg-dental-border" />
      </section>

      <section>
        <svg viewBox={`0 0 ${svgWidth} ${TOOTH_H + 12}`} className="w-full" style={{ maxHeight: maxH }}>
          <line
            x1={MIDLINE_X}
            y1={0}
            x2={MIDLINE_X}
            y2={TOOTH_H + 12}
            stroke="#e2e8f0"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
          {LOWER_TEETH.map((num, i) => {
            const x = i * (TOOTH_W + GAP) + TOOTH_W / 2;
            return (
              <g key={num} transform={`translate(${x - 12}, 0)`}>
                <text
                  x={12}
                  y={8}
                  textAnchor="middle"
                  fontSize={8}
                  fill={selectedToothNumber === num ? "#2563eb" : "#94a3b8"}
                  fontWeight={selectedToothNumber === num ? "700" : "400"}
                >
                  {num}
                </text>
                <g transform="translate(0, 10)">{renderTooth(num, false)}</g>
              </g>
            );
          })}
        </svg>
      </section>

      <p className="mt-3 text-[10px] text-dental-muted">
        {mode === "plan" ? "Blue ring = planned procedure. " : ""}
        Click a tooth to {mode === "plan" ? "add a treatment line" : "edit condition"}.
      </p>
    </section>
  );
};

export { CONDITION_COLORS, CONDITION_LABELS };
export default InteractiveMouth;
