// Blocks MongoDB operator injection via request input
// (e.g. ?status[$ne]=x or {"email": {"$gt": ""}}).

// Body/params: recurse, dropping keys that start with "$" or contain ".".
const cleanDeep = (value) => {
  if (Array.isArray(value)) return value.map(cleanDeep);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      out[key] = cleanDeep(v);
    }
    return out;
  }
  return value;
};

// Query string: filters are expected to be scalars, so an object value only comes
// from bracket-injection like `status[$ne]=x` — drop those keys entirely.
const cleanQuery = (query) => {
  const out = {};
  for (const [key, v] of Object.entries(query)) {
    if (key.startsWith("$") || key.includes(".")) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) continue;
    out[key] = v;
  }
  return out;
};

const sanitize = (req, res, next) => {
  if (req.body) req.body = cleanDeep(req.body);
  if (req.query) req.query = cleanQuery(req.query); // Express 4: req.query is reassignable
  if (req.params) req.params = cleanDeep(req.params);
  next();
};

module.exports = sanitize;
