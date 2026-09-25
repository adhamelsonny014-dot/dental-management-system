// Dental chart constants (Universal numbering: 1-16 upper right→left, 17-32 lower left→right)

export const UPPER_TEETH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
export const LOWER_TEETH = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

// Condition → fill color mapping
export const CONDITION_COLORS = {
  healthy: "#ffffff",
  cavity: "#ef4444",
  filled: "#60a5fa",
  crown: "#f59e0b",
  missing: "#e2e8f0",
  implant: "#8b5cf6",
  "root-canal": "#f97316",
  bridge: "#10b981",
  veneer: "#ec4899",
  "extraction-needed": "#dc2626",
};

export const CONDITION_LABELS = {
  healthy: "Healthy",
  cavity: "Cavity",
  filled: "Filled",
  crown: "Crown",
  missing: "Missing",
  implant: "Implant",
  "root-canal": "Root Canal",
  bridge: "Bridge",
  veneer: "Veneer",
  "extraction-needed": "Needs Extraction",
};
