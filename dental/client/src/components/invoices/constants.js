// Shared constants for the invoices page and its components

export const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-600",
  cancelled: "bg-slate-100 text-slate-400 line-through",
};

export const METHODS = ["cash", "card", "bank-transfer", "insurance", "cheque", "other"];

export const METHOD_ICONS = {
  cash: "💵",
  card: "💳",
  "bank-transfer": "🏦",
  insurance: "🏥",
  cheque: "📄",
  other: "💰",
};

export // ── Invoice drawer editor ──────────────────────────────────────────────────────
const EMPTY_ITEM = { description: "", tooth: "", quantity: 1, unitPrice: 0 };
