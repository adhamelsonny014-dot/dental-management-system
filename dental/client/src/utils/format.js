// Shared display formatters (previously copied into each page)

export const currency = (n) => `$${Number(n || 0).toFixed(2)}`;

export const currencyRounded = (n) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const percent = (n) => `${Number(n || 0).toFixed(1)}%`;

const DATE_FORMATS = {
  short: { month: "short", day: "numeric", year: "numeric" }, // Sep 25, 2026
  long: { month: "long", day: "numeric", year: "numeric" }, // September 25, 2026
  weekday: { weekday: "short", month: "short", day: "numeric", year: "numeric" }, // Fri, Sep 25, 2026
  dateTime: { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" },
  shortDateTime: { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }, // Sep 25, 02:30 PM
};

/** Formats a date for display; returns "—" when there is no date. */
export const fmtDate = (value, format = "short") => {
  if (!value) return "—";
  const options = DATE_FORMATS[format] || DATE_FORMATS.short;
  const date = new Date(value);
  return options.hour ? date.toLocaleString("en-US", options) : date.toLocaleDateString("en-US", options);
};
