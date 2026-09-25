// 404 for API routes that don't exist
const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler: turns known Mongoose errors into proper 4xx responses
// (Express recognises error handlers by their 4 arguments, so `next` must stay)
const errorHandler = (err, req, res, next) => {
  // Malformed ObjectId, e.g. /api/patients/not-an-id
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  // Schema validation (required fields, enums, min/max)
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ message });
  }

  // Unique index violation, e.g. duplicate email
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ message: `A record with this ${field} already exists` });
  }

  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON in request body" });
  }

  console.error(err);
  return res.status(err.status || 500).json({ message: err.message || "Server error" });
};

module.exports = { notFound, errorHandler };
