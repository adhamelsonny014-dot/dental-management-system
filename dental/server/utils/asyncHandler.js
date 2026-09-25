/**
 * Wraps an async route handler so any thrown error or rejected promise
 * goes to Express's error middleware (middleware/errorHandler.js)
 * instead of each handler needing its own try/catch.
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
