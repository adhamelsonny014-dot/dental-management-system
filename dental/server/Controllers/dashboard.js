const Patient = require("../Models/Patient");
const Appointment = require("../Models/Appointment");
const DentalChart = require("../Models/DentalChart");
const TreatmentPlan = require("../Models/TreatmentPlan");
const BookingRequest = require("../Models/BookingRequest");
const { getDentistPatientIds } = require("../utils/dentistScope");

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const base = {
      totalPatients: await Patient.countDocuments({ status: "active" }),
      totalCharts: await DentalChart.countDocuments(),
      todayAppointments: await Appointment.countDocuments({
        startTime: { $gte: dayStart, $lt: dayEnd },
        status: { $nin: ["cancelled"] },
      }),
      pendingBookings: await BookingRequest.countDocuments({
        status: { $in: ["pending_admin", "sent_to_doctor", "doctor_approved"] },
      }),
      activeTreatmentPlans: await TreatmentPlan.countDocuments({
        status: { $in: ["draft", "proposed", "approved", "in-progress"] },
      }),
    };

    if (req.user.role === "dentist") {
      const { staffId, patientIds } = await getDentistPatientIds(req.user);
      if (!staffId) {
        return res.status(200).json({ ...base, myPatients: 0, myPlans: 0, myTodayAppointments: 0 });
      }

      return res.status(200).json({
        ...base,
        staffId,
        myPatients: patientIds.length,
        myPlans: await TreatmentPlan.countDocuments({ dentist: staffId }),
        myTodayAppointments: await Appointment.countDocuments({
          dentist: staffId,
          startTime: { $gte: dayStart, $lt: dayEnd },
          status: { $nin: ["cancelled"] },
        }),
      });
    }

    return res.status(200).json(base);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
