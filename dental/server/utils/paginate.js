const MAX_LIMIT = 200;

/**
 * Runs a paginated find. Returns { items, total, page, totalPages }.
 * page/limit usually come straight from req.query, so they are parsed and clamped here.
 */
const paginate = async (Model, query, { page = 1, limit = 20, sort, populate, select } = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const perPage = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || 20));

  let find = Model.find(query)
    .skip((pageNum - 1) * perPage)
    .limit(perPage);
  if (sort) find = find.sort(sort);
  if (populate) find = find.populate(populate);
  if (select) find = find.select(select);

  const [total, items] = await Promise.all([Model.countDocuments(query), find]);
  return { items, total, page: pageNum, totalPages: Math.ceil(total / perPage) };
};

module.exports = { paginate };
