import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import api from "../utils/api";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";

// ── Colours ───────────────────────────────────────────────────────────────────
const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

const METHOD_COLORS = {
  cash: "#10b981", card: "#3b82f6", "bank-transfer": "#8b5cf6",
  insurance: "#14b8a6", cheque: "#f59e0b", other: "#94a3b8",
};

const METHOD_ICONS = {
  cash: "💵", card: "💳", "bank-transfer": "🏦",
  insurance: "🏥", cheque: "📄", other: "💰",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const currency = (n) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const pct      = (n) => `${Number(n || 0).toFixed(1)}%`;

const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-dental-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-dental-muted capitalize">{p.name.replace(/-/g," ")}:</span>
          <span className="font-medium text-slate-800">
            {prefix === "$" ? currency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, color, icon }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
        <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-dental-muted mt-0.5">{sub}</p>}
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children, loading }) => (
  <div className="card p-5">
    <div className="mb-4">
      <h3 className="font-display font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-dental-muted mt-0.5">{subtitle}</p>}
    </div>
    {loading ? (
      <div className="flex justify-center items-center h-48">
        <div className="w-5 h-5 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ) : children}
  </div>
);

// Date range presets
const PRESETS = [
  { label: "Last 3 months",  months: 3  },
  { label: "Last 6 months",  months: 6  },
  { label: "Last 12 months", months: 12 },
  { label: "This year",      months: 0  }, // special
];

const getPresetDates = (months) => {
  const end   = new Date();
  let start;
  if (months === 0) {
    start = new Date(end.getFullYear(), 0, 1); // Jan 1 this year
  } else {
    start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);
  }
  return {
    start: start.toISOString().split("T")[0],
    end:   end.toISOString().split("T")[0],
  };
};

