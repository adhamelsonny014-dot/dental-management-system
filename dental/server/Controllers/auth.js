const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const Staff = require("../Models/Staff");
const asyncHandler = require("../utils/asyncHandler");
const { isStrongPassword, PASSWORD_MESSAGE } = require("../utils/password");

const TOKEN_TTL_DAYS = 7;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: `${TOKEN_TTL_DAYS}d`,
    algorithm: "HS256",
  });
};

// Deliver the JWT in an httpOnly cookie so page scripts (and any future XSS)
// can't read the session token. The token is also returned in the body for
// non-browser API clients and tests.
const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

const setAuthCookie = (res, token) => res.cookie("token", token, authCookieOptions);

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
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
  setAuthCookie(res, token);

  // If dentist, attach their staff record ID
  let staffId = null;
  if (user.role === "dentist") {
    const staffRecord = await Staff.findOne({ userId: user._id });
    if (staffRecord) staffId = staffRecord._id;
  }

  return res.status(200).json({ token, user: { ...user.toJSON(), staffId } });
});

// POST /api/auth/logout — clear the session cookie
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", { ...authCookieOptions, maxAge: undefined });
  return res.status(200).json({ message: "Logged out" });
});

// GET /api/auth/me (protected)
const getMe = asyncHandler(async (req, res) => {
  let staffId = null;
  if (req.user.role === "dentist") {
    const staffRecord = await Staff.findOne({ userId: req.user._id });
    if (staffRecord) staffId = staffRecord._id;
  }
  return res.status(200).json({ user: { ...req.user.toJSON(), staffId } });
});

// POST /api/auth/admin/create-account — admin creates doctor/admin accounts
const adminCreateAccount = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  const allowedRoles = ["dentist", "admin", "receptionist", "assistant"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: PASSWORD_MESSAGE });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Email already in use" });
  }

  const user = await User.create({ name, email, password, role });
  return res.status(201).json(user);
});

// GET /api/auth/admin/accounts — list all staff user accounts
const adminListAccounts = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });
  return res.status(200).json(users);
});

// PUT /api/auth/admin/accounts/:id — update account (role, isActive, name, email)
const adminUpdateAccount = asyncHandler(async (req, res) => {
  const { name, email, role, isActive, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) {
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: PASSWORD_MESSAGE });
    }
    user.password = password;
  }

  await user.save();
  const updated = await User.findById(user._id).select("-password");
  return res.status(200).json(updated);
});

// DELETE /api/auth/admin/accounts/:id
const adminDeleteAccount = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.status(200).json({ message: "Account deleted" });
});

module.exports = {
  login,
  logout,
  getMe,
  adminCreateAccount,
  adminListAccounts,
  adminUpdateAccount,
  adminDeleteAccount,
};
