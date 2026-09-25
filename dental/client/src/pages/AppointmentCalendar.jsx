import { useState, useEffect, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../utils/api";
import useDentists from "../hooks/useDentists";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import BookAppointmentModal from "../components/BookAppointmentModal";
import AppointmentDetailModal from "../components/AppointmentDetailModal";

const STATUS_COLOR = {
  scheduled: "#3b82f6",
  confirmed: "#10b981",
  "in-progress": "#f59e0b",
  completed: "#64748b",
  cancelled: "#ef4444",
  "no-show": "#f97316",
};

const apptToEvent = (appt) => ({
  id: appt._id,
  title: `${appt.patient?.firstName || "?"} ${appt.patient?.lastName || ""}`,
  start: appt.startTime,
  end: appt.endTime,
  backgroundColor: appt.dentist?.color || STATUS_COLOR[appt.status] || "#3b82f6",
  borderColor: appt.dentist?.color || STATUS_COLOR[appt.status] || "#3b82f6",
  extendedProps: { appointment: appt },
});

const AppointmentCalendar = () => {
  const calRef = useRef(null);
  const { user } = useAuth();
  const isDentist = user?.role === "dentist";

  const [appointments, setAppointments] = useState([]);
  const staff = useDentists({ activeOnly: true });
  const [loading, setLoading] = useState(true);
  const [dentistFilter, setDentistFilter] = useState("");
  const [bookModal, setBookModal] = useState(null);
  const [detailAppt, setDetailAppt] = useState(null);

  const fetchAppointments = useCallback(
    async (fetchInfo) => {
      try {
        const start = fetchInfo?.startStr || new Date(Date.now() - 30 * 86400000).toISOString();
        const end = fetchInfo?.endStr || new Date(Date.now() + 60 * 86400000).toISOString();
        const params = new URLSearchParams({ start, end });

        if (isDentist && user?.staffId) {
          params.set("dentist", user.staffId);
        } else if (dentistFilter) {
          params.set("dentist", dentistFilter);
        }

        const res = await api.get(`/appointments?${params}`);
        setAppointments(res.data);
      } catch {
        toast.error("Failed to load appointments");
      } finally {
        setLoading(false);
      }
    },
    [isDentist, user?.staffId, dentistFilter],
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const events = appointments
    .filter((a) => !dentistFilter || a.dentist?._id === dentistFilter)
    .map(apptToEvent);

  const handleDateClick = (info) => {
    setBookModal({ start: info.date, dentistId: dentistFilter || "" });
  };

  const handleEventClick = (info) => {
    setDetailAppt(info.event.extendedProps.appointment);
  };

  const handleBooked = (appt) => {
    setAppointments((prev) => [...prev, appt]);
  };

  const handleUpdated = (updated) => {
    setAppointments((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
  };

  const handleDeleted = (id) => {
    setAppointments((prev) => prev.filter((a) => a._id !== id));
  };

  return (
    <div className="p-8 flex flex-col h-full">
      <PageHeader
        title="Appointments"
        subtitle="Click any time slot to book a new appointment"
        action={
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setBookModal({ start: new Date(), dentistId: dentistFilter || "" })}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New appointment
          </button>
        }
      />

      {/* Dentist filter — only admin/receptionist sees this */}
      {!isDentist && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setDentistFilter("")}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              !dentistFilter
                ? "bg-primary-600 text-white border-primary-600"
                : "border-dental-border text-dental-muted hover:border-primary-300"
            }`}
          >
            All dentists
          </button>
          {staff.map((s) => (
            <button
              key={s._id}
              onClick={() => setDentistFilter(s._id)}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                dentistFilter === s._id
                  ? "text-white border-transparent"
                  : "border-dental-border text-dental-muted hover:border-primary-300"
              }`}
              style={dentistFilter === s._id ? { background: s.color, borderColor: s.color } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              Dr. {s.lastName}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {Object.entries(STATUS_COLOR).map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-dental-muted capitalize">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {label.replace("-", " ")}
          </span>
        ))}
      </div>

      {/* Calendar */}
      <div className="card p-4 flex-1 min-h-0 [&_.fc]:h-full [&_.fc-toolbar-title]:font-display [&_.fc-toolbar-title]:font-bold [&_.fc-toolbar-title]:text-slate-900 [&_.fc-button]:!bg-white [&_.fc-button]:!border-dental-border [&_.fc-button]:!text-slate-600 [&_.fc-button]:!shadow-none [&_.fc-button:hover]:!bg-slate-50 [&_.fc-button-active]:!bg-primary-600 [&_.fc-button-active]:!text-white [&_.fc-button-active]:!border-primary-600 [&_.fc-today-button]:!bg-primary-600 [&_.fc-today-button]:!text-white [&_.fc-today-button]:!border-primary-600 [&_.fc-col-header-cell-cushion]:font-medium [&_.fc-col-header-cell-cushion]:text-slate-600 [&_.fc-daygrid-day-number]:text-slate-600 [&_.fc-event]:cursor-pointer [&_.fc-event]:rounded [&_.fc-timegrid-slot]:h-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            editable={false}
            selectable={true}
            allDaySlot={false}
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            height="auto"
            nowIndicator={true}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false }}
            datesSet={fetchAppointments}
            eventContent={(info) => (
              <div className="px-1 py-0.5 overflow-hidden">
                <p className="text-xs font-semibold truncate leading-tight">{info.event.title}</p>
                <p className="text-xs opacity-80 truncate leading-tight capitalize">
                  {info.event.extendedProps.appointment?.type?.replace("-", " ")}
                </p>
              </div>
            )}
          />
        )}
      </div>

      {bookModal && (
        <BookAppointmentModal
          defaultStart={bookModal.start}
          defaultDentistId={bookModal.dentistId}
          onClose={() => setBookModal(null)}
          onBooked={handleBooked}
        />
      )}

      {detailAppt && (
        <AppointmentDetailModal
          appointment={detailAppt}
          onClose={() => setDetailAppt(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};

export default AppointmentCalendar;
