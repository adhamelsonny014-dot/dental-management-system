import { useCallback, useEffect, useState } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

const STATUS_LABEL = {
  pending_admin: "Awaiting admin",
  sent_to_doctor: "With doctor",
  doctor_approved: "Doctor approved",
  reschedule_requested: "Reschedule needed",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const BookingRequests = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignId, setAssignId] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [br, st] = await Promise.all([api.get("/booking-requests"), api.get("/staff")]);
      setItems(br.data);
      setStaff(st.data.filter((s) => s.role === "dentist" && s.isActive));
    } catch {
      toast.error("Could not load booking requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id, path, body = {}) => {
    try {
      await api.patch(`/booking-requests/${id}/${path}`, body);
      toast.success("Updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "receptionist";
  const isDentist = user?.role === "dentist";

  return (
    <div>
      <PageHeader
        title="Online bookings"
        subtitle="Direct doctor bookings and category requests from the public website"
      />

      {loading ? (
        <p className="text-dental-muted text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-dental-muted text-sm card p-6">No booking requests yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((br) => (
            <article key={br._id} className="card p-5">
              <section className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{br.patientName}</h3>
                  <p className="text-sm text-dental-muted">
                    {br.patientEmail} · {br.patientPhone}
                  </p>
                  <p className="text-xs mt-1">
                    <span className="font-medium">{br.flow === "direct" ? "Direct doctor" : "Category"}</span>
                    {br.serviceCategory ? ` · ${br.serviceCategory}` : ""}
                  </p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-sky-100 text-blue-800">
                  {STATUS_LABEL[br.status] || br.status}
                </span>
              </section>

              <p className="text-sm text-slate-700 mb-4">
                {br.slotDate
                  ? `${new Date(br.slotDate).toLocaleDateString()} at ${br.slotStart || "TBD"}`
                  : "Flexible timing"}
                {br.dentist
                  ? ` · Dr. ${br.dentist.firstName} ${br.dentist.lastName}`
                  : br.assignedDentist
                    ? ` · Assigned: Dr. ${br.assignedDentist.firstName} ${br.assignedDentist.lastName}`
                    : ""}
              </p>

              {br.message ? <p className="text-xs text-slate-500 mb-4 italic">{br.message}</p> : null}
{isDentist && br.status === "sent_to_doctor" && (
  <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 font-medium">
    ⏳ Awaiting your response — please approve or request reschedule below
  </div>
)}
{isDentist && br.status === "doctor_approved" && (
  <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded text-xs text-green-800 font-medium">
    ✅ You approved this — admin will confirm with patient
  </div>
)}
{isDentist && br.status === "reschedule_requested" && (
  <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 font-medium">
    🔁 Reschedule requested — waiting for admin to handle
  </div>
)}
              <div className="flex flex-wrap gap-2">
                {isAdmin && br.flow === "category" && br.status === "pending_admin" ? (
                  <>
                    <select
                      className="input max-w-[200px] py-1.5 text-xs"
                      value={assignId[br._id] || ""}
                      onChange={(e) => setAssignId({ ...assignId, [br._id]: e.target.value })}
                    >
                      <option value="">Assign dentist</option>
                      {staff.map((s) => (
                        <option key={s._id} value={s._id}>
                          Dr. {s.firstName} {s.lastName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-primary text-xs py-1.5"
                      disabled={!assignId[br._id]}
                      onClick={() => patch(br._id, "assign", { dentistId: assignId[br._id] })}
                    >
                      Assign
                    </button>
                  </>
                ) : null}

                {isAdmin && ["pending_admin", "reschedule_requested"].includes(br.status) ? (
                  <button
                    type="button"
                    className="btn-primary text-xs py-1.5"
                    onClick={() => patch(br._id, "send-to-doctor")}
                  >
                    Send to doctor
                  </button>
                ) : null}

                {(isDentist || isAdmin) && br.status === "sent_to_doctor" ? (
                  <>
                    <button
                      type="button"
                      className="btn-primary text-xs py-1.5"
                      onClick={() => patch(br._id, "doctor-response", { approved: true })}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs py-1.5 border border-amber-200"
                      onClick={() =>
                        patch(br._id, "doctor-response", {
                          approved: false,
                          note: "Please choose another time",
                        })
                      }
                    >
                      Request reschedule
                    </button>
                  </>
                ) : null}

                {isAdmin && br.status === "doctor_approved" ? (
                  <button
                    type="button"
                    className="btn-primary text-xs py-1.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => patch(br._id, "confirm-patient")}
                  >
                    Confirm &amp; email patient
                  </button>
                ) : null}

                {isAdmin && !["confirmed", "cancelled"].includes(br.status) ? (
                  <button
                    type="button"
                    className="btn-ghost text-xs py-1.5 text-red-600"
                    onClick={() => patch(br._id, "cancel")}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingRequests;
