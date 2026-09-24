const Patient     = require("../Models/Patient");
const Appointment = require("../Models/Appointment");
const Invoice     = require("../Models/Invoice");
const Payment     = require("../Models/Payment");
const Staff         = require("../Models/Staff");
const TreatmentPlan = require("../Models/TreatmentPlan");
const DentalChart   = require("../Models/DentalChart");

// Utility: build date range from query params (default: last 12 months)
const getDateRange = (req) => {
  const now   = new Date();
  const start = req.query.start
    ? new Date(req.query.start)
    : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const end   = req.query.end ? new Date(req.query.end) : now;
  return { start, end };
};

// GET /api/reports/overview  — single-call dashboard numbers
const overview = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);

    const [
      totalPatients,
      newPatients,
      totalAppointments,
      appointmentsByStatus,
      invoiceSummary,
      paymentTotal,
    ] = await Promise.all([
      Patient.countDocuments({ status: "active" }),
      Patient.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Appointment.countDocuments({ startTime: { $gte: start, $lte: end } }),
      Appointment.aggregate([
        { $match: { startTime: { $gte: start, $lte: end } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { issueDate: { $gte: start, $lte: end } } },
        { $group: {
          _id: null,
          totalInvoiced: { $sum: "$grandTotal" },
          totalInvoices: { $sum: 1 },
          paid:    { $sum: { $cond: [{ $eq: ["$status","paid"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ["$status",["sent","partial","overdue"]] }, 1, 0] } },
        }},
      ]),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const statusMap = Object.fromEntries(appointmentsByStatus.map((s) => [s._id, s.count]));
    const inv       = invoiceSummary[0] || {};
    const noShowRate = totalAppointments > 0
      ? (((statusMap["no-show"] || 0) / totalAppointments) * 100).toFixed(1)
      : "0.0";

    return res.status(200).json({
      totalPatients,
      newPatients,
      totalAppointments,
      completedAppointments: statusMap.completed || 0,
      cancelledAppointments: statusMap.cancelled || 0,
      noShowAppointments:    statusMap["no-show"] || 0,
      noShowRate:            Number(noShowRate),
      totalInvoiced:   inv.totalInvoiced  || 0,
      totalInvoices:   inv.totalInvoices  || 0,
      paidInvoices:    inv.paid           || 0,
      pendingInvoices: inv.pending        || 0,
      totalCollected:  paymentTotal[0]?.total || 0,
      period: { start, end },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/revenue-by-month  — monthly revenue (payments received)
const revenueByMonth = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);

    const data = await Payment.aggregate([
      { $match: { paymentDate: { $gte: start, $lte: end } } },
      { $group: {
        _id: {
          year:  { $year:  "$paymentDate" },
          month: { $month: "$paymentDate" },
        },
        revenue:  { $sum: "$amount" },
        count:    { $sum: 1 },
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Also get invoiced amounts by month
    const invoiced = await Invoice.aggregate([
      { $match: { issueDate: { $gte: start, $lte: end }, status: { $ne: "cancelled" } } },
      { $group: {
        _id: {
          year:  { $year:  "$issueDate" },
          month: { $month: "$issueDate" },
        },
        invoiced: { $sum: "$grandTotal" },
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const invoicedMap = Object.fromEntries(
      invoiced.map((d) => [`${d._id.year}-${d._id.month}`, d.invoiced])
    );

    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const result  = data.map((d) => ({
      month:    MONTHS[d._id.month - 1],
      year:     d._id.year,
      label:    `${MONTHS[d._id.month - 1]} ${d._id.year}`,
      revenue:  Math.round(d.revenue * 100) / 100,
      invoiced: Math.round((invoicedMap[`${d._id.year}-${d._id.month}`] || 0) * 100) / 100,
      payments: d.count,
    }));

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/appointments-by-month
const appointmentsByMonth = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);

    const data = await Appointment.aggregate([
      { $match: { startTime: { $gte: start, $lte: end } } },
      { $group: {
        _id: {
          year:   { $year:  "$startTime" },
          month:  { $month: "$startTime" },
          status: "$status",
        },
        count: { $sum: 1 },
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Pivot into month → { completed, cancelled, noShow, scheduled }
    const pivot = {};
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    data.forEach((d) => {
      const key = `${d._id.year}-${d._id.month}`;
      if (!pivot[key]) pivot[key] = {
        label: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
        month: MONTHS[d._id.month - 1],
        total: 0, completed: 0, cancelled: 0, noShow: 0, scheduled: 0,
      };
      pivot[key].total += d.count;
      if (d._id.status === "completed")  pivot[key].completed  += d.count;
      if (d._id.status === "cancelled")  pivot[key].cancelled  += d.count;
      if (d._id.status === "no-show")    pivot[key].noShow     += d.count;
      if (["scheduled","confirmed","in-progress"].includes(d._id.status))
        pivot[key].scheduled += d.count;
    });

    return res.status(200).json(Object.values(pivot));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/appointments-by-type
const appointmentsByType = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);

    const data = await Appointment.aggregate([
      { $match: { startTime: { $gte: start, $lte: end } } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json(
      data.map((d) => ({
        name:  d._id || "other",
        label: (d._id || "other").replace(/-/g," "),
        value: d.count,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/patients-growth  — new vs returning patients per month
const patientsGrowth = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);

    const data = await Patient.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: {
        _id: {
          year:  { $year:  "$createdAt" },
          month: { $month: "$createdAt" },
        },
        newPatients: { $sum: 1 },
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    let cumulative = await Patient.countDocuments({ createdAt: { $lt: start } });

    const result = data.map((d) => {
      cumulative += d.newPatients;
      return {
        label:      `${MONTHS[d._id.month - 1]} ${d._id.year}`,
        month:      MONTHS[d._id.month - 1],
        newPatients: d.newPatients,
        total:       cumulative,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/revenue-by-dentist
const revenueByDentist = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);

    const data = await Invoice.aggregate([
      { $match: { issueDate: { $gte: start, $lte: end }, status: { $ne: "cancelled" }, dentist: { $exists: true } } },
      { $group: {
        _id:       "$dentist",
        revenue:   { $sum: "$grandTotal" },
        invoices:  { $sum: 1 },
      }},
      { $lookup: { from: "staff", localField: "_id", foreignField: "_id", as: "dentist" } },
      { $unwind: { path: "$dentist", preserveNullAndEmptyArrays: true } },
      { $project: {
        name:     { $concat: ["Dr. ", "$dentist.firstName", " ", "$dentist.lastName"] },
        revenue:  1,
        invoices: 1,
        color:    "$dentist.color",
      }},
      { $sort: { revenue: -1 } },
    ]);

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/payment-methods
const paymentMethods = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);

    const data = await Payment.aggregate([
      { $match: { paymentDate: { $gte: start, $lte: end } } },
      { $group: { _id: "$method", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    return res.status(200).json(
      data.map((d) => ({ name: d._id, label: d._id.replace(/-/g," "), total: d.total, count: d.count }))
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/top-procedures
const topProcedures = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);

    const data = await Invoice.aggregate([
      { $match: { issueDate: { $gte: start, $lte: end }, status: { $ne: "cancelled" } } },
      { $unwind: "$lineItems" },
      { $group: {
        _id:     "$lineItems.description",
        revenue: { $sum: { $multiply: ["$lineItems.quantity", "$lineItems.unitPrice"] } },
        count:   { $sum: "$lineItems.quantity" },
      }},
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json(
      data.map((d) => ({ name: d._id, revenue: d.revenue, count: d.count }))
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/treatment-plans — plans summary for reports page
const treatmentPlansSummary = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);

    const [byStatus, topPlanProcedures, plansCreated] = await Promise.all([
      TreatmentPlan.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      TreatmentPlan.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: "$procedures" },
        { $group: { _id: "$procedures.name", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      TreatmentPlan.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
    const totalCharts = await DentalChart.countDocuments();

    return res.status(200).json({
      totalPlans: plansCreated,
      totalCharts,
      byStatus: statusMap,
      topProcedures: topPlanProcedures.map((p) => ({ name: p._id, count: p.count })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  overview,
  revenueByMonth,
  appointmentsByMonth,
  appointmentsByType,
  patientsGrowth,
  revenueByDentist,
  paymentMethods,
  topProcedures,
  treatmentPlansSummary,
};
