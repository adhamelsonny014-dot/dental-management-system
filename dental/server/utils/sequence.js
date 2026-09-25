const Counter = require("../Models/Counter");

/**
 * Returns the next number in a sequence, atomically.
 * Unlike countDocuments() + 1, numbers are never reused after a deletion
 * and two requests at the same time can't get the same number.
 *
 * The first time a sequence is used, it starts after the highest number
 * already stored in `field` (e.g. "P00042" -> 42), so existing data keeps working.
 */
const nextSequence = async (name, Model, field) => {
  const exists = await Counter.exists({ _id: name });
  if (!exists) {
    const docs = await Model.find({ [field]: { $exists: true } })
      .select(field)
      .lean();
    const highest = docs.reduce((max, doc) => {
      const match = String(doc[field] || "").match(/(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    try {
      await Counter.updateOne({ _id: name }, { $setOnInsert: { seq: highest } }, { upsert: true });
    } catch (err) {
      if (err.code !== 11000) throw err; // another request created it first
    }
  }

  const counter = await Counter.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { new: true });
  return counter.seq;
};

module.exports = { nextSequence };
