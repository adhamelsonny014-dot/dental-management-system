// Shared constants for the treatmentPlans page and its components

export const PLAN_STATUSES = ["draft", "proposed", "approved", "in-progress", "completed", "cancelled"];

export const PROC_STATUSES = ["pending", "approved", "in-progress", "completed", "cancelled"];

export const COMMON_PROCEDURES = [
  "Examination",
  "X-ray (Periapical)",
  "X-ray (Panoramic)",
  "Prophylaxis / Cleaning",
  "Scaling & Root Planing",
  "Composite Filling",
  "Amalgam Filling",
  "Tooth Extraction",
  "Surgical Extraction",
  "Root Canal Treatment",
  "Crown (Ceramic)",
  "Crown (Metal)",
  "Crown (PFM)",
  "Bridge (per unit)",
  "Implant Placement",
  "Implant Crown",
  "Partial Denture",
  "Complete Denture",
  "Teeth Whitening",
  "Orthodontic Consultation",
  "Orthodontic Bracket Placement",
  "Orthodontic Monthly Adjustment",
  "Veneer",
  "Inlay / Onlay",
];

export const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  proposed: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  "in-progress": "bg-amber-100 text-amber-700",
  completed: "bg-teal-100 text-teal-700",
  cancelled: "bg-red-100 text-red-600",
  pending: "bg-slate-100 text-slate-500",
};

export const PROC_STATUS_STYLES = {
  pending: "bg-slate-100 text-slate-500",
  approved: "bg-blue-100 text-blue-700",
  "in-progress": "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

export // ── Empty procedure ────────────────────────────────────────────────────────────
const EMPTY_PROC = { name: "", tooth: "", surface: "", quantity: 1, unitCost: 0, notes: "" };
