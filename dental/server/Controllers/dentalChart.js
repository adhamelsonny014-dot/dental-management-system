const DentalChart = require("../Models/DentalChart");

// GET /api/dental-chart/:patientId  — auto-creates chart if not exists
const getChart = async (req, res) => {
  try {
    let chart = await DentalChart.findOne({ patient: req.params.patientId })
      .populate("patient", "firstName lastName patientNumber")
      .populate("lastUpdatedBy", "name");

    if (!chart) {
      chart = await DentalChart.create({ patient: req.params.patientId });
      await chart.populate("patient", "firstName lastName patientNumber");
    }

    return res.status(200).json(chart);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/dental-chart/:patientId/tooth  — update a single tooth
const updateTooth = async (req, res) => {
  try {
    const { number, condition, surfaces, notes } = req.body;
    if (!number) return res.status(400).json({ message: "Tooth number is required" });

    let chart = await DentalChart.findOne({ patient: req.params.patientId });
    if (!chart) {
      chart = await DentalChart.create({ patient: req.params.patientId });
    }

    const toothIndex = chart.teeth.findIndex((t) => t.number === Number(number));
    if (toothIndex === -1) return res.status(404).json({ message: "Tooth not found" });

    if (condition !== undefined) chart.teeth[toothIndex].condition = condition;
    if (surfaces  !== undefined) chart.teeth[toothIndex].surfaces  = surfaces;
    if (notes     !== undefined) chart.teeth[toothIndex].notes     = notes;
    chart.teeth[toothIndex].updatedAt = new Date();
    chart.lastUpdatedBy = req.user._id;

    chart.markModified("teeth");
    await chart.save();

    return res.status(200).json(chart);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/dental-chart/:patientId/notes  — update general chart notes
const updateNotes = async (req, res) => {
  try {
    const chart = await DentalChart.findOneAndUpdate(
      { patient: req.params.patientId },
      { notes: req.body.notes, lastUpdatedBy: req.user._id },
      { new: true, upsert: true }
    );
    return res.status(200).json(chart);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getChart, updateTooth, updateNotes };
