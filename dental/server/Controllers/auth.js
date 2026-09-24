const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const Staff = require("../Models/Staff");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const allowedRoles = ["receptionist", "assistant"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(403).json({
        message: "Only receptionist or assistant accounts can be created here. Doctor and admin logins are set up by your clinic administrator.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: allowedRoles.includes(role) ? role : "receptionist",
    });

    const token = generateToken(user._id);
    return res.status(201).json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    // If dentist, attach their staff record ID
    let staffId = null;
    if (user.role === "dentist") {
      const staffRecord = await Staff.findOne({ userId: user._id });
      if (staffRecord) staffId = staffRecord._id;
    }

    return res.status(200).json({ token, user: { ...user.toJSON(), staffId } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me (protected)
const getMe = async (req, res) => {
  let staffId = null;
  if (req.user.role === "dentist") {
    const staffRecord = await Staff.findOne({ userId: req.user._id });
    if (staffRecord) staffId = staffRecord._id;
  }
  return res.status(200).json({ user: { ...req.user.toJSON(), staffId } });
};

module.exports = { register, login, getMe };