const Patient = require("../Models/Patient");
const Appointment = require("../Models/Appointment");
const Invoice = require("../Models/Invoice");
const Payment = require("../Models/Payment");
const TreatmentPlan = require("../Models/TreatmentPlan");
const DentalChart = require("../Models/DentalChart");
const asyncHandler = require("../utils/asyncHandler");

// Invoice.grandTotal is a Mongoose virtual (not stored in MongoDB), so aggregations
// must calculate it themselves — same formula as Models/Invoice.js.
const GRAND_TOTAL = {
  $let: {
    vars: {
      subtotal: {
        $sum: {
          $map: {
            input: { $ifNull: ["$lineItems", []] },
            as: "li",
            in: { $multiply: [{ $ifNull: ["$$li.quantity", 1] }, { $ifNull: ["$$li.unitPrice", 0] }] },
          },
        },
      },
    },
    in: {
      $let: {
        vars: {
          net: {
            $subtract: [
              "$$subtotal",
              {
                $cond: [
                  { $eq: ["$discountType", "percent"] },
                  { $divide: [{ $multiply: ["$$subtotal", { $ifNull: ["$discount", 0] }] }, 100] },
                  { $ifNull: ["$discount", 0] },
                ],
              },
            ],
          },
        },
        in: {
          $max: [
            0,
            { $add: ["$$net", { $divide: [{ $multiply: ["$$net", { $ifNull: ["$taxRate", 0] }] }, 100] }] },
          ],
        },
      },
    },
  },
};
const withGrandTotal = { $addFields: { grandTotal: GRAND_TOTAL } };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Utility: build date range from query params (default: last 12 months)
const getDateRange = (req) => {
  const now = new Date();
  const start = req.query.start
    ? new Date(req.query.start)
    : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  // A date-only "end" (e.g. "2026-09-25") parses to midnight, which would drop
  // everything recorded later that same day — extend it to the end of the day.
  let end = now;
  if (req.query.end) {
    end = new Date(req.query.end);
    if (/^\d{4}-\d{2}-\d{2}$/.test(req.query.end)) end.setHours(23, 59, 59, 999);
  }
  return { start, end };
};

// GET /api/reports/overview  — single-call dashboard numbers
const overview = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange(req);

  const [totalPatients, newPatients, totalAppointments, appointmentsByStatus, invoiceSummary, paymentTotal] =
    await Promise.all([
      Patient.countDocuments({ status: "active" }),
      Patient.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Appointment.countDocuments({ startTime: { $gte: start, $lte: end } }),
      Appointment.aggregate([
        { $match: { startTime: { $gte: start, $lte: end } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { issueDate: { $gte: start, $lte: end } } },
        withGrandTotal,
        {
          $group: {
            _id: null,
            totalInvoiced: { $sum: "$grandTotal" },
            totalInvoices: { $sum: 1 },
            paid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $in: ["$status", ["sent", "partial", "overdue"]] }, 1, 0] } },
          },
        },
      ]),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

  const statusMap = Object.fromEntries(appointmentsByStatus.map((s) => [s._id, s.count]));
  const inv = invoiceSummary[0] || {};
  const noShowRate =
    totalAppointments > 0 ? (((statusMap["no-show"] || 0) / totalAppointments) * 100).toFixed(1) : "0.0";

  return res.status(200).json({
    totalPatients,
    newPatients,
    totalAppointments,
    completedAppointments: statusMap.completed || 0,
    cancelledAppointments: statusMap.cancelled || 0,
    noShowAppointments: statusMap["no-show"] || 0,
    noShowRate: Number(noShowRate),
    totalInvoiced: inv.totalInvoiced || 0,
    totalInvoices: inv.totalInvoices || 0,
    paidInvoices: inv.paid || 0,
    pendingInvoices: inv.pending || 0,
    totalCollected: paymentTotal[0]?.total || 0,
    period: { start, end },
  });
});

