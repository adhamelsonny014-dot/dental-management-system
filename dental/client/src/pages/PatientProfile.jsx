import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";

const calcAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-dental-border last:border-0">
    <span className="text-xs font-semibold text-dental-muted uppercase tracking-wide w-40 flex-shrink-0 mb-0.5 sm:mb-0">{label}</span>
    <span className="text-sm text-slate-800">{value || <span className="text-slate-400 italic">Not provided</span>}</span>
  </div>
);

const Tag = ({ label }) => (
  <span className="inline-block bg-red-50 text-red-700 border border-red-200 text-xs font-medium px-2 py-0.5 rounded-full mr-1.5 mb-1.5">
    {label}
  </span>
);

const TABS = ["Overview", "Medical history", "Documents"];

const PatientProfile = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("Overview");

  useEffect(() => {
    api.get(`/patients/${id}`)
      .then((r) => setPatient(r.data))
      .catch(() => toast.error("Patient not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="p-8 flex justify-center">
      <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!patient) return (
    <div className="p-8 text-center text-dental-muted">Patient not found.</div>
  );

  const age = calcAge(patient.dateOfBirth);

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="Patient profile"
        subtitle={`#${patient.patientNumber}`}
        action={
          <div className="flex gap-2 flex-wrap">
            <button className="btn-ghost text-sm" onClick={() => navigate("/patients")}>← Back</button>
            <button className="btn-ghost text-sm border border-dental-border" onClick={() => navigate(`/dental-chart/${id}`)}>Dental chart</button>
            <button className="btn-ghost text-sm border border-dental-border" onClick={() => navigate(`/clinical-notes/${id}`)}>Clinical notes</button>
            <button className="btn-ghost text-sm border border-dental-border" onClick={() => navigate(`/treatment-plan/${id}`)}>Treatment plan</button>
            <button className="btn-ghost text-sm border border-dental-border" onClick={() => navigate(`/prescriptions/${id}`)}>Prescriptions</button>
            <button className="btn-ghost text-sm border border-dental-border" onClick={() => navigate(`/invoices?patient=${id}`)}>Invoices</button>
            <button className="btn-primary text-sm" onClick={() => navigate(`/patients/${id}/edit`)}>Edit patient</button>
          </div>
        }
      />

      {/* Hero card */}
      <div className="card p-6 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-display font-bold text-2xl flex-shrink-0">
          {patient.firstName[0]}{patient.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold text-slate-900">
            {patient.firstName} {patient.lastName}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-dental-muted">
            {age && <span>{age} years old</span>}
            {patient.gender && <span className="capitalize">{patient.gender}</span>}
            {patient.bloodType && patient.bloodType !== "unknown" && (
              <span className="font-medium text-slate-700">Blood type: {patient.bloodType}</span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              patient.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}>{patient.status}</span>
          </div>
        </div>
        <div className="text-right text-sm text-dental-muted hidden sm:block">
          <p>Registered</p>
          <p className="font-medium text-slate-700">{new Date(patient.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-dental-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-dental-muted hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-3">Contact information</h3>
            <InfoRow label="Phone"   value={patient.phone} />
            <InfoRow label="Email"   value={patient.email} />
            <InfoRow label="Address" value={patient.address} />
            <InfoRow label="City"    value={patient.city} />
          </div>

          <div className="card p-5">
            <h3 className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-3">Emergency contact</h3>
            <InfoRow label="Name"         value={patient.emergencyContact?.name} />
            <InfoRow label="Relationship" value={patient.emergencyContact?.relationship} />
            <InfoRow label="Phone"        value={patient.emergencyContact?.phone} />
          </div>

          {patient.allergies?.length > 0 && (
            <div className="card p-5 lg:col-span-2">
              <h3 className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-3">Allergies</h3>
              <div className="flex flex-wrap">
                {patient.allergies.map((a) => <Tag key={a} label={a} />)}
              </div>
            </div>
          )}

          {patient.notes && (
            <div className="card p-5 lg:col-span-2">
              <h3 className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-3">Notes</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{patient.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Medical history */}
      {tab === "Medical history" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-3">Basic info</h3>
            <InfoRow label="Blood type"   value={patient.bloodType !== "unknown" ? patient.bloodType : null} />
            <InfoRow label="Date of birth" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : null} />
            <InfoRow label="National ID"  value={patient.nationalId} />
            <InfoRow label="Referred by"  value={patient.referredBy} />
          </div>

          <div className="card p-5">
            <h3 className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-3">Conditions</h3>
            {patient.conditions?.length > 0
              ? patient.conditions.map((c) => (
                  <div key={c} className="flex items-center gap-2 py-1.5 border-b border-dental-border last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{c}</span>
                  </div>
                ))
              : <p className="text-sm text-slate-400 italic">No conditions recorded</p>
            }
          </div>

          <div className="card p-5">
            <h3 className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-3">Current medications</h3>
            {patient.medications?.length > 0
              ? patient.medications.map((m) => (
                  <div key={m} className="flex items-center gap-2 py-1.5 border-b border-dental-border last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{m}</span>
                  </div>
                ))
              : <p className="text-sm text-slate-400 italic">No medications recorded</p>
            }
          </div>

          {patient.medicalNotes && (
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-3">Medical notes</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{patient.medicalNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Documents */}
      {tab === "Documents" && (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-medium text-slate-700">No documents yet</p>
          <p className="text-dental-muted text-sm mt-1">X-rays and imaging uploads will appear here (Week 3)</p>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
