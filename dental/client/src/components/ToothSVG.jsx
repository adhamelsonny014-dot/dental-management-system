import { CONDITION_COLORS } from "../constants/teeth";

// Upper teeth (1-16) are drawn crown-up; lower (17-32) crown-down
// Each tooth is a simplified shape: rectangle body + rounded crown
const ToothSVG = ({ tooth, isSelected, onClick, isUpper }) => {
  const fill = CONDITION_COLORS[tooth.condition] || "#ffffff";
  const strokeColor = isSelected ? "#2563eb" : tooth.condition === "healthy" ? "#94a3b8" : "#64748b";
  const strokeWidth = isSelected ? 2.5 : 1.5;

  // Molar vs premolar vs incisor shape based on tooth number
  const n = tooth.number;
  const isMolar = [1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32].includes(n);
  const isPremolar = [4, 5, 12, 13, 20, 21, 28, 29].includes(n);

  const w = isMolar ? 22 : isPremolar ? 18 : 14;
  const h = 28;
  const cx = 12; // center x of 24px viewBox

  const x = cx - w / 2;

  // Crown bump height
  const bumpH = isMolar ? 7 : isPremolar ? 6 : 5;

  // Upper tooth: bump on top; lower tooth: bump on bottom
  const bodyY = isUpper ? bumpH : 0;
  const bodyH = h - bumpH;
  const bumpY = isUpper ? 0 : bodyH;

  // Cusp count for molars
  const cusps = isMolar ? 4 : isPremolar ? 2 : 1;

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} className="group">
      {/* Hover highlight */}
      <rect
        x={x - 2}
        y={0}
        width={w + 4}
        height={h + 4}
        rx={4}
        fill="transparent"
        className="group-hover:fill-blue-50 transition-colors"
      />

      {/* Root (thin rectangle below/above crown) */}
      <rect
        x={cx - 3}
        y={isUpper ? bodyY + bodyH - 4 : 4}
        width={6}
        height={isUpper ? 8 : 8}
        rx={2}
        fill="#fde8d8"
        stroke="#f0c0a0"
        strokeWidth={0.8}
        opacity={0.7}
      />

      {/* Tooth body */}
      <rect
        x={x}
        y={bodyY}
        width={w}
        height={bodyH}
        rx={3}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        className="transition-all duration-150"
      />

      {/* Crown cusps */}
      {Array.from({ length: cusps }).map((_, i) => {
        const cuspW = w / cusps;
        const cuspX = x + i * cuspW + cuspW * 0.15;
        const cuspWd = cuspW * 0.7;
        return (
          <rect
            key={i}
            x={cuspX}
            y={isUpper ? bumpY : bumpY + 1}
            width={cuspWd}
            height={bumpH - 1}
            rx={isUpper ? 2 : 2}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.8}
          />
        );
      })}

      {/* Missing overlay */}
      {tooth.condition === "missing" && (
        <line
          x1={x + 2}
          y1={bodyY + 2}
          x2={x + w - 2}
          y2={bodyY + bodyH - 2}
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray="3,2"
        />
      )}

      {/* Selected ring */}
      {isSelected && (
        <rect
          x={x - 1}
          y={bodyY - 1}
          width={w + 2}
          height={bodyH + 2}
          rx={4}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2}
          strokeDasharray="4,2"
        />
      )}
    </g>
  );
};

export default ToothSVG;
