import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const NAV = [
  {
    group: "Main",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      },
      {
        to: "/patients",
        label: "Patients",
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      },
    ],
  },
  {
    group: "Clinic",
    items: [
      {
        to: "/appointments",
        label: "Appointments",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      },
      {
        to: "/booking-requests",
        label: "Web bookings",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
        roles: ["admin", "receptionist", "dentist"],
      },
      {
        to: "/staff",
        label: "Staff",
        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        roles: ["admin"],
      },
      { to: "/waiting-room", label: "Waiting Room", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      {
        to: "/notifications",
        label: "Notifications",
        icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
      },
    ],
  },
  {
    group: "Clinical",
    items: [
      {
        to: "/patients",
        label: "Dental Charts",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      },
    ],
  },
  {
    group: "Billing",
    items: [
      {
        to: "/invoices",
        label: "Invoices",
        icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
        roles: ["admin", "receptionist"],
      },
      {
        to: "/payments",
        label: "Payments",
        icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
        roles: ["admin", "receptionist"],
      },
    ],
  },
  {
    group: "Analytics",
    items: [
      {
        to: "/reports",
        label: "Reports",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        roles: ["admin", "receptionist"],
      },
    ],
  },
  {
    group: "System",
    items: [
      {
        to: "/settings",
        label: "Settings",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        roles: ["admin"],
      },
      {
        to: "/doctor-accounts",
        label: "Login Accounts",
        icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
        roles: ["admin"],
      },
    ],
  },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const roleColor = {
    admin: "bg-purple-100 text-purple-700",
    dentist: "bg-blue-100 text-blue-700",
    receptionist: "bg-green-100 text-green-700",
    assistant: "bg-amber-100 text-amber-700",
  };

  const visibleNav = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(user?.role)),
  })).filter((g) => g.items.length > 0);

  return (
    <aside className="w-60 min-h-screen bg-dental-sidebar flex flex-col">
      <header className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <span className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </span>
        <span className="text-white font-display text-base font-semibold">DentalCare</span>
      </header>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {visibleNav.map((group) => (
          <section key={group.group}>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 mb-1">
              {group.group}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100 mb-0.5 ` +
                  (isActive
                    ? "bg-primary-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/10")
                }
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
                </svg>
                {item.label}
              </NavLink>
            ))}
          </section>
        ))}
      </nav>

      <footer className="px-3 py-4 border-t border-white/10">
        <section className="flex items-center gap-3 px-3 py-2 mb-1">
          <span className="w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center text-primary-400 text-sm font-semibold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
          <section className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColor[user?.role] || "bg-slate-700 text-slate-300"}`}
            >
              {user?.role}
            </span>
          </section>
        </section>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/10 w-full transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Log out
        </button>
      </footer>
    </aside>
  );
};

export default Sidebar;
