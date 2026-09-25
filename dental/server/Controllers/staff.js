const Staff = require("../Models/Staff");
const User = require("../Models/User");
const asyncHandler = require("../utils/asyncHandler");
const { FIELDS, pick } = require("../utils/fields");
const { generateTempPassword } = require("../utils/password");

// Staff roles that map directly to a login role; everyone else gets "assistant"
const LOGIN_ROLE = { dentist: "dentist", receptionist: "receptionist" };

// GET /api/staff?role=&active=
const getAllStaff = asyncHandler(async (req, res) => {
  const { role, active } = req.query;
  const query = {};
  if (role) query.role = role;
  if (active !== undefined) query.isActive = active === "true";

  const staff = await Staff.find(query).populate("userId", "name email role isActive").sort({ firstName: 1 });
  return res.status(200).json(staff);
});

const getStaffById = asyncHandler(async (req, res) => {
  const member = await Staff.findById(req.params.id).populate("userId", "name email role");
  if (!member) return res.status(404).json({ message: "Staff member not found" });
  return res.status(200).json(member);
});

const createStaff = asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName)
    return res.status(400).json({ message: "First name and last name are required" });
  const member = await Staff.create(pick(req.body, FIELDS.staff));
  return res.status(201).json(member);
});

const updateStaff = asyncHandler(async (req, res) => {
  const member = await Staff.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS.staff), {
    new: true,
    runValidators: true,
  });
  if (!member) return res.status(404).json({ message: "Staff member not found" });
  return res.status(200).json(member);
});

const deleteStaff = asyncHandler(async (req, res) => {
  const member = await Staff.findByIdAndDelete(req.params.id);
  if (!member) return res.status(404).json({ message: "Staff member not found" });

  // Also delete their login account if they have one
  if (member.userId) {
    await User.findByIdAndDelete(member.userId);
  }

  return res.status(200).json({ message: "Staff member deleted" });
});

// POST /api/staff/:id/create-account — link or create login for dentist/staff
const createStaffAccount = asyncHandler(async (req, res) => {
  const member = await Staff.findById(req.params.id);
  if (!member) return res.status(404).json({ message: "Staff member not found" });
  if (member.userId) {
    return res.status(400).json({ message: "This staff member already has a login account" });
  }
  if (!member.email?.trim()) {
    return res.status(400).json({ message: "Staff email is required to create a login" });
  }

  const role = LOGIN_ROLE[member.role] || "assistant";
  const fullName = `${member.firstName} ${member.lastName}`;

  let user = await User.findOne({ email: member.email });
  let tempPassword = null;
  if (!user) {
    // Use the admin-supplied password, otherwise a random one that is shown once
    tempPassword = req.body.password || generateTempPassword();
    user = await User.create({
      name: role === "dentist" ? `Dr. ${fullName}`.replace(/^Dr\. Dr\./, "Dr.") : fullName,
      email: member.email,
      password: tempPassword,
      role,
    });
  }

  member.userId = user._id;
  await member.save();
  await member.populate("userId", "name email role");

  return res.status(201).json({
    message: tempPassword
      ? "Login account created. Share the email and temporary password with the staff member."
      : "Linked to the existing login account with this email.",
    staff: member,
    login: { email: user.email, role: user.role, tempPassword },
  });
});

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  createStaffAccount,
};