// ── Main page ──────────────────────────────────────────────────────────────────
const Reports = () => {
  const [preset,   setPreset]   = useState(12);
  const [dates,    setDates]    = useState(() => getPresetDates(12));
  const [loading,  setLoading]  = useState({});

  const [overview,      setOverview]      = useState(null);
  const [revenueData,   setRevenueData]   = useState([]);
  const [apptMonthData, setApptMonthData] = useState([]);
  const [apptTypeData,  setApptTypeData]  = useState([]);
  const [growthData,    setGrowthData]    = useState([]);
  const [dentistData,   setDentistData]   = useState([]);
  const [methodData,    setMethodData]    = useState([]);
  const [procedureData, setProcedureData] = useState([]);
  const [planSummary, setPlanSummary] = useState(null);

  const setLoad = (key, val) => setLoading((l) => ({ ...l, [key]: val }));

  const fetchAll = useCallback(async () => {
    const params = `?start=${dates.start}&end=${dates.end}`;

    // Kick off all 8 fetches in parallel
    const fetches = [
      { key: "overview",    url: `/reports/overview${params}`,              setter: setOverview },
      { key: "revenue",     url: `/reports/revenue-by-month${params}`,      setter: setRevenueData },
      { key: "apptMonth",   url: `/reports/appointments-by-month${params}`, setter: setApptMonthData },
      { key: "apptType",    url: `/reports/appointments-by-type${params}`,  setter: setApptTypeData },
      { key: "growth",      url: `/reports/patients-growth${params}`,       setter: setGrowthData },
      { key: "dentist",     url: `/reports/revenue-by-dentist${params}`,    setter: setDentistData },
      { key: "methods",     url: `/reports/payment-methods${params}`,       setter: setMethodData },
      { key: "procedures",  url: `/reports/top-procedures${params}`,        setter: setProcedureData },
      { key: "plans",       url: `/reports/treatment-plans${params}`,       setter: setPlanSummary },
    ];

    fetches.forEach(({ key }) => setLoad(key, true));

    await Promise.allSettled(
      fetches.map(async ({ key, url, setter }) => {
        try {
          const res = await api.get(url);
          setter(res.data);
        } catch {
          toast.error(`Failed to load ${key} data`);
        } finally {
          setLoad(key, false);
        }
      })
    );
  }, [dates]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handlePreset = (months) => {
    setPreset(months);
    setDates(getPresetDates(months));
  };

  // Pie custom label
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x  = cx + r * Math.cos(-midAngle * RADIAN);
    const y  = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Data aggregated from all clinic modules"
      />

      {/* Date range controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {PRESETS.map((p) => (
            <button key={p.months}
              onClick={() => handlePreset(p.months)}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors font-medium ${
                preset === p.months
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-dental-muted hover:text-slate-700"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-dental-muted">
          <input className="input w-36 text-sm py-1.5" type="date"
            value={dates.start}
            onChange={(e) => setDates((d) => ({ ...d, start: e.target.value }))} />
          <span>–</span>
          <input className="input w-36 text-sm py-1.5" type="date"
            value={dates.end}
            onChange={(e) => setDates((d) => ({ ...d, end: e.target.value }))} />
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KPICard label="Active patients"   value={overview?.totalPatients    ?? "—"} sub={`+${overview?.newPatients ?? 0} new this period`}        color="text-blue-600"   icon="👥" />
        <KPICard label="Appointments"      value={overview?.totalAppointments ?? "—"} sub={`${overview?.completedAppointments ?? 0} completed`}     color="text-emerald-600" icon="📅" />
        <KPICard label="Revenue collected" value={overview ? currency(overview.totalCollected) : "—"} sub={`${overview?.paidInvoices ?? 0} paid invoices`} color="text-primary-700" icon="💰" />
        <KPICard label="No-show rate"      value={overview ? pct(overview.noShowRate) : "—"} sub={`${overview?.noShowAppointments ?? 0} no-shows`} color={overview?.noShowRate > 10 ? "text-red-600" : "text-slate-700"} icon="🚫" />
      </div>

      {/* Second KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <KPICard label="Total invoiced"  value={overview ? currency(overview.totalInvoiced)   : "—"} sub={`${overview?.totalInvoices ?? 0} invoices`}     color="text-slate-800"   icon="🧾" />
        <KPICard label="Pending invoices" value={overview?.pendingInvoices ?? "—"} sub="sent / partial / overdue"                                         color="text-amber-600"   icon="⏳" />
        <KPICard label="Cancelled"       value={overview?.cancelledAppointments ?? "—"} sub="appointments cancelled"                                       color="text-red-500"     icon="❌" />
        <KPICard label="New patients"    value={overview?.newPatients ?? "—"} sub="registered this period"                                               color="text-purple-600"  icon="🆕" />
        <KPICard label="Treatment plans" value={planSummary?.totalPlans ?? "—"} sub={`${planSummary?.totalCharts ?? 0} dental charts`}                      color="text-indigo-600"  icon="📋" />
      </div>

      {/* ── Row 1: Revenue + Appointments by Month ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Monthly revenue" subtitle="Payments received vs invoiced" loading={loading.revenue}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<CustomTooltip prefix="$" />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#10b981" fill="url(#colorInvoiced)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="revenue"  name="Collected" stroke="#3b82f6" fill="url(#colorRevenue)" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Appointments by month" subtitle="Completed, cancelled, and no-shows" loading={loading.apptMonth}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={apptMonthData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="completed"  name="Completed"  fill="#10b981" radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="scheduled"  name="Scheduled"  fill="#3b82f6" radius={[0,0,0,0]} stackId="a" />
              <Bar dataKey="cancelled"  name="Cancelled"  fill="#ef4444" radius={[0,0,0,0]} stackId="a" />
              <Bar dataKey="noShow"     name="No-show"    fill="#f97316" radius={[3,3,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 2: Appointment types + Patient growth ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Appointment types" subtitle="Distribution of visit categories" loading={loading.apptType}>
          {apptTypeData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-dental-muted text-sm">No data for this period</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={apptTypeData} dataKey="value" nameKey="label" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={90} labelLine={false} label={renderPieLabel}>
                    {apptTypeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {apptTypeData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-slate-600 capitalize truncate">{item.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 flex-shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Patient growth" subtitle="New registrations and cumulative total" loading={loading.growth}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={growthData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="right" type="monotone" dataKey="total" name="Total patients"
                stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              <Line yAxisId="left" type="monotone" dataKey="newPatients" name="New this month"
                stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 3: Revenue by dentist + Payment methods ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Revenue by dentist" subtitle="Total invoiced per practitioner" loading={loading.dentist}>
          {dentistData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-dental-muted text-sm">No dentist data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, dentistData.length * 52)}>
              <BarChart data={dentistData} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<CustomTooltip prefix="$" />} />
                <Bar dataKey="revenue" name="Revenue" radius={[0,4,4,0]} barSize={20}>
                  {dentistData.map((entry, i) => (
                    <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Payment methods" subtitle="How patients are paying" loading={loading.methods}>
          {methodData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-dental-muted text-sm">No payments yet</div>
          ) : (
            <div className="space-y-3 py-2">
              {methodData.map((m) => {
                const maxTotal = Math.max(...methodData.map((x) => x.total));
                const widthPct = maxTotal > 0 ? (m.total / maxTotal) * 100 : 0;
                return (
                  <div key={m.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{METHOD_ICONS[m.name] || "💰"}</span>
                        <span className="text-sm font-medium text-slate-700 capitalize">{m.label}</span>
                        <span className="text-xs text-dental-muted">{m.count} payment{m.count !== 1 ? "s" : ""}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800">{currency(m.total)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${widthPct}%`,
                          background: METHOD_COLORS[m.name] || "#94a3b8",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Row 4: Top procedures (full width) ── */}
      <ChartCard title="Top procedures by revenue" subtitle="Most revenue-generating line items on invoices" loading={loading.procedures}>
        {procedureData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-dental-muted text-sm">No invoice data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={procedureData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white border border-dental-border rounded-xl shadow-lg p-3 text-sm max-w-xs">
                      <p className="font-semibold text-slate-700 mb-1 text-xs">{label}</p>
                      <p className="text-dental-muted">Revenue: <span className="font-bold text-slate-800">{currency(payload[0]?.value)}</span></p>
                      <p className="text-dental-muted">Count: <span className="font-bold text-slate-800">{payload[1]?.value}</span></p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="revenue" name="Revenue" radius={[4,4,0,0]} barSize={28}>
                {procedureData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
};

export default Reports;
