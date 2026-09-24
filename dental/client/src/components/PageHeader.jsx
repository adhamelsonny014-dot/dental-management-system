const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-dental-muted text-sm mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export default PageHeader;
