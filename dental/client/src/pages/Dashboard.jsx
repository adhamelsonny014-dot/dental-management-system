import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const KPICard = ({ label, value, sub, icon, color, loading }) => (
  <article className="card p-5 flex items-start gap-4">
    <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
    </span>
    <section>
      <p className="text-2xl font-display font-bold text-slate-900">
        {loading ? <span className="inline-block w-8 h-6 bg-slate-200 rounded animate-pulse" /> : value}
      </p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
      {sub ? <p className="text-xs text-dental-muted mt-0.5">{sub}</p> : null}
    </section>
  </article>
);

const QuickAction = ({ label, icon, to }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="card p-4 flex flex-col items-center gap-2 hover:border-primary-300 hover:shadow-md transition-all duration-150 cursor-pointer group"
    >
      <span className="w-10 h-10 bg-primary-50 group-hover:bg-primary-100 rounded-xl flex items-center justify-center transition-colors">
        <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </span>
      <span className="text-xs font-medium text-slate-700 text-center leading-tight">{label}</span>
    </button>
  );
};

const STATUS_COLOR = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  "in-progress": "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-600",
  "no-show": "bg-orange-100 text-orange-700",
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [todayAppts, setTodayAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDentist = user?.role === "dentist";

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, aRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/appointments?today=true"),
        ]);
        setStats(statsRes.data);
        setTodayAppts(aRes.data.slice(0, 6));
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const kpis = isDentist
    ? [
        { label: "My patients", value: stats?.myPatients ?? "—", sub: "Under your care", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "bg-blue-500" },
        { label: "My treatment plans", value: stats?.myPlans ?? "—", sub: "Active plans", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "bg-purple-500" },
        { label: "Today's appointments", value: stats?.myTodayAppointments ?? "—", sub: "Your schedule today", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "bg-emerald-500" },
        { label: "Clinic patients", value: stats?.totalPatients ?? "—", sub: `${stats?.totalCharts ?? 0} dental charts`, icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", color: "bg-slate-500" },
      ]
    : [
        { label: "Total patients", value: stats?.totalPatients ?? "—", sub: "Registered in system", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "bg-blue-500" },
        { label: "Dental charts", value: stats?.totalCharts ?? "—", sub: "Charts in database", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "bg-purple-500" },
        { label: "Today's appointments", value: stats?.todayAppointments ?? "—", sub: "All dentists", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "bg-emerald-500" },
        { label: "Pending web bookings", value: stats?.pendingBookings ?? "—", sub: `${stats?.activeTreatmentPlans ?? 0} active treatment plans`, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "bg-amber-500" },
      ];

  const actions = isDentist
    ? [
        { label: "Patients", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", to: "/patients" },
        { label: "Appointments", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", to: "/appointments" },
        { label: "Waiting room", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", to: "/waiting-room" },
      ]
    : [
        { label: "New patient", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z", to: "/patients/new" },
        { label: "Web bookings", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", to: "/booking-requests" },
        { label: "Appointments", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", to: "/appointments" },
        { label: "Reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", to: "/reports" },
      ];

  const fmtTime = (d) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="p-8">
      <header className="mb-8">
        <p className="text-dental-muted text-sm mb-1">{dateStr}</p>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          {greeting}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-dental-muted text-sm mt-1">
          {isDentist ? "Your patients, treatment plans, and schedule at a glance." : "Clinic overview — patients, charts, bookings, and appointments."}
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} loading={loading} />
        ))}
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Quick actions</h2>
        <section className={`grid gap-3 ${isDentist ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
          {actions.map((a) => (
            <QuickAction key={a.label} {...a} />
          ))}
        </section>
      </section>

      <section>
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Today&apos;s appointments</h2>
          <button type="button" onClick={() => navigate("/waiting-room")} className="text-xs text-primary-600 hover:underline">
            View waiting room →
          </button>
        </header>

        {loading ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <article key={i} className="card p-4 h-20 animate-pulse bg-slate-50" />
            ))}
          </section>
        ) : todayAppts.length === 0 ? (
          <article className="card p-8 flex flex-col items-center justify-center text-center">
            <p className="text-slate-700 font-medium">No appointments today</p>
            <button type="button" onClick={() => navigate("/appointments")} className="text-xs text-primary-600 hover:underline mt-1">
              Book one now →
            </button>
          </article>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {todayAppts.map((a) => (
              <article
                key={a._id}
                className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate("/waiting-room")}
              >
                <span className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs flex-shrink-0">
                  {a.patient?.firstName?.[0]}
                  {a.patient?.lastName?.[0]}
                </span>
                <section className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">
                    {a.patient?.firstName} {a.patient?.lastName}
                  </p>
                  <p className="text-xs text-dental-muted">
                    {fmtTime(a.startTime)} · Dr. {a.dentist?.lastName}
                  </p>
                </section>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${STATUS_COLOR[a.status] || "bg-slate-100 text-slate-600"}`}>
                  {a.status?.replace(/-/g, " ")}
                </span>
              </article>
            ))}
          </section>
        )}
      </section>
    </section>
  );
};

export default Dashboard;
