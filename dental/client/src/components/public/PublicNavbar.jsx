import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About us" },
  { href: "/#services", label: "Our services" },
];

const PublicNavbar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-clinic-teal/10 bg-clinic-cream/75 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(124,58,237,0.12)]">
      <section className="max-w-6xl mx-auto px-5 sm:px-8 h-[4.25rem] flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-clinic-teal via-clinic-accent to-clinic-violet flex items-center justify-center shadow-md shadow-teal-500/20">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </span>
          <span className="font-display text-lg sm:text-xl font-semibold text-clinic-ink tracking-tight">
            Dental care
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-slate-600 hover:text-clinic-teal transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <section className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate("/register-patient")}
            className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-clinic-teal px-3 py-2 transition-colors"
          >
            Patient register
          </button>
          <button
            type="button"
            onClick={() => navigate("/book")}
            className="hidden sm:inline-flex text-sm font-medium bg-gradient-to-r from-clinic-ink via-clinic-ink to-slate-800 text-clinic-cream px-5 py-2.5 rounded-full shadow-lg shadow-violet-500/15 ring-1 ring-white/10 transition-all hover:shadow-xl hover:shadow-teal-500/20 hover:from-slate-900 hover:to-clinic-teal"
          >
            Book now
          </button>
          <button
            type="button"
            onClick={() => navigate("/login")}
            title="Staff login"
            className="w-9 h-9 rounded-full border border-clinic-border flex items-center justify-center text-clinic-accent hover:bg-clinic-sand transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
          <button
            type="button"
            className="md:hidden p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </section>
      </section>

      {open && (
        <nav className="md:hidden border-t border-clinic-border px-5 py-4 flex flex-col gap-3 bg-clinic-cream">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-slate-700" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/register-patient");
            }}
            className="w-full border border-clinic-border text-slate-700 py-3 rounded-full text-sm font-medium"
          >
            Patient register
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/book");
            }}
            className="w-full bg-clinic-ink text-clinic-cream py-3 rounded-full text-sm font-medium"
          >
            Book now
          </button>
        </nav>
      )}
    </header>
  );
};

export default PublicNavbar;