// GET /api/reports/revenue-by-month  — monthly revenue (payments received)
const revenueByMonth = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange(req);

  const data = await Payment.aggregate([
    { $match: { paymentDate: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          year: { $year: "$paymentDate" },
          month: { $month: "$paymentDate" },
        },
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Also get invoiced amounts by month
  const invoiced = await Invoice.aggregate([
    { $match: { issueDate: { $gte: start, $lte: end }, status: { $ne: "cancelled" } } },
    withGrandTotal,
    {
      $group: {
        _id: {
          year: { $year: "$issueDate" },
          month: { $month: "$issueDate" },
        },
        invoiced: { $sum: "$grandTotal" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const invoicedMap = Object.fromEntries(invoiced.map((d) => [`${d._id.year}-${d._id.month}`, d.invoiced]));

  const result = data.map((d) => ({
    month: MONTHS[d._id.month - 1],
    year: d._id.year,
    label: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
    revenue: Math.round(d.revenue * 100) / 100,
    invoiced: Math.round((invoicedMap[`${d._id.year}-${d._id.month}`] || 0) * 100) / 100,
    payments: d.count,
  }));

  return res.status(200).json(result);
});

// GET /api/reports/appointments-by-month
const appointmentsByMonth = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange(req);

  const data = await Appointment.aggregate([
    { $match: { startTime: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          year: { $year: "$startTime" },
          month: { $month: "$startTime" },
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Pivot into month → { completed, cancelled, noShow, scheduled }
  const pivot = {};

  data.forEach((d) => {
    const key = `${d._id.year}-${d._id.month}`;
    if (!pivot[key])
      pivot[key] = {
        label: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
        month: MONTHS[d._id.month - 1],
        total: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        scheduled: 0,
      };
    pivot[key].total += d.count;
    if (d._id.status === "completed") pivot[key].completed += d.count;
    if (d._id.status === "cancelled") pivot[key].cancelled += d.count;
    if (d._id.status === "no-show") pivot[key].noShow += d.count;
    if (["scheduled", "confirmed", "in-progress"].includes(d._id.status)) pivot[key].scheduled += d.count;
  });

  return res.status(200).json(Object.values(pivot));
});

// GET /api/reports/appointments-by-type
const appointmentsByType = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange(req);

  const data = await Appointment.aggregate([
    { $match: { startTime: { $gte: start, $lte: end } } },
    { $group: { _id: "$type", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return res.status(200).json(
    data.map((d) => ({
      name: d._id || "other",
      label: (d._id || "other").replace(/-/g, " "),
      value: d.count,
    })),
  );
});

// GET /api/reports/patients-growth  — new vs returning patients per month
const patientsGrowth = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange(req);

  const data = await Patient.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        newPatients: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  let cumulative = await Patient.countDocuments({ createdAt: { $lt: start } });

  const result = data.map((d) => {
    cumulative += d.newPatients;
    return {
      label: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
      month: MONTHS[d._id.month - 1],
      newPatients: d.newPatients,
      total: cumulative,
    };
  });

  return res.status(200).json(result);
});

// GET /api/reports/revenue-by-dentist
const revenueByDentist = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange(req);

  const data = await Invoice.aggregate([
    {
      $match: {
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "cancelled" },
        dentist: { $exists: true },
      },
    },
    withGrandTotal,
    {
      $group: {
        _id: "$dentist",
        revenue: { $sum: "$grandTotal" },
        invoices: { $sum: 1 },
      },
    },
    { $lookup: { from: "staff", localField: "_id", foreignField: "_id", as: "dentist" } },
    { $unwind: { path: "$dentist", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $concat: ["Dr. ", "$dentist.firstName", " ", "$dentist.lastName"] },
        revenue: 1,
        invoices: 1,
        color: "$dentist.color",
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  return res.status(200).json(data);
});

// GET /api/reports/payment-methods
const paymentMethods = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange(req);

  const data = await Payment.aggregate([
    { $match: { paymentDate: { $gte: start, $lte: end } } },
    { $group: { _id: "$method", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  return res
    .status(200)
    .json(
      data.map((d) => ({ name: d._id, label: d._id.replace(/-/g, " "), total: d.total, count: d.count })),
    );
});

// GET /api/reports/top-procedures
const topProcedures = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange(req);

  const data = await Invoice.aggregate([
    { $match: { issueDate: { $gte: start, $lte: end }, status: { $ne: "cancelled" } } },
    { $unwind: "$lineItems" },
    {
      $group: {
        _id: "$lineItems.description",
        revenue: { $sum: { $multiply: ["$lineItems.quantity", "$lineItems.unitPrice"] } },
        count: { $sum: "$lineItems.quantity" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);

  return res.status(200).json(data.map((d) => ({ name: d._id, revenue: d.revenue, count: d.count })));
});

// GET /api/reports/treatment-plans — plans summary for reports page
const treatmentPlansSummary = asyncHandler(async (req, res) => {
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
});

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
