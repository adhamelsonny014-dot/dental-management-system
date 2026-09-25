const SectionHeading = ({ eyebrow, title, description, align = "left", light = false }) => (
  <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
    {eyebrow && (
      <p
        className={`text-xs uppercase tracking-[0.2em] mb-2 ${
          light ? "text-clinic-cream/60" : "text-clinic-muted"
        }`}
      >
        {eyebrow}
      </p>
    )}
    <h2
      className={`font-display text-3xl sm:text-4xl font-semibold leading-tight ${
        light ? "text-clinic-cream" : "text-clinic-ink"
      }`}
    >
      {title}
    </h2>
    {description && (
      <p className={`mt-3 text-base leading-relaxed ${light ? "text-clinic-cream/70" : "text-slate-600"}`}>
        {description}
      </p>
    )}
  </div>
);

export default SectionHeading;
