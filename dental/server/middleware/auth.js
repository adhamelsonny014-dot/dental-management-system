const jwt = require("jsonwebtoken");
const User = require("../Models/User");

// Read the JWT from the Authorization header (API clients) or the httpOnly cookie (browser).
const readToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.split(" ")[1];
  const cookie = req.headers.cookie;
  if (cookie) {
    const match = cookie.split(";").find((c) => c.trim().startsWith("token="));
    if (match) return decodeURIComponent(match.trim().slice("token=".length));
  }
  return null;
};

const protect = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });

    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }
    next();
  };
};

module.exports = { protect, requireRole };
