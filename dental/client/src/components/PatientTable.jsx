import { useNavigate } from "react-router-dom";

const calcAge = (dob) => {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

const StatusBadge = ({ status }) => (
  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
    status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-100 text-slate-500"
  }`}>
    {status}
  </span>
);

const PatientTable = ({ patients, onDelete }) => {
  const navigate = useNavigate();

  if (!patients.length) return (
    <div className="card p-12 flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p className="font-medium text-slate-700">No patients found</p>
      <p className="text-dental-muted text-sm mt-1">Try a different search or add a new patient</p>
    </div>
  );

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-dental-border">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Patient</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">ID</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Age</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Phone</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p, i) => (
              <tr
                key={p._id}
                className={`border-b border-dental-border last:border-0 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/40"}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-dental-muted">{p.email || "No email"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-dental-muted font-mono text-xs">{p.patientNumber}</td>
                <td className="px-4 py-3 text-slate-700">{calcAge(p.dateOfBirth)}</td>
                <td className="px-4 py-3 text-slate-700">{p.phone || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/patients/${p._id}`)}
                      className="btn-ghost text-xs px-2 py-1"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/patients/${p._id}/edit`)}
                      className="btn-ghost text-xs px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientTable;
