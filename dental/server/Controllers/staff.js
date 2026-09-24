const Staff = require("../Models/Staff");
const User = require("../Models/User");

// GET /api/staff?role=&active=
const getAllStaff = async (req, res) => {
  try {
    const { role, active } = req.query;
    const query = {};
    if (role) query.role = role;
    if (active !== undefined) query.isActive = active === "true";

    const staff = await Staff.find(query)
      .populate("userId", "name email role isActive")
      .sort({ firstName: 1 });
    return res.status(200).json(staff);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getStaffById = async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id).populate("userId", "name email role");
    if (!member) return res.status(404).json({ message: "Staff member not found" });
    return res.status(200).json(member);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createStaff = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName)
      return res.status(400).json({ message: "First name and last name are required" });
    const member = await Staff.create(req.body);
    return res.status(201).json(member);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const member = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ message: "Staff member not found" });
    return res.status(200).json(member);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const member = await Staff.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: "Staff member not found" });

    // Also delete their login account if they have one
    if (member.userId) {
      await User.findByIdAndDelete(member.userId);
    }

    return res.status(200).json({ message: "Staff member deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/staff/:id/create-account — link or create login for dentist/staff
const createStaffAccount = async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Staff member not found" });
    if (member.userId) {
      return res.status(400).json({ message: "This staff member already has a login account" });
    }
    if (!member.email?.trim()) {
      return res.status(400).json({ message: "Staff email is required to create a login" });
    }

    const { password } = req.body;
    const defaultPass = password || process.env.SEED_DOCTOR_PASSWORD || "Doctor123!";
    const role = member.role === "dentist" ? "dentist" : "assistant";

    let user = await User.findOne({ email: member.email });
    if (!user) {
      user = await User.create({
        name: `Dr. ${member.firstName} ${member.lastName}`.replace(/^Dr\. Dr\./, "Dr."),
        email: member.email,
        password: defaultPass,
        role,
      });
    }

    member.userId = user._id;
    await member.save();
    await member.populate("userId", "name email role");

    return res.status(201).json({
      message: "Login account created. Share email and password with the doctor.",
      staff: member,
      login: { email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  createStaffAccount,
};
